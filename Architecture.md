# Equipment Management for Faculty (EMF) Architecture

เอกสารนี้รวบรวมสถาปัตยกรรมและพฤติกรรมที่ตรวจพบจากไฟล์ใน repository ณ วันที่ 27 กันยายน 2026 จุดประสงค์คือให้ผู้พัฒนาหรือ AI agent รับช่วงงานต่อได้โดยใช้เอกสารนี้เป็นจุดเริ่มต้น แต่ source code ปัจจุบันเป็นข้อเท็จจริงสุดท้ายเมื่อเอกสารไม่ตรงกัน

## ขอบเขตและหลักการอ่าน

- ข้อมูลในเอกสารนี้มาจากไฟล์ใน repository นี้เท่านั้น ไม่มีการอนุมานว่ามี deployment, MongoDB instance, CI, test suite, service หรือข้อมูล production นอกเหนือจากที่ source ระบุ
- Repository มีไฟล์ `EMF/.env` ที่ถูก ignore โดย Git เอกสารนี้ไม่บันทึกค่าในไฟล์นั้น และไม่ควรแนบหรือ commit ค่า secret
- `.env.example` เป็นแม่แบบที่มีค่าตัวอย่าง ไม่ใช่หลักฐานว่าค่าเหล่านั้นใช้ได้กับทุกเครื่องหรือ production
- การสำรวจไฟล์ไม่นับ dependency ภายใน `node_modules`, build output ใน `dist` หรือข้อมูล Git ภายใน `.git` เป็น source project เพราะเป็น generated/vendor data
- ไฟล์ PNG เป็น binary asset จึงบันทึกตำแหน่งและการอ้างอิงจาก source เท่าที่ตรวจสอบได้ ไม่ถอดรายละเอียดพิกเซลหรือ metadata ที่ไม่เกี่ยวกับการทำงาน
- `package-lock.json` เป็น npm lockfile สำหรับการติดตั้ง dependency แบบ reproducible รายละเอียด dependency ระดับ direct อ่านจาก `package.json`; lockfile มี dependency tree ที่สร้างโดย npm
- เมื่อเอกสารเดิมกล่าวถึงการเชื่อมต่อฐานข้อมูล ให้ตรวจ `EMF/server.js` ปัจจุบันก่อนเสมอ: ตอนตรวจ source มีการคอมเมนต์ทั้ง `dotenv.config({ path: ...'.env.example' })` และ `connectDB()` ไว้ โดยบรรทัดที่ทำงานจริงคือ `dotenv.config()`

## ภาพรวมระบบ

EMF เป็นระบบจัดการครุภัณฑ์สำหรับคณะ ภาควิชา และห้องปฏิบัติการ ประกอบด้วย React frontend, Express/Mongoose API รุ่นปัจจุบัน และ MongoDB ที่กำหนดผ่าน environment variable ระบบมีโหมดตัวอย่างใน browser ซึ่งไม่ใช้ API หรือฐานข้อมูล และยังมี backend รุ่นเก่าอยู่ใน `backend/` ซึ่งไม่ใช่ backend ที่ frontend ปัจจุบันเรียกใช้

```text
Browser
  └─ React 19 + React Router 7, built/served by Vite 6
       ├─ demo mode: sessionStorage flag + clone of front/src/demoData.js
       └─ live mode: fetch /api/v1/* + JWT in localStorage (emf_token)
            ├─ development: Vite proxy /api -> http://localhost:5000
            └─ production build: Express serves front/dist if that directory exists
                 └─ EMF Express 5 routes -> Mongoose 9 models -> MongoDB

Separate, legacy example:
  backend/server.js (Express 4, in-memory equipment array, unrelated API paths)
```

ใน source ปัจจุบันของ `EMF/server.js` มี `connectDB` import ไว้แต่คำสั่งเรียกใช้ถูกคอมเมนต์ ดังนั้น server จะเริ่ม Express และรายงานพอร์ตโดยไม่เรียก MongoDB จากไฟล์นี้ ส่วน `GET /api/health` ตอบ `{ "status": "ok" }` โดยไม่ได้ตรวจ readiness ของฐานข้อมูล การเรียก API ที่ query Mongoose จึงไม่ควรถูกเข้าใจว่าเชื่อม DB สำเร็จเพียงเพราะ health endpoint ตอบได้

## โครงสร้าง repository และหน้าที่ของไฟล์

```text
.
├── .gitignore
├── Architecture.md
├── README.md
├── HANDOFF.md
├── TechStack.png
├── backend/                         # backend ตัวอย่างรุ่นเก่า ไม่ใช่ API ปัจจุบันของ frontend
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
├── docs/                            # เอกสารรับช่วงงานตามหัวข้อ
│   ├── HANDOFF_AI.md
│   ├── HANDOFF_API_DATABASE.md
│   ├── HANDOFF_FRONTEND.md
│   └── HANDOFF_GO_LIVE.md
├── EMF/                             # Express/Mongoose backend ปัจจุบัน
│   ├── .env                         # local ignored configuration; ไม่รวมค่าไว้ในเอกสาร
│   ├── .env.example                 # ตัวอย่างตัวแปร environment
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   ├── seeder.js
│   ├── config/db.js
│   ├── controllers/
│   │   ├── auth.js
│   │   ├── equipments.js
│   │   └── rooms.js
│   ├── middleware/auth.js
│   ├── models/
│   │   ├── Department.js
│   │   ├── Equipment.js
│   │   ├── Inquiry.js
│   │   ├── Maintenance.js
│   │   ├── Movement.js
│   │   ├── Room.js
│   │   └── User.js
│   └── routes/
│       ├── auth.js
│       ├── equipments.js
│       ├── operations.js
│       └── rooms.js
└── front/                           # React/Vite frontend
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js
    ├── public/
    │   ├── favicon.svg
    │   └── lab-hero.png
    └── src/
        ├── api.js
        ├── demoData.js
        ├── main.jsx
        ├── styles.css
        ├── public/PublicPage.jsx    # component เก็บไว้แต่ไม่ได้ผูก route ปัจจุบัน
        └── workspace/
            ├── ChatbotMock.jsx
            ├── LoginPage.jsx
            └── Workspace.jsx
```

### ไฟล์ระดับ root

- `.gitignore`: ignore `node_modules/`, `dist/`, `.playwright-cli/`, `.env` และ `.env.*`; ยกเว้น `.env.example` จากการ ignore
- `README.md`: คำอธิบายผลิตภัณฑ์และคู่มือเริ่มใช้งานสั้น ปัจจุบันตัวอย่างคำสั่งเป็น PowerShell จึงไม่ใช่ syntax สำหรับ macOS โดยตรง
- `HANDOFF.md`: สารบัญเอกสารรับช่วงงาน สรุปสถานะระบบ, source map, แนวทางแก้โค้ดและขอบเขต MOCK/RULE-BASED
- `Architecture.md`: เอกสารสถาปัตยกรรมนี้
- `TechStack.png`: binary PNG ที่อยู่ root; ไม่พบการอ้างอิงจาก source หรือเอกสารที่ค้นในรอบตรวจนี้

### เอกสารใน `docs/`

- `docs/HANDOFF_AI.md`: แยก chatbot mock ออกจาก analytics แบบ rule-based, อธิบาย risk thresholds, schema date behavior, ข้อเสนอ endpoint/chatbot และเกณฑ์พัฒนา AI ในอนาคต ข้อเสนอในเอกสารเป็นแผน ไม่ใช่ implementation
- `docs/HANDOFF_API_DATABASE.md`: endpoint, response envelope, role/scope, schema, seed side effects, known backend limitations และรายการงานก่อน production
- `docs/HANDOFF_FRONTEND.md`: route, screen behavior, form-to-API map, demo mode, public page ที่ซ่อน, responsive notes และ QA checklist
- `docs/HANDOFF_GO_LIVE.md`: checklist สำหรับขอบเขต product, ถอด demo, เปิด public, เตรียม DB/API/AI และ verification gate

เอกสาร handoff เหล่านี้เป็นบริบทประกอบ ไม่ได้แทน source ปัจจุบัน ตัวอย่างความต่างที่พบใน snapshot นี้: handoff กล่าวถึง `connectDB()` ใน `EMF/server.js` แต่ source ปัจจุบันคอมเมนต์คำเรียกดังกล่าวไว้

### Package manifests และ lockfiles

- `EMF/package.json`: CommonJS backend ปัจจุบัน; scripts คือ `start: node server.js`, `dev: node --watch server.js`, `seed: node seeder.js`. Direct dependencies: `bcryptjs ^3.0.3`, `cors ^2.8.6`, `dotenv ^17.4.2`, `express ^5.2.1`, `jsonwebtoken ^9.0.3`, `mongoose ^9.10.1`
- `EMF/package-lock.json`: npm lockfile ที่สอดคล้องกับ manifest ของ EMF
- `front/package.json`: ESM React frontend; scripts คือ `dev: vite --host 0.0.0.0`, `build: vite build`, `preview: vite preview --host 0.0.0.0`. Direct dependencies: `lucide-react ^0.468.0`, `react ^19.0.0`, `react-dom ^19.0.0`, `react-router-dom ^7.0.0`; dev dependencies `@vitejs/plugin-react ^4.3.4`, `vite ^6.0.0`
- `front/package-lock.json`: npm lockfile สำหรับ frontend
- `backend/package.json`: backend เก่า ใช้ `express ^4.21.2`, scripts `start` และ `dev` เรียก `server.js`
- `backend/package-lock.json`: npm lockfile ของ backend เก่า ไม่ใช่ dependency lockfile ของ EMF backend
- ไม่มี `engines` field ใน manifests ที่ตรวจ ไม่ได้ระบุ Node.js version เฉพาะใน package metadata

## Frontend

### Entry, routing และ document shell

- `front/index.html`: HTML shell ภาษาไทย ตั้ง viewport/theme/description/title, โหลด `/favicon.svg`, เชื่อม Google Fonts (`IBM Plex Sans Thai`, `Inter`) และ mount React ที่ `#root`; ใช้ `/src/main.jsx` เป็น module entry
- `front/src/main.jsx`: สร้าง React root และ `BrowserRouter`; route `/` กับ wildcard ใช้ `EntryRedirect`; `/login` render `LoginPage`; `/app/*` render `Workspace`; `EntryRedirect` ส่งไป `/app` เมื่อ `sessionStorage.emf_demo === '1'` หรือมี token ใน localStorage ไม่เช่นนั้นส่ง `/login`; `PublicPage` ไม่ได้ import หรือ mount
- `front/vite.config.js`: เปิด dev server port 3000 และ proxy prefix `/api` ไป `http://localhost:5000` โดยไม่ได้ rewrite path
- `front/src/styles.css`: global stylesheet ไฟล์เดียวสำหรับหน้า public, chatbot, login และ workspace; รวม responsive media queries ที่ 1180px, 860px, 650px และ reduced-motion rule สำหรับ chatbot

### API client และ token

`front/src/api.js` กำหนด localStorage key `emf_token` และ export `getToken`, `setToken`, `clearToken`, `api(path, options)`:

1. สร้าง request ไปยัง `/api/v1${path}`
2. เพิ่ม `Content-Type: application/json` เมื่อมี `options.body`
3. แนบ `Authorization: Bearer <token>` เมื่อมี token ใน localStorage
4. แปลง network failure เป็นข้อความว่าเชื่อมต่อ server ไม่ได้
5. พยายาม parse JSON; หาก response ไม่ใช่ JSON จะแยกข้อความตาม `response.ok`
6. ปฏิเสธเมื่อ HTTP status ไม่ ok หรือ payload มี `success` เป็น false
7. คืน `payload.data ?? payload`; กรณี login จึงได้ object ที่มี `token` เพราะ login ไม่มี `data` envelope

Token อยู่ใน `localStorage` จึงคงอยู่ข้าม reload; demo flag อยู่ใน `sessionStorage` และข้อมูล demo อยู่ใน React state เท่านั้น

### Login และ workspace

- `front/src/workspace/LoginPage.jsx`: form username/password ส่ง `POST /auth/login`; เก็บ `response.token` ด้วย `setToken`, ลบ demo flag แล้ว navigate ไป `/app`; แสดง error และ busy state; ปุ่ม “ดูตัวอย่างระบบ” ตั้ง `emf_demo=1` และเข้า `/app` โดยไม่เรียก backend; ไม่มี register form แม้ backend มี public register endpoint
- `front/src/workspace/Workspace.jsx`: component ใหญ่รวม layout, state, page components, forms, scanner, data loading, mutations และ client-side risk rules
- `front/src/workspace/ChatbotMock.jsx`: floating mock chat ที่ render ใน workspace ทุกหน้า ไม่ใช่ service สนทนาจริง

`Workspace.jsx` แบ่ง component/function ภายในไฟล์ดังนี้:

- Constants/helpers: `menu`, status/condition/task/kind labels, `date`, `idOf`, `daysUntil`, `riskFor`, `initialData`, `isDemo`
- Shared UI: `Status`, `SectionHeader`, `Modal`, `Empty`, `AssetTable`
- Screens: `Overview`, `Assets`, `Movements`, `Maintenance`, `Departments`, `UserAccess`, `Insights`, `Requests`
- Dialog/detail workflows: `AssetForm`, `AssetDetail`, `ScanModal`
- Root state/orchestration: `Workspace`

#### หน้าภายในและพฤติกรรม

- `/app` หรือ `/app/overview`: dashboard metric 4 ค่า (จำนวนครุภัณฑ์, active, maintenance, ควรติดตาม), ตาราง 6 รายการล่าสุด, รอบตรวจภายใน 45 วันสูงสุด 4 รายการ, movement ล่าสุด 2 รายการ
- `/app/assets`: ค้นหาใน client-side จาก name, barcode, Smart Tag ID หรือ type; filter department/status; เปิดรายละเอียด; เพิ่ม/แก้ไขตาม role; มี scan dialog; ไม่มี pagination เพราะ frontend ใช้รายการที่โหลดทั้งหมด
- Asset detail: แสดงข้อมูลหลัก, ผู้รับผิดชอบ, condition, ปี, tag, inspection/replacement dates และ movement/maintenance history ที่ถูกโหลดแล้ว
- Asset form: ส่ง name, type, barcode, smartTagId, serialNumber, year_input, department/room เฉพาะสร้าง, status, condition, dates, maintenance interval, expected lifespan และ notes; UI ไม่มีช่อง acquiredAt/purchasePrice/user; edit ปิด field department/room เพื่อบังคับใช้ movement workflow
- Scanner: ค้นจากรหัสในรายการที่ frontend โหลด; รองรับ manual/keyboard-wedge input; ใช้ browser `BarcodeDetector` หากมีและ camera permission ได้ โดยขอ `code_128`, `qr_code`, `ean_13`; สแกนเทียบ barcode หรือ `smartTagId` แบบไม่สนตัวพิมพ์เล็กใหญ่; ไม่มีการสร้าง scan event
- `/app/movements`: แสดงประวัติ; form ส่ง `{equipment, toRoom, reason}`; backend สร้าง movement และปรับตำแหน่งปัจจุบัน
- `/app/maintenance`: สร้าง inspection/repair/preventive task สถานะ scheduled หรือ in_progress; action complete ส่ง PUT status completed และ cost
- `/app/departments`: แสดง departments และ rooms; admin เพิ่ม department; admin/personnel เพิ่ม room; ภายในหน้าเดียวกันมี user list; admin เปลี่ยน role/department
- `/app/insights`: แสดง high/medium/low และวันตรวจ/เปลี่ยน พร้อมข้อความบอกชัดว่าเป็นกฎคำนวณ ไม่ใช่ trained AI; คำนวณจาก assets ที่โหลดใน browser ไม่ได้เรียก GET `/insights`
- `/app/requests`: แสดง inquiries แบบ read-only; ไม่มี action เปลี่ยน status; `load()` กลืน error ของ `/inquiries` เป็น array ว่าง เพื่อรองรับ role ที่ถูกปฏิเสธ
- menu ถูก render ทุก role; ปุ่มแก้ไขถูกควบคุมด้วย UI ตาม role แต่ security enforcement ต้องมาจาก backend

`Workspace.load()` ทำ `Promise.all` กับ `/auth/me`, `/equipments`, `/rooms`, `/departments`, `/movements`, `/maintenance`, `/inquiries`, `/users`; `/inquiries` เป็นรายการเดียวที่ catch error และคืน `[]`. ถ้า error มีข้อความ 401/token จะลบ token และนำกลับ login; error อื่นแสดงใน UI. ข้อมูลจะถูกโหลดใหม่หลัง mutation live mode

#### Demo mode

- `front/src/demoData.js` export `demoSeed` และ `cloneDemo()` ซึ่งใช้ `structuredClone`
- fixture มี 4 departments, 4 rooms, 8 equipments, 3 movements, 3 maintenance tasks, 3 users และ 0 inquiries
- demo user ถูกตั้งใน client เป็น `{ name_sur: 'ผู้ชมตัวอย่าง', role: 'admin' }`; fixture users ไม่มี password/token
- save/update/complete ใน demo ปรับ React state ใน memory เท่านั้น ไม่มี fetch หรือ MongoDB; reload สร้าง clone ใหม่จาก fixture; flag เก็บใน sessionStorage
- demo mutation จำลอง side effects ไม่ครบเท่า backend เช่น movement ปรับ room แต่ไม่ปรับ department; maintenance complete ปรับสถานะ task/asset บางส่วนแต่ไม่เลียนแบบ date recalculation ฝั่ง backend
- Browser demo fixture คนละชุดกับ seed script ใน MongoDB

### หน้า public ที่เก็บไว้แต่ไม่เปิด route

`front/src/public/PublicPage.jsx` เป็นหน้า public/marketing แบบ single page ประกอบด้วย hero, benefits, features, audience, comparison, pricing และ contact; component ไม่ถูก import โดย `main.jsx` จึงเข้าไม่ได้จาก route ปัจจุบัน หน้าแสดงข้อมูลราคา/claim ตามข้อความใน component ซึ่งต้องตรวจให้ตรงกับบริการจริงก่อนเปิด public

`InquiryForm` ในไฟล์นี้มี form `demo` กับ `service` ที่เรียก `POST /api/v1/inquiries` แบบไม่แนบ tokenก็ได้; demo ส่ง name, organization, email, phone, preferredDate, message; service ส่ง name, organization, email, phone, equipmentCode, message. API ต้องมี MongoDB พร้อมใช้งานเพื่อบันทึกข้อมูล

### Chatbot mock

`ChatbotMock.jsx` แสดง floating trigger/panel ใน workspace; panel มี greeting และ suggestions ที่เป็นข้อความ ไม่ได้กดทำงาน; ช่องพิมพ์เป็น `<div aria-disabled="true">`, send เป็นเพียง icon ไม่มี handler/network/LLM/storage. ปิดด้วย X หรือ Escape; component จัดการ focus ไป close button เมื่อเปิดและคืน focus ไป trigger เมื่อปิด. ไม่มี chatbot route/service ใน backend

### Static assets

- `front/public/favicon.svg`: SVG mark ที่อ้างจาก `front/index.html`
- `front/public/lab-hero.png`: อ้างผ่าน CSS เป็นภาพ hero ของหน้า public และภาพพื้น login; login ใช้ asset นี้แม้ public route ถูกซ่อน
- `TechStack.png`: root binary; ไม่พบ source reference ในรอบตรวจ

## Backend ปัจจุบัน: `EMF/`

### Bootstrap และ configuration

`EMF/server.js` สร้าง Express app, `express.json()`, `cors()` แบบ default, mount route modules และเพิ่ม health endpoint:

| Mount | Router/handler | URL prefix |
| --- | --- | --- |
| `/api/v1/auth` | `routes/auth.js` | auth |
| `/api/v1/equipments` | `routes/equipments.js` | equipments |
| `/api/v1/rooms` | `routes/rooms.js` | rooms |
| `/api/v1` | `routes/operations.js` | departments/users/movements/maintenance/inquiries/insights |
| `/api/health` | inline handler | health |

หลัง API mounts ถ้ามี `front/dist` จึง mount static files และ SPA fallback สำหรับ path ที่ไม่ขึ้นต้น `/api/`; API paths ที่ไม่ match จะไป `next()` แทนส่ง React index. Port คือ `process.env.PORT || 5000`.

Environment behavior ที่ source ปัจจุบันเปิดใช้:

- `dotenv.config()` ใน `EMF/server.js` ใช้ dotenv default path `.env` จาก process working directory; ขั้นตอนใน README ระบุให้ `cd EMF` ก่อน run
- `dotenv.config({ path: path.join(__dirname, '.env.example') })` มีอยู่เป็นบรรทัด comment เท่านั้น ไม่ทำงาน
- `connectDB()` import มาจาก `config/db.js` แต่ invocation ถูกคอมเมนต์; จึงไม่มีการเชื่อม DB จาก bootstrap ใน snapshot นี้
- `PORT` ใช้ fallback 5000
- `EMF/seeder.js` ยังคง `require('dotenv').config()` โดย default `.env`
- `.env.example` แสดงชื่อตัวแปร `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`; ไม่ควรคัดลอก secret จริงลงไฟล์ตัวอย่าง

`EMF/config/db.js` export `connectDB()`: เรียก `mongoose.connect(process.env.MONGO_URI)`, log host เมื่อสำเร็จ; catch แล้ว log error และ `process.exit(1)`. จะไม่มีผลจนกว่าจะมี call site ที่เรียกใช้งาน

### Authentication และ authorization

`EMF/middleware/auth.js` export:

- `protect`: อ่าน `Authorization: Bearer <JWT>`, verify ด้วย `JWT_SECRET`, query User จาก decoded ID แล้วแนบ `req.user`; ไม่มี token/invalid/expired/inactive user ตอบ 401
- `authorize(...roles)`: ตรวจ `req.user.role`; role ไม่ตรงตอบ 403

JWT ถูกสร้างใน `User.getSignedJwtToken()` payload มี `id` และ `role`, expiry ใช้ `JWT_EXPIRES_IN || '30d'`. อย่างไรก็ตาม `protect` ใช้ user ที่ query จาก DB เป็น `req.user`; permission ไม่ควรยึด role เก่าที่ฝังใน token

Role ที่ schema อนุญาต: `admin`, `personnel`, `evaluator`, `assessee`.

- `admin`: scope ของ asset/room/operations เป็น `{}` จึงดูข้าม department ได้; เพิ่ม department และแก้ user role/department ได้
- `personnel`: อ่าน/เขียน asset, room, movement, maintenance ใน department เดียวกันตาม ObjectId; สร้าง department route ผ่าน role filter ได้ก่อน แต่ handler ปฏิเสธ non-admin; สร้าง room ได้ใน department ตัวเอง; อ่าน inquiries ได้ทุกองค์กรเพราะ query ไม่ใส่ department scope
- `evaluator`, `assessee`: route ที่มี `protect` แต่ไม่มี `authorize` อ่านข้อมูลตาม exact department ใน handlers ที่ใช้ scope; ไม่มี write routes ภายในที่อนุญาต; inquiry endpoint ปฏิเสธ
- account ที่ไม่มี department จะได้ filter department เป็น sentinel ObjectId `000000000000000000000000` ใน handlers ที่ scope; public register สร้าง `assessee` โดยไม่กำหนด department
- department parent tree เก็บใน schema แต่ permission scope ไม่สืบทอด parent/children
- `GET /departments` คืนทุก department ให้ user ที่ authenticate ได้

Role authorization และ record scope เป็นคนละชั้น: `authorize` เช็ก role อย่างเดียว ส่วน scope อยู่ใน controllers หรือ `operations.js` handlers

### API route inventory

Base API คือ `/api/v1`; success ส่วนใหญ่เป็น `{ success: true, data, count? }`, error เป็น `{ success: false, message }`. `count` ถูกแนบเมื่อ handler ใช้ `result()` กับ array หรือ controller ระบุเอง. Register/login คืน `{ success: true, token }` โดยไม่มี `data`. Frontend `api()` unwrap `data ?? payload`.

| Method + path | Access ตาม middleware | Behavior |
| --- | --- | --- |
| `POST /auth/register` | Public | รับ username/password/name_sur, สร้าง role `assessee`, คืน JWT (201) |
| `POST /auth/login` | Public | ตรวจ username/password และ bcrypt hash, คืน JWT |
| `GET /auth/me` | JWT | คืน User ปัจจุบัน |
| `GET /equipments?search=` | JWT | assets ตาม scope; search regex แบบ escaped/trim/สูงสุด 100 chars บน name/barcode/smartTagId; populate user/department/room; sort createdAt desc |
| `GET /equipments/:id` | JWT | asset ตาม scope พร้อม populate; ไม่พบ 404 |
| `POST /equipments` | admin/personnel + scope checks | สร้าง asset; non-admin ต้องมี department และถูกบังคับ department/user จาก token; room ถ้ามีต้องมีจริงและตรวจ department consistency; 201 |
| `PUT /equipments/:id` | admin/personnel + scope | update field ตาม schema; ปฏิเสธถ้ามี key `room` หรือ `department`; non-admin ไม่สามารถแก้ user; validators เปิด |
| `DELETE /equipments/:id` | admin/personnel + scope | ลบ asset; ไม่มี cascade ใน Movement/Maintenance |
| `GET /rooms` | JWT | rooms ตาม scope, populate department |
| `GET /rooms/:id` | JWT | room ตาม scope |
| `POST /rooms` | admin/personnel + scope checks | สร้าง room; non-admin ต้องมี department และ department มาจาก `req.user` |
| `PUT /rooms/:id` | admin/personnel + scope | update room; non-admin ไม่สามารถเปลี่ยน department |
| `DELETE /rooms/:id` | admin/personnel + scope | ลบ room; ไม่มีการตรวจ/cascade refs ที่อาจอ้าง room |
| `GET /departments` | JWT | ทุก department, populate parent, sort kind/name |
| `POST /departments` | admin/personnel middleware แล้ว admin-only handler | สร้าง department; personnel ได้ 403 ใน handler |
| `GET /users` | JWT | admin เห็นทุก user; role อื่น exact department scope; ไม่เลือก password |
| `PUT /users/:id` | admin | อัปเดต role และ/หรือ department; validators เปิด |
| `GET /movements` | JWT | movements ของ equipment ใน scope; populate; sort movedAt desc; limit 200 |
| `POST /movements` | admin/personnel | ตรวจ equipment ใน scope, target room และห้าม room เดิม; non-admin ห้ามย้ายข้าม department; สร้าง history และเปลี่ยน `Equipment.room/department` |
| `GET /maintenance` | JWT | maintenance ของ equipment ใน scope; populate; sort scheduledAt desc; limit 200 |
| `POST /maintenance` | admin/personnel | ตรวจ equipment ใน scope; สร้าง task; ถ้า in_progress เปลี่ยน equipment status เป็น maintenance |
| `PUT /maintenance/:id` | admin/personnel | update status/cost ของ maintenance ที่อ้าง equipment ใน scope; completed จะ set completedAt และปรับ equipment status/date |
| `POST /inquiries` | Public | สร้าง inquiry kind demo/service จาก request body; คืน id/status (201) |
| `GET /inquiries` | admin/personnel | คืน inquiries ทั้งหมดทุกหน่วยงาน sort createdAt desc limit 200 |
| `GET /insights` | JWT | คำนวณ risk rules สำหรับ equipment ใน scope; คืน equipment, dueInDays, replacementInDays, risk, reason |
| `GET /api/health` | Public | คืน `{ status: 'ok' }`; ไม่ตรวจ DB readiness |

Routes ของ auth/equipment/room อยู่ใน routers แยกและ controller บางส่วนอยู่ใน `controllers/`; operations ทั้งหมดอยู่ใน `routes/operations.js`. `wrap()` ใน operations จับ exception แล้วส่ง HTTP 400; status ที่ handler ตั้งเองยังคงตามนั้น. Controllers มี status handling ต่างกันตาม endpoint

ไม่มี endpoint สำหรับ chatbot, notification, aggregate dashboard, pagination, export, เปลี่ยน/ปิด inquiry, edit/delete department หรือ register ผ่าน UI

### รายละเอียด business flows

#### Equipment create/update

- Schema บังคับ `name`, `type`, `barcode_Number`, `year_input`; barcode uppercase/trim/unique
- ใน create, non-admin ต้องมี department; department/user ที่บันทึกถูก override ให้ตาม role/request policy ไม่เชื่อ department ที่ client ส่งสำหรับ non-admin
- ถ้าส่ง room จะตรวจว่าห้องมีอยู่ และถ้าทั้ง room.department กับ asset department มีค่า จะตรวจว่าเป็น department เดียวกัน
- update ไม่อนุญาตให้เปลี่ยน `room` หรือ `department`; การย้ายต้องผ่าน movement เพื่อมี history
- delete asset ไม่ลบ Movement/Maintenance ที่อ้าง asset

#### Movement

Request ต้องมี `equipment`, `toRoom`, `reason`; backend ค้นหา equipment ใน scope และ target room; ปฏิเสธถ้าปลายทางเป็นห้องเดิม. Department ปลายทางใช้ `room.department || req.body.toDepartment || equipment.department`. Non-admin ที่มี department ถูกปฏิเสธเมื่อ department ปลายทางไม่ตรง. จากนั้นสร้าง `Movement` พร้อม from/to room/department, reason, movedBy แล้วบันทึก equipment.room และ equipment.department.

การสร้าง Movement และบันทึก Equipment เป็นคนละ operation ไม่มี transaction; ถ้า save equipment ล้มเหลวหลัง create movement อาจเหลือ history ที่ไม่ตรงกับตำแหน่งปัจจุบัน

#### Maintenance

Create รับ equipment/kind/scheduledAt/description และ fields เพิ่มเติม; backend เติม `createdBy`. ถ้า status `in_progress`, เปลี่ยน equipment.status เป็น `maintenance`. Update route รับ status และ cost; เมื่อ status เป็น `completed` จะตั้ง `completedAt=now`, หา equipment, set `status='active'`, set `lastInspectionDate=completedAt`, คำนวณ `nextInspectionDate` ด้วย maintenanceIntervalMonths หรือ 12 แล้ว save.

การเปลี่ยน maintenance และ equipment ไม่ atomic; ไม่มี state-transition validation/idempotency ใน code ที่ตรวจ; completion ตั้ง asset เป็น active โดยตรง จึงอาจทับสถานะอื่น

#### Inquiry

Schema รับ kind `demo|service`, name, organization, email, message เป็น required; email lowercase; optional phone/equipmentCode/preferredDate; status เริ่ม `new`. Public form ปัจจุบันซ่อนจาก router แต่ POST endpoint ยัง mount. ไม่มี CAPTCHA/rate limit/email notification/assignment/status update endpoint ใน source

## MongoDB models

ทุก Mongoose schema ใช้ timestamps จึงมี `createdAt` และ `updatedAt`. Reference fields เป็น ObjectId; unique fields พึ่ง MongoDB indexes ที่ Mongoose สร้างจาก schema.

### Department (`EMF/models/Department.js`)

- `code`: string required, unique, uppercase, trim
- `name`: string required, trim
- `kind`: required enum `faculty|department|laboratory`
- `parent`: optional ref `Department`
- `description`: optional trimmed string
- ไม่มี validation บังคับ parent tree consistency

### Room (`EMF/models/Room.js`)

- `room_code`: required, unique, trimmed string
- `name`, `building`: optional trimmed string
- `floor`, `purpose`: required string
- `department`: optional ref `Department`

### Equipment (`EMF/models/Equipment.js`)

- Required: `name`, `type`, `barcode_Number`, `year_input`
- `name`, `type`: trimmed strings
- `barcode_Number`: required, unique, trimmed, uppercase
- `smartTagId`: optional trimmed, unique sparse string
- Optional: `serialNumber`, `acquiredAt`, `purchasePrice` (min 0), `lastInspectionDate`, `nextInspectionDate`, `expectedReplacementDate`, `notes`
- `status`: `active|maintenance|retired|lost`, default active
- `condition`: `good|watch|poor`, default good
- refs: `department -> Department`, `room -> Room`, `user -> User`
- `maintenanceIntervalMonths`: min 1, default 12
- `expectedLifespanYears`: min 1, default 5
- pre-validate hook: ถ้าไม่มี `nextInspectionDate`, ใช้ `lastInspectionDate || acquiredAt || Date.now()` แล้วบวก maintenance interval; ถ้าไม่มี `expectedReplacementDate` และมี `acquiredAt` หรือ `year_input`, ใช้ acquiredAt หรือ `new Date(year_input, 0, 1)` แล้วบวก lifespan
- `year_input` ใน hook ถูกตีความเป็น ค.ศ.; update ผ่าน `findOneAndUpdate` ไม่ทำงานเหมือน document `save` lifecycle hook

### User (`EMF/models/User.js`)

- `username`: required, unique, trimmed
- `password`: required, `select:false`
- `name_sur`: required, trimmed
- `role`: `admin|personnel|evaluator|assessee`, default assessee
- `department`: optional ref `Department`
- pre-save: ถ้า password modified จะ hash ด้วย bcryptjs salt rounds 10
- method `matchPassword()` เปรียบเทียบ bcrypt hash
- method `getSignedJwtToken()` สร้าง JWT จาก id/role โดยใช้ `JWT_SECRET` และ expiry env หรือ 30d

### Movement (`EMF/models/Movement.js`)

- required refs: `equipment -> Equipment`, `toRoom -> Room`, `movedBy -> User`
- optional refs: `fromRoom -> Room`, `fromDepartment/toDepartment -> Department`
- `reason`: required trimmed; `movedAt` default Date.now

### Maintenance (`EMF/models/Maintenance.js`)

- required refs: `equipment -> Equipment`, `createdBy -> User`
- `kind`: required enum `inspection|repair|preventive`
- `status`: enum `scheduled|in_progress|completed`, default scheduled
- `description`: required trimmed; `scheduledAt`: required date; `completedAt`: optional date
- `cost`: min 0, default 0; `provider`: optional trimmed string

### Inquiry (`EMF/models/Inquiry.js`)

- `kind`: required enum `demo|service`
- `name`, `organization`, `email`, `message`: required trimmed strings; email lowercase
- optional `phone`, `equipmentCode`, `preferredDate`
- `status`: `new|contacted|closed`, default new

Unique fields ที่ประกาศใน schema: User.username, Department.code, Room.room_code, Equipment.barcode_Number และ Equipment.smartTagId แบบ sparse. ไม่มี migration framework หรือ index เฉพาะ search/date/scope ที่ประกาศเพิ่มใน source ที่ตรวจ

## Risk/insights calculation

Risk ไม่ใช่ trained AI/ML; logic มีสองชุดที่แยกกัน:

- Backend `GET /api/v1/insights` ใน `EMF/routes/operations.js`
- Frontend `riskFor()` และ `Insights` ใน `Workspace.jsx`; dashboard ก็ใช้ `riskFor()` สำหรับ metric “ควรติดตาม”

ทั้งสองใช้ threshold หลักเดียวกัน แต่หน้า insights ปัจจุบันคำนวณฝั่ง frontend และไม่ได้เรียก endpoint backend:

```text
dueInDays = ceil((nextInspectionDate - now) / 86,400,000 ms); null ถ้าไม่มีวัน
replacementInDays = ceil((expectedReplacementDate - now) / 86,400,000 ms); null ถ้าไม่มีวัน

high   ถ้า condition == poor หรือ dueInDays < 0 หรือ replacementInDays < 0
medium ถ้าไม่ high และ (condition == watch หรือ dueInDays <= 30 หรือ replacementInDays <= 180)
low    กรณีอื่น

เรียง high -> medium -> low
```

การคำนวณใช้เวลาปัจจุบันของ browser/server และ `Math.ceil`; ผลใกล้ขอบวันอาจต่างกันตามเวลาที่คำนวณ/timezone. Dashboard list “ใกล้ถึงรอบตรวจ” ใช้เกณฑ์ `<=45 วัน` ซึ่งต่างจาก medium threshold `<=30 วัน`. ไม่มี notification scheduler. ไม่ควรอธิบายผลนี้ว่าเป็น probability, failure prediction หรือโมเดล AI ที่ผ่านการฝึก

## Legacy backend: `backend/`

`backend/server.js` เป็น Express 4 example แยกจาก EMF API:

- ตั้ง port จาก `process.env.PORT || 3000`; ไม่โหลด dotenv
- serve ไฟล์จาก `front/` โดยตรง ไม่ใช่ Vite build และไม่ใช้ Mongoose
- มี in-memory array ตัวอย่าง 3 equipment (Projector, Laptop, Camera)
- `GET /api/health`, `GET /api/equipment`, `GET /api/equipment/:id`, `POST /api/equipment`; POST ตรวจ name/status/location/owner และ push เข้า array ใน memory
- catch-all `GET *` ส่ง `front/index.html`
- ไม่มี authentication, persistent database หรือ relation กับ `/api/v1` ที่ frontend ปัจจุบันเรียก

อย่าใช้ `backend/server.js` เป็น backend สำหรับ React UI ปัจจุบันโดยไม่ออกแบบ adapter/API ใหม่; paths และ data contract ต่างจาก EMF backend

## การเริ่มระบบตาม repository

ข้อกำหนดใน README ระบุ Node.js, npm และ MongoDB. สำหรับ macOS shell ใช้ `cp` แทน PowerShell `Copy-Item`; เริ่มจาก root:

```bash
cd EMF
cp -n .env.example .env
npm install
npm run seed
npm run dev
```

`cp -n` ไม่เขียนทับ `.env` ที่มีอยู่. `.env` ควรตั้ง `MONGO_URI`, `JWT_SECRET` และ `SEED_ADMIN_PASSWORD`; seed ต้องเชื่อม DB. เปิด frontend อีก terminal:

```bash
cd front
npm install
npm run dev
```

Vite ใช้ `http://localhost:3000` และ proxy `/api` ไปพอร์ต 5000. อย่างไรก็ตาม คำสั่ง `npm run dev` ของ EMF ใช้ source `server.js` ปัจจุบัน ซึ่งมีทั้ง dotenv default `.env` และ `connectDB()` call ถูกคอมเมนต์ตาม snapshot นี้: backend เปิดพอร์ต แต่ไม่มี MongoDB connection จาก bootstrap. ต้องตรวจ/แก้ source นี้ก่อนคาดหวัง live API ที่ query DB จะทำงาน

Production build ตาม package scripts: รัน `npm run build` ใน `front/`, แล้วรัน `npm start` ใน `EMF/`; Express จะ serve `front/dist` ถ้ามี directory นั้น. Health endpoint คือ `http://localhost:5000/api/health`. หากไม่มี MongoDB และต้องการดู UI ให้เปิด `/login` แล้วใช้ “ดูตัวอย่างระบบ”; demo mode ไม่ยืนยันการทำงานของ API/DB

ขั้นตอนด้านบนเป็นการถอดคำสั่งจาก manifest/README และ source ที่ตรวจ ไม่ใช่ผลยืนยันว่า MongoDB หรือ integration ทำงานในเครื่องใดเครื่องหนึ่ง

## Seed behavior

`EMF/seeder.js` รันด้วย `npm run seed`; โหลด `.env` ด้วย dotenv default แล้ว connect `MONGO_URI`. พฤติกรรม:

1. หา Equipment ที่ไม่มี `name` หรือ name เป็น string ว่าง แล้วเติมจาก `type || barcode_Number`
2. upsert department `ENG` (faculty), `CPE` (department ใต้ ENG), room `ENG-302` ด้วย `$setOnInsert`; ไม่ overwrite record ที่มีอยู่
3. ถ้า `SEED_ADMIN_USERNAME` และ `SEED_ADMIN_PASSWORD` มีค่า จะสร้าง admin สังกัด faculty ถ้า username ยังไม่มี; ถ้ามีแล้วไม่เปลี่ยน password
4. ถ้า Equipment collection ว่างและหา admin ตาม env ได้ จะสร้าง asset ตัวอย่าง `EMF-2569-0001` หนึ่งรายการ โดย year_input ใช้ปีปัจจุบันจาก `new Date().getFullYear()`
5. disconnect เมื่อจบ; catch แสดง error และตั้ง process exit code 1

Seed MongoDB นี้คนละชุดกับ `front/src/demoData.js`; seed ไม่สร้าง 8 browser demo assets

## Security, consistency และข้อจำกัดที่ตรวจพบ

- `cors()` ใช้ default ไม่มี allowlist ใน source ที่ตรวจ
- public endpoints: register, login, inquiry POST; ไม่มี rate limit/CAPTCHA ในโค้ด
- password ถูก hash ด้วย bcryptjs; password field ไม่ถูก select โดยปริยาย
- JWT ถูกเก็บฝั่ง browser ใน localStorage; API wrapper แนบ Bearer token
- `GET /departments` เปิดให้ user authenticated เห็นทุก department; `GET /inquiries` ให้ admin/personnel เห็น inquiries ทุกองค์กรโดยไม่มี scope filter
- department scope เป็น ObjectId เดียว ไม่สืบทอด parent
- equipment/room list ไม่มี pagination; movement/maintenance/inquiry จำกัด 200 records ล่าสุด
- movement และ maintenance updates เขียนหลาย documents โดยไม่มี transaction; asset deletion ไม่มี cascade; room deletion ไม่ตรวจ references
- `connectDB()` ไม่ได้ถูก await ก่อน `app.listen` แม้เมื่อเปิด call กลับมา; ปัจจุบัน call ถูก comment ทั้งบรรทัด
- `/api/health` ไม่ใช่ readiness check
- ไม่มี automated test files, CI workflow หรือ migration scripts ใน inventory ที่ตรวจ
- UI demo mutations ไม่เท่ากับ live backend side effects; demo test ผ่านไม่ใช่หลักฐานว่า permission/database behavior ถูกต้อง
- ไม่มี LLM provider, chatbot endpoint, conversation database, predictive model, training pipeline, notification scheduler หรือ inference deployment ใน repository
- Scanner พึ่ง browser `BarcodeDetector` และ camera permission; มี manual entry fallback; ไม่มี NFC/RFID protocol integration

รายการนี้เป็นข้อเท็จจริงที่เห็นจาก source ที่อ่าน ไม่ใช่ข้อสรุปว่า deployment ภายนอกไม่มีมาตรการดังกล่าว

## แนวทางให้ AI agent รับช่วงงาน

1. อ่านไฟล์ที่เป็นเจ้าของ behavior ก่อนแก้ และตรวจ source ล่าสุด โดยเฉพาะ `EMF/server.js` ซึ่งมีการเปลี่ยนแปลงเฉพาะ workspace และยังไม่ควรตีความจาก handoff เก่า
2. ตรวจ `git status` ก่อนแก้; อย่าทับ local `.env` หรือ revert การเปลี่ยนแปลงที่ไม่ใช่ของงานปัจจุบัน
3. อย่าอ่าน/คัดลอกค่า secret จาก `EMF/.env` ลงเอกสาร, log, code, prompt หรือ commit; ใช้ `.env.example` เฉพาะตัวแปรและค่าตัวอย่าง
4. บังคับ role และ department scope ที่ backend ทุก endpoint; การซ่อนปุ่ม frontend ไม่ใช่ authorization
5. หากแก้ movement/maintenance side effect ให้พิจารณาความสอดคล้องข้าม documents และ transaction; เพิ่ม tests เมื่อ repository มีหรือเพิ่ม test setup ตามขอบเขตงาน
6. รักษาป้ายสถานะตามจริง: public page hidden, demo client-only, chatbot mock, insights rule-based; อย่าอ้างเป็นระบบ AI ที่ฝึกแล้ว
7. ถ้าแก้ schema/API/demo/setup ให้ปรับ README และเอกสาร handoff ที่เกี่ยวข้องให้ตรงกับ source
8. ตรวจ frontend ด้วย `npm run build` ใน `front/`; ตรวจ backend ด้วย `node --check server.js` หรือคำสั่งที่ตรงกับการเปลี่ยนแปลง; integration กับ MongoDB ต้องใช้ instance/URI ที่ทำงานจริง
