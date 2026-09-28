const Equipment = require('../models/Equipment');
const Room = require('../models/Room');
const { validateAssetDates } = require('../utils/assetDates');

const populate = [
  { path: 'user', select: 'name_sur username' },
  { path: 'department', select: 'name code kind' },
  { path: 'room', select: 'room_code name building floor' }
];

exports.getEquipments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.search) {
      const search = String(req.query.search).trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { barcode_Number: { $regex: search, $options: 'i' } },
        { smartTagId: { $regex: search, $options: 'i' } }
      ];
    }
    const data = await Equipment.find(filter).populate(populate).sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEquipment = async (req, res) => {
  try {
    const data = await Equipment.findById(req.params.id).populate(populate);
    if (!data) return res.status(404).json({ success: false, message: 'ไม่พบครุภัณฑ์' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createEquipment = async (req, res) => {
  try {
    const dateError = validateAssetDates(req.body);
    if (dateError) return res.status(400).json({ success: false, message: dateError });
    if (req.body.room) {
      const room = await Room.findById(req.body.room);
      if (!room) return res.status(404).json({ success: false, message: 'ไม่พบห้องที่เลือก' });
      if (room.department && req.body.department && String(room.department) !== String(req.body.department)) {
        return res.status(400).json({ success: false, message: 'ห้องและหน่วยงานต้องตรงกัน' });
      }
    }
    const data = await Equipment.create({
      ...req.body,
      user: req.user._id
    });
    await data.populate(populate);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateEquipment = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates._id;
    if (Object.prototype.hasOwnProperty.call(updates, 'room') || Object.prototype.hasOwnProperty.call(updates, 'department')) {
      return res.status(400).json({ success: false, message: 'กรุณาเปลี่ยนสถานที่ผ่านการบันทึกการเคลื่อนย้าย' });
    }
    const data = await Equipment.findOneAndUpdate(
      { _id: req.params.id }, updates,
      { new: true, runValidators: true }
    ).populate(populate);
    if (!data) return res.status(404).json({ success: false, message: 'ไม่พบครุภัณฑ์' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteEquipment = async (req, res) => {
  try {
    const data = await Equipment.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'ไม่พบครุภัณฑ์' });
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
