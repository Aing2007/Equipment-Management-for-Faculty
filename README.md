# EMF — Faculty Asset

เว็บจัดการครุภัณฑ์สำหรับคณะ ภาควิชา และห้องปฏิบัติการ ขณะนี้เปิดใช้งานเฉพาะหน้าเข้าสู่ระบบและระบบภายใน

## สิ่งที่ทำได้

- หน้าเว็บไซต์แนะนำฟีเจอร์ ราคา และฟอร์มติดต่อยังเก็บไว้ใน `front/src/public/PublicPage.jsx` แต่ซ่อนจาก route ชั่วคราว
- ระบบภายในสำหรับค้นหาและสแกนรหัสบาร์โค้ด/Smart Tag, เพิ่มและแก้ไขครุภัณฑ์
- บันทึกการย้ายห้อง/หน่วยงาน พร้อมประวัติย้อนหลัง
- กำหนดและปิดงานซ่อมบำรุง พร้อมอัปเดตรอบตรวจครั้งถัดไป
- จัดการคณะ ภาควิชา ห้องปฏิบัติการ ห้อง และสิทธิ์ผู้ใช้ตามสังกัด
- หน้าวิเคราะห์ความเสี่ยงด้วยกฎจากสภาพและวันที่บันทึกไว้ (ยังไม่ใช่โมเดล AI ที่ผ่านการฝึก) หากไม่ระบุวันเปลี่ยนทดแทน ระบบสมมติอายุใช้งาน 5 ปี
- AI chatbot เป็น **mock layout** แบบปุ่มลอยในระบบภายใน สำหรับนักพัฒนานำไปต่อ

## เริ่มใช้งาน

ต้องมี Node.js, npm และ MongoDB

### 1. Backend

```powershell
cd EMF
Copy-Item .env.example .env
```

แก้ค่า `MONGO_URI`, `JWT_SECRET` และรหัสผ่าน admin ใน `EMF/.env` จากนั้น:

```powershell
npm install
npm run seed
npm run dev
```

API เริ่มต้นที่ `http://localhost:5000` ตัว seed จะเพิ่มข้อมูลเริ่มต้นโดยไม่ลบข้อมูลเดิม และย้ายชื่อครุภัณฑ์รุ่นเก่าที่ไม่มี `name`

### 2. Frontend ระหว่างพัฒนา

เปิดอีกเทอร์มินัล:

```powershell
cd front
npm install
npm run dev
```

เปิด `http://localhost:3000` เพื่อไปหน้าเข้าสู่ระบบ Vite proxy เส้นทาง `/api` ไปที่ EMF backend

### 3. Build เพื่อให้ EMF backend ให้บริการหน้าเว็บ

```powershell
cd front
npm run build
cd ..\EMF
npm start
```

จากนั้นเปิด `http://localhost:5000`

## ทดลอง UI โดยยังไม่มี MongoDB

เปิด frontend ที่ `http://localhost:3000/login` แล้วเลือก **ดูตัวอย่างระบบ** ข้อมูลตัวอย่างอยู่ในหน่วยความจำของหน้าเว็บและจะเริ่มใหม่เมื่อรีโหลด ฟอร์มติดต่อ/แจ้งซ่อมบนเว็บไซต์สาธารณะถูกซ่อนไว้ชั่วคราวและต้องใช้ backend ที่เชื่อม MongoDB จริงเมื่อนำกลับมาใช้

## สิทธิ์

- `admin`: เห็นทุกหน่วยงาน จัดการหน่วยงาน ห้อง ผู้ใช้ และครุภัณฑ์
- `personnel`: จัดการครุภัณฑ์ ห้อง การย้าย และงานซ่อมภายในหน่วยงานที่สังกัด
- `evaluator` / `assessee`: ดูข้อมูลภายในหน่วยงานที่สังกัด
- ผู้สมัครใหม่มีสิทธิ์ `assessee` และยังไม่สังกัดหน่วยงานจนกว่า admin จะกำหนด

## โครงสร้าง

- `front/`: React + Vite UI
- `EMF/`: Express + Mongoose API
- `backend/`: ตัวอย่าง backend รุ่นเก่า ไม่ได้ใช้โดย frontend ใหม่นี้

## API หลัก

`/api/v1/auth`, `/api/v1/equipments`, `/api/v1/rooms`, `/api/v1/departments`, `/api/v1/users`, `/api/v1/movements`, `/api/v1/maintenance`, `/api/v1/insights`, `/api/v1/inquiries`

ฟอร์มสาธารณะใช้ `POST /api/v1/inquiries` ส่วนข้อมูลภายในต้องส่ง JWT แบบ Bearer

## เอกสารรับช่วงงาน

เริ่มที่ [HANDOFF.md](HANDOFF.md) สำหรับภาพรวมและลิงก์ไปเอกสาร frontend, API/MongoDB, chatbot/AI วิเคราะห์ และขั้นตอนนำ demo ออกหรือเปิดหน้า public ในอนาคต
