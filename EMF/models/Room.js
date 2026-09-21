const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    room_code: {
        type: String,
        required: true,
        unique: true
    },
    floor: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);