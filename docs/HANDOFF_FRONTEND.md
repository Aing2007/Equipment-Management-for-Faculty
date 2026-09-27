# Frontend handoff

> สถานะอ้างอิง: 27 กันยายน 2026. อ่าน [HANDOFF.md](../HANDOFF.md) ก่อน. คำว่า **มี UI** ไม่ได้หมายถึง backend หรือ AI ใช้งานครบแล้ว.

## Stack และไฟล์หลัก

- React 19, React Router 7, Vite 6, `lucide-react`; ดู `front/package.json`.
- Entry: `front/index.html` → `front/src/main.jsx`; CSS หลักไฟล์เดียว `front/src/styles.css` (รวม style ของหน้า public ที่ซ่อนอยู่).
- Font โหลดจาก Google Fonts ใน `front/index.html`: IBM Plex Sans Thai และ Inter. ต้องตรวจผลเมื่อใช้งานในเครือข่ายที่บล็อก Google Fonts.
- Asset: `front/public/favicon.svg`, `front/public/lab-hero.png`. ภาพ `lab-hero.png` ยังใช้ที่หน้า login แม้ public page ถูกซ่อน.
- API client: `front/src/api.js`; ใช้ path สัมพัทธ์ `/api/v1...` เพื่อทำงานได้ทั้ง Vite proxy และ Express static hosting.
- Dev server ใช้ port 3000 และ proxy `/api` ไป `http://localhost:5000` (`front/vite.config.js`).

## Routes ที่เปิดอยู่

| Path | ผลลัพธ์ | ไฟล์ |
| --- | --- | --- |
| `/` | ถ้ามี `emf_demo=1` ใน sessionStorage หรือ token → `/app`; นอกนั้น → `/login` | `main.jsx` |
| `/login` | ฟอร์ม username/password และปุ่ม demo | `LoginPage.jsx` |
| `/app` | Dashboard ภาพรวม | `Workspace.jsx` |
| `/app/assets` | รายการ ค้นหา กรอง เพิ่ม/แก้ไข ดูรายละเอียด และสแกน | `Workspace.jsx` |
| `/app/movements` | ประวัติและฟอร์มย้ายครุภัณฑ์ | `Workspace.jsx` |
| `/app/maintenance` | งานตรวจ/ซ่อม/บำรุงและปิดงาน | `Workspace.jsx` |
| `/app/departments` | โครงสร้างหน่วยงาน ห้อง และผู้ใช้/สิทธิ์ | `Workspace.jsx` |
| `/app/insights` | จัดลำดับความเสี่ยงด้วยกฎคำนวณ | `Workspace.jsx` |
| `/app/requests` | อ่านคำขอจาก public form; UI ยังไม่มีเปลี่ยนสถานะ | `Workspace.jsx` |
| path อื่น | redirect ตามสถานะ session เหมือน `/` | `main.jsx` |

`Workspace` อ่าน segment หลัง `/app/` เพื่อตัดสินใจ render หน้าภายใน. การเปิด `/app/*` ไม่มี token และไม่ใช่ demo จะนำไป `/login`. ในโหมดจริงจะเรียก `/auth/me` และโหลดข้อมูลหลายชุดพร้อมกัน. ปุ่ม menu แสดงทุกหมวด; ปุ่มแก้ไขขึ้นกับ role. สิทธิ์จริงต้องดูจาก backend.

## หน้าและการทำงานปัจจุบัน

| หน้า | สิ่งที่ทำได้ | ข้อจำกัด/ข้อสังเกต |
| --- | --- | --- |
| Login | ส่ง `POST /auth/login`; เก็บ JWT เป็น `localStorage.emf_token`; demo ตั้ง `sessionStorage.emf_demo=1` | demo ไม่ใช้ API/DB; UI ไม่มี register แม้ API มี public register |
| Dashboard | metric 4 ค่า, 6 ครุภัณฑ์ล่าสุด, รอบตรวจใกล้ถึง (≤45 วัน), 2 movement ล่าสุด | ตัวเลขจากข้อมูลที่โหลดมา; สถานะ “ควรติดตาม” ใช้ `riskFor` ใน browser |
| Assets | ค้นหา client-side จาก name/barcode/smartTag/type, กรอง department/status, เปิด detail, เพิ่ม/แก้ไข | ค้นหาในชุดข้อมูลที่โหลดทั้งหมด; ไม่มี pagination; เปลี่ยนห้อง/หน่วยงานผ่าน movement เท่านั้น |
| Scanner | พิมพ์/ใช้เครื่องสแกนที่ป้อนรหัสเหมือน keyboard; ใช้กล้องผ่าน `BarcodeDetector` | กล้องรองรับ `code_128`, `qr_code`, `ean_13` เมื่อ browser รองรับและอนุญาต; เทียบรหัสกับรายการที่โหลดใน browser แบบ case-insensitive |
| Movements | สร้างประวัติย้ายด้วย asset, ห้องปลายทาง, เหตุผล; แสดงรายการ | backend เป็นตัวกำหนด department ปลายทาง; demo branch อัปเดตเฉพาะ room จึงไม่จำลองทุกผลข้างเคียงของ backend |
| Maintenance | สร้างงาน `inspection/repair/preventive`, `scheduled/in_progress`; ปิดงาน | backend อัปเดต status, last/next inspection เมื่อปิด; demo branch ปรับเพียงบางค่า |
| Departments | แสดง/เพิ่ม department และ room; admin จัด role/department ของ user | frontend ไม่มี edit/delete department; department create เปิดเฉพาะ admin; room create เปิดสำหรับ admin/personnel |
| Insights | แสดง high/medium/low และวันถึงรอบตรวจ/เปลี่ยน | frontend **คำนวณเอง** ไม่เรียก `GET /insights`; ไม่ใช่โมเดล AI |
| Requests | ตาราง inquiry `demo/service` | read-only; demo เริ่มด้วยรายการว่าง; live loader แปลง error ของ `/inquiries` เป็น `[]` สำหรับ role ที่ไม่มีสิทธิ์ |
| Chatbot | ปุ่มลอยมุมขวาล่าง; เปิดเป็น panel ตรงพื้นที่ปุ่ม; X หรือ Escape เพื่อปิด | mock layout; ไม่มี input ส่งข้อความ ไม่มี network/LLM |

`Workspace.jsx` เป็นไฟล์ใหญ่ที่รวมหลาย component และ state ไว้ในไฟล์เดียว. ถ้าจะขยายระบบ ควรแยกหน้าตาม route, hooks/data layer และ shared components ก่อนเพิ่มความซับซ้อน.

### Form-to-API map

| UI form/action | Payload ที่ frontend ส่ง | Field ที่ schema มีแต่ UI ยังไม่เก็บ |
| --- | --- | --- |
| เพิ่ม/แก้ครุภัณฑ์ | `name`, `type`, `barcode_Number`, `smartTagId`, `serialNumber`, `year_input`, `department`/`room` เฉพาะตอนสร้าง, `status`, `condition`, `nextInspectionDate`, `expectedReplacementDate`, `maintenanceIntervalMonths`, `expectedLifespanYears`, `notes` | `acquiredAt`, `purchasePrice`; `user` ไม่เลือกใน UI |
| บันทึกย้าย | `equipment`, `toRoom`, `reason` | `fromRoom`, `fromDepartment`, `toDepartment`, `movedBy`, `movedAt` backend เป็นผู้เติม/คำนวณ |
| เพิ่ม maintenance | `equipment`, `kind`, `status`, `scheduledAt`, `description`, `provider`, `cost` | `createdBy` backend เติม; `completedAt` เมื่อปิดงาน |
| เพิ่ม department | `code`, `name`, `kind`, `parent` | `description` |
| เพิ่ม room | `room_code`, `name`, `building`, `floor`, `purpose`, `department` | — |
| เปลี่ยนสิทธิ์ user | `role`, `department` | UI ไม่มีสร้าง/ลบ user |

คำว่า Smart Tag ใน UI หมายถึง **รหัส `smartTagId`** ที่อ่านเป็นข้อความผ่านเครื่องสแกน/กล้อง/ช่องกรอก; ไม่มี NFC/RFID reader integration หรือ protocol ของ hardware tag ใน repo. `ScanModal` เทียบค่าในรายการ asset ที่ frontend โหลดแล้ว ไม่บันทึกเหตุการณ์การสแกน. ถ้าต้องตรวจนับจริงควรออกแบบ scan event/audit และการ sync เมื่อออฟไลน์แยกต่างหาก.

## หน้า marketing/public ที่ซ่อนอยู่

**อย่าลบโดยเข้าใจว่าไม่ได้ใช้แล้ว**: `front/src/public/PublicPage.jsx` ยังเก็บหน้าเดิมครบ แต่ `front/src/main.jsx` ไม่ import หรือ mount component นี้. Route `/` และ route ที่ไม่รู้จัก redirect ไป login/app. CSS ของ `.public-*`, `.hero`, `.pricing-*`, `.contact-*` ยังอยู่ใน `front/src/styles.css`.

เนื้อหาที่เก็บไว้ใน component:

1. Hero แนะนำ Smart Tracking และการบำรุงรักษา พร้อมปุ่มขอทดลองใช้.
2. Benefit band และ 4 feature: สแกน, ตำแหน่ง/ประวัติ, บำรุงรักษา, วางแผนจากข้อมูล.
3. Audience: คณะ/ผู้บริหาร, ภาควิชา/เจ้าหน้าที่, ห้องปฏิบัติการ; ตารางเปรียบเทียบระบบคลังทั่วไป.
4. Pricing: ติดแท็ก **200–500 บาท/ชิ้น จ่ายครั้งเดียว**, Software/Server **รายเดือนหรือรายปี** (ยังไม่มีตัวเลขตายตัว), ซ่อมบำรุง **คิดรายครั้ง**.
5. Contact CTA เปิด modal `InquiryForm` 2 แบบ: `demo` และ `service`.

Form `demo`: name, organization, email, phone, preferredDate, message. Form `service`: name, organization, email, phone, equipmentCode, message. ทั้งคู่ใช้ `POST /api/v1/inquiries` โดยไม่ต้อง login; backend ต้องเชื่อม MongoDB จริง. ไม่มี email notification หรือ scheduling automation ใน repo.

### หากต้องนำ public page กลับมา

1. Import `PublicPage` ใน `front/src/main.jsx`.
2. กำหนด route ที่ต้องการอย่างชัดเจน เช่น `/` เป็น `<PublicPage />` และให้ `/login`, `/app/*` เหมือนเดิม; ปรับ `EntryRedirect` ตาม product decision. อย่าแค่เพิ่ม link ที่ชี้ไป `/` เพราะ route ปัจจุบัน redirect.
3. ตรวจ navigation anchor, mobile menu, pricing copy และ form ใน browser ทั้ง desktop/mobile.
4. ตรวจ `POST /api/v1/inquiries` กับ backend/MongoDB จริง, validation, spam protection และการแจ้งทีมบริการก่อนเผยแพร่.
5. หน้า public ยังไม่มี route แยกต่อ feature/pricing/audience; ใช้ section anchors ในหน้าเดียว.

## โหมด demo: แหล่งข้อมูลและวิธีถอด

- เปิดจากปุ่ม **ดูตัวอย่างระบบ** ใน `LoginPage.jsx`; ใช้ `sessionStorage` key `emf_demo`.
- `Workspace.jsx` ตั้ง demo user `{ name_sur: 'ผู้ชมตัวอย่าง', role: 'admin' }` และ clone `demoSeed` ด้วย `structuredClone` จาก `front/src/demoData.js`.
- ชุดตั้งต้น: **4 departments, 4 rooms, 8 equipments, 3 movements, 3 maintenance tasks, 3 users, 0 inquiries**. ไม่มี password หรือ token ของ demo users. ชื่อ/รหัส/วันที่ทุกตัวอยู่ใน `demoData.js` ไม่ได้อยู่ใน MongoDB.
- ตัวอย่างรหัส asset: `EMF-2567-0012` (Dell OptiPlex), `EMF-2566-0043` (Olympus CX23), `EMF-2565-0081` (Epson EB-X06). Fixture ใช้วันที่ตายตัวปี 2026; metric ความเสี่ยงเปลี่ยนตามวันจริงและจะเก่าเมื่อเวลาผ่านไป.
- Demo mutations ใช้ React state เท่านั้น: refresh จะ clone fixture ใหม่; `sessionStorage` flag ยังอยู่จนปิด tab/session หรือ logout. ไม่มีการบันทึก MongoDB.
- Demo branch ใน `save`, `updateUser`, `completeTask` ไม่ได้จำลอง validation/transaction/side effect ของ API ทุกกรณี; ใช้สำหรับ preview UI เท่านั้น.

เมื่อจะถอด demo ออกจาก production: ดูขั้นตอนครบใน [HANDOFF_GO_LIVE.md](HANDOFF_GO_LIVE.md). จุดหลักคือ `LoginPage` ปุ่ม/handler, `main.jsx` route check, `Workspace.jsx` `isDemo`/`cloneDemo`/branches, `demoData.js`, `README.md` และข้อความ “โหมดตัวอย่าง”. อย่าลบข้อมูล seed ของ MongoDB โดยสับสนกับ fixture นี้.

## Design และ responsive notes

- Dashboard ใช้ navy sidebar, white cards, teal action, เส้นขอบอ่อน; style ทั้งหมดอยู่ใน global CSS.
- Chatbot trigger เป็นปุ่มพื้นขาวขอบบาง; เมื่อเปิด trigger ถูก unmount และ panel วางมุมขวาล่างแทน. Close button จุดเดียวอยู่ใน header. Focus ย้ายไป close และคืน trigger เมื่อปิด.
- ช่วงหน้าจอระดับ tablet metric 4 ใบเรียง 2 คอลัมน์เพื่อไม่ให้ข้อความชนกัน; มือถือ sidebar เป็น drawer และตารางเลื่อนแนวนอน.
- `front/src/styles.css` ยังมี `.mock-assistant` และ `.mock-input` ของ assistant แบบเก่าที่ไม่ render แล้ว; ลบได้เมื่อทำ CSS cleanup หลังยืนยันว่าไม่มีการอ้างอิงอื่น.

## QA ที่ควรทำหลังแก้ frontend

`cd front; npm run build`, จากนั้นตรวจ `/login`, `/app`, route ที่แก้, browser console, 1440px/ประมาณ 900px/390px, modal/keyboard/focus, และข้อมูลจริงอย่างน้อยหนึ่ง role. การผ่าน demo อย่างเดียวไม่ยืนยันว่า API/MongoDB หรือ permission ทำงาน. ไม่มี Playwright test suite หรือ unit test ใน repository ณ วันที่เขียน.
