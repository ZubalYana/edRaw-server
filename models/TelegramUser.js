const mongoose = require('mongoose')

const telegramUserShema = new mongoose.Schema({
    chatId: String,
})

module.exports = mongoose.model('TelegramUser', telegramUserShema)