// P1 main shell: the main block M (x18..35 z11..25), the east family wing W (x35..42 z12..24) and the chamfered turret T
// (x38..42 z8..12, corners (38,8) and (42,8) uncut). Floors at y0 and the y5 slab (foyer void open), walls y1..9 with
// plinth, belt rows and frieze, the top plate at y9, interior partitions, the foyer stair, quoins and shutters. Every
// OPENINGS cell is left as air, and the portico and chimney footprints are never touched.
import { B, INTERIOR_WALL, OPENINGS, SIDING, quoins, shutterCells, wallBlock } from "../vocab.mjs";

// Every OPENINGS cell (inclusive ranges). The shell never writes into these, so they stay air.
const open = new Set();
for (const o of OPENINGS) for (let x = o.x[0]; x <= o.x[1]; x++) for (let y = o.y[0]; y <= o.y[1]; y++) for (let z = o.z[0]; z <= o.z[1]; z++) open.add(`${x},${y},${z}`);
const isOpen = (x, y, z) => open.has(`${x},${y},${z}`);

// Wall planes in plan coordinates: M ring, W north/south/east, T north/west/east (shared walls included).
const isWall = (x, z) =>
  (z === 11 || z === 25) && x >= 18 && x <= 35 ||
  (x === 18 || x === 35) && z >= 11 && z <= 25 ||
  (z === 12 || z === 24) && x >= 35 && x <= 42 ||
  x === 42 && z >= 12 && z <= 24 ||
  z === 8 && x >= 39 && x <= 41 ||
  (x === 38 || x === 42) && z >= 9 && z <= 11;

// Interior air footprints of M, W and T (inside the walls above).
const interior = (x, z) =>
  (x >= 19 && x <= 34 && z >= 12 && z <= 24) ||
  (x >= 36 && x <= 41 && z >= 13 && z <= 23) ||
  (x >= 39 && x <= 41 && z >= 9 && z <= 11);

// Veneer (y1..4) on the north-facing planes, plus the three wrap cells round the x=18 corner.
const northPlane = (x, z) =>
  (z === 11 && x >= 18 && x <= 35) || (z === 12 && x >= 35 && x <= 42) || (z === 8 && x >= 39 && x <= 41) ||
  ((x === 38 || x === 42) && z >= 9 && z <= 11) || (x === 18 && z >= 11 && z <= 13);

// Floors: the foyer checker, dark oak in the office and dining room, oak elsewhere; the bath is smooth quartz.
const groundFloor = (x, z) => {
  if (x >= 24 && x <= 29 && z >= 12 && z <= 16) return (x + z) % 2 === 0 ? "quartz_block" : "black_concrete";
  if (z >= 12 && z <= 16 && (x <= 22 || x >= 31)) return "dark_oak_planks";
  return "oak_planks";
};
const upperFloor = (x, z) => {
  if (x >= 24 && x <= 29 && z >= 12 && z <= 16) return null;   // the foyer void: double height, no slab
  if (x >= 36 && x <= 41 && z >= 21 && z <= 23) return "smooth_quartz";
  return "oak_planks";
};

// Interior partitions [x0, x1, z0, z1, y0, y1], built from the plan's list (openings are skipped on the way).
const PARTITIONS = [
  [23, 23, 12, 16, 1, 9], [30, 30, 12, 16, 1, 9],
  [19, 23, 17, 17, 1, 9], [30, 34, 17, 17, 1, 9],
  [23, 23, 12, 24, 6, 8], [30, 30, 12, 24, 6, 8],
  [19, 22, 20, 20, 6, 8], [31, 34, 20, 20, 6, 8], [36, 41, 20, 20, 6, 8],
];

export function build(g) {
  // Walls: plinth at y0, veneer y1..4 on north planes, siding elsewhere, belt rows y5 and frieze y9.
  for (let x = 18; x <= 42; x++) for (let z = 8; z <= 25; z++) {
    if (!isWall(x, z)) continue;
    for (let y = 0; y <= 9; y++) {
      if (isOpen(x, y, z)) continue;
      g.set(x, y, z, ...wallBlock(northPlane(x, z) ? "north" : "south", x, y, z));
    }
  }

  // Floors (y0 ground, y5 slab carrying the upper rooms) and the top plate at y9 over every room.
  for (let x = 19; x <= 41; x++) for (let z = 9; z <= 24; z++) {
    if (!interior(x, z)) continue;
    g.set(x, 0, z, groundFloor(x, z));
    const up = upperFloor(x, z);
    if (up) g.set(x, 5, z, up);
    g.set(x, 9, z, SIDING);
  }

  // Foyer stair: five steps rising south from z12 to z16 on x24..25, each with an oak_planks fill beneath. The front
  // (open side) of the stairs faces north, toward the entry.
  for (let k = 0; k <= 4; k++) for (const x of [24, 25]) {
    g.set(x, 1 + k, 12 + k, ...B.stairs("oak", "north", "bottom"));
    if (k >= 1) g.fill([x, 1, 12 + k], [x, k, 12 + k], "oak_planks");
  }

  // Interior partitions, skipping openings.
  for (const [x0, x1, z0, z1, y0, y1] of PARTITIONS) {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) {
      if (!isOpen(x, y, z)) g.set(x, y, z, INTERIOR_WALL);
    }
  }

  // Quoins and shutters are shared with the garage (x < 18), which is P2's: keep only the main block and wing writes.
  const mainOnly = new Proxy(g, {
    get: (t, p) => (p === "set" ? (x, y, z, ...r) => { if (x >= 18) t.set(x, y, z, ...r); } : Reflect.get(t, p)),
  });
  quoins(mainOnly);
  shutterCells(mainOnly);
}
