// room: Rotunda interior designer's part. A monument hall with no furniture (plan.md ROOMS): a floor medallion under the
// dome's axis, eight lamp standards on the r 13.5 circle, a lantern on the centre dais, and standing lanterns on a sparse
// grid. The grid is chosen by greedy cover so every floor cell reads light 8 or more (mobs spawn at 7 and below).
// The floor is the pavilion's smooth_stone at y 1, so the walk level is y 2 and everything here sits at y 2 or above.
import { lampStandard, standingLantern } from "../vocab.mjs";

const FLOOR = 2;                       // walk level of the Rotunda floor
const BOX = [8, 2, 8, 55, 33, 55];     // inner air of the Rotunda (rooms.json)
const CENTRE = 31.5;                   // dome axis: dx = x - 31.5 for cell x
const TARGET = 8;                      // light every floor cell reaches
// One lantern the light map (mcd room) measured short after the greedy pass: the greedy model counted that cell as lit,
// the map read it at 7. Adding it lifts every floor cell to 8 or more.
const EXTRA = [[24, 41]];

// Lamp standards: the 8 axes at r ~13.5 (4 cardinal, 4 diagonal), point-symmetric about the centre cell pair.
const STANDARDS = [[31, 18], [45, 31], [32, 45], [18, 32], [41, 22], [41, 41], [22, 41], [22, 22]];

const r = (x, z) => Math.hypot(x - CENTRE, z - CENTRE);

// Light from a source of level 15 at (sx, sy, sz), one less per block, Manhattan through open air.
const level = (sx, sy, sz, x, z) => 15 - (Math.abs(x - sx) + Math.abs(z - sz) + Math.abs(FLOOR - sy));

export function build(g) {
  const [x0, , z0, x1, , z1] = BOX;
  const air = (x, y, z) => g.inBounds(x, y, z) && g.isAir(x, y, z);

  // 1. The medallion, all at the walk level: an andesite slab ring (9 < r <= 10, bottom slabs so it is a half step),
  //    a calcite ring (4 < r <= 5, one block proud), and a chiseled quartz 2x2 centre carrying a lantern.
  const medallion = new Set();
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const d = r(x, z);
    if (d > 9 && d <= 10) { if (air(x, FLOOR, z)) g.set(x, FLOOR, z, "polished_andesite_slab", { type: "bottom", waterlogged: "false" }); medallion.add(`${x},${z}`); }
    if (d > 4 && d <= 5) { if (air(x, FLOOR, z)) g.set(x, FLOOR, z, "calcite"); medallion.add(`${x},${z}`); }
  }
  const dais = [[31, 31], [32, 31], [31, 32], [32, 32]];
  for (const [x, z] of dais) {
    if (air(x, FLOOR, z)) g.set(x, FLOOR, z, "chiseled_quartz_block");
    medallion.add(`${x},${z}`);
  }
  // The centre lantern stands on the dais (its top face is y 3).
  const centreLamp = [31, FLOOR + 1, 31];
  standingLantern(g, ...centreLamp);

  // 2. The eight lamp standards (foot at the walk level, lantern at y 5).
  const occupied = new Set([...medallion]);
  for (const [x, z] of STANDARDS) {
    lampStandard(g, x, FLOOR, z);
    occupied.add(`${x},${z}`);
  }

  // 3. Sources and the cells to light: every free floor cell in the box.
  const sources = [
    ...STANDARDS.map(([x, z]) => [x, FLOOR + 3, z]),
    centreLamp,
  ];
  const lit = (x, z) => sources.some(([sx, sy, sz]) => level(sx, sy, sz, x, z) >= TARGET);
  let todo = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!occupied.has(`${x},${z}`) && air(x, FLOOR, z) && !lit(x, z)) todo.push([x, z]);
  }

  for (const [x, z] of EXTRA) {
    standingLantern(g, x, FLOOR, z);
    occupied.add(`${x},${z}`);
    sources.push([x, FLOOR, z]);
  }

  // 4. Greedy cover: take the free floor cell that lights the most unlit floor cells, keep 1 clear between lamps so
  //    the lanes stay open, and stop when nothing new is lit.
  const nearLamp = (x, z) => {
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (occupied.has(`${x + dx},${z + dz}`)) return true;
    return false;
  };
  const picks = [];
  while (todo.length) {
    let best = null, bestGain = 0;
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      if (occupied.has(`${x},${z}`) || !air(x, FLOOR, z) || !air(x, FLOOR + 1, z) || nearLamp(x, z)) continue;
      let gain = 0;
      for (const [tx, tz] of todo) if (level(x, FLOOR, z, tx, tz) >= TARGET) gain++;
      if (gain > bestGain) { bestGain = gain; best = [x, z]; }
    }
    if (!best) break;
    const [bx, bz] = best;
    standingLantern(g, bx, FLOOR, bz);
    picks.push(best);
    occupied.add(`${bx},${bz}`);
    todo = todo.filter(([tx, tz]) => level(bx, FLOOR, bz, tx, tz) < TARGET);
  }
  return { lanterns: picks.length, unlit: todo.length };
}
