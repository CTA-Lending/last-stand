import { createEconomy } from '../systems/economy.js';
import { BALANCE } from '../data/balance.js';
import { createSpellState } from '../systems/spells.js';
import { computeBuildableCells } from '../systems/grid.js';

export function createGameState(map, opts = {}) {
  const mode = opts.mode || 'endless';
  return {
    map, mode,
    difficulty: opts.difficulty || 'normal',
    hpMult: opts.hpMult || 1,
    totalWaves: mode === 'campaign' ? (opts.totalWaves || 15) : Infinity,
    level: opts.level || null,
    won: false,
    economy: createEconomy({ gold: BALANCE.startGold, lives: BALANCE.startLives }),
    enemies: [], towers: [], projectiles: [],
    buildableCells: computeBuildableCells(map), // 除走道外的可蓋格 key
    occupiedCells: new Set(),                    // 已建塔的格 key
    wave: 0, waveTimer: 0, spawnQueue: [], spawnTimer: 0, spawnCount: 0,
    selectedTowerType: null, selectedTower: null,
    now: 0, over: false, started: false,
    spells: createSpellState(),
    castMode: null,
  };
}
