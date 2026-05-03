const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

console.log("Bot started...");

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    console.log("Message:", text);

    bot.sendMessage(chatId, "استلمت: " + text);
});