// PART 4 facades, glazing and entry: the south glass wall with its posts and slider lintels, the atrium ring glass and
// posts, the north clerestory and feature wall, the orange front door, the west and east windows and the utility door.
// Only into air: the shell (part 1) leaves every opening air, and each helper skips any cell already filled.
// Not here (plan.md ownership): the gable-end and ring glass at y=6 (part 3, roofs).
import { post, glass_bay, slider_gap, clerestory, orange_entry, ledgestone_wall, BEAM_X, SLIDERS } from "../vocab.mjs";

// the utility door: dark_oak_door, open, hung on the west side of its cell (plan.md OPENINGS: x=10, z=10, y=2..3)
function utility_door(g, x, y, z, facing = "west") {
  if (!g.isAir(x, y, z) || !g.isAir(x, y + 1, z)) return;
  const half = (h) => ({ facing, half: h, hinge: "left", open: "true", powered: "false" });
  g.set(x, y, z, "dark_oak_door", half("lower"));
  g.set(x, y + 1, z, "dark_oak_door", half("upper"));
}

// the atrium ring (plan.md: x=16 and x=22 at z=12..17; z=11 and z=18 at x=17..21), glazed at y=2..4, the two doors
// at x=19..20 y=2..3 left open, and a dark_oak_log lintel post at x=19, y=4 above each door
function atrium_ring(g) {
  glass_bay(g, 12, 17, 16, 2, 4, { axis: "z" });
  glass_bay(g, 12, 17, 22, 2, 4, { axis: "z" });
  for (const z of [11, 18]) {
    glass_bay(g, 17, 18, z, 2, 4);
    glass_bay(g, 21, 21, z, 2, 4);
    glass_bay(g, 20, 20, z, 4, 4);
    post(g, 19, z, 4, 4);
  }
  for (const [x, z] of [[16, 11], [22, 11], [16, 18], [22, 18]]) post(g, x, z, 2, 4);
}

// the south garden wall (z=25): posts on every beam line, glass between them, the three slider gaps glazed at y=4
function south_wall(g) {
  for (const x of BEAM_X) post(g, x, 25, 2, 4);
  for (const [a, b] of [[11, 12], [17, 18], [23, 24], [29, 30]]) glass_bay(g, a, b, 25, 2, 4);
  for (const s of SLIDERS) slider_gap(g, s.x[0], s.z, 2);
}

export function build(g) {
  south_wall(g);
  atrium_ring(g);
  // the two house corners on the street face (the south corners are beam-line posts above)
  post(g, 10, 8, 2, 4);
  post(g, 31, 8, 2, 4);
  // north street face: clerestory strip, feature wall, orange door
  clerestory(g, 22, 8, 4);
  ledgestone_wall(g, 11, 17, 7, 1, 4, 25);
  orange_entry(g, 19, 9, "north");
  // west and east windows, the kitchen utility door
  glass_bay(g, 14, 16, 10, 3, 4, { axis: "z" }); // dining window
  glass_bay(g, 10, 12, 31, 3, 4, { axis: "z" }); // bedroom 1 window
  glass_bay(g, 15, 16, 31, 4, 4, { axis: "z" }); // bath clerestory
  glass_bay(g, 21, 23, 31, 2, 4, { axis: "z" }); // master bedroom, full height
  utility_door(g, 10, 2, 10);
}
