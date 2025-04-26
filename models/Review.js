const mongoose = require('mongoose')

const reviewShema = new mongoose.Schema({
    img: String,
    name: String,
    position: String,
    rate: Number,
    text: String,
})

module.exports = mongoose.model('review', reviewShema)