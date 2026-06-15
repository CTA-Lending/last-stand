const KEY = 'laststand.endless.best';

export function createSaveService(storage = globalThis.localStorage) {
  return {
    getBest() {
      const raw = storage ? storage.getItem(KEY) : null;
      return raw ? JSON.parse(raw) : null;
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
