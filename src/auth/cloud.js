// 雲端層：用 Firestore 同步「玩家進度」+「全球排行」+ 寫最高層數供管理者後台。
// 全部在登入後才動作；未登入/未啟用 Firestore 一律安全略過(回 null / no-op)。
import { getFs, getUid, getUserName } from './login.js';

const PROFILE_FIELDS = (p) => ({
  diamonds: p.diamonds || 0, tickets: p.tickets || 0,
  owned: p.owned || [], loadout: p.loadout || [], cleared: p.cleared || [],
  seenTutorial: !!p.seenTutorial,
});

// 讀雲端進度（回 profile 物件或 null）
export async function loadCloudProfile() {
  const c = getFs(), uid = getUid();
  if (!c || !uid) return null;
  try {
    const snap = await c.fs.getDoc(c.fs.doc(c.db, 'users', uid));
    return snap.exists() ? (snap.data().profile || null) : null;
  } catch (e) { console.warn('[cloud] 讀進度失敗', e); return null; }
}

// 寫雲端進度（debounce，避免頻繁寫）
let _pt = null;
export function pushCloudProfile(profile) {
  const c = getFs(), uid = getUid();
  if (!c || !uid) return;
  clearTimeout(_pt);
  _pt = setTimeout(async () => {
    try {
      await c.fs.setDoc(c.fs.doc(c.db, 'users', uid),
        { profile: PROFILE_FIELDS(profile), lastLogin: c.fs.serverTimestamp() }, { merge: true });
    } catch (e) { console.warn('[cloud] 寫進度失敗', e); }
  }, 800);
}

// 提交無盡成績到全球榜（只在更高層數時更新）+ 寫 users.bestFloor 供後台排行
export async function submitCloudScore(rec) {
  const c = getFs(), uid = getUid();
  if (!c || !uid || !rec) return;
  try {
    const ref = c.fs.doc(c.db, 'leaderboard', uid);
    const cur = await c.fs.getDoc(ref);
    if (cur.exists() && (cur.data().floor || 0) >= rec.floor) return; // 沒更高就不更新
    const name = getUserName() || '玩家';
    await c.fs.setDoc(ref, {
      name, floor: rec.floor, round: rec.round, layer: rec.layer, time: rec.time || 0,
      at: c.fs.serverTimestamp(),
    }, { merge: true });
    await c.fs.setDoc(c.fs.doc(c.db, 'users', uid),
      { bestFloor: rec.floor, bestRound: rec.round, bestLayer: rec.layer }, { merge: true });
  } catch (e) { console.warn('[cloud] 提交成績失敗', e); }
}

// 取全球榜前 N（回陣列或 null）
export async function fetchGlobalBoard(limitN = 20) {
  const c = getFs();
  if (!c) return null;
  try {
    const q = c.fs.query(c.fs.collection(c.db, 'leaderboard'), c.fs.orderBy('floor', 'desc'), c.fs.limit(limitN));
    const snap = await c.fs.getDocs(q);
    const rows = [];
    snap.forEach(d => { const x = d.data(); rows.push({ name: x.name, floor: x.floor, round: x.round, layer: x.layer, time: x.time, uid: d.id }); });
    return rows;
  } catch (e) { console.warn('[cloud] 讀全球榜失敗', e); return null; }
}
