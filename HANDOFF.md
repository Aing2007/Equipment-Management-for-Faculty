# EMF handoff — เริ่มอ่านที่นี่

> ตรวจจาก source code ณ 27 กันยายน 2026. เอกสารชุดนี้เป็น source-of-truth สำหรับ AI agent และนักพัฒนาที่รับงานต่อ โดยแยก **สิ่งที่ทำงานแล้ว** ออกจาก **mock / งานที่ยังต้องทำ**. อย่าอนุมานว่ามี service, model, database record หรือ route ใดอยู่จริงนอกเหนือจากที่ระบุในโค้ด.

## 1. อ่านตามงานที่ต้องทำ

| งาน | เอกสาร |
| --- | --- |
| เส้นทางหน้าเว็บ, component, หน้า marketing ที่ซ่อน, demo data | [docs/HANDOFF_FRONTEND.md](docs/HANDOFF_FRONTEND.md) |
| Express API, MongoDB schema, สิทธิ์, seed และผลข้างเคียงของการเขียนข้อมูล | [docs/HANDOFF_API_DATABASE.md](docs/HANDOFF_API_DATABASE.md) |
| Chatbot mock, กฎวิเคราะห์ปัจจุบัน, แนวทางทำ AI จริง | [docs/HANDOFF_AI.md](docs/HANDOFF_AI.md) |
| ขั้นตอนเอา demo ออก / เปิด public site / ตรวจรับก่อนใช้งานจริง | [docs/HANDOFF_GO_LIVE.md](docs/HANDOFF_GO_LIVE.md) |

`README.md` เป็นคู่มือเริ่มต้นแบบสั้น เอกสารชุดนี้ลงรายละเอียดการรับช่วงงาน. ใช้ source code เป็นคำตอบสุดท้ายหากมีการเปลี่ยนโค้ดหลังวันที่ด้านบน.

## 2. ภาพรวมสถานะ

| ส่วน | สถานะปัจจุบัน | แหล่งโค้ด |
| --- | --- | --- |
| Login + ระบบภายใน | ทำงานใน React/Vite; รองรับ demo แบบไม่ต่อ DB หรือ JWT จริงเมื่อ backend พร้อม | `front/src/main.jsx`, `front/src/workspace/` |
| Dashboard, ครุภัณฑ์, การย้าย, งานซ่อม, หน่วยงาน, คำขอ | มี UI และ REST API; สิทธิ์และ scope บังคับที่ backend | `front/src/workspace/Workspace.jsx`, `EMF/routes/` |
| หน้า marketing/public | **ซ่อนจาก router** แต่เก็บ component, CSS และ asset ไว้ | `front/src/public/PublicPage.jsx`, `front/src/styles.css` |
| กล้องสแกน | ใช้ browser `BarcodeDetector` เมื่อรองรับ; มีช่องกรอกรหัสแทน | `ScanModal` ใน `Workspace.jsx` |
| หน้า “AI วิเคราะห์” | เป็น **กฎคำนวณ deterministic** ไม่ใช่ trained ML model | `riskFor` ใน `Workspace.jsx`, `GET /api/v1/insights` |
| Chatbot | **mock layout เท่านั้น**; ไม่มี input ใช้งาน, API, LLM หรือฐานข้อมูลบทสนทนา | `front/src/workspace/ChatbotMock.jsx` |
| MongoDB | มี Mongoose schema และ seed script; เอกสารนี้ **ไม่ได้ยืนยันการเชื่อมต่อ MongoDB จริง** | `EMF/models/`, `EMF/seeder.js` |
| `backend/` | server ตัวอย่างเก่า ไม่ใช่ backend ของ React app ปัจจุบัน | `backend/server.js` |

## 3. โครงสร้างระบบ

```text
Browser (React 19 + Vite 6)
  ├─ /login, /app/*
  ├─ demo: sessionStorage flag + in-memory clone of demoData.js
  └─ real: fetch /api/v1/* + JWT จาก localStorage
       │
       ├─ Vite dev proxy: /api -> localhost:5000
       └─ production: Express serves front/dist และ /api/v1/*
             └─ Express 5 + Mongoose 9 -> MongoDB
```

ไม่มี chatbot service หรือ AI inference service ใน repository นี้. Endpoint `/api/v1/insights` เป็นการคำนวณ rule ใน Express; frontend ปัจจุบันไม่ได้เรียก endpoint นี้ แต่คำนวณซ้ำจากรายการครุภัณฑ์ที่โหลดมา.

## 4. เริ่มระบบในเครื่อง

Prerequisites: Node.js + npm + MongoDB URI ที่ใช้งานได้. สั่งจาก root ของ repository:

```powershell
cd EMF
Copy-Item .env.example .env
# ตั้ง MONGO_URI, JWT_SECRET และ SEED_ADMIN_PASSWORD ใน .env
npm ci
npm run seed
npm run dev
```

เปิดอีก terminal:

```powershell
cd front
npm ci
npm run dev
```

- Frontend dev: `http://localhost:3000` → `/login` หรือ `/app` ตาม session.
- API: `http://localhost:5000`, health: `GET /api/health`.
- ไม่ต่อ MongoDB: เปิด `/login` แล้วกด **ดูตัวอย่างระบบ**; เป็นข้อมูลใน browser เท่านั้น.
- Serve production build: `cd front; npm run build`, จากนั้น `cd ../EMF; npm start` แล้วเปิด `http://localhost:5000`.
- อย่าใช้ `backend/server.js` กับ frontend ใหม่นี้.

`.env` ถูก ignore โดย Git; `.env.example` เป็นเพียงตัวอย่าง อย่าเก็บ secret จริงในเอกสารหรือ commit. `front/dist` และ `node_modules` ถูก ignore.

## 5. Source map สำหรับ AI agent

| ไฟล์/พื้นที่ | หน้าที่ |
| --- | --- |
| `front/src/main.jsx` | Router; public page ถูกถอดจาก route; `/` และ wildcard redirect ไป login/app |
| `front/src/api.js` | fetch wrapper, token ใน `localStorage` key `emf_token`, error handling |
| `front/src/workspace/LoginPage.jsx` | login และปุ่ม demo |
| `front/src/workspace/Workspace.jsx` | ทุกหน้า dashboard, state, forms, scanner, client-side risk rules |
| `front/src/workspace/ChatbotMock.jsx` | floating mock chat; trigger หายเมื่อ panel เปิด |
| `front/src/demoData.js` | ชุดข้อมูล demo ฝั่ง browser |
| `front/src/public/PublicPage.jsx` | marketing page ที่ซ่อน + form demo/service |
| `front/src/styles.css` | global CSS ของ public, login, app และ chat |
| `EMF/server.js` | app setup, routes, static `front/dist` |
| `EMF/routes/operations.js` | department/user/movement/maintenance/inquiry/insights endpoints |
| `EMF/controllers/` | auth, equipment, room business logic |
| `EMF/models/` | Mongoose models, constraints, timestamps |
| `EMF/seeder.js` | idempotent-ish starter data และ legacy name patch |

## 6. กติกาการทำงานต่อ

1. อ่านเอกสารส่วนที่เกี่ยวข้องและตรวจ source code ก่อนแก้.
2. รักษาสถานะ **HIDDEN / MOCK / RULE-BASED** ตามจริงใน UI และเอกสาร; อย่าเรียก heuristic ว่า trained AI.
3. บังคับสิทธิ์และ department scope ที่ backend ทุก endpoint ใหม่; อย่าพึ่งการซ่อนปุ่มใน frontend.
4. ถ้าแก้ schema, endpoint, demo flow หรือ AI contract ให้อัปเดต handoff ส่วนที่เกี่ยวข้องใน PR เดียวกัน.
5. แยกข้อมูล demo ใน browser, seed ของ MongoDB และข้อมูลจริงให้ชัด; ห้ามย้าย demo fixture ไป production DB โดยไม่ตั้งใจ.

## 7. สิ่งที่ยังไม่ได้ยืนยันใน handoff นี้

- ไม่มีหลักฐานว่ามี MongoDB instance, deployment, CI หรือ automated tests ที่พร้อมใช้ใน repository.
- Frontend build ผ่านในการพัฒนารอบก่อน; การตรวจเอกสารรอบนี้ไม่ใช่การทดสอบ integration กับ MongoDB จริง.
- การใช้งานกล้องต้องตรวจบน browser/device ที่รองรับและมี permission จริง.
