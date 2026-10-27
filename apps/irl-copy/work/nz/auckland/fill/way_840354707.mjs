// Way 840354707: a two-storey 1920s brick shop with a plastered string course and a flat parapet roof, on Mt Eden's
// main street. Footprint 7 x 10 (46 cells). Lidar: the roof sits at y 11 across the footprint, one lower corner bay at
// y 7 and a step at y 10 on the west edge, ground y 0 except one cell at y 1 (foundation below it).
// Shell: each perimeter cell is a wall column from its ground up to its roof; interior cells are air above the floor
// slabs (y = ground, 4, 8). Corners are polished andesite pilasters, bands are plaster, windows glass with dark-oak
// shopfront piers, the front door on the west face, and warm light behind some glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_840354707.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_840354707.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([7, 24, 10]);

const key = (x, z) => `${x},${z}`;
const fp = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { x, z, ground, roof }]));
const inFp = (x, z) => fp.has(key(x, z));
// the sides of a cell that face outside the footprint
const exposed = (x, z) => {
  const f = [];
  if (!inFp(x, z - 1)) f.push("N");
  if (!inFp(x, z + 1)) f.push("S");
  if (!inFp(x - 1, z)) f.push("W");
  if (!inFp(x + 1, z)) f.push("E");
  return f;
};
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };   // the neighbour a wall faces into

const GLASS = "glass_pane", BRICK = "bricks", BAND = "smooth_quartz", PIER = "polished_andesite";
const BASE = "stone_bricks", CAP = "stone_bricks", FLOOR = "smooth_stone", DECK = "gray_concrete", TIMBER = "dark_oak_planks";
const DOOR = "dark_oak_door";

// the west-face door (x 1, z 4): the one entrance, on the shop front
const DOOR_CELL = [1, 4];
// the stair-light column on the north bump (x 4, z 0) and the cells that get a glowing window
const STAIR = [4, 0];

for (const c of fp.values()) {
  const { x, z, ground: G, roof: R } = c;
  const ext = exposed(x, z);
  const perim = ext.length > 0;
  const corner = ext.length >= 2;
  const deck = R >= 9 ? 8 : 4;          // roof deck under the parapet: the upper storey's ceiling, or the one-storey bay's
  const face = ext[0] ?? null;

  // foundation below the floor, floor slab at the cell's ground
  for (let y = 0; y < G; y++) g.set(x, y, z, BASE);
  g.set(x, G, z, perim ? BASE : FLOOR);
  // floor slab on the first floor (y 4), and the roof deck (y 8) on the two-storey cells
  if (!perim) {
    g.set(x, 4, z, FLOOR);
    if (deck === 8) g.set(x, 8, z, DECK);
    continue;
  }

  // the stair bump: brick with a glass light slot (y 5-6) and a band over it
  if (x === STAIR[0] && z === STAIR[1]) {
    for (let y = G + 1; y < R - 1; y++) g.set(x, y, z, BRICK);
    g.set(x, 5, z, GLASS); g.set(x, 6, z, GLASS); g.set(x, 7, z, BAND); g.set(x, 4, z, BAND);
    g.set(x, R - 1, z, CAP);
    continue;
  }

  // corners: stone pilasters at the shopfront, brick above, with the same bands running round the corner
  if (corner) {
    for (let y = G + 1; y < R - 1; y++) {
      let b = BRICK;
      if (y <= 2) b = PIER;
      else if (y === 3 || y === 4 || y === 7 || y === 8) b = BAND;
      g.set(x, y, z, b);
    }
    g.set(x, R - 1, z, CAP);
    continue;
  }

  // a single face: the window rhythm runs along it (even coordinate = glass, odd = pier)
  const along = face === "W" || face === "E" ? z : x;
  const isGlass = along % 2 === 0;
  for (let y = G + 1; y < R - 1; y++) {
    let b = BRICK;
    if (y <= 2) b = isGlass ? GLASS : TIMBER;                       // shopfront
    else if (y === 3) b = BAND;                                        // fascia
    else if (y === 4) b = BAND;                                        // string course
    else if (y <= 6) b = isGlass ? GLASS : BRICK;                      // upper windows
    else if (y === 7) b = isGlass ? BAND : BRICK;                      // lintel over the windows
    else if (y === 8) b = BAND;                                        // cornice
    else b = BRICK;                                                    // parapet
    if (R < 9 && y >= 5 && y <= 6) b = isGlass ? GLASS : BRICK;       // the bay's windows, stopping at the deck
    g.set(x, y, z, b);
  }
  g.set(x, G, z, BASE);
  g.set(x, R - 1, z, CAP);
  // the door at the shop's entry: a two-block dark oak door with the bay's piers either side
  if (x === DOOR_CELL[0] && z === DOOR_CELL[1]) {
    g.set(x, G + 1, z, DOOR, { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, G + 2, z, DOOR, { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// warm light behind some upper windows: a glowstone on the floor just inside the glass
for (const c of fp.values()) {
  const ext = exposed(c.x, c.z);
  if (ext.length !== 1 || c.roof < 9) continue;
  const face = ext[0];
  const along = face === "W" || face === "E" ? c.z : c.x;
  if (along % 2 !== 0 || (c.x + c.z) % 3 !== 0) continue;
  const [dx, dz] = inward[face];
  const ix = c.x + dx, iz = c.z + dz;
  if (inFp(ix, iz) && exposed(ix, iz).length === 0) g.set(ix, 5, iz, "glowstone");
}

// a lantern inside the shop door, on the floor slab; two AC units on the roof
g.set(2, 1, 4, "lantern", { hanging: "false" });
g.set(2, 9, 5, "iron_block");
g.set(4, 9, 7, "iron_block");

const stats = g.save(OUT);
console.log(`way_840354707: ${stats.blocks} blocks, ${stats.palette} palette entries -> ${OUT}`);
