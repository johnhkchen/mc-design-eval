// Part: shells plots 0-3 (gin, school, farmhouse, smithy): plinths, walls, floors, posts, beams. Openings and RESERVED cells are
// never written (a stored air block would lock the cell against the later trades), so every wall goes through put() with holes.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { boardWall,pierRow, shaftFrame } from "../vocab.mjs";

const SL = "minecraft:stripped_spruce_log";
const inBox = (x, y, z, b) => x >= b[0] && x <= b[3] && y >= b[1] && y <= b[4] && z >= b[2] && z <= b[5];

// A run of wall cells (inclusive box) written as block (or [block, state]) except in the holes.
function put(g, box, what, holes = []) {
  const [b, s] = Array.isArray(what) ? what : [what];
  for (let x = box[0]; x <= box[3]; x++)
    for (let y = box[1]; y <= box[4]; y++)
      for (let z = box[2]; z <= box[5]; z++)
        if (!holes.some((h) => inBox(x, y, z, h))) s ? g.set(x, y, z, b, s) : g.set(x, y, z, b);
}
const post = (g, x, z, y0, y1) => put(g, [x, y0, z, x, y1, z], B.pillar(SL, "y"));

// Wall of a rectangle ring x0..x1 z0..z1, y0..y1: plinth y0 (if plinth), body, vertical posts, beam rows.
function ring(g, [x0, z0, x1, z1], { y0, y1, plinth, body, plinthBlock = "minecraft:cobblestone", holes, posts = [], beams = [], skip = [] }) {
  const runs = [[x0, z0, x1, z0], [x0, z1, x1, z1], [x0, z0 + 1, x0, z1 - 1], [x1, z0 + 1, x1, z1 - 1]];
  for (const [a, b, c, d] of runs) {
    if (plinth) put(g, [a, y0, b, c, y0, d], plinthBlock, holes);
    put(g, [a, y0 + (plinth ? 1 : 0), b, c, y1, d], body, [...holes, ...skip]);
  }
  for (const [x, z] of posts) put(g, [x, y0, z, x, y1, z], B.pillar(SL, "y"), holes);
  for (const y of beams)
    for (const [a, b, c, d] of runs) put(g, [a, y, b, c, y, d], B.pillar(SL, a === c ? "z" : "x"), holes);
}

// Board-and-batten run for the open-front buildings: field plus a batten every 3rd column.
function batten(g, [x0, z0, x1, z1], y0, y1, plank, holes = []) {
  const alongX = z0 === z1;
  put(g, [x0, y0, z0, x1, y1, z1], plank, holes);
  for (let i = 0; i <= (alongX ? x1 - x0 : z1 - z0); i += 3) {
    const x = alongX ? x0 + i : x0, z = alongX ? z0 : z0 + i;
    put(g, [x, y0, z, x, y1, z], B.pillar(SL, "y"), holes);
  }
}

function gin(g) {
  const holes = [
    [4, 0, 9, 7, 4, 9], [5, 7, 9, 6, 8, 9],            // wagon door, hay door
    [5, 1, 16, 6, 3, 16], [3, 2, 16, 3, 3, 16], [8, 2, 16, 8, 3, 16], // back door, windows
    [1, 2, 11, 1, 3, 11], [10, 2, 11, 10, 3, 11],      // ground side windows
    [1, 8, 11, 1, 8, 11], [10, 8, 11, 10, 8, 11], [1, 8, 14, 1, 8, 14], [10, 8, 14, 10, 8, 14], // loft windows
    [10, 2, 14, 10, 2, 14],                            // shaft port
  ];
  const jambs = [[1, 9], [10, 9], [1, 16], [10, 16], [3, 9], [8, 9]];
  ring(g, [1, 9, 10, 16], { y0: 1, y1: 9, plinth: true, body: "minecraft:birch_planks", holes, posts: jambs, beams: [6, 9] });
  // floor: cobblestone at grade, the shaft frame's 3x3 left to shaftFrame
  put(g, [2, 0, 10, 9, 0, 15], "minecraft:cobblestone", [[6, 0, 13, 8, 0, 15]]);
  shaftFrame(g, 6, 0, 13, { port: true });
  // loft floor y6 with the shaft hole and the ladder hole
  put(g, [2, 6, 10, 9, 6, 15], "minecraft:spruce_planks", [[7, 6, 14, 7, 6, 14], [2, 6, 15, 2, 6, 15]]);
}

function school(g) {
  const stone = "minecraft:stone_bricks", wall = "minecraft:white_concrete";
  const clsHoles = [[13, 2, 13, 13, 5, 13], [22, 2, 13, 22, 5, 13], [13, 2, 15, 13, 5, 15], [22, 2, 15, 22, 5, 15], [17, 5, 17, 18, 5, 17],
    [17, 2, 12, 18, 3, 12]];
  const clkHoles = [[17, 2, 9, 18, 4, 9], [15, 3, 10, 15, 4, 10], [20, 3, 10, 20, 4, 10]];
  ring(g, [13, 12, 22, 17], { y0: 1, y1: 6, plinth: true, plinthBlock: stone, body: wall, holes: clsHoles,
    posts: [[13, 12], [22, 12], [13, 17], [22, 17]] });
  // cloakroom: its back is the classroom's front wall (z12), so it only builds the front and sides
  const sides = [[15, 9, 20, 9], [15, 10, 15, 11], [20, 10, 20, 11]];
  for (const [a, b, c, d] of sides) {
    put(g, [a, 1, b, c, 1, d], stone, clkHoles);
    put(g, [a, 2, b, c, 4, d], wall, clkHoles);
  }
  for (const [x, z] of [[15, 9], [20, 9]]) post(g, x, z, 2, 4);
  // floors y1 (stand y2)
  put(g, [14, 1, 13, 21, 1, 16], "minecraft:spruce_planks");
  put(g, [16, 1, 10, 19, 1, 12], "minecraft:spruce_planks");
  // bell cupola base: solid white through the roof (y 11..13), corner posts to y 15; the cap (roofs part) sits on it
  put(g, [16, 11, 13, 19, 13, 16], wall);
  for (const [x, z] of [[16, 13], [19, 13], [16, 16], [19, 16]]) put(g, [x, 14, z, x, 15, z], B.fence("pale_oak"));
}

function farm(g) {
  const holes = [
    [29, 2, 10, 30, 3, 10], [26, 3, 10, 27, 4, 10], [32, 3, 10, 33, 4, 10],   // door + sidelight, windows
    [25, 3, 12, 25, 4, 12], [34, 3, 12, 34, 4, 12],                           // side windows
    [31, 2, 14, 31, 3, 14],                                                    // body -> kitchen door
    [33, 0, 14, 34, 13, 16],                                                   // chimney stack
  ];
  // footing line y1: cobblestone piers at corners and every 3, spruce planks (floor edge) between
  const line = (x0, z0, x1, z1) => {
    const alongX = z0 === z1, n = alongX ? x1 - x0 : z1 - z0;
    for (let i = 0; i <= n; i++) {
      const x = alongX ? x0 + i : x0, z = alongX ? z0 : z0 + i;
      put(g, [x, 1, z, x, 1, z], i % 3 === 0 || i === n ? "minecraft:cobblestone" : "minecraft:spruce_planks", holes);
    }
  };
  line(25, 10, 34, 10); line(25, 14, 32, 14); line(25, 11, 25, 13); line(34, 11, 34, 13);
  // body walls y2..7
  const bw = (box) => boardWall(g, box, { plank: "minecraft:spruce_planks", batten: 3, beams: [5], leave: holes });
  bw([25, 2, 10, 34, 7, 10]); bw([25, 2, 14, 32, 7, 14]);
  bw([25, 2, 11, 25, 7, 13]); bw([34, 2, 11, 34, 7, 13]);
  // ell: footing, walls y2..4, floor
  line(26, 15, 26, 17); line(32, 15, 32, 17); line(26, 17, 32, 17);
  const eh = [[26, 2, 16, 26, 3, 16], [29, 3, 17, 30, 4, 17], [32, 2, 15, 32, 2, 15]];
  const ew = (box) => boardWall(g, box, { plank: "minecraft:spruce_planks", batten: 3, beams: [4], leave: eh });
  ew([26, 2, 15, 26, 4, 17]); ew([32, 2, 15, 32, 4, 17]); ew([27, 2, 17, 31, 4, 17]);
  // floors y1 and the loft floor y6 (flight cells left open)
  put(g, [26, 1, 11, 33, 1, 13], "minecraft:spruce_planks");
  put(g, [27, 1, 14, 31, 1, 14], "minecraft:spruce_planks");
  put(g, [27, 1, 15, 31, 1, 16], "minecraft:spruce_planks");
  put(g, [26, 6, 11, 33, 6, 13], "minecraft:spruce_planks", [[27, 6, 13, 30, 6, 13]]);
}

function smithy(g) {
  const dok = "minecraft:dark_oak_planks", stone = "minecraft:cobblestone";
  for (const [x, z] of [[37, 9], [40, 9], [44, 9], [37, 15], [44, 15]]) post(g, x, z, 1, 4);
  put(g, [37, 5, 9, 44, 5, 9], B.pillar(SL, "x"));
  const wh = [[37, 2, 12, 37, 3, 12], [44, 1, 11, 44, 2, 12], [40, 1, 15, 40, 1, 15]];
  put(g, [38, 1, 15, 43, 1, 15], stone, wh);
  put(g, [37, 1, 10, 37, 1, 14], stone, wh);
  put(g, [44, 1, 10, 44, 1, 14], stone, wh);
  batten(g, [38, 15, 43, 15], 2, 4, dok, wh);
  batten(g, [37, 10, 37, 14], 2, 4, dok, wh);
  batten(g, [44, 10, 44, 14], 2, 4, dok, wh);
  put(g, [38, 0, 10, 43, 0, 14], stone);   // forge floor (packed hearth stone)
  put(g, [45, 0, 9, 46, 0, 15], stone);    // lean-to floor
  for (const z of [9, 12, 15]) post(g, 46, z, 1, 3);
}

export function build(g) {
  gin(g); school(g); farm(g); smithy(g);
}
