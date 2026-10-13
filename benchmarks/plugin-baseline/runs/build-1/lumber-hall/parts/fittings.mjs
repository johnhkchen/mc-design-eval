// Part 6, Windows, doors and fittings: the window units with shutters on both upper storeys and the side walls, the
// loading-door stacks on both streets (first floor, loft, gable), the lobby and keeper's double doors, the lobby
// windows, and a hanging lantern under each hoist chain. North is drawn; the south street is the mirror (z -> 37 - z).
import { windowUnit, loadingDoors, mirrorZ, HOIST_X, WEST_WALL_X, EAST_WALL_X } from "../vocab.mjs";

const STREETS = [
  ["north", (z) => z],
  ["south", (z) => mirrorZ(z)],
];

// side windows: one per third bay, on the side walls (plan had z 9, 21, 29, which are frame posts; these are bay centres)
const SIDE_Z = [11, 19, 27];

export function build(g) {
  for (const [face, Z] of STREETS) {
    // first-floor and loft windows (plan OPENINGS: x 7, 19, 23, 35)
    for (const x of [7, 19, 23, 35]) {
      windowUnit(g, x, 14, Z(4), face);
      windowUnit(g, x, 20, Z(3), face);
    }
    // loading doors: first floor (transom y15), loft (transom y21), gable (transom y27, under the hoist beam)
    for (const x of HOIST_X) {
      loadingDoors(g, x, 13, Z(4), face);
      loadingDoors(g, x, 19, Z(3), face);
      loadingDoors(g, x, 25, Z(3), face);
    }
    // lobby door (customers) on the north, keeper's door on the south: double doors, transom y7
    loadingDoors(g, 5, 5, Z(5), face);
    // lobby windows, 1 x 3 glass panes beside the door
    for (const x of [3, 7]) for (let y = 6; y <= 8; y++) {
      g.set(x, y, Z(5), "glass_pane", { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });
    }
  }
  // side windows on both end walls, both upper storeys
  for (const z of SIDE_Z) {
    for (const [x, fc] of [[WEST_WALL_X[0], "west"], [EAST_WALL_X[1], "east"]]) {
      windowUnit(g, x, 14, z, fc);
      windowUnit(g, x, 20, z, fc);
    }
  }
  // hanging lantern under each hoist chain (chain at x, one cell in from the outer end of the beam)
  for (const x of HOIST_X) {
    g.set(x, 25, 1, "lantern", { hanging: "true" });
    g.set(x, 25, 36, "lantern", { hanging: "true" });
  }
}
