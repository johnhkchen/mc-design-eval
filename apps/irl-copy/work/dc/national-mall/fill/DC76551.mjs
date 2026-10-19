// DC76551: a vacant 1930s stripped-classical federal office block (calcite walls, smooth-quartz string courses and
// cornice, polished-granite plinth and foundation), six storeys of three blocks on the main mass, with 5-, 4- and
// 2-storey wings stepping down to the courtyard infill. Storey lines sit on absolute y, so the lidar tiers align.
// Windows are dark glass in calcite bays, a few boarded with planks and a few lit by hanging lanterns. The south
// face has a one-cell porch in the middle of the projection: a granite floor, a quartz canopy on two corner pillars,
// and double iron doors in the wall behind. Roof plant sits on the cells the lidar reads at 19.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC76551.cells.json`, "utf8"));   // [x, z, ground, roof]

const k = (x, y, z) => `${x},${y},${z}`;
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];                                // N, S, W, E
const SOLID = new Set(["calcite", "smooth_quartz", "polished_granite", "stone_bricks", "gray_concrete",
  "light_gray_concrete", "quartz_pillar", "oak_planks", "gray_stained_glass_pane", "black_stained_glass_pane"]);

const F = new Map();                                                            // footprint: "x,z" -> { x, z, g, r }
for (const [x, z, g, r] of cells) F.set(`${x},${z}`, { x, z, g, r });
const maxZ = Math.max(...cells.map((c) => c[1]));

// The porch: the outer row of the southern projection, centred on it. Doors sit in the wall behind it.
const southRow = cells.filter((c) => c[1] === maxZ).map((c) => c[0]);
const mid = Math.floor((Math.min(...southRow) + Math.max(...southRow)) / 2);
const porch = (x, z) => z === maxZ && x >= mid - 3 && x <= mid + 2;
const porchCells = [...F.values()].filter((c) => porch(c.x, c.z));
const porchG = Math.max(...porchCells.map((c) => c.g));
const canopy = Math.ceil((porchG + 3) / 3) * 3;                                 // a storey line above the porch head

// Lidar roof -> clean tiers: the median of a 5 x 5 patch, quantised to 6, 9, 12, 15 or 18 (2 to 6 storeys).
function smooth(x, z) {
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const c = F.get(`${x + dx},${z + dz}`); if (c) v.push(c.r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
}
const tierOf = (s) => (s <= 7 ? 6 : s <= 10 ? 9 : s <= 13 ? 12 : s <= 15 ? 15 : 18);

const B = new Map();                                                            // building columns: "x,z" -> { x, z, g, T }
for (const c of F.values()) {
  if (porch(c.x, c.z)) continue;
  const T = Math.max(tierOf(smooth(c.x, c.z)), Math.ceil((c.g + 3) / 3) * 3);
  B.set(`${c.x},${c.z}`, { x: c.x, z: c.z, g: c.g, T });
}
// The wall behind the porch carries the canopy, so it must rise above the canopy's storey line.
for (let x = mid - 3; x <= mid + 2; x++) { const b = B.get(`${x},${maxZ - 1}`); if (b && b.T < canopy + 3) b.T = canopy + 3; }
const col = (x, z) => B.get(`${x},${z}`);

// Air at (x, y, z): outside the footprint, above a neighbour's roof, or above a porch floor.
function airAt(x, z, y) {
  const n = col(x, z); if (n) return y >= n.T;
  const f = F.get(`${x},${z}`); if (f) return y > f.g;
  return true;
}

const blk = new Map();
const put = (x, y, z, block, state) => blk.set(k(x, y, z), { block, state });

// Foundations: solid from y 0 to each cell's ground, so nothing floats on the slope.
for (const c of F.values()) for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "polished_granite");

for (const c of B.values()) {
  for (let y = c.g; y < c.T; y++) {
    const open = DIRS.filter(([dx, dz]) => airAt(c.x + dx, c.z + dz, y));
    const ext = open.length > 0;
    if (y === c.T - 1) { put(c.x, y, c.z, ext ? "smooth_quartz" : "gray_concrete"); continue; }   // cornice / roof deck
    if (y === c.g && ext) { put(c.x, y, c.z, "polished_granite"); continue; }                      // plinth
    if (y % 3 === 0) { put(c.x, y, c.z, ext ? "smooth_quartz" : "stone_bricks"); continue; }      // string course / floor slab
    if (!ext) continue;                                                                             // interior air
    const onNS = open.some(([, dz]) => dz !== 0), onEW = open.some(([dx]) => dx !== 0);
    const pier = (onNS && c.x % 3 === 0) || (onEW && c.z % 3 === 0) || (onNS && onEW);
    if (pier) { put(c.x, y, c.z, "calcite"); continue; }                                           // pilaster between bays
    const boarded = (c.x * 7 + y * 13 + c.z * 29) % 17 === 0;
    put(c.x, y, c.z, boarded ? "oak_planks" : "gray_stained_glass_pane");
  }
  // Roof plant on the lidar's 19 cells: a screened box two blocks high, clear of the parapet.
  if (c.T === 18 && F.get(`${c.x},${c.z}`).r >= 19 && c.x % 3 === 1 && c.z % 3 === 1) {
    for (const y of [18, 19]) put(c.x, y, c.z, "light_gray_concrete");
  }
}

// Lit windows: a lantern hung from the storey slab two cells inside a bay, so the glow reads from the street.
for (const [key, v] of [...blk]) {
  if (v.block !== "gray_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  if ((x * 5 + y * 11 + z * 3) % 13 !== 0) continue;
  const out = DIRS.find(([dx, dz]) => airAt(x + dx, z + dz, y));
  if (!out) continue;
  const ix = x - 2 * out[0], iz = z - 2 * out[1], yl = Math.floor(y / 3) * 3 + 2;
  const n = col(ix, iz);
  if (!n || yl < n.g || yl >= n.T - 1 || blk.has(k(ix, yl, iz)) || !blk.has(k(ix, yl + 1, iz))) continue;
  put(ix, yl, iz, "lantern", { hanging: "true" });
}

// Porch: granite floor, quartz canopy at the storey line, two corner pillars.
for (const c of porchCells) {
  put(c.x, c.g, c.z, "polished_granite");
  put(c.x, canopy, c.z, "smooth_quartz");
}
for (const x of [mid - 3, mid + 2]) {
  const c = F.get(`${x},${maxZ}`); if (!c) continue;
  for (let y = c.g + 1; y < canopy; y++) put(x, y, maxZ, "quartz_pillar", { axis: "y" });
}

// Double iron doors in the wall behind the porch, on a granite threshold.
for (const x of [mid - 1, mid]) {
  const c = col(x, maxZ - 1); if (!c) continue;
  put(x, c.g, maxZ - 1, "polished_granite");
  for (const [y, half] of [[c.g + 1, "lower"], [c.g + 2, "upper"]]) {
    put(x, y, maxZ - 1, "iron_door", { facing: "south", half, hinge: x === mid - 1 ? "left" : "right", open: "false", powered: "false" });
  }
}

// Glass panes join solid neighbours and other panes in their plane, so the bays read as framed grids.
for (const [key, v] of blk) {
  if (v.block !== "gray_stained_glass_pane" && v.block !== "black_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const st = {};
  for (const [name, dx, dz] of [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]]) {
    const n = blk.get(k(x + dx, y, z + dz));
    st[name] = n && (SOLID.has(n.block) || n.block.endsWith("glass_pane")) ? "true" : "false";
  }
  v.state = st;
}

const g = new Voxels([125, 21, 129]);
for (const [key, v] of blk) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = g.save(`${DIR}/DC76551.nbt`);
console.log(`DC76551.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
