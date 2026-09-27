# Chatbot และ AI วิเคราะห์ handoff

> **สถานะจริง ณ 27 กันยายน 2026:** Chatbot เป็น mock UI; หน้า “AI วิเคราะห์” และ `GET /api/v1/insights` เป็น heuristic จากกฎ ไม่ใช่ trained AI/ML. ไม่มี LLM provider, API key, vector database, conversation store, training pipeline, notification scheduler หรือ model deployment ใน repo.

## 1. Chatbot ปัจจุบัน: mock layout

Source: `front/src/workspace/ChatbotMock.jsx`, style `.chatbot-*` ใน `front/src/styles.css`; `<ChatbotMock />` ถูก mount ใน `Workspace.jsx` จึงแสดงทุกหน้าภายใน `/app/*` เมื่อเข้า dashboard ได้.

- ปุ่มไอคอน `MessageSquareText` พื้นขาวลอยมุมขวาล่าง; กดแล้วปุ่มหายและ panel เปิด **แทนพื้นที่ปุ่ม**. ไม่ควรกลับไปมีปุ่ม X ซ้อนสองตำแหน่ง.
- Panel มี header “AI Assistant” และข้อความ “ตัวอย่างหน้าตา · ยังไม่เชื่อมต่อระบบ”, greeting, ตัวอย่างคำถาม 2 บรรทัด, footer หน้าตาเหมือนช่องพิมพ์.
- ตัวอย่างคำถามเป็น `<span>` ไม่มี onClick. ช่องพิมพ์เป็น `<div aria-disabled="true">` ไม่ใช่ input; ปุ่มส่งเป็นเพียงไอคอน. **ไม่มีการส่ง message หรือ fetch**.
- ปิดด้วย X ใน header หรือ Escape; focus ไปปุ่มปิดเมื่อเปิด และกลับไปปุ่ม trigger เมื่อปิด. Panel ไม่ใช่ modal และไม่เก็บบทสนทนา.
- Desktop panel กว้างสูงสุด 360px, mobile กว้างไม่เกิน viewport ลบขอบ 32px; เมื่อเพิ่มข้อความจริง ต้องตรวจ scroll, keyboard และ safe area ใหม่.

### จุดเปลี่ยนจาก mock เป็นของจริง

1. แยก visual shell ออกจาก state/transport: เพิ่ม state `messages`, `draft`, `sending`, `error`, `conversationId`; เปลี่ยน fake input เป็น `<form>`/`<textarea>`/send button ที่ accessible.
2. ทำ suggestion เป็น `<button>` ที่กดแล้วเติม/ส่งคำถามตาม UX ที่เลือก.
3. ออกแบบ backend chat endpoint **ใหม่** (ยังไม่มี) และให้ `protect`/department scope บังคับสิทธิ์ทุก retrieval; frontend ไม่ส่ง JWT ไป provider โดยตรง.
4. แสดงคำตอบที่มี timestamp, แหล่งข้อมูลภายใน (asset ID หรือ record ID), ขอบเขตข้อมูล และสถานะ “ไม่พบข้อมูล” อย่างซื่อสัตย์. สำหรับผลคำนวณให้ระบุว่าเป็น rule หรือ model พร้อมรุ่น/วันที่ประเมิน.
5. เพิ่ม pending/timeout/retry/error/empty states, การยกเลิกคำขอ และ keyboard/screen-reader QA.
6. ค่อยเพิ่มการเก็บบทสนทนาหลังตกลง retention, PII และสิทธิ์การเข้าถึง; repository ปัจจุบันไม่มี collection สำหรับสิ่งนี้.

## 2. สิ่งที่ chatbot ควรตอบใน scope แรก

เริ่มด้วย read-only questions จากข้อมูลที่ backend บังคับสิทธิ์แล้ว เช่น:

- “ครุภัณฑ์รหัส EMF-... อยู่ห้องไหน ใครรับผิดชอบ สถานะอะไร” → asset/room/department ปัจจุบัน.
- “รายการที่ใกล้ถึงรอบตรวจ” → `nextInspectionDate`, รายการใน department scope, พร้อมวันที่อ้างอิง.
- “สรุปงานซ่อมเดือนนี้” → Maintenance records ที่มีสิทธิ์; ระบุช่วงวันที่และจำนวน records ที่ใช้.
- “ทำไมรายการนี้เสี่ยงสูง” → reason code/หลักฐานจากกฎหรือ model, วันที่ตรวจ/เปลี่ยน, condition.

อย่าให้ LLM อ่านทุก collection โดยตรงด้วย credential admin หรือทำ mutation จากข้อความผู้ใช้ในรุ่นแรก. ถ้าจะเพิ่มคำสั่งสร้างงาน/ย้าย/แก้ asset ในอนาคต ต้องมี intent confirmation, validation, role check, audit log และเรียก business API เดิมแทนเขียน MongoDB ตรง.

### API contract ที่เสนอสำหรับงานต่อ (**ยังไม่ได้ implement**)

`POST /api/v1/chat/messages` (JWT required) รับ `{conversationId?: string, message: string}`. Backend ควรตอบรูปแบบที่ frontend render ได้โดยไม่ parse ข้อความเพื่อเดา:

```json
{
  "success": true,
  "data": {
    "conversationId": "<id>",
    "answer": "ครุภัณฑ์ที่ใกล้ถึงรอบตรวจมี ...",
    "sources": [
      { "type": "equipment", "id": "<ObjectId>", "label": "EMF-..." }
    ],
    "dataAsOf": "2026-09-27T00:00:00.000Z",
    "basis": "rule_based_insights_v1"
  }
}
```

นี่เป็นข้อเสนอเพื่อให้ AI agent ที่รับช่วงเห็น boundary; ห้ามอ้าง endpoint นี้ว่าใช้งานแล้ว. ถ้า backend query existing API แทน data layer โดยตรง ต้องคง filter ตาม `req.user.role`/`department` และห้ามเผยข้อมูลที่ user นั้นไม่มีสิทธิ์. ป้องกัน prompt injection จาก `Equipment.notes`, `Inquiry.message` และข้อความอิสระอื่น โดยถือเป็นข้อมูล ไม่ใช่คำสั่ง.

## 3. Analytics ปัจจุบัน: rule engine สองที่

| ที่ | Code | การใช้งาน |
| --- | --- | --- |
| Frontend | `riskFor`, `daysUntil`, `Insights` ใน `front/src/workspace/Workspace.jsx` | หน้า `/app/insights` และ metric “ควรติดตาม” บน dashboard ใช้ข้อมูล Equipment ที่โหลดมา |
| Backend | `GET /api/v1/insights` ใน `EMF/routes/operations.js` | คืน equipment, `dueInDays`, `replacementInDays`, `risk`, `reason`; frontend **ยังไม่เรียก** |

กฎปัจจุบัน (ทั้งสองที่ใช้ thresholds เดียวกัน):

```text
dueInDays = ceil((nextInspectionDate - now) / 86,400,000 ms), หรือ null
replacementInDays = ceil((expectedReplacementDate - now) / 86,400,000 ms), หรือ null

HIGH   เมื่อ condition == poor หรือ dueInDays < 0 หรือ replacementInDays < 0
MEDIUM เมื่อไม่ HIGH และ (condition == watch หรือ dueInDays <= 30 หรือ replacementInDays <= 180)
LOW    นอกนั้น

เรียง HIGH -> MEDIUM -> LOW
```

`daysUntil` ขึ้นกับเวลาที่ browser/server ประมวลผล จึงอาจต่างเล็กน้อยใกล้รอยต่อวัน/time zone. Frontend และ backend มีข้อความเหตุผลคนละ implementation; ไม่ควรปล่อยให้ logic สองที่พัฒนาแยกกันต่อ. Dashboard “ใกล้ถึงรอบตรวจ” ใช้เกณฑ์ `<=45 วัน` อีกค่า ซึ่งไม่เท่ากับเกณฑ์ risk medium `<=30 วัน`.

วันที่ใน schema:

- ถ้า `nextInspectionDate` ว่างตอน document validate: เริ่มจาก `lastInspectionDate` หรือ `acquiredAt` หรือเวลาปัจจุบัน แล้วบวก `maintenanceIntervalMonths` (default 12).
- ถ้า `expectedReplacementDate` ว่างและมี `acquiredAt` หรือ `year_input`: บวก `expectedLifespanYears` (default 5). `year_input` ต้องเป็น ค.ศ.
- เมื่อปิด maintenance task: backend ตั้ง `lastInspectionDate=completedAt` และ `nextInspectionDate=completedAt+interval`.

นี่คือการจัดลำดับด้วย rule เพื่อช่วยวางแผน ไม่ใช่การประมาณความน่าจะเสีย, remaining useful life, การคาดการณ์งบ หรือคำแนะนำจัดซื้อที่ผ่านการประเมินเชิงสถิติ. ไม่มีการส่ง notification อัตโนมัติ แม้ UI แสดงรายการใกล้ครบกำหนด.

## 4. เส้นทางพัฒนา predictive analytics จริง

ทำเป็นลำดับ; แต่ละขั้นควรมี output ที่ตรวจได้:

1. **นิยามเป้าหมาย**: เช่น โอกาสเกิด repair ภายใน 90/180 วัน, วันควรตรวจ, งบซ่อมคาดการณ์ หรือช่วงเปลี่ยนทดแทน. แยก target ให้ชัด; อย่าเรียกทุกอย่างว่า “risk”. ให้ผู้ดูแลครุภัณฑ์ยืนยัน threshold และผลกระทบของ false alarm/missed event.
2. **เตรียมข้อมูล**: asset lifecycle, acquisition date/price, usage/exposure, condition inspection history, Maintenance kind/status/cost/completedAt, Movement history, retire/loss outcomes. Schema ปัจจุบันยังไม่มี usage telemetry, failure labels ที่ชัด หรือ condition history แบบ time series; อย่าสร้างโมเดลจากข้อมูลไม่พอโดยอ้างความแม่นยำ.
3. **Data quality + leakage control**: ตรวจ missing dates, ปี ค.ศ./พ.ศ., record ซ้ำ, completed task ที่ไม่มี actual outcome, เวลาเหตุการณ์; split train/validation/test ตามเวลาและองค์กร ไม่ให้ข้อมูลหลังเหตุการณ์รั่วเข้า feature.
4. **Baseline ก่อน model**: รวม logic rule ไป backend จุดเดียว, เพิ่ม `reasonCodes`, `ruleVersion`, `asOf`, tests ของ threshold/ขอบวัน. ให้ frontend ใช้ backend result; เก็บ rule เป็น fallback ที่อธิบายได้.
5. **Model เฉพาะเมื่อมีข้อมูลพอ**: versioned features/model, offline evaluation เทียบ baseline, calibration, segment ตามประเภทครุภัณฑ์/หน่วยงาน, monitoring drift และ feedback จากเจ้าหน้าที่.
6. **UI และการตัดสินใจ**: แสดง prediction พร้อม confidence/ช่วงเวลา/เหตุผล/ข้อมูลอ้างอิง; แยก “ระบบคาดการณ์” จาก “กำหนดตามรอบ”; ให้มนุษย์ยืนยันงานซ่อมหรือจัดซื้อ.
7. **Alerts**: ถ้าจะทำแจ้งเตือนจริง ต้องเพิ่ม scheduler, channel, acknowledgement, deduplication, timezone policy และ audit log; ตอนนี้มีเพียง list ใน UI.

Contract ตัวอย่างสำหรับผลวิเคราะห์รุ่นต่อไป (**ข้อเสนอ ยังไม่ได้ implement**):

```json
{
  "equipmentId": "<ObjectId>",
  "asOf": "2026-09-27T00:00:00.000Z",
  "horizonDays": 180,
  "riskLevel": "medium",
  "probability": null,
  "basis": "rules_v1",
  "version": "1.0.0",
  "reasonCodes": ["INSPECTION_DUE_SOON"],
  "sourceIds": ["<Equipment ObjectId>"],
  "dataQuality": { "missingFields": [] }
}
```

`probability: null` เหมาะกับ rule; ห้ามแสดงเปอร์เซ็นต์ความเสี่ยงที่ไม่ได้ calibrate. เมื่อมี model ค่อยเพิ่ม probability/confidence ตามนิยามที่พิสูจน์ได้.

## 5. Acceptance criteria สำหรับ AI agent ที่รับช่วง

- Read-only chatbot ให้คำตอบเฉพาะ records ที่ user มีสิทธิ์; ทดสอบ admin/personnel/evaluator/assessee และผู้ไม่มี department.
- คำตอบมีแหล่งข้อมูลหรือระบุว่าไม่มีข้อมูล; ไม่สร้างรหัส/ห้อง/วันที่ขึ้นเอง; ไม่ปล่อย JWT หรือ PII ใน log/provider โดยไม่กำหนดนโยบาย.
- `POST /chat/messages` ใหม่มี validation, timeout, error shape, rate limit และ server-side secrets; frontend มี loading/error/empty/keyboard states.
- Backend risk มี tests ครบกรณี poor/watch/good, overdue, due exactly 0/30/180, missing dates, time zones; frontend ไม่คำนวณ logic คนละชุด.
- หากใช้ model จริง ต้องมี dataset provenance, target definition, version, metrics เทียบ rules baseline, monitoring, rollback/fallback และคำอธิบายใน UI ว่า prediction ใช้ข้อมูลอะไร.
