// DC81454: 100 I St SE, Washington DC 20003, a residential apartment block with an elevator, as a 1.21.1 module.
// The lidar roof sits at 15 blocks over most of the footprint and 17 over a south-west core, so the massing is four
// storeys of 3 blocks (a floor band, then two rows of window) on a stone plinth, a cornice on the wings, and a fifth
// storey stepped back on the core (the setback). The look is a 1920s Classical Revival brick block: red brick walls,
// cream sandstone string courses and cornice, a stone plinth, and a dark oak entrance up two stair steps from the street.
// Every column is solid from y 0 up to its ground, and every storey floor and roof sits on the one below, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC81454.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC81454.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
// Compass sides in the structure's frame: z grows south, x grows east.
const SIDES = [[0, -1, "north"], [1, 0, "east"], [0, 1, "south"], [-1, 0, "west"]];

// Smoothed roof: median of the footprint cells in the 3x3 around each cell (lidar noise drops out).
const smooth = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), vals[vals.length >> 1]);
}
const tall = (x, z) => inF(x, z) && smooth.get(key(x, z)) >= 17;   // the fifth storey, the setback core

// Which footprint sides a cell exposes to the street or to the open air (the wall faces).
const exposed = (x, z) => SIDES.filter(([dx, dz]) => !inF(x + dx, z + dz));
const isShell = (x, z) => exposed(x, z).length > 0;
const isCorner = (x, z) => exposed(x, z).length >= 2;
// Position along a wall face: x on a north or south face, z on an east or west face.
const along = (x, z, [, dz]) => (dz !== 0 ? x : z);

// Palette
const PLINTH = "stone_bricks";
const STRING = "smooth_sandstone";   // floor bands, the cornice and the roof edge
const DECK = "smooth_stone";         // interior floor slabs and the roof membrane
const BRICK = "bricks";              // walls and piers
const GLASS = "glass_pane";
const SURROUND = "smooth_sandstone"; // door jambs
const DOOR = "dark_oak_door";
const STEP = "stone_brick_stairs";
const LAMP = "glowstone";
const AC = "iron_block";

const g = new Voxels([23, 18, 25]);

// Entrance: the longest run of single-sided wall cells on one face (not on the fifth storey), its middle cell.
const runs = new Map();
for (const c of F.values()) {
  const ex = exposed(c.x, c.z);
  if (ex.length !== 1 || tall(c.x, c.z)) continue;
  const [dx, dz, name] = ex[0];
  const line = `${name}:${dz !== 0 ? c.z : c.x}`;   // the face's fixed coordinate
  if (!runs.has(line)) runs.set(line, []);
  runs.get(line).push({ c, side: [dx, dz, name] });
}
let best = null;
for (const r of runs.values()) if (!best || r.length > best.length) best = r;
best.sort((a, b) => (a.side[1] !== 0 ? a.c.x - b.c.x : a.c.z - b.c.z));
const door = best[Math.floor(best.length / 2)];
const dc = door.c;
const [ODX, ODZ, OUTWARD] = door.side;
const DOOR_ALONG = along(dc.x, dc.z, door.side);

// Walls: piers of brick on every third block along a face, the rest glass; corners are piers.
// Rows: the floor bands are y 1, 4, 7, 10 and the roof band 13; two window rows sit between them.
const WINDOW_ROWS = [[2, 3], [5, 6], [8, 9], [11, 12]];
const TALL_ROWS = [14, 15];
const windowAt = (x, z, s = exposed(x, z)[0]) => !isCorner(x, z) && along(x, z, s) % 3 !== 0;
// The piers either side of the entrance are sandstone jambs, so the door reads as a surround.
const isJamb = (x, z) => {
  if (!isShell(x, z) || isCorner(x, z)) return false;
  const s = exposed(x, z)[0];
  if (s[0] !== ODX || s[1] !== ODZ) return false;
  return Math.abs(along(x, z, s) - DOOR_ALONG) === 1;
};
// A glass pane joins the wall in its plane only.
const paneState = ([dx]) => (dx !== 0 ? { north: "true", south: "true", east: "false", west: "false" } : { east: "true", west: "true", north: "false", south: "false" });

for (const c of F.values()) {
  const { x, z } = c;
  const b = isShell(x, z), T = tall(x, z);

  g.set(x, 0, z, PLINTH);                                              // plinth course, and the foundation up to the cell's ground
  for (let y = 1; y < c.g; y++) g.set(x, y, z, PLINTH);
  for (const y of [1, 4, 7, 10, 13]) g.set(x, y, z, b ? STRING : DECK); // floor and roof bands; a string course on the wall

  if (b) {
    for (const [r0, r1] of WINDOW_ROWS) for (const y of [r0, r1]) {
      if (isJamb(x, z)) g.set(x, y, z, SURROUND);
      else if (!windowAt(x, z)) g.set(x, y, z, BRICK);
      else g.set(x, y, z, GLASS, paneState(exposed(x, z)[0]));
    }
  }

  if (T) {
    // The fifth storey: walls only where the core meets the rest of the block (the setback).
    const edge = SIDES.some(([dx, dz]) => !tall(x + dx, z + dz));
    if (edge) {
      const s = exposed(x, z)[0] ?? SIDES.find(([dx, dz]) => !tall(x + dx, z + dz));
      for (const y of TALL_ROWS) {
        if (windowAt(x, z, s)) g.set(x, y, z, GLASS, paneState(s));
        else g.set(x, y, z, BRICK);
      }
      g.set(x, 16, z, STRING);                                         // cornice on the core's walls
    } else {
      g.set(x, 16, z, DECK);                                           // core roof membrane over the storey below
    }
  } else if (b) {
    g.set(x, 14, z, STRING);                                           // cornice on the wings
  } else if (x % 5 === 2 && z % 5 === 2) {
    g.set(x, 14, z, AC);                                               // roof units on the wing roofs
  }
}

// Warm light behind some windows: a glowstone on the inside cell behind a pane, one storey per window.
for (const c of F.values()) {
  if (!isShell(c.x, c.z) || isCorner(c.x, c.z) || tall(c.x, c.z) || !windowAt(c.x, c.z) || isJamb(c.x, c.z)) continue;
  if ((c.x * 5 + c.z * 7) % 6 !== 1) continue;
  const [dx, dz] = exposed(c.x, c.z)[0];
  const inX = c.x - dx, inZ = c.z - dz;
  if (!inF(inX, inZ) || isShell(inX, inZ)) continue;
  g.set(inX, WINDOW_ROWS[(c.x + c.z) % 4][0], inZ, LAMP);
}

// The entrance: a dark oak door, two stair steps up from the street, the sandstone jambs either side, and a lamp inside.
const steps = (y) => g.set(dc.x, y, dc.z, STEP, { facing: OUTWARD, half: "bottom", shape: "straight", waterlogged: "false" });
steps(0);
steps(1);
g.set(dc.x, 2, dc.z, DOOR, { facing: OUTWARD, half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dc.x, 3, dc.z, DOOR, { facing: OUTWARD, half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(dc.x - ODX, 2, dc.z - ODZ, LAMP);

console.log(g.save(OUT));
