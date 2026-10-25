import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499476.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499476.nbt";

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const W = 17, H = 24, D = 11;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const at = new Map();
let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
for (const c of cells) {
  const [x, z, gr, roof] = c;
  at.set(`${x},${z}`, { gr: Math.round(gr), roof: Math.round(roof) });
  xmin = Math.min(xmin, x); xmax = Math.max(xmax, x);
  zmin = Math.min(zmin, z); zmax = Math.max(zmax, z);
}
const has = (x, z) => at.has(`${x},${z}`);
const isPerimeter = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// ---- massing: one smoothed ridge height, gable roof running along x ---------
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const ridge = Math.min(H - 3, roofs[Math.floor(roofs.length / 2)]);
const half = Math.floor((zmax - zmin) / 2);
const eave = Math.max(4, ridge - half - (((zmax - zmin) % 2 === 0) ? 0 : 1));

const paneNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const slab = (type) => ({ type, waterlogged: "false" });

// ---- pass 1: foundations, walls, floors, attic, roof ------------------------
for (const [key, { gr }] of at) {
  const [x, z] = key.split(",").map(Number);
  const d = Math.min(z - zmin, zmax - z);

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  if (isPerimeter(x, z)) {
    for (let y = gr; y < eave; y++) {
      g.set(x, y, z, y === gr ? "stone" : "stone_bricks");
    }
    // string course above the sill line and a cornice at the wall top
    if (gr + 5 < eave) g.set(x, gr + 5, z, "stone_brick_slab", slab("top"));
    if (eave - 1 > gr) g.set(x, eave - 1, z, "stone_brick_slab", slab("top"));
  } else {
    const fy = gr + 4;
    if (fy < eave - 1) g.set(x, fy, z, "smooth_stone");
  }

  // attic / roof body: solid from wall top up to the roof surface
  for (let y = eave; y < eave + d; y++) g.set(x, y, z, "stone_bricks");

  // roof surface
  const ry = eave + d;
  if (ry >= H) continue;
  if (d === half && (zmax - zmin) % 2 === 0) {
    g.set(x, ry, z, "deepslate_tile_slab", slab("bottom"));
  } else {
    const lowerNorth = (z - zmin) < (zmax - z);
    g.set(x, ry, z, "deepslate_tile_stairs", {
      facing: lowerNorth ? "north" : "south",
      half: "bottom", shape: "straight", waterlogged: "false",
    });
  }
}

// ---- pass 2: windows, door, chimney, lights ---------------------------------
function windowRow(x, z, gr, pane) {
  if (!has(x, z)) return;
  for (let y = gr + 2; y <= gr + 4; y++) g.set(x, y, z, "glass_pane", pane);
  g.set(x, gr + 1, z, "stone_brick_slab", slab("bottom"));   // sill
  g.set(x, gr + 5, z, "stone_brick_slab", slab("bottom"));   // lintel
}

function windowBay(c, z, gr) {
  for (let dx = -1; dx <= 1; dx++) windowRow(c + dx, z, gr, paneEW);
}

// long faces: north (zmin) and south (zmax), three-wide bays
const bays = [2, 6, 10, 14];
for (const c of bays) {
  const gN = at.get(`${c},${zmin}`)?.gr;
  if (gN !== undefined) windowBay(c, zmin, gN);
}

// south face: pick the entrance on a real cell near the middle
const southXs = cells.filter(c => c[1] === zmax).map(c => c[0]).sort((a, b) => a - b);
const midX = Math.round((xmin + xmax) / 2);
let doorX = southXs.includes(8) ? 8 : southXs.reduce((best, x) => Math.abs(x - midX) < Math.abs(best - midX) ? x : best, southXs[0]);
for (const c of bays) {
  if (Math.abs(c - doorX) <= 1) continue;
  const gS = at.get(`${c},${zmax}`)?.gr;
  if (gS !== undefined) windowBay(c, zmax, gS);
}

// gable-end single windows
for (const xe of [xmin, xmax]) {
  for (const zc of [3, 7]) {
    const cell = at.get(`${xe},${zc}`);
    if (!cell) continue;
    windowRow(xe, zc, cell.gr, paneNS);
  }
}

// entrance: oak door with a stone surround and a lintel
{
  const cell = at.get(`${doorX},${zmax}`);
  if (cell) {
    const gr = cell.gr;
    const dp = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
    g.set(doorX, gr, zmax, "oak_door", dp("lower"));
    g.set(doorX, gr + 1, zmax, "oak_door", dp("upper"));
    // stone surround: jambs flank the door, lintel above
    for (const dx of [-1, 1]) {
      if (has(doorX + dx, zmax)) {
        g.set(doorX + dx, gr + 1, zmax, "stone_bricks");
        g.set(doorX + dx, gr + 2, zmax, "stone_bricks");
      }
    }
    for (let dx = -1; dx <= 1; dx++) {
      if (has(doorX + dx, zmax)) g.set(doorX + dx, gr + 2, zmax, "stone_brick_slab", slab("top"));
    }
  }
}

// chimney on the north slope, rising out of the roof
{
  const cx = Math.min(xmax - 2, Math.max(xmin + 2, 4));
  const cz = zmin + 1;
  const cell = at.get(`${cx},${cz}`);
  if (cell) {
    const base = eave + Math.min(cz - zmin, zmax - cz);
    for (let y = base; y < Math.min(H, base + 4); y++) {
      g.set(cx, y, cz, "stone_bricks");
    }
    if (base + 4 < H) g.set(cx, base + 4, cz, "stone_brick_slab", slab("top"));
  }
}

// warm light behind a few panes
for (const [x, z] of [[6, zmin + 1], [14, zmin + 1], [2, zmax - 1], [10, zmax - 1]]) {
  const cell = at.get(`${x},${z}`);
  if (!cell || isPerimeter(x, z)) continue;
  const y = cell.gr + 3;
  if (y < eave) g.set(x, y, z, "glowstone");
}

g.save(OUT);
