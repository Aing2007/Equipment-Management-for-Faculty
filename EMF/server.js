const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

// อ่านค่าจากไฟล์ .env.example
//dotenv.config({ path: path.join(__dirname, '.env.example') });
dotenv.config();

// เชื่อมต่อฐานข้อมูล MongoDB
//connectDB();

// นำเข้า Routes ให้ตรงตามชื่อโฟลเดอร์ใหม่
const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipments');
const roomRoutes = require('./routes/rooms');
const operationsRoutes = require('./routes/operations');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/equipments', equipmentRoutes);
app.use('/api/v1/rooms', roomRoutes);
app.use('/api/v1', operationsRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const frontendDist = path.join(__dirname, '..', 'front', 'dist');
if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.use((req, res, next) => {
        if (req.path.startsWith('/api/')) return next();
        res.sendFile(path.join(frontendDist, 'index.html'));
    });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
