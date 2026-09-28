# EMF — Faculty Asset

เว็บจัดการครุภัณฑ์สำหรับคณะ ภาควิชา และห้องปฏิบัติการ ขณะนี้เปิดใช้งานเฉพาะหน้าเข้าสู่ระบบและระบบภายใน

## สิ่งที่ทำได้

- หน้าเว็บไซต์แนะนำฟีเจอร์ ราคา และฟอร์มติดต่อยังเก็บไว้ใน `front/src/public/PublicPage.jsx` แต่ซ่อนจาก route ชั่วคราว
- ระบบภายในสำหรับค้นหาและสแกนรหัสบาร์โค้ด/Smart Tag, เพิ่มและแก้ไขครุภัณฑ์
- บันทึกการย้ายห้อง/หน่วยงาน พร้อมประวัติย้อนหลัง
- กำหนดและปิดงานซ่อมบำรุง พร้อมอัปเดตรอบตรวจครั้งถัดไป
- สมัครบัญชี เข้าสู่ระบบ และรีเซ็ตรหัสผ่านสำหรับผู้ใช้ทั่วไป
- หน้าวิเคราะห์ความเสี่ยงด้วยกฎจากสภาพและวันที่บันทึกไว้ (ยังไม่ใช่โมเดล AI ที่ผ่านการฝึก) หากไม่ระบุวันเปลี่ยนทดแทน ระบบสมมติอายุใช้งาน 5 ปี
- AI chatbot ค้นคืนข้อมูลครุภัณฑ์และงานซ่อมจาก MongoDB แล้วใช้ OpenRouter สร้างคำตอบ

## เริ่มใช้งาน

ต้องมี Node.js, npm และ MongoDB

### 1. Backend

```powershell
cd EMF
Copy-Item .env.example .env
```

แก้ค่า `MONGO_URI`, `JWT_SECRET` และ `OPENROUTER_API_KEY` ใน `EMF/.env` จากนั้น:

```dotenv
OPENROUTER_API_KEY=ใส่_api_key_ของคุณ
```

`OPENROUTER_MODEL` เป็นตัวเลือกเพิ่มเติม หากไม่ระบุจะใช้ `openai/gpt-4o-mini` ข้อมูลที่ค้นคืนจาก MongoDB จะถูกส่งไป OpenRouter เพื่อสร้างคำตอบ จึงควรตั้งค่าและใช้งานตามนโยบายข้อมูลของหน่วยงาน

```powershell
npm install
npm run seed
npm run dev
```

สมัครบัญชีได้จากหน้าเข้าสู่ระบบ API เริ่มต้นที่ `http://localhost:5001` คำสั่ง `npm run seed` ทำเฉพาะ migration ชื่อครุภัณฑ์เดิม ไม่เพิ่มบัญชีหรือข้อมูลตัวอย่าง

การรีเซ็ตรหัสผ่านต้นแบบใช้ Username และรหัสผ่านใหม่สองครั้งโดยไม่มีการยืนยันเจ้าของบัญชี ห้ามใช้กับระบบจริงหรือข้อมูลที่ต้องปกป้องจนกว่าจะเพิ่มการยืนยันตัวตน เช่น OTP ทางอีเมล

ทดสอบ backend ด้วย `npm test` ภายในโฟลเดอร์ `EMF`

### 2. Frontend ระหว่างพัฒนา

เปิดอีกเทอร์มินัล:

```powershell
cd front
npm install
npm run dev
```

เปิด `http://localhost:3003` เพื่อไปหน้าเข้าสู่ระบบ Vite proxy เส้นทาง `/api` ไปที่ `http://localhost:5001` โดยสามารถกำหนด `EMF_API_TARGET` เพื่อเปลี่ยนปลายทางได้

### 3. Build เพื่อให้ EMF backend ให้บริการหน้าเว็บ

```powershell
cd front
npm run build
cd ..\EMF
npm start
```

จากนั้นเปิด `http://localhost:5001`

## การจัดเก็บข้อมูล

หน้า Workspace อ่านและเขียนข้อมูลจาก MongoDB ผ่าน backend เท่านั้น ไม่ใช้ข้อมูลตัวอย่างใน frontend ทุกบัญชีที่เข้าสู่ระบบมีสิทธิ์เดียวกันและเข้าถึงข้อมูลร่วมกันทั้งหมด

## โครงสร้าง

- `front/`: React + Vite UI
- `EMF/`: Express + Mongoose API
- `backend/`: ตัวอย่าง backend รุ่นเก่า ไม่ได้ใช้โดย frontend ใหม่นี้

## API หลัก

`/api/v1/auth` (`register`, `login`, `reset-password`, `me`), `/api/v1/equipments`, `/api/v1/rooms`, `/api/v1/departments`, `/api/v1/movements`, `/api/v1/maintenance`, `/api/v1/insights`, `/api/v1/inquiries`, `/api/v1/assistant/chat`

ฟอร์มสาธารณะใช้ `POST /api/v1/inquiries` ส่วนข้อมูลภายในต้องส่ง JWT แบบ Bearer

## เอกสารรับช่วงงาน

เริ่มที่ [HANDOFF.md](HANDOFF.md) สำหรับภาพรวมและลิงก์ไปเอกสาร frontend, API/MongoDB, chatbot/AI วิเคราะห์ และขั้นตอนนำ demo ออกหรือเปิดหน้า public ในอนาคต
