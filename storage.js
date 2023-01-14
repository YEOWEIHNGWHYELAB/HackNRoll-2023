function save_brain() {
  localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
}

function discard_brain() {
  localStorage.removeItem("bestBrain");
}
