// Timber frame (P2): the jettied upper storey y6..10 on all four faces, built whole with calcite. The sill beam at y=6 and
// the head plate at y=10 run round the storey; posts stand at the bays (y=7..9); the jetty brackets hang under the front
// sill; one diagonal brace in each front and west side bay, mirrored in the east; calcite fills every panel the frame
// leaves. The upper windows and the back window stay air for the fittings part (P4). The gable frames at x=5 and x=17
// are the timber framer's (plan ROOFS / RESERVED).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { jettyBracket, framePanel, braceStair, gableFrame } from "../vocab.mjs";

const post = (g, x, y, z) => g.set(x, y, z, ...B.log("stripped_dark_oak", "y"));
const beam = (g, x, y, z, axis) => g.set(x, y, z, ...B.wood("stripped_dark_oak", axis));
const calcite = (g, x, y, z) => { if (g.isAir(x, y, z)) g.set(x, y, z, ...B.block("calcite")); };

// A calcite panel in the plane x (the side walls), cells z0..z1 by y0..y1, the hole [z0,y0,z1,y1] left as air.
function sidePanel(g, x, z0, z1, y0, y1, hole = null) {
  for (let z = z0; z <= z1; z++)
    for (let y = y0; y <= y1; y++) {
      if (hole && z >= hole[0] && z <= hole[2] && y >= hole[1] && y <= hole[3]) continue;
      calcite(g, x, y, z);
    }
}

// The street front, z=7 (the jetty stands one north of the ground wall).
function front(g) {
  const z = 7;
  for (let x = 5; x <= 17; x++) { beam(g, x, 6, z, "x"); beam(g, x, 10, z, "x"); }
  for (const x of [5, 8, 11, 14, 17]) for (let y = 7; y <= 9; y++) post(g, x, y, z);
  for (const x of [5, 8, 14, 17]) jettyBracket(g, x, 5, z, "south");
  braceStair(g, 7, 7, z, "w");
  braceStair(g, 15, 7, z, "e");
  framePanel(g, 6, 7, 7, 9, z);
  framePanel(g, 15, 16, 7, 9, z);
  framePanel(g, 9, 10, 7, 9, z, { hole: [9, 8, 10, 9] });
  framePanel(g, 12, 13, 7, 9, z, { hole: [12, 8, 13, 9] });
}

// The back, z=17, without a jetty. The workshop roof meets x=5..13 here, so those panels are solid calcite.
function back(g) {
  const z = 17;
  for (let x = 5; x <= 17; x++) { beam(g, x, 6, z, "x"); beam(g, x, 10, z, "x"); }
  for (const x of [5, 8, 11, 14, 17]) for (let y = 7; y <= 9; y++) post(g, x, y, z);
  framePanel(g, 6, 7, 7, 9, z);
  framePanel(g, 9, 10, 7, 9, z);
  framePanel(g, 12, 13, 7, 9, z);
  framePanel(g, 15, 16, 7, 9, z, { hole: [15, 8, 16, 9] });
}

// A side wall, x = 5 (west) or x = 17 (east), z=7..17. Posts at z=7,10,13,17; the corner cells belong to the front and back.
// The west wall's panel z=11..12 takes a brace rising north to the post at z=10 (a mirror of the front braces); the east
// panel there is calcite, since the east stack stands just outside it.
function side(g, x, west) {
  for (let z = 8; z <= 16; z++) { beam(g, x, 6, z, "z"); beam(g, x, 10, z, "z"); }
  for (const z of [10, 13]) for (let y = 7; y <= 9; y++) post(g, x, y, z);
  sidePanel(g, x, 8, 9, 7, 9, [8, 8, 9, 9]);
  sidePanel(g, x, 14, 15, 7, 9, [14, 8, 15, 9]);
  sidePanel(g, x, 16, 16, 7, 9);
  if (west) {
    // the brace: foot at (z=12, y=7), rising north to the post at z=10
    g.set(x, 7, 12, ...B.stairs("dark_oak", "north", "top"));
    g.set(x, 8, 11, ...B.stairs("dark_oak", "north", "top"));
    g.set(x, 9, 11, ...B.stairs("dark_oak", "north", "top"));
  }
  sidePanel(g, x, 11, 12, 7, 9);
}

export function build(g) {
  front(g);
  back(g);
  side(g, 5, true);
  side(g, 17, false);
  gableFrame(g, 5, 7, 17, 11, 15);
  gableFrame(g, 17, 7, 17, 11, 15);
}
