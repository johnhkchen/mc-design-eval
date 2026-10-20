import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Taipei City Hall Station: a low, two-storey transit head-house of the late-1990s
// Taipei metro era. Cream smooth-quartz walls on a polished granite base, grey
// concrete floor lines and mullions, light-blue glazing in tall bays, a glazed
// entrance on the south face, and a parapet roof with plant boxes.
// Footprint 398 x 113; roof about 11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw810557339";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 398, H = 23, D = 113;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
let minG = Infinity, maxG = -Infinity;
let minX = Infinity, maxX = -Infinity;
for (const [x, z, gr] of cells) {
  const h = Math.round(gr);
  ground.set(key(x, z), h);
  if (h < minG) minG = h;
  if (h > maxG) maxG = h;
  if (x < minX) minX = x;
  if (x > maxX) maxX = x;
}
const has = (x, z) => ground.has(key(x, z));

// Roof level: about 11 above the lowest ground, but never lower than 4 above the
// highest ground so every cell has at least a storey of walls. Capped for H = 23.
const R = Math.min(21, Math.max(minG + 11, maxG + 4)); // parapet course
const T = R - 1;                                        // roof slab / top of storey 2
const Wd = maxX - minX + 1;
const entranceLo = minX + Math.floor(Wd * 0.4);
const entranceHi = minX + Math.floor(Wd * 0.6);

const FOUND = "stone_bricks";
const BASE = "polished_granite";
const WALL = "smooth_quartz";
const CONCRETE = "light_gray_concrete";
const GLASS = "light_blue_stained_glass";
const LIT = "orange_stained_glass";
const PARAPET = "smooth_quartz";

for (const [x, z, gr] of cells) {
  const base = Math.round(gr);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) g.set(x, y, z, FOUND);

  const exN = !has(x, z - 1);
  const exS = !has(x, z + 1);
  const exW = !has(x - 1, z);
  const exE = !has(x + 1, z);
  const perimeter = exN || exS || exW || exE;

  if (!perimeter) {
    // Interior: solid core up to the top slab, so every roof level has support.
    for (let y = base; y <= T - 1; y++) g.set(x, y, z, WALL);
    g.set(x, T, z, CONCRETE);
    // Rooftop plant boxes on the roof deck.
    if (x % 30 === 15 && z % 20 === 10) g.set(x, R, z, CONCRETE);
    continue;
  }

  // Facade column. Mullions follow the coordinate running along the exposed face.
  const zFace = exN || exS;
  const a = zFace ? x : z;
  const entrance = exS && x >= entranceLo && x <= entranceHi;

  // Storey floor lines (ground, then every 5 blocks from the lowest ground), below the top slab.
  const levels = [base, minG + 5, minG + 10].filter((s, i, arr) => s >= base && s < T && arr.indexOf(s) === i);

  for (let y = base; y <= R; y++) {
    if (y === R) { g.set(x, y, z, PARAPET); continue; }
    if (y === base) { g.set(x, y, z, BASE); continue; }
    if (entrance && y <= base + 3) { g.set(x, y, z, GLASS); continue; }
    if (y === T || levels.includes(y)) { g.set(x, y, z, CONCRETE); continue; }

    let Lb = base;
    for (const s of levels) if (s <= y && s > Lb) Lb = s;
    const rel = y - Lb;

    if (rel >= 1 && rel <= 3) {
      if (a % 4 === 0) {
        g.set(x, y, z, CONCRETE); // mullion
      } else {
        const lit = ((a * 7 + y * 13 + x * z) % 23) === 0;
        g.set(x, y, z, lit ? LIT : GLASS);
      }
    } else {
      g.set(x, y, z, WALL); // spandrel / stone band
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
