// DC59552: Public Service office block, 401 E St SW, DC 20024, as a 1.21.1 module (Federal Center SW, 1960s-70s).
// A precast-concrete federal office slab: a three-storey wing along the north face (lidar 12) with a four-storey body
// behind it (lidar 14-16, parapet to 17) and a stair core at 17. Lidar roofs are 3x3-median smoothed and snapped to
// storey tiers of 4 blocks (3 rooms + a floor course): 4, 8, 12, 16, 17. Every column is solid from y 0 up to its
// roof slab, so no storey stands on air, and the interior is air behind the glass with one floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59552.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59552.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Smoothed roof: median of the footprint cells in the 3x3 around each cell (lidar noise and 0-1 gaps drop out).
const smooth = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), vals[vals.length >> 1]);
}
// Storey tiers: the structure tops out at T (roof slab at T-1, parapet at T on the wings and body), 4 blocks a storey.
const tier = (h) => (h <= 5 ? 4 : h <= 9 ? 8 : h <= 12 ? 12 : h <= 16 ? 16 : 17);

// Palette: pre-cast white concrete piers and light grey spandrels, stone string courses, light blue glass.
const BASE = "stone_bricks";                 // plinth, string course at every floor line, cornice, door lintel
const SPANDREL = "light_gray_concrete";      // head of each window band
const WALL = "white_concrete";               // mullions between the window bays, door flanks
const GLASS = "light_blue_stained_glass_pane";
const FLOOR = "smooth_stone";                // interior floor slab and the roof membrane
const PARAPET = "stone_brick_wall";
const DOOR = "dark_oak_door";
const LAMP = "glowstone";
const UNIT = "light_gray_concrete";          // roof plant on the body roof

// Two entrances on the north face of the three-storey wing, under the head course (cells on the wing's outer row).
const DOORS = [[14, 2], [30, 2]];
for (const [x, z] of DOORS) if (!inF(x, z) || inF(x, z - 1)) throw new Error(`door cell ${x},${z} is not on the north face`);
const doorAt = (x, z) => DOORS.some(([dx, dz]) => dx === x && dz === z);
const flankOf = (x, z) => DOORS.some(([dx, dz]) => dz === z && Math.abs(dx - x) === 1);
const lintelOf = (x, z) => DOORS.some(([dx, dz]) => dz === z && Math.abs(dx - x) <= 1);

const shell = (x, z) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz));  // touches the outside of the footprint
const lamp = (x, y, z) => (x * 7 + z * 5 + y) % 31 === 0;             // about one window in 31 on the upper floors, warm

const H = 20;
const g = new Voxels([43, H, 19]);

for (const c of F.values()) {
  const { x, z } = c;
  const T = tier(smooth.get(key(x, z)));
  const b = shell(x, z);
  const pier = x % 3 === 0;                                            // a mullion every third cell: a window grid

  for (let y = 0; y < T; y++) {
    const r = y % 4, k = y >> 2;
    if (y < c.g || y === 0) { g.set(x, y, z, b ? BASE : FLOOR); continue; }     // foundation and ground course
    if (y === T - 1) { g.set(x, y, z, b ? BASE : FLOOR); continue; }            // cornice on the wall, roof slab inside
    if (r === 0) { g.set(x, y, z, b ? BASE : FLOOR); continue; }                // string course / interior floor slab
    if (!b) continue;                                                           // interior air behind the glass
    if (r === 3) { g.set(x, y, z, lintelOf(x, z) && k === 0 ? BASE : SPANDREL); continue; }   // head course over each band
    // r = 1 or 2: the window band of storey k
    if (k === 0 && doorAt(x, z)) {
      g.set(x, y, z, DOOR, { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (pier || (k === 0 && flankOf(x, z))) g.set(x, y, z, WALL);
    else if (k > 0 && lamp(x, y, z)) g.set(x, y, z, LAMP);
    else g.set(x, y, z, GLASS);
  }

  if (b && T <= 16) g.set(x, T, z, PARAPET);                              // parapet on the wing and body roof edge
  if (!b && T === 16 && x % 6 === 3 && z % 5 === 2) {                     // plant boxes on the body roof, two blocks tall
    g.set(x, T, z, UNIT); g.set(x, T + 1, z, UNIT);
  }
}

const { blocks, palette } = g.save(OUT);
console.log(`DC59552: ${blocks} blocks, ${palette} palette entries -> ${OUT}`);
