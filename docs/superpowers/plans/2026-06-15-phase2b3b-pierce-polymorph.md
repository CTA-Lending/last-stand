# Phase 2b-3b：穿透 + 變形 — 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** 兩座改寫投射物命中行為的新塔：🎯人類十字弩(穿透——一發直線貫穿多敵)、🐑魔法師變形術(機率把非首領秒變羊)。皆走科技樹(十字弩需兵營、變形需奧術塔)與 2 階+分支。

**Architecture:** 在 `projectile.js` 加兩條路：穿透走直線位移+多段碰撞(不鎖定單體)；變形在單體命中時擲骰即死。變形判定抽成純函式 `rollPolymorph`(TDD)。塔資料加 `pierce`/`polymorph`，applyStats/buildTower/spawnProjectile 帶上。

**Tech Stack:** 同前。

---

## Task 1：變形判定純函式（TDD）

**Files:** Modify `src/entities/projectile.js`(加 export), Create `tests/polymorph.test.js`

- [ ] **Step 1: 失敗測試** `tests/polymorph.test.js`
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rollPolymorph } from '../src/entities/projectile.js';

test('首領免疫變形', () => {
  assert.equal(rollPolymorph({ boss: true }, 1, () => 0), false);
});
test('非首領且骰中 → 變形', () => {
  assert.equal(rollPolymorph({ boss: false }, 0.3, () => 0.1), true);  // 0.1<0.3
});
test('非首領但沒骰中 → 否', () => {
  assert.equal(rollPolymorph({ boss: false }, 0.3, () => 0.9), false); // 0.9>=0.3
});
```

- [ ] **Step 2: 跑測試確認失敗** `cd last-stand && node --test tests/polymorph.test.js`

- [ ] **Step 3: 在 `src/entities/projectile.js` 加 export（檔尾）**
```js
// 變形判定：首領免疫；rand() < chance 則變形(即死)
export function rollPolymorph(target, chance, rand) {
  if (target.boss) return false;
  return rand() < chance;
}
```

- [ ] **Step 4: 跑測試確認通過** `node --test tests/polymorph.test.js`（3）

- [ ] **Step 5: Commit** `git add src/entities/projectile.js tests/polymorph.test.js && git commit -m "feat(polymorph): 變形判定純函式"`

---

## Task 2：projectile 穿透+變形 + 塔資料

**Files:** Modify `src/entities/projectile.js`, `src/entities/tower.js`, `src/data/towers.js`

- [ ] **Step 1: spawnProjectile 帶 pierce/polymorph**
改寫為先建 proj 再條件補穿透欄位：
```js
export function spawnProjectile(tower, target) {
  const proj = {
    id: nextId++, x: tower.x, y: tower.y, targetId: target.id,
    speed: 420, damage: tower.damage, attackType: tower.attackType,
    splash: tower.splash, effect: tower.effect || null,
    color: tower.color, alive: true, chain: tower.chain || null,
    polymorph: tower.polymorph || null,
  };
  if (tower.pierce) {
    const d = dist(tower.x, tower.y, target.x, target.y) || 1;
    proj.pierce = true; proj.pierceMax = tower.pierce;
    proj.dx = (target.x - tower.x) / d; proj.dy = (target.y - tower.y) / d;
    proj.hitSet = new Set(); proj.traveled = 0;
    proj.range = tower.range; proj.canHitAir = tower.canHitAir;
  }
  return proj;
}
```

- [ ] **Step 2: updateProjectile 加穿透分支 + 變形套用**
在 `updateProjectile` 最前面加穿透分支：
```js
export function updateProjectile(p, enemies, dt, now) {
  if (p.pierce) return updatePierce(p, enemies, dt, now);
  // ...原本 homing 邏輯不變...
```
單體命中迴圈(splash/單體那段)套變形——把
```js
    for (const e of hits) {
      e.hp -= computeDamage(p.damage, p.attackType, e.armorType);
      if (p.effect) applyEffect(e, p.effect, now);
      e.hitFlash = 0.12;
    }
```
改為
```js
    for (const e of hits) {
      e.hp -= computeDamage(p.damage, p.attackType, e.armorType);
      if (p.effect) applyEffect(e, p.effect, now);
      if (p.polymorph && rollPolymorph(e, p.polymorph.chance, Math.random)) e.hp = 0; // 變形即死
      e.hitFlash = 0.12;
    }
```
檔尾新增穿透更新函式：
```js
function updatePierce(p, enemies, dt, now) {
  p.x += p.dx * p.speed * dt;
  p.y += p.dy * p.speed * dt;
  p.traveled += p.speed * dt;
  const newly = [];
  for (const e of enemies) {
    if (!e.alive || p.hitSet.has(e.id)) continue;
    if (!p.canHitAir && e.armorType === 'flying') continue;
    if (dist(p.x, p.y, e.x, e.y) <= (e.radius || 12) + 4) {
      e.hp -= computeDamage(p.damage, p.attackType, e.armorType);
      if (p.effect) applyEffect(e, p.effect, now);
      e.hitFlash = 0.12;
      p.hitSet.add(e.id);
      newly.push({ x: e.x, y: e.y });
    }
  }
  if (p.hitSet.size >= p.pierceMax || p.traveled > p.range + 80) p.alive = false;
  return newly.length ? { x: p.x, y: p.y, hits: newly } : null;
}
```

- [ ] **Step 3: tower.js 帶 pierce/polymorph**
`applyStats(t, s)` 加：
```js
  if (s.pierce !== undefined) t.pierce = s.pierce;
  if (s.polymorph !== undefined) t.polymorph = s.polymorph;
```
`buildTower` 的 t 物件加：`pierce: def.pierce || 0, polymorph: def.polymorph || null,`

- [ ] **Step 4: towers.js 新增兩塔**（插在 elf_moonblade 之後、human_barracks 之前；皆在 TOWERS 內）
```js
  human_ballista: {
    name: '人類十字弩', faction: 'human', attackType: 'physical', canHitAir: true, requires: ['human_barracks'],
    color: '#cdb27a', splash: 0, pierce: 3,
    levels: [ { cost: 110, damage: 24, range: 150, fireRate: 1.0 }, { cost: 100, damage: 42, range: 165, fireRate: 1.1 } ],
    branches: [
      { name: '貫穿弩', cost: 150, damage: 62, range: 185, fireRate: 1.2, pierce: 6 },
      { name: '重弩', cost: 150, damage: 115, range: 170, fireRate: 0.8, pierce: 3 },
    ],
  },
  mage_polymorph: {
    name: '魔法師變形術', faction: 'mage', attackType: 'magic', canHitAir: true, requires: ['mage_arcane'],
    color: '#e58ad8', splash: 0, polymorph: { chance: 0.12 },
    levels: [ { cost: 140, damage: 14, range: 120, fireRate: 0.9 }, { cost: 130, damage: 22, range: 130, fireRate: 1.0 } ],
    branches: [
      { name: '群體變形', cost: 180, damage: 30, range: 145, fireRate: 1.1, polymorph: { chance: 0.20 } },
      { name: '死亡變形', cost: 180, damage: 42, range: 135, fireRate: 1.0, polymorph: { chance: 0.32 } },
    ],
  },
```

- [ ] **Step 5: 驗證** `npm test` 全綠（+polymorph 3 = 67）；`node --check` 改動檔。

- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(towers): 十字弩穿透 + 變形術即死 兩塔"`

---

## Task 3：瀏覽器實測（控制器）
- [ ] 兵營在場 → 十字弩解鎖；蓋下去 → 一發貫穿一排敵人(多隻同時受擊)。
- [ ] 奧術塔在場 → 變形術解鎖；蓋下去 → 偶爾把非首領敵人瞬間消滅(變形即死)，首領不受影響。
- [ ] 升級分支：貫穿弩穿透數變多；死亡變形機率提高。

---

## 完成定義（Phase 2b-3b Done）
- 十字弩穿透多敵、變形術機率秒殺非首領，皆走科技樹與升級分支。
- 變形判定有單元測試。全測試綠、瀏覽器實測通過。

## Self-Review
- 穿透走獨立 updatePierce(直線+多段碰撞+hitSet 去重+pierceMax/射程上限)，與 homing/chain/splash 互不干擾。
- 變形只在單體/splash 命中路徑擲骰即死，首領免疫(rollPolymorph 已測)。
- applyStats/buildTower/spawnProjectile 一致帶 pierce/polymorph；分支升級換參數。
- 穿透 spawn 用發射瞬間方向，飛行免疫依 canHitAir。
