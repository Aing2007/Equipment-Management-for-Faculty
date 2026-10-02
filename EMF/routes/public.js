const express = require('express');
const Equipment = require('../models/Equipment');
const Room = require('../models/Room');
const Department = require('../models/Department');
const Movement = require('../models/Movement');
const Maintenance = require('../models/Maintenance');

const router = express.Router();

router.get('/workspace', async (req, res) => {
  try {
    const [equipments, rooms, departments] = await Promise.all([
      Equipment.find()
        .select('_id name type barcode_Number smartTagId year_input status condition department room user maintenanceIntervalMonths expectedLifespanYears lastInspectionDate nextInspectionDate expectedReplacementDate createdAt')
        .populate('user', 'name_sur')
        .populate('department', 'name code kind')
        .populate('room', 'room_code name building floor')
        .sort({ createdAt: -1 }),
      Room.find().select('_id room_code name building floor department').populate('department', 'name code'),
      Department.find().select('_id code name kind parent').populate('parent', 'name code').sort({ kind: 1, name: 1 })
    ]);
    const equipmentIds = equipments.map(({ _id }) => _id);
    const [movements, maintenance] = await Promise.all([
      Movement.find({ equipment: { $in: equipmentIds } })
        .select('_id equipment fromRoom toRoom reason movedBy movedAt')
        .populate('equipment', 'name barcode_Number')
        .populate('fromRoom toRoom', 'room_code name')
        .populate('movedBy', 'name_sur')
        .sort({ movedAt: -1 }).limit(200),
      Maintenance.find({ equipment: { $in: equipmentIds } })
        .select('_id equipment kind status description scheduledAt completedAt cost')
        .populate('equipment', 'name barcode_Number nextInspectionDate')
        .sort({ scheduledAt: -1 }).limit(200)
    ]);

    res.json({
      success: true,
      data: { equipments, rooms, departments, movements, maintenance }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'โหลดข้อมูลสำหรับผู้เยี่ยมชมไม่สำเร็จ' });
  }
});

module.exports = router;
