const bcrypt = require("bcrypt");
const Pool = require("pg").Pool;

const saltRounds = 10;
let dbusername = "postgres";
let dbpassword = "password";
let dbname = "hacknroll";

if (process.env.DBUSERNAME && process.env.DBPASSWORD && process.env.DBNAME) {
    dbusername = process.env.DBUSERNAME.toString();
    dbpassword = process.env.DBPASSWORD.toString();
    dbname = process.env.DBNAME.toString();
}

const pool = new Pool({
    user: dbusername,
    password: dbpassword,
    host: "localhost",
    port: 5432,
    database: dbname,
});

/**
 * 
 * @param {String} query Query string
 * @param {Array<String>} values Values if using a prameterized query
 * @param {Function} onSuccess Callback function on successful query
 * @param {Function} onError Callback function on error
 */
const runQuery = async (query, values, onSuccess = undefined, onError = undefined) => {
    pool.query(query, values, (err, result) => {
        if (err && onError != undefined) {
            onError(err);
        } else if (onSuccess != undefined) {
            onSuccess(result);
        }
    });
};

/**
 * Initialises database with schemas if they don't already exist
 */
const initDB = () => {
    let schemaDDL = `
        CREATE SCHEMA IF NOT EXISTS "2023";`;
    runQuery(schemaDDL, []);

    let userDDL = `
        CREATE TABLE IF NOT EXISTS "2023"."user" (
            user_id INT GENERATED ALWAYS AS IDENTITY,
            username VARCHAR(20) NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            PRIMARY KEY ("user_id")
        );`;
    runQuery(userDDL, []);

    let scoreDDL = `
        CREATE TABLE IF NOT EXISTS "2023"."score" (
            score_id INT GENERATED ALWAYS AS IDENTITY,
            user_id INT NOT NULL,
            username VARCHAR(20) NOT NULL,
            score_value INT NOT NULL DEFAULT 0,
            room_id VARCHAR(40) NOT NULL,
            PRIMARY KEY ("score_id"),
            CONSTRAINT fk_user_id
                FOREIGN KEY("user_id")
                    REFERENCES "2023"."user"("user_id")
        );`;
    runQuery(scoreDDL, []);
};

/**
 * 
 * @param {String}   username 
 * @param {String}   password 
 * @param {Function} onSuccess  Callback function for a successful registration
 * @param {Function} onError    Callback function for an unsuccessful registration
 */
const register = (username, password, onSuccess, onError) => {
    bcrypt.genSalt(saltRounds, (err, salt) => {
        if (err) {
            onError(err);
            return;
        }

        bcrypt.hash(password.trim(), salt, (err, passwordHash) => {
            if (err) {
                onError(err);
                return;
            }

            let query = "INSERT INTO \"2023\".\"user\" (username, password_hash, salt) VALUES ($1, $2, $3)",
                values = [username.trim(), passwordHash, salt];
            runQuery(query, values, onSuccess, onError);
        });
    });
};

/**
 * 
 * @param {String} username 
 * @param {String} password 
 * @param {Function} onSuccess callback function for successful login
 * @param {Function} onError   callback function for unsuccessful login
 */
const login = (username, password, onSuccess, onError) => {
    let query = "SELECT password_hash, salt FROM \"2023\".\"user\" WHERE username=$1 LIMIT 1",
        values = [username.trim()];
    runQuery(query, values, (result) => {
        if (result.rowCount == 0) {
            onError({ errorMsg: "Incorrect username/password" });
            return;
        }

        let row = result.rows[0],
            pwHash = row["password_hash"];

        bcrypt.compare(password.trim(), pwHash, (err, cmpRes) => {
            if (result === false)
                onError(err);
            else
                onSuccess(cmpRes);
        });
    }, onError);
};

/**
 * 
 * @param {string} roomID Room ID of game that finished
 * @param {object} agents Agent object, contains keys "pos" and "crashed"
 */
const uploadScores = (roomID, agents) => {
    let queryDDLValues = [],
        queryValues = [],
        varCount = 0;

    for (user in agents) {
        const score = Math.abs(Math.round(agents[user]["pos"][1]));

        queryDDLValues.push(`(
            (SELECT user_id FROM "2023"."user" WHERE username=$${varCount + 1}),
            $${varCount + 1},
            $${varCount + 2},
            $${varCount + 3}
        )`);

        queryValues.push(user);
        queryValues.push(score);
        queryValues.push(roomID);

        // increment varCount as it's used for the $i variables
        varCount += 3;
    }

    if (queryValues.length > 0) {
        const scoreQuery = `
            INSERT INTO "2023"."score"(
                user_id, username, score_value, room_id
            )
            VALUES ${queryDDLValues.join(",")};`;
        runQuery(scoreQuery, queryValues);
    }
};

/**
 * Query the leaderboard entries from db
 */
const queryLeaderboard = (onSuccess, onError) => {
    let query = "SELECT username, score_value FROM \"2023\".\"score\" ORDER BY score_value DESC LIMIT 100";
    
    runQuery(query, [], onSuccess, onError);
};

module.exports = {
    initDB, register, login, uploadScores, queryLeaderboard
};