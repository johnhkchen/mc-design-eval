// Grounds and steps (plan.md): the NMNH grand steps on their footings, the NMNH planting beds and lamps, the NMAH terrace
// lamps, and for NMAAHC the reflecting pools, the entry walk, the south corner beds and the grounds lamps.
// Writes go only into air, so an earlier part's block is never replaced; the one exception is the lawn under the NMAAHC
// pool basins, which this part lays over (the lawn is the ground pass's, not a part's).
import {
  grandSteps, lampPost, SMOOTH_STONE, WATER, AZALEA_LEAVES, LIGHT_GRAY_CONCRETE,
} from "../vocab.mjs";

const isAir = (g, x, y, z) => { const c = g.get(x, y, z); return !c || /air$/.test(c.block); };
const isLawn = (g, x, y, z) => { const c = g.get(x, y, z); return !!c && /grass_block$/.test(c.block); };

// Set one block into air; overLawn also lets it replace the lawn the ground pass laid.
function put(g, x, y, z, block, state, overLawn = false) {
  if (!isAir(g, x, y, z) && !(overLawn && isLawn(g, x, y, z))) return false;
  g.set(x, y, z, block, state);
  return true;
}

const HEDGE = { persistent: "true" };

export function build(g) {
  // NMNH: the grand steps down from the portico platform (half steps, never stairs), footed to the lawn in smooth stone
  grandSteps(g, 50, 64, 43, 4);
  for (let x = 50; x <= 64; x++) {
    for (let y = 1; y <= 3; y++) put(g, x, y, 43, SMOOTH_STONE);
    for (let y = 1; y <= 2; y++) { put(g, x, y, 44, SMOOTH_STONE); put(g, x, y, 45, SMOOTH_STONE); }
  }

  // NMNH: planting beds on the lawn south of the west wing (box hedges, persistent)
  for (let x = 0; x <= 13; x++) for (let z = 30; z <= 31; z++) put(g, x, 1, z, AZALEA_LEAVES, HEDGE);
  for (let x = 14; x <= 18; x++) put(g, x, 1, 30, AZALEA_LEAVES, HEDGE);

  // NMNH lamps: each bed end, the steps' cheeks, and the two light courts (their paving is at y 0)
  lampPost(g, 0, 1, 32);
  lampPost(g, 19, 1, 30);
  lampPost(g, 49, 1, 44);
  lampPost(g, 65, 1, 44);
  for (const x of [36, 44, 70, 78]) for (const z of [16, 28]) lampPost(g, x, 1, z);

  // NMAH: lamps on the south terrace (its step slab at y 0, z 28), every 8 cells from the west end
  for (const x of [124, 132, 140, 148, 156]) lampPost(g, x, 1, 28);

  // NMAAHC: the entry walk from the pools to the doors (the plinth's cells above z 26 are already built, so it stops there)
  for (let x = 199; x <= 203; x++) for (let z = 22; z <= 32; z++) put(g, x, 3, z, LIGHT_GRAY_CONCRETE);

  // NMAAHC: two reflecting pools, basin on the lawn at y 2, water at y 3, a smooth stone coping one cell out
  for (const [x0, x1] of [[193, 198], [204, 209]]) {
    for (let x = x0; x <= x1; x++) for (let z = 26; z <= 30; z++) {
      put(g, x, 2, z, SMOOTH_STONE, undefined, true);
      put(g, x, 3, z, WATER);
    }
    for (let x = x0 - 1; x <= x1 + 1; x++) for (let z = 25; z <= 31; z++) {
      if (x >= x0 && x <= x1 && z >= 26 && z <= 30) continue;
      put(g, x, 3, z, SMOOTH_STONE);
    }
  }

  // NMAAHC: planted beds at the south corners, outside the base
  for (let z = 28; z <= 32; z++) {
    put(g, 188, 3, z, AZALEA_LEAVES, HEDGE);
    put(g, 214, 3, z, AZALEA_LEAVES, HEDGE);
    put(g, 215, 3, z, AZALEA_LEAVES, HEDGE);
  }

  // NMAAHC: lamps along the grounds' south edge, every 8 cells
  for (const x of [188, 196, 206, 214]) lampPost(g, x, 3, 33);
}
