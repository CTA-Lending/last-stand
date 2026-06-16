// 遊戲可調設定（預設值）。也可由管理者後台遠端覆蓋(存 Firestore config/app)，全玩家下次開即套用。
export const GAME_CONFIG = {
  dailyPlayLimitMin: 120, // 防沉迷：每日最多遊玩分鐘數（0 = 不限制）
};
