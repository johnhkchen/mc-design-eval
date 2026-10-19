// DC77957: Hotel-Large on Pennsylvania Ave NW, DC 20004, as a 1.21.1 module.
// Read as a turn-of-the-century Beaux-Arts hotel: a stone base course, brick walls with stone storey bands, a
// stone cornice and parapet, and on the tallest cells a slate mansard ring. The lidar roof is median-smoothed over
// the footprint and snapped to four tiers of 4-block storeys (2, 4, 8, 12, 16 above y 0). Every column is solid from
// y 0 up to its own top, so each tier stands on what is below it and nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC77957.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC77957.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [["east", 1, 0], ["west", -1, 0], ["south", 0, 1], ["north", 0, -1]];

// Smoothed roof: median of the footprint cells in the 3x3 around each cell (lidar noise and single-cell spikes drop out).
const smooth = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), vals[vals.length >> 1]);
}
// Tiers (absolute tops above y 0): 2 = podium course, 4 = one storey, 8 = two, 12 = three, 16 = four storeys.
const tier = (h) => (h <= 2 ? 2 : h <= 4 ? 4 : h <= 7 ? 8 : h <= 11 ? 12 : 16);

// Palette
const BASE = "stone_bricks";        // plinth, storey bands, window heads and sills, cornice
const BRICK = "bricks";             // the walls and piers
const GLASS = "glass_pane";
const FLOOR = "smooth_stone";       // floor slabs and roof membranes behind the glass
const PARAPET = "stone_brick_wall";
const SLATE = "deepslate_tile_stairs";  // the mansard ring on the tallest tops
const DOOR = "dark_oak_door";
const LAMP = "glowstone";
const AC = "iron_block";

const g = new Voxels([27, 28, 29]);

// The outward directions of a shell cell (the sides with no footprint cell beyond them).
const outside = (x, z) => DIRS.filter(([, dx, dz]) => !inF(x + dx, z + dz));
const shell = (x, z) => outside(x, z).length > 0;

// Entrance: on the north (street) face of the tall part, the middle of three cells spread along it.
const frontCells = [];
for (const c of F.values()) {
  if (!inF(c.x, c.z - 1) && smooth.get(key(c.x, c.z)) >= 8) frontCells.push(c);
}
frontCells.sort((a, b) => a.x - b.x);
const doors = frontCells.length ? [frontCells[Math.floor(frontCells.length / 2)]] : [];
const doorKey = new Set(doors.map((c) => key(c.x, c.z)));

// Piers and bays: on a wall the cell's along-wall index sets the rhythm (two glass bays, one brick pier).
const along = (x, z, side) => (side === "north" || side === "south" ? x : z);
const isPier = (x, z, side) => along(x, z, side) % 3 === 2;
// A one-cell stub (at most one footprint neighbour) is solid brick, so it reads as a pier, not as stone rings with glass gaps.
const thin = (x, z) => DIRS.filter(([, dx, dz]) => inF(x + dx, z + dz)).length <= 1;

for (const c of F.values()) {
  const T = tier(smooth.get(key(c.x, c.z)));
  const sides = outside(c.x, c.z);
  const b = sides.length > 0;
  const side = b ? sides[0][0] : null;
  for (let y = 0; y < T; y++) {
    if (y < c.g) { g.set(c.x, y, c.z, BASE); continue; }          // foundation under the cell's ground
    if (y === T - 1) { g.set(c.x, y, c.z, b ? BASE : FLOOR); continue; } // cornice / roof membrane
    if (!b) {
      // Interior: floor slab at each storey line; the rest is air behind the glass.
      if (y % 4 === 0) g.set(c.x, y, c.z, FLOOR);
      continue;
    }
    const r = y % 4;
    if (y === 0 || r === 0 || r === 3) { g.set(c.x, y, c.z, BASE); continue; }  // plinth, string course, lintel course
    // r = 1 or 2: the window band (glass in bays, brick piers, a lit pane now and then).
    if (isPier(c.x, c.z, side) || thin(c.x, c.z)) { g.set(c.x, y, c.z, BRICK); continue; }
    const k = Math.floor(y / 4);
    const lit = k >= 1 && r === 1 && (c.x * 7 + c.z * 13 + k) % 7 === 0;
    g.set(c.x, y, c.z, lit ? LAMP : GLASS);
  }
  // Entrance: the door and its flanking piers on the ground floor.
  if (doorKey.has(key(c.x, c.z))) {
    g.set(c.x, 1, c.z, DOOR, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(c.x, 2, c.z, DOOR, { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    continue;
  }
  if (b && T >= 8 && T < 16) g.set(c.x, T, c.z, PARAPET);          // parapet on the roof edge of the taller tiers
  if (b && T === 16) g.set(c.x, T, c.z, SLATE, { facing: sides[0][0], half: "bottom", shape: "straight", waterlogged: "false" }); // mansard ring
  if (!b && T >= 12 && c.x % 6 === 3 && c.z % 6 === 3) g.set(c.x, T, c.z, AC); // roof units on the tall tops
}

g.save(OUT);
console.log("wrote", OUT, g.count(), "blocks");
