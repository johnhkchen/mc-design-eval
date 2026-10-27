// Way 448063146: an interwar commercial and apartment block, 1930s, reinforced concrete under cream plaster with brick
// piers. A 2x2 six-storey corner tower (lidar 24) on a four-storey bar (16), two-storey wings (9) and a single-storey
// shopfront run (5). Ground floor: a plinth, shopfront glass, a dark fascia, and a timber entrance door on the north face.
// Every column stands from y 0 to its roof, so nothing hangs. Shell walls are one block thick with air behind the glass;
// the storey floors are slabs inside. Some windows are lit by glowstone just inside.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_448063146.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const X = 13, Z = 8, Y = 37;
const MAT = {
  plinth: "polished_andesite", wall: "smooth_quartz", belt: "smooth_quartz_slab", pier: "bricks",
  fascia: "dark_oak_planks", floor: "smooth_stone", cap: "stone_brick_slab", pane: "glass_pane", lamp: "glowstone",
};

// Lidar roofs smoothed into flat tiers: 24 (six storeys), 16 (four), 9 (two plus a parapet), 5 (one storey plus a parapet).
const tier = (r) => (r >= 20 ? 24 : r >= 13 ? 16 : r >= 7 ? 9 : 5);
const inF = new Uint8Array(X * Z), ground = new Int32Array(X * Z), H = new Int32Array(X * Z);
for (const [x, z, g, r] of cells) { const i = z * X + x; inF[i] = 1; ground[i] = g; H[i] = tier(r); }
const idx = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? -1 : z * X + x);
// a tier with no neighbour of the same tier is a lone column (it reads as a pole): clamp it to its tallest neighbour
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const i = idx(x, z); if (!inF[i]) continue;
  const nb = [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dz]) => idx(x + dx, z + dz)).filter((j) => j >= 0 && inF[j]);
  if (nb.length && !nb.some((j) => H[j] === H[i])) H[i] = Math.min(H[i], Math.max(...nb.map((j) => H[j])));
}

const massing = (x, y, z) => { const i = idx(x, z); return i >= 0 && inF[i] === 1 && y >= 0 && y < H[i]; };
// horizontal neighbours that are open air at this height: the faces of a block that show
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // north, south, west, east
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !massing(x + dx, y, z + dz));
// how many blocks in a row along this face's wall share it at this height (a 2-block tower face is no wall for piers)
const runOf = (x, y, z, [dx, dz]) => {
  let n = 1;
  for (const s of [-1, 1]) for (let k = 1; ; k++) {
    const xx = x + (dz !== 0 ? s * k : 0), zz = z + (dx !== 0 ? s * k : 0);
    if (!massing(xx, y, zz) || !exposed(xx, y, zz).some(([ex, ez]) => ex === dx && ez === dz)) break;
    n++;
  }
  return n;
};

const v = new Voxels([X, Y, Z]);
// the pane's arms follow the wall it sits in: an east-west wall links east and west, a north-south wall links north and south
const pane = ([dx, dz]) => (dz !== 0 ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
// a few windows get a warm light just inside (dusk): deterministic, roughly one in three
const lit = (x, y, z) => (x * 7 + y * 5 + z * 3) % 3 === 0;

const windowRow = (y) => y % 4 === 1 || y % 4 === 2;   // storey windows sit between the belt course and the head
const glazed = [];   // [x, y, z, outward face] for lamps behind

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const i = idx(x, z); if (!inF[i]) continue;
  const h = H[i];
  // ground: plinth course across the footprint, and fill below any lidar ground (zero here)
  for (let y = 0; y < ground[i]; y++) v.set(x, y, z, MAT.plinth);
  v.set(x, 0, z, MAT.plinth);
  for (let y = 1; y < h; y++) {
    const ex = exposed(x, y, z);
    if (ex.length === 0) {
      // inside: a slab for each storey floor, a deck under the roof, air between
      if (y % 4 === 0 && y < h - 1) v.set(x, y, z, MAT.floor);
      else if (y === h - 1) v.set(x, y, z, MAT.floor);
      continue;
    }
    // the outer skin: piers on a 3-block rhythm along each wall, windows between them
    const pierHere = ex.some((d) => runOf(x, y, z, d) >= 3 && (d[0] !== 0 ? z : x) % 3 === 0);
    if (pierHere) { v.set(x, y, z, MAT.pier); continue; }
    if (y === h - 1) { v.set(x, y, z, MAT.wall); continue; }                  // top of the wall, under the cap
    if (y % 4 === 0) { v.set(x, y, z, MAT.belt, { type: "bottom", waterlogged: "false" }); continue; }   // storey line
    if (y === 3) { v.set(x, y, z, MAT.fascia); continue; }                       // ground-floor fascia over the shopfront
    if (windowRow(y)) {
      v.set(x, y, z, MAT.pane, pane(ex[0]));
      glazed.push([x, y, z, ex[0]]);
      continue;
    }
    v.set(x, y, z, MAT.wall);
  }
  // cap: a stone parapet course over the top of each exterior wall (the penthouse column stays clear)
  const penthouse = x === 0 && z === 4 && h === 24;
  if (exposed(x, h - 1, z).length && !penthouse) v.set(x, h, z, MAT.cap, { type: "bottom", waterlogged: "false" });
}

// warm light just inside a share of the windows
for (const [x, y, z, [dx, dz]] of glazed) {
  if (!lit(x, y, z)) continue;
  const bx = x - dx, bz = z - dz;
  if (massing(bx, y, bz) && exposed(bx, y, bz).length === 0) v.set(bx, y, bz, MAT.lamp);
}

// entrance: a timber door on the north face of the low shopfront run, lit from just inside
const door = (y, half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
v.set(2, 1, 0, "oak_door", door(1, "lower"));
v.set(2, 2, 0, "oak_door", door(2, "upper"));
v.set(2, 2, 1, MAT.lamp);

// the tower's lift overrun on the penthouse column: brick, a glazed band all round, brick, a stone cap
const PX = 0, PZ = 4, PY = 24;
v.set(PX, PY, PZ, MAT.pier);
v.set(PX, PY + 1, PZ, MAT.pane, { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
v.set(PX, PY + 2, PZ, MAT.wall);
v.set(PX, PY + 3, PZ, MAT.cap, { type: "bottom", waterlogged: "false" });

const out = `${DIR}/way_448063146.nbt`;
const r = v.save(out);
console.log(`wrote ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
