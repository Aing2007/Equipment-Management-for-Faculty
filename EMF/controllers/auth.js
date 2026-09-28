const User = require('../models/User');

// @desc    ลงทะเบียนผู้ใช้งานใหม่
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
        const password = typeof req.body?.password === 'string' ? req.body.password : '';
        const name_sur = typeof req.body?.name_sur === 'string' ? req.body.name_sur.trim() : '';
        if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(username)) {
            return res.status(400).json({ success: false, message: 'Username ต้องมี 3-40 ตัวอักษร และใช้ a-z, 0-9, จุด, ขีดกลาง หรือขีดล่าง' });
        }
        if (password.length < 8 || password.length > 128) {
            return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีความยาว 8-128 ตัวอักษร' });
        }
        if (!name_sur || name_sur.length > 100) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อไม่เกิน 100 ตัวอักษร' });
        }

        const user = await User.create({ username, password, name_sur });
        sendTokenResponse(user, 201, res);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ success: false, message: 'Username นี้ถูกใช้แล้ว' });
        if (err.name === 'ValidationError') return res.status(400).json({ success: false, message: err.message });
        next(err);
    }
};

// @desc    เข้าสู่ระบบ
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
        const password = typeof req.body?.password === 'string' ? req.body.password : '';

        // ตรวจสอบว่าใส่ username และ password หรือไม่
        if (!username || !password || password.length > 128) {
            return res.status(400).json({
                success: false,
                message: 'กรุณากรอก Username และ Password'
            });
        }

        // ค้นหา User และดึง Password มาตรวจสอบด้วย
        const user = await User.findOne({ username }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Username หรือ Password ไม่ถูกต้อง'
            });
        }

        // ตรวจสอบว่า Password ตรงกันหรือไม่
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Username หรือ Password ไม่ถูกต้อง'
            });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// Prototype recovery: username plus a confirmed new password, without ownership verification.
exports.resetPassword = async (req, res, next) => {
    try {
        const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
        const password = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
        const confirmation = typeof req.body?.confirmPassword === 'string' ? req.body.confirmPassword : '';
        if (!username || password.length < 8 || password.length > 128 || password !== confirmation) {
            return res.status(400).json({ success: false, message: 'กรุณาตรวจ Username และรหัสผ่านใหม่ให้ถูกต้อง (8-128 ตัวอักษร และต้องตรงกัน)' });
        }
        const user = await User.findOne({ username }).select('+password');
        if (!user) return res.status(404).json({ success: false, message: 'ไม่พบ Username นี้' });
        user.password = password;
        await user.save();
        res.json({ success: true, message: 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว กรุณาเข้าสู่ระบบ' });
    } catch (err) {
        next(err);
    }
};

// @desc    ดึงข้อมูลผู้ใช้งานปัจจุบัน (ที่ Login อยู่)
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('username name_sur createdAt');
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Helper Function สำหรับส่ง Response พร้อม JWT Token
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();
    res.status(statusCode).json({
        success: true,
        token
    });
};
