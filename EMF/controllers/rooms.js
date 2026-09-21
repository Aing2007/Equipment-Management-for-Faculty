const Room = require('../models/Room');

// @desc    ดึงข้อมูลห้องทั้งหมด
// @route   GET /api/v1/rooms
// @access  Private
exports.getRooms = async (req, res, next) => {
    try {
        const rooms = await Room.find();
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
        const room = await Room.findById(req.params.id);
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
        const room = await Room.create(req.body);
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
        const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
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
        const room = await Room.findByIdAndDelete(req.params.id);

        if (!room) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลห้องนี้' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};