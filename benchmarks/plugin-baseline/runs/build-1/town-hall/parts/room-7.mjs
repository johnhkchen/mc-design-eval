// Part: room: Council chamber (parts/room-7.mjs). Interior furnisher and lamplighter for the council chamber, inside its box
// x5..35 z15..25, y11..15. Spruce floor and ceiling come from the shell. The mayor's dais and lectern sit at the south, facing
// the room; a horseshoe of council tables (fence posts with slab tops) is open to the dais, with a chair on each side; public
// benches run down the east and west ends; a red runner crosses the centre aisle. Light: chandeliers on iron chains, a
// lattice 5 apart, lanterns at y13 (light 13 at the feet, so every floor cell is 8 or more), plus two standing lanterns on the dais.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 5;
const Z0 = 15;
const W = 31; // x 5..35
const D = 11; // z 15..25
const ORIGIN = [X0, 11, Z0];
const LAYERS = 5; // y 11..15

// One text layer per storey. Rows run along +x, successive rows along +z.
const grid = Array.from({ length: LAYERS }, () => Array.from({ length: D }, () => Array(W).fill(".")));
const put = (y, x, z, ch) => { grid[y - ORIGIN[1]][z - Z0][x - X0] = ch; };
const fill = (y, xa, xb, za, zb, ch) => {
  for (let x = xa; x <= xb; x++) for (let z = za; z <= zb; z++) put(y, x, z, ch);
};

// Floor level (y11): runner, dais, table legs, chairs, benches.
fill(11, 19, 21, 15, 22, "C"); // red runner down the centre aisle
fill(11, 18, 22, 23, 24, "P"); // dais, raised one block
for (const x of [16, 17, 18, 22, 23, 24]) {
  put(11, x, 16, "n"); // north-side chair, back to the north, faces the table
  put(11, x, 17, "f"); // table leg under the north bar
  put(11, x, 18, "u"); // south-side chair, back to the south, faces the table
}
for (const z of [19, 20, 21]) {
  put(11, 16, z, "f"); // west arm table leg
  put(11, 24, z, "f"); // east arm table leg
  put(11, 15, z, "w"); // west arm chair
  put(11, 25, z, "e"); // east arm chair
}
for (let z = 19; z <= 24; z++) {
  put(11, 7, z, "w"); // public bench, west end, back to the wall
  put(11, 33, z, "e"); // public bench, east end
}

// Table tops (y12): the north bar and the two arms, the mayor's lectern and chair, two standing lanterns on the dais.
for (const x of [16, 17, 18, 22, 23, 24]) put(12, x, 17, "s");
for (const z of [19, 20, 21]) {
  put(12, 16, z, "s");
  put(12, 24, z, "s");
}
put(12, 20, 23, "R"); // lectern, the focal piece
put(12, 20, 24, "m"); // mayor's chair, back to the south wall
put(12, 18, 24, "l"); // standing lantern on the dais
put(12, 22, 24, "l");

// Chandeliers: a lattice 5 apart over the chamber, with one extra at the south-east corner. Lantern at y13 under two
// chains (y14, y15) from the ceiling at y16.
const CHANDELIERS = [];
for (const x of [7, 12, 17, 22, 27, 32]) for (const z of [17, 22]) CHANDELIERS.push([x, z]);
CHANDELIERS.push([35, 22]);
for (const [x, z] of CHANDELIERS) {
  put(13, x, z, "L");
  put(14, x, z, "I");
  put(15, x, z, "I");
}

const legend = {
  C: "red_carpet",
  P: "dark_oak_planks",
  f: B.fence("dark_oak"),
  s: B.slab("dark_oak", "bottom"),
  n: B.stairs("dark_oak", "north"),
  u: B.stairs("dark_oak", "south"),
  m: B.stairs("dark_oak", "south"),
  e: B.stairs("dark_oak", "east"),
  w: B.stairs("dark_oak", "west"),
  R: ["lectern", { facing: "north" }],
  l: B.lantern(false),
  L: B.lantern(true),
  I: B.chain("y"),
};

export function build(g) {
  const rows = grid.map((layer) => layer.map((row) => row.join("")));
  layers(g, ORIGIN, legend, rows);
}
