// Room 3, KOMO E newsroom (interior designer). Box x 26..58, z 8..45, floor y 8, ceiling y 12.
// Focal piece: the anchor set on the north wall (blue backdrop, presenter's desk). Workstations in three columns
// with lanes between; quartz stairs as chairs; monitors are black concrete on the desk tops; the ceiling lanterns come
// from grounds.mjs. Furniture is built from palette blocks only: oak fence + smooth quartz top slab desks.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// A workstation: fence posts on row zd (cells xa..xa+5), quartz top slabs on them, two monitors, two chairs on zd+1
function workstation(g, xa, zd) {
  for (let x = xa; x <= xa + 5; x++) {
    g.set(x, 8, zd, "oak_fence");
    g.set(x, 9, zd, ...B.slab("smooth_quartz", "top"));
  }
  for (const x of [xa + 1, xa + 4]) {
    g.set(x, 10, zd, "black_concrete");
    g.set(x, 8, zd + 1, ...B.stairs("quartz", "south"));
  }
}

export function build(g) {
  // Anchor set: blue backdrop on the north wall, presenter's desk two deep in front of it
  g.fill([36, 8, 8], [48, 11, 8], "blue_concrete");
  g.fill([36, 8, 8], [48, 8, 8], "white_concrete");
  for (let x = 37; x <= 47; x++) {
    g.set(x, 8, 10, "oak_fence");
    g.set(x, 8, 11, "oak_fence");
    g.set(x, 9, 10, ...B.slab("smooth_quartz", "top"));
    g.set(x, 9, 11, ...B.slab("smooth_quartz", "top"));
  }
  for (const x of [38, 42, 46]) g.set(x, 10, 10, "black_concrete");
  g.fill([41, 10, 10], [43, 10, 10], "red_concrete");

  // Newsroom workstations: three columns, four rows, lanes between them
  for (const zd of [16, 24, 32, 40]) {
    for (const xa of [29, 45, 52]) workstation(g, xa, zd);
  }

  // Light: the hanging lanterns under the ceiling (y 11, 6 blocks apart) are grounds.mjs's, already in place.
}
