const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const db = require("./db");

const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width: 500,
    height: 500
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
        type: "pie",
        data: {
            labels: ["Food", "Transport", "Rent"],
            datasets: [{
                data: [food, transport, rent]
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    };

    const image = await chartJSNodeCanvas.renderToBuffer(config);

    // 📊 هنا الأرقام تظهر بشكل مضمون (مش داخل الرسم)
    await bot.sendPhoto(chatId, image, {
        caption:
`📊 تقرير المصاريف:

🍔 أكل: ${food} (${((food/total)*100).toFixed(1)}%)
🚕 مواصلات: ${transport} (${((transport/total)*100).toFixed(1)}%)
🏠 إيجار: ${rent} (${((rent/total)*100).toFixed(1)}%)

💰 الإجمالي: ${total}`
    });
}

module.exports = generateChart;