export function createEconomy({ gold = 0, lives = 20 } = {}) {
  return {
    gold, lives, score: 0, elapsed: 0,
    spend(cost) {
      if (this.gold < cost) return false;
      this.gold -= cost; return true;
    },
    earn(amount) { this.gold += amount; },
    addScore(amount) { this.score += amount; },
    loseLife(n = 1) { this.lives = Math.max(0, this.lives - n); },
    isDead() { return this.lives <= 0; },
    tick(dt) { this.elapsed += dt; },
  };
}
