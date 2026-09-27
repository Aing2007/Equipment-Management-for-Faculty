import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LockKeyhole, ScanLine } from 'lucide-react';
import { api, setToken } from '../api';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await api('/auth/login', { method: 'POST', body: JSON.stringify({
        username: form.get('username'), password: form.get('password')
      }) });
      setToken(response.token);
      sessionStorage.removeItem('emf_demo');
      navigate('/app');
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }
  function enterDemo() {
    sessionStorage.setItem('emf_demo', '1');
    navigate('/app');
  }
  return (
    <div className="login-page">
      <div className="login-art"><div className="login-art-inner"><span className="brand light-brand"><strong>EMF</strong><span>Faculty Asset</span></span><div><ScanLine size={38} /><h1>ทุกครุภัณฑ์<br />มีเรื่องราวที่ติดตามได้</h1><p>จัดการตำแหน่ง ประวัติ และการดูแลรักษา<br />จากที่เดียว</p></div></div></div>
      <div className="login-side">
        <div className="login-card">
          <div className="login-symbol"><LockKeyhole size={24} /></div>
          <h2>เข้าสู่ระบบ EMF</h2>
          <p>สำหรับเจ้าหน้าที่และผู้ใช้งานภายในหน่วยงาน</p>
          <form onSubmit={submit} className="form-stack">
            <label>ชื่อผู้ใช้<input name="username" autoComplete="username" required placeholder="กรอกชื่อผู้ใช้" /></label>
            <label>รหัสผ่าน<input name="password" type="password" autoComplete="current-password" required placeholder="กรอกรหัสผ่าน" /></label>
            {error && <div className="form-message error" role="alert">{error}</div>}
            <button className="button primary full" disabled={busy}>{busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'} <ArrowRight size={18} /></button>
          </form>
          <div className="login-divider"><span>หรือ</span></div>
          <button className="button outline full" onClick={enterDemo}>ดูตัวอย่างระบบ</button>
          <small>โหมดตัวอย่างใช้ข้อมูลในเบราว์เซอร์ ไม่มีการบันทึกลงฐานข้อมูล</small>
        </div>
      </div>
    </div>
  );
}
