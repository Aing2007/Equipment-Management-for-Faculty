const Room = require('../models/Room');
const mongoose = require('mongoose');
const NO_DEPARTMENT = new mongoose.Types.ObjectId('000000000000000000000000');
const scope = (req) => req.user.role === 'admin' ? {} : { department: req.user.department || NO_DEPARTMENT };

// @desc    ดึงข้อมูลห้องทั้งหมด
// @route   GET /api/v1/rooms
// @access  Private
exports.getRooms = async (req, res, next) => {
    try {
        const rooms = await Room.find(scope(req)).populate('department', 'name code');
        res.status(200).json({
            success: true,
            count: rooms.length,
            data: rooms
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    ดึงข้อมูลห้องตาม ID
// @route   GET /api/v1/rooms/:id
// @access  Private
exports.getRoom = async (req, res, next) => {
    try {
        const room = await Room.findOne({ _id: req.params.id, ...scope(req) }).populate('department', 'name code');
        if (!room) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลห้องนี้' });
        }
        res.status(200).json({ success: true, data: room });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    สร้างห้องใหม่
// @route   POST /api/v1/rooms
// @access  Private (เฉพาะ personnel)
exports.createRoom = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin' && !req.user.department) {
            return res.status(403).json({ success: false, message: 'บัญชียังไม่ได้สังกัดหน่วยงาน' });
        }
        const room = await Room.create({
            ...req.body,
            department: req.user.role === 'admin' ? req.body.department : req.user.department
        });
        res.status(201).json({
            success: true,
            data: room
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    แก้ไขข้อมูลห้อง
// @route   PUT /api/v1/rooms/:id
// @access  Private (เฉพาะ personnel)
exports.updateRoom = async (req, res, next) => {
    try {
        const updates = { ...req.body };
        if (req.user.role !== 'admin') delete updates.department;
        const room = await Room.findOneAndUpdate({ _id: req.params.id, ...scope(req) }, updates, {
            new: true,
            runValidators: true
        });

        if (!room) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลห้องนี้' });
        }

        res.status(200).json({ success: true, data: room });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    ลบห้อง
// @route   DELETE /api/v1/rooms/:id
// @access  Private (เฉพาะ personnel)
exports.deleteRoom = async (req, res, next) => {
    try {
        const room = await Room.findOneAndDelete({ _id: req.params.id, ...scope(req) });

        if (!room) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลห้องนี้' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
