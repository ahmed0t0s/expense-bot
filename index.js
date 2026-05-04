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
<!DOCTYPE html>
<html lang="ar">
<head>
<meta charset="UTF-8">
<title>Dashboard</title>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<style>
body {
    margin:0;
    font-family: Arial;
    background:#0f172a;
    color:white;
}

.header {
    padding:20px;
    text-align:center;
    font-size:24px;
    font-weight:bold;
}

.container {
    display:grid;
    grid-template-columns: repeat(auto-fit, minmax(150px,1fr));
    gap:15px;
    padding:20px;
}

.card {
    background:#1e293b;
    padding:20px;
    border-radius:15px;
    text-align:center;
    box-shadow:0 5px 15px rgba(0,0,0,0.3);
}

.card h2 {
    margin:10px 0;
}

.total {
    background:#22c55e;
    color:black;
}

.chart-box {
    width:90%;
    max-width:500px;
    margin:20px auto;
    background:#1e293b;
    padding:20px;
    border-radius:15px;
}

</style>
</head>

<body>

<div class="header">📊 لوحة التحكم</div>

<div class="container">
    <div class="card">🍔<h2>${food}</h2><p>أكل</p></div>
    <div class="card">🚕<h2>${transport}</h2><p>مواصلات</p></div>
    <div class="card">🏠<h2>${rent}</h2><p>إيجار</p></div>
    <div class="card total">💰<h2>${total}</h2><p>الإجمالي</p></div>
</div>

<div class="chart-box">
    <canvas id="chart"></canvas>
</div>

<script>
new Chart(document.getElementById("chart"), {
    type: "doughnut",
    data: {
        labels: ["Food", "Transport", "Rent"],
        datasets: [{
            data: [${food}, ${transport}, ${rent}],
            backgroundColor: ["#f43f5e", "#3b82f6", "#facc15"]
        }]
    },
    options: {
        plugins: {
            legend: {
                labels: {
                    color: "white"
                }
            }
        }
    }
});
</script>

</body>
</html>
    `);
});