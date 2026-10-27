// Auckland Harbour Suites (way 154089911): a 1990s glass-and-precast tower on the lidar's massing.
// The lidar roof is smoothed (3x3 median over the footprint) and snapped to three tiers: a 20-block podium wing,
// the 152-block tower, and its 156-block east core. Every column is solid from y 0 up to its tier, so nothing floats;
// the inside is air with a floor slab per 4-block storey and a roof slab on top.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const NAME = "way_154089911";
const X = 28, Y = 169, Z = 41;
const STOREY = 4;
const TIERS = [20, 152, 156];                       // podium wing, tower, taller core

const cells = JSON.parse(readFileSync(`${DIR}/${NAME}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const roof = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];

// tier of each footprint cell: the nearest of TIERS to its smoothed lidar roof
const top = new Map();
for (const [x, z] of cells) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const r = roof.get(key(x + dx, z + dz)); if (r != null) near.push(r);
  }
  const s = median(near);
  top.set(key(x, z), TIERS.reduce((a, b) => (Math.abs(b - s) < Math.abs(a - s) ? b : a)));
}

const T = (x, z) => top.get(key(x, z)) ?? 0;
const solid = (x, y, z) => y >= 0 && y < T(x, z);
const NORMALS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the horizontal directions in which the cell at (x, y, z) has air beside it: its outward faces
const exposed = (x, y, z) => NORMALS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));

// the entrance: a pair of cells on the south face (z + 1 open), nearest the face's middle, with a bay of 4 either side
const southFace = cells.filter(([x, z]) => { const e = exposed(x, 1, z); return e.length === 1 && e[0][1] === 1; });
const meanX = southFace.reduce((s, [x]) => s + x, 0) / southFace.length;
const pairs = southFace.filter(([x, z]) => southFace.some(([x2, z2]) => x2 === x + 1 && z2 === z));
pairs.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
const [DX, DZ] = pairs[0] ?? [0, 0];
const doors = new Set([key(DX, DZ), key(DX + 1, DZ)]);
const bay = new Set([DX - 1, DX, DX + 1, DX + 2].map((x) => key(x, DZ)));

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const glazing = (x, z, s) => ((x * 31 + z * 17 + s * 7) % 5 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");

// one exterior cell of the shell: base course, corner piers, storey lines, glazing with mullions, entrance
function facade(x, y, z, out, t) {
  const s = Math.floor(y / STOREY), r = y % STOREY;
  const [nx, nz] = out[0];
  if (y === 0) return put(x, y, z, "stone_bricks");                       // base course on the ground
  if (out.length > 1) return put(x, y, z, "white_concrete");              // corner piers, full height
  if (bay.has(key(x, z)) && y <= 3) {                                     // entrance bay: doors, glass, a canopy band
    if (y === 3) return put(x, y, z, "smooth_quartz");
    if (doors.has(key(x, z))) return put(x, y, z, "iron_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    return put(x, y, z, "light_blue_stained_glass");
  }
  if (r === 0) return put(x, y, z, t === 20 ? "smooth_stone" : "light_gray_concrete");   // storey line
  const along = nx !== 0 ? z : x;
  if (along % 3 === 0) return put(x, y, z, "white_concrete");              // mullion
  put(x, y, z, glazing(x, z, s));
  // a warm light in some windows: one air block behind the glass, a lantern standing on the floor slab
  if (r === 2 && (x * 13 + z * 7 + s * 5) % 11 === 0) {
    const ix = x - 2 * nx, iz = z - 2 * nz, ly = s * STOREY + 1;
    if (solid(ix, ly, iz) && !exposed(ix, ly, iz).length && ly + 1 < T(ix, iz) - 1) put(ix, ly, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

const cellList = cells.map(([x, z]) => [x, z]);
for (const [x, z] of cellList) {
  const t = T(x, z);
  const edge = exposed(x, t - 1, z).length > 0;                           // on the roofline's edge (or beside a lower tier)
  for (let y = 0; y < t; y++) {
    if (y === t - 1) { put(x, y, z, edge ? "smooth_quartz" : "light_gray_concrete"); continue; }   // roof, cornice-lit at the edge
    const out = exposed(x, y, z);
    if (!out.length) { if (y % STOREY === 0) put(x, y, z, "light_gray_concrete"); continue; }     // interior: floor slab per storey, air between
    facade(x, y, z, out, t);
  }
  if (edge) { put(x, t, z, "white_concrete"); put(x, t + 1, z, "white_concrete"); }             // parapet on the roofline
}

// roof plant: a solid 6 x 6 x 4 box with louvres on each face, on the taller core, nearest its middle
const core = cellList.filter(([x, z]) => T(x, z) === 156);
const cx = core.reduce((s, [x]) => s + x, 0) / core.length, cz = core.reduce((s, [, z]) => s + z, 0) / core.length;
const boxes = [];
for (let x0 = 0; x0 + 5 < X; x0++) for (let z0 = 0; z0 + 5 < Z; z0++) {
  // every box cell and its four neighbours sit on the core, so the box is clear of the roofline's parapet
  let ok = true;
  for (let dz = -1; dz <= 6; dz++) for (let dx = -1; dx <= 6; dx++) if (T(x0 + dx, z0 + dz) !== 156) ok = false;
  if (ok) boxes.push([Math.hypot(x0 + 2.5 - cx, z0 + 2.5 - cz), x0, z0]);
}
boxes.sort((a, b) => a[0] - b[0]);
if (boxes.length) {
  const [, x0, z0] = boxes[0];
  for (let y = 156; y <= 159; y++) for (let dz = 0; dz <= 5; dz++) for (let dx = 0; dx <= 5; dx++) put(x0 + dx, y, z0 + dz, "light_gray_concrete");
  for (const [lx, lz] of [[x0 + 2, z0], [x0 + 3, z0], [x0 + 2, z0 + 5], [x0 + 3, z0 + 5], [x0, z0 + 2], [x0, z0 + 3], [x0 + 5, z0 + 2], [x0 + 5, z0 + 3]]) put(lx, 157, lz, "iron_bars");
}

const out = g.save(`${DIR}/${NAME}.nbt`);
console.log(`${NAME}.nbt: ${out.blocks} blocks, ${out.palette} palette entries; tiers`,
  Object.fromEntries(TIERS.map((t) => [t, cells.filter(([x, z]) => T(x, z) === t).length])), "entrance", DX, DZ, "plant", boxes[0]?.slice(1) ?? "none");
