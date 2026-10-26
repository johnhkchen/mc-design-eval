// Saint Matthew's Cathedral and Rectory, 1725 Rhode Island Ave NW: a stone Gothic Revival cathedral (c. 1893-1913,
// inferred from the record) with a tall crossing and a lower nave and aisles, and red-brick rectory wings on the low
// flanks. The lidar roof is median-smoothed and snapped to 4-block tiers, so every tier is a flat storey stack that
// stands on the one below. Each tier has a 4-row storey rhythm: string course (floor row), sill, and a 2-row window
// band of glass between stone piers (a warm glowstone pane in some, blue glass in a few). The walls are one block
// thick with an air gap behind the glass, and the floor slabs rest on the walls. Parapets are crenellated, the
// crossing has corner pinnacles and a short spire, and the entrances are a door on the south face of the nave
// and one on the rectory's east wing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC59147.cells.json`, "utf8"));

const F = new Map();   // "x,z" -> { g (ground), r (lidar roof), H (snapped tier height) }
for (const [x, z, gr, roof] of cells) F.set(`${x},${z}`, { g: gr, r: roof, H: 0 });
const at = (x, z) => F.get(`${x},${z}`);

// ---- massing: 3x3 median of the lidar roof, then snapped to 4-block tiers so every storey line lines up ----
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
for (const [k, c] of F) {
  const [x, z] = k.split(",").map(Number);
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = at(x + dx, z + dz); if (n) near.push(n.r);
  }
  c.H = Math.max(4, 4 * Math.round(median(near) / 4));
}
const H = (x, z) => at(x, z)?.H ?? 0;                      // 0 = outside the footprint
const solid = (x, y, z) => y < H(x, z);
const DIRS = { E: [1, 0], W: [-1, 0], S: [0, 1], N: [0, -1] };
const exposed = (x, y, z) => Object.keys(DIRS).filter((d) => !solid(x + DIRS[d][0], y, z + DIRS[d][1]));

// ---- materials: stone cathedral, brick for the low (4-8 block) wings ----
const matsFor = (c) => (c.H <= 8
  ? { wall: "bricks", trim: "stone_bricks", pier: "stone_bricks", parapet: "stone_bricks", crenel: "stone_brick_wall" }
  : { wall: "stone_bricks", trim: "polished_andesite", pier: "stone_bricks", parapet: "stone_bricks", crenel: "stone_brick_wall" });

const g = new Voxels([31, 36, 26]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [k, c] of F) {
  const [x, z] = k.split(",").map(Number);
  const M = matsFor(c);
  for (let y = 0; y < c.H; y++) {
    // foundation: solid under the ground line, so nothing floats on the slope
    if (y < c.g) { put(x, y, z, "stone_bricks"); continue; }
    const ex = exposed(x, y, z);
    const top = y === c.H - 1;
    const floor = y % 4 === 0;
    if (ex.length === 0) {
      // interior: floor slabs per storey and the roof deck under the top; everything else is air
      if (floor) put(x, y, z, "smooth_stone");
      else if (y >= c.H - 3) put(x, y, z, "stone_bricks");
      if (top) put(x, y, z, "deepslate_tiles");
      continue;
    }
    if (top) { put(x, y, z, M.parapet); continue; }                   // the parapet course
    if (floor) { put(x, y, z, M.trim); continue; }                    // string course
    const ns = ex.some((d) => d === "N" || d === "S");
    const ew = ex.some((d) => d === "E" || d === "W");
    if (ns && ew) { put(x, y, z, M.trim); continue; }                // quoins at the corners
    if (y % 4 === 1) { put(x, y, z, M.trim); continue; }             // sill row
    // window band: piers every third cell along the face, glass between (the along-face index)
    const a = ns ? x : z;
    if (a % 3 === 0) { put(x, y, z, M.pier); continue; }
    const h = (x * 7 + y * 13 + z * 5) % 11;
    put(x, y, z, h === 0 ? "glowstone" : h === 5 ? "blue_stained_glass" : "glass");
  }
  // crenellations on the exposed top course (a stone or brick merlon every other cell)
  if (exposed(x, c.H - 1, z).length && x % 2 === 0) put(x, c.H, z, M.crenel);
}

// ---- entrances: a door in a wall (lower and upper half), set at the ground line on the outside face ----
const door = (x, z, facing, hinge) => {
  const c = at(x, z);
  put(x, c.g, z, "dark_oak_door", { facing, half: "lower", hinge, open: "false", powered: "false" });
  put(x, c.g + 1, z, "dark_oak_door", { facing, half: "upper", hinge, open: "false", powered: "false" });
};
// nave: the south face nearest the middle of the plan, with the deepest reach toward the street
let best = null;
for (const [k, c] of F) {
  const [x, z] = k.split(",").map(Number);
  if (!exposed(x, c.g, z).includes("S") || x < 8 || x > 14) continue;
  const score = z * 10 - Math.abs(x - 11);
  if (!best || score > best.score) best = { x, z, score };
}
door(best.x, best.z, "north", "left");     // outside is +z, so the door faces north into the wall
// rectory: a door on the east face of a brick wing
let rect = null;
for (const [k, c] of F) {
  const [x, z] = k.split(",").map(Number);
  if (c.H > 8 || !exposed(x, c.g, z).includes("E")) continue;
  if (!rect || x > rect.x) rect = { x, z };
}
if (rect) door(rect.x, rect.z, "west", "left");

// ---- crossing: corner pinnacles on the top tier and a short spire on its middle ----
const crown = [...F].map(([k, c]) => [k.split(",").map(Number), c]).filter(([, c]) => c.H === 24);
for (const [[x, z]] of crown) {
  if (exposed(x, 23, z).length >= 2) for (let y = 24; y < 26; y++) put(x, y, z, "stone_brick_wall");
}
const cx = crown.reduce((s, [[x]]) => s + x, 0) / crown.length;
const cz = crown.reduce((s, [[, z]]) => s + z, 0) / crown.length;
const [[sx, sz]] = crown.reduce((b, p) => (Math.hypot(p[0][0] - cx, p[0][1] - cz) < Math.hypot(b[0][0] - cx, b[0][1] - cz) ? p : b), crown[0]);
for (let y = 24; y < 28; y++) put(sx, y, sz, "stone_brick_wall");

const out = `${DIR}/DC59147.nbt`;
const stats = g.save(out);

// ---- check: a block with no air-free support is a floating one (interior slabs rest on the walls) ----
let floating = 0;
for (let y = 1; y < 36; y++) for (let z = 0; z < 26; z++) for (let x = 0; x < 31; x++) {
  if (!g.get(x, y, z)) continue;
  if (g.get(x, y - 1, z)) continue;
  const side = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => g.get(x + dx, y, z + dz));
  if (!side) floating++;
}
console.log(JSON.stringify({ ...stats, floating, spire: [sx, sz], door: best, rectoryDoor: rect }));
