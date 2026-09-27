const departments = [
  { _id: 'd1', code: 'ENG', name: 'คณะวิศวกรรมศาสตร์', kind: 'faculty' },
  { _id: 'd2', code: 'CPE', name: 'ภาควิชาวิศวกรรมคอมพิวเตอร์', kind: 'department', parent: { _id: 'd1', name: 'คณะวิศวกรรมศาสตร์' } },
  { _id: 'd3', code: 'EE', name: 'ภาควิชาวิศวกรรมไฟฟ้า', kind: 'department', parent: { _id: 'd1', name: 'คณะวิศวกรรมศาสตร์' } },
  { _id: 'd4', code: 'LAB-A', name: 'ห้องปฏิบัติการระบบอัจฉริยะ', kind: 'laboratory', parent: { _id: 'd2', name: 'ภาควิชาวิศวกรรมคอมพิวเตอร์' } }
];
const rooms = [
  { _id: 'r1', room_code: 'ENG-401', name: 'ห้องปฏิบัติการระบบอัจฉริยะ', building: 'อาคารวิศวกรรม', floor: '4', purpose: 'ห้องปฏิบัติการ', department: 'd4' },
  { _id: 'r2', room_code: 'ENG-302', name: 'ห้องคอมพิวเตอร์', building: 'อาคารวิศวกรรม', floor: '3', purpose: 'ห้องเรียน', department: 'd2' },
  { _id: 'r3', room_code: 'ENG-210', name: 'ห้องอุปกรณ์กลาง', building: 'อาคารวิศวกรรม', floor: '2', purpose: 'จัดเก็บ', department: 'd1' },
  { _id: 'r4', room_code: 'EE-205', name: 'ห้องวงจรไฟฟ้า', building: 'อาคารไฟฟ้า', floor: '2', purpose: 'ห้องปฏิบัติการ', department: 'd3' }
];
const eq = (id, name, type, year, department, room, status = 'active', condition = 'good', due = '2026-11-15', replacement = '2029-06-01') => ({
  _id: id, name, type, year_input: year, barcode_Number: id, department, room,
  status, condition, nextInspectionDate: due, expectedReplacementDate: replacement,
  maintenanceIntervalMonths: 12, user: { _id: 'u1', name_sur: 'เจ้าหน้าที่คณะ' }
});
const equipments = [
  eq('EMF-2567-0012', 'เครื่องคอมพิวเตอร์ตั้งโต๊ะ Dell OptiPlex', 'คอมพิวเตอร์', 2024, departments[1], rooms[1]),
  eq('EMF-2566-0043', 'กล้องจุลทรรศน์ Olympus CX23', 'อุปกรณ์ห้องปฏิบัติการ', 2023, departments[3], rooms[0], 'active', 'watch', '2026-10-08', '2028-05-01'),
  eq('EMF-2565-0081', 'เครื่องฉายภาพ Epson EB-X06', 'โสตทัศนูปกรณ์', 2022, departments[0], rooms[2], 'maintenance', 'poor', '2026-09-20', '2027-03-01'),
  eq('EMF-2567-0115', 'เครื่องวิเคราะห์สัญญาณ Keysight', 'เครื่องมือวัด', 2024, departments[2], rooms[3], 'active', 'good', '2026-12-04', '2030-01-01'),
  eq('EMF-2566-0214', 'โน้ตบุ๊ก Lenovo ThinkPad', 'คอมพิวเตอร์', 2023, departments[1], rooms[1], 'active', 'good', '2026-10-28', '2028-10-01'),
  eq('EMF-2564-0038', 'เครื่องพิมพ์ HP LaserJet', 'สำนักงาน', 2021, departments[0], rooms[2], 'active', 'watch', '2026-09-29', '2027-02-01'),
  eq('EMF-2567-0164', 'ชุดทดลองไมโครคอนโทรลเลอร์', 'อุปกรณ์ห้องปฏิบัติการ', 2024, departments[3], rooms[0]),
  eq('EMF-2565-0172', 'ออสซิลโลสโคป Tektronix', 'เครื่องมือวัด', 2022, departments[2], rooms[3], 'active', 'good', '2026-11-02', '2029-02-01')
];
const movements = [
  { _id: 'm1', equipment: equipments[1], fromRoom: rooms[2], toRoom: rooms[0], reason: 'ย้ายเข้าห้องปฏิบัติการ', movedBy: { name_sur: 'เจ้าหน้าที่คณะ' }, movedAt: '2026-09-23T10:00:00Z' },
  { _id: 'm2', equipment: equipments[4], fromRoom: rooms[2], toRoom: rooms[1], reason: 'เตรียมใช้งานภาคเรียนใหม่', movedBy: { name_sur: 'เจ้าหน้าที่คณะ' }, movedAt: '2026-09-19T08:30:00Z' },
  { _id: 'm3', equipment: equipments[2], fromRoom: rooms[1], toRoom: rooms[2], reason: 'ส่งตรวจซ่อม', movedBy: { name_sur: 'เจ้าหน้าที่คณะ' }, movedAt: '2026-09-16T13:15:00Z' }
];
const maintenance = [
  { _id: 'mt1', equipment: equipments[2], kind: 'repair', status: 'in_progress', description: 'ตรวจสอบระบบภาพและเปลี่ยนหลอดฉาย', scheduledAt: '2026-09-24', cost: 0 },
  { _id: 'mt2', equipment: equipments[1], kind: 'inspection', status: 'scheduled', description: 'ตรวจสอบเลนส์และระบบแสง', scheduledAt: '2026-10-08', cost: 0 },
  { _id: 'mt3', equipment: equipments[5], kind: 'preventive', status: 'scheduled', description: 'ทำความสะอาดและตรวจลูกกลิ้ง', scheduledAt: '2026-09-29', cost: 0 }
];
const users = [
  { _id: 'u1', name_sur: 'เจ้าหน้าที่คณะ', username: 'staff.eng', role: 'personnel', department: departments[0] },
  { _id: 'u2', name_sur: 'ผู้ตรวจประเมิน', username: 'review.cpe', role: 'evaluator', department: departments[1] },
  { _id: 'u3', name_sur: 'ผู้ใช้งานห้องปฏิบัติการ', username: 'lab.member', role: 'assessee', department: departments[3] }
];
export const demoSeed = { departments, rooms, equipments, movements, maintenance, inquiries: [], users };
export const cloneDemo = () => structuredClone(demoSeed);
