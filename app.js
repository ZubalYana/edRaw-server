const express = require('express');
const app = express();
const dotenv = require('dotenv').config();
const PORT = process.env.PORT || 5000;
const mongoose = require('mongoose');
const Item = require('./models/Item');
const Review = require('./models/Review')
const TelegramUser = require('./models/TelegramUser');
const Order = require('./models/Order');
const { upload } = require('./cloudinary');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const { InlineKeyboardButton } = require('node-telegram-bot-api');
const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('1234567890abcdef', 10);
const tempOrderId = nanoid();
const tempOrders = {};
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
    const adminChatId = 1132590035;
    const { cart, userName, userPhone, userComment } = req.body;

    const formattedOrder = cart.map(item => {
        const lastPrice = item.prices[item.prices.length - 1];
        return `🛒 ${item.name} - $${lastPrice}${item.quantity ? ` x${item.quantity}` : ''}`;
    }).join('\n');

    const total = cart.reduce((acc, item) => acc + item.prices[item.prices.length - 1] * (item.quantity || 1), 0);

    let message = `📦 *New Order Received!*\n👤 Name: ${userName}\n📞 Phone: ${userPhone}\n\n🧾 *Cart:*\n${formattedOrder}\n\n💰 *Total:* $${total}`;
    if (userComment?.trim()) {
        message += `\n\n💬 *Comment:* ${userComment}`;
    }

    const tempOrderId = nanoid();
    tempOrders[tempOrderId] = {
        cart,
        userName,
        userPhone,
        userComment,
        total,
        timestamp: Date.now()
    };

    bot.sendMessage(adminChatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "✅ Accept", callback_data: `accept_${tempOrderId}` },
                    { text: "❌ Reject", callback_data: `reject_${tempOrderId}` }
                ]
            ]
        }
    });

    res.status(200).json({ success: true });
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    const [action, orderId] = data.split('_');
    const orderData = tempOrders[orderId];

    if (!orderData) {
        return bot.answerCallbackQuery(query.id, { text: '⚠️ Order not found or expired.', show_alert: true });
    }

    if (action === 'accept') {
        bot.sendMessage(chatId, '✅ Order accepted and saved!');
        const order = new Order({
            cart: orderData.cart,
            userName: orderData.userName,
            userPhone: orderData.userPhone,
            userComment: orderData.userComment,
            timestamp: orderData.timestamp,
        });
        await order.save();
    } else if (action === 'reject') {
        bot.sendMessage(chatId, '❌ Order rejected.');
    }

    delete tempOrders[orderId];
    bot.answerCallbackQuery(query.id);
});



app.listen(PORT, () => console.log(`Server started on port ${PORT}`));