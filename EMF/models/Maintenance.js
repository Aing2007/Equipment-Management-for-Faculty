const mongoose = require('mongoose');

const MaintenanceSchema = new mongoose.Schema({
  equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
  kind: { type: String, enum: ['inspection', 'repair', 'preventive'], required: true },
  status: { type: String, enum: ['scheduled', 'in_progress', 'completed'], default: 'scheduled' },
  description: { type: String, required: true, trim: true },
  scheduledAt: { type: Date, required: true },
  completedAt: Date,
  cost: { type: Number, min: 0, default: 0 },
  provider: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Maintenance', MaintenanceSchema);
