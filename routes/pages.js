const router = require("express").Router();
const path = require("path");
const auth = require(path.join(__dirname, "../auth"));

router.get("/", (req, res) => {
    let indexPath = path.join(__dirname, "../public/index.html");
    res.sendFile(indexPath);
});

router.get("/train", (req, res) => {
    let trainPath = path.join(__dirname, "../public/train.html");
    res.sendFile(trainPath);
});

router.get("/compete", auth.authenticateToken, (req, res) => {
    let competePath = path.join(__dirname, "../public/compete.html");
    res.sendFile(competePath);
});

module.exports = router;