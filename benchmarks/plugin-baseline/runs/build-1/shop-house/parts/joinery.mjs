// SPDX-License-Identifier: AGPL-3.0-or-later
// Stairs, glazing and doors: stair flights 1 and 2, wells, rails, loft ladder, doors, windows, shutters.
import { B, DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { stairFlight, shutterPair, QUARTZ_SLAB } from "../vocab.mjs";
import { doorPair } from "../vocab/h2.mjs";

const AIR = /(^|:)(cave_)?air$/;

/** A glass_pane window in one plane: first cell (x,y,z), w across (run axis), h high; panes join each other and the wall. */
function glaze(g, run, x, y, z, w, h, sill = null) {
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
    const [px, pz] = run === "x" ? [x + i, z] : [x, z + i];
    const a = run === "x" ? ["west", "east"] : ["north", "south"];
    const st = { north: "false", east: "false", south: "false", west: "false" };
    st[a[0]] = "true"; st[a[1]] = "true";               // joined to the neighbour pane, or to the brick at the ends
    g.set(px, y + j, pz, "glass_pane", st);
  }
  if (sill) for (let i = 0; i < w; i++) g.set(run === "x" ? x + i : sill.x, y - 1, run === "x" ? sill.z : z + i, ...B.slab("smooth_quartz", "top"));
}

/** A whole dark oak door (both halves) at (x,y,z) facing out of the room it closes. */
function door(g, x, y, z, facing, hinge = "left") {
  g.set(x, y, z, ...B.door("dark_oak", facing, "lower", hinge));
  g.set(x, y + 1, z, ...B.door("dark_oak", facing, "upper", hinge));
}

/** A dark oak fence rail along a straight run, posts joined along it. */
function rail(g, x0, z0, x1, z1, y) {
  const alongZ = x0 === x1;
  const n = alongZ ? Math.abs(z1 - z0) : Math.abs(x1 - x0);
  for (let i = 0; i <= n; i++) {
    const x = alongZ ? x0 : Math.min(x0, x1) + i, z = alongZ ? Math.min(z0, z1) + i : z0;
    const st = { north: "false", south: "false", east: "false", west: "false" };
    if (alongZ) { st.north = i > 0 ? "true" : "false"; st.south = i < n ? "true" : "false"; }
    else { st.west = i > 0 ? "true" : "false"; st.east = i < n ? "true" : "false"; }
    g.set(x, y, z, "dark_oak_fence", st);
  }
}

export function build(g) {
  // ---- stairs (plan RESERVED) ----
  stairFlight(g, 7, 9, 6, 12, "south", { width: 2, rails: [] });                 // flight 1: x7..8, z9..15, rising south
  stairFlight(g, 5, 15, 14, 17, "north", { width: 2, rails: ["pos"] });          // flight 2: x5..6, z15..12, rising north
  rail(g, 6, 10, 6, 11, 14);                                                     // rim of the lower well, north of flight 2
  rail(g, 7, 12, 7, 15, 19);                                                     // rim of the upper well, east side

  // ---- loft ladder: x16 is under the rear windows, so it climbs the solid wall at x15 ----
  for (let y = 19; y <= 24; y++) g.set(15, y, 21, "ladder", { facing: "north" });
  g.set(15, 23, 21, ...["ladder", { facing: "north" }]);                         // through the floor cell cut open
  g.set(16, 23, 21, ...B.trapdoor("dark_oak", "west", "bottom", true));          // guard beside the hole

  // ---- doors ----
  doorPair(g, 6, 6, 5, "north");
  glaze(g, "x", 6, 8, 5, 2, 1);                                                  // fanlight
  door(g, 9, 6, 20, "west");                                                     // keeper's door (lobby side)
  door(g, 16, 6, 22, "south");                                                   // keeper's rear door
  door(g, 6, 6, 22, "south");                                                    // lobby -> wing
  door(g, 11, 6, 27, "east");                                                    // kitchen back door
  door(g, 7, 14, 22, "south");                                                   // main -> wing upstairs
  door(g, 9, 14, 9, "west"); door(g, 9, 14, 18, "west");                         // first floor: hall -> living (z9, onto the floor), dining
  door(g, 9, 19, 13, "west");                                                    // second floor: hall -> corridor
  door(g, 17, 19, 12, "north", "right");                                         // parents' room off the corridor
  door(g, 11, 19, 14, "north"); door(g, 16, 19, 14, "north", "right");           // children's rooms
  door(g, 7, 19, 17, "north");                                                   // bathroom

  // ---- windows ----
  glaze(g, "x", 6, 10, 5, 2, 2);                                                 // lobby stair light
  for (const x of [6, 11, 16]) {
    glaze(g, "x", x, 14, 6, 2, 3);
    glaze(g, "x", x, 19, 6, 2, 3, { z: 4 });                                     // sill slab below the second floor
    shutterPair(g, x, 19, 4, "north");
  }
  for (const z of [9, 17]) for (const y of [14, 19]) glaze(g, "z", 19, y, z, 2, 3);          // east
  for (const z of [9, 18]) for (const y of [14, 19]) glaze(g, "z", 4, y, z, 1, 3);           // west
  glaze(g, "z", 4, 14, 26, 2, 3);                                                // wing west
  for (const x of [13, 16]) for (const y of [14, 19]) glaze(g, "x", x, y, 22, 2, 3);         // rear
  glaze(g, "x", 12, 7, 22, 1, 2);                                                // aisle window
  glaze(g, "z", 11, 7, 24, 2, 3);                                                // kitchen window
  glaze(g, "z", 11, 14, 24, 2, 3); glaze(g, "z", 11, 14, 27, 2, 3);              // wing east, upstairs
  glaze(g, "x", 5, 14, 30, 1, 3); glaze(g, "x", 10, 14, 30, 1, 3);               // wing south
  for (const x of [11]) { glaze(g, "x", x, 26, 5, 2, 2); glaze(g, "x", x, 26, 22, 2, 2); }  // loft windows
  void DIRS; void QUARTZ_SLAB;
}
