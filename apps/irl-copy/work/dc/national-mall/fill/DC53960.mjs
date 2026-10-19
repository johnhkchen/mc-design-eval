// DC53960: a 1930s stripped-classical federal office block (Indiana-limestone look: calcite walls, granite plinth,
// smooth-quartz bands and parapets), six storeys of three blocks on a 13-block lower wing, a central attic pavilion
// and a NE corner tower to 23. Storey lines sit on absolute y so neighbouring cells on the NE ground step align.
// Shell is one cell thick; interiors are air with a slab per storey; glass panes sit in calcite bays with air behind.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC53960.cells.json`, "utf8"));   // [x, z, ground, roof]

const k = (x, y, z) => `${x},${y},${z}`;
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const SOLID = new Set(["calcite", "smooth_quartz", "polished_granite", "stone", "stone_bricks", "gray_concrete", "quartz_pillar", "light_blue_stained_glass_pane"]);

// The entrance recess (south, centre): an open porch, not part of the shell.
const porch = (x, z) => z === 21 && x >= 11 && x <= 16;

// Lidar roof -> clean tiers. Lower wings where the lidar reads 14 or less (and the south and west edges); the
// main block at 19; the central attic pavilion at 22; the NE corner tower at 23 with a shoulder at 21.
function tierTop(x, z, r) {
  if (x >= 9 && x <= 18 && z >= 8 && z <= 15) return 22;
  if ((x === 25 || x === 26) && z <= 2) return 23;
  if (x === 24 && (z === 1 || z === 2)) return 21;
  if (z >= 21 || x <= 2 || r <= 14) return 13;
  return 19;
}

const B = new Map();                                    // building columns: "x,z" -> { x, z, g, T }
for (const [x, z, g, r] of cells) {
  if (porch(x, z)) continue;
  B.set(`${x},${z}`, { x, z, g, T: tierTop(x, z, r) });
}
const col = (x, z) => B.get(`${x},${z}`);

// Sides of a column at height y that face air (outside the footprint, under a neighbour's roof, or beside a lower one).
function openSides(c, y) {
  const out = [];
  for (const [dx, dz] of DIRS) {
    const n = col(c.x + dx, c.z + dz);
    if (!n || y >= n.T || y < n.g) out.push([dx, dz]);
  }
  return out;
}

const blk = new Map();
const put = (x, y, z, block, state) => blk.set(k(x, y, z), { block, state });

for (const c of B.values()) {
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone");                       // foundation to the lowest ground
  for (let y = c.g; y < c.T; y++) {
    const open = openSides(c, y);
    const ext = open.length > 0;
    if (y === c.T - 1) { put(c.x, y, c.z, ext ? "smooth_quartz" : "gray_concrete"); continue; }   // parapet / roof
    if (y === c.g && ext) { put(c.x, y, c.z, "polished_granite"); continue; }                      // base course
    if (y % 3 === 0) { put(c.x, y, c.z, ext ? "smooth_quartz" : "stone_bricks"); continue; }      // storey line / floor slab
    if (!ext) continue;                                                                             // interior air
    const onNS = open.some(([, dz]) => dz !== 0), onEW = open.some(([dx]) => dx !== 0);
    const pier = (onNS && c.x % 3 === 0) || (onEW && c.z % 3 === 0) || (onNS && onEW);
    if (pier) { put(c.x, y, c.z, "calcite"); continue; }
    put(c.x, y, c.z, "light_blue_stained_glass_pane");
    // Some windows are lit: a glowstone two cells inside, so the air gap behind the glass stays one cell wide.
    const [dx, dz] = open.find(([, dz2]) => dz2 !== 0) ?? open[0];
    if ((c.x * 5 + y * 7 + c.z * 11) % 23 === 0) {
      const ix = c.x - 2 * dx, iz = c.z - 2 * dz, n = col(ix, iz);
      if (n && y >= n.g && y < n.T - 1 && !blk.has(k(ix, y, iz))) put(ix, y, iz, "glowstone");
    }
  }
}

// Glass panes connect to solid neighbours in their plane, so the bays read as framed grids.
for (const [key, v] of blk) {
  if (v.block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const st = {};
  for (const [name, dx, dz] of [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]]) {
    const n = blk.get(k(x + dx, y, z + dz));
    st[name] = n && SOLID.has(n.block) ? "true" : "false";
  }
  v.state = st;
}

// The entrance recess: granite floor, four columns, a calcite architrave, a cornice at the top.
for (let x = 11; x <= 16; x++) {
  put(x, 0, 21, "polished_granite");
  put(x, 10, 21, "smooth_quartz");                                             // architrave
  put(x, 11, 21, "smooth_quartz");                                             // porch cornice
}
for (const x of [11, 12, 15, 16]) for (let y = 1; y <= 9; y++) put(x, y, 21, "quartz_pillar", { axis: "y" });
put(13, 9, 21, "lantern", { hanging: "true" });
put(14, 9, 21, "lantern", { hanging: "true" });

// Double entrance doors in the back wall of the recess.
for (const y of [1, 2]) {
  const half = y === 1 ? "lower" : "upper";
  put(13, y, 20, "iron_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
  put(14, y, 20, "iron_door", { facing: "south", half, hinge: "right", open: "false", powered: "false" });
}

// Roof plant: two screened boxes on the main roof, clear of the pavilion.
for (const [x, z] of [[3, 16], [4, 16], [3, 17], [4, 17], [20, 12], [21, 12], [20, 13], [21, 13]]) {
  for (const y of [19, 20]) put(x, y, z, "light_gray_concrete");
}

const g = new Voxels([28, 35, 23]);
for (const [key, v] of blk) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = g.save(`${DIR}/DC53960.nbt`);
console.log(`DC53960.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
