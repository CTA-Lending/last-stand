# Phase 2b-3a：連鎖機制 + 連環閃電/月刃 — 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** 新增「連鎖傷害」機制：投射物命中後，傷害在鄰近敵人間跳躍、每跳遞減。兩座新塔共用：🔵魔法師連環閃電(magic)、🌙精靈月刃(physical)，並加閃電線特效。兩塔皆走科技樹(需對應基礎塔)與 2 階+分支升級。

**Architecture:** 連鎖目標選取做成純函式 `systems/chain.js`(TDD)。投射物 `chain` 欄位觸發連鎖傷害套用。粒子模組加 `spark()` 畫漸隱閃電線（併入既有 update/draw，不動 main/renderer 呼叫點）。塔資料加 chain，applyStats/buildTower/spawnProjectile 帶上 chain。

**Tech Stack:** 同前。

---

## Task 1：連鎖目標選取（chain，TDD）

**Files:** Create `src/systems/chain.js`, `tests/chain.test.js`

`chainTargets(first, enemies, radius, maxJumps)`：從 first 起，反覆找「離上一個節點最近、半徑內、未用過、存活、未到終點」的敵人，最多再跳 maxJumps 次。回傳有序敵人陣列(含 first)。

- [ ] **Step 1: 失敗測試** `tests/chain.test.js`
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chainTargets } from '../src/systems/chain.js';

const mk = (id, x) => ({ id, x, y: 0, alive: true, reachedEnd: false });

test('沿最近距離依序連鎖', () => {
  const a = mk(1, 0), b = mk(2, 30), c = mk(3, 70);
  const seq = chainTargets(a, [a, b, c], 50, 3);
  assert.deepEqual(seq.map(e => e.id), [1, 2, 3]); // 0→30→70 都在50內逐跳
});
test('超出半徑就停', () => {
  const a = mk(1, 0), b = mk(2, 200);
  const seq = chainTargets(a, [a, b], 50, 3);
  assert.deepEqual(seq.map(e => e.id), [1]);
});
test('maxJumps 限制跳數', () => {
  const es = [mk(1, 0), mk(2, 20), mk(3, 40), mk(4, 60)];
  const seq = chainTargets(es[0], es, 50, 1);
  assert.equal(seq.length, 2); // first + 1 跳
});
test('不重複命中同一敵', () => {
  const a = mk(1, 0), b = mk(2, 10);
  const seq = chainTargets(a, [a, b], 50, 5);
  assert.equal(new Set(seq.map(e => e.id)).size, seq.length);
});
```

- [ ] **Step 2: 跑測試確認失敗** `cd last-stand && node --test tests/chain.test.js`

- [ ] **Step 3: 實作 `src/systems/chain.js`**
```js
import { dist } from '../core/geometry.js';

export function chainTargets(first, enemies, radius, maxJumps) {
  const chain = [first];
  const used = new Set([first.id]);
  let cur = first;
  for (let j = 0; j < maxJumps; j++) {
    let best = null, bd = radius;
    for (const e of enemies) {
      if (!e.alive || e.reachedEnd || used.has(e.id)) continue;
      const d = dist(cur.x, cur.y, e.x, e.y);
      if (d <= bd) { bd = d; best = e; }
    }
    if (!best) break;
    chain.push(best); used.add(best.id); cur = best;
  }
  return chain;
}
```

- [ ] **Step 4: 跑測試確認通過** `node --test tests/chain.test.js`（4）

- [ ] **Step 5: Commit** `git add src/systems/chain.js tests/chain.test.js && git commit -m "feat(chain): 連鎖目標選取純函式"`

---

## Task 2：投射物連鎖傷害 + 塔資料 + 粒子閃電線

**Files:** Modify `src/entities/projectile.js`, `src/entities/tower.js`, `src/data/towers.js`, `src/render/particles.js`

- [ ] **Step 1: particles.js 加 spark 閃電線**（併入既有 update/draw）
在檔案頂加 `const sparks = [];`，並新增/修改：
```js
export function spark(x1, y1, x2, y2, color) {
  sparks.push({ x1, y1, x2, y2, color, life: 0.18, maxLife: 0.18 });
}
```
`updateParticles(dt)` 末端追加：
```js
  for (let i = sparks.length - 1; i >= 0; i--) {
    sparks[i].life -= dt;
    if (sparks[i].life <= 0) sparks.splice(i, 1);
  }
```
`drawParticles(ctx)` 末端（`ctx.globalAlpha = 1;` 之前）追加：
```js
  for (const s of sparks) {
    ctx.globalAlpha = Math.max(0, s.life / s.maxLife);
    ctx.strokeStyle = s.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke();
  }
```

- [ ] **Step 2: projectile.js 連鎖傷害**
`spawnProjectile` return 物件加 `chain: tower.chain || null,`。
`updateProjectile` 命中區塊，在 `const hits = p.splash > 0 ...` 之前插入連鎖分支：
```js
    if (p.chain) {
      const seq = chainTargets(target, enemies, p.chain.radius, p.chain.count);
      let dmg = p.damage;
      const nodes = [];
      for (const e of seq) {
        e.hp -= computeDamage(dmg, p.attackType, e.armorType);
        if (p.effect) applyEffect(e, p.effect, now);
        e.hitFlash = 0.12;
        nodes.push({ x: e.x, y: e.y });
        dmg *= p.chain.falloff;
      }
      return { x: target.x, y: target.y, hits: seq, nodes };
    }
```
檔頭 import：`import { chainTargets } from '../systems/chain.js';`

- [ ] **Step 3: tower.js 帶上 chain**
`applyStats(t, s)` 內加：`if (s.chain !== undefined) t.chain = s.chain;`
`buildTower` 的 t 物件加：`chain: def.chain || null,`

- [ ] **Step 4: towers.js 新增兩塔**（接在 dwarf_mortar 之後、human_barracks 之前或之後皆可，需在 TOWERS 內）
```js
  mage_chain: {
    name: '連環閃電', faction: 'mage', attackType: 'magic', canHitAir: true, requires: ['mage_arcane'],
    color: '#5bc8ff', splash: 0, chain: { count: 3, radius: 85, falloff: 0.65 },
    levels: [ { cost: 130, damage: 24, range: 130, fireRate: 1.0 }, { cost: 120, damage: 42, range: 140, fireRate: 1.1 } ],
    branches: [
      { name: '雷暴', cost: 170, damage: 70, range: 150, fireRate: 1.2, chain: { count: 5, radius: 95, falloff: 0.7 } },
      { name: '導電', cost: 170, damage: 92, range: 150, fireRate: 1.1, chain: { count: 3, radius: 85, falloff: 0.8 } },
    ],
  },
  elf_moonblade: {
    name: '精靈月刃', faction: 'elf', attackType: 'physical', canHitAir: true, requires: ['elf_archer'],
    color: '#aef0c8', splash: 0, chain: { count: 2, radius: 75, falloff: 0.6 },
    levels: [ { cost: 110, damage: 20, range: 125, fireRate: 1.3 }, { cost: 100, damage: 34, range: 135, fireRate: 1.5 } ],
    branches: [
      { name: '回旋月刃', cost: 150, damage: 54, range: 150, fireRate: 1.6, chain: { count: 4, radius: 85, falloff: 0.65 } },
      { name: '破甲月刃', cost: 150, damage: 82, range: 145, fireRate: 1.5, chain: { count: 2, radius: 75, falloff: 0.6 } },
    ],
  },
```

- [ ] **Step 5: 驗證** `npm test` 全綠（+chain 4）；`node --check` 改動檔。

- [ ] **Step 6: Commit** `git add -A && git commit -m "feat(towers): 連環閃電+月刃連鎖塔 + 閃電線特效"`

---

## Task 3：main.js 連鎖視覺串接

**Files:** Modify `src/main.js`

- [ ] **Step 1: 命中時畫閃電線**
import 加 `spark`：把 `import { updateParticles, burst } from './render/particles.js';` 改成 `import { updateParticles, burst, spark } from './render/particles.js';`
投射物迴圈內，`if (hit) burst(hit.x, hit.y, p.color, 7);` 改為：
```js
    if (hit) {
      if (hit.nodes && hit.nodes.length > 1) {
        for (let n = 1; n < hit.nodes.length; n++)
          spark(hit.nodes[n - 1].x, hit.nodes[n - 1].y, hit.nodes[n].x, hit.nodes[n].y, p.color);
      }
      burst(hit.x, hit.y, p.color, 7);
    }
```

- [ ] **Step 2: 驗證** `npm test` 全綠；`node --check src/main.js`；控制器瀏覽器實測：場上有奧術塔後連環閃電解鎖→蓋下去→打到怪群時傷害在敵人間跳躍、出現藍色閃電線；月刃同理(需神射手解鎖)；升級分支增加跳數。

- [ ] **Step 3: Commit** `git add src/main.js && git commit -m "feat(chain): main 串接連鎖閃電線特效"`

---

## 完成定義（Phase 2b-3a Done）
- 連環閃電/月刃可蓋(走科技樹)，命中後傷害連鎖跳躍遞減、有閃電線特效，升級分支增加跳數。
- chain 核心有單元測試。全測試綠、瀏覽器實測通過。

## Self-Review
- chain 純函式 TDD；projectile 連鎖分支在 splash 之前，互不干擾(兩塔 splash:0)。
- applyStats/buildTower/spawnProjectile 一致帶 chain；分支升級換 chain 參數。
- spark 併入既有粒子 update/draw，main 只多呼叫 spark()，renderer 不需改。
- 兩塔 requires 對應基礎塔(mage_arcane/elf_archer)，沿用科技樹鎖定。
