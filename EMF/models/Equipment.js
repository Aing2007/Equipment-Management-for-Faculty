const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    year_input: {
        type: Number,
        required: true
    },
    barcode_Number: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Equipment', EquipmentSchema);