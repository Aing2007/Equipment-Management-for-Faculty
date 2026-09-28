import { useState } from 'react';
import { ArrowDown, Boxes, GraduationCap, Users } from 'lucide-react';

// Put photos in front/public/team and set photoPath to a path such as /team/member-01.jpg.
const developers = [
  { name: 'นายสุธินันท์ ศรีวิเศษ', studentId: '69011172', year: 'ปี 1', faculty: 'คณะวิศวกรรมศาสตร์', major: 'วิศวกรรมคอมพิวเตอร์', role: 'หัวหน้าทีม & CEO', photoPath: '/Equipment-Management-for-Faculty/front/public/IMG_2690.JPG', skin: '#d99a73', hair: '#253344', shirt: '#168b88', background: '#d9f0eb' },
  { name: 'xxxxx xxxxx', studentId: '66010002', year: 'ปี x', faculty: 'คณะx', major: 'XX', role: 'ออกแบบ UX/UI', photoPath: '', skin: '#edbc9a', hair: '#4b3030', shirt: '#bd6b59', background: '#f7e6dc' },
  { name: 'xxxxx xxxxx', studentId: '66010003', year: 'ปี x', faculty: 'คณะx', major: 'XX', role: 'พัฒนา Frontend', photoPath: '', skin: '#bf805d', hair: '#292a30', shirt: '#416f9b', background: '#dfebf7' },
  { name: 'xxxxx xxxxx', studentId: '66010004', year: 'ปี x', faculty: 'คณะx', major: 'XX', role: 'พัฒนา Frontend', photoPath: '', skin: '#f0c8a6', hair: '#47352f', shirt: '#9571ae', background: '#eee5f5' },
  { name: 'xxxxx xxxxx', studentId: '66010005', year: 'ปี x', faculty: 'คณะx', major: 'XX', role: 'พัฒนา Backend และ API', photoPath: '', skin: '#d6a17b', hair: '#302d2a', shirt: '#5d8d72', background: '#e4f1e6' },
  { name: 'xxxxx xxxxx', studentId: '66010006', year: 'ปี x', faculty: 'คณะx', major: 'XX', role: 'ออกแบบฐานข้อมูล', photoPath: '', skin: '#e3af8d', hair: '#382b28', shirt: '#d18a48', background: '#f7edda' },
  { name: 'xxxxx xxxxx', studentId: '66010007', year: 'ปี x', faculty: 'คณะx', major: 'XX', role: 'ทดสอบระบบและประกันคุณภาพ', photoPath: '', skin: '#b97a59', hair: '#27252a', shirt: '#498d9a', background: '#ddf0f0' },
  { name: 'xxxxx xxxxx', studentId: '66010008', year: 'ปี x', faculty: 'คณะx', major: 'XX', role: 'จัดทำเอกสารและประสานงาน', photoPath: '', skin: '#efc5a4', hair: '#49302d', shirt:'#c26d84', background:'#f7e5ec' },
  { name: 'xxxxx xxxxx', studentId: '66010009', year:'ปี x', faculty: 'คณะx', major: 'XX', role: 'พัฒนาและดูแลระบบ QR Code', photoPath:'', skin:'#d29a76', hair:'#302b29', shirt:'#6f7fbd', background:'#e6eafa' }
];

function ProfilePortrait({ member }) {
  const [imageFailed, setImageFailed] = useState(false);
  if (member.photoPath && !imageFailed) {
    return <img className="credit-portrait" src={member.photoPath} alt={`ภาพโปรไฟล์ของ${member.name}`} onError={() => setImageFailed(true)} />;
  }

  return (
    <svg className="credit-portrait" viewBox="0 0 120 120" role="img" aria-label={`ภาพตัวอย่างของ${member.name}`}>
      <circle cx="60" cy="60" r="60" fill={member.background} />
      <path d="M20 120c3-23 18-36 40-36s37 13 40 36" fill={member.shirt} />
      <path d="M47 75h26v20H47z" fill={member.skin} />
      <ellipse cx="60" cy="52" rx="25" ry="31" fill={member.skin} />
      <path d="M35 51c-2-25 10-38 27-38 18 0 28 13 25 37-5-5-8-13-9-20-10 10-25 14-42 14z" fill={member.hair} />
      <path d="M43 51c4 2 8 2 12 0m10 0c4 2 8 2 12 0" fill="none" stroke={member.hair} strokeLinecap="round" strokeWidth="2" />
      <path d="M54 67c4 3 8 3 12 0" fill="none" stroke="#9c5e57" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function CreditPage() {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div className="credit-page">
      <section className="credit-hero">
        <div className="credit-hero-copy">
          <span className="credit-eyebrow"><Users size={15} /> ทีมพัฒนา</span>
          <h2>เบื้องหลังระบบ<br /><em>EMF</em> Faculty Asset</h2>
          <p>ทีมงานผู้ร่วมออกแบบและพัฒนาระบบบริหารจัดการครุภัณฑ์ของคณะ</p>
        </div>
        <div className="credit-hero-count" aria-label="สมาชิกผู้พัฒนา 9 คน">
          <strong>{developers.length}</strong>
          <span>สมาชิกผู้พัฒนา</span>
          <Users size={22} />
        </div>
        <span className="credit-hero-decoration" aria-hidden="true"><Boxes /></span>
      </section>
      <section className="credit-project-summary">
        <span className="credit-project-icon"><GraduationCap size={24} /></span>
        <div>
          <span className="credit-eyebrow">ABOUT THE PROJECT</span>
          <h3>เกี่ยวกับโครงการ</h3>
          <h4>ผลงานนี้เป็นส่วนหนึ่งของ Group Project รายวิชา From Dev To The Moon (90642208) </h4>
          <h4>สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง (KMITL)</h4>
          <p>EMF Faculty Asset เป็นระบบสำหรับจัดเก็บและติดตามข้อมูลครุภัณฑ์ ตั้งแต่รายละเอียดสินทรัพย์ สถานที่จัดเก็บ ประวัติการเคลื่อนย้าย และงานซ่อมบำรุง พร้อมเครื่องมือสร้างและสแกน QR Code สำหรับ Tracking รวมถึงผู้ช่วย AI สำหรับค้นหาคำตอบจากข้อมูลในระบบ</p>
          
        </div>
      </section>
      <div className="credit-section-heading">
        <div>
          
          <h3>สมาชิกผู้พัฒนา</h3>
          <p>ชี้เมาส์หรือเลือกการ์ดเพื่อดูรายละเอียดของสมาชิก</p>
        </div>
      </div>

      <section className="credit-team-grid" aria-label="สมาชิกผู้พัฒนาทั้ง 9 คน">
        {developers.map((member, index) => {
          const selected = selectedId === member.studentId;
          return (
            <article
              className={`credit-member-card${selected ? ' is-selected' : ''}`}
              key={member.studentId}
            >
              <button
                className="credit-member-toggle"
                type="button"
                aria-expanded={selected}
                onClick={() => setSelectedId(selected ? null : member.studentId)}
              >
                <span className="credit-member-topline"><span>สมาชิก {String(index + 1).padStart(2, '0')}</span><ArrowDown size={16} /></span>
                <span className="credit-member-identity">
                <span className="credit-portrait-wrap">
                  <ProfilePortrait member={member} />
                </span>
                  <span className="credit-member-name">{member.name}</span>
                  <span className="credit-member-role">{member.role}</span>
                </span>
                <span className="credit-member-details">
                  <span className="credit-member-details-inner">
                    <span><strong>รหัสนักศึกษา</strong><span>{member.studentId}</span></span>
                    <span><strong>ชั้นปี</strong><span>{member.year}</span></span>
                    <span><strong>คณะ</strong><span>{member.faculty}</span></span>
                    <span><strong>สาขา</strong><span>{member.major}</span></span>
                    <span><strong>หน้าที่</strong><span>{member.role}</span></span>
                  </span>
                </span>
              </button>
            </article>
          );
        })}
      </section>

      
    </div>
  );
}

export default CreditPage;
