// Victoria Street Car Park, Auckland: a 1970s precast-concrete car park. Floor plates on a common datum (y = 0, 4, 8 ...)
// so the downhill side shows its extra storeys and the uphill side starts on a stone plinth. White concrete piers
// frame tinted ribbon glazing, the floor plates read as string courses, the roof has a coping, a lift core and lamp posts.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_478254599.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_478254599.nbt";

const X = 79, Y = 83, Z = 93, S = 4;   // a storey is 4 blocks: one floor plate, then 3 rows of wall
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// footprint cells: [x, z, ground, roof] -> foot[z * X + x] = { g, r }
const foot = new Array(X * Z).fill(null);
for (const [x, z, g, r] of JSON.parse(readFileSync(CELLS, "utf8"))) foot[z * X + x] = { g, r };
const cell = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? null : foot[z * X + x]);
const cells = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (foot[z * X + x]) cells.push([x, z, foot[z * X + x]]);

// The lidar roof is noisy (single-cell spikes): the median of the footprint within 2 blocks, then whole storeys.
const medianRoof = (x, z) => {
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const c = cell(x + dx, z + dz); if (c) v.push(c.r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
for (const [x, z, c] of cells) c.sm = medianRoof(x, z);
for (const [, , c] of cells) {
  // storeys above the datum: the roof less its 3-row parapet, at least one above the ground it stands on
  c.n = Math.max(1, Math.round((c.sm - 3) / S), Math.floor(c.g / S) + 1);
  c.k0 = Math.ceil(c.g / S);                 // the first floor plate at or above the ground: the ground storey
}

// which sides of a wall row face air: outside the footprint, or above a lower neighbour's roof
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => { const n = cell(x + dx, z + dz); return !n || S * n.n < y; });
const inward = (x, z, d) => [x - d[0], z - d[1]];
const isColumn = (x, z) => x % 6 === 3 && z % 6 === 3;
const interior = (x, z) => DIRS.every(([dx, dz]) => cell(x + dx, z + dz));

const vox = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => vox.set(x, y, z, block, state);

// 1. foundation: solid from y 0 up to the ground under each cell
for (const [x, z, c] of cells) for (let y = 0; y < c.g; y++) put(x, y, z, "stone");

// 2. the column grid inside: concrete piers stand on the foundation and carry every floor plate
for (const [x, z, c] of cells) if (isColumn(x, z) && interior(x, z)) for (let y = c.g; y < S * c.n; y++) put(x, y, z, "white_concrete");

// 3. floor plates: one per storey from the ground storey up, the top one is the roof deck
for (const [x, z, c] of cells) for (let k = c.k0; k <= c.n; k++) put(x, S * k, z, "light_gray_concrete");

// 4. facade: piers every third block, tinted glazing between, a concrete lintel band, a stone base course
const glassState = (d) => (d[0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
function facadeBlock(c, x, y, z, ex) {
  const k = Math.floor(y / S), r = y % S, d = ex[0];
  const i = d[0] !== 0 ? z : x;                    // position along the face
  if (y < S * c.k0) return { block: "stone_bricks" };          // plinth on the uphill side
  if (r === 3) return { block: "white_concrete" };             // lintel band
  if (k === c.k0 && r === 1) return { block: "stone_bricks" }; // base course on the ground storey
  const pier = ex.length > 1 || i % 3 === 0;
  if (pier) return { block: "white_concrete" };
  return { block: "light_blue_stained_glass_pane", state: glassState(d), lit: k > c.k0 && i % 9 === 4 && r === 1 };
}
for (const [x, z, c] of cells) {
  for (let y = c.g; y < S * c.n; y++) {
    if (y % S === 0) continue;                     // the floor plate
    const ex = exposed(x, z, y);
    if (!ex.length) continue;
    const f = facadeBlock(c, x, y, z, ex);
    put(x, y, z, f.block, f.state);
    if (f.lit) {                                    // a warm light behind the glass, in the air gap
      const [ix, iz] = inward(x, z, ex[0]), inner = cell(ix, iz);
      if (inner && !isColumn(ix, iz) && exposed(ix, iz, y).length === 0 && inner.n * S > y && inner.k0 <= Math.floor(y / S))
        put(ix, y, iz, "glowstone");
    }
  }
}

// 5. entrance: the lowest street-side cell with one free face, a 3-wide bay of two doors' height and a canopy
let entry = null;
for (const [x, z, c] of cells) {
  const ex = exposed(x, z, S * c.k0 + 1);
  if (ex.length !== 1) continue;
  if (!entry || c.g < entry.c.g) entry = { x, z, c, d: ex[0] };
}
if (entry) {
  const { x, z, c, d } = entry, along = d[0] !== 0 ? [0, 1] : [1, 0], face = S * c.k0;
  const at = (t) => [x + t * along[0], z + t * along[1]];
  for (const t of [-1, 0, 1]) {
    const [ex_, ez] = at(t);
    if (!cell(ex_, ez)) continue;
    put(ex_, face + 3, ez, "smooth_stone_slab", { type: "top", waterlogged: "false" });   // canopy
    put(ex_, face + 2, ez, "light_blue_stained_glass_pane", glassState(d));
  }
  const [dx, dz] = at(0), door = (half) => ({ facing: FACING[`${d[0]},${d[1]}`], half, hinge: "left", open: "false", powered: "false" });
  put(dx, face + 1, dz, "iron_door", door("lower"));
  put(dx, face + 2, dz, "iron_door", door("upper"));
}

// 6. roof: a coping on the outer edge, a rim where a roof steps down to a lower tier
for (const [x, z, c] of cells) {
  const top = S * c.n;
  if (DIRS.some(([dx, dz]) => !cell(x + dx, z + dz))) {
    put(x, top + 1, z, "white_concrete"); put(x, top + 2, z, "white_concrete");
    put(x, top + 3, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  } else if (DIRS.some(([dx, dz]) => { const n = cell(x + dx, z + dz); return n && S * n.n < top; })) {
    put(x, top + 1, z, "white_concrete");
  }
}

// 7. lift cores on the top deck: a 3x3 concrete shaft with a window a side, capped; lamp posts on the open deck
const occupied = new Set();
const roofTop = (x, z, c) => DIRS.every(([dx, dz]) => { const n = cell(x + dx, z + dz); return n && n.n <= c.n; });
for (const [x, z, c] of cells) {
  if (x % 26 !== 6 || z % 26 !== 6) continue;
  const block = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) block.push([x + dx, z + dz]);
  if (!block.every(([bx, bz]) => cell(bx, bz) && cell(bx, bz).n === c.n && roofTop(bx, bz, c))) continue;
  const top = S * c.n;
  for (const [bx, bz] of block) {
    const ring = bx !== x || bz !== z;
    if (ring) { for (let y = top + 1; y <= top + 3; y++) put(bx, y, bz, "white_concrete"); }
    occupied.add(`${bx},${bz}`);
    put(bx, top + 4, bz, "smooth_stone");
  }
  for (const [bx, bz] of [[x, z - 1], [x, z + 1], [x - 1, z], [x + 1, z]]) put(bx, top + 2, bz, "light_blue_stained_glass_pane", glassState([bx === x ? 0 : 1, 0]));
  put(x, top + 1, z, "air");
  put(x, top + 2, z, "air"); put(x, top + 3, z, "air");
}
for (const [x, z, c] of cells) {
  if (x % 24 !== 6 || z % 24 !== 6 || occupied.has(`${x},${z}`) || !interior(x, z) || !roofTop(x, z, c)) continue;
  const top = S * c.n;
  put(x, top + 1, z, "cobblestone_wall", { up: "true", north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  put(x, top + 2, z, "cobblestone_wall", { up: "true", north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  put(x, top + 3, z, "lantern", { hanging: "false", waterlogged: "false" });
}

vox.save(OUT);
console.log(`way_478254599: ${vox.count()} blocks, ${vox.palette.length - 1} kinds, max storeys ${Math.max(...cells.map(([, , c]) => c.n))}, entrance ${entry ? `${entry.x},${entry.z}` : "none"}`);
