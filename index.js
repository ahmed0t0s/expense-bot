const TelegramBot = require("node-telegram-bot-api");
const db = require("./db");
const ExcelJS = require("exceljs");
const generateChart = require("./charts");

const TOKEN = process.env.TOKEN;

const bot = new TelegramBot(TOKEN, { polling: true });

console.log("Bot started...");

bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = (msg.text || "").toLowerCase();

    // 📊 انفوجراف
    if (text.includes("انفوجراف") || text.includes("chart")) {
        return generateChart(chatId, bot);
    }

    // 📁 Excel
    if (text.includes("excel")) {
        return exportExcel(chatId);
    }

    // 📊 تقرير
    if (text.includes("تقرير")) {
        return sendReport(chatId);
    }

    const amountMatch = text.match(/\d+/);
    if (!amountMatch) {
        return bot.sendMessage(chatId, "اكتب: دفعت 200 بنزين");
    }

    const amount = parseInt(amountMatch[0]);

    let category = "other";
    if (text.includes("بنزين")) category = "transport";
    else if (text.includes("اكل") || text.includes("أكل")) category = "food";
    else if (text.includes("ايجار")) category = "rent";

    const stmt = db.prepare(
        "INSERT INTO expenses (amount, category, text) VALUES (?, ?, ?)"
    );
    stmt.run(amount, category, text);

    bot.sendMessage(chatId, `تم تسجيل 💰 ${amount} في ${category}`);
});

// 📊 تقرير
function sendReport(chatId) {
    const rows = db.prepare("SELECT * FROM expenses").all();

    let total = 0;
    let food = 0;
    let transport = 0;
    let rent = 0;

    rows.forEach(r => {
        total += r.amount;
        if (r.category === "food") food += r.amount;
        if (r.category === "transport") transport += r.amount;
        if (r.category === "rent") rent += r.amount;
    });

    bot.sendMessage(chatId,
`📊 التقرير:
💰 إجمالي: ${total}
🍔 أكل: ${food}
🚕 مواصلات: ${transport}
🏠 إيجار: ${rent}`);
}

// 📁 Excel
async function exportExcel(chatId) {
    const rows = db.prepare("SELECT * FROM expenses").all();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Expenses");

    sheet.columns = [
        { header: "Amount", key: "amount" },
        { header: "Category", key: "category" },
        { header: "Text", key: "text" },
        { header: "Date", key: "date" },
    ];

    rows.forEach(r => sheet.addRow(r));

    const file = "expenses.xlsx";
    await workbook.xlsx.writeFile(file);

    bot.sendMessage(chatId, "تم تجهيز Excel 📁");
}