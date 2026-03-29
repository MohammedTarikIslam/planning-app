// Recalculates the total trip cost and the per person split whenever a cost input changes
function updateCosts() {
  const hotelCost = parseFloat(document.getElementById("cost-hotel").value) || 0;
  const flightCost = parseFloat(document.getElementById("cost-flight").value) || 0;
  const activitiesCost = parseFloat(document.getElementById("cost-activities").value) || 0;
  const numberOfPeople = parseInt(document.getElementById("number-of-people").value, 10) || 1;
  
  const total = flightCost + hotelCost + activitiesCost;
  const split = total / numberOfPeople;
  
  document.getElementById("total").textContent = total.toFixed(2);
  document.getElementById("split").textContent = split.toFixed(2);
}

// Attaches input listeners so the cost summary updates in real time without reloading the page
function attachCostListeners() { 
  ["cost-hotel", "cost-flight", "cost-activities", "number-of-people"].forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
          element.addEventListener("input", updateCosts);
        }
      }
    );
}

document.getElementById("location").addEventListener("input", loadWeather);
document.getElementById("flight-date").addEventListener("change", loadWeather);
document.getElementById("return-date").addEventListener("change", loadWeather);

// Loads the signed-in user's saved plan from the backend and fills in the cards
async function loadData() {
  const response = await fetch("/api/plans/me");
  
  if (response.status === 401) {
    updateCosts();
    return;
  }
  
  if (!response.ok) {
    alert("Could not load saved data.");
    updateCosts();
    return;
  }
  
  const data = await response.json();

  if (!data) {
    updateCosts();
    return;
  }
  
  // Restore saved values
  document.getElementById("cost-hotel").value = data.hotelCost || "0";
  document.getElementById("cost-flight").value = data.flightCost || "0";
  document.getElementById("cost-activities").value = data.activitiesCost || "0";
  document.getElementById("number-of-people").value = data.numberOfPeople || "1";

  document.getElementById("flights-description").textContent = data.flightsDescription || "";
  document.getElementById("departure-reference").value = data.departureReference || "";
  document.getElementById("return-reference").value = data.returnReference || "";
  document.getElementById("flight-date").value = data.flightDate || "";
  document.getElementById("flight-time").value = data.flightTime || "";
  document.getElementById("return-date").value = data.returnDate || "";
  document.getElementById("return-time").value = data.returnTime || "";

  document.getElementById("hotel-name").value = data.hotelName || "";
  document.getElementById("hotel-description").textContent = data.hotelDescription || "";
  document.getElementById("check-in-date").value = data.checkInDate || "";
  document.getElementById("check-out-date").value = data.checkOutDate || "";
  
  document.getElementById("food-description").textContent = data.foodDescription || "";
  document.getElementById("activities-description").textContent = data.activitiesDescription || "";
  document.getElementById("location").value = data.location || "";
  
  loadWeather();
  updateCosts();
}

// Collects the current values and sends them to the backend to be inserted in SQLite
async function saveData() {
  const hotelCost = document.getElementById("cost-hotel").value;
  const flightCost = document.getElementById("cost-flight").value;
  const activitiesCost = document.getElementById("cost-activities").value;
  const numberOfPeople = document.getElementById("number-of-people").value;

  const departureReference = document.getElementById("departure-reference").value;
  const returnReference = document.getElementById("return-reference").value;
  const flightDate = document.getElementById("flight-date").value;
  const flightTime = document.getElementById("flight-time").value;
  const returnDate = document.getElementById("return-date").value;
  const returnTime = document.getElementById("return-time").value;
  const flightsDescription = document.getElementById("flights-description").textContent.trim();

  const hotelName = document.getElementById("hotel-name").value;
  const hotelDescription = document.getElementById("hotel-description").textContent.trim();
  const checkInDate = document.getElementById("check-in-date").value;
  const checkOutDate = document.getElementById("check-out-date").value;

  const foodDescription = document.getElementById("food-description").textContent.trim();
  const activitiesDescription = document.getElementById("activities-description").textContent.trim();
  const location = document.getElementById("location").value;

  const data = {
    hotelCost,
    flightCost,
    activitiesCost,
    numberOfPeople,

    flightsDescription,
    departureReference,
    returnReference,
    flightDate,
    flightTime,
    returnDate,
    returnTime,
    
    hotelName,
    hotelDescription,
    checkInDate,
    checkOutDate,
    
    foodDescription,
    activitiesDescription,
    location,
  };

  const response = await fetch("/api/plans/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    alert("Save failed.");
    return;
  }

  alert("Saved.");
}

// Requests weather data when a location and both travel dates are available
async function loadWeather() {
  const location = document.getElementById("location").value;
  const departure = document.getElementById("flight-date").value;
  const returnDate = document.getElementById("return-date").value;

  const status = document.getElementById("weather-status");
  const output = document.getElementById("weather-output");

  if (!location || !departure || !returnDate) {
    status.textContent = "Enter location and dates";
    output.innerHTML = "";
    return;
  }

  try {
    status.textContent = "Loading...";
    output.innerHTML = "";

    const res = await fetch(
      `/api/weather?location=${encodeURIComponent(location)}&departure=${departure}&returnDate=${returnDate}`
    );

    const data = await res.json();

    if (!data.forecastAvailable) {
      status.textContent = data.message;
      return;
    }

    status.textContent = `${data.location}, ${data.country}`;

    // Display a simple summary for the departure and return forecast returned by the API
    output.innerHTML = `
      <div>
        <strong>Departure (${data.departureWeather.date})</strong><br>
        ${data.departureWeather.condition}<br>
        ${data.departureWeather.max}° / ${data.departureWeather.min}°<br>
        Rain: ${data.departureWeather.rain}%
      </div>

      <div>
        <strong>Return (${data.returnWeather.date})</strong><br>
        ${data.returnWeather.condition}<br>
        ${data.returnWeather.max}° / ${data.returnWeather.min}°<br>
        Rain: ${data.returnWeather.rain}%
      </div>
    `;

  } catch (err) {
    status.textContent = "Could not load weather";
  }
}

// Initialises Clerk authentication and decides whether to show the sign-in screen or the main app
async function startApp() {
  const clerkInstance = window.Clerk;
  if (!clerkInstance) {
    throw new Error("Clerk did not load from the script tag.");
  }

  await clerkInstance.load({
    publishableKey: "pk_test_Y2FwYWJsZS1tb3NxdWl0by0xOC5jbGVyay5hY2NvdW50cy5kZXYk",
    ui: {
      ClerkUI: window.__internal_ClerkUICtor,
    },
  });

  const appDiv = document.getElementById("app");
  const appContent = document.getElementById("app-content");
  
  if (!appDiv) {
    throw new Error('Missing <div id="app"></div> in index.html');
  }
  
  if (!appContent) {
    throw new Error('Missing <div id="app-content"></div> in index.html');
  }
  
  window.saveData = saveData;
  attachCostListeners();
  updateCosts();

  // Signed-in users see the planner but signed-out users see the Clerk sign-in component
  if (clerkInstance.isSignedIn) {
    appDiv.innerHTML = "";
    appDiv.style.display = "none";
    appContent.style.display = "block";

    clerkInstance.mountUserButton(document.getElementById("user-button-slot"));
    await loadData();
  } else {
    appDiv.style.display = "flex";
    appDiv.innerHTML = `<div id="sign-in"></div>`;
    appContent.style.display = "none";
    
    clerkInstance.mountSignIn(document.getElementById("sign-in"), {
      forceRedirectUrl: "/",
      fallbackRedirectUrl: "/"
    });
  }
}

window.addEventListener("load", () => {
  startApp().catch((error) => {
    console.error(error);
    alert("App failed to start. Check the browser console.");
  });
});