

function saveData() {
  const test = document.getElementById("test").textContent.trim();
  
  const accommodationcost = document.getElementById("accommodationcost").value;
  const travelcost = document.getElementById("travelcost").value;
  const activitiescost = document.getElementById("activitiescost").value;
  const numberofpeople = document.getElementById("numberofpeople").value;

  // const destination = document.getElementById("destination").textContent.trim();
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

    // destination,
  };

  localStorage.setItem("planningAppData", JSON.stringify(data));
  console.log("Data saved: ", data);
}

function updateCosts() {
  const accommodationcost = parseFloat(document.getElementById("accommodationcost").value) || 0;
  const travelcost = parseFloat(document.getElementById("travelcost").value) || 0;
  const activitiescost = parseFloat(document.getElementById("activitiescost").value) || 0;
  const numberofpeople = parseInt(document.getElementById("numberofpeople").value) || 1;

  const total = travelcost + accommodationcost + activitiescost;
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

  document.getElementById("accommodationcost").value = data.accommodationcost || "0";
  document.getElementById("travelcost").value = data.travelcost || "0";
  document.getElementById("activitiescost").value = data.activitiescost || "0";
  document.getElementById("numberofpeople").value = data.numberofpeople || "1";

  document.getElementById("test").textContent = data.test || "";
  document.getElementById("traveldesc").textContent = data.traveldesc || "";
  document.getElementById("hoteldesc").textContent = data.hoteldesc || "";
  document.getElementById("fooddesc").textContent = data.fooddesc || "";
  document.getElementById("activitiesdesc").textContent = data.activitiesdesc || "";
  // document.getElementById("destination").innerText = data.destination || "Click here to enter destination";


  updateCosts();

}

window.onload = function () {
  
  loadData();

  ["accommodationcost", "travelcost", "activitiescost", "numberofpeople"]
    .forEach(id => {
      document.getElementById(id).addEventListener("input", updateCosts);
    });
};
