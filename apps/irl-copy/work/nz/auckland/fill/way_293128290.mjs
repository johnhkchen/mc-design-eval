// way 293128290, Mt Eden village corner: a 1930s two-storey brick commercial block with plaster piers and courses,
// a shopfront band at street level, and a taller corner block where the lidar roof runs to about 11 blocks.
// Massing: the lidar roof is median-smoothed over 3x3 and snapped to three flat tiers (top at y 5, 9, 11).
// Every column is solid at its base course, each floor line and its roof, so each tier stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293128290.cells.json", "utf8"));
const g = new Voxels([44, 23, 44]);

const cellAt = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const medianRoof = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = cellAt.get(`${x + dx},${z + dz}`); if (c) v.push(c.roof); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierTop = (m) => (m >= 9 ? 11 : m >= 6 ? 9 : 5);

// top surface of each footprint cell (tier), -1 outside the footprint so a face there counts as open
const top = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) top.set(`${x},${z}`, tierTop(medianRoof(x, z)));
const topAt = (x, z) => top.get(`${x},${z}`) ?? -1;
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
// faces of a cell that look out at height y: a neighbour outside or with its roof at or below y
const openFaces = (x, z, y) => DIRS.filter(([dx, dz]) => topAt(x + dx, z + dz) <= y);

const BRICK = "bricks", PLASTER = "smooth_quartz", FLOOR = "smooth_stone", BASE = "stone_bricks", FOUND = "cobblestone";
const GLASS = "glass", LANTERN = "lantern";
const litRow = (y) => y % 4 === 1;

// 1. walls, floors, roofs and foundations, cell by cell
for (const [key, Hc] of top) {
  const [x, z] = key.split(",").map(Number), gc = cellAt.get(key).ground;
  for (let y = 0; y < gc; y++) g.set(x, y, z, FOUND);
  g.set(x, gc, z, BASE);                                              // base course on the ground
  for (let y = gc + 1; y < Hc; y++) {
    const open = openFaces(x, z, y);
    if (y === Hc - 1) { g.set(x, y, z, openFaces(x, z, y).length ? PLASTER : FLOOR); continue; }   // cornice or roof
    if (y % 4 === 0) { g.set(x, y, z, open.length ? PLASTER : FLOOR); continue; }                // storey line
    if (!open.length) continue;                                                                     // interior air
    const corner = open.some(([, dz]) => dz) && open.some(([dx]) => dx);
    const alongZ = open.some(([, dz]) => dz);                         // a north or south face: run along x
    const u = alongZ ? x : z;
    const storey0 = y < 4;
    // brick is the wall; a plaster pier every 4th cell; ground-floor shopfront glass runs wide, upper glass in 2-cell bays
    const glassRow = storey0 ? y % 4 >= 1 : y % 4 === 1 || y % 4 === 2;
    const bay = u % 4;
    if (corner || bay === 0) g.set(x, y, z, PLASTER);
    else if (glassRow && (storey0 || bay !== 3)) g.set(x, y, z, GLASS);
    else g.set(x, y, z, BRICK);
  }
}

// 2. parapets on the exposed roof edge, plant on the roofs
for (const [key, Hc] of top) {
  const [x, z] = key.split(",").map(Number);
  if (openFaces(x, z, Hc - 1).length) g.set(x, Hc, z, PLASTER, { type: "bottom" });
}

// 3. warm light: a lantern on the floor just behind some lower glass, in air
for (const [key, Hc] of top) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 1; y < Hc - 1; y++) {
    if (!litRow(y) || (x * 31 + z * 17 + y * 7) % 11 !== 0) continue;
    const open = openFaces(x, z, y);
    if (!open.length || open.length > 1) continue;
    const [dx, dz] = open[0];
    const ix = x - dx, iz = z - dz;
    if (!top.has(`${ix},${iz}`) || topAt(ix, iz) <= y || openFaces(ix, iz, y).length) continue;
    g.set(ix, y, iz, LANTERN, { hanging: "false" });
  }
}

// 4. entrance: a dark oak door in the north wall of the low block, with a canopy course over it
let door = null;
for (const [key, Hc] of top) {
  const [x, z] = key.split(",").map(Number);
  if (Hc !== 5 || topAt(x, z - 1) !== -1) continue;
  if (!door || Math.abs(x - 22) < Math.abs(door[0] - 22)) door = [x, z];
}
if (door) {
  const [dx, dz] = door, gc = cellAt.get(`${dx},${dz}`).ground, y0 = gc + 1;
  g.set(dx, y0, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, y0 + 1, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (let x = dx - 1; x <= dx + 1; x++) if (top.has(`${x},${dz}`)) g.set(x, y0 + 2, dz, PLASTER, { type: "bottom" });
}

// 5. roof equipment on the tall block, and one chimney on the middle block
for (const [key, Hc] of top) {
  const [x, z] = key.split(",").map(Number);
  if (Hc === 11 && !openFaces(x, z, 10).length && x % 8 === 4 && z % 8 === 4) g.set(x, Hc, z, "iron_block");
}
let chimney = null;
for (const [key, Hc] of top) {
  const [x, z] = key.split(",").map(Number);
  if (Hc !== 9 || openFaces(x, z, 8).length) continue;
  if (!chimney || Math.abs(x - 22) + Math.abs(z - 22) < Math.abs(chimney[0] - 22) + Math.abs(chimney[1] - 22)) chimney = [x, z];
}
if (chimney) {
  const [x, z] = chimney;
  for (let y = 9; y <= 11; y++) g.set(x, y, z, BRICK);
  g.set(x, 12, z, "stone_brick_slab", { type: "bottom" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293128290.nbt");
