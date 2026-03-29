import 'dotenv/config';
import path from 'path';
import express from 'express';
import { clerkMiddleware, clerkClient, requireAuth, getAuth } from '@clerk/express';
import db from './db.js';
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const publicPath = path.join(process.cwd(), "public");
// Register middleware for JSON request bodies, Clerk authentication, and static frontend files
app.use(express.json());
app.use(clerkMiddleware());
app.use(express.static(publicPath));
console.log("PUBLISHABLE:", process.env.CLERK_PUBLISHABLE_KEY);
console.log("SECRET:", process.env.CLERK_SECRET_KEY ? "loaded" : "missing");
// Serve the main frontend page from the public folder
app.get("/", (req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
});
// A simple health check route to verify the server is running
app.get("/api/health", (req, res) => {
    res.json({ ok: true });
});
app.get("/api/public", (req, res) => {
    res.json({ message: "This is a public route" });
});
app.get("/api/protected", requireAuth({ signInUrl: "/" }), async (req, res) => {
    const { userId } = getAuth(req);
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await clerkClient.users.getUser(userId);
    return res.json({ user });
});
// A route to check the authentication status of the user
app.get("/api/check-auth", (req, res) => {
    const auth = getAuth(req);
    res.json({
        userId: auth.userId ?? null,
        sessionId: auth.sessionId ?? null,
    });
});
// Converts Open-meteo weather codes into short descriptions
function getWeatherText(code) {
    if (code === 0)
        return "Clear sky";
    if ([1, 2, 3].includes(code))
        return "Partly cloudy";
    if ([45, 48].includes(code))
        return "Fog";
    if ([51, 53, 55].includes(code))
        return "Drizzle";
    if ([61, 63, 65].includes(code))
        return "Rain";
    if ([71, 73, 75].includes(code))
        return "Snow";
    if (code === 95)
        return "Thunderstorm";
    return "Unknown";
}
// Returns the current signed-in user's saved plan data from the database.
app.get("/api/plans/me", (req, res) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const stmt = db.prepare(`
      SELECT
      hotelCost,
      flightCost,
      activitiesCost,
      numberOfPeople,
      departureReference,
      returnReference,
      flightDate,
      flightTime,
      returnDate,
      returnTime,
      flightsDescription,
      hotelName,
      checkInDate,
      checkOutDate,
      hotelDescription,
      foodDescription,
      activitiesDescription,
      location
      FROM plans
      WHERE user_id = ?
      `);
        const plan = stmt.get(userId);
        if (!plan) {
            return res.json(null);
        }
        return res.json(plan);
    }
    catch (error) {
        console.error("Error fetching plan:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Saves a plan for the signed-in user, updating the existing row if one already exists
app.post("/api/plans/save", (req, res) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { hotelCost, flightCost, activitiesCost, numberOfPeople, departureReference, returnReference, flightDate, flightTime, returnDate, returnTime, flightsDescription, hotelName, checkInDate, checkOutDate, hotelDescription, foodDescription, activitiesDescription, location } = req.body;
        const stmt = db.prepare(`
      INSERT INTO plans (
        user_id,
        hotelCost,
        flightCost,
        activitiesCost,
        numberOfPeople,
        departureReference,
        returnReference,
        flightDate,
        flightTime,
        returnDate,
        returnTime,
        flightsDescription,
        hotelName,
        checkInDate,
        checkOutDate,
        hotelDescription,
        foodDescription,
        activitiesDescription,
        location,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
      hotelCost = excluded.hotelCost,
      flightCost = excluded.flightCost,
      activitiesCost = excluded.activitiesCost,
      numberOfPeople = excluded.numberOfPeople,
      departureReference = excluded.departureReference,
      returnReference = excluded.returnReference,
      flightDate = excluded.flightDate,
      flightTime = excluded.flightTime,
      returnDate = excluded.returnDate,
      returnTime = excluded.returnTime,
      flightsDescription = excluded.flightsDescription,
      hotelName = excluded.hotelName,
      checkInDate = excluded.checkInDate,
      checkOutDate = excluded.checkOutDate,
      hotelDescription = excluded.hotelDescription,
      foodDescription = excluded.foodDescription,
      activitiesDescription = excluded.activitiesDescription,
      location = excluded.location,
      updated_at = CURRENT_TIMESTAMP
      `);
        stmt.run(userId, Number(hotelCost) || 0, Number(flightCost) || 0, Number(activitiesCost) || 0, Number(numberOfPeople) || 1, departureReference ?? "", returnReference ?? "", flightDate ?? "", flightTime ?? "", returnDate ?? "", returnTime ?? "", flightsDescription ?? "", hotelName ?? "", checkInDate ?? "", checkOutDate ?? "", hotelDescription ?? "", foodDescription ?? "", activitiesDescription ?? "", location ?? "");
        return res.json({ ok: true });
    }
    catch (error) {
        console.error("Error saving plan:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Retrieves weather data by first geocoding the destination name and then requesting a forecast for the trip dates
app.get("/api/weather", async (req, res) => {
    try {
        const { location, departure, returnDate } = req.query;
        // Stop early if the frontend has not provided enough information to request a forecast
        if (!location || !departure || !returnDate) {
            return res.status(400).json({ error: "Missing parameters" });
        }
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(String(location))}&count=1`);
        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) {
            return res.json({ forecastAvailable: false, message: "Location not found" });
        }
        const place = geoData.results[0];
        const lat = place.latitude;
        const lon = place.longitude;
        const today = new Date();
        const depDate = new Date(departure);
        const diffDays = Math.ceil((depDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        // Open-Meteo only provides a limited forecast window so future trips beyond that range are rejected
        if (diffDays > 16) {
            return res.json({
                forecastAvailable: false,
                message: "Forecast not available yet"
            });
        }
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${departure}&end_date=${returnDate}`);
        const weatherData = await weatherRes.json();
        const daily = weatherData.daily;
        if (!daily || !daily.time || daily.time.length === 0) {
            return res.json({
                forecastAvailable: false,
                message: "Weather data unavailable"
            });
        }
        const firstIndex = 0;
        const lastIndex = daily.time.length - 1;
        // Extract the first and last forecast day
        const departureWeather = {
            date: daily.time[firstIndex],
            max: daily.temperature_2m_max[firstIndex],
            min: daily.temperature_2m_min[firstIndex],
            rain: daily.precipitation_probability_max[firstIndex],
            condition: getWeatherText(daily.weather_code[firstIndex])
        };
        const returnWeather = {
            date: daily.time[lastIndex],
            max: daily.temperature_2m_max[lastIndex],
            min: daily.temperature_2m_min[lastIndex],
            rain: daily.precipitation_probability_max[lastIndex],
            condition: getWeatherText(daily.weather_code[lastIndex])
        };
        return res.json({
            forecastAvailable: true,
            location: place.name,
            country: place.country,
            departureWeather,
            returnWeather
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Weather fetch failed" });
    }
});
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map