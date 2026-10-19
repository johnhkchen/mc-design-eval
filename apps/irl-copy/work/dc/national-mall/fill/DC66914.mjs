// DC66914: vacant 3rd St SW, Southwest Washington DC 20024, as a 1.21.1 module. Read as a 1960s urban-renewal
// office block: red brick walls, precast white-concrete piers between ribbon windows, stone storey bands and a
// stone cornice, with a four-storey core stepping down to three-storey wings and a single-storey podium.
// Lidar roof heights are median-smoothed (3x3) and snapped to three tops: 3 (one storey), 10 (three storeys) and
// 13 (four storeys, with a parapet at 13). Walls are a one-cell shell on every cell that touches the outside of
// the footprint or stands beside a lower roof; interior cells are air with a floor slab at each storey line and a
// roof slab at the top. Glass sits in the shell with air behind it. Every column is solid from y 0 up to its top,
// so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC66914.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC66914.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Smoothed roof: median of the footprint cells in the 3x3 around each cell, then snapped to a storey count.
const smooth = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), vals[vals.length >> 1]);
}
const snap = (h) => (h <= 5 ? 3 : h <= 11 ? 10 : 13);
const top = (x, z) => (inF(x, z) ? snap(smooth.get(key(x, z))) : 0);
const T = (c) => top(c.x, c.z);

// Palette
const BRICK = "bricks";              // walls
const BAND = "stone_bricks";         // plinth, storey bands, cornice
const PIER = "white_concrete";       // precast piers between the windows
const GLASS = "glass_pane";
const FLOOR = "smooth_stone";        // interior floors and roof slabs
const PARAPET = "stone_brick_wall";
const BOARD = "spruce_planks";       // boarded ground-floor windows (vacant)
const DOOR = "dark_oak_door";
const LAMP = "lantern";
const LINTEL = "stone_brick_slab";
const PLANT = "light_gray_concrete"; // roof plant enclosure
const PLANT_TOP = "smooth_stone_slab";

// Outward-facing direction of a shell cell: an outside neighbour first, else a lower roof.
const facade = (c) => {
  const t = T(c);
  for (const [dx, dz] of DIRS) if (!inF(c.x + dx, c.z + dz)) return [dx, dz];
  for (const [dx, dz] of DIRS) if (top(c.x + dx, c.z + dz) < t) return [dx, dz];
  return null;
};
const shell = (c) => facade(c) !== null;

// Entrances on the north (z = 0) face, the middle of the three outer runs of the 10-high ring.
const DOORS = new Map([[20, 0], [36, 0], [3, 0]].map(([x, z]) => [key(x, z), true]));
const doorFacing = "north";

const g = new Voxels([41, 25, 51]);

for (const c of F.values()) {
  const t = T(c);
  const sh = shell(c);
  const face = facade(c);
  // Pier rhythm: along an east-west face the index is x, along a north-south face it is z.
  const p = face ? (face[0] !== 0 ? c.z : c.x) : 0;

  // Foundation under the cell's ground.
  for (let y = 0; y < c.g; y++) g.set(c.x, y, c.z, BAND);

  for (let y = c.g; y < t; y++) {
    const band = y % 3 === 0;
    const cap = y === t - 1;
    if (!sh) {
      // Interior: floor slabs at each storey line and the roof slab; air between.
      if (band || cap) g.set(c.x, y, c.z, FLOOR);
      continue;
    }
    if (band || cap) { g.set(c.x, y, c.z, BAND); continue; }
    const ground = y < 3;
    if (ground && DOORS.has(key(c.x, c.z)) && (y === 1 || y === 2)) {
      g.set(c.x, y, c.z, DOOR, { facing: doorFacing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (p % 3 === 0) { g.set(c.x, y, c.z, PIER); continue; }
    if (ground && p % 4 === 1) { g.set(c.x, y, c.z, BOARD); continue; }
    g.set(c.x, y, c.z, GLASS);
  }

  if (sh) g.set(c.x, t, c.z, PARAPET);   // parapet on the shell, standing on the wall below
}

// Entrance lintels: a stone course across the three cells either side of each door, one storey up.
for (const k of DOORS.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (let dx = -1; dx <= 1; dx++) {
    if (!inF(x + dx, z)) continue;
    g.set(x + dx, 3, z, LINTEL, { type: "top", waterlogged: "false" });
  }
}

// Warm lights: a lantern on the floor just inside some windows (interior cell behind the glass).
for (const c of F.values()) {
  const face = facade(c);
  if (!face || !shell(c)) continue;
  const t = T(c);
  const [fx, fz] = face;
  const ix = c.x - fx, iz = c.z - fz;                 // inward neighbour
  if (!inF(ix, iz) || shell(F.get(key(ix, iz)))) continue;
  const p = fx !== 0 ? c.z : c.x;
  for (let y = c.g; y < t - 1; y++) {
    if (y % 3 !== 1 || y < 3 || y > t - 3) continue;      // upper storeys, one lantern per storey line
    if (y % 3 === 1 && p % 4 === 2 && (p + y) % 2 === 0) g.set(ix, y, iz, LAMP, { hanging: "false", waterlogged: "false" });
  }
}

// Roof plant: two enclosures on the four-storey core, placed only where the roof is flat at 13.
const boxes = [[14, 18, 16, 18], [22, 26, 16, 18]];   // x0, x1, z0, z1 (inclusive)
for (const [x0, x1, z0, z1] of boxes) {
  let ok = true;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (top(x, z) !== 13) ok = false;
  if (!ok) continue;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    for (let y = 13; y <= 14; y++) if (edge) g.set(x, y, z, PLANT);
    g.set(x, 15, z, PLANT_TOP, { type: "bottom", waterlogged: "false" });
  }
}

g.save(OUT);
