// Plot 1 Arts & Industries masonry: body ring, corner pavilions, naves with their end gables, rotunda and drum, the eight
// entrance towers, big arched windows and doors, body and clerestory windows, the four entrance diamonds.
// Solid walls first, then the openings are glazed over them (the glass is this part's own). Roofs, caps, lanterns and
// glow are the roofs part's.
import { gableDiamond } from "../vocab.mjs";

const BR = "bricks", PA = "polished_andesite", YT = "yellow_terracotta", LB = "light_blue_terracotta";
const OT = "orange_terracotta", GLASS = "gray_stained_glass_pane", PANE = "glass_pane";

// Solid material by height: plinth at y1, yellow bands at y3 and y6 (the eave band of the body).
const bandMat = (y) => (y === 1 ? PA : y === 3 || y === 6 ? YT : BR);
// Naves and rotunda carry a light blue course under the eave at y10.
const naveMat = (y) => (y === 10 ? LB : bandMat(y));

// Pane states: a pane in a wall joins the wall along it.
const JOIN_X = { north: "false", south: "false", east: "true", west: "true" };
const JOIN_Z = { north: "true", south: "true", east: "false", west: "false" };
const pane = (g, x, y, z, block, along) => g.set(x, y, z, block, along === "x" ? JOIN_X : JOIN_Z);

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// Octagon: the box cut back by ch cells at each corner.
function inOct(x, z, [x0, z0, x1, z1, ch]) {
  if (x < x0 || x > x1 || z < z0 || z > z1) return false;
  const a = x - x0, b = x1 - x, c = z - z0, d = z1 - z;
  return a + c >= ch && b + c >= ch && a + d >= ch && b + d >= ch;
}

// The 1-thick ring cells of an octagon: inside, with an outside neighbour.
function octCells(x0, z0, x1, z1, ch) {
  const box = [x0, z0, x1, z1, ch], out = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!inOct(x, z, box)) continue;
    if (!inOct(x - 1, z, box) || !inOct(x + 1, z, box) || !inOct(x, z - 1, box) || !inOct(x, z + 1, box)) out.push([x, z]);
  }
  return out;
}

// A column of cells from y0 to y1, mat(y) per row.
function column(g, x, z, y0, y1, mat) {
  for (let y = y0; y <= y1; y++) g.set(x, y, z, mat(y));
}

// Rectangular ring (1 thick) from y0 to y1.
function ringRect(g, x0, x1, z0, z1, y0, y1, mat) {
  for (const x of range(x0, x1)) for (const z of range(z0, z1))
    if (x === x0 || x === x1 || z === z0 || z === z1) column(g, x, z, y0, y1, mat);
}

export function build(g) {
  // Corner pavilions: 5 x 5 rings to y7, quoins alternating yellow and brick up the corners.
  for (const [x0, x1, z0, z1] of [[61, 65, 0, 4], [97, 101, 0, 4], [61, 65, 37, 41], [97, 101, 37, 41]]) {
    ringRect(g, x0, x1, z0, z1, 1, 7, bandMat);
    for (const x of [x0, x1]) for (const z of [z0, z1]) for (let y = 2; y <= 7; y++) g.set(x, y, z, y % 2 === 0 ? YT : BR);
  }

  // Body ring: the outer walls of the four quadrants, broken where the naves and pavilions meet it.
  for (const z of [2, 39]) for (const x of [...range(66, 76), ...range(86, 96)]) column(g, x, z, 1, 6, bandMat);
  for (const x of [62, 100]) for (const z of [...range(5, 15), ...range(25, 36)]) column(g, x, z, 1, 6, bandMat);

  // North-south nave x77..85, z0..41: side walls (open across the crossing), end walls, gables to y15.
  for (const x of [77, 85]) for (const z of range(0, 41)) if (z < 13 || z > 27) column(g, x, z, 1, 10, naveMat);
  for (const z of [0, 41]) for (const x of range(77, 85)) column(g, x, z, 1, 10, naveMat);
  for (const z of [0, 41]) for (let k = 0; k <= 4; k++) for (const x of range(77 + k, 85 - k)) g.set(x, 11 + k, z, BR);

  // East-west nave x61..101, z16..24: side walls (open across the crossing), end walls, gables to y15.
  for (const z of [16, 24]) for (const x of [...range(61, 74), ...range(88, 101)]) column(g, x, z, 1, 10, naveMat);
  for (const x of [61, 101]) for (const z of range(16, 24)) column(g, x, z, 1, 10, naveMat);
  for (const x of [61, 101]) for (let k = 0; k <= 4; k++) for (const z of range(16 + k, 24 - k)) g.set(x, 11 + k, z, BR);

  // Rotunda: octagon x74..88, z13..27, chamfer 4, to y10.
  for (const [x, z] of octCells(74, 13, 88, 27, 4)) column(g, x, z, 1, 10, naveMat);

  // Rotunda ceiling: full bricks at y10 across the octagon's inside, so the drum has a floor to stand on (a bottom slab
  // would leave half a block of air under the drum's walls).
  const ringRot = new Set(octCells(74, 13, 88, 27, 4).map(([x, z]) => `${x},${z}`));
  for (const x of range(74, 88)) for (const z of range(13, 27))
    if (inOct(x, z, [74, 13, 88, 27, 4]) && !ringRot.has(`${x},${z}`)) g.set(x, 10, z, BR);

  // Drum: octagon x76..86, z15..25, chamfer 3, y11..14, glazed on every second cell at y12..13.
  for (const [x, z] of octCells(76, 15, 86, 25, 3)) {
    column(g, x, z, 11, 14, () => BR);
    if ((x + z) % 2 === 0) for (const y of [12, 13]) pane(g, x, y, z, GLASS, x === 76 || x === 86 ? "z" : "x");
  }

  // Entrance towers (2 x 2, y1..15), light blue band at y14.
  const towers = [[77, 78, 0, 1], [84, 85, 0, 1], [77, 78, 40, 41], [84, 85, 40, 41],
    [61, 62, 16, 17], [61, 62, 23, 24], [100, 101, 16, 17], [100, 101, 23, 24]];
  const towerMat = (y) => (y === 1 ? PA : y === 14 ? LB : bandMat(y));
  for (const [x0, x1, z0, z1] of towers) for (const x of range(x0, x1)) for (const z of range(z0, z1)) column(g, x, z, 1, 15, towerMat);
  // Tower slits on the outer faces, y9..11.
  for (const x of [77, 84]) for (const z of [0, 41]) for (const y of [9, 10, 11]) pane(g, x, y, z, GLASS, "x");
  for (const z of [16, 23]) for (const x of [61, 101]) for (const y of [9, 10, 11]) pane(g, x, y, z, GLASS, "z");

  // Big arched windows on the four gables (x79..83 or z18..22, y5..9) with orange voussoirs above; doors below (y1..3).
  for (const z of [0, 41]) {
    for (const x of range(79, 83)) {
      for (const y of range(5, 9)) pane(g, x, y, z, GLASS, "x");
      g.set(x, 10, z, OT);
    }
    for (const x of range(80, 82)) for (const y of [1, 2, 3]) pane(g, x, y, z, PANE, "x");
  }
  for (const x of [61, 101]) {
    for (const z of range(18, 22)) {
      for (const y of range(5, 9)) pane(g, x, y, z, GLASS, "z");
      g.set(x, 10, z, OT);
    }
    for (const z of range(19, 21)) for (const y of [1, 2, 3]) pane(g, x, y, z, PANE, "z");
  }

  // Body windows: single openings y2..4 with an orange hood at y5.
  for (const z of [2, 39]) for (const x of [67, 70, 73, 89, 92, 95]) {
    for (const y of [2, 3, 4]) pane(g, x, y, z, GLASS, "x");
    g.set(x, 5, z, OT);
  }
  for (const x of [62, 100]) for (const z of [6, 9, 12, 28, 31, 34]) {
    for (const y of [2, 3, 4]) pane(g, x, y, z, GLASS, "z");
    g.set(x, 5, z, OT);
  }

  // Clerestory: glass every second cell at y8..9 on both long walls of each nave.
  for (const z of [16, 24]) for (const x of [...range(63, 73).filter((x) => x % 2 === 1), ...range(89, 99).filter((x) => x % 2 === 1)])
    for (const y of [8, 9]) pane(g, x, y, z, GLASS, "x");
  for (const x of [77, 85]) for (const z of [...range(3, 11).filter((z) => z % 2 === 1), ...range(29, 37).filter((z) => z % 2 === 1)])
    for (const y of [8, 9]) pane(g, x, y, z, GLASS, "z");

  // Entrance diamonds: oculus at y13 with light blue and yellow rings, on the gable triangle.
  gableDiamond(g, 81, 13, 0, "north", { replace: true });
  gableDiamond(g, 81, 13, 41, "south", { replace: true });
  gableDiamond(g, 61, 13, 20, "west", { replace: true });
  gableDiamond(g, 101, 13, 20, "east", { replace: true });
}
