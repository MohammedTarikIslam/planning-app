function updateCosts() {
  const accommodationcost = parseFloat(document.getElementById("accommodationcost").value) || 0;
  const travelcost = parseFloat(document.getElementById("travelcost").value) || 0;
  const activitiescost = parseFloat(document.getElementById("activitiescost").value) || 0;
  const numberofpeople = parseInt(document.getElementById("numberofpeople").value, 10) || 1;
  
  const total = travelcost + accommodationcost + activitiescost;
  const split = total / numberofpeople;
  
  document.getElementById("total").textContent = total.toFixed(2);
  document.getElementById("split").textContent = split.toFixed(2);
}

function attachCostListeners() { 
  ["accommodationcost", "travelcost", "activitiescost", "numberofpeople"].forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
          element.addEventListener("input", updateCosts);
        }
      }
    );
}

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
  
  document.getElementById("accommodationcost").value = data.accommodationcost || "0";
  document.getElementById("travelcost").value = data.travelcost || "0";
  document.getElementById("activitiescost").value = data.activitiescost || "0";
  document.getElementById("numberofpeople").value = data.numberofpeople || "1";
  
  document.getElementById("test").textContent = data.test || "";
  document.getElementById("traveldesc").textContent = data.traveldesc || "";
  document.getElementById("hoteldesc").textContent = data.hoteldesc || "";
  document.getElementById("fooddesc").textContent = data.fooddesc || "";
  document.getElementById("activitiesdesc").textContent = data.activitiesdesc || "";
  
  updateCosts();
}

async function saveData() {
  const test = document.getElementById("test").textContent.trim();
  
  const accommodationcost = document.getElementById("accommodationcost").value;
  const travelcost = document.getElementById("travelcost").value;
  const activitiescost = document.getElementById("activitiescost").value;
  const numberofpeople = document.getElementById("numberofpeople").value;
  const traveldesc = document.getElementById("traveldesc").textContent.trim();
  const hoteldesc = document.getElementById("hoteldesc").textContent.trim();
  const fooddesc = document.getElementById("fooddesc").textContent.trim();
  const activitiesdesc = document.getElementById("activitiesdesc").textContent.trim();

  const data = {
    test,
    accommodationcost,
    travelcost,
    activitiescost,
    numberofpeople,

    traveldesc,
    hoteldesc,
    fooddesc,
    activitiesdesc,
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

  // const signInDiv = document.getElementById("clerk-sign-in");
  // const userButtonDiv = document.getElementById("clerk-user-button");
  
  window.saveData = saveData;
  attachCostListeners();
  updateCosts();

  if (clerkInstance.isSignedIn) {
    appDiv.innerHTML = '<div id="user-button"></div>';
    appContent.style.display = "block";

    clerkInstance.mountUserButton(document.getElementById("user-button"));
    await loadData();
  } else {
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