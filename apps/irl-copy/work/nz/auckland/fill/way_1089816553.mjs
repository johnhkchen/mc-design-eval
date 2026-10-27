// Auckland CBD edge, seen from Maungawhau: way 1089816553, a 1980s concrete-frame office block. A 10-storey tower on the
// north half, an 8-storey wing to the south, a 3-storey podium on the west edge. Basalt base (Auckland's volcanic stone),
// white concrete piers, tinted glass between them, a lintel and cornice per tier, glowstone behind some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1089816553.cells.json`, "utf8"));

const SIZE = [45, 54, 69];
const k = (x, z) => `${x},${z}`;
const xyz = (key) => key.split(",").map(Number);
const foot = new Map(cells.map(([x, z, g, r]) => [k(x, z), { g, r }]));
const inside = (x, z) => foot.has(k(x, z));

// Storey tiers from the lidar roof: a 3x3 median over the footprint irons out the noise at the edges, then each cell
// snaps to 1 + 4n (n storeys of 4 blocks), so 41 is ten storeys, 33 is eight, and the rim stays a 1-block plinth.
const top = new Map();
for (const [key] of foot) {
  const [x, z] = xyz(key);
  const rs = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = foot.get(k(x + dx, z + dz)); if (c) rs.push(c.r); }
  rs.sort((a, b) => a - b);
  const med = rs[rs.length >> 1];
  top.set(key, 1 + 4 * Math.max(0, Math.round((med - 1) / 4)));
}
const T = (x, z) => top.get(k(x, z)) ?? 0;

const DIRS = [[1, 0, "E"], [-1, 0, "W"], [0, 1, "S"], [0, -1, "N"]];
// the faces of a cell at height y that show to the air: outside the footprint, or a neighbour that stops below y
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || T(x + dx, z + dz) <= y).map(([, , f]) => f);
const nearShell = (x, z, y) => DIRS.some(([dx, dz]) => inside(x + dx, z + dz) && T(x + dx, z + dz) > y && exposed(x + dx, z + dz, y).length > 0);

// the entrance: the middle of the wing's west face (roof 33), ground floor
const westWing = [...top].filter(([key, t]) => t === 33 && exposed(...xyz(key), 2).join() === "W").map(([key]) => xyz(key)).sort((a, b) => a[1] - b[1]);
const [ex, ez] = westWing[Math.floor(westWing.length / 2)];

const plan = new Map(); // "x,y,z" -> [block, state]
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, [block, state]);
const lit = (x, y, z) => (x * 31 + y * 7 + z * 13) % 7 === 0;   // about one window in seven
const GLASS = "light_blue_stained_glass_pane";                       // tinted glazing, light enough to read against the piers

for (const [key] of foot) {
  const [x, z] = xyz(key), t = T(x, z);
  for (let y = 0; y < t; y++) {
    if (y === 0) { put(x, y, z, "polished_deepslate"); continue; }        // foundation on the lowest ground
    if (y === t - 1) { put(x, y, z, "smooth_stone"); continue; }         // cornice / roof
    const ex_ = exposed(x, z, y), shell = ex_.length > 0;
    if ((y - 1) % 4 === 0) {                                              // storey slab (basalt base course at grade)
      put(x, y, z, y === 1 && shell ? "polished_deepslate" : "light_gray_concrete");
      continue;
    }
    if (shell) {
      const ew = ex_.includes("E") || ex_.includes("W"), ns = ex_.includes("N") || ex_.includes("S");
      const pier = (ew && ns) || (ew ? z : x) % 3 === 0;                 // corners and every third bay: concrete mullion
      put(x, y, z, pier ? "white_concrete" : GLASS, pier ? undefined : { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
    } else if (y >= 2 && nearShell(x, z, y) && lit(x, y, z)) {
      put(x, y, z, "glowstone");                                           // a lamp on the floor behind a window
    }
  }
}

// entrance: a glazed bay with the door in the middle, a lintel over it, and a lit lobby behind
const door = (half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });
put(ex, 2, ez, "dark_oak_door", door("lower"));
put(ex, 3, ez, "dark_oak_door", door("upper"));
for (const dz of [-1, 0, 1]) put(ex, 4, ez + dz, "polished_deepslate");
put(ex + 1, 2, ez, "glowstone");

// roof plant on the tower
for (let x = 27; x <= 32; x++) for (let z = 9; z <= 12; z++) if (T(x, z) === 41) { put(x, 41, z, "light_gray_concrete"); put(x, 42, z, "light_gray_concrete"); }

// glass panes join their neighbours (panes and solid blocks), as the game draws them
const SOLID = new Set(["white_concrete", "light_gray_concrete", "smooth_stone", "polished_deepslate"]);
const joins = (x, y, z, dx, dz) => { const n = plan.get(`${x + dx},${y},${z + dz}`); return !!n && (n[0] === GLASS || SOLID.has(n[0])); };
for (const [key, [block, state]] of plan) {
  if (block !== GLASS) continue;
  const [x, y, z] = xyz(key);
  state.east = String(joins(x, y, z, 1, 0)); state.west = String(joins(x, y, z, -1, 0));
  state.south = String(joins(x, y, z, 0, 1)); state.north = String(joins(x, y, z, 0, -1));
}

const g = new Voxels(SIZE);
for (const [key, [block, state]] of plan) { const [x, y, z] = xyz(key); g.set(x, y, z, block, state); }
const out = g.save(`${DIR}/way_1089816553.nbt`);
console.log(`way_1089816553: ${out.blocks} blocks, palette ${out.palette}; entrance west face at (${ex}, ${ez}); tiers ${[...new Set(top.values())].sort((a, b) => a - b).join(" ")}`);
