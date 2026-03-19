function addHoliday() {

  const input = document.getElementById("holidayInput").value;
  document.getElementById("display").innerText = input;

}

function saveData() {
  const test = document.getElementById("test").textContent.trim();
  const holidayInput = document.getElementById("holidayInput").value;
  const accommodation = document.getElementById("accommodation").value;
  const travel = document.getElementById("travel").value;
  const activities = document.getElementById("activities").value;
  const numberofpeople = document.getElementById("numberofpeople").value;

  const data = {
        test: test,
        holidayInput: holidayInput,
        accommodation: accommodation,
        travel: travel,
        activities: activities,
        numberofpeople : numberofpeople,
    };

  localStorage.setItem("planningAppData", JSON.stringify(data));
  console.log("Data saved: ", data)
}

function updateCosts() {
    const accommodation = parseFloat(document.getElementById("accommodation").value) || 0;
    const travel = parseFloat(document.getElementById("travel").value) || 0;
    const activities = parseFloat(document.getElementById("activities").value) || 0;
    const numberofpeople = parseInt(document.getElementById("numberofpeople").value) || 1;

    const total = travel + accommodation + activities;
    const split = total / numberofpeople;

    document.getElementById("total").textContent = total.toFixed(2);
    document.getElementById("split").textContent = split.toFixed(2);
  }

function loadData() {
  const savedData = localStorage.getItem("planningAppData");
  
  if (!savedData) {
    return;
  }

  const data = JSON.parse(savedData);

  document.getElementById("holidayInput").value = data.holidayInput || "";
  document.getElementById("test").textContent = data.test || "";
  // document.getElementById("display").innerText = data.display || "";
  // document.getElementById("destination").innerText = data.destination || "Click here to enter destination";
  document.getElementById("accommodation").value = data.accommodation || "";
  document.getElementById("travel").value = data.travel || "";
  document.getElementById("activities").value = data.activities || "";
  document.getElementById("numberofpeople").value = data.numberofpeople || "1";

  updateCosts();

}

window.onload = function () {
  
  loadData();

  document.getElementById("accommodation").addEventListener("input", updateCosts);
  document.getElementById("travel").addEventListener("input", updateCosts);
  document.getElementById("activities").addEventListener("input", updateCosts);
  document.getElementById("numberofpeople").addEventListener("input", updateCosts);
};

["accommodation", "travel", "activities", "numberofpeople"]
  .forEach(id => {
    document.getElementById(id).addEventListener("input", updateCosts);
  });

loadData();
updateCosts();