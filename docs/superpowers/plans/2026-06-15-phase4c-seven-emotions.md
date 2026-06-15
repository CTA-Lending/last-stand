# Phase 4c：七情六慾敵方陣營 — 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** 把不死/魔族換成「七情六慾」心魔陣營。化身小怪走波次，13 情慾為 Boss，各帶專屬機制；用 6 種能力原型覆蓋全部，正義方淨化心魔＝故事核心。

**Architecture:** `data/enemies.js` 重寫為七情六慾(化身 minions + 13 情慾 boss，boss 帶 `ability`)。`systems/enemyAbility.js` 實作 6 原型(enrage/healAura/slowTowerAura/fearAura/goldSteal/summon) + `applyEnemyAbilities(ctx,dt)`，TDD。`updateEnemy/spawnEnemy` 帶 ability。`updateTower` 吃 debuffRate/feared。main 每幀重置塔 debuff→套光環(buff)→套敵能力(debuff/heal/steal/summon)→塔更新。endlessDirector 改七情六慾。

**Tech Stack:** 同前。

---

## 能力原型 ↔ 13 情慾對照
| 情慾 | armor | ability |
|---|---|---|
| 😤怒 | heavy | enrage(低血加速) |
| 😢哀 | heavy | slowTowerAura(降周圍塔攻速) |
| 😱懼 | magic | fearAura(周圍塔機率不發) |
| 😍愛 | heavy | summon(召喚護衛) |
| 😈惡 | heavy(肉) | summon(死纏不休，召喚) |
| 😀喜 | light | healAura(治療友軍) |
| 🤑欲 | heavy | goldSteal(偷金幣) |
| 👁️色 | magic | fearAura(魅惑) |
| 🔊聲 | light | slowTowerAura(音波) |
| 👃香 | heavy | slowTowerAura(毒霧,較強) |
| 👅味 | heavy | goldSteal(吞噬) |
| ✋觸 | flying | slowTowerAura(纏繞) |
| 🧠意 | magic | summon(幻象分身) |

---

## Task 1：能力系統（enemyAbility，TDD）

**Files:** Create `src/systems/enemyAbility.js`, `tests/enemyAbility.test.js`

ctx = `{ enemies, towers, economy, spawnMinion }`。每幀：塔的 debuffRate/feared 由呼叫端先重置為 1/false，本函式依能力套用。

- [ ] **Step 1: 失敗測試** `tests/enemyAbility.test.js`
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyEnemyAbilities } from '../src/systems/enemyAbility.js';

const baseEnemy = o => ({ id:1, x:100, y:100, hp:100, maxHp:100, speed:40, alive:true, reachedEnd:false, ability:null, abilityCd:0, ...o });

test('enrage 低血加速一次', () => {
  const e = baseEnemy({ hp:20, maxHp:100, speed:40, ability:{ type:'enrage', threshold:0.3, boost:2 } });
  applyEnemyAbilities({ enemies:[e], towers:[], economy:{gold:0}, spawnMinion(){} }, 0.1);
  assert.equal(e.speed, 80);
  applyEnemyAbilities({ enemies:[e], towers:[], economy:{gold:0}, spawnMinion(){} }, 0.1);
  assert.equal(e.speed, 80); // 不重複加速
});
test('healAura 治療附近友軍', () => {
  const healer = baseEnemy({ id:1, ability:{ type:'healAura', radius:80, hps:50 } });
  const ally = baseEnemy({ id:2, x:120, y:100, hp:50, maxHp:100 });
  applyEnemyAbilities({ enemies:[healer, ally], towers:[], economy:{gold:0}, spawnMinion(){} }, 0.2);
  assert.ok(ally.hp > 50);
});
test('slowTowerAura 降周圍塔 debuffRate', () => {
  const e = baseEnemy({ ability:{ type:'slowTowerAura', radius:80, factor:0.5 } });
  const tower = { x:120, y:100, debuffRate:1 };
  applyEnemyAbilities({ enemies:[e], towers:[tower], economy:{gold:0}, spawnMinion(){} }, 0.1);
  assert.equal(tower.debuffRate, 0.5);
});
test('goldSteal 冷卻到就偷金幣', () => {
  const e = baseEnemy({ ability:{ type:'goldSteal', interval:1, amount:10 } });
  const economy = { gold: 100 };
  applyEnemyAbilities({ enemies:[e], towers:[], economy, spawnMinion(){} }, 1.0);
  assert.equal(economy.gold, 90);
});
test('summon 冷卻到就召喚', () => {
  let summoned = 0;
  const e = baseEnemy({ ability:{ type:'summon', interval:2, minion:'xinmo' } });
  applyEnemyAbilities({ enemies:[e], towers:[], economy:{gold:0}, spawnMinion(){ summoned++; } }, 2.0);
  assert.equal(summoned, 1);
});
```

- [ ] **Step 2: 跑測試確認失敗** `cd last-stand && node --test tests/enemyAbility.test.js`

- [ ] **Step 3: 實作 `src/systems/enemyAbility.js`**
```js
import { dist } from '../core/geometry.js';

export function applyEnemyAbilities(ctx, dt) {
  const { enemies, towers, economy, spawnMinion } = ctx;
  for (const e of enemies) {
    if (!e.alive || !e.ability) continue;
    const a = e.ability;
    switch (a.type) {
      case 'enrage':
        if (!e.enraged && e.hp / e.maxHp <= a.threshold) { e.speed *= a.boost; e.enraged = true; }
        break;
      case 'healAura':
        for (const o of enemies) if (o.alive && o !== e && o.hp < o.maxHp && dist(e.x, e.y, o.x, o.y) <= a.radius)
          o.hp = Math.min(o.maxHp, o.hp + a.hps * dt);
        break;
      case 'slowTowerAura':
        for (const t of towers) if (dist(e.x, e.y, t.x, t.y) <= a.radius) t.debuffRate = Math.min(t.debuffRate ?? 1, a.factor);
        break;
      case 'fearAura':
        for (const t of towers) if (dist(e.x, e.y, t.x, t.y) <= a.radius) t.feared = true;
        break;
      case 'goldSteal':
        e.abilityCd -= dt;
        if (e.abilityCd <= 0) { economy.gold = Math.max(0, economy.gold - a.amount); e.abilityCd = a.interval; }
        break;
      case 'summon':
        e.abilityCd -= dt;
        if (e.abilityCd <= 0) { spawnMinion(e, a.minion); e.abilityCd = a.interval; }
        break;
    }
  }
}
```

- [ ] **Step 4: 跑測試確認通過** `node --test tests/enemyAbility.test.js`（5）；`npm test` 全綠

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(ability): 敵人 6 能力原型(enrage/heal/slowTower/fear/goldSteal/summon)"`

---

## Task 2：enemies.js 七情六慾重寫 + spawn 帶 ability

**Files:** Modify `src/data/enemies.js`, `src/entities/enemy.js`

- [ ] **Step 1: 重寫 `src/data/enemies.js`**（化身 minions ×4 + 13 情慾 boss）
```js
export const ENEMIES = {
  // 化身小怪（波次 fodder，主題=煩惱心魔）
  xinmo:   { name: '嗔影', armorType: 'light',  hpMult: 0.8, speedMult: 1.25, bountyMult: 0.8, radius: 11, color: '#c45b6e' },
  zhizhang:{ name: '痴障', armorType: 'heavy',  hpMult: 1.8, speedMult: 0.7,  bountyMult: 1.3, radius: 14, color: '#5a6b8f' },
  yuanhun: { name: '怨魂', armorType: 'flying', hpMult: 0.9, speedMult: 1.1,  bountyMult: 1.1, radius: 12, color: '#a98fd8' },
  yunian:  { name: '慾念', armorType: 'magic',  hpMult: 1.1, speedMult: 0.95, bountyMult: 1.1, radius: 12, color: '#cf8f4a' },

  // 七情 Boss
  emo_nu:  { name: '嗔怒之魔', armorType: 'heavy', hpMult: 1.4, speedMult: 0.9,  bountyMult: 1.5, radius: 18, color: '#d23a2a', boss: true, ability: { type: 'enrage', threshold: 0.4, boost: 2.0 } },
  emo_ai:  { name: '悲哀之魔', armorType: 'heavy', hpMult: 1.4, speedMult: 0.8,  bountyMult: 1.5, radius: 18, color: '#3a6fd2', boss: true, ability: { type: 'slowTowerAura', radius: 110, factor: 0.6 } },
  emo_ju:  { name: '恐懼之魔', armorType: 'magic', hpMult: 1.2, speedMult: 0.95, bountyMult: 1.5, radius: 17, color: '#7a3fd0', boss: true, ability: { type: 'fearAura', radius: 110 } },
  emo_aii: { name: '執愛之魔', armorType: 'heavy', hpMult: 1.5, speedMult: 0.8,  bountyMult: 1.5, radius: 18, color: '#d24a90', boss: true, ability: { type: 'summon', interval: 3.5, minion: 'xinmo' } },
  emo_wu:  { name: '憎惡之魔', armorType: 'heavy', hpMult: 2.2, speedMult: 0.7,  bountyMult: 1.7, radius: 20, color: '#5a1530', boss: true, ability: { type: 'summon', interval: 4, minion: 'zhizhang' } },
  emo_xi:  { name: '狂喜之魔', armorType: 'light', hpMult: 1.2, speedMult: 1.0,  bountyMult: 1.5, radius: 17, color: '#e0b020', boss: true, ability: { type: 'healAura', radius: 100, hps: 30 } },
  emo_yu:  { name: '貪欲之魔', armorType: 'heavy', hpMult: 1.4, speedMult: 0.85, bountyMult: 1.5, radius: 18, color: '#c9a227', boss: true, ability: { type: 'goldSteal', interval: 2.5, amount: 12 } },

  // 六慾 精英 Boss
  yu_se:   { name: '色慾', armorType: 'magic',  hpMult: 1.2, speedMult: 1.0,  bountyMult: 1.4, radius: 16, color: '#e07ab0', boss: true, ability: { type: 'fearAura', radius: 100 } },
  yu_sheng:{ name: '聲慾', armorType: 'light',  hpMult: 1.1, speedMult: 1.2,  bountyMult: 1.3, radius: 15, color: '#7fd0e0', boss: true, ability: { type: 'slowTowerAura', radius: 100, factor: 0.7 } },
  yu_xiang:{ name: '香慾', armorType: 'heavy',  hpMult: 1.5, speedMult: 0.8,  bountyMult: 1.4, radius: 17, color: '#9ac94a', boss: true, ability: { type: 'slowTowerAura', radius: 110, factor: 0.55 } },
  yu_wei:  { name: '味慾', armorType: 'heavy',  hpMult: 1.4, speedMult: 0.85, bountyMult: 1.4, radius: 17, color: '#d2843a', boss: true, ability: { type: 'goldSteal', interval: 3, amount: 14 } },
  yu_chu:  { name: '觸慾', armorType: 'flying', hpMult: 1.1, speedMult: 1.05, bountyMult: 1.4, radius: 15, color: '#b08fe0', boss: true, ability: { type: 'slowTowerAura', radius: 100, factor: 0.65 } },
  yu_yi:   { name: '意慾', armorType: 'magic',  hpMult: 1.3, speedMult: 0.95, bountyMult: 1.5, radius: 17, color: '#8f7fe0', boss: true, ability: { type: 'summon', interval: 3, minion: 'yuanhun' } },

  dmg: undefined, // (保留下方真正欄位)
};
```
**每隻 enemy 需有近戰 dmg/atk**（供兵營擋路）：在上面每個物件補 `dmg` 與 `atk`（化身：xinmo dmg5 atk1.0、zhizhang dmg10 atk1.3、yuanhun dmg0 atk1、yunian dmg7 atk1.1；七情/六慾 boss：dmg 依強度給 16~28、atk 1.0~1.3；飛行的 yuanhun/yu_chu dmg0）。移除佔位的 `dmg: undefined` 那行。

- [ ] **Step 2: enemy.js — spawnEnemy 帶 ability/abilityCd**
`spawnEnemy` 回傳物件加：`ability: def.ability || null, abilityCd: def.ability ? (def.ability.interval || 0) : 0,`（其餘不變；dmg/atk 已從 def 取）。

- [ ] **Step 3: 驗證** `npm test` 全綠；`node --check src/data/enemies.js src/entities/enemy.js`

- [ ] **Step 4: Commit** `git add -A && git commit -m "feat(enemies): 七情六慾陣容(化身×4 + 13情慾boss帶ability)"`

---

## Task 3：endlessDirector 改七情六慾 + 主迴圈串接能力

**Files:** Modify `src/systems/endlessDirector.js`, `src/entities/tower.js`, `src/main.js`, `tests/endlessDirector.test.js`

- [ ] **Step 1: endlessDirector — 化身池 + 情慾 boss 輪替**
```js
const MINIONS_A = ['xinmo', 'zhizhang', 'yuanhun'];
const MINIONS_B = ['yunian', 'xinmo', 'zhizhang'];
const SEVEN = ['emo_nu','emo_ai','emo_ju','emo_aii','emo_wu','emo_xi','emo_yu'];
const SIX   = ['yu_se','yu_sheng','yu_xiang','yu_wei','yu_chu','yu_yi'];

function poolFor(wave) { return Math.floor((wave - 1) / 3) % 2 === 0 ? MINIONS_A : MINIONS_B; }
```
buildWave 的 boss 段改：依波數從 SEVEN/SIX 循環挑一個情慾 boss（取代 deathknight/demonlord）：
```js
  if (wave % E.bossEvery === 0) {
    const idx = Math.floor(wave / E.bossEvery) - 1;
    const useSix = wave % E.demonBossEvery === 0;
    const arr = useSix ? SIX : SEVEN;
    const bossType = arr[((useSix ? Math.floor(wave / E.demonBossEvery) : idx) % arr.length + arr.length) % arr.length];
    const s = scaledStats(wave, bossType);
    const bossHp = Math.round(s.hp * E.bossHpMult * hpMult);
    list.push({ type: bossType, armorType: ENEMIES[bossType].armorType, hp: bossHp, maxHp: bossHp,
      speed: s.speed, bounty: Math.round(s.bounty * E.bossBountyMult), boss: true, ability: ENEMIES[bossType].ability || null });
  }
```
（spawnEnemy 從 def 取 ability，故 spec 不一定要帶；但帶上不影響。）
更新 `tests/endlessDirector.test.js`：把舊的 `deathknight`/`demonlord`/`demon pool` 斷言改為新陣容——例如「第5波 boss 屬於 SEVEN 或 SIX」「buildWave(4) 含化身」。保留 count/血量成長/boss 存在等通用斷言。

- [ ] **Step 2: tower.js — updateTower 吃 debuffRate/feared**
`updateTower` 開頭冷卻計算改用有效射速、並處理恐懼：
```js
export function updateTower(t, enemies, projectiles, dt) {
  t.cooldown -= dt;
  if (t.cooldown > 0) return;
  if (t.feared && Math.random() < 0.35) { t.cooldown = 0.2; return; } // 恐懼:機率不發
  const target = selectTarget(t, enemies);
  if (!target) return;
  projectiles.push(spawnProjectile(t, target));
  const rate = t.fireRate * (t.buffRate || 1) * (t.debuffRate || 1);
  t.cooldown = 1 / rate;
}
```

- [ ] **Step 3: main.js — 重置塔debuff + 套敵能力 + spawnMinion**
import：`import { applyEnemyAbilities } from './systems/enemyAbility.js';`
塔迴圈前（`applyAuras(s.towers);` 附近）：
```js
  for (const t of s.towers) { t.debuffRate = 1; t.feared = false; }
  applyAuras(s.towers);
  applyEnemyAbilities({
    enemies: s.enemies, towers: s.towers, economy: s.economy,
    spawnMinion: (from, minionType) => {
      const spec = scaledMinion(s.wave, minionType);
      const m = spawnEnemy(spec, s.map, from.pathIndex);
      m.x = from.x; m.y = from.y; m.seg = from.seg; // 從召喚者位置出生
      s.enemies.push(m);
    },
  }, dt);
```
`scaledMinion(wave, type)` 小工具（main 內或 import director 的 helper）：產生一個該 minion 的 spec（hp 用當前波縮放）。最簡：
```js
import { minionSpec } from './systems/endlessDirector.js';
```
並在 endlessDirector 匯出：
```js
export function minionSpec(wave, type) {
  const s = scaledStats(wave, type);
  return { type, armorType: ENEMIES[type].armorType, hp: s.hp, maxHp: s.hp, speed: s.speed, bounty: s.bounty, boss: false };
}
```

- [ ] **Step 4: 驗證** `npm test` 全綠；`node --check` 改動檔；控制器實測：怪變七情六慾、boss 各有機制（怒加速/哀降攻速/欲偷金/喜回血/愛召喚等）。

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(enemies): director改七情六慾 + 塔吃debuff/fear + 召喚串接"`

---

## 完成定義（Phase 4c Done）
- 敵方全改七情六慾：化身波次 + 13 情慾 boss 各帶專屬機制（6 原型）。
- 塔受 slowTowerAura/fearAura 影響；goldSteal/healAura/summon/enrage 生效。
- 能力系統有單元測試。全測試綠、瀏覽器實測通過。

## Self-Review
- 6 原型覆蓋 13 情慾；spawnEnemy 帶 ability；boss 由 director 從 SEVEN/SIX 循環出。
- 塔 debuff 每幀重置→光環(buff)→敵能力(debuff/fear)→更新，順序正確不殘留。
- summon 從召喚者位置接同一條路；goldSteal 扣 economy；healAura 不超過 maxHp。
- 化身保留 dmg/atk 供兵營擋路；飛行情慾 dmg0。
