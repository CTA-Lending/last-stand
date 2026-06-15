import { createEconomy } from '../systems/economy.js';
import { BALANCE } from '../data/balance.js';
import { createSpellState } from '../systems/spells.js';

export function createGameState(map) {
  return {
    map,
    economy: createEconomy({ gold: BALANCE.startGold, lives: BALANCE.startLives }),
    enemies: [], towers: [], projectiles: [],
    occupiedSlots: new Set(),  // slot index 已建塔
    wave: 0, waveTimer: 0, spawnQueue: [], spawnTimer: 0,
    selectedTowerType: null, selectedTower: null,
    now: 0, over: false, started: false,
    spells: createSpellState(),
    castMode: null,
  };
}
