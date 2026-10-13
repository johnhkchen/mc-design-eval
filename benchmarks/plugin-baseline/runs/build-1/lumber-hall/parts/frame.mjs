// Part 3, Timber frame: the first-floor and loft storeys on both faces and both sides, the jetty brackets, the head plates
// (y17 and the cornice y23), the hoist beams and hoods, and the gable frames. The north face is drawn; the south face is
// its mirror (z -> 37 - z, facings flipped). Writes only into air: earlier parts' cells are left alone.
import { FRAME_LOG, FRAME_WOOD, INFILL, TRIM_STAIRS, NORTH_FIRST_Z, NORTH_LOFT_Z, mirrorZ, frameBay, beam, jettyBracket, hoistBeam, hoistHood } from "../vocab.mjs";

// first floor: y13..17 (sill y12 is the floor slab, head plate y17); loft: y19..22 (sill y18, head plate y23)
const FIRST = { y0: 13, y1: 17 };
const LOFT = { y0: 19, y1: 22 };

// front bays: one post rhythm on every storey and both faces, posts over the shop piers (x 9, 17, 25, 33) and the wall lines
// (13, 21, 29): x 2, 5, 9, 13, 17, 21, 25, 29, 33, 37, 40. Every closed bay takes the same brace; door bays leave x 11..12 open
const BAYS = [
  [2, 5, "brace"], [5, 9, "window"], [9, 13, "door"], [13, 17, "brace"], [17, 21, "window"],
  [21, 25, "window"], [25, 29, "brace"], [29, 33, "door"], [33, 37, "window"], [37, 40, "brace"],
];
const POSTS = [2, 5, 9, 13, 17, 21, 25, 29, 33, 37, 40];
const DOOR_COLS = [[11, 12], [30, 31]];

// side walls (x 2 and x 40): posts every 4 on z, one window (air) per third bay at z 7, 19, 31
const SIDE_POSTS = [5, 9, 13, 17, 21, 25, 29];
const SIDE_WINDOWS = [7, 19, 31];
const SIDE_WINDOW_ROWS = { first: [14, 15], loft: [20, 21] };

// a door bay: posts at both ends, the loading doors take the two cells next to the post that is nearer the hoist beam
// (x 11..12 in the bay 9..13, x 30..31 in 29..33); the one cell left over is calcite
function doorBay(g, x0, x1, y0, y1, z) {
  const spare = DOOR_COLS.some(([xa]) => xa === x0 + 2) ? x0 + 1 : x1 - 1;
  for (const x of [x0, x1]) for (let y = y0; y <= y1; y++) g.set(x, y, z, FRAME_LOG, { axis: "y" });
  for (let y = y0; y <= y1; y++) g.set(spare, y, z, INFILL);
}

// the first-floor and loft storey frames on one face, at the front planes zF (first) and zL (loft)
function storeyFront(g, zF, zL) {
  for (const [x0, x1, fill] of BAYS) {
    if (fill === "door") {
      doorBay(g, x0, x1, FIRST.y0, FIRST.y1, zF);
      doorBay(g, x0, x1, LOFT.y0, LOFT.y1, zL);
    } else {
      frameBay(g, x0, x1, FIRST.y0, FIRST.y1, zF, { fill });
      frameBay(g, x0, x1, LOFT.y0, LOFT.y1, zL, { fill });
    }
  }
  // lintels over the loading doors (the doors take y13..14 with the transom on 15; loft doors 19..20, transom 21)
  for (const [xa, xb] of DOOR_COLS) {
    beam(g, xa, xb, 16, zF, "x");
    beam(g, xa, xb, 22, zL, "x");
  }
}

// head plates: the first-floor head plate (y17) and the loft's cornice (y23) run the whole front
function headPlates(g, zF, zL) {
  beam(g, 2, 40, 17, zF, "x");
  beam(g, 2, 40, 23, zL, "x");
}

// jetty brackets: one under every first-floor post (y11, out of the sill at y12) and one under every loft post (y17)
function brackets(g, zF, zL, facing) {
  for (const x of POSTS) {
    jettyBracket(g, x, 11, zF, facing);
    jettyBracket(g, x, 17, zL, facing);
  }
}

// side walls: calcite between posts, the window cells left open for the window units (P5)
function sideWalls(g) {
  const storeys = [
    { y0: FIRST.y0, y1: FIRST.y1, zs: range(5, 32), win: SIDE_WINDOW_ROWS.first },
    { y0: LOFT.y0, y1: LOFT.y1, zs: range(4, 33), win: SIDE_WINDOW_ROWS.loft },
  ];
  for (const x of [2, 40]) {
    for (const { y0, y1, zs, win } of storeys) {
      for (const z of zs) {
        for (let y = y0; y <= y1; y++) {
          if (SIDE_WINDOWS.includes(z) && y >= win[0] && y <= win[1]) continue; // window opening
          if (SIDE_POSTS.includes(z)) g.set(x, y, z, FRAME_LOG, { axis: "y" });
          else g.set(x, y, z, INFILL);
        }
      }
    }
  }
}

function range(a, b) {
  const out = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

export function build(g) {
  // hoist beams and hoods first, so the beam's cells at the gable plane are kept
  for (const x of [11, 30]) {
    hoistBeam(g, x, 0, 3, "north");
    hoistBeam(g, x, 34, 37, "south");
  }
  for (const x0 of [10, 29]) {
    hoistHood(g, x0, 1, "north");
    hoistHood(g, x0, 34, "south");
  }

  // north face (front planes z 4 first floor, z 3 loft); the south face is the mirror
  const zF = NORTH_FIRST_Z, zL = NORTH_LOFT_Z;
  storeyFront(g, zF, zL);
  headPlates(g, zF, zL);
  brackets(g, zF, zL, "south"); // the wall lies to the south of a north bracket

  // south face: mirror z, facings flipped
  const sF = mirrorZ(zF), sL = mirrorZ(zL);
  storeyFront(g, sF, sL);
  headPlates(g, sF, sL);
  brackets(g, sF, sL, "north");

  sideWalls(g);

  // gable frames: the wall triangles at the roof's gable planes (z 3 and z 34), the storey posts carried up
  calmGable(g, 2, 21, zL, [5, 9, 13, 17]);
  calmGable(g, 21, 40, zL, [25, 29, 33, 37]);
  calmGable(g, 2, 21, sL, [5, 9, 13, 17]);
  calmGable(g, 21, 40, sL, [25, 29, 33, 37]);
}

// a calm gable: rafters on the roof line, the storey posts carried up to them, one straight tie beam at y 28 (over the
// gable loading doors, which keep x 11..12 / 30..31 open at y 24..27), the same single brace in the two outer bays
// (rising toward the middle), and plain calcite between
function calmGable(g, lo, hi, z, posts) {
  const eave = 24, TIE = 28, mid = (lo + hi) / 2;
  const top = (x) => eave + Math.min(x - lo, hi - x);
  const door = (x) => x === Math.floor(mid) || x === Math.ceil(mid);
  for (let x = lo; x <= hi; x++) {
    if (x === lo || x === hi) g.set(x, eave, z, FRAME_WOOD, { axis: "x" });
    else g.set(x, top(x), z, FRAME_LOG, { axis: "x" });
  }
  for (const x of posts) for (let y = eave; y < top(x); y++) g.set(x, y, z, FRAME_LOG, { axis: "y" });
  for (let x = lo + 1; x < hi; x++) if (top(x) > TIE && !door(x) && g.isAir(x, TIE, z)) g.set(x, TIE, z, FRAME_LOG, { axis: "x" });
  // end bays of the tie span: tie beam also across the door columns
  for (let x = lo + 1; x < hi; x++) if (door(x) && g.isAir(x, TIE, z)) g.set(x, TIE, z, FRAME_LOG, { axis: "x" });
  const west = (x0, facing) => { for (let k = 1; k <= 3; k++) g.set(x0 + (facing === "east" ? k : 4 - k), eave + (k - 1), z, TRIM_STAIRS, { facing, half: "bottom", shape: "straight" }); };
  const [a, b, c, d] = posts;
  west(a, "east");
  west(c, "west");
  for (let x = lo + 1; x < hi; x++) for (let y = eave; y < top(x); y++) {
    if (door(x) && y <= 27) continue;
    if (g.isAir(x, y, z)) g.set(x, y, z, INFILL);
  }
}
