import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339401632";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 60 x 162. Roof about 12 blocks above lowest ground:
// two storeys of 5 blocks, a deck at y=11 and a parapet at y=12.
// Reads as a 1980s-90s low-rise commercial podium: white tiled concrete,
// light grey bands, glazed shopfront at grade, roof plant.
const W = 60, H = 24, D = 162;
const R = 11;          // roof deck layer (solid), parapet above it
const STOREY = 5;

const g = new Voxels([W, H, D]);

// ground lookup
const ground = new Map();
for (const [x, z, raw] of cells) {
  const gr = Math.min(Math.max(0, Math.round(raw)), R - STOREY);
  ground.set(`${x},${z}`, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);
const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// Pass 1: foundations, floors, walls, deck
const perimeterSet = new Set();
const normals = new Map();

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const missing = dirs.filter(([dx, dz]) => !has(x + dx, z + dz));
  const nFl = Math.max(1, Math.floor((R - gr) / STOREY));

  // roof deck, solid across the whole footprint
  g.set(x, R, z, "light_gray_concrete");

  if (missing.length === 0) {
    // interior: floor slab per storey, air elsewhere (no interiors)
    for (let k = 0; k < nFl; k++) g.set(x, gr + STOREY * k, z, "light_gray_concrete");
    // roof plant on a grid of interior cells, standing on the deck
    if (x % 20 >= 5 && x % 20 <= 10 && z % 24 >= 6 && z % 24 <= 11) {
      g.set(x, R + 1, z, "iron_block");
      g.set(x, R + 2, z, "iron_block");
    }
    continue;
  }

  perimeterSet.add(key);
  // outward normal: prefer the z-facing side on corners for facade continuity
  const pick = missing.find(([dx, dz]) => dz !== 0) || missing[0];
  normals.set(key, pick);
  const [ndx, ndz] = pick;
  const t = ndz !== 0 ? x : z; // coordinate along the facade

  // floor slabs for interior side (inner cells get floors too, handled below)
  for (let k = 0; k < nFl; k++) {
    // floors are part of the interior pass; facade cells need none
  }

  for (let y = gr; y < R; y++) {
    const rel = y - gr;
    const k = Math.floor(rel / STOREY);
    const r = rel % STOREY;
    let block;

    if (k >= nFl) {
      block = "white_concrete";                       // parapet band above top storey
    } else if (k === 0 && r === 0) {
      block = "stone_bricks";                         // base course
    } else if (r === 0 || r === 4) {
      block = "light_gray_concrete";                  // spandrel and storey line
    } else {
      // window band r = 1..3
      const isEntrance = ndz === -1 && x >= 26 && x <= 33 && k === 0;
      if (isEntrance) {
        block = r === 3 ? "glowstone" : "tinted_glass";
      } else if (t % 3 === 0) {
        block = "white_concrete";                     // mullion
      } else {
        block = "glass";
      }
    }
    g.set(x, y, z, block);
  }

  // parapet cap above the deck, one storey height of wall
  g.set(x, R + 1, z, "white_concrete");
}

// Pass 2: interior floor slabs for the cells just inside the facade
for (const [key, gr] of ground) {
  if (perimeterSet.has(key)) continue;
  const [x, z] = key.split(",").map(Number);
  const nFl = Math.max(1, Math.floor((R - gr) / STOREY));
  for (let k = 0; k < nFl; k++) g.set(x, gr + STOREY * k, z, "light_gray_concrete");
}

// Pass 3: warm lights behind some windows (inside air next to the facade)
for (const key of perimeterSet) {
  const [x, z] = key.split(",").map(Number);
  const gr = ground.get(key);
  const [ndx, ndz] = normals.get(key);
  const ix = x - ndx, iz = z - ndz;
  const inner = `${ix},${iz}`;
  if (!ground.has(inner) || perimeterSet.has(inner)) continue;
  const t = ndz !== 0 ? x : z;
  const nFl = Math.max(1, Math.floor((R - gr) / STOREY));
  for (let k = 0; k < nFl; k++) {
    const y = gr + STOREY * k + 2;
    if (t % 6 === 1) g.set(ix, y, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
