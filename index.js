const express = require("express");
const app = express();

const TelegramBot = require("node-telegram-bot-api");
const db = require("./db");
const ExcelJS = require("exceljs");
const generateChart = require("./charts");

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TOKEN;

const bot = new TelegramBot(TOKEN, { polling: true });

console.log("Bot started...");

// ================= BOT =================
bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = (msg.text || "").toLowerCase();

    // تسجيل المستخدم
    db.prepare(`
        INSERT OR IGNORE INTO users (telegram_id)
        VALUES (?)
    `).run(chatId);

    const user = db.prepare(
        "SELECT id FROM users WHERE telegram_id = ?"
    ).get(chatId);

    const userId = user.id;

    if (text.includes("انفوجراف")) {
        return generateChart(chatId, bot, userId);
    }

    if (text.includes("excel")) {
        return exportExcel(chatId, userId);
    }

    if (text.includes("تقرير")) {
        return sendReport(chatId, userId);
    }

    const amountMatch = text.match(/\d+/);
    if (!amountMatch) {
        return bot.sendMessage(chatId, "اكتب: دفعت 200 بنزين");
    }

    const amount = Number(amountMatch[0]);

    let category = "other";
    if (text.includes("بنزين")) category = "transport";
    else if (text.includes("اكل") || text.includes("أكل")) category = "food";
    else if (text.includes("ايجار")) category = "rent";

    db.prepare(`
        INSERT INTO expenses (user_id, amount, category, text)
        VALUES (?, ?, ?, ?)
    `).run(userId, amount, category, text);

    bot.sendMessage(chatId, `تم تسجيل 💰 ${amount}`);
});

// ================= REPORT =================
function sendReport(chatId, userId) {
    const rows = db.prepare(
        "SELECT * FROM expenses WHERE user_id = ?"
    ).all(userId);

    let total = 0, food = 0, transport = 0, rent = 0;

    rows.forEach(r => {
        const a = Number(r.amount) || 0;
        total += a;
        if (r.category === "food") food += a;
        if (r.category === "transport") transport += a;
        if (r.category === "rent") rent += a;
    });

    bot.sendMessage(chatId,
`📊 التقرير:

🍔 أكل: ${food}
🚕 مواصلات: ${transport}
🏠 إيجار: ${rent}

💰 الإجمالي: ${total}`);
}

// ================= EXCEL =================
async function exportExcel(chatId, userId) {
    const rows = db.prepare(
        "SELECT * FROM expenses WHERE user_id = ?"
    ).all(userId);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Expenses");

    sheet.columns = [
        { header: "Amount", key: "amount" },
        { header: "Category", key: "category" },
        { header: "Text", key: "text" },
        { header: "Date", key: "date" }
    ];

    rows.forEach(r => sheet.addRow(r));

    await workbook.xlsx.writeFile("expenses.xlsx");

    bot.sendMessage(chatId, "📁 Excel جاهز");
}

// ================= WEB =================
app.get("/", (req, res) => {
    res.send("Bot running 🚀");
});

app.get("/dashboard/:id", (req, res) => {
    const userId = req.params.id;

    const rows = db.prepare(
        "SELECT * FROM expenses WHERE user_id = ?"
    ).all(userId);

    let food = 0, transport = 0, rent = 0;

    rows.forEach(r => {
        const a = Number(r.amount) || 0;
        if (r.category === "food") food += a;
        if (r.category === "transport") transport += a;
        if (r.category === "rent") rent += a;
    });

    const total = food + transport + rent;

    res.send(`
<html>
<head>
<title>Dashboard</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
body{font-family:Arial;text-align:center;background:#f4f4f4}
.box{display:inline-block;margin:10px;padding:15px;background:#fff;border-radius:10px}
</style>
</head>

<body>

<h1>📊 Dashboard</h1>

<div class="box">🍔 ${food}</div>
<div class="box">🚕 ${transport}</div>
<div class="box">🏠 ${rent}</div>
<div class="box">💰 ${total}</div>

<canvas id="c"></canvas>

<script>
new Chart(document.getElementById("c"),{
type:"pie",
data:{
labels:["Food","Transport","Rent"],
datasets:[{data:[${food},${transport},${rent}]}]
}
});
</script>

</body>
</html>
`);
});

app.listen(PORT, () => {
    console.log("Server running...");
});