// Shortlands Apartments: a 1970s-80s reinforced-concrete apartment block, 13 storeys (4 blocks each, 3.3 m at 1.2 blocks/m).
// Its footprint is irregular (369 cells), so the massing follows the lidar roof per cell, smoothed by a 3x3 median and
// quantised into three flat tiers (53 wings, 57 mid, 59 crown): the stepped setbacks come from those tiers.
// Facades: white-concrete body, light-grey storey lines every 4 blocks, a stone base course, glass bands with grey
// mullions, a 1-block air gap behind each pane (a few with glowstone), a parapet cap on every exposed top, and an
// entrance door with a lintel on the north side. Solid below each cell's ground (the foundation), no interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147112335.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147112335.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof] per footprint cell

const H = 72, W = 27, D = 22;
const g = new Voxels([W, H, D]);

// --- footprint and the massing: smoothed roof -> three flat tiers ---
const CELL = new Map(cells.map(([x, z, gr, roof]) => [`${x},${z}`, { x, z, gr, roof }]));
const at = (x, z) => CELL.get(`${x},${z}`);
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
for (const c of CELL.values()) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n) near.push(n.roof); }
  const m = median(near);                                     // (3,5) reads 31 in the lidar: the median drops it
  c.top = m < 55 ? 53 : m < 58 ? 57 : 59;                    // wings / mid / crown
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// a face is exposed at height y when its neighbour is outside the footprint or stands lower than y
const exposed = (c, y) => Object.keys(DIRS).filter((f) => {
  const [dx, dz] = DIRS[f]; const n = at(c.x + dx, c.z + dz);
  return !n || y >= n.top;
});

// --- the plan: one entry per block, so pane states and air gaps can look at their neighbours ---
const PANE = "__pane__";
const plan = new Map();
const k3 = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, extra = {}) => plan.set(k3(x, y, z), { x, y, z, block, ...extra });

for (const c of CELL.values()) {
  for (let y = 0; y < c.gr; y++) put(c.x, y, c.z, "stone_bricks");              // foundation to the ground
  for (let y = c.gr; y < c.top; y++) {
    const faces = exposed(c, y);
    if (!faces.length) {                                                         // core: solid, roof membrane on top
      put(c.x, y, c.z, y === c.top - 1 ? "light_gray_concrete" : "white_concrete");
      continue;
    }
    const face = faces[0], u = face === "N" || face === "S" ? c.x : c.z;        // a corner takes its first exposed face
    let block;
    if (y < 4) block = "stone_bricks";                                           // base course, ground storey
    else if (y % 4 === 0) block = "light_gray_concrete";                         // storey line / slab edge
    else if (y % 4 === 3) block = "white_concrete";                              // spandrel under the glass
    else if (u % 3 === 0) block = "gray_concrete";                               // mullion
    else block = PANE;                                                           // glass in the window band
    put(c.x, y, c.z, block, block === PANE ? { face } : {});
  }
  if (exposed(c, c.top - 1).length) put(c.x, c.top, c.z, "light_gray_concrete"); // parapet cap on every exposed edge
}

// the entrance: a door on the north face of cell (5,0), a stone lintel with a glowstone light over it
put(5, 0, 0, "iron_door", { state: { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" } });
put(5, 1, 0, "iron_door", { state: { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" } });
put(5, 2, 0, "glowstone");

// roof plant: grey boxes on the wings' roof, two high, in a 5-block grid
for (const c of CELL.values()) {
  if (c.top !== 53 || c.x % 5 !== 1 || c.z % 5 !== 2 || exposed(c, c.top - 1).length) continue;
  put(c.x, c.top, c.z, "gray_concrete");
  put(c.x, c.top + 1, c.z, "gray_concrete");
}

// glass panes: connect to a neighbour in the same wall plane (another pane or any solid block)
for (const e of [...plan.values()]) {
  if (e.block !== PANE) continue;
  const ew = e.face === "N" || e.face === "S";
  const has = (x, y, z) => plan.has(k3(x, y, z));
  const st = { north: "false", south: "false", east: "false", west: "false" };
  if (ew) { st.west = String(has(e.x - 1, e.y, e.z)); st.east = String(has(e.x + 1, e.y, e.z)); }
  else { st.north = String(has(e.x, e.y, e.z - 1)); st.south = String(has(e.x, e.y, e.z + 1)); }
  e.block = "light_blue_stained_glass_pane";
  e.state = st;
}

// the air gap behind each pane: the core cell just inside it becomes air, and some hold a glowstone light
for (const e of [...plan.values()]) {
  if (e.block !== "light_blue_stained_glass_pane") continue;
  const [dx, dz] = DIRS[e.face];
  const ix = e.x - dx, iz = e.z - dz, key = k3(ix, e.y, iz), core = plan.get(key);
  if (!core || core.block !== "white_concrete") continue;                         // never open the roof or a storey line
  if ((e.x + e.y * 3 + e.z) % 7 === 0) core.block = "glowstone";
  else plan.delete(key);
}

for (const e of plan.values()) g.set(e.x, e.y, e.z, e.block, e.state);

const { blocks, palette } = g.save(OUT);
const tiers = {}; for (const c of CELL.values()) tiers[c.top] = (tiers[c.top] || 0) + 1;
console.log(JSON.stringify({ blocks, palette, cells: CELL.size, tiers }));
