// 787 Seventh Avenue, AXA Center: a 1985 Midtown office tower (Commercial & Office). Footprint 68 x 49, with the lidar
// roof about 207 blocks (230 m) above its lowest ground. A stepped corporate tower of the mid-1980s: pale granite and
// light stone spandrels, grey tinted glass in recessed bays with slim mullions, a dark canopy over the lobby. Storeys
// are 3 blocks. Seventh Avenue is the low-x face (x 0), so the lobby sits on that street front, in the middle of the
// tall core. Lidar roofs are median-smoothed over 5 x 5 and snapped to clean tiers, all multiples of 3:
//   6   podium and low court roof (lidar under 10)
//   36  east midrise wing (lidar 30-39)
//   42  north and east low wing (lidar 40-49)
//   54  east flank (lidar 50-59)
//   147 north setback (lidar 143-169)
//   195 shoulders north and south of the core (lidar 189-199)
//   207 the tower core (lidar 200-207), with a small mechanical enclosure and a lantern on top.
// Every column is solid from y 0 up to its top, so every setback and roof stands on the mass below it. The glass sits
// one block back from the face, with air behind it and a solid spandrel row as the floor slab of each storey (no
// interiors). Warm glowstone sits behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1023157.cells.json`, "utf8"));
const X = 68, Y = 219, Z = 49;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);

// Median of the footprint's lidar roofs within 2 cells: scattered low noise inside a roof reads as the roof around it.
const median = (x, z) => {
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inFoot(x + dx, z + dz)) v.push(cell.get(`${x + dx},${z + dz}`).roof);
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
const TIER = (m) => (m < 1 ? 0 : m < 10 ? 6 : m < 40 ? 36 : m < 50 ? 42 : m < 60 ? 54 : m < 100 ? 66 : m < 170 ? 147 : m < 200 ? 195 : 207);
const top = new Map([...cell.keys()].map((k) => { const [x, z] = k.split(",").map(Number); return [k, TIER(median(x, z))]; }));
const topAt = (x, z) => top.get(`${x},${z}`) ?? 0;   // 0 outside the footprint, and on open ground
const groundAt = (x, z) => cell.get(`${x},${z}`).ground;
const cols = [...cell.keys()].map((k) => k.split(",").map(Number));

const g = new Voxels([X, Y, Z]);
const M = { foundation: "polished_granite", core: "light_gray_concrete", roof: "gray_concrete", cornice: "smooth_quartz",
  spandrel: "calcite", mullion: "polished_andesite", glass: "gray_stained_glass_pane" };

// 1. Massing. Foundation from y 0 up to each cell's ground (granite, so it reads as the base course); the core to the tier
// top, with a roof covering on each top. Open ground (tier 0) gets paving.
for (const [x, z] of cols) {
  const ground = groundAt(x, z), t = topAt(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, M.foundation);
  if (!t) { g.set(x, ground, z, "smooth_stone"); continue; }
  for (let y = ground; y < t; y++) g.set(x, y, z, y === t - 1 ? M.roof : M.core);
}

// 2. Faces. Outward = N (low z, uptown), S, W (low x, Seventh Avenue), E. A cell is open at height y when it is outside the
// footprint, on open ground, or its tier is at or below y. Each storey is 3 blocks: a spandrel row at y % 3 == 0, glass
// bays between, a slim mullion every third column, a cornice on the top course, and a granite base at y 0.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows
const open = (x, y, z) => topAt(x, z) <= y;
const faceOf = (x, y, z) => {
  for (const d of ["N", "S", "W", "E"]) { const [dx, dz] = DIRS[d]; if (open(x + dx, y, z + dz)) return d; }
  return null;
};
const recesses = [];
for (const [x, z] of cols) {
  const t = topAt(x, z);
  if (!t) continue;
  for (let y = groundAt(x, z); y < t; y++) {
    const d = faceOf(x, y, z);
    if (!d) continue;
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;                       // position along the face
    const ix = x - dx, iz = z - dz;                   // one block in, behind the face
    if (y === t - 1) { g.set(x, y, z, M.cornice); continue; }
    if (y === 0) { g.set(x, y, z, M.foundation); continue; }
    if (y % 3 === 0) { g.set(x, y, z, t === 6 ? M.foundation : M.spandrel); continue; }
    if (u % 3 === 0) { g.set(x, y, z, M.mullion); continue; }
    g.set(x, y, z, M.glass, dx === 0 ? NS : EW);
    const deep = inFoot(ix, iz) && topAt(ix, iz) > y && !faceOf(ix, y, iz);
    if (deep) recesses.push([ix, y, iz, lit(u, y, "NSWE".indexOf(d) + 1)]);
  }
}
for (const [x, y, z, warm] of recesses) g.set(x, y, z, warm ? "glowstone" : "air");

// 3. Lobby on Seventh Avenue (x 0): a pair of iron doors at z 22-23 in a recess, with a vestibule behind them and a black
// canopy over the entrance. The canopy is carried by the solid spandrel row at y 3 and the wall behind it.
for (const z of [22, 23]) {
  const hinge = z === 22 ? "left" : "right";
  g.set(0, 1, z, "iron_door", { facing: "west", half: "lower", hinge, open: "false", powered: "false" });
  g.set(0, 2, z, "iron_door", { facing: "west", half: "upper", hinge, open: "false", powered: "false" });
  g.set(1, 1, z, "air");
  g.set(1, 2, z, "air");
}
for (let z = 21; z <= 24; z++) for (const x of [0, 1]) g.set(x, 4, z, "black_concrete");

// 4. Parapets: a half slab on the edge of each roof, standing on the cornice or roof covering below it.
for (const [x, z] of cols) {
  const t = topAt(x, z);
  if (!t) continue;
  const edge = [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => topAt(x + dx, z + dz) < t);
  if (edge) g.set(x, t, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// 5. Roof equipment on the 207 core: a mechanical enclosure, 4 blocks tall, with a capping half slab and a lantern.
for (let x = 12; x <= 22; x++) for (let z = 20; z <= 28; z++) {
  for (let y = 207; y <= 210; y++) g.set(x, y, z, M.core);
  g.set(x, 211, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}
g.set(17, 212, 24, "lantern", { hanging: "false", waterlogged: "false" });

const stats = g.save(`${DIR}/NYC1023157.nbt`);
const tops = cols.map(([x, z]) => topAt(x, z));
console.log(JSON.stringify({ cells: cols.length, tiers: [...new Set(tops)].sort((a, b) => a - b), maxTop: Math.max(...tops), ...stats }));
