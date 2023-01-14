function saveBrain() {
    localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
}

function discardBrain() {
    localStorage.removeItem("bestBrain");
}

function exportBrain() {
    let bestBrain = localStorage.getItem("bestBrain");
    bestBrain = JSON.parse(bestBrain);
    saveToFile("bestbrain.json", bestBrain);
}

function importBrain(event) {
    let input = event.target;

    let reader = new FileReader();
    reader.onload = function () {
        let bestBrain = reader.result;
        if (verifyBrain(bestBrain)) {
            localStorage.setItem("bestBrain", bestBrain);
        }
    };
    reader.readAsText(input.files[0]);
}


/**
 * Ensures content of file uploaded is what we expect in bestBrain
 * 
 * @param {string} content 
 * @returns {boolean} Flag whether file is valid
 */
const verifyBrain = (content) => {
    if (!isNaN(content) || content.toString() == "true" || content.toString() == "false")
        return false;

    try {
        let json = JSON.parse(content);

        if (!("levels" in json))
            return false;

        json.levels.forEach((level) => {
            if (!("inputs" in level))
                return false;
            if (!("outputs" in level))
                return false;
            if (!("biases" in level))
                return false;
            if (!("weights" in level))
                return false;
        });
    } catch (e) {
        return false;
    }

    return true;
};

const saveToFile = (filename, content) => {
    const blob = new Blob([JSON.stringify(content)], { type: "text/json" });
    const link = document.createElement("a");

    link.download = filename;
    link.href = window.URL.createObjectURL(blob);
    link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");

    const evt = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
    });

    link.dispatchEvent(evt);
    link.remove();
};