import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1301 M St NW: a 1920s-30s Beaux-Arts apartment block in red brick on a stone plinth, with calcite stringcourses
// and quoins (the District's limestone trim), an E-W frontage on M Street, a courtyard open to the south-west, and
// two setback tiers (13 and 14) where the lidar rises. Storeys are 3 blocks: a stone floor band, then glass rows.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54708.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54708.nbt";
const W = 30, D = 28, H = 26;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const raw = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, ground, roof] of cells) raw[z][x] = { ground, roof };
const inFoot = (x, z) => x >= 0 && z >= 0 && x < W && z < D && raw[z][x] !== null;

// lidar noise: the 2-3 reads on the west edge and the lone 10-11 cells are the 12-block roof; 13 and 14 are real tiers.
// A 3x3 vote (centre counts double) then removes single-cell speckle and keeps the blobs.
const tidy = (r) => (r <= 11 ? 12 : r);
const roof = Array.from({ length: D }, () => Array(W).fill(null));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFoot(x, z)) continue;
  const votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!inFoot(x + dx, z + dz)) continue;
    const v = tidy(raw[z + dz][x + dx].roof);
    votes.set(v, (votes.get(v) || 0) + (dx === 0 && dz === 0 ? 2 : 1));
  }
  let best = 12, bestN = -1;
  for (const [v, n] of votes) if (n > bestN || (n === bestN && v === 12)) { best = v; bestN = n; }
  roof[z][x] = best;
}
const top = (x, z) => (inFoot(x, z) ? roof[z][x] : 0);
const groundOf = (x, z) => (inFoot(x, z) ? raw[z][x].ground : 0);
const solidAt = (x, y, z) => inFoot(x, z) && y >= 0 && y < top(x, z);

const g = new Voxels([W, H, D]);
const has = new Set();                       // every block we placed, for the pane connections
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); has.add(key(x, y, z)); };

// the outward side of a perimeter cell at height y: which neighbours are missing (air or off the footprint)
const missing = (x, y, z) => ({
  w: !solidAt(x - 1, y, z), e: !solidAt(x + 1, y, z), n: !solidAt(x, y, z - 1), s: !solidAt(x, y, z + 1),
});

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFoot(x, z)) continue;
  const G = groundOf(x, z), R = top(x, z);
  for (let y = 0; y < R; y++) {
    if (y < G) { put(x, y, z, "stone_bricks"); continue; }    // foundation up to the lowest-cell ground
    const m = missing(x, y, z), perim = m.w || m.e || m.n || m.s;
    const corner = (m.w || m.e) && (m.n || m.s);
    const isRoof = y === R - 1, isFloor = y % 3 === 0;
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }                            // plinth course
    if (isRoof) { put(x, y, z, perim ? "calcite" : "smooth_stone"); continue; }         // cornice / roof deck
    if (isFloor) { put(x, y, z, perim ? "calcite" : "smooth_stone"); continue; }        // storey band / floor slab
    if (!perim) continue;                                                                // air behind the glass
    if (corner) { put(x, y, z, "calcite"); continue; }                                  // quoins
    // facade rhythm: 1 pier then 2 panes along the wall, counted from the cell's own facade line
    const u = (m.n || m.s) ? x : z;
    if (u % 3 === 0) put(x, y, z, "bricks");
    else put(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  }
}

// connect panes to the panes and piers beside them in their own wall plane (in-plane neighbours only)
for (const k of has) {
  const [x, y, z] = k.split(",").map(Number);
  const pane = g.get(x, y, z);
  if (!pane || pane.block !== "minecraft:glass_pane") continue;
  const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  if (has.has(key(x - 1, y, z))) st.west = "true";
  if (has.has(key(x + 1, y, z))) st.east = "true";
  if (has.has(key(x, y, z - 1))) st.north = "true";
  if (has.has(key(x, y, z + 1))) st.south = "true";
  g.set(x, y, z, "glass_pane", st);
}

// warm light: a glowstone just inside some panes (the air gap behind the glass), on a fixed pattern
for (const k of has) {
  const [x, y, z] = k.split(",").map(Number);
  if (y % 3 === 0 || y === 0) continue;
  const b = g.get(x, y, z); if (!b || b.block !== "minecraft:glass_pane") continue;
  if (((x * 5 + y * 3 + z * 7) % 19) !== 0) continue;
  const m = missing(x, y, z);
  const [ix, iz] = m.n ? [x, z + 1] : m.s ? [x, z - 1] : m.w ? [x + 1, z] : [x - 1, z];
  if (inFoot(ix, iz) && !has.has(key(ix, y, iz)) && y < top(ix, iz)) g.set(ix, y, iz, "glowstone");
}

// the M Street entrance: a door at x 20 on the north frontage (z 0) between calcite jambs, under the calcite band
const ent = 20;
for (const y of [1, 2]) {
  put(ent - 1, y, 0, "calcite");
  put(ent + 1, y, 0, "calcite");
  put(ent, y, 0, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
}
g.set(ent, 2, 1, "glowstone");                              // lobby ceiling light, inside

// roof plant: two light-grey boxes on the 12-block roof, clear of the setbacks
for (const [x0, z0] of [[13, 2], [26, 13]]) for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) {
  const x = x0 + dx, z = z0 + dz;
  if (inFoot(x, z) && top(x, z) === 12) put(x, 12, z, "light_gray_concrete");
}

const stats = g.save(OUT);
const hi = Math.max(...[...has].map((k) => Number(k.split(",")[1])));
console.log(JSON.stringify({ out: OUT, blocks: stats.blocks, palette: stats.palette, topLayer: hi, cells: cells.length }));
