import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1001361.cells.json`, "utf8"));

const W = 8, H = 21, D = 23;
const g = new Voxels([W, H, D]);

// Palette: 1824 Federal/Greek Revival brick commercial block, granite base, timber shopfront, stone trim
const BRICK = "bricks";
const TRIM = "stone_bricks";
const SILL = "smooth_stone";
const BASE = "polished_granite";
const FOUND = "stone_bricks";
const FLOOR = "oak_planks";
const DECK = "smooth_stone";
const GLASS = "glass_pane";
const PIER = "dark_oak_planks";
const LIGHT = "glowstone";

const key = (x, z) => `${x},${z}`;
const has = (x, z) => raw.has(key(x, z));
const raw = new Map();
const rawRoof = [];
for (const [x, z, gr, rf] of cells) {
  raw.set(key(x, z), { gr: Number(gr), rf: Number(rf) });
  rawRoof.push(Number(rf));
}

// --- Smoothing ---
// 1) One roof level for the whole block: the median lidar roof, clamped.
rawRoof.sort((a, b) => a - b);
const medRoof = rawRoof[Math.floor(rawRoof.length / 2)];

// 2) Ground: average each z-row across x, then a 3-row running mean along the street,
//    so the foundation steps gently instead of jagging cell by cell.
const colGround = new Map();
for (let z = 0; z < D; z++) {
  const vals = [];
  for (let x = 0; x < W; x++) if (has(x, z)) vals.push(raw.get(key(x, z)).gr);
  if (vals.length) colGround.set(z, vals.reduce((a, b) => a + b, 0) / vals.length);
}
const smoothGround = (z) => {
  const vs = [];
  for (let dz = -1; dz <= 1; dz++) if (colGround.has(z + dz)) vs.push(colGround.get(z + dz));
  return vs.reduce((a, b) => a + b, 0) / vs.length;
};

const minGround = Math.min(...[...colGround.keys()].map((z) => smoothGround(z)));
let R = Math.round(medRoof);
R = Math.min(H - 1, Math.max(R, Math.ceil(minGround) + 8));

// Per-cell data used by the build loops
const cellInfo = new Map();
for (const [k, v] of raw) {
  const [x, z] = k.split(",").map(Number);
  const g0 = Math.max(0, Math.round(smoothGround(z)));
  cellInfo.set(k, { g: Math.min(g0, R - 4), r: R });
}

// --- 1) Foundation, base course, walls, floors, roof deck ---
for (const [k, { g: g0, r }] of cellInfo) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < g0; y++) g.set(x, y, z, FOUND);

  const exterior = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

  if (exterior) {
    for (let y = g0; y <= r; y++) {
      let b = BRICK;
      if (y === g0) b = BASE;          // granite base course
      else if (y === r - 1) b = TRIM;  // stone cornice band
      g.set(x, y, z, b);
    }
  } else {
    g.set(x, g0, z, FLOOR);
    for (let y = g0 + 2; y < r - 1; y += 2) g.set(x, y, z, FLOOR); // storey slabs
    g.set(x, r - 1, z, DECK);                                       // roof deck
  }
}

// --- 2) Facade articulation ---
const frameWindow = (x, z, y, g0, r) => {
  // glass pane with a sill below and a stone lintel above
  g.set(x, y, z, GLASS);
  if (y - 1 > g0) g.set(x, y - 1, z, SILL);
  if (y + 1 <= r - 2) g.set(x, y + 1, z, TRIM);
};

for (const [k, { g: g0, r }] of cellInfo) {
  const [x, z] = k.split(",").map(Number);
  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const rows = [];
  for (let y = g0 + 1; y <= r - 2; y += 2) rows.push(y);

  if (west && x === 0) {
    // Street front: 2 windows per bay, 1 brick pier
    for (const y of rows) {
      if (y === g0 + 1) {
        if (z % 3 === 0) g.set(x, y, z, PIER);
        else g.set(x, y, z, GLASS);
      } else {
        if (z % 3 === 0) g.set(x, y, z, BRICK);
        else frameWindow(x, z, y, g0, r);
      }
    }
    // Entrance at mid-frontage, flanked by piers
    if (z === 11) {
      g.set(x, g0 + 1, z, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, g0 + 2, z, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    for (const zz of [10, 12]) {
      if (has(x, zz)) g.set(x, g0 + 1, zz, PIER);
    }
    // Warm light behind some panes
    for (const y of rows) {
      if (z % 3 !== 0 && (z + y) % 4 === 0 && z > 0 && z < D - 1 && has(1, z)) {
        g.set(1, y, z, LIGHT);
      }
    }
  }

  if (east && x === W - 1) {
    // Rear: plain window grid
    for (const y of rows) {
      if (z % 3 !== 0) frameWindow(x, z, y, g0, r);
    }
    for (const y of rows) {
      if (z % 3 !== 0 && (z + y) % 5 === 0 && z > 0 && z < D - 1 && has(W - 2, z)) {
        g.set(W - 2, y, z, LIGHT);
      }
    }
  }
}

// --- 3) Roof equipment: timber water tank on posts ---
const t = cellInfo.get(key(3, 9));
if (t) {
  const r = t.r;
  let fits = r + 4 <= H - 1;
  for (let x = 2; x <= 4 && fits; x++)
    for (let z = 8; z <= 10; z++)
      if (!has(x, z)) fits = false;
  if (fits) {
    for (const [px, pz] of [[2, 8], [4, 8], [2, 10], [4, 10]]) {
      g.set(px, r, pz, "oak_log");
      g.set(px, r + 1, pz, "oak_log");
    }
    for (let x = 2; x <= 4; x++)
      for (let z = 8; z <= 10; z++) {
        g.set(x, r + 2, z, "oak_planks");
        g.set(x, r + 3, z, "oak_planks");
        g.set(x, r + 4, z, "oak_slab", { type: "bottom", waterlogged: "false" });
      }
    g.set(3, r + 2, 9, "air");
    g.set(3, r + 3, 9, "air");
  }
}

g.save(`${DIR}/NYC1001361.nbt`);
