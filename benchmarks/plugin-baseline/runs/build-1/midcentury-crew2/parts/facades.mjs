// PART 4 facades, glazing and entry: the south glass wall with its posts and sliding-door glazing, the north street
// facade (entry door, clerestory strip, ledgestone feature wall), the west and east window bays, the utility door and
// the atrium ring. Plan.md FACADES and OPENINGS; elements 8-10 and 12-16. Every write is into air only: the shell
// (part 1) left these cells open for this part.
import {
  glass_bay, post, slider_gap, clerestory, orange_entry, ledgestone_wall, UTILITY_DOOR,
} from "../vocab.mjs";

const BEAM_LINES_SOUTH = [10, 13, 16, 19, 22, 25, 28, 31];

// the utility door (kitchen to carport), open, lower and upper halves at (10, 2..3, 10); air only
function utility_door(g, x, y0, z, facing) {
  for (let dy = 0; dy < 2; dy++) {
    if (!g.isAir(x, y0 + dy, z)) continue;
    g.set(x, y0 + dy, z, UTILITY_DOOR, { facing, half: dy === 0 ? "lower" : "upper", hinge: "left", open: "true" });
  }
}

export function build(g) {
  // South garden wall z=25: thin dark posts on every beam line, glass between them (y=2..4), and the three
  // sliding-door gaps glazed only at y=4 (slider_gap leaves y=2..3 open).
  for (const x of BEAM_LINES_SOUTH) post(g, x, 25, 2, 4);
  slider_gap(g, 14, 25);
  slider_gap(g, 20, 25);
  slider_gap(g, 26, 25);
  for (const [a, b] of [[11, 12], [17, 18], [23, 24], [29, 30]]) glass_bay(g, a, b, 25, 2, 4);

  // Corner posts on the north and south ends of the west and east walls.
  post(g, 10, 8, 2, 4);
  post(g, 31, 8, 2, 4);
  post(g, 10, 25, 2, 4);
  post(g, 31, 25, 2, 4);

  // North street facade z=8: the clerestory strip (y=4), the orange entry on the door wall z=9, and the ledgestone
  // feature wall standing 1 proud at z=7.
  clerestory(g, 8, 4, 22);
  orange_entry(g, 19, 9, "north", 2);
  ledgestone_wall(g, 11, 17, 7, 1, 4);

  // West (x=10): dining window and the utility door to the carport.
  glass_bay(g, 14, 16, 10, 3, 4, { along: "z" });
  utility_door(g, 10, 2, 10, "west");

  // East (x=31): bedroom 1 window, bath clerestory, master full-height glass.
  glass_bay(g, 10, 12, 31, 3, 4, { along: "z" });
  glass_bay(g, 15, 16, 31, 4, 4, { along: "z" });
  glass_bay(g, 21, 23, 31, 2, 4, { along: "z" });

  // Atrium ring: glass_pane on x=16 and x=22 (z=12..17) and on z=11 and z=18 (x=17..21), posts on the four corners
  // and on x=19 at y=4 only (the atrium doors at x=19..20, y=2..3 stay open). The ring's y=6 band glass is part 3's.
  for (const z of [11, 18]) {
    post(g, 16, z, 2, 4);
    post(g, 22, z, 2, 4);
    post(g, 19, z, 4, 4);
  }
  glass_bay(g, 12, 17, 16, 2, 4, { along: "z" });
  glass_bay(g, 12, 17, 22, 2, 4, { along: "z" });
  for (const z of [11, 18]) {
    glass_bay(g, 17, 18, z, 2, 4);
    glass_bay(g, 20, 20, z, 4, 4);
    glass_bay(g, 21, 21, z, 2, 4);
  }
}
