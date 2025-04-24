const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    img: String,
    name: String,
    prices: Array,
    description: String,
    rate: Number,
});

module.exports = mongoose.model('Item', itemSchema);