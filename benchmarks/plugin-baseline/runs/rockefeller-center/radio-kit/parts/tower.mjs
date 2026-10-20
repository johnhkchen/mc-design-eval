// Plot 0 tower shell (P1): masses P0-A..H, piers and strips, friezes, string course, decks, crown, openings.
import { B, carve } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { limestone_mass, setback_deck, pier_wall, crown_lantern } from "../vocab.mjs";

const OVER = ["smooth_sandstone", "polished_granite"];
// [x0, z0, x1, z1, deckY]: one solid mass from y0 to deckY-1, then deck + parapet, frieze on the row under the deck.
const MASSES = [
  [2, 10, 29, 45, 103],   // P0-D slab
  [6, 4, 27, 9, 98],      // P0-E north wing (x6..7 below z6 is P0-B)
  [6, 46, 27, 49, 98],    // P0-F south wing
  [6, 14, 23, 39, 111, 104], // P0-G crown, from y104
  [2, 0, 17, 3, 20], [18, 0, 33, 3, 24],       // P0-A
  [2, 4, 7, 5, 20], [2, 6, 5, 9, 20],          // P0-B
  [28, 4, 33, 9, 25], [30, 10, 33, 19, 27],    // P0-C
  [2, 46, 5, 51, 20], [6, 50, 9, 51, 20],      // P0-H
];
// pier walls: [face, at, from, to, y0, y1]
const FACES = [
  ["west", 2, 10, 45, 11, 99], ["east", 29, 20, 45, 1, 99], ["east", 29, 10, 19, 29, 99],
  ["north", 10, 2, 5, 22, 99], ["north", 10, 28, 29, 27, 99],
  ["south", 45, 2, 5, 22, 99], ["south", 45, 28, 29, 11, 99],
  ["north", 4, 8, 27, 22, 96], ["east", 27, 4, 9, 27, 96], ["west", 6, 6, 9, 22, 96],
  ["south", 49, 6, 27, 22, 96], ["east", 27, 46, 49, 11, 96], ["west", 6, 46, 49, 22, 96],
  ["west", 6, 14, 39, 104, 108], ["east", 23, 14, 39, 104, 108],
  ["north", 14, 6, 23, 104, 108], ["south", 39, 6, 23, 104, 108],
  ["north", 0, 2, 17, 11, 18], ["north", 0, 18, 33, 11, 22],
  ["west", 2, 0, 9, 11, 18], ["east", 33, 4, 9, 11, 22], ["east", 33, 10, 19, 11, 25],
];

export function build(g) {
  for (const [x0, z0, x1, z1, deck, base = 0] of MASSES) {
    const y0 = base;
    limestone_mass(g, [x0, y0, z0, x1, deck - 1, z1], { plinth: base === 0 });
  }
  for (const [face, at, from, to, y0, y1] of FACES) pier_wall(g, { face, at, from, to, y0, y1, phase: 11, over: OVER });
  // friezes under every parapet (slab: attic y100..101 solid, frieze y102)
  for (const [x0, z0, x1, z1, deck] of MASSES) {
    const y = deck - 1;
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++)
      if (x === x0 || x === x1 || z === z0 || z === z1) g.set(x, y, z, "cut_sandstone");
  }
  // west string course y28, upside down, 1 proud at x1
  for (let z = 10; z <= 45; z++) g.set(1, 28, z, ...B.stairs("smooth_sandstone", "east", "top"));
  // openings (left as air for the glazing part)
  for (let z = 6; z <= 41; z++) if ((z - 10) % 3 !== 0) carve(g, [2, 1, z], [3, 5, z]);
  carve(g, [2, 1, 42], [3, 5, 51]);
  carve(g, [3, 1, 50], [9, 5, 51]);
  carve(g, [10, 1, 48], [27, 5, 49]);
  carve(g, [4, 1, 0], [31, 5, 0]);
  for (const z of [22, 30, 38]) carve(g, [28, 1, z], [29, 3, z + 1]);
  for (const x of [6, 8]) carve(g, [x, 12, 51], [x, 19, 51]);
  for (const x of [10, 18, 19, 27]) carve(g, [x, 11, 49], [x, 21, 49]);
  carve(g, [11, 13, 49], [17, 19, 49]);
  carve(g, [20, 13, 49], [26, 19, 49]);
  // decks: light grid, parapet one above
  for (const [x0, z0, x1, z1, deck] of MASSES) {
    const tower = deck >= 98;
    setback_deck(g, [x0, z0, x1, z1], { y: deck, ground: tower ? "light_gray_concrete" : "gray_concrete", lightEvery: 6 });
  }
  // floodlights along the foot of the crown wall on the slab ring deck
  for (let x = 6; x <= 23; x += 4) { g.set(x, 103, 13, "sea_lantern"); g.set(x, 103, 40, "sea_lantern"); }
  for (let z = 14; z <= 39; z += 4) { g.set(5, 103, z, "sea_lantern"); g.set(24, 103, z, "sea_lantern"); }
  // gray bands on the crown deck
  for (let z = 15; z <= 38; z += 6) for (let x = 7; x <= 22; x++)
    if (!(x >= 13 && x <= 16 && z >= 25 && z <= 28) && g.blockAt(x, 111, z) === "light_gray_concrete") g.set(x, 111, z, "gray_concrete");
  crown_lantern(g, { x: 13, y: 112, z: 25 });
}
