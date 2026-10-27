// The Pacifica: a 1990s glass-and-concrete office tower on an eight-storey podium, from the lidar roof record.
// Roof heights are quantized into flat tiers (podium 32, setbacks in 8-block steps, tower 210, penthouse 214);
// every column is solid from its ground up to its own top, so each tier stands on the one below. The facade is a
// one-cell skin (base course, glass shopfront, storey lines, pane windows between iron mullions, spandrels, cornice);
// behind it a one-cell air gap, a floor slab per storey and a solid core. Some windows are lit from behind.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_810172303.cells.json", "utf8"));
const W = 42, D = 44, Hmax = 227;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function quantize(h) {
  if (h < 45) return 32;                                       // podium: eight storeys
  if (h < 190) return Math.min(192, 8 * Math.round(h / 8));    // setbacks in 8-block steps
  return h < 212 ? 210 : 214;                                  // tower, and a penthouse on its central part
}

const at = new Map();   // "x,z" -> { g, top }
for (const [x, z, g, roof] of cells) at.set(`${x},${z}`, { g, top: quantize(roof) });
const colAt = (x, z) => at.get(`${x},${z}`) ?? null;
const topAt = (x, z) => colAt(x, z)?.top ?? 0;      // outside the footprint nothing stands

// deep inside the tall tier (every cell within 4 is footprint and tall): solid core behind the air gap
function isCore(x, z) {
  for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) {
    const c = colAt(x + dx, z + dz); if (!c || c.top < 150) return false;
  }
  return true;
}
// the outward directions a column's face is exposed in at height y: no neighbour stands that high
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => topAt(x + dx, z + dz) <= y);

const v = new Voxels([W, Hmax, D]);
const lit = [];   // [x, y, z] cells just inside a lit window

// the body: foundation, interior, skin
for (const [key, { g, top: T }] of at) {
  const [x, z] = key.split(",").map(Number);
  const core = isCore(x, z);
  for (let y = 0; y < T; y++) {
    if (y < g) { v.set(x, y, z, "stone_bricks"); continue; }                  // foundation under a sloped ground
    const out = exposed(x, z, y);
    if (!out.length) {
      if (core) v.set(x, y, z, y === T - 1 ? "smooth_stone" : "light_gray_concrete");
      else if (y === T - 1) v.set(x, y, z, "smooth_stone");                    // roof deck
      else if (y === g) v.set(x, y, z, "polished_andesite");                   // lobby floor
      else if (y % 4 === 0) v.set(x, y, z, "light_gray_concrete");             // floor slab per storey
      continue;
    }
    const ax = out.some(([dx]) => dx), az = out.some(([, dz]) => dz);
    if (y === T - 1) v.set(x, y, z, "smooth_stone");                           // cornice / parapet cap
    else if (y === g) v.set(x, y, z, "polished_andesite");                     // base course
    else if (y < 4) v.set(x, y, z, "light_blue_stained_glass");                // ground storey: glass shopfront
    else if (y % 4 === 0) v.set(x, y, z, "light_gray_concrete");               // storey line
    else if (y % 4 === 3) v.set(x, y, z, "white_concrete");                    // spandrel
    else if ((ax && az) || (ax ? z : x) % 3 === 0) v.set(x, y, z, "iron_block");   // mullion, corner
    else {
      const arms = ax ? { north: "true", south: "true", east: "false", west: "false" }
                      : { north: "false", south: "false", east: "true", west: "true" };
      v.set(x, y, z, "light_blue_stained_glass_pane", { ...arms, waterlogged: "false" });
      if ((x * 31 + z * 17 + Math.floor(y / 4) * 7) % 5 === 0) lit.push([x - out[0][0], y, z - out[0][1]]);
    }
  }
}

// lit windows: glowstone just behind the pane, in the air gap
for (const [x, y, z] of lit) {
  if (!colAt(x, z) || y >= colAt(x, z).top || isCore(x, z)) continue;
  if (exposed(x, z, y).length === 0) v.set(x, y, z, "glowstone");
}

// the entrance: a recessed bay on the outside edge furthest south, near the middle of the frontage
let ent = null;
for (const key of at.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (topAt(x, z + 1) !== 0) continue;
  if (!ent || z > ent[1] || (z === ent[1] && Math.abs(x - 21) < Math.abs(ent[0] - 21))) ent = [x, z];
}
if (ent) {
  const [ex, ez] = ent, { g } = colAt(ex, ez);
  for (let dx = -1; dx <= 1; dx++) {
    const x = ex + dx; if (!colAt(x, ez)) continue;
    v.set(x, g, ez, "polished_andesite");                    // threshold
    v.set(x, g + 1, ez, "air"); v.set(x, g + 2, ez, "air");   // recess
    v.set(x, g + 3, ez, "light_gray_concrete");              // lintel
  }
  const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
  v.set(ex, g + 1, ez, "dark_oak_door", { ...door, half: "lower" });
  v.set(ex, g + 2, ez, "dark_oak_door", { ...door, half: "upper" });
  if (colAt(ex + 1, ez)) v.set(ex + 1, g + 2, ez, "lantern", { hanging: "true", waterlogged: "false" });
}

// roof terraces on the podium: planters on a grid
for (const [key, { top: T }] of at) {
  const [x, z] = key.split(",").map(Number);
  if (T !== 32 || x % 5 !== 2 || z % 5 !== 2) continue;
  if (exposed(x, z, T - 1).length === 0) v.set(x, T, z, "oak_leaves", { persistent: "true", distance: "1", waterlogged: "false" });
}

// the tower's mast: iron bars up from the core's central top, a glowstone beacon at the head
let cx = 0, cz = 0, n = 0;
for (const key of at.keys()) { const [x, z] = key.split(",").map(Number); if (isCore(x, z)) { cx += x; cz += z; n++; } }
if (n) {
  cx = Math.round(cx / n); cz = Math.round(cz / n);
  let best = null;
  for (const key of at.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (!isCore(x, z)) continue;
    const d = Math.abs(x - cx) + Math.abs(z - cz);
    if (!best || d < best.d || (d === best.d && topAt(x, z) > best.t)) best = { x, z, d, t: topAt(x, z) };
  }
  const T = best.t;
  for (let k = 0; k < 10; k++) v.set(best.x, T + k, best.z, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  v.set(best.x, T + 10, best.z, "glowstone");
}

const { blocks, palette } = v.save(DIR + "way_810172303.nbt");
console.log(`way_810172303: ${cells.length} cells, ${blocks} blocks, ${palette} palette entries`);
