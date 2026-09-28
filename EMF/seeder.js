require('dotenv').config();
const mongoose = require('mongoose');
const Equipment = require('./models/Equipment');

async function migrateLegacyEquipmentNames() {
  if (!process.env.MONGO_URI) throw new Error('กรุณากำหนด MONGO_URI ใน .env');
  await mongoose.connect(process.env.MONGO_URI);
  const legacy = await Equipment.find({ $or: [{ name: { $exists: false } }, { name: '' }] });
  for (const item of legacy) {
    await Equipment.updateOne({ _id: item._id }, { $set: { name: item.type || item.barcode_Number } });
  }
  console.log(`ปรับชื่อครุภัณฑ์จากข้อมูลเดิม ${legacy.length} รายการ โดยไม่มีการเพิ่มข้อมูลตัวอย่าง`);
}

migrateLegacyEquipmentNames()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
