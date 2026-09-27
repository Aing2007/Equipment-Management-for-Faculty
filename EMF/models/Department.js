const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  kind: { type: String, enum: ['faculty', 'department', 'laboratory'], required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  description: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Department', DepartmentSchema);
