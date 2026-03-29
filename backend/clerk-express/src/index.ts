import 'dotenv/config'
import path from 'path'
import express from 'express'
import { clerkMiddleware, clerkClient, requireAuth, getAuth } from '@clerk/express'
import db from './db.js'

const app = express()
const PORT = 3000
const publicPath = path.join(process.cwd(), "public");

app.use(express.json());
app.use(clerkMiddleware())
app.use(express.static(publicPath));

console.log("PUBLISHABLE:", process.env.CLERK_PUBLISHABLE_KEY);
console.log("SECRET:", process.env.CLERK_SECRET_KEY ? "loaded" : "missing");
  
// This is the default route that gives the home page
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/public", (req, res) => {
  res.json({ message: "This is a public route" });
});

app.get("/api/protected", requireAuth({ signInUrl: "/sign-in" }), async(req, res) => {
  const { userId } = getAuth(req);
  const user = await clerkClient.users.getUser(userId);

  // res.json({
  //   message: "You are signed in",
  //   userId: auth.userId,
  // });
  return res.json({ user })
});

app.get("/api/check-auth", (req, res) => {
  const auth = getAuth(req);
  res.json({
    userId: auth.userId ?? null,
    sessionId: auth.sessionId ?? null,
  });
});

//load function
app.get("/api/plans/me", requireAuth(), (req, res) => {
  try{
  
    // const auth = getAuth(req);
    // const userId = auth.userId;
    
    const {userId} = getAuth(req);

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
      activitiesDescription
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

//save function
app.post("/api/plans/save", requireAuth(), (req, res) => {
  try{
    // const auth = getAuth(req);
    // const userId = auth.userId;
    
    const {userId} = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
      
      
    const {
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
    } = req.body;
    
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
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
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
      updated_at = CURRENT_TIMESTAMP
      `);
      
    stmt.run(
      userId,
      Number(hotelCost) || 0,
      Number(flightCost) || 0,
      Number(activitiesCost) || 0,
      Number(numberOfPeople) || 1,
      departureReference ?? "",
      returnReference ?? "",
      flightDate ?? "",
      flightTime ?? "",
      returnDate ?? "",
      returnTime ?? "",
      flightsDescription ?? "",
      hotelName ?? "",
      checkInDate ?? "",
      checkOutDate ?? "",
      hotelDescription ?? "",
      foodDescription ?? "",
      activitiesDescription ?? ""
    );
      
    return res.json({ ok: true });
  } 
  catch (error) {
    console.error("Error saving plan:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
  
  
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})