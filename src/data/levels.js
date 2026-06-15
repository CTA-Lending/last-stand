export const CHAPTERS = [
  { id: 'seven', name: '七情篇', levels: [
    { id: 's0', name: '嗔怒', boss: 'emo_nu',  waves: 8,  map: 'map1', diamond: 30 },
    { id: 's1', name: '悲哀', boss: 'emo_ai',  waves: 9,  map: 'map1', diamond: 35 },
    { id: 's2', name: '恐懼', boss: 'emo_ju',  waves: 10, map: 'map2', diamond: 40 },
    { id: 's3', name: '執愛', boss: 'emo_aii', waves: 11, map: 'map1', diamond: 45 },
    { id: 's4', name: '憎惡', boss: 'emo_wu',  waves: 12, map: 'map2', diamond: 55 },
    { id: 's5', name: '狂喜', boss: 'emo_xi',  waves: 13, map: 'map1', diamond: 60 },
    { id: 's6', name: '貪欲', boss: 'emo_yu',  waves: 14, map: 'map2', diamond: 70 },
  ]},
  { id: 'six', name: '六慾篇', levels: [
    { id: 'd0', name: '色慾', boss: 'yu_se',    waves: 12, map: 'map1', diamond: 55 },
    { id: 'd1', name: '聲慾', boss: 'yu_sheng', waves: 13, map: 'map2', diamond: 60 },
    { id: 'd2', name: '香慾', boss: 'yu_xiang', waves: 14, map: 'map1', diamond: 70 },
    { id: 'd3', name: '味慾', boss: 'yu_wei',   waves: 15, map: 'map2', diamond: 80 },
    { id: 'd4', name: '觸慾', boss: 'yu_chu',   waves: 16, map: 'map1', diamond: 95 },
    { id: 'd5', name: '意慾', boss: 'yu_yi',    waves: 18, map: 'map2', diamond: 120 },
  ]},
];
// 扁平順序（解鎖用）
export const LEVEL_ORDER = CHAPTERS.flatMap(c => c.levels.map(l => l.id));
