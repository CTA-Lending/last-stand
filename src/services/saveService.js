import { STARTER_TOWERS } from '../systems/account.js';

const KEY = 'laststand.endless.best';
const PROFILE_KEY = 'laststand.profile';
const CAMPAIGN_KEY = 'laststand.campaign';

export function createSaveService(storage = globalThis.localStorage) {
  return {
    getBest() {
      const raw = storage ? storage.getItem(KEY) : null;
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;  // 壞掉的存檔當作無記錄，避免整頁掛掉
      }
    },
    submit(record) {
      const best = this.getBest();
      if (!best || record.wave > best.wave ||
          (record.wave === best.wave && record.score > best.score)) {
        storage.setItem(KEY, JSON.stringify(record));
        return true;
      }
      return false;
    },
    loadProfile() {
      const raw = storage ? storage.getItem(PROFILE_KEY) : null;
      const def = { tickets: 0, unlocked: [], lastLogin: null, diamonds: 0,
        owned: [...STARTER_TOWERS], loadout: [...STARTER_TOWERS], cleared: [], hellCleared: [] };
      if (!raw) return def;
      try {
        const p = { ...def, ...JSON.parse(raw) };
        // 舊存檔遷移：把轉蛋解鎖過的傳奇塔併入 owned，避免被覆蓋遺失
        for (const t of (p.unlocked || [])) if (!p.owned.includes(t)) p.owned.push(t);
        return p;
      } catch { return def; }
    },
    saveProfile(p) { if (storage) storage.setItem(PROFILE_KEY, JSON.stringify(p)); },
    getCampaignBest(key) {
      const raw = storage ? storage.getItem(CAMPAIGN_KEY) : null;
      let all = {};
      if (raw) { try { all = JSON.parse(raw); } catch { all = {}; } }
      return all[key] != null ? all[key] : null;
    },
    submitCampaign(key, time) {
      const raw = storage ? storage.getItem(CAMPAIGN_KEY) : null;
      let all = {};
      if (raw) { try { all = JSON.parse(raw); } catch { all = {}; } }
      if (all[key] == null || time < all[key]) { all[key] = time; storage.setItem(CAMPAIGN_KEY, JSON.stringify(all)); return true; }
      return false;
    },
  };
}
