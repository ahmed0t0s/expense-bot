const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const { registerFont } = require("canvas");
const db = require("./db");

// تسجيل الخط العربي
registerFont("./fonts/Cairo-Regular.ttf", { family: "Cairo" });

const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width: 500,
    height: 500,
    chartCallback: (ChartJS) => {
        ChartJS.defaults.font.family = "Cairo";
        ChartJS.defaults.font.size = 16;
    }
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
            labels: ["🍔 أكل", "🚕 مواصلات", "🏠 إيجار"],
            datasets: [{
                data: [food, transport, rent],
                backgroundColor: ["#ff6384", "#36a2eb", "#ffce56"]
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: {
                        font: {
                            family: "Cairo",
                            size: 16
                        }
                    }
                }
            }
        }
    };

    const image = await chartJSNodeCanvas.renderToBuffer(config);

    await bot.sendPhoto(chatId, image, {
        caption: "📊 توزيع المصاريف"
    });
}

module.exports = generateChart;