const Equipment = require('../models/Equipment');

// @desc    ดึงรายการอุปกรณ์ทั้งหมด (พร้อมข้อมูล User ที่ครอบครอง)
// @route   GET /api/v1/equipments
// @access  Private
exports.getEquipments = async (req, res, next) => {
    try {
        const equipments = await Equipment.find().populate({
            path: 'user',
            select: 'name_sur role username'
        });

        res.status(200).json({
            success: true,
            count: equipments.length,
            data: equipments
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    ดึงข้อมูลอุปกรณ์ตาม ID
// @route   GET /api/v1/equipments/:id
// @access  Private
exports.getEquipment = async (req, res, next) => {
    try {
        const equipment = await Equipment.findById(req.params.id).populate({
            path: 'user',
            select: 'name_sur role'
        });

        if (!equipment) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลอุปกรณ์นี้' });
        }

        res.status(200).json({ success: true, data: equipment });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    เพิ่มอุปกรณ์ใหม่
// @route   POST /api/v1/equipments
// @access  Private (เฉพาะ personnel)
exports.createEquipment = async (req, res, next) => {
    try {
        const equipment = await Equipment.create(req.body);
        res.status(201).json({
            success: true,
            data: equipment
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    แก้ไขข้อมูลอุปกรณ์
// @route   PUT /api/v1/equipments/:id
// @access  Private (เฉพาะ personnel)
exports.updateEquipment = async (req, res, next) => {
    try {
        const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!equipment) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลอุปกรณ์นี้' });
        }

        res.status(200).json({ success: true, data: equipment });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    ลบอุปกรณ์
// @route   DELETE /api/v1/equipments/:id
// @access  Private (เฉพาะ personnel)
exports.deleteEquipment = async (req, res, next) => {
    try {
        const equipment = await Equipment.findByIdAndDelete(req.params.id);

        if (!equipment) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลอุปกรณ์นี้' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};