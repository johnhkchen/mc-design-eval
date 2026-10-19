// Federal Office Building 10A, 800 Independence Ave SW: a 1960s-70s federal modernist office block in pale limestone
// (calcite) with a granite base, glass bays on a two-block storey rhythm, and a tower on a lower mid-block and podium.
// Massing comes from the lidar roof per cell, median-smoothed over 3x3 and snapped to three tiers (17 podium, 20 mid,
// 22 tower). Roof 1 cells are the north and south entrance forecourts: a paved slab with a canopy over the doors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86806.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const TIER = (v) => (v <= 18 ? 17 : v <= 21 ? 20 : 22);

// Building cells (roof > 1): tier roof from the 3x3 median of the lidar, and the cell's ground.
const bld = new Map();
for (const [x, z, g, r] of cells) {
  if (r <= 1) continue;
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = raw.get(key(x + dx, z + dz)); if (c && c.r > 1) vals.push(c.r);
  }
  vals.sort((a, b) => a - b);
  bld.set(key(x, z), { g, R: TIER(vals[Math.floor(vals.length / 2)]) });
}

// Roof height of a footprint cell: building tier, or 1 for an entrance forecourt cell.
const heightOf = (x, z) => {
  const b = bld.get(key(x, z)); if (b) return b.R;
  const c = raw.get(key(x, z)); return c ? 1 : null;
};
// Which sides of (x, z) face open air at height y: off the footprint, or a neighbour whose top is at or below y.
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const outDirs = (x, z, y) => DIRS.filter(([dx, dz]) => { const h = heightOf(x + dx, z + dz); return h === null || h <= y; });

const g = new Voxels([55, 34, 39]);
const WALL = "calcite", BASE = "polished_granite", FLOOR = "smooth_stone", GLASS = "light_blue_stained_glass", PIER = "polished_diorite";
const ROOF = "light_gray_concrete";

// 1) Building columns: foundation, base course, storey bands (spandrel / floor slab at odd rows, glass at even rows), cap.
for (const [k, { g: gr, R }] of bld) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < R; y++) {
    const outs = outDirs(x, z, y);
    const ext = outs.length > 0;
    const top = R - 1;
    if (y === 0) { g.set(x, y, z, BASE); continue; }
    if (y === top) { g.set(x, y, z, ext ? FLOOR : ROOF); continue; }
    if (y % 2 === 1) { g.set(x, y, z, ext ? (y === 1 ? BASE : WALL) : FLOOR); continue; }
    if (!ext) continue;                                            // interior air behind the glass
    const outZ = outs.some(([, dz]) => dz !== 0), outX = outs.some(([dx]) => dx !== 0);
    const pier = (outZ && x % 3 === 0) || (outX && z % 3 === 0) || (outZ && outX);
    g.set(x, y, z, pier ? PIER : GLASS);
  }
}

// 2) Entrance forecourts (roof 1): paved foundation row where the ground is above y0.
for (const [x, z, gr, r] of cells) {
  if (r === 1 && gr >= 1) g.set(x, 0, z, FLOOR);
}

// 3) Doors on the north (z=5) and south (z=32) faces, two leaves each, under a canopy with lanterns.
const door = (x, z, facing, hinge) => {
  g.set(x, 1, z, "iron_door", { facing, half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, 2, z, "iron_door", { facing, half: "upper", hinge, open: "false", powered: "false" });
};
door(26, 5, "south", "left"); door(27, 5, "south", "right");
door(26, 32, "north", "left"); door(27, 32, "north", "right");

// Canopies on four granite posts, the slab at row 4, lanterns hanging under it.
const canopy = (z0, z1, zPost) => {
  for (let x = 25; x <= 29; x++) for (let z = z0; z <= z1; z++) g.set(x, 4, z, FLOOR);
  for (const x of [25, 29]) for (let y = 1; y <= 3; y++) g.set(x, y, zPost, BASE);
};
canopy(0, 4, 0);
canopy(33, 37, 37);                                                // south canopy: posts on the outer edge
g.set(26, 3, 2, "lantern", { hanging: "true" }); g.set(28, 3, 2, "lantern", { hanging: "true" });
g.set(26, 3, 35, "lantern", { hanging: "true" }); g.set(28, 3, 35, "lantern", { hanging: "true" });

// 4) Warm light: glowstone and shroomlight in the room behind some windows.
for (const [k, { R }] of bld) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 4; y < R - 1; y += 2) {
    if (outDirs(x, z, y).length === 0) continue;
    if (x >= 25 && x <= 29 && (z <= 6 || z >= 31)) continue;      // keep the lobby dark behind the doors
    const inward = DIRS.map(([dx, dz]) => [x + dx, z + dz]).find(([ix, iz]) => heightOf(ix, iz) !== null && outDirs(ix, iz, y).length === 0);
    if (!inward) continue;
    const n = x * 7 + y * 3 + z * 5;
    if (n % 11 === 0) g.set(inward[0], y, inward[1], "glowstone");
    else if (n % 17 === 0) g.set(inward[0], y, inward[1], "shroomlight");
  }
}

// 5) Roof plant: mechanical boxes on the podium and the tower, and a penthouse on the tower's north-east corner.
for (const [k, { R }] of bld) {
  const [x, z] = k.split(",").map(Number);
  if (outDirs(x, z, R - 1).length > 0) continue;                  // interior roof only
  if (R === 17 && x % 9 === 4 && z % 7 === 3) { g.set(x, R, z, ROOF); g.set(x, R + 1, z, ROOF); }
  if (R === 22 && x >= 42 && x <= 44 && z >= 22 && z <= 25) { g.set(x, R, z, WALL); g.set(x, R + 1, z, FLOOR); }
}

const stats = g.save(`${DIR}/DC86806.nbt`);
console.log("saved", stats);
