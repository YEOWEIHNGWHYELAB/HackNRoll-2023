const { Telegraf } = require("telegraf");

let bot;

let subscribedIDs = [];
let roomMailList = {};

function initBot() {
    bot = new Telegraf(process.env.TELEBOT_TOKEN);

    bot.start((ctx) => {
        ctx.reply("Welcome to WHYBEN bot");
    });

    bot.command("subscribe", (ctx) => {
        if (subscribedIDs.includes(ctx.chat.id)) {
            ctx.reply("You are already subscribed to scores");
        } else {
            subscribedIDs.push(ctx.chat.id);
            ctx.reply("You are now subscribed to scores");
        }
    });

    bot.command("unsubscribe", (ctx) => {
        if (subscribedIDs.includes(ctx.chat.id)) {
            subscribedIDs = subscribedIDs.filter((i) => i !== ctx.chat.id);
            ctx.reply("You are now unsubscribed from scores");
        } else {
            ctx.reply("You are already not subscribed to scores");
        }
    });

    bot.command("follow", (ctx) => {
        let room = ctx.update.message.text.split(" ")[1];

        if (roomMailList[room] == undefined)
            roomMailList[room] = [];

        if (roomMailList[room].length == 0 ||
            !roomMailList[room].includes(ctx.chat.id)) {
            roomMailList[room].push(ctx.chat.id);
            ctx.reply(`You are now following room ${room}`);
        }

        else {
            ctx.reply("You are already following this room");
        }
    });

    bot.command("unfollow", (ctx) => {
        let room = ctx.update.message.text.split(" ")[1];

        if (roomMailList[room] == undefined ||
            roomMailList[room].length == 0 ||
            !roomMailList[room].includes(ctx.chat.id)) {
            ctx.reply("You are not currently following this room");
        }
        else {
            roomMailList[room] = roomMailList[room].filter((m) => m !== room);
            ctx.reply(`You have unfollowed room ${room}`);
        }
    });



    bot.launch();
}

/**
 * Converts JSON score into a string message
 * @param {Object} scores JSON of score results
 * @returns {string} Score in string format 
 */
function parseScores(scores) {
    let users = [];

    for (let user in scores) {
        users.push(`${user} has scored ${scores[user]}`);
    }

    return users.join("\n");
}

function broadcastScores(roomID, scores) {
    let scoresStr = parseScores(scores);
    let sent = new Set();

    for (let chatID of subscribedIDs) {
        if (!sent.has(chatID)) {
            bot.telegram.sendMessage(chatID, scoresStr);
            sent.add(chatID);
        }
    }

    if (roomMailList[roomID] !== undefined) {
        for (let chatID of roomMailList[roomID]) {
            if (!sent.has(chatID)) {
                bot.telegram.sendMessage(chatID, scoresStr);
                sent.add(chatID);
            }
        }
    }
}

module.exports = {
    initBot, broadcastScores
};