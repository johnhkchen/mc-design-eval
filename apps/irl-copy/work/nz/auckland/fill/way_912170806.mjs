// Mt Eden / Eden Terrace, a 1930s two-storey rendered commercial block (cream plaster, stone-band storey lines,
// a shopfront on the street face, a flat roof behind a coping). Footprint is the lidar's 32 cells (a cut-cornered
// plan); ground 0, roof 10. Perimeter = the walls (1 block thick), interior = air under floor slabs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170806.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..6, z 0..5

const H = 23;
const g = new Voxels([7, H, 6]);
const placed = new Map();   // "x,y,z" -> block name, for the glass-pane connections and the light placement
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); placed.set(`${x},${y},${z}`, block); };

const ground = Math.min(...cells.map((c) => c[2]));
const roof = Math.max(...cells.map((c) => c[3]));           // 10: the deck is at roof-1, the coping at roof
const F = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => F.has(`${x},${z}`);
const outside = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !has(x + dx, z + dz)).length;
const perim = (x, z) => outside(x, z) > 0;
const DOOR = [2, 0];                                       // the street (north) face, centre
const doorHere = (x, z) => x === DOOR[0] && z === DOOR[1];

for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground (none here, ground is 0)
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  const edge = perim(x, z), corner = outside(x, z) >= 2;
  if (!edge) {
    // interior: floor slabs at 0, 5 and the roof deck (roof-1); air between
    for (const y of [0, 5, roof - 1]) put(x, y, z, "smooth_stone");
    continue;
  }
  put(x, 0, z, "polished_andesite");                       // plinth
  for (let y = 1; y <= 3; y++) {                           // ground storey: shopfront
    if (doorHere(x, z)) {
      const half = y === 1 ? "lower" : "upper";
      if (y <= 2) put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "lantern", { hanging: "true" });      // the lamp under the entrance canopy band
    } else if (corner) put(x, y, z, "white_concrete");      // piers
    else put(x, y, z, "glass_pane");
  }
  put(x, 4, z, "stone_bricks");                            // fascia / storey line over the shop
  put(x, 5, z, "stone_bricks");                            // string course (upper floor)
  for (let y = 6; y <= 7; y++) {                           // upper storey: paired sash windows
    const win = !corner && (x + z) % 3 !== 0;               // glazed bays two to a pier
    put(x, y, z, win ? "glass_pane" : "white_concrete");
  }
  put(x, 8, z, "stone_bricks");                            // head band
  put(x, roof - 1, z, "stone_bricks");                     // cornice on the deck
  put(x, roof, z, "white_concrete");                       // parapet coping
}

// roof plant: a small block on the deck, inside the coping
for (const [x, z] of [[2, 2], [3, 2], [2, 3], [3, 3]]) put(x, roof, z, "gray_concrete");

// warm lights behind some windows: glowstone on the ground-floor floor, a lantern on the upper floor
for (const [x, z] of cells) {
  if (!perim(x, z)) continue;
  const inward = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => [x + dx, z + dz]).find(([a, b]) => has(a, b) && !perim(a, b));
  if (!inward || (x + z) % 2 !== 1) continue;
  for (const y of [1, 2, 3, 6, 7]) {
    const b = placed.get(`${x},${y},${z}`);
    if (b !== "glass_pane") continue;
    if (y <= 3) put(inward[0], 1, inward[1], "glowstone");
    else put(inward[0], 6, inward[1], "lantern", { hanging: "false" });
  }
}

// glass panes connect to their solid or glass neighbours in the plane of the wall, as the game draws them
const SIDE = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
for (const [key, block] of placed) {
  if (block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const state = {};
  for (const [side, [dx, dz]] of Object.entries(SIDE)) {
    const n = placed.get(`${x + dx},${y},${z + dz}`);
    state[side] = n && !["dark_oak_door", "lantern"].includes(n) ? "true" : "false";
  }
  g.set(x, y, z, "glass_pane", state);
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170806.nbt");
console.log(JSON.stringify({ ground, roof, cells: cells.length, ...info }));
