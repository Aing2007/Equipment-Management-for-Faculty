const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  room_code: { type: String, required: true, unique: true, trim: true },
  name: { type: String, trim: true },
  building: { type: String, trim: true },
  floor: { type: String, required: true },
  purpose: { type: String, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
