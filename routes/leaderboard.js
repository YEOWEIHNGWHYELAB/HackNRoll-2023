const router = require("express").Router();
const path = require("path");
const db = require(path.join(__dirname, "../db"));

router.get("/leaderboard", (req, res) => {
    db.queryLeaderboard(
        (result) => {
            if (result) {
                res.send(result.rows);
            }
            else
                res.status(403).send({ errorMsg: "Failed to retrieve leaderboard" });
        },
        (err) => {
            res.status(403).send(err);
        });
});

module.exports = router;