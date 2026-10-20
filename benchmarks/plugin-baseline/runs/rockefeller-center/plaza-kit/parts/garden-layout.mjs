// Channel Gardens layout (plot 1), shared by the ground and gardens parts. Walks z 0..2 and 13..15; planters z 3..5 and
// 10..12 (pale curb on the walk row z 3 / z 12 and the run ends, soil z 4..5 / 10..11); pools z 6..9 (rim z 6 and z 9 and
// the ends, water z 7..8). Pools sit on their terrace (g); short paved cross-walks between them, the half-step bands at
// x 73..74 and 97..98 break the planters.
export const GARDEN_POOLS = [
  { x0: 58, x1: 64, g: 0 }, { x0: 66, x1: 72, g: 0 }, { x0: 75, x1: 81, g: 1 },
  { x0: 83, x1: 89, g: 1 }, { x0: 91, x1: 96, g: 1 }, { x0: 99, x1: 105, g: 2 },
];
export const PLANTER_RUNS = [{ x0: 57, x1: 72, g: 0 }, { x0: 75, x1: 96, g: 1 }, { x0: 99, x1: 106, g: 2 }];
export const PLANTER_ROWS = { north: { curb: 3, soil: [4, 5] }, south: { curb: 12, soil: [10, 11] } };
export const POOL_ROWS = { rim: [6, 9], water: [7, 8] };
export const WALK_BANDS = [56, 65, 82, 90, 107];  // polished_andesite cross bands on the pale walks

export const isSoil = (x, z) => PLANTER_RUNS.some((r) => x > r.x0 && x < r.x1) && ((z >= 4 && z <= 5) || (z >= 10 && z <= 11));
export const isPoolWater = (x, z) => GARDEN_POOLS.some((p) => x > p.x0 && x < p.x1) && z >= 7 && z <= 8;
