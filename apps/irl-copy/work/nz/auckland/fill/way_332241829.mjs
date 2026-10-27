// Way 332241829: a 1930s brick-and-render shop-office block on the rim of the CBD ridge, below Mt Eden.
// The lidar roof reads two levels: a 12-block core (three storeys and a parapet) and a 10-block wing (two storeys and a
// parapet), so the core stands one setback above the wing. Basalt plinth, a shopfront on the street level with a dark
// fascia, brick piers in cream-capped bays, a flat roof with a stair housing and plant. Walls are a one-block shell with
// an air gap behind the glass and a floor slab at each storey line; nothing is built where the lidar has no footprint.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241829.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241829.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const X = 27, Y = 25, Z = 22;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const SLABS = [4, 8];                       // floor lines: a full slab per storey, sills and string courses where exposed

// --- massing: the lidar roof, smoothed to two clean tiers (roof >= 11 is the core, the rest the 10-block wing)
const top = Array.from({ length: Z }, () => Array(X).fill(0));
const ground = Array.from({ length: Z }, () => Array(X).fill(0));
for (const [x, z, g, roof] of cells) { top[z][x] = roof >= 11 ? 12 : 10; ground[z][x] = g; }
const H = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? 0 : top[z][x]);
const inF = (x, z) => H(x, z) > 0;
// the lidar's 10/12 edge zigzags cell by cell: two majority passes over the 3x3 footprint neighbourhood give clean tiers
for (let pass = 0; pass < 2; pass++) {
  const next = top.map((row) => row.slice());
  for (const [x, z] of cells) {
    let core = 0, n = 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!inF(x + dx, z + dz)) continue;
      n++; if (H(x + dx, z + dz) === 12) core++;
    }
    next[z][x] = core * 2 > n ? 12 : 10;
  }
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (top[z][x]) top[z][x] = next[z][x];
}

// --- block plan: a 3-D array of { block, state } (null = air), written to the Voxels at the end
const idx = (x, y, z) => (z * Y + y) * X + x;
const B = new Array(X * Y * Z).fill(null);
const put = (x, y, z, block, state) => { B[idx(x, y, z)] = { block, state }; };
const at = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z ? null : B[idx(x, y, z)]);
const wallCells = new Set();                // exposed shell cells, the ones that must stand on something

// the sides of (x, z) at height y that are open to the air: off the footprint, or over a lower tier
const openSides = (x, z, y) => DIRS.filter(([dx, dz]) => H(x + dx, z + dz) <= y);

// the facade of an exposed shell cell: piers and 2-wide glass bays, a cream string course, brick spandrels,
// a dark shopfront fascia at street level, brick where a wall rises off the wing's roof
function facade(x, y, z, faces) {
  if (y === 3) return "dark_oak_planks";                          // shopfront fascia
  if (y === 7) return "bricks";                                   // spandrel under the upper bays
  const onWingRoof = faces.some(([dx, dz]) => H(x + dx, z + dz) > 0);
  if (onWingRoof) return "bricks";
  const [dx] = faces[0];
  const along = dx !== 0 ? z : x;                                 // bays count along the face they stand on
  const pier = faces.length > 1 || along % 3 === 0;               // corners and every third column are piers
  if (y <= 2) return pier ? "polished_andesite" : "glass_pane";  // shop level
  return pier ? "bricks" : "glass_pane";                          // upper floors
}

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const h = top[z][x]; if (!h) continue;
  const g0 = ground[z][x];
  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");      // foundation up to the ground (none here: ground is 0)
  for (let y = g0; y < h; y++) {
    const faces = openSides(x, z, y);
    const shell = faces.length > 0;
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }      // basalt plinth, the whole footprint
    if (y === h - 1) { put(x, y, z, shell ? "smooth_quartz" : "stone"); continue; }   // parapet cap and roof deck
    if (SLABS.includes(y)) { put(x, y, z, shell ? "smooth_quartz" : "smooth_stone"); continue; }
    if (!shell) continue;                                          // interior air: the gap behind the glass
    put(x, y, z, facade(x, y, z, faces));
    wallCells.add(idx(x, y, z));
  }
}

// --- the street door: the one shell cell on the north (-z) face at ground level that is nearest the middle
let door = null;
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inF(x, z) || at(x, 1, z)?.block !== "glass_pane") continue;
  const faces = openSides(x, z, 1);
  if (faces.length !== 1 || faces[0][0] !== 0 || faces[0][1] !== -1) continue;
  if (!door || Math.abs(x - 13) < Math.abs(door[0] - 13)) door = [x, z];
}
if (door) {
  const [x, z] = door;
  const state = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(x, 1, z, "dark_oak_door", state("lower"));
  put(x, 2, z, "dark_oak_door", state("upper"));
  wallCells.delete(idx(x, 1, z)); wallCells.delete(idx(x, 2, z));
}

// --- warm light behind some glass: glowstone or shroomlight in the air gap, one bay in seven
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  for (const y of [1, 2, 5, 6, 9, 10]) {
    if (at(x, y, z)?.block !== "glass_pane") continue;
    const faces = openSides(x, z, y);
    if (faces.length !== 1 || (x * 7 + z * 13 + y * 5) % 7 !== 0) continue;
    const [dx, dz] = faces[0], ix = x - dx, iz = z - dz;
    if (!inF(ix, iz) || at(ix, y, iz)) continue;
    put(ix, y, iz, (x + z) % 2 ? "glowstone" : "shroomlight");
  }
}

// --- nothing hangs: a wall cell over air gets a filler beneath it (cascading down to a floor slab)
let grew = true;
while (grew) {
  grew = false;
  for (const w of [...wallCells]) {
    const x = w % X, z = Math.floor(w / (X * Y)), y = Math.floor(w / X) % Y;
    if (y === 0 || at(x, y - 1, z)) continue;
    put(x, y - 1, z, "stone"); wallCells.add(idx(x, y - 1, z)); grew = true;
  }
}

// --- roof: a stair housing (brick, quartz lid) near the core's middle, and a few plant units
const core = (x, z) => H(x, z) === 12;
let hous = null;
for (let z = 1; z < Z - 2; z++) for (let x = 1; x < X - 3; x++) {
  let ok = true;
  for (let dz = -1; dz <= 2 && ok; dz++) for (let dx = -1; dx <= 3 && ok; dx++) ok = core(x + dx, z + dz);
  if (ok && (!hous || Math.abs(x - 13) + Math.abs(z - 10) < Math.abs(hous[0] - 13) + Math.abs(hous[1] - 10))) hous = [x, z];
}
const housed = new Set();
if (hous) {
  const [hx, hz] = hous;
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 3; dx++) {
    put(hx + dx, 12, hz + dz, "bricks"); put(hx + dx, 13, hz + dz, "bricks");
    put(hx + dx, 14, hz + dz, "smooth_quartz");
    housed.add(`${hx + dx},${hz + dz}`);
  }
}
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!core(x, z) || housed.has(`${x},${z}`) || (x * 5 + z * 3) % 11 !== 0) continue;
  if (x % 3 === 1 && z % 2 === 0) put(x, 12, z, "iron_block");
}

// --- write the volume
const g = new Voxels([X, Y, Z]);
for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) {
  const b = B[idx(x, y, z)];
  if (b) g.set(x, y, z, b.block, b.state);
}
const stats = g.save(OUT);
console.log(`way_332241829: ${stats.blocks} blocks, ${stats.palette} palette entries -> ${OUT}`);
