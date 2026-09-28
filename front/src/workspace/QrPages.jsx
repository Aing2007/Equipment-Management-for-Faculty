import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { ArrowDownToLine, Camera, Check, QrCode, ScanLine, ShieldCheck } from 'lucide-react';

const QR_FORMAT = 'EMF-ASSET';
const statusLabels = { active: 'ใช้งานปกติ', maintenance: 'อยู่ระหว่างซ่อม', retired: 'ปลดระวาง', lost: 'สูญหาย' };
const conditionLabels = { good: 'ดี', watch: 'เฝ้าระวัง', poor: 'ควรซ่อม' };
const labels = {
  _id: 'รหัสข้อมูล', name: 'ชื่อครุภัณฑ์', type: 'ประเภท', barcode_Number: 'รหัสบาร์โค้ด',
  smartTagId: 'Smart Tag ID', serialNumber: 'เลขซีเรียล', year_input: 'ปีที่รับเข้า',
  acquiredAt: 'วันที่รับเข้า', purchasePrice: 'ราคาจัดซื้อ', status: 'สถานะ',
  condition: 'สภาพ', department: 'หน่วยงาน', room: 'ห้อง / สถานที่', user: 'ผู้รับผิดชอบ',
  maintenanceIntervalMonths: 'รอบตรวจ (เดือน)', expectedLifespanYears: 'อายุการใช้งานที่คาดการณ์ (ปี)',
  lastInspectionDate: 'วันที่ตรวจล่าสุด', nextInspectionDate: 'วันที่ตรวจครั้งถัดไป',
  expectedReplacementDate: 'วันที่คาดว่าเปลี่ยนทดแทน', notes: 'หมายเหตุ',
  createdAt: 'วันที่สร้างข้อมูล', updatedAt: 'วันที่แก้ไขข้อมูล'
};

function SectionHeader({ title, description, action }) {
  return <div className="work-section-header"><div><h2>{title}</h2><p>{description}</p></div>{action}</div>;
}

function humanize(value) {
  return String(value).replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ');
}

function displayValue(value, key) {
  if (value == null || value === '') return 'ไม่ระบุ';
  if (key === 'status') return statusLabels[value] || String(value);
  if (key === 'condition') return conditionLabels[value] || String(value);
  if (typeof value === 'boolean') return value ? 'ใช่' : 'ไม่ใช่';
  if (Array.isArray(value)) return value.length ? value.map((entry) => typeof entry === 'object' ? JSON.stringify(entry) : String(entry)).join(', ') : 'ไม่มีข้อมูล';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: value.includes('T') ? 'short' : undefined }).format(parsed);
  }
  if (key === 'purchasePrice' && typeof value === 'number') return `${value.toLocaleString('th-TH')} บาท`;
  return String(value);
}

function AssetDetails({ asset }) {
  const fields = [];
  function collect(source, prefix = '', depth = 0) {
    Object.entries(source).forEach(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value) && depth < 3) {
        if (Object.keys(value).length) collect(value, path, depth + 1);
        else fields.push([path, 'ไม่มีข้อมูล']);
      } else {
        fields.push([path, displayValue(value, key)]);
      }
    });
  }
  collect(asset);
  return <div className="qr-asset-grid">{fields.map(([key, value]) => {
    const leaf = key.split('.').at(-1);
    const parent = key.includes('.') ? key.split('.').slice(0, -1).map(humanize).join(' · ') : '';
    return <div className="qr-asset-field" key={key}><span>{parent ? `${parent} · ` : ''}{labels[leaf] || humanize(leaf)}</span><strong>{value}</strong></div>;
  })}</div>;
}

function parseAssetQr(rawValue) {
  if (typeof rawValue !== 'string' || !rawValue.trim()) throw new Error('ไม่พบข้อมูลใน QR Code');
  let data;
  try {
    data = JSON.parse(rawValue.trim());
  } catch {
    throw new Error('QR Code นี้ไม่ใช่ข้อมูลครุภัณฑ์ของระบบ');
  }
  if (data?.format !== QR_FORMAT || data?.version !== 1 || !data.asset || typeof data.asset !== 'object' || Array.isArray(data.asset) || typeof data.asset.name !== 'string' || typeof data.asset.barcode_Number !== 'string') {
    throw new Error('รูปแบบ QR Code ไม่ถูกต้อง หรือไม่มีข้อมูลครุภัณฑ์ครบถ้วน');
  }
  return data.asset;
}

export function CreateQr({ equipments }) {
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const selected = equipments.find((item) => item._id === selectedId);
  const options = useMemo(() => equipments.filter((item) => `${item.name} ${item.barcode_Number} ${item.type}`.toLowerCase().includes(search.trim().toLowerCase())), [equipments, search]);

  async function createCode() {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      const payload = JSON.stringify({ format: QR_FORMAT, version: 1, asset: selected });
      const image = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 360,
        color: { dark: '#10243a', light: '#ffffff' }
      });
      setQrImage(image);
    } catch (cause) {
      setQrImage('');
      setError(`สร้าง QR Code ไม่สำเร็จ${cause?.message ? `: ${cause.message}` : ''}`);
    } finally {
      setBusy(false);
    }
  }

  function changeAsset(event) {
    setSelectedId(event.target.value);
    setQrImage('');
    setError('');
  }

  return <>
    <SectionHeader title="สร้าง QR Code ครุภัณฑ์" description="เลือกครุภัณฑ์หนึ่งรายการเพื่อสร้าง QR Code ที่บรรจุข้อมูลทั้งหมด" />
    <div className="qr-page-layout">
      <section className="work-panel qr-create-panel">
        <div className="qr-panel-title"><span className="qr-feature-icon"><QrCode size={22} /></span><div><h3>เลือกครุภัณฑ์</h3><p>QR Code จะบันทึกข้อมูล ณ เวลาที่สร้าง</p></div></div>
        {equipments.length ? <>
          <label className="qr-field-label" htmlFor="qr-asset-search">ค้นหาครุภัณฑ์</label>
          <input id="qr-asset-search" className="qr-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาด้วยชื่อหรือรหัสครุภัณฑ์" />
          <label className="qr-field-label" htmlFor="qr-asset-select">ครุภัณฑ์ (เลือกได้ 1 รายการ)</label>
          <select id="qr-asset-select" className="qr-input" value={selectedId} onChange={changeAsset}>
            <option value="">เลือกครุภัณฑ์</option>
            {options.map((item) => <option value={item._id} key={item._id}>{item.barcode_Number} · {item.name}</option>)}
          </select>
          {!options.length && <p className="qr-muted">ไม่พบครุภัณฑ์ที่ตรงกับคำค้นหา</p>}
          {selected && <div className="qr-selected-summary"><span className="qr-code-label">{selected.barcode_Number}</span><strong>{selected.name}</strong><span>{selected.type || 'ไม่ระบุประเภท'}</span><span>{selected.department?.name || 'ไม่ระบุหน่วยงาน'} · {selected.room?.room_code || 'ไม่ระบุห้อง'}</span></div>}
          <button className="button primary qr-generate-button" onClick={createCode} disabled={!selected || busy}><QrCode size={18} />{busy ? 'กำลังสร้าง...' : 'สร้าง QR Code'}</button>
        </> : <div className="qr-empty"><QrCode size={34} /><p>ยังไม่มีครุภัณฑ์ให้สร้าง QR Code</p><Link className="button primary" to="/app/assets">ไปหน้าครุภัณฑ์</Link></div>}
        {error && <div className="form-message error" role="alert">{error}</div>}
      </section>
      <section className="work-panel qr-preview-panel">
        {qrImage && selected ? <>
          <div className="qr-panel-title"><span className="qr-feature-icon success"><Check size={22} /></span><div><h3>QR Code พร้อมใช้งาน</h3><p>สแกนเพื่อดูข้อมูลครุภัณฑ์ที่บันทึกไว้</p></div></div>
          <div className="qr-image-wrap"><img src={qrImage} alt={`QR Code ของ ${selected.name}`} /></div>
          <strong className="qr-preview-name">{selected.name}</strong><span className="qr-code-label">{selected.barcode_Number}</span>
          <div className="qr-actions"><a className="button primary" href={qrImage} download={`QR-${selected.barcode_Number}.png`}><ArrowDownToLine size={17} />ดาวน์โหลด PNG</a><button className="button secondary" onClick={() => window.print()}>พิมพ์ QR Code</button></div>
          <p className="qr-privacy-note"><ShieldCheck size={16} />QR Code นี้มีข้อมูลตามที่แสดงในระเบียนครุภัณฑ์ โปรดเก็บรักษาให้เหมาะสม</p>
        </> : <div className="qr-placeholder"><QrCode size={48} /><strong>QR Code จะแสดงที่นี่</strong><span>เลือกครุภัณฑ์แล้วกด “สร้าง QR Code”</span></div>}
      </section>
    </div>
    {selected && <section className="work-panel qr-details-panel"><div className="panel-heading"><div><h3>ข้อมูลที่จะบันทึกใน QR Code</h3><p>ข้อมูลทุกฟิลด์ของครุภัณฑ์ที่มีในระบบ</p></div></div><AssetDetails asset={selected} /></section>}
  </>;
}

export function ScanQr() {
  const generatedId = useId();
  const readerId = `asset-qr-reader-${generatedId.replaceAll(':', '')}`;
  const scannerRef = useRef(null);
  const handledRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [rawValue, setRawValue] = useState('');
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState('');

  async function stopScanner() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch (cause) {
      setError(`ปิดกล้องไม่สำเร็จ${cause?.message ? `: ${cause.message}` : ''}`);
    }
  }

  function handleDecoded(raw) {
    try {
      const found = parseAssetQr(raw);
      handledRef.current = true;
      setAsset(found);
      setRawValue('');
      setError('');
      void stopScanner();
    } catch (cause) {
      setError(cause.message);
    }
  }

  async function startScanner() {
    setError('');
    setAsset(null);
    handledRef.current = false;
    setStarting(true);
    let scanner;
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      scanner = new Html5Qrcode(readerId, { verbose: false });
      scannerRef.current = scanner;
      
      await scanner.start(
        { facingMode: 'environment' },
        { 
          fps: 15,  // ✨ เพิ่มจาก 10
          qrbox: { width: 300, height: 300 },  // ✨ ขยายจาก 250
          aspectRatio: 1,
          useBarCodeDetectorIfSupported: true  // ✨ ใช้ API ระบบ
        },
        (decodedText) => { 
          if (!handledRef.current) handleDecoded(decodedText); 
        },
        () => {}
      );
      setScanning(true);
    } catch (cause) {
      scannerRef.current = null;
      try { scanner?.clear(); } catch { }
      setError(`เปิดกล้องไม่ได้ กรุณาอนุญาตการใช้กล้องและตรวจสอบว่าใช้ HTTPS`);
    } finally {
      setStarting(false);
    }
  }

  function submitManual(event) {
    event.preventDefault();
    handleDecoded(rawValue);
  }

  useEffect(() => () => {
    const scanner = scannerRef.current;
    if (scanner?.isScanning) void scanner.stop().then(() => scanner.clear()).catch((cause) => console.error('ปิดกล้องสแกน QR Code ไม่สำเร็จ', cause));
    else if (scanner) {
      try { scanner.clear(); } catch (cause) { console.error('ล้างหน้าสแกน QR Code ไม่สำเร็จ', cause); }
    }
    scannerRef.current = null;
  }, []);

  return <>
    <SectionHeader title="สแกน QR Code ครุภัณฑ์" description="ใช้กล้องมือถือหรือคอมพิวเตอร์เพื่ออ่าน QR Code และดูข้อมูลที่บันทึกอยู่ในโค้ด" />
    <div className="qr-page-layout scan-layout">
      <section className="work-panel qr-scan-panel">
        <div className="qr-panel-title"><span className="qr-feature-icon"><Camera size={22} /></span><div><h3>สแกนด้วยกล้อง</h3><p>วาง QR Code ให้อยู่ในกรอบและมีแสงเพียงพอ</p></div></div>
        <div className={`qr-reader-frame ${scanning || starting ? 'active' : ''}`}><div id={readerId} /><div className="qr-reader-hint">{starting ? 'กำลังเปิดกล้อง...' : scanning ? 'กำลังค้นหา QR Code' : 'กล้องจะแสดงตรงนี้'}</div></div>
        <button className={`button ${scanning ? 'secondary' : 'primary'} qr-camera-button`} onClick={scanning ? () => { void stopScanner(); } : startScanner} disabled={starting}>{scanning ? <><Check size={18} />หยุดสแกน</> : <><Camera size={18} />{starting ? 'กำลังเปิดกล้อง...' : 'เปิดกล้องเพื่อสแกน'}</>}</button>
        <div className="qr-secure-hint"><ShieldCheck size={16} /><span>เบราว์เซอร์ต้องได้รับอนุญาตใช้กล้อง และต้องเปิดผ่าน HTTPS หรือ localhost</span></div>
      </section>
      <section className="work-panel qr-manual-panel">
        <div className="qr-panel-title"><span className="qr-feature-icon"><ScanLine size={22} /></span><div><h3>เปิดข้อมูลจาก QR Code</h3><p>หากไม่สะดวกเปิดกล้อง ให้วางข้อความที่อ่านได้จาก QR Code</p></div></div>
        <form className="qr-manual-form" onSubmit={submitManual}><label htmlFor="qr-raw-value">ข้อมูล QR Code</label><textarea id="qr-raw-value" rows="7" value={rawValue} onChange={(event) => setRawValue(event.target.value)} placeholder='{"format":"EMF-ASSET","version":1,"asset":{...}}' /><button className="button secondary" disabled={!rawValue.trim()}><ScanLine size={17} />แสดงข้อมูล</button></form>
        {error && <div className="form-message error" role="alert">{error}</div>}
      </section>
    </div>
    {asset && <section className="work-panel qr-scanned-result"><div className="qr-result-heading"><span className="qr-feature-icon success"><Check size={22} /></span><div><h3>สแกน QR Code สำเร็จ</h3><p>รายละเอียดครุภัณฑ์ตามข้อมูลที่ฝังอยู่ใน QR Code</p></div><span className="qr-code-label">{asset.barcode_Number}</span></div><h2 className="qr-result-name">{asset.name}</h2><p className="qr-result-type">{asset.type || 'ไม่ระบุประเภท'}</p><AssetDetails asset={asset} /></section>}
  </>;
}
