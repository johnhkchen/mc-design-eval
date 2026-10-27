import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 170798659, Auckland: a 1970s-80s concrete office block on the slope. Floors sit on absolute storey lines
// (y = 0, 4, 8 ...) so every storey stands on the one below; the foundation fills under each cell up to its ground.
// Roof heights are median-smoothed and quantised to whole storeys, so the block steps in tiers to a taller core.
// Envelope: white concrete piers, light-grey spandrels and storey lines, tinted glass panes in a window grid, a stone
// base course and plinth, a shopfront with doors at grade on the low side, a stone roof with a parapet, and plant on
// the core. Interiors are air behind the glass, with a floor slab per storey and a few lamps on the floor.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_170798659.cells.json", "utf8"));
const [W, H, D] = [58, 36, 33];
const PANE = "light_blue_stained_glass_pane";
const WALLISH = new Set(["white_concrete", "light_gray_concrete", "stone_bricks", PANE]);
const DIRS = [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]];

const key = (x, z) => x * 100 + z;
const grid = new Map();
const at = (x, z) => grid.get(key(x, z));
for (const [x, z, ground, raw] of cells) grid.set(key(x, z), { x, z, ground, raw, top: 0 });

// lidar roof noise: median of the 3x3 neighbourhood, then whole storeys (4 blocks), never below one storey over the ground
for (const c of grid.values()) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n) near.push(n.raw); }
  near.sort((a, b) => a - b);
  c.top = Math.max(c.ground + 4, 4 * Math.round(near[near.length >> 1] / 4));
}
const TOP_MAX = Math.max(...[...grid.values()].map((c) => c.top));

// the faces of a cell at height y that look onto air: out past the footprint, or over a lower neighbour's roof
function faces(c, y) {
  const out = [];
  for (const [name, dx, dz] of DIRS) {
    const n = at(c.x + dx, c.z + dz);
    if (!n) out.push({ name, dx, dz, outside: true });
    else if (y >= n.top) out.push({ name, dx, dz, outside: false });
  }
  return out;
}

const plan = new Map();
const put = (x, y, z, block, state = null, face = null) => plan.set(`${x},${y},${z}`, { block, state, face });

// pass 1: the solid, the envelope and the floors
for (const c of grid.values()) {
  const { x, z, ground, top } = c;
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");                       // foundation under the ground
  for (let y = ground; y < top; y++) {
    const ex = faces(c, y);
    if (y === top - 1) { put(x, y, z, "stone"); continue; }                            // roof slab
    if (y === ground && ex.length) { put(x, y, z, "stone_bricks"); continue; }         // base course
    if (!ex.length) { if (y % 4 === 0) put(x, y, z, "smooth_stone"); continue; }      // interior: air, floor slab per storey
    if (y % 4 === 0 || y % 4 === 3) { put(x, y, z, "light_gray_concrete"); continue; } // floor line and head band
    if (ex.length > 1) { put(x, y, z, "white_concrete"); continue; }                   // corner pier
    const f = ex[0];
    const shop = ground === 0 && y < 4;                                                // open ground storey: shopfront
    const u = f.dz !== 0 ? x : z;                                                      // position along the face
    if (shop && f.outside && u % 12 === 6) {                                           // entrance door
      put(x, y, z, "dark_oak_door", { facing: f.name, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (u % (shop ? 6 : 3) === 0) put(x, y, z, "white_concrete");                      // pier between the bays
    else put(x, y, z, PANE, null, f);                                                  // glass, state set below
  }
  // parapet on the roof edge, where the roof meets air (outside, or a lower tier)
  if (DIRS.some(([, dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.top < top; })) put(x, top, z, "smooth_stone");
  // plant on the core roof: a screen box with a unit on it
  if (top === TOP_MAX && !faces(c, top - 1).length && x % 9 >= 3 && x % 9 <= 5 && z % 7 >= 2 && z % 7 <= 4) {
    put(x, top, z, "light_gray_concrete");
    if (x % 9 === 4 && z % 7 === 3) put(x, top + 1, z, "iron_block");
  }
}

// pass 2: glass panes join the solid neighbours along their own wall
const solid = (x, y, z) => WALLISH.has(plan.get(`${x},${y},${z}`)?.block);
for (const [k, p] of plan) {
  if (p.block !== PANE) continue;
  const [x, y, z] = k.split(",").map(Number);
  const on = p.face.dz !== 0
    ? { north: false, south: false, east: solid(x + 1, y, z), west: solid(x - 1, y, z) }
    : { north: solid(x, y, z - 1), south: solid(x, y, z + 1), east: false, west: false };
  p.state = Object.fromEntries(Object.entries(on).map(([d, v]) => [d, String(v)]));
}

// pass 3: warm lamps on the floor of some rooms, just inside the lower glass row
for (const [k, p] of [...plan]) {
  if (p.block !== PANE) continue;
  const [x, y, z] = k.split(",").map(Number);
  if (y % 4 !== 1) continue;
  const ix = x - p.face.dx, iz = z - p.face.dz;                                       // one step inward
  const c = at(ix, iz);
  if (!c || y < c.ground || y >= c.top - 1 || plan.has(`${ix},${y},${iz}`)) continue;
  if ((x * 7 + z * 13 + y) % 6 !== 0) continue;
  const kind = (x + z) % 3;
  if (kind === 0) put(ix, y, iz, "glowstone");
  else if (kind === 1) put(ix, y, iz, "shroomlight");
  else put(ix, y, iz, "lantern", { hanging: "false" });
}

const g = new Voxels([W, H, D]);
for (const [k, p] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, p.block, p.state ?? undefined);
}
const { blocks } = g.save(DIR + "way_170798659.nbt");
console.log(`way_170798659: ${blocks} blocks, tops ${[...new Set([...grid.values()].map((c) => c.top))].sort((a, b) => a - b)}`);
