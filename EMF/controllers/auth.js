const User = require('../models/User');

// @desc    ลงทะเบียนผู้ใช้งานใหม่
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { username, password, name_sur, role } = req.body;

        // สร้าง User ใหม่
        const user = await User.create({
            username,
            password,
            name_sur,
            role
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    เข้าสู่ระบบ
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // ตรวจสอบว่าใส่ username และ password หรือไม่
        if (!username || !password) {
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
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    ดึงข้อมูลผู้ใช้งานปัจจุบัน (ที่ Login อยู่)
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
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