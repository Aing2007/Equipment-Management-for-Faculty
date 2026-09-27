const TOKEN_KEY = 'emf_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function api(path, options = {}) {
  const headers = { ...options.headers };
  if (options.body) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`/api/v1${path}`, { ...options, headers });
  } catch {
    throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาเริ่ม EMF backend');
  }
  let payload;
  try { payload = await response.json(); }
  catch { throw new Error(response.ok ? 'เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง' : 'เซิร์ฟเวอร์ EMF ไม่พร้อมใช้งาน กรุณาเริ่ม backend และ MongoDB'); }
  if (!response.ok || !payload.success) throw new Error(payload.message || 'เกิดข้อผิดพลาด');
  return payload.data ?? payload;
}
