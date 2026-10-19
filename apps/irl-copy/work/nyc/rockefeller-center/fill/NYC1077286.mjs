// 1230 Avenue of the Americas, 1939: a Streamline Moderne / Art Deco office tower on a granite base. A 39-storey core
// (lidar 117) rises from a 35-storey pair of flanking setbacks (105) on an 11-storey south podium (33) and an 8-storey
// east wing (24). Pale limestone piers on a 4-block module, 2-high window bands between smooth belt courses, a
// granite shopfront and a recessed entrance on the avenue face (west, x = 0), a stepped copper crown on the core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1077286.cells.json`, "utf8"));   // [x, z, ground, roof] per cell

const X = 31, Z = 49, Y = 129;
const g = new Voxels([X, Y, Z]);
const at = (x, z) => z * X + x;
const ground = new Int8Array(X * Z).fill(-1), raw = new Int16Array(X * Z);
for (const [x, z, gr, r] of cells) { ground[at(x, z)] = gr; raw[at(x, z)] = r; }
const inF = (x, z) => x >= 0 && x < X && z >= 0 && z < Z && ground[at(x, z)] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Lidar roof per cell: a 3x3 median over footprint neighbours that read above ground (1 = no return), snapped to the
// 3-block storey so every tier is a whole number of storeys.
const top = new Int16Array(X * Z);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inF(x, z)) continue;
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz) && raw[at(x + dx, z + dz)] > 3) v.push(raw[at(x + dx, z + dz)]);
  v.sort((a, b) => a - b);
  const m = v.length ? v[v.length >> 1] : 3;
  top[at(x, z)] = Math.max(3, Math.round(m / 3) * 3);
}
const T = (x, z) => (inF(x, z) ? top[at(x, z)] : 0);

// Which sides of (x, z) at height y face outside the building (no footprint cell, or a neighbour that stops below y).
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz) || T(x + dx, z + dz) <= y);
const interior = (x, z, y) => inF(x, z) && y >= ground[at(x, z)] && y < T(x, z) - 1 && exposed(x, z, y).length === 0;

// Piers on a 4-block module along every face; the avenue entrance is centred on z = 22.
const ENTRY = [0, 22];
const isEntryBay = (x, z) => x === 0 && z >= 20 && z <= 24;

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inF(x, z)) continue;
  const gr = ground[at(x, z)], t = top[at(x, z)];
  for (let y = 0; y < t; y++) {
    const ex = exposed(x, z, y), k = Math.floor(y / 3), r = y % 3;
    if (y < gr) { g.set(x, y, z, ex.length ? "polished_granite" : "stone_bricks"); continue; }          // foundation
    if (ex.length === 0) {                                                                           // interior: floors and roof deck only
      if (y === t - 1) g.set(x, y, z, "smooth_stone");
      else if (r === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === t - 1) { g.set(x, y, z, "smooth_quartz"); continue; }                                   // parapet
    if (y === t - 2) { g.set(x, y, z, "calcite"); continue; }                                        // cornice
    if (r === 0) { g.set(x, y, z, "smooth_quartz"); continue; }                                      // belt course
    const corner = ex.some(([dx]) => dx) && ex.some(([, dz]) => dz);
    if (corner) { g.set(x, y, z, "smooth_quartz"); continue; }                                       // quoins
    const [dx, dz] = ex[0], u = dx ? z : x, pier = u % 4 === 0;
    // Avenue entrance: granite jambs, a centre door, a lintel over the bay.
    if (isEntryBay(x, z) && dx === -1) {
      if (k === 0 && r === 1 && z === ENTRY[1]) { g.set(x, y, z, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (k === 0 && r === 2 && z === ENTRY[1]) { g.set(x, y, z, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (k === 0) { g.set(x, y, z, "polished_granite"); continue; }
      if (k === 1 && r === 1) { g.set(x, y, z, "smooth_quartz"); continue; }                         // canopy lintel
    }
    if (k === 0 && r === 1) { g.set(x, y, z, "polished_granite"); continue; }                        // shopfront bulkhead
    if (pier) { g.set(x, y, z, "calcite"); continue; }
    // A window: the opening is air in this cell and the glass sits one block in, with an air gap behind it.
    const xi = x - dx, zi = z - dz;
    if (interior(xi, zi, y)) {
      g.set(xi, y, zi, "light_blue_stained_glass");
      const xl = x - 2 * dx, zl = z - 2 * dz;
      if (r === 1 && interior(xl, zl, y) && (x * 3 + z * 5 + k * 7) % 5 === 0) g.set(xl, y, zl, "glowstone");
    } else {
      g.set(x, y, z, "light_blue_stained_glass");                                                    // no room behind: flush glass
    }
  }
}

// Roof: a stepped copper crown on the core and a plant house on the south podium.
const box = (x0, x1, z0, z1, y0, y1, block) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) g.set(x, y, z, block);
};
box(9, 14, 16, 29, 117, 119, "oxidized_cut_copper");
box(10, 13, 19, 26, 120, 122, "copper_block");
box(11, 12, 21, 24, 123, 125, "oxidized_cut_copper");
g.set(11, 126, 22, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
box(5, 6, 46, 47, 33, 34, "calcite");
box(5, 6, 46, 47, 35, 35, "smooth_quartz");

const { blocks, palette } = g.save(`${DIR}/NYC1077286.nbt`);
const rows = Array.from({ length: Z }, (_, z) => Array.from({ length: X }, (_, x) => (inF(x, z) ? String(Math.round(top[at(x, z)] / 3) % 10) : ".")).join(""));
console.log(`saved NYC1077286.nbt: ${blocks} blocks, ${palette} palette entries`);
console.log(`storeys (top/3 mod 10) by cell:\n${rows.join("\n")}`);
