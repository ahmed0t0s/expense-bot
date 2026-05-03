const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const db = require("./db");

const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width: 600,
    height: 400
});

async function generateChart(chatId, bot) {
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

    if (total === 0) {
        return bot.sendMessage(chatId, "مفيش بيانات مصاريف لسه 📭");
    }

    // 📊 الرسم (بدون أرقام)
    const config = {
        type: "bar",
        data: {
            labels: ["Food", "Transport", "Rent"],
            datasets: [{
                data: [food, transport, rent],
                backgroundColor: ["#ff6384", "#36a2eb", "#ffce56"]
            }]
        },
        options: {
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    };

    const image = await chartJSNodeCanvas.renderToBuffer(config);

    // 📱 الأرقام هنا (مضمون 100%)
    const caption =
`📊 المصاريف:

🍔 أكل: ${food}
🚕 مواصلات: ${transport}
🏠 إيجار: ${rent}

💰 الإجمالي: ${total}

📈 النسب:
🍔 ${((food/total)*100).toFixed(1)}%
🚕 ${((transport/total)*100).toFixed(1)}%
🏠 ${((rent/total)*100).toFixed(1)}%`;

    await bot.sendPhoto(chatId, image, { caption });
}

module.exports = generateChart;