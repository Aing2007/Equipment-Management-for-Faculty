require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Room = require('./models/Room');
const Department = require('./models/Department');
const Equipment = require('./models/Equipment');

async function main() {
  if (!process.env.MONGO_URI) throw new Error('กรุณากำหนด MONGO_URI ใน .env');
  await mongoose.connect(process.env.MONGO_URI);

  // Older equipment records used "type" as the visible name.
  const legacy = await Equipment.find({ $or: [{ name: { $exists: false } }, { name: '' }] });
  for (const item of legacy) {
    await Equipment.updateOne({ _id: item._id }, { $set: { name: item.type || item.barcode_Number } });
  }

  const faculty = await Department.findOneAndUpdate(
    { code: 'ENG' },
    { $setOnInsert: { code: 'ENG', name: 'คณะวิศวกรรมศาสตร์', kind: 'faculty' } },
    { upsert: true, new: true }
  );
  const department = await Department.findOneAndUpdate(
    { code: 'CPE' },
    { $setOnInsert: { code: 'CPE', name: 'ภาควิชาวิศวกรรมคอมพิวเตอร์', kind: 'department', parent: faculty._id } },
    { upsert: true, new: true }
  );
  const room = await Room.findOneAndUpdate(
    { room_code: 'ENG-302' },
    { $setOnInsert: { room_code: 'ENG-302', name: 'ห้องคอมพิวเตอร์', building: 'อาคารวิศวกรรม', floor: '3', purpose: 'ห้องเรียน', department: department._id } },
    { upsert: true, new: true }
  );

  if (process.env.SEED_ADMIN_USERNAME && process.env.SEED_ADMIN_PASSWORD) {
    const existing = await User.findOne({ username: process.env.SEED_ADMIN_USERNAME });
    if (!existing) {
      await User.create({
        username: process.env.SEED_ADMIN_USERNAME,
        password: process.env.SEED_ADMIN_PASSWORD,
        name_sur: process.env.SEED_ADMIN_NAME || 'ผู้ดูแลระบบ',
        role: 'admin',
        department: faculty._id
      });
      console.log('สร้างบัญชีผู้ดูแลระบบแล้ว');
    } else {
      console.log('มีบัญชีผู้ดูแลระบบนี้อยู่แล้ว จึงไม่แก้ไขรหัสผ่าน');
    }
  }

  if (await Equipment.countDocuments() === 0 && process.env.SEED_ADMIN_USERNAME) {
    const admin = await User.findOne({ username: process.env.SEED_ADMIN_USERNAME });
    if (admin) {
      await Equipment.create({
        name: 'เครื่องคอมพิวเตอร์ตั้งโต๊ะ', type: 'คอมพิวเตอร์',
        barcode_Number: 'EMF-2569-0001', year_input: new Date().getFullYear(),
        department: department._id, room: room._id, user: admin._id,
        nextInspectionDate: new Date(new Date().setMonth(new Date().getMonth() + 6))
      });
      console.log('เพิ่มครุภัณฑ์ตัวอย่าง 1 รายการแล้ว');
    }
  }
  console.log(`เสร็จสิ้น: ปรับชื่อข้อมูลเดิม ${legacy.length} รายการ`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
