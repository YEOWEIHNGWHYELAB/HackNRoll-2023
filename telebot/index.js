const { Telegraf } = require("telegraf");
const bot = new Telegraf(process.env.TELEBOT_TOKEN);

let subscribedIDs = [];

function initBot() {
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

function broadcastScores(scores) {
    scoresStr = parseScores(scores);

    for (let chatID of subscribedIDs) {
        bot.telegram.sendMessage(chatID, scoresStr);
    }
}

module.exports = {
    initBot, broadcastScores
};