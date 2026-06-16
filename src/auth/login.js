// 遊戲 Google 登入 — Firebase 獨立專案（與 CTA 會員中心完全隔離，零污染）。
// 用戶資料只進這個 Firebase 專案；用戶數在 Firebase Console → Authentication 直接看。
// enabled=false 時整個模組惰性，不載入 SDK、不影響遊戲。
import { FIREBASE_CONFIG, AUTH_ENABLED } from './firebase-config.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';
let _auth = null, _authMod = null, _db = null, _fsMod = null, _user = null, _onChange = null, _initPromise = null;

export function getUser() { return _user; }
export function isAuthEnabled() { return AUTH_ENABLED; }

// 玩家登入後寫進 Firestore users/{uid}（供管理者後台統計用戶數）
async function recordUser(u) {
  if (!_db || !_fsMod) return;
  try {
    await _fsMod.setDoc(_fsMod.doc(_db, 'users', u.uid), {
      email: u.email || '', name: u.displayName || u.email || '',
      lastLogin: _fsMod.serverTimestamp(),
      createdAt: _fsMod.serverTimestamp(),  // merge:true → 已存在不覆蓋掉首登(由規則/或忽略)
    }, { merge: true });
  } catch (e) { console.warn('[auth] 記錄用戶失敗(可能 Firestore 未啟用)', e); }
}

async function ensureFirebase() {
  if (_auth) return _auth;
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const appMod = await import(`${SDK}/firebase-app.js`);
    _authMod = await import(`${SDK}/firebase-auth.js`);
    const app = appMod.initializeApp(FIREBASE_CONFIG);
    _auth = _authMod.getAuth(app);
    try { _fsMod = await import(`${SDK}/firebase-firestore.js`); _db = _fsMod.getFirestore(app); } catch {}
    _authMod.onAuthStateChanged(_auth, (u) => {
      _user = u ? { name: u.displayName || u.email, email: u.email, uid: u.uid } : null;
      if (u) recordUser(u);
      _onChange && _onChange(_user);
    });
    return _auth;
  })();
  return _initPromise;
}

export async function initAuth(onChange) {
  _onChange = onChange;
  if (!AUTH_ENABLED) return;
  try { await ensureFirebase(); } catch (e) { console.warn('[auth] Firebase 初始化失敗', e); }
}

export async function signIn() {
  if (!AUTH_ENABLED) return;
  try {
    await ensureFirebase();
    await _authMod.signInWithPopup(_auth, new _authMod.GoogleAuthProvider());
  } catch (e) { console.warn('[auth] Google 登入失敗', e); }
}

export async function logout() {
  if (!_auth || !_authMod) return;
  try { await _authMod.signOut(_auth); } catch (e) { console.warn('[auth] 登出失敗', e); }
}
