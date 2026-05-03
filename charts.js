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

    if (food + transport + rent === 0) {
        return bot.sendMessage(chatId, "مفيش بيانات لسه 📭");
    }

    const config = {
        type: "pie",
        data: {
            labels: [
                `🍔 Food: ${food}`,
                `🚕 Transport: ${transport}`,
                `🏠 Rent: ${rent}`
            ],
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

    await bot.sendPhoto(chatId, image, {
        caption: `📊 المصاريف:
🍔 أكل: ${food}
🚕 مواصلات: ${transport}
🏠 إيجار: ${rent}`
    });
}

module.exports = generateChart;