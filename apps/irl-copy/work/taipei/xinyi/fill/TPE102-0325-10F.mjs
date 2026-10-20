import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE102-0325-10F: 2013 Xinyi mid-rise commercial block, two glazed storeys over a
// shopfront base, white tiled cladding, light-blue glass bands, parapet at about 12 blocks.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE102-0325-10F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Storey lines (absolute y). Ground floor shopfront to y 4, slab at 5, upper storey 6..9,
// deck slab at 10, parapet 10..11, cornice slab at 12, roof plant above.
const SL1 = 5;
const SL2 = 10;
const ROOF = 11;
const CORNICE = 12;
const SHOP_TOP = 4;

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), Math.round(gr));
const has = (x, z) => G.has(key(x, z));

const allCells = [...G.keys()].map((k) => k.split(",").map(Number));

function faceDirs(x, z) {
  const d = [];
  if (!has(x, z - 1)) d.push("N");
  if (!has(x, z + 1)) d.push("S");
  if (!has(x - 1, z)) d.push("W");
  if (!has(x + 1, z)) d.push("E");
  return d;
}
const isBoundary = (x, z) => faceDirs(x, z).length > 0;

// Entrance: centre of the north (street-facing, z-min) face.
const northCells = allCells
  .filter(([x, z]) => !has(x, z - 1) && !faceDirs(x, z).includes("W") && !faceDirs(x, z).includes("E"))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const entranceSet = new Set();
let entranceMid = null;
if (northCells.length) {
  const mid = Math.round((northCells[0] + northCells[northCells.length - 1]) / 2);
  entranceMid = mid;
  for (const [x, z] of allCells) {
    if (!has(x, z - 1) && Math.abs(x - mid) <= 1) entranceSet.add(key(x, z));
  }
}

// 1. Foundations and floor slabs for every footprint cell.
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "smooth_stone");                  // ground floor slab
  if (gr <= SL1) g.set(x, SL1, z, "smooth_stone");  // storey-2 floor
  g.set(x, SL2, z, "smooth_stone");                 // roof deck
  g.set(x, ROOF, z, "gray_concrete");               // roof surface
}

// 2. Facade on boundary cells.
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const dirs = faceDirs(x, z);
  if (!dirs.length) continue;

  const corner = dirs.length >= 2;
  const isEntrance = dirs.includes("N") && entranceSet.has(k);
  const u = dirs.includes("N") || dirs.includes("S") ? x : z;
  const mullion = u % 3 === 0;
  const pilaster = u % 6 === 0 && !corner;

  for (let y = gr; y <= CORNICE; y++) {
    let b = null;
    let props;
    if (y === CORNICE) {
      b = "smooth_quartz_slab";
      props = { type: "bottom", waterlogged: "false" };
    } else if (y === gr) {
      b = "polished_andesite";
    } else if (corner) {
      b = "smooth_quartz";
    } else if (y <= SHOP_TOP) {
      if (isEntrance && y === gr + 1) b = "glass";
      else if (isEntrance && y === gr + 2) {
        if (x === entranceMid) { b = "lantern"; props = { hanging: "true" }; }
        else b = "glass";
      } else if (isEntrance && y === gr + 3) b = "black_concrete";
      else b = mullion ? "smooth_quartz" : "glass";
    } else if (y === SL1) {
      b = "smooth_quartz";
    } else if (y === 6 || y === 9) {
      // spandrel band: darker so the storey lines read from the street
      b = pilaster ? "polished_andesite" : "light_gray_concrete";
    } else if (y === 7 || y === 8) {
      if (pilaster) b = "polished_andesite";
      else b = mullion ? "white_concrete" : "light_blue_stained_glass";
    } else {
      b = pilaster ? "polished_andesite" : "white_concrete"; // parapet 10..11
    }
    if (b) g.set(x, y, z, b, props);
  }
}

// 3. Warm light behind some front upper windows (interior cell one step in).
for (const [x, z] of allCells) {
  const dirs = faceDirs(x, z);
  if (dirs.length !== 1 || !dirs.includes("N")) continue;
  if (x % 6 !== 4) continue;
  const zi = z + 1;
  if (!has(x, zi) || isBoundary(x, zi)) continue;
  g.set(x, 7, zi, "glowstone");
}

// 4. Roof plant: a small mechanical room on interior roof cells, centred.
for (const [x, z] of allCells) {
  if (isBoundary(x, z)) continue;
  if (x >= 9 && x <= 16 && z >= 5 && z <= 11) g.set(x, 12, z, "light_gray_concrete");
  if (x >= 11 && x <= 14 && z >= 7 && z <= 9) g.set(x, 13, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
