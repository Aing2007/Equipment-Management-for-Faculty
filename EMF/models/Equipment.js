const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true },
  barcode_Number: { type: String, required: true, unique: true, trim: true, uppercase: true },
  smartTagId: { type: String, trim: true, sparse: true, unique: true },
  serialNumber: { type: String, trim: true },
  year_input: { type: Number, required: true },
  acquiredAt: Date,
  purchasePrice: { type: Number, min: 0 },
  status: { type: String, enum: ['active', 'maintenance', 'retired', 'lost'], default: 'active' },
  condition: { type: String, enum: ['good', 'watch', 'poor'], default: 'good' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  maintenanceIntervalMonths: { type: Number, min: 1, default: 12 },
  expectedLifespanYears: { type: Number, min: 1, default: 5 },
  lastInspectionDate: Date,
  nextInspectionDate: Date,
  expectedReplacementDate: Date,
  notes: { type: String, trim: true }
}, { timestamps: true });

EquipmentSchema.pre('validate', function() {
  if (!this.nextInspectionDate) {
    const next = new Date(this.lastInspectionDate || this.acquiredAt || Date.now());
    next.setMonth(next.getMonth() + (this.maintenanceIntervalMonths || 12));
    this.nextInspectionDate = next;
  }
  if (!this.expectedReplacementDate && (this.acquiredAt || this.year_input)) {
    const next = this.acquiredAt ? new Date(this.acquiredAt) : new Date(this.year_input, 0, 1);
    next.setFullYear(next.getFullYear() + (this.expectedLifespanYears || 5));
    this.expectedReplacementDate = next;
  }
});

module.exports = mongoose.model('Equipment', EquipmentSchema);
