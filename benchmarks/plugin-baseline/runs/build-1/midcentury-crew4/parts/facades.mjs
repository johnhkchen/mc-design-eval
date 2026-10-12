// PART 4 facades, glazing and entry (plan.md FACADES and OPENINGS; elements.md items 4, 7-10, 12-16, 16).
// Writes only into air: the shell leaves every opening as air, and the earlier parts own the rest.
// Order matters: posts first, then the glass between them, so a glass fill never takes a post's cell.
import {
  BEAM_LINES, post, glass_bay, slider_gap, clerestory, orange_entry, ledgestone_wall,
} from "../vocab.mjs";

const SOUTH = 25; // south (garden) glass wall, z
const NORTH = 8; // street wall, z
const RING = { xW: 16, xE: 22, zN: 11, zS: 18 }; // atrium ring lines (plan.md ATRIUM, 17..21 x 12..17)

/** Utility door from the carport into the kitchen: dark_oak_door, open, lower and upper halves (plan.md OPENINGS). */
function utilityDoor(g, x, z, facing, y0 = 2, y1 = 3) {
  for (let y = y0; y <= y1; y++) {
    if (!g.isAir(x, y, z)) continue;
    g.set(x, y, z, "dark_oak_door", { facing, half: y === y0 ? "lower" : "upper", hinge: "left", open: "true", powered: "false" });
  }
}

export function build(g) {
  // 1. Structure: posts on every beam line of the south wall, the north corners, the atrium ring corners and the
  //    lintel post over the atrium doors (y=4 only, plan.md Notes).
  for (const x of BEAM_LINES) post(g, x, SOUTH);
  post(g, 10, NORTH);
  post(g, 31, NORTH);
  for (const x of [RING.xW, RING.xE]) for (const z of [RING.zN, RING.zS]) post(g, x, z);
  post(g, 19, RING.zN, 4, 4);
  post(g, 19, RING.zS, 4, 4);

  // 2. South garden wall: glass between the posts; the three sliders keep y=2..3 open with glass only at y=4.
  glass_bay(g, 11, 12, SOUTH, 2, 4);
  glass_bay(g, 17, 18, SOUTH, 2, 4);
  glass_bay(g, 23, 24, SOUTH, 2, 4);
  glass_bay(g, 29, 30, SOUTH, 2, 4);
  for (const x of [14, 20, 26]) slider_gap(g, x, SOUTH);

  // 3. Atrium ring: glass on the long sides (x=16, x=22) and the gallery/living walls (z=11, z=18). The atrium doors
  //    at x=19..20 keep y=2..3 open; x=19 has the lintel post at y=4 and x=20 has glass above the door.
  for (const x of [RING.xW, RING.xE]) glass_bay(g, 12, 17, x, 2, 4, { axis: "z" });
  for (const z of [RING.zN, RING.zS]) {
    glass_bay(g, 17, 18, z, 2, 4);
    glass_bay(g, 20, 20, z, 4, 4);
    glass_bay(g, 21, 21, z, 2, 4);
  }
  // Ring glass where it crosses band C (roof part also names this; identical cells, first write wins).
  for (const x of [RING.xW, RING.xE]) glass_bay(g, 14, 17, x, 6, 6, { axis: "z" });

  // 4. Gable ends: the raised ceiling vault's glass at y=6, z=14..19 (identical to roofs.mjs; first write wins).
  glass_bay(g, 14, 19, 10, 6, 6, { axis: "z" });
  glass_bay(g, 14, 19, 31, 6, 6, { axis: "z" });

  // 5. Side windows and the utility door.
  glass_bay(g, 14, 16, 10, 3, 4, { axis: "z" }); // dining window, west
  glass_bay(g, 10, 12, 31, 3, 4, { axis: "z" }); // bedroom 1 window, east
  glass_bay(g, 15, 16, 31, 4, 4, { axis: "z" }); // bath clerestory, east
  glass_bay(g, 21, 23, 31, 2, 4, { axis: "z" }); // master bedroom, full height, east
  utilityDoor(g, 10, 10, "west");

  // 6. Street face: clerestory strip, the bold orange door and the ledgestone feature wall.
  clerestory(g, 22, NORTH, 4);
  orange_entry(g, 19, 9, "north");
  ledgestone_wall(g, 11, 17, 7, 1, 4);
}
