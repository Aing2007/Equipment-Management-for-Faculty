const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. ตรวจสอบ JWT Token (Protect Route)
exports.protect = async (req, res, next) => {
    let token;
    // ดึง Token จาก Header 'Authorization: Bearer <token>'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) return res.status(401).json({ success: false, message: '401: No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // ดึงข้อมูล User (ยกเว้น Password) และแนบไปกับ Request
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) return res.status(401).json({ success: false, message: 'บัญชีผู้ใช้ไม่พร้อมใช้งาน' });
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: '401: Token invalid or expired.' });
    }
};
