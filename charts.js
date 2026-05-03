const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const db = require("./db");
const fs = require("fs");

const width = 500;
const height = 500;

const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

async function generateChart(chatId, bot) {
    const rows = db.prepare("SELECT * FROM expenses").all();

    let food = 0, transport = 0, rent = 0;

    rows.forEach(r => {
        if (r.category === "food") food += r.amount;
        else if (r.category === "transport") transport += r.amount;
        else if (r.category === "rent") rent += r.amount;
    });

    const config = {
        type: "pie",
        data: {
            labels: ["Food", "Transport", "Rent"],
            datasets: [{
                data: [food, transport, rent]
            }]
        }
    };

    const image = await chartJSNodeCanvas.renderToBuffer(config);

    fs.writeFileSync("chart.png", image);

    await bot.sendPhoto(chatId, "chart.png", {
        caption: "📊 توزيع المصاريف"
    });
}

module.exports = generateChart;