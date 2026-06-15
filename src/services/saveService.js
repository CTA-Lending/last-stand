const KEY = 'laststand.endless.best';

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
  };
}
