// NMNH facade order (plan.md plot 0, part 4): the portico's six Corinthian columns and entablature, the south range's
// pilasters, the balustrade with its dies, the end pavilions' engaged columns, the thermal window, the drum's corner
// pilasters and cornice ring, and the tall window recesses. Every helper writes only into air: whatever the shell
// already holds is refused, not replaced.
import { balustrade, thermalWindow, octagonDrum, tallWindow } from "../vocab.mjs";

// A column one cell proud of a wall face (z = the face cell, the shaft at z + 1), y0..y1: quartz_pillar shaft on a full
// course, chiseled capital on top. The vocab helpers put a quartz_slab base under the shaft, and fit flags a shaft
// standing on a bottom slab; the slab base is left out here.
function column(g, x, y0, y1, z) {
  for (let y = y0; y < y1; y++) g.set(x, y, z, "minecraft:quartz_pillar", { axis: "y" });
  g.set(x, y1, z, "minecraft:chiseled_quartz_block");
}

// Bay lines of the south range (57 ± 4n) that stand clear of the portico (x 46..68) and the end pavilions (x 22..31,
// 83..92). Their bays between them carry the tall windows, centred 2 in from the line to the west.
const WEST_PILASTERS = [33, 37, 41, 45];
const EAST_PILASTERS = [69, 73, 77, 81];
const WEST_WINDOWS = [35, 39, 43];
const EAST_WINDOWS = [71, 75, 79];
const PORTICO_COLUMNS = [49, 52, 55, 59, 62, 65];
const PAVILION_COLUMNS = [23, 26, 27, 30, 84, 87, 88, 91];

export function build(g) {
  // Portico: six columns on the platform (top y 4), shaft y5..9, capital y10.
  for (const x of PORTICO_COLUMNS) column(g, x, 5, 10, 42);
  // Entablature over the columns: the shell already holds y11 at z40..41, so only the front row (z42) is new, with an
  // upside-down stair cornice one cell proud on the front (z43).
  for (let x = 47; x <= 67; x++) {
    g.set(x, 11, 42, "minecraft:smooth_quartz");
    g.set(x, 11, 43, "minecraft:quartz_stairs", { facing: "north", half: "top", shape: "straight" });
  }

  // South range: pilasters on the bay lines, one cell proud of the z41 wall face (at z42), each with a cornice stair over its capital.
  for (const x of [...WEST_PILASTERS, ...EAST_PILASTERS]) {
    column(g, x, 5, 10, 42);
    g.set(x, 11, 42, "minecraft:quartz_stairs", { facing: "north", half: "top", shape: "straight" });
  }

  // Balustrade on the range's top (y12), west and east of the portico; dies sit on the pilaster lines.
  balustrade(g, 33, 45, 41, 12);
  balustrade(g, 69, 81, 41, 12);

  // Tall windows in the bays between the pilasters: recessed 1, sill and lintel on the wall face, rows y5..9.
  for (const x of [...WEST_WINDOWS, ...EAST_WINDOWS]) tallWindow(g, x, 5, 41, "south", { height: 5 });

  // End pavilions: four engaged columns each, one cell proud of the z42 wall face (so at z43), y5..10.
  for (const x of PAVILION_COLUMNS) column(g, x, 5, 10, 43);

  // South pavilion's thermal window: centred on x 57 at y12..15. Glass at z41, in front of the attic wall (z40) because
  // the shell's attic fills z40 (see the Notes in plan.md).
  thermalWindow(g, 57, 12, 41, "south");

  // Rotunda drum: corner pilasters, one 1x5 slot a face (left as air), and the quartz_stairs cornice ring at y19.
  octagonDrum(g, [57, 12, 27], 9);
}
