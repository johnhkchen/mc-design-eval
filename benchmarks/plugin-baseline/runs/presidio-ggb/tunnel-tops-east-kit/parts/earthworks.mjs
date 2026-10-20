// Part 2, Earthworks: picnic terrace retaining walls (A/B/C, with the P9 ramp gaps), the overlook seating walls, the East
// Meadow crown and its slab ring, and the campfire circle's hearth, ring of slabs and seats.
//
// The ground belongs to part 1 (ground.mjs) and runParts locks it, so this part only writes into AIR above the ground
// it finds: a snapshot of each column's top block is taken before anything is placed, and a cell is written only when it
// sits directly on that top (y = top + 1) or on a block this part placed. Nothing is carved, replaced or refused:
// a cell that is already taken (a path, a bed, the roof) is counted as `occupied` and left alone.
//
// The campfire bowl is sunken on the plan (floor y4, rings y5 / y6 / y7). The part-1 ground does not lay it yet:
// `earthworkHeights()` gives the levels it should lay (plan Notes). Until it does, the seats and hearth follow the
// real ground top, so nothing floats.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  WHITE_TERRACOTTA, GRASS_BLOCK, STONE_BRICK_SLAB, CAMPFIRE, TERRACE_X, OVERLOOK_WALL_Z, MEADOW_CENTRE, CAMPFIRE_CENTRE,
} from "../vocab.mjs";

const dir = fileURLToPath(new URL(".", import.meta.url));
const rows = (f) => readFileSync(dir + f, "utf8").trim().split("\n");
const HM = rows("heights.txt").map((r) => [...r].map((c) => parseInt(c, 36)));

// the map digit of a cell, '?' (a building) taken from the nearest mapped digit (as ground.mjs does)
function mapH(x, z) {
  const r0 = Math.min(72, z >> 1), c0 = Math.min(42, x >> 1);
  for (let d = 0; d < 20; d++) {
    let best = null;
    for (let r = r0 - d; r <= r0 + d; r++) for (let c = c0 - d; c <= c0 + d; c++) {
      const v = HM[r]?.[c];
      if (Number.isInteger(v) && (best === null || v > best)) best = v;
    }
    if (best !== null) return best;
  }
  return 3;
}

/** The campfire bowl's ground levels, for part 1 to lay (floor y4 r<3.5, rings 5 / 6 / 7, rim 7 at r<10); null outside. */
export function earthworkHeights(x, z) {
  const [cx, cz] = CAMPFIRE_CENTRE;
  const r = Math.hypot(x + 0.5 - (cx + 0.5), z + 0.5 - (cz + 0.5));
  if (r < 3.5) return 4;
  if (r < 5) return 5;
  if (r < 6.5) return 6;
  if (r < 10) return 7;
  return null;
}

// the ground top of every column as the grid holds it when this part starts (the highest non-air block)
function groundTops(g, [x1, z1]) {
  const tops = new Map();
  for (let x = 0; x <= x1; x++) for (let z = 0; z <= z1; z++) {
    let y = 30;
    while (y > 0 && g.isAir(x, y, z)) y--;
    tops.set(`${x},${z}`, y);
  }
  return tops;
}

// writes one block of this part where it sits on the ground top (or on this part's own block); anything else is
// counted and left alone
function makeWriter(g, tops) {
  const placed = new Set();
  const stats = { placed: 0, occupied: 0, floating: 0 };
  const key = (x, y, z) => `${x},${y},${z}`;
  const top = (x, z) => tops.get(`${x},${z}`) ?? 0;
  // a slab is the ground top here (a path half step or a lawn-edge slab): nothing may stand on its half block of air
  const onSlab = (x, z) => String(g.blockAt(x, top(x, z), z)).includes("slab");
  const put = (x, y, z, block, state) => {
    if (y <= top(x, z)) return stats.occupied++, false;
    if (y - 1 > top(x, z) && !placed.has(key(x, y - 1, z))) return stats.floating++, false;
    if (!g.isAir(x, y, z)) return stats.occupied++, false;
    g.set(x, y, z, block, state);
    placed.add(key(x, y, z));
    stats.placed++;
    return true;
  };
  return { put, top, onSlab, stats };
}

// retaining seating wall along x0..x1 on row z: white_terracotta body from the ground up to yHigh, birch_slab cap at
// yHigh + 1, the row drifting one block in z over each 20 x (as seatingWall). Skips the x ranges in `gaps` (ramps), and
// the columns where the ground top is a slab (the path crosses the row there; a body or cap would float over a half block).
function wall(w, x0, x1, z, yHigh, gaps = []) {
  const seat = B.slab("birch", "bottom");
  for (let x = x0; x <= x1; x++) {
    if (gaps.some(([a, b]) => x >= a && x <= b)) continue;
    const zw = z + Math.round(Math.sin((2 * Math.PI * (x - x0)) / 20));
    if (w.onSlab(x, zw)) continue;
    for (let y = w.top(x, zw) + 1; y <= yHigh; y++) w.put(x, y, zw, WHITE_TERRACOTTA);
    w.put(x, yHigh + 1, zw, seat[0], seat[1]);
  }
}

// the picnic's P9 ramps cross the terrace walls at x30..32 and x46..48
const RAMPS = [[30, 32], [46, 48]];

export function build(g) {
  const tops = groundTops(g, [85, 145]);
  const w = makeWriter(g, tops);

  // picnic terraces: wall A|B on z44 (cap y6), wall B|C on z50 (cap y7), across the terrace x range
  wall(w, TERRACE_X[0], TERRACE_X[1], 44, 5, RAMPS);
  wall(w, TERRACE_X[0], TERRACE_X[1], 50, 6, RAMPS);

  // overlook: wall z99 (cap y8) and z105 (cap y9), x 8..36 and 4..40
  wall(w, 8, 36, OVERLOOK_WALL_Z.upper[0], 7);
  wall(w, 4, 40, OVERLOOK_WALL_Z.lower[0], 8);

  // East Meadow crown: grass at y8 over r < 6 and a mossy slab ring at r 6..7, each only where the lawn is at y7
  const [mx, mz] = MEADOW_CENTRE;
  const slab = B.slab("mossy_cobblestone", "bottom");
  for (let x = mx - 8; x <= mx + 8; x++) for (let z = mz - 8; z <= mz + 8; z++) {
    const d = Math.hypot(x + 0.5 - (mx + 0.5), z + 0.5 - (mz + 0.5));
    if (d < 6) w.put(x, 8, z, GRASS_BLOCK);
    else if (d < 7) w.put(x, 8, z, slab[0], slab[1]);
  }

  // campfire circle: the hearth on the ground at the centre, a ring of stone-brick slabs round it, and birch seats on
  // the outer band of each seat ring, each on the ground top of its own cell
  const [cx, cz] = CAMPFIRE_CENTRE;
  const seat = B.slab("birch", "bottom");
  const hearthY = w.top(cx, cz) + 1;
  for (let x = cx - 10; x <= cx + 10; x++) for (let z = cz - 10; z <= cz + 10; z++) {
    const d = Math.hypot(x - cx, z - cz);
    if (Math.max(Math.abs(x - cx), Math.abs(z - cz)) === 1) w.put(x, hearthY, z, STONE_BRICK_SLAB, { type: "bottom" });
    if (d >= 4 && d < 5 || d >= 5.5 && d < 6.5 || d >= 7 && d < 8) w.put(x, w.top(x, z) + 1, z, seat[0], seat[1]);
  }
  w.put(cx, hearthY, cz, CAMPFIRE, { lit: "true", signal_fire: "true", facing: "north" });

  console.log(`  earthworks: placed ${w.stats.placed}, occupied ${w.stats.occupied}, floating ${w.stats.floating}`);
  return { placed: w.stats.placed };
}
