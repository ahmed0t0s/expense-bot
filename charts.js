const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const db = require("./db");

const width = 500;
const height = 500;

const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

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

    // لو مفيش بيانات
    if (food === 0 && transport === 0 && rent === 0) {
        return bot.sendMessage(chatId, "مفيش بيانات لسه 📭 ابدأ سجّل مصاريف الأول");
    }

    const config = {
        type: "pie",
        data: {
            labels: ["🍔 Food", "🚕 Transport", "🏠 Rent"],
            datasets: [{
                data: [food, transport, rent]
            }]
        }
    };

    const image = await chartJSNodeCanvas.renderToBuffer(config);

    await bot.sendPhoto(chatId, image, {
        caption: `📊 توزيع المصاريف:
🍔 أكل: ${food}
🚕 مواصلات: ${transport}
🏠 إيجار: ${rent}`
    });
}

module.exports = generateChart;