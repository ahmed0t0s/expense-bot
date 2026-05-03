const db = require("./db");
const ExcelJS = require("exceljs");

async function generateChart(chatId, bot) {
    const rows = db.prepare("SELECT * FROM expenses").all();

    let food = 0, transport = 0, rent = 0;

    rows.forEach(r => {
        if (r.category === "food") food += r.amount;
        else if (r.category === "transport") transport += r.amount;
        else if (r.category === "rent") rent += r.amount;
    });

    const text =
`📊 الإنفوجراف:
🍔 أكل: ${food}
🚕 مواصلات: ${transport}
🏠 إيجار: ${rent}`;

    bot.sendMessage(chatId, text);
}

module.exports = generateChart;