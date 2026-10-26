// 1200 5th St NW: a red-brick apartment walk-up (c. 1900-1920 DC, buff limestone trim) on a 7 x 5 footprint. The lidar
// roof is 5 blocks over the core and 4 over the lower wings, already in two flat tiers, so the massing is taken as
// read. Rows: y0 plinth and entrance, y1 storey-one windows, y2 limestone string course (the door's lintel), y3
// storey-two windows, y4 cornice on the core (the wings stop at y3). Every column is solid from y 0 to its top, and
// the interior is air behind the glass with a floor slab at y2 and a roof deck on top, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC79551.cells.json`, "utf8"));

const W = 7, H = 17, D = 5;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { ground, roof });

const WALL = "bricks", STONE = "calcite", PLINTH = "stone_bricks", FLOOR = "spruce_planks", DECK = "stone";
const GLASS = "light_blue_stained_glass_pane";
const panes = new Set();
const pk = (x, y, z) => `${x},${y},${z}`;

const ground = Math.min(...cells.map(([, , gr]) => gr));
const ring = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const DOOR = { x: 3, z: 0 };

// Is the wall cell at (x, z) a window bay on the storey rows? Long faces: pier at the ends and every third bay
// pier, glass between. The door bay on the front is a solid door, not glass.
const bay = (x, z) => {
  if (x === 0 || x === W - 1) return z >= 1 && z <= D - 2;                       // ends: three bays
  if (z === 0 || z === D - 1) return x >= 1 && x <= W - 2 && x !== 3;           // long faces: pier at the centre
  return false;
};

// ---- main pass: each column solid from the ground to its roof row, the interior hollow above the floor slab ----
for (const [k, { roof }] of cell) {
  const [x, z] = k.split(",").map(Number);
  const top = roof;                                                             // roof row is the height above y 0
  for (let y = ground; y < top; y++) {
    const isRing = ring(x, z);
    if (y === 0) {                                                              // plinth and the entrance floor
      if (isRing && x === DOOR.x && z === DOOR.z) g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, isRing ? PLINTH : FLOOR);
    } else if (isRing) {
      if (y === top - 1 && y >= 3) g.set(x, y, z, STONE);                         // cornice on top
      else if (y === 2) {                                                         // string course, lintel above the door
        if (x >= 2 && x <= 4 && z === 0) g.set(x, y, z, "stone_brick_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });
        else g.set(x, y, z, STONE);
      } else if (y === 1 && x === DOOR.x && z === DOOR.z) g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      else if (y === 1 || y === 3) {                                              // storey windows: glass in bays, brick piers
        if (bay(x, z)) { g.set(x, y, z, GLASS); panes.add(pk(x, y, z)); }
        else g.set(x, y, z, WALL);
      } else g.set(x, y, z, WALL);
    } else {                                                                      // interior: floor slab at y 2, deck on top
      if (y === top - 1) g.set(x, y, z, DECK);
      else if (y === 2) g.set(x, y, z, FLOOR);
      // else air behind the glass
    }
  }
}

// ---- glass panes connect to the neighbouring walls and panes in their own plane, so each bay is a framed grid ----
const solid = (x, y, z) => g.val(x, y, z) !== 0;
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const inPlaneEW = z === 0 || z === D - 1;                                        // long faces run along x
  const a = inPlaneEW ? [x - 1, z] : [x, z - 1], b = inPlaneEW ? [x + 1, z] : [x, z + 1];
  const conn = (p) => String(solid(p[0], y, p[1]));
  g.set(x, y, z, GLASS, {
    north: inPlaneEW ? "false" : conn(a), south: inPlaneEW ? "false" : conn(b),
    east: inPlaneEW ? conn(b) : "false", west: inPlaneEW ? conn(a) : "false", waterlogged: "false",
  });
}

// ---- warm light behind some glass, and rooftop chimneys on the deck ----
g.set(2, 1, 1, "glowstone");
g.set(5, 1, 2, "glowstone");
g.set(4, 3, 3, "shroomlight");
g.set(1, 3, 2, "glowstone");
for (const [x, z] of [[1, 1], [4, 3]]) {
  g.set(x, 5, z, WALL); g.set(x, 6, z, WALL);
  g.set(x, 7, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

const info = g.save(`${DIR}/DC79551.nbt`);
console.log(JSON.stringify({ ...info, size: [W, H, D] }));
