// DC78561: Hotel-Large at 400 New Jersey Ave NW, DC 20001, as a 1.21.1 module.
// Read as a 1920s brick hotel of the Union Station fringe: red brick walls with pale limestone-look trims (string
// courses, lintels, cornice), a dark roof membrane behind a brick parapet, and a glass lobby with a canopy on
// the south front. The lidar roof is median-smoothed over the footprint and snapped to three tiers: a one-storey
// wing (4), the main body of three storeys (12) and the tower of four (16), so the roofline steps in as it rises.
// Every column is solid from y 0 up to its own top (foundation under the cell's ground, then the storeys), so each
// tier stands on what is below it and nothing floats. Interiors are not modelled: a floor slab at each storey line
// and air between them, with the glass walls around.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC78561.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC78561.nbt";

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
// Tiers (absolute tops above y 0): 4 = one-storey wing, 12 = three storeys, 16 = four storeys (the tower).
const tier = (h) => (h <= 6 ? 4 : h <= 13 ? 12 : 16);

// Palette
const BRICK = "bricks";              // walls and piers
const TRIM = "smooth_quartz";        // string courses, lintels, quoins, cornice: the pale stone
const PLINTH = "stone_bricks";       // foundation and base course
const GLASS = "glass_pane";
const LAMP = "glowstone";            // warm light behind a pane
const FLOOR = "smooth_stone";        // floor slabs behind the glass
const ROOF = "deepslate_tiles";      // roof membrane behind the parapet
const PARAPET = "brick_wall";
const AC = "iron_block";             // roof plant
const DOOR = "dark_oak_door";
const CANOPY = "dark_oak_slab";

const g = new Voxels([27, 28, 51]);

// The outward directions of a shell cell (the sides with no footprint cell beyond them).
const outside = (x, z) => DIRS.filter(([, dx, dz]) => !inF(x + dx, z + dz));

// Front: the south face (the longest straight street front). Entrance: the middle cell of that row, with the
// bays either side of it as brick piers and a canopy over the three.
const frontRow = [...F.values()].filter((c) => !inF(c.x, c.z + 1)).map((c) => c.x);
const frontZ = Math.max(...[...F.values()].map((c) => c.z));
const xc = Math.floor((Math.min(...frontRow) + Math.max(...frontRow)) / 2);
const doorBay = (x, z) => z === frontZ && Math.abs(x - xc) <= 1;
const lobby = (x, z) => z === frontZ && Math.abs(x - xc) <= 5;

// Piers and bays on a wall: along-wall index sets the rhythm (two panes, one brick pier).
const along = (x, z, side) => (side === "north" || side === "south" ? x : z);
const isPier = (x, z, side) => along(x, z, side) % 3 === 2;

for (const c of F.values()) {
  const T = tier(smooth.get(key(c.x, c.z)));
  const sides = outside(c.x, c.z);
  const b = sides.length > 0;                       // a shell cell (the outer walls and the courtyard walls)
  const corner = sides.length >= 2;                 // quoin cells
  const side = b ? sides[0][0] : null;
  const isDoor = doorBay(c.x, c.z);
  for (let y = 0; y < T; y++) {
    if (y < c.g) { g.set(c.x, y, c.z, PLINTH); continue; }                 // foundation under the cell's ground
    if (y === T - 1) { g.set(c.x, y, c.z, b ? TRIM : ROOF); continue; }   // cornice course / roof membrane
    if (!b) {
      if (y % 4 === 0) g.set(c.x, y, c.z, FLOOR);                          // floor slab at each storey line
      continue;
    }
    const r = y % 4;
    if (y === 0) { g.set(c.x, y, c.z, PLINTH); continue; }                // base course
    if (r === 0 || r === 3) { g.set(c.x, y, c.z, TRIM); continue; }       // string course and lintel course
    if (corner) { g.set(c.x, y, c.z, BRICK); continue; }                  // corner piers between the courses
    // r = 1 or 2: the window band.
    if (y <= 2 && isDoor) {                                               // entrance bay: door, piers either side
      if (c.x === xc) continue;
      g.set(c.x, y, c.z, BRICK); continue;
    }
    if (y <= 2 && lobby(c.x, c.z) && !isPier(c.x, c.z, side)) { g.set(c.x, y, c.z, GLASS); continue; }
    if (isPier(c.x, c.z, side) || (y <= 2 && side === "south" && c.z === frontZ && !lobby(c.x, c.z))) {
      g.set(c.x, y, c.z, BRICK); continue;
    }
    const k = Math.floor(y / 4);
    const lit = k >= 1 && r === 1 && (c.x * 7 + c.z * 13 + k * 5) % 11 === 0;
    g.set(c.x, y, c.z, lit ? LAMP : GLASS);
  }
  if (isDoor && c.x === xc) {
    g.set(c.x, 1, c.z, DOOR, { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(c.x, 2, c.z, DOOR, { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  // Canopy over the entrance bay: the lintel course becomes a slab across the three cells.
  if (isDoor) g.set(c.x, 3, c.z, CANOPY, { type: "top", waterlogged: "false" });
  // Parapet on the outer roof edge; roof plant on the interior of the taller tiers.
  if (b && !isDoor) g.set(c.x, T, c.z, PARAPET);
  if (!b && T >= 12 && c.x % 5 === 2 && c.z % 5 === 2) g.set(c.x, T, c.z, AC);
}

g.save(OUT);
console.log("wrote", OUT, g.count(), "blocks; door at x", xc, "z", frontZ);
