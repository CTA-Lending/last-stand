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

export const AUTH_ENABLED = false;

export const FIREBASE_CONFIG = {
  apiKey: 'PASTE_API_KEY',
  authDomain: 'PASTE_PROJECT.firebaseapp.com',
  projectId: 'PASTE_PROJECT_ID',
  appId: 'PASTE_APP_ID',
};
