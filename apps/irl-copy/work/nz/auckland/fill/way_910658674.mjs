// Way 910658674: a three-storey Edwardian commercial brick block (c. 1910s), 5 x 8 blocks on the Eden Terrace side of the
// CBD. Brick walls on a basalt-look plinth, a shopfront storey with a door on the street (z = 0) face, two storeys of
// sash-style windows in checkered bays, string courses at each floor, a stone cornice and parapet, and a flat roof
// with a plant box. Walls are the footprint's outer cells; the cells inside are floor slabs and air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658674.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..4, z 0..7

const ROOF = Math.max(...cells.map((c) => c[3]));           // 11: the roof deck's layer; the parapet sits on it
const F = new Set(cells.map(([x, z]) => `${x},${z}`));
const inF = (x, z) => F.has(`${x},${z}`);
const exposed = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);
const corner = (x, z) => (!inF(x - 1, z) || !inF(x + 1, z)) && (!inF(x, z - 1) || !inF(x, z + 1));
const wall = (x, z) => inF(x, z) && exposed(x, z);          // the outer shell
const DOOR = [2, 0];                                        // on the street face (north, z = 0)
const isWindow = (x, z) => wall(x, z) && !corner(x, z) && !(x === DOOR[0] && z === DOOR[1]);
const bay = (x, z) => (x + z) % 2 === 0;                    // checkered window bays

// the block at each cell in each row, as a Map so the panes can read their neighbours before they are written
const M = new Map();
const put = (x, y, z, block, state) => M.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => M.get(`${x},${y},${z}`)?.block ?? null;

for (const [x, z] of cells) {
  // the plinth (foundation) under every cell, ground to the first floor
  put(x, 0, z, "polished_andesite");
  if (!wall(x, z)) {
    // inside: a floor slab at each storey line, air between (the rooms are not modelled)
    for (const y of [4, 8, ROOF]) put(x, y, z, "stone");
    continue;
  }
  if (x === DOOR[0] && z === DOOR[1]) {
    put(x, 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, 3, z, "stone_bricks");                               // the entrance lintel
  } else {
    put(x, 1, z, "stone_bricks");                             // stall-riser kick
    for (const y of [2, 3]) put(x, y, z, isWindow(x, z) ? "glass_pane" : "bricks");
  }
  put(x, 4, z, "stone_bricks");                               // first-floor string course
  for (const y of [5, 6, 9, 10]) put(x, y, z, isWindow(x, z) && bay(x, z) ? "glass_pane" : "bricks");
  put(x, 7, z, "stone_bricks");                               // sill course
  put(x, 8, z, "stone_bricks");                               // second-floor string course
  put(x, ROOF, z, "chiseled_stone_bricks");                   // cornice
  put(x, ROOF + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // parapet
}
for (const [x, z] of cells) if (!wall(x, z)) put(x, ROOF, z, "stone");   // the roof deck over the inside too

// the plant box: two by two, one block high with a slab lid, on the roof's inside cells
for (const [x, z] of [[2, 2], [3, 2], [2, 3], [3, 3]]) {
  put(x, ROOF + 1, z, "stone");
  put(x, ROOF + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// warm light in some window bays: glowstone in the air behind the glass (an interior cell beside a lit bay)
for (const [x, z] of cells) {
  if (wall(x, z)) continue;
  for (const y of [2, 5, 9]) {
    const beside = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].some(([nx, nz]) => wall(nx, nz) && isWindow(nx, nz) && (y < 4 || bay(nx, nz)));
    if (beside && (x * 3 + z) % 3 === 0 && y !== 2) put(x, y, z, "glowstone");
    if (beside && y === 2 && (x + 2 * z) % 3 === 0) put(x, y, z, "shroomlight");
  }
}

// panes join their neighbours: a glass pane connects to any block beside it in that row
const link = (x, y, z, dx, dz) => (at(x + dx, y, z + dz) ? "true" : "false");
const g = new Voxels([5, 24, 8]);
for (const [key, { block, state }] of M) {
  const [x, y, z] = key.split(",").map(Number);
  if (block === "glass_pane") {
    g.set(x, y, z, block, { north: link(x, y, z, 0, -1), south: link(x, y, z, 0, 1), east: link(x, y, z, 1, 0), west: link(x, y, z, -1, 0), waterlogged: "false" });
  } else {
    g.set(x, y, z, block, state);
  }
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658674.nbt");
