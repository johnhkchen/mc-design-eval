// Hôtel Notre-Dame (1823, commercial, 7 storeys): a 20 x 20 footprint built from the lidar's per-cell roof.
// Each cell is a column: foundation to its ground, then a shell (1-block walls, quoins, shopfronts, windows, a cornice)
// or an interior (air between the floor slabs, a deepslate cover). Roof heights are smoothed into four tiers:
// 29 (seven storeys), 25, 21 and 17, with the seventh storey set back one cell from the street front.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR241938056.cells.json`, "utf8"));

const g = new Voxels([20, 45, 20]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);

// Storey floor lines (absolute rows): ground floor at 0-1, then every 4 blocks; the top tier closes at 29.
const FL = [5, 9, 13, 17, 21, 25];
const ENTRANCE = { x: 13, z: 0, dir: 0 };   // north face, a commercial entrance on the ground floor
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];   // N E S W

// Lidar roof (above y 0) to a tier. Readings under 14 are edge noise, handled below.
const tierOf = (r) => (r >= 26 ? 29 : r >= 20 ? 25 : r >= 14 ? 21 : 17);
const map = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { x, z, g: ground, r: roof }]));
const at = (x, z) => map.get(`${x},${z}`);
const nbrs = (c) => DIRS.map(([dx, dz]) => at(c.x + dx, c.z + dz)).filter(Boolean);

for (const c of map.values()) c.T = tierOf(c.r);
for (const c of map.values()) if (c.r < 14) c.T = Math.max(17, ...nbrs(c).filter((n) => n.r >= 14).map((n) => n.T));
for (const c of map.values()) {
  // a shell cell is on the outside, or stands beside a lower roof (the setback steps are walls too)
  c.shell = DIRS.some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.T < c.T; });
}

// the faces of cell c at row y that look out: no neighbour, or a neighbour whose roof is below y
const exposed = (c, y) => DIRS.map((d, i) => ({ d, i, n: at(c.x + d[0], c.z + d[1]) }))
  .filter(({ n }) => !n || n.T <= y).map(({ d, i }) => ({ d, i }));

for (const c of map.values()) {
  const { x, z, g: ground, T } = c;
  for (let y = 0; y < T; y++) {
    if (y < ground) { set(x, y, z, "stone_bricks"); continue; }
    if (y === T - 1) { set(x, y, z, c.shell ? "stone_brick_slab" : "deepslate_tiles", c.shell ? { type: "bottom", waterlogged: "false" } : null); continue; }
    if (!c.shell) {
      if (y === ground || FL.includes(y)) set(x, y, z, "smooth_stone");
      continue;
    }
    const ex = exposed(c, y);
    if (ex.length >= 2) { set(x, y, z, "stone_bricks"); continue; }          // quoins
    if (y === ground) { set(x, y, z, "stone_bricks"); continue; }            // base course
    const face = ex[0];
    const u = face ? (face.d[0] !== 0 ? z : x) : 0;                         // position along the exposed face
    if (y < 5) {                                                             // ground floor: shopfront
      if (y === 4) { set(x, y, z, "dark_oak_planks"); continue; }          // fascia
      if (!face) { set(x, y, z, "calcite"); continue; }
      const isEntrance = x === ENTRANCE.x && z === ENTRANCE.z && face.i === ENTRANCE.dir;
      if (isEntrance && (y === ground + 1 || y === ground + 2)) {
        const half = y === ground + 1 ? "lower" : "upper";
        set(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (u % 3 === 0) { set(x, y, z, "stone_bricks"); continue; }            // pier between shop bays
      set(x, y, z, "light_blue_stained_glass_pane");
      continue;
    }
    // upper storeys: a string course at each floor line, two rows of window, a lintel row
    const sb = Math.max(...FL.filter((f) => f <= y));
    const rel = y - sb;
    if (rel === 0) { set(x, y, z, "smooth_stone"); continue; }
    if (rel === 3 || !face) { set(x, y, z, "calcite"); continue; }
    if (u % 4 === 1 || u % 4 === 2) {
      set(x, y, z, "gray_stained_glass_pane");
      // a warm light behind some panes: the room cell inside the window
      if ((u + y) % 3 === 0) {
        const [dx, dz] = face.d, ix = x - dx, iz = z - dz, inner = at(ix, iz);
        if (inner && !inner.shell && y < inner.T - 1) set(ix, y, iz, "glowstone");
      }
    } else {
      set(x, y, z, "calcite");
    }
  }
}

// roof equipment: flue stacks on the top tier's interior cells
const flues = [[7, 6], [12, 8], [9, 12], [14, 4]];
for (const [x, z] of flues) {
  const c = at(x, z);
  if (!c || c.shell || c.T !== 29) continue;
  set(x, 29, z, "bricks"); set(x, 30, z, "bricks");
  set(x, 31, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/FR241938056.nbt`);
console.log("FR241938056:", g.count(), "blocks");
