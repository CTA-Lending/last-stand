export const ATTACK_MATRIX = {
  physical: { light: 1.5, heavy: 0.5, magic: 1.0, flying: 1.0 },
  siege:    { light: 1.0, heavy: 1.5, magic: 0.75, flying: 1.0 },
  magic:    { light: 1.0, heavy: 1.0, magic: 1.5, flying: 1.0 },
};
export const CAN_HIT_AIR = { physical: true, siege: false, magic: true };
