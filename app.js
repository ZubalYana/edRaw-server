const express = require('express');
const app = express();
const dotenv = require('dotenv').config();
const PORT = process.env.PORT || 5000;
const mongoose = require('mongoose');
const Item = require('./models/Item');
const Review = require('./models/Review')
const { upload } = require('./cloudinary');
const cors = require('cors');

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

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));