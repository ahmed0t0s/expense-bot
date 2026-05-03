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

// =====================
// 🤖 TELEGRAM BOT
// =====================
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

    // استخراج رقم
    const amountMatch = text.match(/\d+/);
    if (!amountMatch) {
        return bot.sendMessage(chatId, "اكتب: دفعت 200 بنزين");
    }

    const amount = Number(amountMatch[0]);

    // تصنيف
    let category = "other";
    if (text.includes("بنزين")) category = "transport";
    else if (text.includes("اكل") || text.includes("أكل")) category = "food";
    else if (text.includes("ايجار")) category = "rent";

    console.log("INSERT:", amount, category, text);

    db.prepare(
        "INSERT INTO expenses (amount, category, text) VALUES (?, ?, ?)"
    ).run(amount, category, text);

    bot.sendMessage(chatId, `تم تسجيل 💰 ${amount} في ${category}`);
});


// =====================
// 📊 REPORT
// =====================
function sendReport(chatId) {
    const rows = db.prepare("SELECT * FROM expenses").all();

    let total = 0;
    let food = 0;
    let transport = 0;
    let rent = 0;

    rows.forEach(r => {
        const amount = Number(r.amount) || 0;

        total += amount;

        if (r.category === "food") food += amount;
        else if (r.category === "transport") transport += amount;
        else if (r.category === "rent") rent += amount;
    });

    bot.sendMessage(chatId,
`📊 التقرير:

🍔 أكل: ${food}
🚕 مواصلات: ${transport}
🏠 إيجار: ${rent}

💰 إجمالي: ${total}`);
}


// =====================
// 📁 EXPORT EXCEL
// =====================
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


// =====================
// 🌐 WEB DASHBOARD
// =====================
app.get("/", (req, res) => {
    res.send("Bot is running 🚀");
});


app.get("/dashboard", (req, res) => {
    const rows = db.prepare("SELECT * FROM expenses").all();

    let food = 0;
    let transport = 0;
    let rent = 0;

    rows.forEach(r => {
        const amount = Number(r.amount) || 0;

        if (r.category === "food") food += amount;
        else if (r.category === "transport") transport += amount;
        else if (r.category === "rent") rent += amount;
    });

    const total = food + transport + rent;

    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Expense Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <style>
        body {
            font-family: Arial;
            text-align: center;
            background: #f4f4f4;
        }
        .box {
            display: inline-block;
            margin: 15px;
            padding: 15px;
            background: white;
            border-radius: 10px;
            width: 180px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
    </style>
</head>

<body>

<h1>📊 Expense Dashboard</h1>

<div class="box">🍔 Food<br><b>${food}</b></div>
<div class="box">🚕 Transport<br><b>${transport}</b></div>
<div class="box">🏠 Rent<br><b>${rent}</b></div>
<div class="box">💰 Total<br><b>${total}</b></div>

<canvas id="chart" width="400" height="400"></canvas>

<script>
const data = {
    labels: [
        "🍔 Food (${food})",
        "🚕 Transport (${transport})",
        "🏠 Rent (${rent})"
    ],
    datasets: [{
        data: [${food}, ${transport}, ${rent}],
        backgroundColor: ["#ff6384", "#36a2eb", "#ffce56"]
    }]
};

new Chart(document.getElementById("chart"), {
    type: "pie",
    data: data,
    options: {
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return context.label + ": " + context.raw;
                    }
                }
            },
            legend: {
                position: "bottom"
            }
        }
    }
});
</script>

</body>
</html>
    `);
});


// =====================
// 🚀 START SERVER
// =====================
app.listen(PORT, () => {
    console.log("Web Dashboard running on port", PORT);
});