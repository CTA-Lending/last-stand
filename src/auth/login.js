// 遊戲 Google 登入：沿用 CTA 會員系統現成端點，玩家登入即寫進統一會員庫(portal_user)，
// 後台 /api/v1/admin/stats 的 total_users 就看得到人數。
//
// ⚠️ enabled 預設 false：等遊戲網域加進 Google Cloud Console「授權的 JavaScript 來源」
//    且後端 CORS 放行後，再改成 true（改這一個值即可上線登入）。
const AUTH = {
  enabled: false,
  clientId: '116518215104-va52lc2vckutt43m8p58gc4ov4bjo0o8.apps.googleusercontent.com',
  api: 'https://api.crypto-trading-academy.com',
  source: 'game',
};

const KEY = 'ls_user';
let _user = null;

export function getUser() { return _user; }
export function isAuthEnabled() { return AUTH.enabled; }

function loadGIS() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.accounts && window.google.accounts.id) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function postGoogleLogin(credential, onChange) {
  try {
    const r = await fetch(`${AUTH.api}/api/v1/auth/google`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: credential, source: AUTH.source }),
    });
    if (!r.ok) throw new Error('login http ' + r.status);
    const u = await r.json();
    _user = { name: u.display_name || u.email, email: u.email };
    localStorage.setItem(KEY, JSON.stringify(_user));
    onChange && onChange(_user);
  } catch (e) {
    console.warn('[auth] Google 登入失敗', e);
    onChange && onChange(null, e);
  }
}

export async function initAuth(onChange) {
  // 還原上次登入的顯示（純前端展示；真正 session 在後端 HttpOnly cookie）
  try { const raw = localStorage.getItem(KEY); if (raw) { _user = JSON.parse(raw); onChange && onChange(_user); } } catch {}
  if (!AUTH.enabled) return;
  try {
    await loadGIS();
    window.google.accounts.id.initialize({
      client_id: AUTH.clientId,
      callback: (resp) => postGoogleLogin(resp.credential, onChange),
    });
  } catch (e) { console.warn('[auth] GIS 載入失敗', e); }
}

export function renderLoginButton(el) {
  if (!AUTH.enabled || !el || !(window.google && window.google.accounts && window.google.accounts.id)) return false;
  window.google.accounts.id.renderButton(el, { theme: 'filled_black', size: 'medium', shape: 'pill', text: 'signin_with' });
  return true;
}

export async function logout(onChange) {
  try { await fetch(`${AUTH.api}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' }); } catch {}
  _user = null;
  localStorage.removeItem(KEY);
  onChange && onChange(null);
}
