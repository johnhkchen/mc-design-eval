// P4 windows and shutters on every facade (plan.md OPENINGS, E17 windows, E18, E19). Front windows (turret z7, main z11)
// get archWindow: glass rows, quartz_stairs arch, smooth quartz sill one cell out. Everywhere else windowRect: glass,
// sill, and black dark_oak_trapdoor shutters beside each opening, open and facing out (vocab.mjs helpers).
// Two kinds of placement are dropped, because another part owns the cell: the west shutter of the main z11 window at
// x8..9 would land in the turret's east wall (x7 z9..10, P1), and the back-deck sills at y1 z26 (x6..24) are deck (P5).
import { archWindow, windowRect } from "../vocab.mjs";

/** A view of g that drops the placements the skip predicate names; glass is never in those cells. */
const skipping = (g, skip) => ({ set: (x, y, z, ...rest) => { if (!skip(x, y, z)) g.set(x, y, z, ...rest); } });

/** Cells that are not this part's: the turret east wall (x7, z9..10) and the back-deck top (y1, z26, x6..24). */
const taken = (x, y, z) => (x === 7 && (z === 9 || z === 10)) || (z === 26 && y === 1 && x >= 6 && x <= 24);

export function build(g) {
  // Also dropped: any cell an earlier part already built. The roofs part owns the eave and overhang cells where some
  // shutters would hang (z10 y7..8 on the front, z12 on the garage, z26 and x42 on the back and east), so those stay roof.
  const w = skipping(g, (x, y, z) => taken(x, y, z) || g.blockAt(x, y, z) !== "minecraft:air");

  // Front: turret z7 (x4..5) and main z11 (x8..9, x23..24, x26..27), both storeys (glass y2..3 + arch y4; y6..7 + arch y8).
  for (const y0 of [2, 6]) {
    archWindow(w, 4, y0, 7, "north");
    archWindow(w, 8, y0, 11, "north");
    archWindow(w, 23, y0, 11, "north");
    archWindow(w, 26, y0, 11, "north");
  }

  // West x2 at z13..14, two storeys.
  windowRect(w, [[2, 13], [2, 14]], [2, 3], "west");
  windowRect(w, [[2, 13], [2, 14]], [6, 7], "west");

  // Back z25: ground storey (kitchen band 20..22 at y3..4), upper storey, garage back.
  windowRect(w, [[5, 25], [6, 25]], [2, 4], "south");
  windowRect(w, [[9, 25], [10, 25]], [2, 4], "south");
  windowRect(w, [[20, 25], [21, 25], [22, 25]], [3, 4], "south");
  windowRect(w, [[35, 25], [36, 25]], [2, 3], "south");
  windowRect(w, [[5, 25], [6, 25]], [6, 7], "south");
  windowRect(w, [[9, 25], [10, 25]], [6, 7], "south");
  windowRect(w, [[19, 25], [20, 25]], [7, 8], "south");
  windowRect(w, [[25, 25], [26, 25]], [6, 7], "south");
  windowRect(w, [[35, 25], [36, 25]], [6, 7], "south");

  // Garage front z13: the three bonus-room windows over the carriage doors.
  windowRect(w, [[31, 13]], [6, 7], "north");
  windowRect(w, [[35, 13]], [6, 7], "north");
  windowRect(w, [[39, 13]], [6, 7], "north");
  // Each bonus sill hangs in air, so a smooth quartz slab bracket under it at y4 (the same motif as P3's coach lights).
  for (const x of [31, 35, 39]) g.set(x, 4, 12, "smooth_quartz_slab", { type: "top", waterlogged: "false" });

  // Garage east x41 at z17..18 and z21..22.
  windowRect(w, [[41, 17], [41, 18]], [6, 7], "east");
  windowRect(w, [[41, 21], [41, 22]], [6, 7], "east");
}
