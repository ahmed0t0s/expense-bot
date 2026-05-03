const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// حط التوكن بتاعك هنا
const TOKEN = process.env.TOKEN;

// استقبال الرسائل
app.post(`/webhook/${TOKEN}`, async (req, res) => {
    const message = req.body.message;

    if (!message || !message.text) {
        return res.sendStatus(200);
    }

    const chatId = message.chat.id;
    const text = message.text;

    console.log("Message:", text);

    await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: `استلمت: ${text}`
    });

    res.sendStatus(200);
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});