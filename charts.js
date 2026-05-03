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

    const config = {
        type: "bar",
        data: {
            labels: ["🍔 Food", "🚕 Transport", "🏠 Rent"],
            datasets: [{
                label: "المصاريف",
                data: [food, transport, rent]
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };

    const image = await chartJSNodeCanvas.renderToBuffer(config);

    await bot.sendPhoto(chatId, image, {
        caption:
`📊 تقرير المصاريف:

🍔 أكل: ${food}
🚕 مواصلات: ${transport}
🏠 إيجار: ${rent}

💰 الإجمالي: ${total}`
    });
}

module.exports = generateChart;