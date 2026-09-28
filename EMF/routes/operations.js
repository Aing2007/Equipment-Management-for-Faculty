const express = require('express');
const Equipment = require('../models/Equipment');
const Room = require('../models/Room');
const Department = require('../models/Department');
const Movement = require('../models/Movement');
const Maintenance = require('../models/Maintenance');
const Inquiry = require('../models/Inquiry');
const { protect } = require('../middleware/auth');

const router = express.Router();
const equipmentPopulate = [
  { path: 'department', select: 'name code' },
  { path: 'room', select: 'room_code name building' }
];
const wrap = (handler) => async (req, res) => {
  try { await handler(req, res); }
  catch (error) { res.status(400).json({ success: false, message: error.message }); }
};
const result = (res, data, status = 200) => res.status(status).json({ success: true, data, count: Array.isArray(data) ? data.length : undefined });

router.get('/departments', protect, wrap(async (req, res) => {
  const data = await Department.find().populate('parent', 'name code').sort({ kind: 1, name: 1 });
  result(res, data);
}));
router.post('/departments', protect, wrap(async (req, res) => {
  result(res, await Department.create(req.body), 201);
}));

router.get('/movements', protect, wrap(async (req, res) => {
  const equipmentIds = await Equipment.distinct('_id');
  const data = await Movement.find({ equipment: { $in: equipmentIds } })
    .populate('equipment', 'name barcode_Number')
    .populate('fromRoom toRoom', 'room_code name')
    .populate('fromDepartment toDepartment', 'name')
    .populate('movedBy', 'name_sur')
    .sort({ movedAt: -1 }).limit(200);
  result(res, data);
}));
router.post('/movements', protect, wrap(async (req, res) => {
  const equipment = await Equipment.findById(req.body.equipment);
  if (!equipment) return res.status(404).json({ success: false, message: 'ไม่พบครุภัณฑ์' });
  const room = await Room.findById(req.body.toRoom);
  if (!room) return res.status(404).json({ success: false, message: 'ไม่พบห้องปลายทาง' });
  if (String(equipment.room || '') === String(room._id)) {
    return res.status(400).json({ success: false, message: 'ครุภัณฑ์อยู่ในห้องนี้แล้ว' });
  }
  const toDepartment = room.department || req.body.toDepartment || equipment.department;
  const movement = await Movement.create({
    equipment: equipment._id,
    fromRoom: equipment.room,
    toRoom: room._id,
    fromDepartment: equipment.department,
    toDepartment,
    reason: req.body.reason,
    movedBy: req.user._id
  });
  equipment.room = room._id;
  equipment.department = toDepartment;
  await equipment.save();
  await movement.populate(['equipment', 'fromRoom', 'toRoom', 'fromDepartment', 'toDepartment', 'movedBy']);
  result(res, movement, 201);
}));

router.get('/maintenance', protect, wrap(async (req, res) => {
  const equipmentIds = await Equipment.distinct('_id');
  const data = await Maintenance.find({ equipment: { $in: equipmentIds } })
    .populate('equipment', 'name barcode_Number nextInspectionDate')
    .populate('createdBy', 'name_sur')
    .sort({ scheduledAt: -1 }).limit(200);
  result(res, data);
}));
router.post('/maintenance', protect, wrap(async (req, res) => {
  const equipment = await Equipment.findById(req.body.equipment);
  if (!equipment) return res.status(404).json({ success: false, message: 'ไม่พบครุภัณฑ์' });
  const data = await Maintenance.create({ ...req.body, createdBy: req.user._id });
  if (data.status === 'in_progress') {
    equipment.status = 'maintenance';
    await equipment.save();
  }
  await data.populate('equipment', 'name barcode_Number');
  result(res, data, 201);
}));
router.put('/maintenance/:id', protect, wrap(async (req, res) => {
  const equipmentIds = await Equipment.distinct('_id');
  const data = await Maintenance.findOneAndUpdate(
    { _id: req.params.id, equipment: { $in: equipmentIds } },
    { status: req.body.status, completedAt: req.body.status === 'completed' ? new Date() : undefined, cost: req.body.cost },
    { new: true, runValidators: true }
  ).populate('equipment', 'name barcode_Number');
  if (!data) return res.status(404).json({ success: false, message: 'ไม่พบงานซ่อม' });
  if (data.status === 'completed') {
    const equipment = await Equipment.findById(data.equipment._id);
    const nextDate = new Date(data.completedAt);
    nextDate.setMonth(nextDate.getMonth() + (equipment.maintenanceIntervalMonths || 12));
    equipment.status = 'active';
    equipment.lastInspectionDate = data.completedAt;
    equipment.nextInspectionDate = nextDate;
    await equipment.save();
  }
  result(res, data);
}));

router.post('/inquiries', wrap(async (req, res) => {
  const { kind, name, organization, email, phone, message, equipmentCode, preferredDate } = req.body;
  const data = await Inquiry.create({ kind, name, organization, email, phone, message, equipmentCode, preferredDate });
  result(res, { id: data._id, status: data.status }, 201);
}));
router.get('/inquiries', protect, wrap(async (req, res) => {
  result(res, await Inquiry.find().sort({ createdAt: -1 }).limit(200));
}));

router.get('/insights', protect, wrap(async (req, res) => {
  const items = await Equipment.find().populate(equipmentPopulate);
  const now = new Date();
  const days = (date) => Math.ceil((new Date(date) - now) / 86400000);
  const data = items.map((item) => {
    const dueInDays = item.nextInspectionDate ? days(item.nextInspectionDate) : null;
    const replacementInDays = item.expectedReplacementDate ? days(item.expectedReplacementDate) : null;
    const risk = item.condition === 'poor' || (dueInDays !== null && dueInDays < 0) || (replacementInDays !== null && replacementInDays < 0) ? 'high'
      : item.condition === 'watch' || (dueInDays !== null && dueInDays <= 30) || (replacementInDays !== null && replacementInDays <= 180) ? 'medium' : 'low';
    return {
      equipment: item,
      dueInDays,
      replacementInDays,
      risk,
      reason: risk === 'high' ? 'สภาพควรตรวจสอบหรือถึงกำหนดดูแล/เปลี่ยน'
        : risk === 'medium' ? 'ใกล้รอบตรวจหรือช่วงเปลี่ยนทดแทน'
          : 'ยังไม่พบเงื่อนไขเร่งด่วน'
    };
  }).sort((a, b) => ({ high: 0, medium: 1, low: 2 })[a.risk] - ({ high: 0, medium: 1, low: 2 })[b.risk]);
  result(res, data);
}));

module.exports = router;
