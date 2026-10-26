// 1250 9th St NW: a red-brick Logan Circle apartment block (c. 1910s) with a calcite string course every 3 blocks,
// a stone plinth, and a 5-storey NW corner tower on a stepped massing. Storey lines sit on absolute heights so the
// tiers line up across the footprint.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70042.cells.json", "utf8"));
const DIR = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const key = (x, z) => `${x},${z}`;
const FOOT = new Map();
for (const [x, z, g, r] of cells) FOOT.set(key(x, z), { g, r });
const inFoot = (x, z) => FOOT.has(key(x, z));
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };

// 1. Lidar roof noise -> flat tiers: 3x3 median over footprint cells, then 4 tiers (tower 17, mid 8, main 6, low wing 5).
const T = new Map();
for (const [k] of FOOT) {
  const [x, z] = k.split(",").map(Number); const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) v.push(FOOT.get(key(x + dx, z + dz)).r);
  const s = median(v);
  T.set(k, s >= 12 ? 17 : s >= 7.5 ? 8 : s >= 5.5 ? 6 : 5);
}

// 2. Penthouse: the tower's interior cells (all four neighbours on the 17 tier) carry one more storey to y 20.
const PH = new Set();
for (const [k] of FOOT) {
  if (T.get(k) !== 17) continue;
  const [x, z] = k.split(",").map(Number);
  if (Object.values(DIR).every(([dx, dz]) => T.get(key(x + dx, z + dz)) === 17)) PH.add(k);
}

const topOf = (x, z) => (PH.has(key(x, z)) ? 20 : T.get(key(x, z)));
const segTop = (x, z, y) => (PH.has(key(x, z)) && y >= 17 ? 20 : T.get(key(x, z)));
const occ = (x, z, y) => inFoot(x, z) && y >= 0 && y < topOf(x, z);
const exposures = (x, z, y) => Object.keys(DIR).filter((d) => !occ(x + DIR[d][0], z + DIR[d][1], y));

// 3. What a voxel is: plinth, storey bands every 3 blocks, cornice and coping, flat roof deck, brick walls with
//    window bays (brick pier | two glass panes), air behind the glass.
function cellAt(x, z, y) {
  if (!occ(x, z, y)) return null;
  if (y === 0) return { b: "stone_bricks" };                                 // plinth: base course and foundation
  const t = segTop(x, z, y), ex = exposures(x, z, y), shell = ex.length > 0;
  if (y === t - 1) return { b: shell ? "stone_bricks" : "stone" };          // coping on the edge, roof deck inside
  if (y === t - 2 || y % 3 === 0) return { b: shell ? "calcite" : "smooth_stone" };   // cornice and storey lines (floor slabs inside)
  if (!shell) return null;                                                   // air behind the glass: no interiors
  if (ex.length > 1) return { b: "bricks" };                                 // corner piers
  const face = ex[0], p = DIR[face][1] !== 0 ? x : z, m = ((p % 3) + 3) % 3;
  if (m === 0) return { b: "bricks" };
  return { glass: face };
}

const g = new Voxels([17, 29, 18]);
const panes = [];
for (const [k] of FOOT) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < topOf(x, z); y++) {
    const c = cellAt(x, z, y);
    if (!c) continue;
    if (c.glass) {
      const along = DIR[c.glass][1] !== 0 ? "east" : "north";   // a pane on a north/south face joins east-west
      const other = along === "east" ? "west" : "south";
      const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
      st[along] = "true"; st[other] = "true";
      g.set(x, y, z, "glass_pane", st); panes.push({ x, y, z, face: c.glass });
    } else g.set(x, y, z, c.b);
  }
}

// 4. The entrance: a dark oak door on the east face of the main block (x 16, z 4), with calcite pilasters.
const door = { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" };
g.set(16, 1, 4, "dark_oak_door", door);
g.set(16, 2, 4, "dark_oak_door", { ...door, half: "upper" });
for (const z of [3, 5]) for (const y of [1, 2]) g.set(16, y, z, "calcite");
g.set(15, 1, 4, "lantern", { hanging: "false", waterlogged: "false" });  // lit hall behind the door

// 5. Warm light in some bays: a lantern or shroomlight in the air behind a pane on a row that stands on a storey line.
let lights = 0;
for (const { x, y, z, face } of panes) {
  if (y % 3 !== 1 || (x * 7 + z * 3 + y) % 2 !== 0) continue;
  const ix = x - DIR[face][0], iz = z - DIR[face][1];
  if (!inFoot(ix, iz) || cellAt(ix, iz, y) || g.get(ix, y, iz)) continue;
  if ((x + z) % 2 === 0) g.set(ix, y, iz, "shroomlight");
  else g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  lights++;
}

// 6. Chimneys on the interior of the main roof, and a penthouse window line already comes from the walls.
let chimneys = 0;
for (const [k] of FOOT) {
  const [x, z] = k.split(",").map(Number);
  if (T.get(k) !== 6 || PH.has(k) || (x * 3 + z * 5) % 9 !== 0) continue;
  if (!Object.values(DIR).every(([dx, dz]) => T.get(key(x + dx, z + dz)) === 6)) continue;
  g.set(x, 6, z, "bricks"); g.set(x, 7, z, "bricks"); g.set(x, 8, z, "calcite");
  chimneys++;
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70042.nbt");
console.log(JSON.stringify({ ...info, tiers: { 17: [...T.values()].filter((v) => v === 17).length, 8: [...T.values()].filter((v) => v === 8).length, 6: [...T.values()].filter((v) => v === 6).length, 5: [...T.values()].filter((v) => v === 5).length }, penthouse: PH.size, panes: panes.length, lights, chimneys }));
