const db = require("./db");
const ExcelJS = require("exceljs");
async function exportExcel(chatId) {
    db.all("SELECT * FROM expenses", async (err, rows) => {
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
    });
}


const TelegramBot = require("node-telegram-bot-api");
const db = require("./db");

const TOKEN = process.env.TOKEN;

const bot = new TelegramBot(TOKEN, { polling: true });

console.log("Bot started...");

// تسجيل مصاريف
bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text.toLowerCase();
if (text.includes("excel")) {
    return exportExcel(chatId);
}
    // أوامر
    if (text.includes("تقرير")) {
        return sendReport(chatId);
    }

    // استخراج رقم
    const amountMatch = text.match(/\d+/);
    if (!amountMatch) {
        return bot.sendMessage(chatId, "اكتب: دفعت 200 بنزين");
    }

    const amount = parseInt(amountMatch[0]);

    // تصنيف
    let category = "other";
    if (text.includes("بنزين")) category = "transport";
    else if (text.includes("اكل") || text.includes("أكل")) category = "food";
    else if (text.includes("ايجار")) category = "rent";

    db.run(
        "INSERT INTO expenses (amount, category, text) VALUES (?, ?, ?)",
        [amount, category, text]
    );

    bot.sendMessage(chatId, `تم تسجيل 💰 ${amount} في ${category}`);
});

function sendReport(chatId) {
    db.all("SELECT * FROM expenses", [], (err, rows) => {
        if (err) return;

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
🏠 إيجار: ${rent}`
        );
    });
}