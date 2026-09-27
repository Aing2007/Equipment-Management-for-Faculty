# จาก prototype ไปสู่การใช้งานจริง

> เอกสารนี้เป็น checklist สำหรับงาน **ในอนาคต**. การเขียน handoff ไม่ได้ถอด demo, เปิดหน้า public, deploy, หรือเปลี่ยนฐานข้อมูล ณ ตอนนี้. อ่าน [Frontend](HANDOFF_FRONTEND.md), [API/Database](HANDOFF_API_DATABASE.md), [AI](HANDOFF_AI.md) ก่อนลงมือ.

## A. ตัดสินใจ product boundary

- กำหนดว่าจะใช้ `/` เป็น login, marketing หรือ redirect อื่น. ปัจจุบันหน้า public **ซ่อน** และ `/` redirect ไป login/app.
- กำหนดว่าใครสมัครบัญชีได้: `POST /api/v1/auth/register` ยังเป็น public แต่ UI ไม่มีสมัครสมาชิก. ถ้าเป็นระบบภายในจริงอาจใช้ invite/admin provisioning แทน.
- กำหนดบทบาทของ `personnel` ต่อคำขอบริการ: `GET /inquiries` ปัจจุบันเห็นทุกองค์กร; ตัดสินใจ scope/assignment ก่อนเปิด public forms.
- ตัดสินใจว่าข้อมูลครุภัณฑ์ต่างภาควิชาต้องแยกแบบ exact department หรือสืบทอด parent tree. โค้ดปัจจุบันใช้ exact ObjectId.
- ทบทวนราคา/ข้อความบนหน้า public ก่อนเผยแพร่: ติดตั้ง 200–500 บาท/ชิ้น, Software/Server รายเดือน/ปีโดยยังไม่มีตัวเลข, ซ่อมคิดรายครั้ง.

## B. นำ demo mode ออกจาก production

สิ่งที่ต้องเปลี่ยนใน code (อย่าลบ fixture ก่อนถอด references):

1. `front/src/workspace/LoginPage.jsx`: เอาปุ่ม “ดูตัวอย่างระบบ”, `enterDemo`, demo copy ออก. Login ต้องใช้ API จริง.
2. `front/src/main.jsx`: ให้ `EntryRedirect` ใช้ auth/session จริงแทน `sessionStorage.emf_demo`.
3. `front/src/workspace/Workspace.jsx`: เอา `isDemo`, `cloneDemo`, demo user, demo branches ใน `save`, `updateUser`, `completeTask`, demo badge และการล้าง flag ตอน logout ออก; ตรวจ loading/error/401 ที่เหลือ.
4. ลบ `front/src/demoData.js` เมื่อไม่มี import; ปรับ `README.md` และ handoff ให้ตรงกับสถานะใหม่.
5. เก็บ **DB seed** (`EMF/seeder.js`) แยกจาก browser demo fixture; seed มี admin และ asset ตัวอย่าง 1 ชิ้นตามเงื่อนไข และต้องกำหนดแนวทางข้อมูลเริ่มต้นของ production ใหม่.
6. ทดสอบว่า `/app/*` เข้าไม่ได้ถ้าไม่มี JWT และ login/logout/expired token ทำงาน; UI demo ไม่กลับมาจาก sessionStorage เก่า.

อย่าปล่อยปุ่ม demo ให้ผู้ใช้ production เข้าถึงข้อมูลหลอก แม้ demo จะไม่เขียน MongoDB.

## C. เปิดหน้า marketing ที่ซ่อน (ถ้าต้องการ)

1. เพิ่ม import และ route ของ `PublicPage` ใน `front/src/main.jsx`; ปรับ `/` และ wildcard ให้ตรงแผน routing. Component อยู่ใน `front/src/public/PublicPage.jsx`, CSS ยังอยู่ใน `front/src/styles.css`, asset `lab-hero.png` ยังอยู่.
2. ทดสอบ anchor `#features`, `#audience`, `#pricing`, `#contact`, mobile menu, login link และ CTA สองชนิด.
3. Form ส่ง `POST /api/v1/inquiries` แบบ unauthenticated. ทดสอบกับ MongoDB จริง; เพิ่ม anti-spam/rate limit, validation, privacy/retention และกระบวนการติดต่อกลับ.
4. ตรวจ pricing และ claim ด้าน “AI” ให้ตรงกับความสามารถจริง. หน้า AI ปัจจุบันเป็น rule engine, chatbot เป็น mock. อย่าโฆษณาว่า trained predictive AI/chatbot ใช้งานจริงก่อนสร้างและพิสูจน์.
5. ถ้ายังไม่เปิด public page คง source ไว้ตาม product request ปัจจุบัน; ไม่ต้องลบ `PublicPage.jsx` หรือ CSS.

## D. ฐานข้อมูลและ API ก่อน production

- ใช้ MongoDB URI/secret เฉพาะ environment; อย่า commit `.env` และตั้ง `JWT_SECRET` ยาวสุ่ม. สร้าง admin ด้วย credential เฉพาะ production; `seeder.js` ไม่เปลี่ยนรหัส admin ที่มีอยู่แล้ว.
- สำรองข้อมูลและออกแบบ migration สำหรับ schema/seed; ตรวจ record เก่าที่ไม่มี `Equipment.name`, ref ที่หาย, ปี `year_input` ค.ศ., date fields, unique barcode/smartTag.
- เพิ่ม automated tests ของ endpoint, RBAC, exact department scope, movement/maintenance side effects และ failure rollback. ไม่มี test suite ใน repo ณ วันที่เขียน.
- ปรับ transaction/referential policy ของ movement, maintenance, delete asset/room; ปัจจุบัน mutation หลาย collection ไม่ atomic.
- ตรวจ public endpoints (`/auth/register`, `/inquiries`), unrestricted `cors()`, request validation, rate limiting, logging และ audit trail ตามสภาพ deployment.
- เพิ่ม pagination/index ถ้าจำนวน assets มาก; frontend ปัจจุบันโหลดทั้งหมดเพื่อค้นหา/กรองใน browser; history และ inquiry API จำกัด 200 รายการ.
- ตรวจ readiness ของ DB ก่อนเปิดรับ API; `connectDB()` ใน `server.js` ไม่ได้ await ก่อน listen.

## E. AI และ chatbot ก่อนประกาศใช้

- ย้าย rule ความเสี่ยงไป source-of-truth เดียว พร้อม version/reason code/tests; frontend ตอนนี้คำนวณเองแม้มี `GET /insights`.
- ตกลง objective, labels, dataset และวิธีวัดผลก่อนใช้คำว่า predictive AI. ดู [HANDOFF_AI.md](HANDOFF_AI.md).
- เปลี่ยน chatbot mock เป็น frontend form + authenticated backend endpoint + scoped retrieval; ทดสอบข้อมูลข้าม department, คำถามไม่มีข้อมูล และ prompt injection.
- เพิ่ม notification scheduler/channel ถ้าต้องการ “แจ้งเตือน” จริง; ปัจจุบันมีเฉพาะรายการใน dashboard.

## F. Minimum verification gate

| Gate | เกณฑ์ตรวจรับ |
| --- | --- |
| Build | `cd front; npm ci; npm run build` ผ่าน; `cd EMF; npm ci` ผ่าน |
| Startup | API health ตอบ, MongoDB connect สำเร็จ, Express serve `front/dist`, browser refresh deep link `/app/assets` ไม่ 404 |
| Auth | login/logout, token หมดอายุ, role ทุกแบบ, ไม่มี demo bypass ใน production |
| CRUD | เพิ่ม/แก้ asset, scan/manual search, ย้ายห้องพร้อม history, สร้าง/ปิด maintenance, next inspection recalculation |
| Scope | admin เห็นตามนโยบาย; personnel/evaluator/assessee ไม่เห็นข้อมูลนอก scope ทั้งใน UI และ API direct calls |
| Public (ถ้าเปิด) | form demo/service ส่งข้อมูลจริง, validation/error/anti-spam, inbox workflow, pricing/claims ตรวจแล้ว |
| AI (ถ้าเปิด) | rule/model version และ source ชัดเจน; chatbot ไม่ตอบข้อมูลเกินสิทธิ์และไม่แสดง mock เป็นของจริง |
| UI | desktop/tablet/mobile, keyboard/focus, console ไม่มี app error, scanner fallback, loading/empty/error states |

## G. ลำดับงานแนะนำ

1. ตกลง product boundary และ permission matrix.
2. เพิ่ม test + migration/transaction/data integrity ให้ backend.
3. เชื่อม MongoDB จริงและตรวจ role flows.
4. ถอด demo mode เมื่อเลิกใช้ preview; ตรวจ `/login` และ `/app` ทุกสถานะ.
5. เปิด marketing form หลังบริการรับคำขอพร้อมจริง.
6. รวม analytics rules และทำ notification; ทำ chatbot/ML เป็นงานแยกที่มี acceptance criteria ตาม [AI handoff](HANDOFF_AI.md).
