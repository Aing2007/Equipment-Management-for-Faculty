import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Barcode, BrainCircuit, Building2, Check, ChevronDown,
  ClipboardCheck, Clock3, MapPin, Menu, ScanLine, ShieldCheck,
  Stethoscope, Users, Wrench, X
} from 'lucide-react';
import { api } from '../api';

const features = [
  { icon: ScanLine, title: 'สแกนแล้วรู้ทันที', text: 'ค้นหาครุภัณฑ์ด้วยบาร์โค้ดหรือ Smart Tag พร้อมรายละเอียดผู้รับผิดชอบและสถานะล่าสุด' },
  { icon: MapPin, title: 'รู้ตำแหน่งและประวัติ', text: 'บันทึกทุกการย้ายห้องหรือภาควิชา ย้อนดูที่มาและเหตุผลได้ในที่เดียว' },
  { icon: Stethoscope, title: 'ดูแลอย่างต่อเนื่อง', text: 'กำหนดรอบตรวจ เก็บประวัติซ่อม และเห็นรายการที่ใกล้ถึงกำหนดก่อนงานสะดุด' },
  { icon: BrainCircuit, title: 'วางแผนจากข้อมูล', text: 'ประเมินความเสี่ยงและช่วงเปลี่ยนทดแทนจากสภาพและวันที่บันทึกไว้' }
];

function InquiryForm({ kind, onClose }) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const isService = kind === 'service';
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus('');
    const form = new FormData(event.currentTarget);
    try {
      await api('/inquiries', { method: 'POST', body: JSON.stringify({
        kind,
        name: form.get('name'),
        organization: form.get('organization'),
        email: form.get('email'),
        phone: form.get('phone'),
        equipmentCode: form.get('equipmentCode') || undefined,
        preferredDate: form.get('preferredDate') || undefined,
        message: form.get('message')
      }) });
      event.currentTarget.reset();
      setStatus('ส่งคำขอเรียบร้อยแล้ว ทีมงานจะติดต่อกลับตามข้อมูลที่ให้ไว้');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="modal public-modal" role="dialog" aria-modal="true" aria-labelledby="inquiry-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="ปิด"><X size={20} /></button>
        <h2 id="inquiry-title">{isService ? 'แจ้งขอรับบริการซ่อมบำรุง' : 'ขอทดลองใช้หรือปรึกษาระบบ'}</h2>
        <p className="muted">{isService ? 'กรอกข้อมูลอุปกรณ์และอาการที่พบ เพื่อให้ทีมงานติดต่อกลับ' : 'บอกความต้องการของหน่วยงาน แล้วทีมงานจะติดต่อกลับเพื่อพูดคุยรายละเอียด'}</p>
        <form className="form-stack" onSubmit={submit}>
          <div className="form-two">
            <label>ชื่อผู้ติดต่อ<input name="name" required placeholder="ชื่อ-นามสกุล" /></label>
            <label>หน่วยงาน<input name="organization" required placeholder="คณะ / ภาควิชา / องค์กร" /></label>
          </div>
          <div className="form-two">
            <label>อีเมล<input name="email" type="email" required placeholder="name@university.ac.th" /></label>
            <label>เบอร์โทรศัพท์<input name="phone" type="tel" placeholder="หมายเลขติดต่อ" /></label>
          </div>
          {isService ? <label>รหัสครุภัณฑ์<input name="equipmentCode" placeholder="ถ้ามี" /></label> : <label>วันที่สะดวกให้ติดต่อ<input name="preferredDate" type="date" /></label>}
          <label>{isService ? 'อาการเสีย / รายละเอียดงาน' : 'สิ่งที่ต้องการปรึกษา'}<textarea name="message" required rows="4" placeholder={isService ? 'อธิบายปัญหาที่พบ...' : 'จำนวนครุภัณฑ์ หน่วยงาน และสิ่งที่สนใจ...'} /></label>
          {status && <div className={status.startsWith('ส่ง') ? 'form-message success' : 'form-message error'} role="status">{status}</div>}
          <button className="button primary" type="submit" disabled={busy}>{busy ? 'กำลังส่ง...' : 'ส่งคำขอ'} <ArrowRight size={17} /></button>
        </form>
      </div>
    </div>
  );
}

export default function PublicPage() {
  const [form, setForm] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="public-page">
      <header className="public-header">
        <div className="public-container header-inner">
          <a className="brand" href="#top" aria-label="EMF หน้าแรก"><strong>EMF</strong><span>Faculty Asset</span></a>
          <button className="mobile-menu icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="เปิดเมนู">{menuOpen ? <X /> : <Menu />}</button>
          <nav className={menuOpen ? 'public-nav open' : 'public-nav'} aria-label="เมนูหลัก">
            <a href="#features" onClick={() => setMenuOpen(false)}>ฟีเจอร์</a>
            <a href="#audience" onClick={() => setMenuOpen(false)}>กลุ่มผู้ใช้งาน</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>ราคา</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>ติดต่อ</a>
          </nav>
          <Link to="/login" className="button primary login-link">เข้าสู่ระบบ <ArrowRight size={17} /></Link>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-photo" aria-hidden="true" />
          <div className="hero-wash" aria-hidden="true" />
          <div className="public-container hero-inner">
            <div className="hero-copy">
              <h1>รู้ว่าครุภัณฑ์อยู่ที่ไหน<br /><em>พร้อมดูแลก่อนถึงวันเสีย</em></h1>
              <p>ระบบบริหารจัดการครุภัณฑ์สำหรับคณะและภาควิชา ติดตามการใช้งาน วางแผนบำรุงรักษา และดูแลสินทรัพย์ให้พร้อมใช้งานอย่างต่อเนื่อง</p>
              <div className="hero-actions">
                <button className="button primary large" onClick={() => setForm('demo')}>ขอทดลองใช้ <ArrowRight size={20} /></button>
                <a className="button outline large" href="#features">สำรวจฟีเจอร์</a>
              </div>
            </div>
          </div>
        </section>

        <section className="benefit-band" aria-label="ประโยชน์หลัก">
          <div className="public-container benefit-grid">
            <div><MapPin /><span><strong>ติดตามตำแหน่งและสถานะ</strong><small>รู้ได้ทันทีว่าอยู่ที่ไหน ใครใช้อยู่</small></span></div>
            <div><Wrench /><span><strong>วางแผนบำรุงรักษาล่วงหน้า</strong><small>ลดความเสี่ยงก่อนเกิดความเสียหาย</small></span></div>
            <div><Users /><span><strong>รองรับทุกกลุ่มผู้ใช้งาน</strong><small>อาจารย์ เจ้าหน้าที่ และนักศึกษา</small></span></div>
            <div><ShieldCheck /><span><strong>บริหารสินทรัพย์อย่างมั่นใจ</strong><small>ข้อมูลครบถ้วน โปร่งใส ตรวจสอบได้</small></span></div>
          </div>
        </section>

        <section id="features" className="public-section features-section">
          <div className="public-container">
            <div className="section-heading split-heading">
              <div><span className="section-rule">ฟีเจอร์หลัก</span><h2>จัดการครุภัณฑ์ได้ครบ<br /><em>ในที่เดียว</em></h2></div>
              <p>จากจุดเริ่มต้นที่สแกนพบ ไปจนถึงวันที่ต้องซ่อมหรือจัดซื้อใหม่ ทุกข้อมูลเชื่อมต่อเป็นประวัติเดียวกัน</p>
            </div>
            <div className="feature-list">
              {features.map((feature, index) => <article className="feature-row" key={feature.title}>
                <span className="feature-number">0{index + 1}</span>
                <feature.icon className="feature-icon" size={30} strokeWidth={1.7} />
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                <ArrowRight className="feature-arrow" size={20} />
              </article>)}
            </div>
          </div>
        </section>

        <section id="audience" className="public-section audience-section">
          <div className="public-container audience-layout">
            <div className="audience-intro">
              <span className="section-rule">ออกแบบเพื่อสถาบันการศึกษา</span>
              <h2>หนึ่งระบบ<br />หลายหน่วยงาน</h2>
              <p>ให้คณะ ภาควิชา และห้องปฏิบัติการทำงานบนข้อมูลชุดเดียวกัน พร้อมกำหนดสิทธิ์ให้เหมาะกับแต่ละบทบาท</p>
              <button className="text-link" onClick={() => setForm('demo')}>ปรึกษาการใช้งานสำหรับหน่วยงาน <ArrowRight size={18} /></button>
            </div>
            <div className="audience-content">
              <div className="audience-item"><Building2 /><div><h3>คณะและผู้บริหาร</h3><p>เห็นภาพรวมสินทรัพย์ งบซ่อม และรายการที่ควรเตรียมเปลี่ยนทดแทน</p></div></div>
              <div className="audience-item"><Users /><div><h3>ภาควิชาและเจ้าหน้าที่</h3><p>ค้นหาอุปกรณ์ ตรวจนับ และติดตามการย้ายได้โดยไม่ต้องไล่เอกสารหลายชุด</p></div></div>
              <div className="audience-item"><ClipboardCheck /><div><h3>ห้องปฏิบัติการ</h3><p>รู้สภาพเครื่องมือ กำหนดรอบตรวจ และเก็บประวัติซ่อมให้พร้อมใช้งาน</p></div></div>
            </div>
          </div>
          <div className="public-container comparison">
            <div className="comparison-title"><h3>ต่างจากระบบคลังสินค้าทั่วไปอย่างไร</h3><p>EMF ออกแบบตามวงจรชีวิตครุภัณฑ์ของหน่วยงานการศึกษา</p></div>
            <div className="comparison-table">
              <div className="comparison-head"><span>ความสามารถ</span><span>ระบบคลังสินค้าทั่วไป</span><strong>EMF</strong></div>
              <div><span>ติดตามห้อง ภาควิชา และผู้รับผิดชอบ</span><span>ขึ้นอยู่กับการปรับแต่ง</span><strong><Check size={18} /> รองรับโดยตรง</strong></div>
              <div><span>ประวัติย้ายและซ่อมรายครุภัณฑ์</span><span>ข้อมูลแยกส่วน</span><strong><Check size={18} /> ประวัติต่อเนื่อง</strong></div>
              <div><span>เตือนรอบตรวจและวางแผนทดแทน</span><span>ไม่ใช่งานหลัก</span><strong><Check size={18} /> เห็นความเสี่ยงล่วงหน้า</strong></div>
            </div>
          </div>
        </section>

        <section id="pricing" className="public-section pricing-section">
          <div className="public-container">
            <div className="section-heading"><span className="section-rule">ราคาและรูปแบบบริการ</span><h2>เริ่มจากสิ่งที่หน่วยงานต้องใช้</h2><p>แยกค่าใช้จ่ายชัดเจนตามการติดตั้ง ระบบ และบริการที่เกิดขึ้นจริง</p></div>
            <div className="pricing-grid">
              <article><span className="price-step">01 / ติดตั้ง</span><h3>ติดแท็กครุภัณฑ์</h3><p className="price"><strong>200–500 บาท</strong><span>/ ชิ้น จ่ายครั้งเดียว</span></p><p>ขึ้นอยู่กับชนิดแท็กและรูปแบบการติดตั้ง</p></article>
              <article><span className="price-step">02 / ระบบ</span><h3>Software / Server</h3><p className="price"><strong>รายเดือนหรือรายปี</strong></p><p>ประเมินตามขนาดหน่วยงาน จำนวนรายการ และการใช้งาน</p></article>
              <article><span className="price-step">03 / บริการ</span><h3>บำรุงรักษาและซ่อม</h3><p className="price"><strong>จ่ายตามการใช้งาน</strong></p><p>คิดค่าบริการเป็นรายครั้งตามขอบเขตงานที่แจ้ง</p></article>
            </div>
            <p className="pricing-note">* ราคาติดตั้งเป็นช่วงประมาณการ กรุณาติดต่อเพื่อประเมินราคาให้เหมาะกับหน่วยงาน</p>
          </div>
        </section>

        <section id="contact" className="contact-section">
          <div className="public-container contact-layout">
            <div><h2>เริ่มจัดการครุภัณฑ์<br />ให้เป็นระบบวันนี้</h2><p>เลือกช่องทางที่ตรงกับความต้องการ แล้วทีมงานจะติดต่อกลับ</p></div>
            <div className="contact-actions">
              <button className="button light large" onClick={() => setForm('demo')}>ขอทดลองใช้ / ติดต่อสอบถาม <ArrowRight size={18} /></button>
              <button className="button ghost-light large" onClick={() => setForm('service')}>แจ้งขอรับบริการซ่อม <Wrench size={18} /></button>
            </div>
          </div>
        </section>
      </main>
      <footer className="public-footer"><div className="public-container footer-inner"><span className="brand"><strong>EMF</strong><span>Faculty Asset</span></span><span>ระบบจัดการครุภัณฑ์สำหรับสถาบันการศึกษา</span><a href="#top">กลับขึ้นด้านบน ↑</a></div></footer>
      {form && <InquiryForm kind={form} onClose={() => setForm(null)} />}
    </div>
  );
}
