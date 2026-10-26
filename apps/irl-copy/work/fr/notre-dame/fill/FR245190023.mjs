// FR245190023: an undifferentiated (Indifférencié) stone block at the Notre-Dame quarter, 22 x 20 blocks.
// Pale limestone walls (calcite) on a rusticated stone base, smooth-quartz string courses and quoins, tall windows
// glazed in panes, a dark-oak street door, and a slate mansard (deepslate tiles and stairs) over a flat top with
// brick chimneys. Walls are the footprint's edge cells only; inside is air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${HERE}/FR245190023.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${HERE}/FR245190023.nbt`;

const SX = 22, SY = 41, SZ = 20;
const STOREY = 5, MAX_STOREYS = 5;
const DIR = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const key = (x, z) => `${x},${z}`;

const grid = new Map();
for (const [x, z, g, r] of cells) grid.set(key(x, z), { x, z, g, r });
const at = (x, z) => grid.get(key(x, z));
const dirs = Object.keys(DIR);
const nb = (c, d) => at(c.x + DIR[d][0], c.z + DIR[d][1]);

// Storeys from the lidar roof: a 3x3-ish mean (the cell and its footprint neighbours) rounded to whole storeys.
for (const c of grid.values()) {
  let sum = c.r, n = 1;
  for (const d of dirs) { const o = nb(c, d); if (o) { sum += o.r; n++; } }
  c.n = clamp(Math.round((sum / n - c.g) / STOREY), 1, MAX_STOREYS);
  c.top = c.g + c.n * STOREY;
}
// Wall cells: the footprint's edge, or a neighbour on a lower tier (the setback face). out = the directions they face.
for (const c of grid.values()) {
  c.out = dirs.filter((d) => { const o = nb(c, d); return !o || o.top < c.top; });
  c.edge = c.out.length > 0;
}
// Depth from the walls into the footprint: 0 = wall, 1 = the ring inside it, and so on (sets the mansard's steps).
const queue = [];
for (const c of grid.values()) if (c.edge) { c.d = 0; queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const d of dirs) { const o = nb(c, d); if (o && o.d === undefined) { o.d = c.d + 1; queue.push(o); } }
}

// The street door: the outer-facing wall cell nearest the middle of the footprint, on a single face (not a corner).
let door = null, best = Infinity;
for (const c of grid.values()) {
  if (!c.edge || c.out.length !== 1 || nb(c, c.out[0])) continue;
  const score = Math.abs(c.x - 10) + Math.abs(c.z - 10);
  if (score < best) { best = score; door = c; }
}

const g = new Voxels([SX, SY, SZ]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const lamps = [];

// Foundation, and the solid masonry of the interior cells (a string course at each floor, no rooms)
for (const c of grid.values()) {
  const { x, z, g: gr, top } = c;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (c.edge) continue;
  for (let y = gr; y < top; y++) {
    const k = Math.floor((y - gr) / STOREY), rel = (y - gr) % STOREY;
    put(x, y, z, rel === 0 ? (k === 0 ? "stone_bricks" : "smooth_quartz") : "calcite");
  }
  put(x, top, z, "deepslate_tiles");                                              // the roof deck
  if (c.d >= 1) put(x, top + 1, z, "deepslate_tiles");                            // mansard: solid under its steps
  if (c.d >= 2) put(x, top + 2, z, "deepslate_tiles");                            // flat top of the mansard
}

// Walls: rusticated base, string courses at each floor, glazed bays, quoins at the corners, lintels at the top of each band
for (const c of grid.values()) {
  if (!c.edge) continue;
  const corner = c.out.length >= 2;
  const face = c.out[0];
  const runsEW = face === "north" || face === "south";                           // a wall running east-west connects panes east and west
  const along = runsEW
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const isDoor = c === door;
  for (let y = c.g; y < c.top; y++) {
    const k = Math.floor((y - c.g) / STOREY), rel = (y - c.g) % STOREY;
    let block = "calcite", state;
    if (rel === 0) block = k === 0 ? "stone_bricks" : "smooth_quartz";
    else if (corner) block = "smooth_quartz";
    else if (rel <= 3 && (c.x + c.z) % 2 === 0 && !isDoor) { block = "glass_pane"; state = along; lamps.push({ c, y, k, face }); }
    if (isDoor && (rel === 1 || rel === 2)) {
      block = "dark_oak_door";
      state = { facing: face, half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
    }
    put(c.x, y, c.z, block, state);
  }
  // a light cornice course under the slate covering
  put(c.x, c.top, c.z, "smooth_quartz");
  put(c.x, c.top + 1, c.z, "deepslate_tiles");
}

// An air gap directly behind each glazed bay (and the door's hall), so the glass sits in a recess; some bays get a
// lantern standing on the sill course inside it
for (const { c, k, face } of lamps) {
  const inward = at(c.x - DIR[face][0], c.z - DIR[face][1]);
  if (!inward) continue;
  for (let r = 1; r <= 3; r++) put(inward.x, c.g + k * STOREY + r, inward.z, "air");
  if (((c.x * 3 + c.z * 5 + k) % 4) === 0) put(inward.x, c.g + k * STOREY + 1, inward.z, (c.x + c.z + k) % 2 ? "shroomlight" : "lantern", { hanging: "false", waterlogged: "false" });
}
if (door) {
  const face = door.out[0];
  const inward = at(door.x - DIR[face][0], door.z - DIR[face][1]);
  if (inward) {
    put(inward.x, door.g + 1, inward.z, "air"); put(inward.x, door.g + 2, inward.z, "air");
    put(inward.x, door.g + 1, inward.z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Brick chimneys on the flat top of the taller tiers
for (const c of grid.values()) {
  if (c.edge || c.d < 2 || c.n < 3 || (c.x * 5 + c.z * 3) % 11 !== 0) continue;
  put(c.x, c.top + 3, c.z, "bricks");
  put(c.x, c.top + 4, c.z, "bricks");
  put(c.x, c.top + 5, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const stats = g.save(OUT);
const tiers = {};
for (const c of grid.values()) tiers[c.n] = (tiers[c.n] ?? 0) + 1;
console.log(`cells ${grid.size}, storeys ${JSON.stringify(tiers)}, door ${door ? `${door.x},${door.z} facing ${door.out[0]}` : "none"}, blocks ${stats.blocks}, palette ${stats.palette}`);
