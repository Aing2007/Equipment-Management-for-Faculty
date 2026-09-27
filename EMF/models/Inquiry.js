const mongoose = require('mongoose');

const InquirySchema = new mongoose.Schema({
  kind: { type: String, enum: ['demo', 'service'], required: true },
  name: { type: String, required: true, trim: true },
  organization: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  message: { type: String, required: true, trim: true },
  equipmentCode: { type: String, trim: true },
  preferredDate: Date,
  status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' }
}, { timestamps: true });

module.exports = mongoose.model('Inquiry', InquirySchema);
