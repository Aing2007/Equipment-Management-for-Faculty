const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// อ่านค่าจากไฟล์ .env
dotenv.config();

// เชื่อมต่อฐานข้อมูล MongoDB
connectDB();

// นำเข้า Routes ให้ตรงตามชื่อโฟลเดอร์ใหม่
const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipments');
const roomRoutes = require('./routes/rooms');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/equipments', equipmentRoutes);
app.use('/api/v1/rooms', roomRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});