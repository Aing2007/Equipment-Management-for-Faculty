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
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: '401: Token invalid or expired.' });
    }
};

// 2. ตรวจสอบสิทธิ์ (Authorization)
exports.authorize = (...roles) => {
    return (req, res, next) => {
        // ตรวจสอบว่า Role ของ User ที่ Login อยู่ (req.user.role) มีสิทธิ์หรือไม่
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `403: Forbidden. Role ${req.user.role} is not authorized.`
            });
        }
        next();
    };
};