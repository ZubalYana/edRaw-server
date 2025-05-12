const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    cart: Array,
    userName: String,
    userPhone: String,
    userComment: String,
    timestamp: Number
});

module.exports = mongoose.model('Order', orderSchema);