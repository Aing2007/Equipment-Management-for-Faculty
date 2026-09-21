const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// อ่านไฟล์ .env จาก Root โฟลเดอร์
dotenv.config();

// นำเข้า Models (อ้างอิงตามโฟลเดอร์ models)
const User = require('./models/User');
const Room = require('./models/Room');
const Equipment = require('./models/Equipment');

// เชื่อมต่อ MongoDB Atlas
mongoose.connect(process.env.MONGO_URI);

// ข้อมูลสำหรับลงทะเบียนเริ่มต้น
const users = [
    {
        username: 'admin01',
        password: 'password123',
        name_sur: 'Somchai Jaidee',
        role: 'personnel'
    },
    {
        username: 'evaluator01',
        password: 'password123',
        name_sur: 'Somsak Checkman',
        role: 'evaluator'
    },
    {
        username: 'user01',
        password: 'password123',
        name_sur: 'Sompong Workhard',
        role: 'assessee'
    }
];

const rooms = [
    { room_code: 'R101', floor: '1', purpose: 'Meeting Room' },
    { room_code: 'R202', floor: '2', purpose: 'Server Room' }
];

const seedData = async () => {
    try {
        await User.deleteMany();
        await Room.deleteMany();
        await Equipment.deleteMany();

        console.log('🗑️  Data Cleared...');

        const createdUsers = await User.create(users);
        await Room.create(rooms);

        const createdEquipments = [
            {
                type: 'Laptop',
                year_input: 2024,
                barcode_Number: 'NB-2024-001',
                user: createdUsers[2]._id
            },
            {
                type: 'Monitor',
                year_input: 2023,
                barcode_Number: 'MN-2023-045',
                user: createdUsers[0]._id
            }
        ];

        await Equipment.create(createdEquipments);

        console.log('✅ Data Imported Successfully!');
        process.exit();
    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
        process.exit(1);
    }
};

const deleteData = async () => {
    try {
        await User.deleteMany();
        await Room.deleteMany();
        await Equipment.deleteMany();
        console.log('🗑️  Data Destroyed...');
        process.exit();
    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-i') {
    seedData();
} else if (process.argv[2] === '-d') {
    deleteData();
} else {
    console.log('Please use -i to import or -d to delete data.');
    process.exit();
}