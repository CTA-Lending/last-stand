// Firebase 設定（遊戲專用獨立專案，與 CTA 會員中心完全隔離）。
//
// 開啟登入步驟：
//   1. console.firebase.google.com → 新增專案（例：last-stand-game）
//   2. 專案內「新增 Web 應用程式」→ 複製 firebaseConfig 物件，貼到下面 FIREBASE_CONFIG
//   3. Authentication → Sign-in method → 啟用 Google
//   4. Authentication → Settings → Authorized domains → 加入 cta-lending.github.io
//      （之後若用自訂網域，再把該網域也加進去）
//   5. 把 AUTH_ENABLED 改成 true，push 即上線
//
// 註：這些值是前端公開值（apiKey 不是密鑰，靠 Authorized domains + 安全規則保護），放 repo 沒問題。

// 等下面兩步在 Firebase Console 做完（啟用 Google 登入 + 授權網域加 cta-lending.github.io），
// 我會把 AUTH_ENABLED 改成 true 並 push 開通。
export const AUTH_ENABLED = true;

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBPKSH_hrDBlZGyJ4EVVjr11Ao5nlzDlQY',
  authDomain: 'last-stand-game-1bee5.firebaseapp.com',
  projectId: 'last-stand-game-1bee5',
  storageBucket: 'last-stand-game-1bee5.firebasestorage.app',
  messagingSenderId: '741804597440',
  appId: '1:741804597440:web:8d9f911290603058bd4d25',
  measurementId: 'G-K9X435W07H',
};
