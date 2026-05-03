const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const ChartDataLabels = require("chartjs-plugin-datalabels");
const db = require("./db");

const width = 500;
const height = 500;

const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width,
    height,
    plugins: [ChartDataLabels]
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

    const config = {
        type: "pie",
        data: {
            labels: ["🍔 Food", "🚕 Transport", "🏠 Rent"],
            datasets: [{
                data: [food, transport, rent]
            }]
        },
        options: {
            plugins: {
                datalabels: {
                    color: "#fff",
                    font: {
                        weight: "bold",
                        size: 16
                    },
                    formatter: (value) => value > 0 ? value : ""
                }
            }
        },
        plugins: [ChartDataLabels]
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