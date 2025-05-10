const express = require('express');
const app = express();
const dotenv = require('dotenv').config();
const PORT = process.env.PORT || 5000;
const mongoose = require('mongoose');
const Item = require('./models/Item');
const Review = require('./models/Review')
const TelegramUser = require('./models/TelegramUser');
const { upload } = require('./cloudinary');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'));

app.post('/createItem', upload.single("img"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Image file is required" });
        }

        if (req.file && req.file.path) {
            console.log('Image URL:', req.file.path);
        } else {
            return res.status(400).json({ success: false, message: "Image upload failed" });
        }

        const { name, prices, description, rate, type } = req.body;

        let parsedPrices = [];
        if (Array.isArray(prices)) {
            parsedPrices = prices.map(p => Number(p));
        } else if (typeof prices === 'string') {
            parsedPrices = prices.includes(',')
                ? prices.split(',').map(p => Number(p.trim()))
                : [Number(prices)];
        }

        const newItem = new Item({
            name,
            prices: parsedPrices,
            description,
            rate: Number(rate),
            img: req.file.path,
            type,
        });

        await newItem.save();
        res.status(201).json({ success: true, item: newItem });

    } catch (err) {
        console.error("Error occurred:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
        res.status(500).json({ success: false, message: err.message || 'Server Error' });
    }
});

app.post('/createReview', upload.single("img"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Image file is required" });
        }
        if (req.file && req.file.path) {
            console.log('Image URL:', req.file.path);
        } else {
            return res.status(400).json({ success: false, message: "Image upload failed" });
        }

        const { name, position, rate, text } = req.body;

        const newReview = new Review({
            name,
            position,
            rate,
            text,
            img: req.file.path,
        });

        await newReview.save()
        res.status(201).json({ success: true, review: newReview })

    } catch (err) {
        console.error("Error occurred:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
        res.status(500).json({ success: false, message: err.message || 'Server Error' })
    }
})

app.get('/items', async (req, res) => {
    try {
        const items = await Item.find();
        res.status(200).json({ success: true, items });
    } catch (err) {
        console.error("Error occurred:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
        res.status(500).json({ success: false, message: err.message || 'Server Error' });
    }
});

app.get('/reviews', async (req, res) => {
    try {
        const reviews = await Review.find();
        res.status(200).json({ success: true, reviews })
    } catch (err) {
        console.error("Error occurred:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
        res.status(500).json({ success: false, message: err.messagte || 'Server Error' })
    }
})

bot.on('message', async (msg) => {
    try {
        const chatId = msg.chat.id;

        const userExists = await TelegramUser.findOne({ chatId });
        if (!userExists) {
            const newUser = new TelegramUser({ chatId });
            await newUser.save();
        }

        bot.sendMessage(chatId, 'Hello!');
    } catch (err) {
        console.error('Error storing chatId:', err);
    }
});

app.post('/sendOrderDetails', async (req, res) => {
    const chatId = 1132590035;
    const { cart, userName, userEmail } = req.body;
    console.log(cart)
    const formattedOrder = cart.map(item => {
        const lastPrice = item.prices[item.prices.length - 1];
        return `${item.name} - $${lastPrice}${item.quantity ? ` x${item.quantity}` : ''}`
    }).join('\n');
    bot.sendMessage(chatId, `You've got a new order from ${userName} - ${userEmail}\n\nCart:\n${formattedOrder}\n\nTotal: ${cart.reduce((acc, item) => acc + item.prices[item.prices.length - 1] * (item.quantity || 1), 0)}$`);
    res.status(200).json({ success: true });
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));