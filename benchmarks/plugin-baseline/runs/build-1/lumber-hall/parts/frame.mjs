// Part 3, Timber frame: the first-floor and loft storeys on both faces and both sides, the jetty brackets, the head plates
// (y17 and the cornice y23), the hoist beams and hoods, and the gable frames. The north face is drawn; the south face is
// its mirror (z -> 37 - z, facings flipped). Writes only into air: earlier parts' cells are left alone.
import { FRAME_LOG, INFILL, NORTH_FIRST_Z, NORTH_LOFT_Z, mirrorZ, frameBay, beam, jettyBracket, gableFrame, hoistBeam, hoistHood } from "../vocab.mjs";

// first floor: y13..17 (sill y12 is the floor slab, head plate y17); loft: y19..22 (sill y18, head plate y23)
const FIRST = { y0: 13, y1: 17 };
const LOFT = { y0: 19, y1: 22 };

// front bays (plan FACADES): posts at x 2,5,9,10,13,17,21,25,29,32,33,37,40; door bays keep x 11..12 and 30..31 open
const BAYS = [
  [2, 5, "mann"], [5, 9, "window"], [10, 13, "door"], [13, 17, "brace"], [17, 21, "window"],
  [21, 25, "window"], [25, 29, "brace"], [29, 32, "door"], [33, 37, "window"], [37, 40, "brace"],
];
const POSTS = [2, 5, 9, 10, 13, 17, 21, 25, 29, 32, 33, 37, 40];
const DOOR_COLS = [[11, 12], [30, 31]];

// side walls (x 2 and x 40): posts every 4 on z, one window (air) per third bay at z 7, 19, 31
const SIDE_POSTS = [5, 9, 13, 17, 21, 25, 29];
const SIDE_WINDOWS = [7, 19, 31];
const SIDE_WINDOW_ROWS = { first: [14, 15], loft: [20, 21] };

// the first-floor and loft storey frames on one face, at the front planes zF (first) and zL (loft)
function storeyFront(g, zF, zL) {
  for (const [x0, x1, fill] of BAYS) {
    frameBay(g, x0, x1, FIRST.y0, FIRST.y1, zF, { fill });
    frameBay(g, x0, x1, LOFT.y0, LOFT.y1, zL, { fill });
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

  // gable frames: the wall triangles at the roof's gable planes (z 3 and z 34), king post pairs at x 11..12 and 30..31
  gableFrame(g, 2, 21, zL, "north");
  gableFrame(g, 21, 40, zL, "north");
  gableFrame(g, 2, 21, sL, "south");
  gableFrame(g, 21, 40, sL, "south");
}
