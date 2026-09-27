# API และ MongoDB handoff

> ตรวจ source ณ 27 กันยายน 2026. ไม่ได้ยืนยันข้อมูลใน MongoDB instance จริง. ดู [HANDOFF.md](../HANDOFF.md) สำหรับวิธีรัน.

## Runtime และ response contract

- Backend ปัจจุบันคือ `EMF/`: Express 5, Mongoose 9, `jsonwebtoken`, `bcryptjs`. `backend/` เป็นตัวอย่างเก่าคนละระบบ.
- `EMF/server.js` โหลด `.env`, เรียก `connectDB()`, mount routes ที่ `/api/v1/...`, health ที่ `/api/health`; ถ้ามี `front/dist` จะ serve React build และ SPA fallback.
- `EMF/config/db.js` ใช้ `MONGO_URI`. `EMF/.env.example` ระบุ `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN` (default 30d), `PORT` (default 5000), `SEED_ADMIN_*`.
- Authenticated request ส่ง `Authorization: Bearer <JWT>`. `protect` ตรวจ token แล้วโหลด User ปัจจุบันจาก DB; role จาก User record เป็นตัวตัดสินสิทธิ์.
- ปกติ success envelope คือ `{ "success": true, "data": ..., "count": ... }`; `count` มีเมื่อเป็น array ใน `operations.js` และใน GET equipments/rooms. Login/register ต่างออกไป: `{ "success": true, "token": "..." }`. Error ใช้ `{ "success": false, "message": "..." }` พร้อม HTTP status.
- Frontend wrapper ใน `front/src/api.js` คืน `payload.data ?? payload`; ดังนั้น login จะได้ object ที่มี `token` แต่ list endpoints คืน array ตรง.

## Roles และ data scope ที่ใช้งานจริง

| Role | อ่านข้อมูลภายใน | เขียน | หมายเหตุ |
| --- | --- | --- | --- |
| `admin` | assets/rooms/movements/maintenance/users ทุกหน่วยงาน; departments; insights; inquiries | asset/room/movement/maintenance, เพิ่ม department, เปลี่ยน role/department user | สิทธิ์สูงสุดใน API ปัจจุบัน |
| `personnel` | assets/rooms/movements/maintenance/users เฉพาะ `department` ที่ตรง **ObjectId เดียวกัน**; departments ทั้งหมด; insights ตาม scope; inquiries ทั้งหมด | asset/room/movement/maintenance ใน scope | ไม่ได้รวม descendant ของ department tree; GET inquiries ไม่ scoped |
| `evaluator`, `assessee` | ข้อมูลภายในตาม department เดียวกัน, departments ทั้งหมด, insights | ไม่มี write endpoint ภายใน | GET inquiries ถูกปฏิเสธ แต่ frontend ซ่อน error แล้วแสดง list ว่าง |
| ไม่มี department | assets/rooms/movements/maintenance/users เป็นชุดว่างเพราะ filter ใช้ ObjectId sentinel | การสร้าง asset/room ถูกปฏิเสธสำหรับ non-admin | public register สร้าง `assessee` โดยยังไม่มี department |

`authorize` ใน `EMF/middleware/auth.js` ตรวจ role เท่านั้น. Scope หลักสร้างใน equipment/room controllers และ `operations.js`. ไม่ใช่ multi-tenant hierarchy แบบสืบทอด parent; ต้องออกแบบเพิ่มถ้าต้องให้คณะเห็นทุกภาควิชา/ห้องปฏิบัติการใต้สังกัด.

## Endpoint inventory

Base URL: `/api/v1`. `R` = ต้องมี JWT; `W` = `admin|personnel`; `A` = admin; `Public` = ไม่ต้อง JWT.

| Method + path | Access | การทำงาน/ข้อมูลหลัก | Code |
| --- | --- | --- | --- |
| `POST /auth/register` | Public | `{username,password,name_sur}` → สร้าง `assessee` ไม่มี department, คืน JWT | `controllers/auth.js` |
| `POST /auth/login` | Public | `{username,password}` → JWT | `controllers/auth.js` |
| `GET /auth/me` | R | user ปัจจุบัน | `controllers/auth.js` |
| `GET /equipments?search=` | R | รายการใน scope; search name/barcode/smartTag; sort newest | `controllers/equipments.js` |
| `GET /equipments/:id` | R | asset เดียวใน scope พร้อม populate | `controllers/equipments.js` |
| `POST /equipments` | W | สร้าง asset; backend บังคับ department/user ตาม role | `controllers/equipments.js` |
| `PUT /equipments/:id` | W | อัปเดต asset ใน scope; ห้ามส่ง room/department | `controllers/equipments.js` |
| `DELETE /equipments/:id` | W | ลบ asset ใน scope | `controllers/equipments.js` |
| `GET /rooms`, `GET /rooms/:id` | R | ห้องตาม scope | `controllers/rooms.js` |
| `POST /rooms`, `PUT /rooms/:id`, `DELETE /rooms/:id` | W | จัดการห้อง; non-admin ไม่เลือก/เปลี่ยน department เอง | `controllers/rooms.js` |
| `GET /departments` | R | ทุก department พร้อม parent | `routes/operations.js` |
| `POST /departments` | A | เพิ่ม department | `routes/operations.js` |
| `GET /users` | R | admin เห็นทุกคน, อื่น ๆ เห็น department เดียวกัน | `routes/operations.js` |
| `PUT /users/:id` | A | เปลี่ยน `role` และ/หรือ `department` | `routes/operations.js` |
| `GET /movements` | R | 200 รายการล่าสุดของ asset ใน scope | `routes/operations.js` |
| `POST /movements` | W | ย้าย asset ไป room ปลายทาง พร้อมประวัติ | `routes/operations.js` |
| `GET /maintenance` | R | 200 งานล่าสุดของ asset ใน scope | `routes/operations.js` |
| `POST /maintenance` | W | สร้าง inspection/repair/preventive task | `routes/operations.js` |
| `PUT /maintenance/:id` | W | อัปเดต status/cost; เมื่อ completed ปรับ asset | `routes/operations.js` |
| `POST /inquiries` | Public | form `demo` หรือ `service`; คืน `{id,status}` | `routes/operations.js` |
| `GET /inquiries` | W | 200 คำขอล่าสุด **ทุกองค์กร** | `routes/operations.js` |
| `GET /insights` | R | risk rules ต่อ asset ใน scope | `routes/operations.js` |

แยกจาก base นี้มี `GET /api/health` → `{status:"ok"}`. ยังไม่มี API สำหรับ chatbot, notification, dashboard aggregate, edit/delete department, update inquiry status, pagination หรือ export.

## Write flow และ side effects ที่ต้องรักษา

### Equipment

`POST /equipments` ใช้ field `name`, `type`, `barcode_Number`, `year_input` เป็น required ตาม schema. ส่ง `department`, `room` ตามความเหมาะสม. Non-admin ต้องมี department; backend ใช้ department และ user จาก JWT ไม่เชื่อค่าที่ส่ง. หากส่ง room จะตรวจว่ามีจริงและ department ตรงกับ asset. Admin สามารถส่ง `user` ได้. `PUT` ห้าม room/department ทั้งสอง field; ให้ย้ายด้วย movement เพื่อมีประวัติ. `DELETE` ยังไม่ cascade movement/maintenance ที่อ้าง asset.

```json
{
  "name": "เครื่องคอมพิวเตอร์ตั้งโต๊ะ",
  "type": "คอมพิวเตอร์",
  "barcode_Number": "EMF-2569-0001",
  "year_input": 2026,
  "department": "<Department ObjectId>",
  "room": "<Room ObjectId>",
  "condition": "good",
  "maintenanceIntervalMonths": 12
}
```

### Movement

`POST /movements` ต้องส่ง `{equipment, toRoom, reason}`. หา asset ใน scope, หา room, ปฏิเสธถ้าห้องเดิม, เลือก `toDepartment` จาก `room.department` หรือ body หรือ asset เดิม. Non-admin ที่มี department ถูกห้ามย้ายข้าม department. สร้าง Movement แล้วแก้ `Equipment.room/department`. ปัจจุบัน **ไม่ใช้ MongoDB transaction**; หาก save asset ล้มเหลวหลังสร้าง Movement จะเกิดข้อมูลไม่ตรงกัน.

### Maintenance

`POST /maintenance` ต้องส่ง `{equipment, kind, scheduledAt, description}` เป็นอย่างน้อย; API เติม `createdBy` จาก JWT. ถ้า status เป็น `in_progress` จะตั้ง `Equipment.status = maintenance`. `PUT /maintenance/:id` รับ status และ cost; ถ้า status `completed` จะตั้ง `completedAt=now`, `Equipment.status=active`, `lastInspectionDate=completedAt`, `nextInspectionDate=completedAt + maintenanceIntervalMonths`. ยังไม่มี transaction, idempotency, การตรวจ state transition และการรักษาสถานะ `retired/lost` เมื่อปิดงาน.

### Inquiry

`POST /inquiries`: `kind` (`demo|service`), `name`, `organization`, `email`, `message` required; `phone`, `equipmentCode`, `preferredDate` optional. ค่าเริ่มต้น status `new`. Public form ถูกซ่อนจาก route ตอนนี้ แต่ API ยังเปิด. ยังไม่มี CAPTCHA/rate limit/email notification/การมอบหมายงาน/endpoint เปลี่ยน status.

## MongoDB models

ทุก schema ใช้ `{timestamps:true}` จึงมี `createdAt`/`updatedAt`; refs เป็น MongoDB ObjectId ยกเว้น fixture ใน browser.

| Model | Required / unique | Field สำคัญ, enum, refs |
| --- | --- | --- |
| `User` | `username` unique, `password`, `name_sur` | `role=admin|personnel|evaluator|assessee` default assessee; `department -> Department`; password hash ด้วย bcrypt pre-save; password `select:false` |
| `Department` | `code` unique uppercase, `name`, `kind` | `kind=faculty|department|laboratory`, `parent -> Department`, `description`; ยังไม่บังคับ tree consistency |
| `Room` | `room_code` unique, `floor`, `purpose` | `name`, `building`, `department -> Department` |
| `Equipment` | `name`, `type`, `barcode_Number` unique uppercase, `year_input` | `smartTagId` unique sparse, `serialNumber`, `acquiredAt`, `purchasePrice>=0`, `status=active|maintenance|retired|lost`, `condition=good|watch|poor`, refs `department/room/user`, `maintenanceIntervalMonths>=1` default 12, `expectedLifespanYears>=1` default 5, `lastInspectionDate`, `nextInspectionDate`, `expectedReplacementDate`, `notes` |
| `Movement` | `equipment`, `toRoom`, `reason`, `movedBy` | `fromRoom`, `fromDepartment`, `toDepartment`, `movedAt` default now |
| `Maintenance` | `equipment`, `kind`, `description`, `scheduledAt`, `createdBy` | `kind=inspection|repair|preventive`, `status=scheduled|in_progress|completed`, `completedAt`, `cost>=0`, `provider` |
| `Inquiry` | `kind`, `name`, `organization`, `email`, `message` | `kind=demo|service`, `phone`, `equipmentCode`, `preferredDate`, `status=new|contacted|closed` default new |

`EquipmentSchema.pre('validate')` สร้าง `nextInspectionDate` เมื่อว่างจาก `lastInspectionDate || acquiredAt || now` บวก `maintenanceIntervalMonths` (default 12), และสร้าง `expectedReplacementDate` เมื่อว่างจาก `acquiredAt` หรือ `year_input` บวก `expectedLifespanYears` (default 5). `year_input` ใช้ **ค.ศ.** ใน `new Date(year_input,0,1)`; อย่าใส่ปี พ.ศ. แม้ barcode ตัวอย่างมี `256x`. การแก้ด้วย `findOneAndUpdate` ไม่ผ่าน document `pre('validate')` hook แบบเดียวกับ `save`; อย่าคาดว่าปรับ interval แล้ววันจะคำนวณใหม่เอง.

Unique indexes มาจาก fields ที่ประกาศ unique (`User.username`, `Department.code`, `Room.room_code`, `Equipment.barcode_Number`, `Equipment.smartTagId` แบบ sparse). ไม่มี index สำหรับ search/date/scope หรือ migration framework เพิ่มเติมใน repo.

## Seed, legacy data และแหล่งข้อมูลตัวอย่าง

`npm run seed` ใน `EMF/` รัน `EMF/seeder.js`. มัน:

1. เติม `Equipment.name` ให้ record เก่าที่ไม่มีชื่อจาก `type` หรือ barcode.
2. Upsert department `ENG` และ `CPE`, room `ENG-302` ด้วย `$setOnInsert` จึงไม่ทับข้อมูลที่มีอยู่.
3. สร้าง admin จาก `SEED_ADMIN_USERNAME/PASSWORD/NAME` ถ้ายังไม่มี username นั้น; ไม่เปลี่ยน password ของบัญชีเดิม.
4. ถ้า collection Equipment ว่างและพบ admin ตาม env จึงเพิ่ม asset ตัวอย่าง **1 ชิ้น** (`EMF-2569-0001`).

Seed นี้ **คนละชุด** กับ `front/src/demoData.js` (8 assets ใน browser). อย่าคิดว่าการ seed MongoDB จะสร้าง dashboard demo เหมือนกัน. สำรอง DB ก่อนเปลี่ยน schema/seed กับข้อมูลจริง. ไม่ควรใช้ค่า password ใน `.env.example` จริง.

## งานค้างก่อนใช้งานจริง

- ทำ integration tests สำหรับ auth/scope ทุก role, movement/maintenance side effects, unique constraints และ public inquiry; repository ยังไม่มี test suite.
- กำหนดนโยบาย public register/inquiry, CORS, rate limit, validation/sanitization, token storage/session และ audit log ตามบริบท deployment จริง.
- เพิ่ม referential integrity และ transaction สำหรับ movement/maintenance; วางนโยบายลบ asset/room ที่ยังมีประวัติ.
- ตรวจการมองเห็นข้อมูลข้ามองค์กร: `GET /departments` เห็นทั้งหมด, `GET /inquiries` เป็น global สำหรับ personnel, scope ไม่สืบทอด parent.
- เพิ่ม pagination/index สำหรับข้อมูลจำนวนมาก; ปัจจุบัน equipment/room/users โหลดทั้งหมด และ movement/maintenance/inquiries จำกัด 200 แบบเงียบ ๆ.
- ตรวจว่า Express รอ DB พร้อมก่อนรับ request; `connectDB()` ถูกเรียกแต่ไม่ได้ `await` ก่อน `app.listen`.
