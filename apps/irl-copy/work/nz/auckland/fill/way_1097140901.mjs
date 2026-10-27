// A 1970s concrete-and-glass commercial block: a 3-storey wing ring (roof 8) around a 3-storey central tower (roof 12)
// with a plant box on top. Each cell stands on a foundation up to its ground; the floors are at 4 and 8, the roof deck
// on each tier's top block, and the walls are the perimeter only (an air gap behind the glass, no interiors).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1097140901.cells.json`, "utf8"));
const X = 21, Y = 25, Z = 25;

const K = (x, z) => `${x},${z}`;
const ground = new Map(), rawRoof = new Map();
for (const [x, z, g, r] of cells) { ground.set(K(x, z), g); rawRoof.set(K(x, z), r); }
const inF = (x, z) => ground.has(K(x, z));
const xMin = Math.min(...cells.map((c) => c[0])), xMax = Math.max(...cells.map((c) => c[0]));
const zMin = Math.min(...cells.map((c) => c[1])), zMax = Math.max(...cells.map((c) => c[1]));

// Tiers: a cell is tower (12) when most of its 3x3 raw-roof neighbourhood is 10 or more; else a wing (8).
const tallVote = (x, z) => {
  let n = 0, t = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const k = K(x + dx, z + dz); if (!rawRoof.has(k)) continue;
    n++; if (rawRoof.get(k) >= 10) t++;
  }
  return t * 2 > n;
};
// A tower cell with fewer than three tower neighbours is a lidar spike, not a tower: it steps down to a wing.
const tallCells = new Set(), top = new Map();
for (const k of ground.keys()) { const [x, z] = k.split(",").map(Number); if (tallVote(x, z)) tallCells.add(k); }
const towerNeighbours = (x, z) => { let n = 0; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if ((dx || dz) && tallCells.has(K(x + dx, z + dz))) n++; return n; };
for (const k of ground.keys()) { const [x, z] = k.split(",").map(Number); top.set(k, tallCells.has(k) && towerNeighbours(x, z) >= 3 ? 12 : 8); }
const topAt = (x, z) => top.get(K(x, z)) ?? 0;   // outside the footprint: nothing, so every side is exposed

// Sides in facade order (south, north, east, west); a side is exposed where the neighbour's top is at or below y.
const SIDES = [[0, 1], [0, -1], [1, 0], [-1, 0]];
const exposedSides = (x, y, z) => SIDES.filter(([dx, dz]) => topAt(x + dx, z + dz) <= y);

// Storeys: floors at 4 and 8 where the tier has a storey above them; the ground storey starts at the cell's ground.
const floorsFor = (T) => [4, 8].filter((f) => f < T - 1);
const storeyBase = (y, g, T) => { const fs = floorsFor(T).filter((f) => f <= y); return fs.length ? Math.max(...fs) : g; };

const vox = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => vox.set(x, y, z, block, state);

// Window grid: piers every third bay (and at the corners), glass between, a spandrel under each upper storey's glass.
const pierAt = (x, z, side) => {
  const along = side[0] === 0 ? x : z, lo = side[0] === 0 ? xMin : zMin, hi = side[0] === 0 ? xMax : zMax;
  return (along - lo) % 3 === 0 || along === hi;
};
const warm = (x, y, z) => (x * 31 + y * 17 + z * 13) % 11 === 0;   // a few lit windows

for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number), g = ground.get(k), T = top.get(k);
  // foundation up to the ground, then the envelope
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");
  // floor slabs (perimeter as a storey line, inside as plain slab) and the roof deck
  for (const f of floorsFor(T)) {
    const perim = exposedSides(x, f, z).length > 0;
    put(x, f, z, perim ? "stone_bricks" : "smooth_stone");
  }
  put(x, T - 1, z, "smooth_stone");
  // parapet on the open edge of each tier
  if (SIDES.some(([dx, dz]) => topAt(x + dx, z + dz) < T)) put(x, T, z, "stone_bricks");

  for (let y = g; y <= T - 2; y++) {
    if (floorsFor(T).includes(y)) continue;
    const sides = exposedSides(x, y, z);
    if (!sides.length) continue;                 // interior air
    const side = sides[0], fb = storeyBase(y, g, T), rel = y - fb;
    const ns = side[0] === 0;                    // a north or south face: panes run east-west
    if (fb > g && rel === 1) { put(x, y, z, "light_gray_concrete"); continue; }   // spandrel under each upper window band
    if (pierAt(x, z, side)) { put(x, y, z, "white_concrete"); continue; }
    if (warm(x, y, z) && y > g) { put(x, y, z, "glowstone"); continue; }
    put(x, y, z, "light_blue_stained_glass_pane",
      ns ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
         : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
  }
}

// Entrance: a double-height door in the middle of the south face, flanked by piers, a stone lintel above.
const doorX = Math.round((xMin + xMax) / 2);
const doorG = ground.get(K(doorX, zMax)) ?? 0;
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
for (const dx of [doorX - 1, doorX + 1]) {
  for (let y = doorG; y < doorG + 2; y++) put(dx, y, zMax, "white_concrete");
}
put(doorX, doorG, zMax, "dark_oak_door", doorState("lower"));
put(doorX, doorG + 1, zMax, "dark_oak_door", doorState("upper"));
for (let dx = doorX - 1; dx <= doorX + 1; dx++) put(dx, doorG + 2, zMax, "stone_bricks");

// Roof plant on the tower: a 5 x 5 box of concrete with a grille on top, set in from the parapet.
const tower = cells.filter(([x, z]) => topAt(x, z) === 12).map(([x, z]) => [x, z]);
const cx = Math.round(tower.reduce((s, [x]) => s + x, 0) / tower.length);
const cz = Math.round(tower.reduce((s, [, z]) => s + z, 0) / tower.length);
for (const [x, z] of tower) {
  if (Math.abs(x - cx) > 2 || Math.abs(z - cz) > 2) continue;
  if (SIDES.some(([dx, dz]) => topAt(x + dx, z + dz) < 12)) continue;   // keep off the parapet line
  put(x, 12, z, "light_gray_concrete");
  const ring = Math.abs(x - cx) === 2 || Math.abs(z - cz) === 2;
  put(x, 13, z, ring ? "light_gray_concrete" : "iron_bars");
}

const info = vox.save(`${DIR}/way_1097140901.nbt`);
console.log(`way_1097140901: ${info.blocks} blocks, palette ${info.palette}; tower cells ${tower.length}, wing cells ${ground.size - tower.length}`);
