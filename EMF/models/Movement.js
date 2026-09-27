const mongoose = require('mongoose');

const MovementSchema = new mongoose.Schema({
  equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
  fromRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  toRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  fromDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  toDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  reason: { type: String, required: true, trim: true },
  movedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Movement', MovementSchema);
