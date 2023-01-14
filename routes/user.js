const router = require("express").Router();
const path = require("path");
const db = require(path.join(__dirname, "../db"));
const jwt = require("jsonwebtoken");

router.post("/register", (req, res) => {
    let { username, password } = req.body;
    db.register(username, password,
        (result) => {
            if (result) {
                res.json({ "success": true });
            }
            else
                res.status(403).send({ errorMsg: "Incorrect username/password" });
        },
        (err) => {
            res.status(403).send(err);
        });
});

router.post("/login", (req, res) => {
    let { username, password } = req.body;
    db.login(username, password,
        (result) => {
            if (result) {
                // if login credentials are correct, assign jwt to client
                let user = { username: username, role: "Player" },
                    token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "7d" });

                // keep login for a week
                res.cookie("jwtLogin", token, { maxAge: 7 * 24 * 60 * 60 * 1000 })

                // set username
                res.cookie("username", username, { maxAge: 7 * 24 * 60 * 60 * 1000 })
                    .json({ "success": true });
            }
            else
                res.status(403).send({ errorMsg: "Incorrect username/password" });
        },
        (err) => {
            res.status(403).send(err);
        });
});

module.exports = router;