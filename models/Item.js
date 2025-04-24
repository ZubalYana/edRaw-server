const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    img: String,
    name: String,
    prices: Array,
    description: String,
    rate: Number,
    type: String
});

module.exports = mongoose.model('Item', itemSchema);