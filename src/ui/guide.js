// 玩家攻略面板：故事 + 玩法介紹 + 屬性相生相剋表（怪獸提示）
import { TOWERS } from '../data/towers.js';
import { ENEMIES } from '../data/enemies.js';
import { ATTACK_MATRIX, CAN_HIT_AIR } from '../data/attackMatrix.js';

const ATK_LABEL = { physical: '物理', siege: '攻城', magic: '魔法' };
const ARMOR_LABEL = { light: '輕甲', heavy: '重甲', magic: '魔甲', flying: '飛行' };
const ARMOR_HINT = {
  light: '速度快、血薄（嗔影等雜兵）',
  heavy: '高血厚甲、移動慢（痴障、多數首領）',
  magic: '帶魔法護體（慾念、色慾等）',
  flying: '飛行，部分塔打不到（怨魂、觸慾）',
};

// 倍率上色：>1 克制(綠)、<1 被抵抗(紅)、=1 普通
function cell(mult) {
  const color = mult > 1 ? '#7fe0b0' : mult < 1 ? '#ff8da0' : 'var(--dim)';
  const tag = mult > 1 ? '克制' : mult < 1 ? '抵抗' : '普通';
  return `<td style="color:${color};font-weight:700">×${mult}<br><span style="font-size:10px;opacity:.8">${tag}</span></td>`;
}

// 列出每種攻擊類型對應哪些塔（動態，避免與資料脫節）
function towersByAtk(atk) {
  return Object.values(TOWERS).filter(t => t.attackType === atk).map(t => t.name).join('、');
}
function enemiesByArmor(armor) {
  return Object.values(ENEMIES).filter(e => e.armorType === armor).map(e => e.name).join('、');
}

function matrixRows() {
  const armors = ['light', 'heavy', 'magic', 'flying'];
  return Object.keys(ATTACK_MATRIX).map(atk => {
    const row = ATTACK_MATRIX[atk];
    const air = CAN_HIT_AIR[atk];
    const cells = armors.map(a => {
      if (a === 'flying' && !air) return `<td style="color:#ff8da0;font-weight:700">✕<br><span style="font-size:10px">打不到</span></td>`;
      return cell(row[a] != null ? row[a] : 1);
    }).join('');
    return `<tr><th style="text-align:left;color:var(--gold-b);white-space:nowrap">${ATK_LABEL[atk]}<br>
      <span style="font-size:10px;color:var(--dim);font-weight:400">${towersByAtk(atk)}</span></th>${cells}</tr>`;
  }).join('');
}

const STORY = `
<p>世間萬象，皆由心生。當人心被 <b style="color:var(--rose)">七情</b> 與 <b style="color:var(--rose)">六慾</b> 反噬，
便化作吞噬光明的心魔——<b>嗔怒</b>暴烈、<b>悲哀</b>沉溺、<b>恐懼</b>蔓延、<b>執愛</b>不捨、
<b>憎惡</b>潰爛、<b>狂喜</b>癲狂、<b>渴欲</b>無饜；色、聲、香、味、觸、法，六慾亦各成其形。</p>
<p>你是最後的 <b style="color:var(--gold-b)">守關者</b>。在心魔湧出的隘口，召集精靈、矮人、人類、法師
（乃至龍族與神族）布下防線，將一波波情慾之魔 <b>淨化</b>，守住最後一道光。</p>
<p>戰役十三關，逐一斬斷七情六慾；或在 <b>無盡求生</b> 中，問自己一句——<b style="color:var(--gold-b)">誰，撐得最久？</b></p>
`;

const HOWTO = `
<ul style="line-height:1.9;padding-left:18px;margin:0">
  <li><b>放塔</b>：點下方塔卡選塔 → 點地圖空地放置（手機：按住指尖預覽、放開確認）。</li>
  <li><b>升級</b>：點場上的塔，用 <b style="color:var(--gold-b)">金幣</b> 升級或專精分支；滿級可選分支走向。</li>
  <li><b>金幣 vs 鑽石</b>：金幣是<b>單局內</b>升級用；過關得 <b style="color:var(--jade)">鑽石</b>（帳號永久），到<b>商城</b>買永久塔。</li>
  <li><b>編隊</b>：每局最多帶 6 隻已擁有的塔進場，組你的科技路線。</li>
  <li><b>塔的種類</b>：射擊塔（遠程輸出）、兵營（士兵擋路纏鬥）、軍旗（光環加成）、地雷（路徑陷阱）。</li>
  <li><b>法術</b>：火雨（點地範圍轟炸）、寒冰術（全場凍結），有冷卻。</li>
  <li><b>目標</b>：撐過所有波次即過關；漏怪會扣生命，生命歸零就結束。</li>
</ul>
`;

export function openGuide() {
  const ov = document.getElementById('guideoverlay');
  ov.innerHTML = `<div class="guide-panel">
    <h2>故事 · 玩法 · 屬性相剋</h2>

    <div class="guide-sec"><h3>序章 · 淨化心魔</h3>${STORY}</div>

    <div class="guide-sec"><h3>怎麼玩</h3>${HOWTO}</div>

    <div class="guide-sec"><h3>屬性相生相剋（怪獸提示）</h3>
      <p style="color:var(--dim);font-size:12px;margin:.3em 0 .8em">
        塔的<b>攻擊類型</b>對上怪的<b>護甲類型</b>會有傷害加成或減免。看懂這張表，編隊就懂怎麼配。</p>
      <table class="affinity">
        <tr><th style="text-align:left">塔 ╲ 怪甲</th>
          <th>輕甲</th><th>重甲</th><th>魔甲</th><th>飛行</th></tr>
        ${matrixRows()}
      </table>
      <div class="armor-legend">
        ${['light', 'heavy', 'magic', 'flying'].map(a =>
          `<div><b style="color:var(--sky)">${ARMOR_LABEL[a]}</b>：${ARMOR_HINT[a]}<br>
           <span style="color:var(--dim);font-size:11px">代表敵：${enemiesByArmor(a) || '—'}</span></div>`).join('')}
      </div>
      <p style="color:var(--gold-b);font-size:12px;margin-top:10px">
        ⚑ 訣竅：物理克輕甲、攻城克重甲、魔法克魔甲；飛行怪只有「可打空」的塔（弓弩/法系/龍）打得到，
        記得編隊至少帶一隻能打空的。</p>
    </div>

    <button class="ov-close" id="guide-close">關閉</button>
  </div>`;
  ov.style.display = 'flex';
  document.getElementById('guide-close').onclick = () => { ov.style.display = 'none'; };
}
