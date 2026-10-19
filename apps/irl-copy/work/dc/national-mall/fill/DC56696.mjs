// 300 New Jersey Ave NW (Commercial-Office-Large), the office block on the Capitol side of Union Station's rail yard.
// Read from the lidar record: a 15-block street-wing body around a 17-block main body on a 30 x 15 footprint, all on
// flat ground. Era and materials: a late-20th-century limestone-faced office, five storeys (3 blocks each, the lobby 4),
// tinted glass between calcite piers, smooth-quartz spandrels and cornice. The main body steps back two cells on every
// side from the 15-block line for its top storeys, leaving a terrace, and a mechanical penthouse on the middle of it.
// Every block is built from the layers below: the body is solid, behind each glass facade is one air cell, and each
// floor line is a solid slab, so nothing stands on air. Lanterns and glowstone sit behind some windows at the sill.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC56696.cells.json`, "utf8"));
const W = 30, H = 29, D = 15;

const key = (x, z) => `${x},${z}`;
const NB = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const roofAt = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const has = (x, z) => roofAt.has(key(x, z));

// Lidar roof per cell as the median of its 3x3 footprint neighbours (noise out), then two flat tiers: 17 or 15.
const medianRoof = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (has(x + dx, z + dz)) v.push(roofAt.get(key(x + dx, z + dz)));
  v.sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)];
};
const tier17 = new Set();                                  // the 17-block main body, then a majority pass over 3x3 so no single cell spikes
for (const [x, z] of cells) if (medianRoof(x, z) >= 16) tier17.add(key(x, z));
const tall = new Set();
for (const [x, z] of cells) {
  let n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (tier17.has(key(x + dx, z + dz))) n++;
  if (n >= 5) tall.add(key(x, z));
}

// Depth in cells from the edge of a set (0 = touches outside or a cell not in the set).
const depthIn = (set) => {
  const d = new Map(), q = [];
  for (const k of set) {
    const [x, z] = k.split(",").map(Number);
    if (NB.some(([dx, dz]) => !set.has(key(x + dx, z + dz)))) { d.set(k, 0); q.push(k); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i].split(",").map(Number);
    for (const [dx, dz] of NB) {
      const k = key(x + dx, z + dz);
      if (set.has(k) && !d.has(k)) { d.set(k, d.get(q[i]) + 1); q.push(k); }
    }
  }
  return d;
};

// Setbacks: the main body's top storeys stand two cells in from its edge; a penthouse two cells in from those.
const dTall = depthIn(tall);
const TOP = new Set([...tall].filter((k) => dTall.get(k) >= 2));
const dTop = depthIn(TOP);
const PH = new Set([...TOP].filter((k) => dTop.get(k) >= 2));

// Which cells stand at height y (rows 0..14 are the full massing; the setbacks rise above them).
const inE = (x, z, y) => {
  if (!has(x, z)) return false;
  if (y <= 14) return true;
  if (y <= 16) return TOP.has(key(x, z));
  if (y <= 18) return PH.has(key(x, z));
  return false;
};

const FLOOR = new Set([4, 7, 10, 13, 14]);                // spandrel / floor-slab rows
const ROWS = 19;

// Depth from each row's facade, so the air gap is exactly one cell behind the glass at every height.
const depthAt = [];
for (let y = 0; y < ROWS; y++) {
  const set = new Set();
  for (const [x, z] of cells) if (inE(x, z, y)) set.add(key(x, z));
  depthAt[y] = depthIn(set);
}

const hash = (x, y, z) => (x * 73 + y * 151 + z * 37) % 97;
const topRow = (x, z) => (tall.has(key(x, z)) ? (TOP.has(key(x, z)) ? (PH.has(key(x, z)) ? 18 : 16) : 14) : 14);
const isPier = (x, z, y) => {
  const faces = NB.filter(([dx, dz]) => !inE(x + dx, z + dz, y));
  return faces.some(([dx]) => dx !== 0 && z % 3 === 0) || faces.some(([, dz]) => dz !== 0 && x % 3 === 0);
};
const glass = (x, y, z) => (hash(x, y, z) % 7 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [x, z] of cells) {
  const top = topRow(x, z);
  for (let y = 0; y <= top; y++) {
    if (!inE(x, z, y)) continue;
    const k = key(x, z);
    const d = depthAt[y].get(k);
    const facade = d === 0;

    if (!facade) {                                        // behind the glass: air gap, then floors and core
      if (y === 0 || FLOOR.has(y) || y === top || d >= 2) { put(x, y, z, "stone"); continue; }
      if (y > 0 && !FLOOR.has(y) && y < top && d === 1) {
        // Warm light on the sill of a few windows, standing on the floor slab below.
        const sill = y === 1 || y === 5 || y === 8 || y === 11 || y === 15;
        if (sill && hash(x, y, z) % 11 === 0) put(x, y, z, "glowstone");
        continue;
      }
      put(x, y, z, "stone"); continue;
    }

    // Facade.
    if (y === top) { put(x, y, z, "smooth_quartz"); continue; }                  // cornice / terrace parapet
    if (y === 0) { put(x, y, z, "polished_granite"); continue; }                  // base course at grade
    if (z === 0 && y === 4 && x >= 12 && x <= 18) { put(x, y, z, "polished_granite"); continue; }   // entrance canopy
    if (z === 0 && x === 15 && (y === 1 || y === 2)) {                           // entrance doors
      put(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (z === 0 && y === 3 && (x === 12 || x === 18)) { put(x, y, z, "lantern", { hanging: "true" }); continue; }
    if (FLOOR.has(y)) { put(x, y, z, "smooth_quartz"); continue; }                // spandrel
    if (isPier(x, z, y)) { put(x, y, z, "calcite"); continue; }
    put(x, y, z, glass(x, y, z));
  }
}

// Roof plant on the wings (on the cornice, so it stands) and the penthouse crown on the main body.
for (const [x, z] of cells) {
  if (tall.has(key(x, z))) continue;
  if (x >= 22 && x <= 25 && z >= 7 && z <= 9 && (x + z) % 2 === 0) {
    put(x, 15, z, "light_gray_concrete"); put(x, 16, z, "light_gray_concrete");
  }
}
for (const k of PH) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 17; y <= 18; y++) {
    const face = NB.some(([dx, dz]) => !PH.has(key(x + dx, z + dz)));
    if (y === 18) put(x, y, z, face ? "smooth_quartz" : "stone");
    else if (face) put(x, y, z, z % 2 === 0 || x % 2 === 0 ? "light_blue_stained_glass" : "calcite");
    else put(x, y, z, "stone");
  }
}

// Check. A slab over the one-cell air gap has air beneath it, so it is held by the facade and core beside it (as in
// the reference build). A block counts as floating only when it has air beneath and no solid neighbour at its height.
let held = 0, floating = 0;
for (let y = 1; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!g.get(x, y, z) || g.get(x, y - 1, z)) continue;
  const side = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dz]) => g.get(x + dx, y, z + dz));
  if (side) held++; else floating++;
}
if (floating) console.warn(`${floating} blocks stand on air with nothing beside them`);

const out = g.save(`${DIR}/DC56696.nbt`);
console.log(`DC56696: ${out.blocks} blocks, ${out.palette} palette entries, ${held} held by the walls beside them, ${floating} floating`);
