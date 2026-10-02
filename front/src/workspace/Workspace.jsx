import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, ArrowRight, Barcode, Boxes, BrainCircuit, Building2, Camera,
  Check, LayoutDashboard, LogOut, MapPin, Menu, MoveRight,
  Plus, ScanLine, ScanQrCode, Search, Settings2, ShieldCheck, Sparkles, Users, Wrench, X
} from 'lucide-react';
import { api, clearToken, getToken } from '../api';
import ChatbotMock from './ChatbotMock.jsx';
import { CreateQr, ScanQr } from './QrPages.jsx';
import CreditPage from './CreditPage.jsx';

const menu = [
  { id: 'overview', label: 'ภาพรวม', icon: LayoutDashboard },
  { id: 'assets', label: 'ครุภัณฑ์', icon: Boxes },
  { id: 'movements', label: 'การเคลื่อนย้าย', icon: MoveRight },
  { id: 'maintenance', label: 'งานซ่อมบำรุง', icon: Wrench },
  { id: 'departments', label: 'หน่วยงาน', icon: Building2 },
  { id: 'insights', label: 'ระบบวิเคราะห์อัจฉริยะ', icon: BrainCircuit },
  //{ id: 'requests', label: 'คำขอรับบริการ', icon: ClipboardList },
  { id: 'CreateQr', label: 'สร้าง QR Code', icon: ScanQrCode },
  { id: 'ScanQr', label: 'สแกน QR Code', icon: ScanLine },
  { id: 'Credit', label: 'Creditผู้พัฒนา', icon: Users }
];
const statusMap = { active: 'ใช้งานปกติ', maintenance: 'อยู่ระหว่างซ่อม', retired: 'ปลดระวาง', lost: 'สูญหาย' };
const conditionMap = { good: 'ดี', watch: 'เฝ้าระวัง', poor: 'ควรซ่อม' };
const taskMap = { scheduled: 'กำหนดแล้ว', in_progress: 'กำลังดำเนินการ', completed: 'เสร็จสิ้น' };
const kindMap = { inspection: 'ตรวจสอบ', repair: 'ซ่อมแซม', preventive: 'บำรุงรักษา' };
const date = (value) => value ? new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : '—';
const idOf = (value) => typeof value === 'object' ? value?._id : value;
const daysUntil = (value) => value ? Math.ceil((new Date(value) - new Date()) / 86400000) : null;
const riskFor = (item) => {
  const due = daysUntil(item.nextInspectionDate);
  const replacement = daysUntil(item.expectedReplacementDate);
  if (item.condition === 'poor' || (due !== null && due < 0) || (replacement !== null && replacement < 0)) return 'high';
  if (item.condition === 'watch' || (due !== null && due <= 30) || (replacement !== null && replacement <= 180)) return 'medium';
  return 'low';
};
const riskText = { high: 'เร่งด่วน', medium: 'ควรติดตาม', low: 'ปกติ' };
const initialData = { equipments: [], rooms: [], departments: [], movements: [], maintenance: [], inquiries: [] };
const bangkokDateValue = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
};

function Status({ status, type = 'asset' }) {
  const text = type === 'task' ? taskMap[status] : statusMap[status];
  return <span className={`status status-${status}`}><span className="status-dot" />{text || status}</span>;
}
function SectionHeader({ title, description, action }) {
  return <div className="work-section-header"><div><h2>{title}</h2><p>{description}</p></div>{action}</div>;
}
function Modal({ title, children, onClose, wide = false }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><div className={`modal work-modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="ปิด"><X size={20} /></button></div>{children}</div></div>;
}
function Empty({ text }) { return <div className="empty"><Boxes size={30} /><p>{text}</p></div>; }
function AssetTable({ items, onSelect, compact = false }) {
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>รหัสครุภัณฑ์</th><th>รายการครุภัณฑ์</th><th>หน่วยงาน</th><th>ห้อง / สถานที่</th><th>สถานะ</th><th>ตรวจครั้งถัดไป</th><th aria-label="รายละเอียด" /></tr></thead><tbody>
    {items.map((item) => <tr key={item._id} onClick={() => onSelect(item)} tabIndex="0" onKeyDown={(event) => { if (event.key === 'Enter') onSelect(item); }}>
      <td><span className="code-cell">{item.barcode_Number}</span></td>
      <td><strong>{item.name}</strong><small>{item.type}</small></td>
      <td>{item.department?.name || 'ยังไม่ระบุ'}</td>
      <td>{item.room?.room_code || 'ยังไม่ระบุ'}</td>
      <td><Status status={item.status} /></td>
      <td>{date(item.nextInspectionDate)}</td>
      <td><ArrowRight size={16} /></td>
    </tr>)}
  </tbody></table>{!items.length && <Empty text="ไม่พบรายการครุภัณฑ์" />}</div>;
}

function Overview({ data, go, selectAsset }) {
  const { equipments, movements, maintenance } = data;
  const due = [...equipments].filter((item) => item.nextInspectionDate && daysUntil(item.nextInspectionDate) <= 45).sort((a, b) => new Date(a.nextInspectionDate) - new Date(b.nextInspectionDate)).slice(0, 4);
  const cards = [
    { label: 'ครุภัณฑ์ทั้งหมด', value: equipments.length, icon: Boxes, tone: 'blue', action: 'assets' },
    { label: 'ใช้งานปกติ', value: equipments.filter((item) => item.status === 'active').length, icon: ShieldCheck, tone: 'green', action: 'assets' },
    { label: 'อยู่ระหว่างซ่อม', value: equipments.filter((item) => item.status === 'maintenance').length, icon: Wrench, tone: 'amber', action: 'maintenance' },
    { label: 'ควรติดตาม', value: equipments.filter((item) => riskFor(item) !== 'low').length, icon: Activity, tone: 'red', action: 'insights' }
  ];
  return <>
    <SectionHeader title="ภาพรวมครุภัณฑ์" description="ติดตามสถานะ การเคลื่อนย้าย และงานซ่อมบำรุงของหน่วยงาน" />
    <div className="metric-grid">{cards.map((card) => <button className="metric" key={card.label} onClick={() => go(card.action)}><span className={`metric-icon ${card.tone}`}><card.icon size={22} /></span><span className="metric-label">{card.label}</span><strong>{card.value.toLocaleString('th-TH')}</strong><span className="metric-action">ดูรายละเอียด <ArrowRight size={15} /></span></button>)}</div>
    <div className="overview-layout">
      <section className="work-panel assets-panel"><div className="panel-heading"><div><h3>รายการครุภัณฑ์ล่าสุด</h3><p>ข้อมูลที่อยู่ในระบบ</p></div><button className="text-link" onClick={() => go('assets')}>ดูทั้งหมด <ArrowRight size={17} /></button></div><AssetTable items={equipments.slice(0, 6)} onSelect={selectAsset} compact /></section>
      <div className="overview-side">
        <section className="work-panel side-panel"><div className="panel-heading"><h3>ใกล้ถึงรอบตรวจ</h3><button className="text-link" onClick={() => go('insights')}>ทั้งหมด <ArrowRight size={16} /></button></div>{due.length ? due.map((item) => <button className="due-row" key={item._id} onClick={() => selectAsset(item)}><span className="due-icon"><Wrench size={17} /></span><span><strong>{item.name}</strong><small>{item.barcode_Number} · {item.room?.room_code || 'ไม่ระบุห้อง'}</small></span><em>{date(item.nextInspectionDate)}</em></button>) : <Empty text="ยังไม่มีรายการใกล้ถึงรอบตรวจ" />}</section>
        <section className="work-panel side-panel"><div className="panel-heading"><h3>การเคลื่อนย้ายล่าสุด</h3><button className="text-link" onClick={() => go('movements')}>ทั้งหมด <ArrowRight size={16} /></button></div>{movements.slice(0, 2).map((movement) => <div className="activity-row" key={movement._id}><span className="activity-mark"><MoveRight size={15} /></span><div><strong>{movement.equipment?.name}</strong><small>{movement.fromRoom?.room_code || '—'} → {movement.toRoom?.room_code || '—'} · {date(movement.movedAt)}</small></div></div>)}{!movements.length && <Empty text="ยังไม่มีประวัติการย้าย" />}</section>
      </div>
    </div>
  </>;
}

function Assets({ data, onCreate, onSelect, onScan }) {
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState('');
  const [status, setStatus] = useState('');
  const filtered = data.equipments.filter((item) => {
    const matches = !query || [item.name, item.barcode_Number, item.smartTagId, item.type].some((value) => value?.toLowerCase().includes(query.toLowerCase()));
    return matches && (!dept || idOf(item.department) === dept) && (!status || item.status === status);
  });
  return <>
    <SectionHeader title="ครุภัณฑ์" description="ค้นหา สแกน และจัดการข้อมูลครุภัณฑ์ทั้งหมด" action={<div className="header-actions"><button className="button secondary" onClick={onScan}><ScanLine size={18} /> สแกนแท็ก</button><button className="button primary" onClick={onCreate}><Plus size={18} /> เพิ่มครุภัณฑ์</button></div>} />
    <section className="work-panel list-panel"><div className="filters"><label className="search-box"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อ รหัส บาร์โค้ด หรือ Smart Tag" aria-label="ค้นหาครุภัณฑ์" /></label><select value={dept} onChange={(event) => setDept(event.target.value)} aria-label="กรองหน่วยงาน"><option value="">ทุกหน่วยงาน</option>{data.departments.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="กรองสถานะ"><option value="">ทุกสถานะ</option>{Object.entries(statusMap).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div><div className="table-count">แสดง {filtered.length} จาก {data.equipments.length} รายการ</div><AssetTable items={filtered} onSelect={onSelect} /></section>
  </>;
}

function AssetForm({ data, onSave, onClose, item, busy, error }) {
  const edit = Boolean(item);
  const today = bangkokDateValue();
  const currentYear = new Date().getFullYear();
  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSave({
      name: form.get('name'), type: form.get('type'), barcode_Number: form.get('barcode_Number'),
      smartTagId: form.get('smartTagId') || undefined, serialNumber: form.get('serialNumber') || undefined,
      year_input: Number(form.get('year_input')),
      ...(!edit ? { department: form.get('department') || undefined } : {}),
      ...(!edit ? { room: form.get('room') || undefined } : {}),
      status: form.get('status'), condition: form.get('condition'),
      nextInspectionDate: form.get('nextInspectionDate') || undefined,
      expectedReplacementDate: form.get('expectedReplacementDate') || undefined,
      maintenanceIntervalMonths: Number(form.get('maintenanceIntervalMonths')) || 12,
      expectedLifespanYears: Number(form.get('expectedLifespanYears')) || 5,
      notes: form.get('notes') || undefined
    });
  }
  return <Modal title={edit ? 'แก้ไขครุภัณฑ์' : 'เพิ่มครุภัณฑ์ใหม่'} onClose={onClose} wide><form className="form-stack" onSubmit={submit}><div className="form-two"><label>ชื่อครุภัณฑ์<input name="name" required defaultValue={item?.name} placeholder="เช่น กล้องจุลทรรศน์" /></label><label>ประเภท<input name="type" required defaultValue={item?.type} placeholder="เช่น อุปกรณ์ห้องปฏิบัติการ" /></label></div><div className="form-two"><label>รหัสบาร์โค้ด<input name="barcode_Number" required defaultValue={item?.barcode_Number} placeholder="EMF-2569-0001" /></label><label>Smart Tag ID<input name="smartTagId" defaultValue={item?.smartTagId} placeholder="ถ้ามี" /></label></div><div className="form-three"><label>ปีที่รับเข้า<input name="year_input" type="number" min="1950" max={currentYear} required defaultValue={item?.year_input || currentYear} /><small className="form-hint">เลือกปีระหว่าง 1950 ถึง {currentYear}</small></label><label>เลขซีเรียล<input name="serialNumber" defaultValue={item?.serialNumber} placeholder="ถ้ามี" /></label><label>รอบตรวจ (เดือน)<input name="maintenanceIntervalMonths" type="number" min="1" defaultValue={item?.maintenanceIntervalMonths || 12} /></label></div><div className="form-two"><label>หน่วยงาน<select name="department" defaultValue={idOf(item?.department) || ''} disabled={edit}><option value="">เลือกหน่วยงาน</option>{data.departments.map((dept) => <option value={dept._id} key={dept._id}>{dept.name}</option>)}</select></label><label>ห้อง / สถานที่<select name="room" defaultValue={idOf(item?.room) || ''} disabled={edit}><option value="">เลือกห้อง</option>{data.rooms.map((room) => <option value={room._id} key={room._id}>{room.room_code} · {room.name}</option>)}</select></label></div>{edit && <p className="form-hint">หากต้องการเปลี่ยนห้องหรือหน่วยงาน ให้บันทึกผ่านหน้า “การเคลื่อนย้าย” เพื่อเก็บประวัติ</p>}<div className="form-two"><label>สถานะ<select name="status" defaultValue={item?.status || 'active'}>{Object.entries(statusMap).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label><label>สภาพ<select name="condition" defaultValue={item?.condition || 'good'}>{Object.entries(conditionMap).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label></div><div className="form-two"><label>ตรวจครั้งถัดไป<input name="nextInspectionDate" type="date" min={edit ? undefined : today} defaultValue={item?.nextInspectionDate?.slice(0, 10)} /><small className="form-hint">เลือกวันนี้หรือวันที่ในอนาคต (ไม่บังคับ)</small></label><label>คาดว่าเปลี่ยนทดแทน<input name="expectedReplacementDate" type="date" min={edit ? undefined : today} defaultValue={item?.expectedReplacementDate?.slice(0, 10)} /><small className="form-hint">เลือกวันนี้หรือวันที่ในอนาคต (ไม่บังคับ)</small></label></div><label>หมายเหตุ<textarea name="notes" rows="3" defaultValue={item?.notes} placeholder="รายละเอียดเพิ่มเติม" /></label>{error && <div className="form-message error">{error}</div>}<div className="form-actions"><button type="button" className="button secondary" onClick={onClose}>ยกเลิก</button><button className="button primary" disabled={busy}>{busy ? 'กำลังบันทึก...' : 'บันทึกครุภัณฑ์'}</button></div></form></Modal>;
}

function AssetDetail({ item, movements, maintenance, onClose, onEdit }) {
  const itemMoves = movements.filter((entry) => idOf(entry.equipment) === item._id);
  const itemTasks = maintenance.filter((entry) => idOf(entry.equipment) === item._id);
  return <Modal title="รายละเอียดครุภัณฑ์" onClose={onClose} wide><div className="detail-head"><div className="detail-icon"><Boxes size={30} /></div><div><span className="code-cell">{item.barcode_Number}</span><h3>{item.name}</h3><p>{item.type}</p></div><Status status={item.status} /></div><div className="detail-grid"><div><span>หน่วยงาน</span><strong>{item.department?.name || 'ยังไม่ระบุ'}</strong></div><div><span>ห้อง / สถานที่</span><strong>{item.room?.room_code || 'ยังไม่ระบุ'}</strong></div><div><span>ผู้รับผิดชอบ</span><strong>{item.user?.name_sur || 'ยังไม่ระบุ'}</strong></div><div><span>สภาพ</span><strong>{conditionMap[item.condition] || '—'}</strong></div><div><span>ปีที่รับเข้า</span><strong>{item.year_input || '—'}</strong></div><div><span>Smart Tag</span><strong>{item.smartTagId || '—'}</strong></div><div><span>ตรวจครั้งถัดไป</span><strong>{date(item.nextInspectionDate)}</strong></div><div><span>คาดว่าเปลี่ยนทดแทน</span><strong>{date(item.expectedReplacementDate)}</strong></div></div>  <div className="detail-history"><h4>ประวัติการเคลื่อนย้าย</h4>{itemMoves.length ? itemMoves.map((entry) => <p key={entry._id}><MoveRight size={16} /> {entry.fromRoom?.room_code || '—'} → {entry.toRoom?.room_code} · {date(entry.movedAt)} · {entry.reason}</p>) : <p>ยังไม่มีประวัติ</p>}<h4>ประวัติการดูแลรักษา</h4>{itemTasks.length ? itemTasks.map((entry) => <p key={entry._id}><Wrench size={16} /> {kindMap[entry.kind]} · {entry.description} · {date(entry.scheduledAt)}</p>) : <p>ยังไม่มีประวัติ</p>}</div><div className="form-actions"><button className="button secondary" onClick={onEdit}><Settings2 size={17} /> แก้ไขข้อมูล</button></div></Modal>;
}

function ScanModal({ items, onFound, onClose }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  function stop() {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  }
  useEffect(() => () => { clearInterval(timerRef.current); streamRef.current?.getTracks().forEach((track) => track.stop()); }, []);
  function find(code) {
    const match = items.find((item) => item.barcode_Number?.toLowerCase() === code.trim().toLowerCase() || item.smartTagId?.toLowerCase() === code.trim().toLowerCase());
    if (match) { stop(); onFound(match); }
    else setError('ไม่พบรหัสนี้ในระบบ');
  }
  async function startCamera() {
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) { setError('เบราว์เซอร์นี้ไม่รองรับการสแกนด้วยกล้อง กรุณากรอกรหัสแทน'); return; }
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setScanning(true);
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); } }, 0);
      const detector = new window.BarcodeDetector({ formats: ['code_128', 'qr_code', 'ean_13'] });
      timerRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]) find(codes[0].rawValue);
        } catch { /* Keep camera preview available; manual entry remains usable. */ }
      }, 700);
    } catch { setError('เปิดกล้องไม่ได้ กรุณาอนุญาตการใช้กล้องหรือกรอกรหัสแทน'); }
  }
  return <Modal title="สแกนบาร์โค้ดหรือ Smart Tag" onClose={() => { stop(); onClose(); }}><p className="muted">ใช้เครื่องสแกนพิมพ์รหัสลงช่องนี้ หรือเปิดกล้องเมื่อเบราว์เซอร์รองรับ</p><form className="scan-form" onSubmit={(event) => { event.preventDefault(); find(value); }}><label className="search-box"><Barcode size={19} /><input autoFocus value={value} onChange={(event) => setValue(event.target.value)} placeholder="เช่น EMF-2567-0012" aria-label="รหัสบาร์โค้ดหรือ Smart Tag" /></label><button className="button primary">ค้นหา</button></form>{scanning && <video className="scan-video" ref={videoRef} playsInline muted />}{error && <div className="form-message error">{error}</div>}<button className="button secondary" onClick={scanning ? stop : startCamera}><Camera size={17} /> {scanning ? 'ปิดกล้อง' : 'เปิดกล้องสแกน'}</button></Modal>;
}

function Movements({ data, onSave, busy, error }) {
  const [open, setOpen] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await onSave('movements', { equipment: form.get('equipment'), toRoom: form.get('toRoom'), reason: form.get('reason') });
    if (ok) setOpen(false);
  }
  return <><SectionHeader title="การเคลื่อนย้าย" description="บันทึกและตรวจสอบเส้นทางของครุภัณฑ์ทุกชิ้น" action={<button className="button primary" onClick={() => setOpen(true)}><Plus size={18} /> บันทึกการย้าย</button>} /><div className="work-panel list-panel"><div className="panel-heading"><h3>ประวัติการเคลื่อนย้าย</h3><span className="subtle-count">{data.movements.length} รายการ</span></div><div className="history-list">{data.movements.map((entry) => <div className="history-row" key={entry._id}><span className="history-icon"><MoveRight size={20} /></span><div className="history-main"><strong>{entry.equipment?.name || 'ครุภัณฑ์'}</strong><small>{entry.equipment?.barcode_Number}</small></div><div className="history-route"><span>{entry.fromRoom?.room_code || '—'}</span><ArrowRight size={17} /><strong>{entry.toRoom?.room_code || '—'}</strong></div><div className="history-note"><strong>{entry.reason}</strong><small>{entry.movedBy?.name_sur || 'ผู้ใช้'} · {date(entry.movedAt)}</small></div></div>)}{!data.movements.length && <Empty text="ยังไม่มีประวัติการเคลื่อนย้าย" />}</div></div>{open && <Modal title="บันทึกการเคลื่อนย้าย" onClose={() => setOpen(false)}><form className="form-stack" onSubmit={submit}><label>ครุภัณฑ์<select name="equipment" required><option value="">เลือกครุภัณฑ์</option>{data.equipments.map((item) => <option key={item._id} value={item._id}>{item.barcode_Number} · {item.name}</option>)}</select></label><label>ห้องปลายทาง<select name="toRoom" required><option value="">เลือกห้อง</option>{data.rooms.map((room) => <option key={room._id} value={room._id}>{room.room_code} · {room.name}</option>)}</select></label><label>เหตุผล<textarea name="reason" rows="3" required placeholder="ระบุเหตุผลการย้าย" /></label>{error && <div className="form-message error">{error}</div>}<div className="form-actions"><button type="button" className="button secondary" onClick={() => setOpen(false)}>ยกเลิก</button><button className="button primary" disabled={busy}>บันทึกการย้าย</button></div></form></Modal>}</>;
}

function Maintenance({ data, onSave, onComplete, busy, error }) {
  const [open, setOpen] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await onSave('maintenance', { equipment: form.get('equipment'), kind: form.get('kind'), status: form.get('status'), scheduledAt: form.get('scheduledAt'), description: form.get('description'), provider: form.get('provider'), cost: Number(form.get('cost')) || 0 });
    if (ok) setOpen(false);
  }
  return <><SectionHeader title="งานซ่อมบำรุง" description="กำหนดเวลา ติดตามสถานะ และเก็บประวัติงานของอุปกรณ์" action={<button className="button primary" onClick={() => setOpen(true)}><Plus size={18} /> เพิ่มงานซ่อม</button>} /><div className="work-panel list-panel"><div className="panel-heading"><h3>รายการงานทั้งหมด</h3><span className="subtle-count">{data.maintenance.length} งาน</span></div><div className="table-scroll"><table className="data-table"><thead><tr><th>ครุภัณฑ์</th><th>ประเภท</th><th>รายละเอียด</th><th>กำหนดการ</th><th>สถานะ</th><th>ค่าใช้จ่าย</th><th /></tr></thead><tbody>{data.maintenance.map((task) => <tr key={task._id}><td><strong>{task.equipment?.name || '—'}</strong><small>{task.equipment?.barcode_Number}</small></td><td>{kindMap[task.kind]}</td><td>{task.description}</td><td>{date(task.scheduledAt)}</td><td><Status status={task.status} type="task" /></td><td>{Number(task.cost || 0).toLocaleString('th-TH')} บาท</td><td>{task.status !== 'completed' && <button className="tiny-action" onClick={() => onComplete(task)}><Check size={15} /> เสร็จสิ้น</button>}</td></tr>)}</tbody></table>{!data.maintenance.length && <Empty text="ยังไม่มีงานซ่อมบำรุง" />}</div></div>{open && <Modal title="เพิ่มงานซ่อมบำรุง" onClose={() => setOpen(false)}><form className="form-stack" onSubmit={submit}><label>ครุภัณฑ์<select name="equipment" required><option value="">เลือกครุภัณฑ์</option>{data.equipments.map((item) => <option key={item._id} value={item._id}>{item.barcode_Number} · {item.name}</option>)}</select></label><div className="form-two"><label>ประเภท<select name="kind"><option value="inspection">ตรวจสอบ</option><option value="repair">ซ่อมแซม</option><option value="preventive">บำรุงรักษา</option></select></label><label>สถานะ<select name="status"><option value="scheduled">กำหนดแล้ว</option><option value="in_progress">กำลังดำเนินการ</option></select></label></div><div className="form-two"><label>วันที่กำหนด<input name="scheduledAt" type="date" required /></label><label>ค่าใช้จ่าย (บาท)<input name="cost" type="number" min="0" defaultValue="0" /></label></div><label>ผู้ให้บริการ<input name="provider" placeholder="ถ้ามี" /></label><label>รายละเอียดงาน<textarea name="description" rows="3" required placeholder="อธิบายงานที่ต้องดำเนินการ" /></label>{error && <div className="form-message error">{error}</div>}<div className="form-actions"><button type="button" className="button secondary" onClick={() => setOpen(false)}>ยกเลิก</button><button className="button primary" disabled={busy}>บันทึกงาน</button></div></form></Modal>}</>;
}

function Departments({ data, onSave, busy, error }) {
  const [open, setOpen] = useState(null);
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = open === 'department'
      ? { code: form.get('code'), name: form.get('name'), kind: form.get('kind'), parent: form.get('parent') || undefined }
      : { room_code: form.get('room_code'), name: form.get('name'), building: form.get('building'), floor: form.get('floor'), purpose: form.get('purpose'), department: form.get('department') || undefined };
    const ok = await onSave(open === 'department' ? 'departments' : 'rooms', payload);
    if (ok) setOpen(null);
  }
  return <><SectionHeader title="หน่วยงานและสถานที่" description="โครงสร้างคณะ ภาควิชา ห้องปฏิบัติการ และห้องจัดเก็บ" action={<div className="header-actions"><button className="button secondary" onClick={() => setOpen('department')}><Plus size={18} /> เพิ่มหน่วยงาน</button><button className="button primary" onClick={() => setOpen('room')}><Plus size={18} /> เพิ่มห้อง</button></div>} /><div className="department-layout"><section className="work-panel list-panel"><div className="panel-heading"><h3>โครงสร้างหน่วยงาน</h3><span className="subtle-count">{data.departments.length} หน่วยงาน</span></div>{data.departments.map((dept) => <div className="department-row" key={dept._id}><span className="department-icon"><Building2 size={19} /></span><span><strong>{dept.name}</strong><small>{dept.code} · {dept.kind === 'faculty' ? 'คณะ' : dept.kind === 'department' ? 'ภาควิชา' : 'ห้องปฏิบัติการ'}{dept.parent?.name && ` · สังกัด ${dept.parent.name}`}</small></span></div>)}{!data.departments.length && <Empty text="ยังไม่มีหน่วยงาน" />}</section><section className="work-panel list-panel"><div className="panel-heading"><h3>ห้องและสถานที่</h3><span className="subtle-count">{data.rooms.length} ห้อง</span></div>{data.rooms.map((room) => <div className="department-row" key={room._id}><span className="department-icon room"><MapPin size={19} /></span><span><strong>{room.room_code} · {room.name || room.purpose}</strong><small>{room.building || 'ไม่ระบุอาคาร'} · ชั้น {room.floor} · {room.purpose}</small></span></div>)}{!data.rooms.length && <Empty text="ยังไม่มีห้อง" />}</section></div>{open && <Modal title={open === 'department' ? 'เพิ่มหน่วยงาน' : 'เพิ่มห้อง'} onClose={() => setOpen(null)}><form className="form-stack" onSubmit={submit}>{open === 'department' ? <><div className="form-two"><label>รหัสหน่วยงาน<input name="code" required /></label><label>ประเภท<select name="kind"><option value="faculty">คณะ</option><option value="department">ภาควิชา</option><option value="laboratory">ห้องปฏิบัติการ</option></select></label></div><label>ชื่อหน่วยงาน<input name="name" required /></label><label>สังกัด<select name="parent"><option value="">ไม่มี</option>{data.departments.map((dept) => <option key={dept._id} value={dept._id}>{dept.name}</option>)}</select></label></> : <><div className="form-two"><label>รหัสห้อง<input name="room_code" required /></label><label>ชื่อห้อง<input name="name" /></label></div><div className="form-two"><label>อาคาร<input name="building" /></label><label>ชั้น<input name="floor" required /></label></div><label>วัตถุประสงค์<input name="purpose" required /></label><label>หน่วยงาน<select name="department"><option value="">เลือกหน่วยงาน</option>{data.departments.map((dept) => <option key={dept._id} value={dept._id}>{dept.name}</option>)}</select></label></>}{error && <div className="form-message error">{error}</div>}<div className="form-actions"><button type="button" className="button secondary" onClick={() => setOpen(null)}>ยกเลิก</button><button className="button primary" disabled={busy}>บันทึก</button></div></form></Modal>}</>;
}

function Insights({ items }) {
  const insights = items.map((item) => ({ item, risk: riskFor(item), due: daysUntil(item.nextInspectionDate), replacement: daysUntil(item.expectedReplacementDate) })).sort((a, b) => ({ high: 0, medium: 1, low: 2 })[a.risk] - ({ high: 0, medium: 1, low: 2 })[b.risk]);
  return <><SectionHeader title="Algorithm ช่วยวิเคราะห์และวางแผน" description="สรุปความเสี่ยงจากสภาพครุภัณฑ์และรอบตรวจที่บันทึกไว้" /><div className="insight-note"><BrainCircuit size={23} /><div><strong>การประเมินเบื้องต้นจากกฎคำนวณ</strong><p>จัดลำดับจากสภาพอุปกรณ์ วันที่ตรวจ และวันคาดว่าเปลี่ยนทดแทน หากไม่ระบุวันเปลี่ยน ระบบใช้สมมติฐานอายุ 5 ปี </p></div></div><div className="risk-summary"><div><strong>{insights.filter((entry) => entry.risk === 'high').length}</strong><span>เร่งด่วน</span></div><div><strong>{insights.filter((entry) => entry.risk === 'medium').length}</strong><span>ควรติดตาม</span></div><div><strong>{insights.filter((entry) => entry.risk === 'low').length}</strong><span>ปกติ</span></div></div><section className="work-panel list-panel"><div className="panel-heading"><h3>ลำดับการดูแลและเปลี่ยนทดแทน</h3></div><div className="table-scroll"><table className="data-table"><thead><tr><th>ครุภัณฑ์</th><th>ความเสี่ยง</th><th>ตรวจครั้งถัดไป</th><th>เปลี่ยนทดแทน</th><th>เหตุผล</th></tr></thead><tbody>{insights.map(({ item, risk, due, replacement }) => <tr key={item._id}><td><strong>{item.name}</strong><small>{item.barcode_Number}</small></td><td><span className={`risk risk-${risk}`}>{riskText[risk]}</span></td><td>{date(item.nextInspectionDate)}<small>{due !== null ? due < 0 ? `เลยกำหนด ${Math.abs(due)} วัน` : `อีก ${due} วัน` : 'ยังไม่กำหนด'}</small></td><td>{date(item.expectedReplacementDate)}<small>{replacement !== null ? replacement < 0 ? 'ถึงช่วงเปลี่ยนแล้ว' : `อีก ${replacement} วัน` : 'ยังไม่กำหนด'}</small></td><td>{risk === 'high' ? 'สภาพควรตรวจสอบหรือเลยกำหนด' : risk === 'medium' ? 'ใกล้รอบตรวจหรือเริ่มมีความเสี่ยง' : 'ยังไม่พบเงื่อนไขเร่งด่วน'}</td></tr>)}</tbody></table>{!insights.length && <Empty text="ยังไม่มีข้อมูลสำหรับวิเคราะห์" />}</div></section></>;
}

function Requests({ data }) {
  return <><SectionHeader title="คำขอรับบริการ" description="คำขอทดลองใช้และแจ้งซ่อมจากหน้าเว็บไซต์" /><section className="work-panel list-panel"><div className="panel-heading"><h3>คำขอทั้งหมด</h3><span className="subtle-count">{data.inquiries.length} รายการ</span></div><div className="table-scroll"><table className="data-table"><thead><tr><th>ประเภท</th><th>ผู้ติดต่อ</th><th>หน่วยงาน</th><th>รายละเอียด</th><th>วันที่ส่ง</th><th>สถานะ</th></tr></thead><tbody>{data.inquiries.map((entry) => <tr key={entry._id}><td>{entry.kind === 'service' ? 'แจ้งซ่อม' : 'ขอทดลองใช้'}</td><td><strong>{entry.name}</strong><small>{entry.email}</small></td><td>{entry.organization}</td><td>{entry.equipmentCode && <small>{entry.equipmentCode}</small>}{entry.message}</td><td>{date(entry.createdAt)}</td><td><span className="risk risk-medium">{entry.status === 'new' ? 'ใหม่' : entry.status}</span></td></tr>)}</tbody></table>{!data.inquiries.length && <Empty text="ยังไม่มีคำขอรับบริการ" />}</div></section></>;
}

export default function Workspace() {
  const navigate = useNavigate();
  const location = useLocation();
  const isGuest = location.pathname.startsWith('/guest');
  const section = location.pathname.split('/')[2] || 'overview';
  const [user, setUser] = useState(null);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [guestNotice, setGuestNotice] = useState('');
  const guestWriteMessage = 'หากต้องการแก้ไขข้อมูล โปรดลงทะเบียน/เข้าสู่ระบบ';
  function go(id) { navigate(`${isGuest ? '/guest' : '/app'}${id === 'overview' ? '' : `/${id}`}`); setNavOpen(false); }
  async function load() {
    try {
      if (isGuest) {
        const guestData = await api('/public/workspace');
        setUser({ name_sur: 'ผู้เยี่ยมชม' });
        setData({ ...initialData, ...guestData });
        setError('');
        return true;
      }
      const [me, equipments, rooms, departments, movements, maintenance, inquiries] = await Promise.all([
        api('/auth/me'), api('/equipments'), api('/rooms'), api('/departments'), api('/movements'),
        api('/maintenance'), api('/inquiries')
      ]);
      setUser(me);
      setData({ equipments, rooms, departments, movements, maintenance, inquiries });
      setError('');
      return true;
    } catch (cause) {
      if (!isGuest && (cause.message.includes('401') || cause.message.includes('token'))) { clearToken(); navigate('/login'); }
      else setError(cause.message);
      return false;
    } finally { setLoading(false); }
  }
  useEffect(() => { if (!isGuest && !getToken()) navigate('/login'); else void load(); }, []);
  function requestWriteAccess() {
    if (isGuest) {
      setGuestNotice(guestWriteMessage);
      return false;
    }
    return true;
  }
  async function save(kind, payload, id) {
    if (!requestWriteAccess()) return false;
    setBusy(true); setError('');
    try {
      await api(`/${kind}${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      if (!await load()) throw new Error('บันทึกข้อมูลแล้ว แต่โหลดข้อมูลล่าสุดไม่สำเร็จ กรุณารีเฟรชหน้า');
      setModal(null);
      setSelected(null);
      return true;
    } catch (cause) { setError(cause.message); return false; }
    finally { setBusy(false); }
  }
  async function completeTask(task) {
    if (!requestWriteAccess()) return;
    setError('');
    try {
      await api(`/maintenance/${task._id}`, { method: 'PUT', body: JSON.stringify({ status: 'completed', cost: task.cost || 0 }) });
      await load();
    } catch (cause) { setError(cause.message); }
  }
  function logout() {
    if (isGuest) navigate('/login');
    else { clearToken(); navigate('/login'); }
  }
  const currentTitle = menu.find((entry) => entry.id === section)?.label || 'ภาพรวม';
  if (!isGuest && !getToken()) return null;
  return <div className="workspace" onClickCapture={(event) => {
    if (!isGuest) return;
    const button = event.target.closest('button');
    const label = button?.textContent.trim() || '';
    if (/^(เพิ่ม|บันทึก|แก้ไขข้อมูล|เสร็จสิ้น)/.test(label)) {
      event.preventDefault();
      event.stopPropagation();
      setGuestNotice(guestWriteMessage);
    }
  }}>
    {guestNotice && <div className="guest-write-notice" role="alert">{guestNotice}<button className="icon-button" onClick={() => setGuestNotice('')} aria-label="ปิดข้อความ"><X size={18} /></button></div>}
    <aside className={`sidebar ${navOpen ? 'open' : ''}`}><div className="sidebar-top"><Link to={isGuest ? '/guest' : '/app'} className="sidebar-brand"><strong>EMF</strong><span>Faculty Asset</span></Link><button className="icon-button sidebar-close" onClick={() => setNavOpen(false)} aria-label="ปิดเมนู"><X /></button></div><nav aria-label="เมนูระบบ">{menu.map((entry) => <button key={entry.id} className={`nav-item ${section === entry.id ? 'selected' : ''}`} onClick={() => go(entry.id)}><entry.icon size={19} strokeWidth={1.8} />{entry.label}</button>)}</nav><div className="sidebar-bottom"><div className="sidebar-help"><span><Sparkles size={18} /></span><strong>ระบบบริหารครุภัณฑ์</strong><p>ข้อมูลสินทรัพย์ที่ค้นหาและติดตามได้</p></div><button className="nav-item" onClick={logout}><LogOut size={19} /> {isGuest ? 'เข้าสู่ระบบ' : 'ออกจากระบบ'}</button></div></aside>
    {navOpen && <button className="sidebar-scrim" onClick={() => setNavOpen(false)} aria-label="ปิดเมนู" />}
    <div className="work-main"><header className="work-topbar"><div className="work-top-left"><button className="icon-button work-menu" onClick={() => setNavOpen(true)} aria-label="เปิดเมนู"><Menu /></button><div><strong>ระบบบริหารจัดการครุภัณฑ์</strong><small>Faculty Asset Management System</small></div></div><div className="work-top-right"><span className="top-location">{currentTitle}</span><span className="avatar">{user?.name_sur?.slice(0, 1) || 'U'}</span><span className="user-name">{user?.name_sur || 'ผู้ใช้งาน'}<small>ผู้ใช้ทั่วไป</small></span></div></header>
    <main className="work-content">
      {loading ? <div className="loading">กำลังโหลดข้อมูล...</div> : <>
        {error && !modal && <div className="form-message error work-error" role="alert">{error}</div>}
        {section === 'overview' && <Overview data={data} go={go} selectAsset={setSelected} />}
        {section === 'assets' && <Assets data={data} onCreate={() => setModal({ type: 'asset' })} onSelect={setSelected} onScan={() => setModal({ type: 'scan' })} />}
        {section === 'movements' && <Movements data={data} onSave={save} busy={busy} error={error} />}
        {section === 'maintenance' && <Maintenance data={data} onSave={save} onComplete={completeTask} busy={busy} error={error} />}
        {section === 'departments' && <>
          <Departments data={data} onSave={save} busy={busy} error={error} />
        </>}
        {section === 'insights' && <Insights items={data.equipments} />}
        {section === 'requests' && <Requests data={data} />}
        {section === 'CreateQr' && <CreateQr equipments={data.equipments} />}
        {section === 'ScanQr' && <ScanQr />}
        {section === 'Credit' && <CreditPage />}
      </>}
    </main></div>
    {selected && !modal && <AssetDetail item={selected} movements={data.movements} maintenance={data.maintenance} onClose={() => setSelected(null)} onEdit={() => setModal({ type: 'asset', item: selected })} />}
    {modal?.type === 'asset' && <AssetForm data={data} item={modal.item} onSave={(payload) => save('equipments', payload, modal.item?._id)} onClose={() => { setModal(null); setError(''); }} busy={busy} error={error} />}
    {modal?.type === 'scan' && <ScanModal items={data.equipments} onFound={(item) => { setModal(null); setSelected(item); }} onClose={() => setModal(null)} />}
    <ChatbotMock />
  </div>;
}
