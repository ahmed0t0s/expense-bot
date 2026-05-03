const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const { registerFont } = require("canvas");
const ChartDataLabels = require("chartjs-plugin-datalabels");
const db = require("./db");

// تسجيل الخط العربي
registerFont("./fonts/Cairo-Regular.ttf", { family: "Cairo" });

const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width: 600,
    height: 600,
    chartCallback: (ChartJS) => {
        ChartJS.register(ChartDataLabels);
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

    const total = food + transport + rent;

    if (total === 0) {
        return bot.sendMessage(chatId, "مفيش بيانات لسه 📭");
    }

    const config = {
        type: "pie",
        data: {
            labels: ["🍔 أكل", "🚕 مواصلات", "🏠 إيجار"],
            datasets: [{
                data: [food, transport, rent],
                backgroundColor: ["#ff4d6d", "#4dabf7", "#ffd43b"]
            }]
        },
        options: {
    plugins: {
        legend: {
            position: "bottom",
            labels: {
                font: {
                    family: "Cairo",
                    size: 16
                },
                textDirection: "rtl"
            }
        },
        datalabels: {
            color: "#fff",
            font: {
                weight: "bold",
                size: 18
            },
            formatter: (value) => {
                const percentage = ((value / total) * 100).toFixed(1);
                return value > 0 ? value + " (" + percentage + "%)" : "";
            }
        }
    },
    layout: {
        padding: 20
    }
}

    const image = await chartJSNodeCanvas.renderToBuffer(config);

    await bot.sendPhoto(chatId, image, {
        caption: "📊 توزيع المصاريف"
    });
}

module.exports = generateChart;