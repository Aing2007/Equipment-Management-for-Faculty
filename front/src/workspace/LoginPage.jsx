import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LockKeyhole, ScanLine } from 'lucide-react';
import { api, setToken } from '../api';

const modeLabels = {
  login: 'เข้าสู่ระบบ',
  signup: 'สมัครบัญชี',
  reset: 'ตั้งรหัสผ่านใหม่'
};

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    const form = new FormData(event.currentTarget);
    const username = String(form.get('username') || '').trim().toLowerCase();
    const password = String(form.get('password') || '');
    try {
      if (mode === 'reset') {
        const newPassword = String(form.get('newPassword') || '');
        const confirmPassword = String(form.get('confirmPassword') || '');
        if (newPassword !== confirmPassword) throw new Error('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน');
        const response = await api('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ username, newPassword, confirmPassword })
        });
        setMode('login');
        setSuccess(response.message || 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว กรุณาเข้าสู่ระบบ');
      } else {
        const response = await api(`/auth/${mode === 'signup' ? 'register' : 'login'}`, {
          method: 'POST',
          body: JSON.stringify({
            username,
            password,
            ...(mode === 'signup' ? { name_sur: form.get('name_sur') } : {})
          })
        });
        setToken(response.token);
        navigate('/app');
      }
    } catch (cause) {
      setError(cause.message || 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusy(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError('');
    setSuccess('');
  }

  return (
    <div className="login-page">
      <div className="login-art"><div className="login-art-inner"><span className="brand light-brand"><strong>EMF</strong><span>Faculty Asset</span></span><div><ScanLine size={38} /><h1>ทุกครุภัณฑ์<br />มีเรื่องราวที่ติดตามได้</h1><p>จัดการตำแหน่ง ประวัติ และการดูแลรักษา<br />จากที่เดียว</p></div></div></div>
      <div className="login-side">
        <div className="login-card">
          <div className="login-symbol"><LockKeyhole size={24} /></div>
          <h2>{modeLabels[mode]} EMF</h2>
          <p>{mode === 'signup' ? 'สร้างบัญชีเพื่อเริ่มบันทึกและจัดการข้อมูลในระบบ' : mode === 'reset' ? 'กรอก Username และรหัสผ่านใหม่สองครั้ง' : 'เข้าสู่ระบบเพื่อดูและจัดการข้อมูลจากฐานข้อมูล'}</p>
          <form onSubmit={submit} className="form-stack">
            {mode === 'signup' && <label>ชื่อที่แสดง<input name="name_sur" autoComplete="name" required maxLength="100" placeholder="กรอกชื่อของคุณ" /></label>}
            <label>Username<input name="username" autoComplete="username" required minLength="3" maxLength="40" pattern="(?:[a-zA-Z0-9_.]|-)+" placeholder="กรอก Username" /></label>
            {mode === 'reset' ? <>
              <label>New password<input name="newPassword" type="password" autoComplete="new-password" required minLength="8" maxLength="128" placeholder="อย่างน้อย 8 ตัวอักษร" /></label>
              <label>ยืนยัน New password<input name="confirmPassword" type="password" autoComplete="new-password" required minLength="8" maxLength="128" placeholder="กรอกรหัสผ่านเดิมอีกครั้ง" /></label>
            </> : <label>Password<input name="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={mode === 'signup' ? 8 : undefined} maxLength="128" placeholder={mode === 'signup' ? 'อย่างน้อย 8 ตัวอักษร' : 'กรอกรหัสผ่าน'} /></label>}
            {error && <div className="form-message error" role="alert">{error}</div>}
            {success && <div className="form-message success" role="status">{success}</div>}
            <button className="button primary full" disabled={busy}>{busy ? 'กำลังดำเนินการ...' : modeLabels[mode]} <ArrowRight size={18} /></button>
          </form>
          <div className="auth-links">
            {mode === 'login' && <>
              <button type="button" onClick={() => changeMode('signup')}>สมัครบัญชีใหม่</button>
              <button type="button" onClick={() => changeMode('reset')}>ลืมรหัสผ่าน?</button>
            </>}
            {mode !== 'login' && <button type="button" onClick={() => changeMode('login')}>กลับไปเข้าสู่ระบบ</button>}
          </div>
          {mode === 'reset' && <small className="auth-prototype-note">การกู้คืนต้นแบบยืนยันด้วย Username เท่านั้น ผู้ที่ทราบ Username สามารถตั้งรหัสผ่านใหม่ได้</small>}
        </div>
      </div>
    </div>
  );
}
