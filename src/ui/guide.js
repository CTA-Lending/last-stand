// 玩家攻略面板：故事 + 玩法介紹 + 五行相生相剋表（怪獸提示）
import { TOWERS } from '../data/towers.js';
import { ENEMIES } from '../data/enemies.js';
import { ELEMENTS, ELEMENT_INFO, ATTACK_MATRIX } from '../data/attackMatrix.js';

// 倍率上色：>1 克制(綠)、<1 被抵抗(紅)、=1 普通
function cell(mult) {
  const color = mult > 1 ? '#7fe0b0' : mult < 1 ? '#ff8da0' : 'var(--dim)';
  const tag = mult > 1 ? '克' : mult < 1 ? '抵' : '·';
  return `<td style="color:${color};font-weight:700">×${mult}<br><span style="font-size:10px;opacity:.85">${tag}</span></td>`;
}

const towersByEl = (el) => Object.values(TOWERS).filter(t => t.attackType === el).map(t => t.name).join('、');
const enemiesByEl = (el) => Object.values(ENEMIES).filter(e => e.armorType === el).map(e => e.name).join('、');

function headRow() {
  return '<tr><th style="text-align:left">塔攻 ╲ 怪甲</th>' +
    ELEMENTS.map(b => `<th style="color:${ELEMENT_INFO[b].color}">${ELEMENT_INFO[b].name}</th>`).join('') + '</tr>';
}
function matrixRows() {
  return ELEMENTS.map(a => {
    const cells = ELEMENTS.map(b => cell(ATTACK_MATRIX[a][b])).join('');
    return `<tr><th style="text-align:left;white-space:nowrap;color:${ELEMENT_INFO[a].color}">${ELEMENT_INFO[a].name}屬
      <br><span style="font-size:10px;color:var(--dim);font-weight:400">${towersByEl(a) || '—'}</span></th>${cells}</tr>`;
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
  <li><b>放塔</b>：點下方塔卡選塔 → 點地圖空地放置（手機：按住指尖預覽、放開確認；點空地外可取消）。</li>
  <li><b>升級</b>：點場上的塔，用 <b style="color:var(--gold-b)">金幣</b> 升級或專精分支（需一點施工時間）。</li>
  <li><b>金幣 vs 鑽石</b>：金幣是<b>單局內</b>升級用；過關得 <b style="color:var(--jade)">鑽石</b>（帳號永久），到<b>商城</b>買永久塔。</li>
  <li><b>編隊</b>：每局最多帶 6 隻已擁有的塔，建議五行齊備、至少一隻能打空。</li>
  <li><b>塔的種類</b>：射擊塔（遠程）、兵營（士兵擋路）、軍旗（光環增益）、地雷（路徑陷阱）。</li>
  <li><b>目標</b>：撐過所有波次即過關；漏怪扣生命，生命歸零結束。</li>
</ul>
`;

export function openGuide() {
  const ov = document.getElementById('guideoverlay');
  ov.innerHTML = `<div class="guide-panel">
    <h2>故事 · 玩法 · 五行相剋</h2>

    <div class="guide-sec"><h3>序章 · 淨化心魔</h3>${STORY}</div>

    <div class="guide-sec"><h3>怎麼玩</h3>${HOWTO}</div>

    <div class="guide-sec"><h3>五行相生相剋（怪獸提示）</h3>
      <p style="color:var(--dim);font-size:12px;margin:.3em 0 .6em">
        塔的<b>五行</b>對上怪的<b>五行</b>會有傷害加成或減免。相剋循環：
        <b style="color:#e6d7a0">金</b>剋<b style="color:#7fc46a">木</b>、<b style="color:#7fc46a">木</b>剋<b style="color:#cda46a">土</b>、
        <b style="color:#cda46a">土</b>剋<b style="color:#5fb0e0">水</b>、<b style="color:#5fb0e0">水</b>剋<b style="color:#e8743a">火</b>、
        <b style="color:#e8743a">火</b>剋<b style="color:#e6d7a0">金</b>。克制 ×1.5、被抵抗 ×0.6。</p>
      <table class="affinity">
        ${headRow()}
        ${matrixRows()}
      </table>
      <div class="armor-legend">
        ${ELEMENTS.map(el =>
          `<div><b style="color:${ELEMENT_INFO[el].color}">${ELEMENT_INFO[el].name}（${ELEMENT_INFO[el].hint}）</b><br>
           <span style="color:var(--dim);font-size:11px">這屬性的敵：${enemiesByEl(el) || '—'}</span></div>`).join('')}
      </div>
      <p style="color:var(--gold-b);font-size:12px;margin-top:10px">
        ⚑ 訣竅：用「剋它」的五行打，傷害 ×1.5；別用「被它剋」的，會掉到 ×0.6。
        另外<b>飛行</b>是獨立屬性——只有「可打空」的塔（弓弩/法系/龍等）打得到飛行敵，五行相剋照常套用。</p>
    </div>

    <button class="ov-close" id="guide-close">關閉</button>
  </div>`;
  ov.style.display = 'flex';
  document.getElementById('guide-close').onclick = () => { ov.style.display = 'none'; };
}
