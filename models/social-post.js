const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const socialSchema = new Schema({
    imageUrl: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Photo', socialSchema)