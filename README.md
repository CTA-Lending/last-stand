# 誰撐最久 · Last Stand

網頁高奇幻塔防 + 無盡生存。怪物一波比一波強，比拼誰撐最久，直上世界排行榜。

- 畫風：扁平向量 + 發光/粒子特效（純程式碼產生）
- 技術：HTML5 Canvas 2D + 原生 JS（ES Modules），零框架依賴，全資料驅動
- 設計文件：[docs/superpowers/specs/2026-06-15-tower-defense-design.md](docs/superpowers/specs/2026-06-15-tower-defense-design.md)

## 開發狀態

設計定案，準備進入 Phase 1（無盡生存垂直切片）。

## 跑法（規劃）

ES Modules 需經 http 載入。建議用內附的無快取伺服器（避免瀏覽器 cache 舊的 module）：

```bash
cd last-stand
python serve.py 8000
# 瀏覽器開 http://localhost:8000
```
