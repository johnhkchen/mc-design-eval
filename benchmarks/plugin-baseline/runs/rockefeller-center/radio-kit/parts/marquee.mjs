// Marquees (P4): plot 0 west run, plot 0 south run, the rounded corner between them, and plot 1's south run, with
// their end cheeks and the RADIO CITY / MUSIC HALL letters per plan.md's placement table. Every write is into air
// inside the reserved marquee volumes (plan.md RESERVED): plot 0 x0..2 z4..51 y6..10 and x0..27 z50..53 y6..10;
// plot 1 x40..86 z50..53 y6..10.
import { marquee_run, marquee_corner, marquee_end, marquee_word } from "../vocab.mjs";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE_SIZE } from "../vocab/base.mjs";

// marquee_corner also lights the soffit behind its body, and that cell can sit in the solid corner block the tower
// shell built. Run the corner on a scratch grid and copy across only the cells that are air here, so the corner
// never asks for a write into an earlier part's wall.
function corner(g, at) {
  const scratch = new Grid(SITE_SIZE);
  marquee_corner(scratch, at, { y: 6 });
  for (const { pos: [x, y, z], block, state, nbt } of scratch.cells.values()) {
    // the marquee top is a top slab (plan: the top layer), so the end rods above it stand on its level
    const top = block === "minecraft:smooth_quartz_slab" ? { ...state, type: "top" } : state;
    if (!g.get(x, y, z)) g.set(x, y, z, block, top, nbt);
  }
}

export function build(g) {
  // Plot 0, Sixth Avenue (west) run: front row x1, body x1..2, from z5 up to z50. The corner takes z51..52.
  marquee_run(g, { axis: "z", from: 5, to: 50, at: 1, front: "west" });
  // Its rounded north end: iron cheeks closing x1..2 at z4.
  marquee_end(g, [1, 6, 4]);
  marquee_end(g, [2, 6, 4]);

  // The rounded corner: air cell x1 z52 left out, body x1..2 z51..52 minus that cell.
  corner(g, [1, 52]);

  // Plot 0, 50th Street (south) run: front row z52, body z51..52, from x3 to x26. The corner takes x1..2.
  marquee_run(g, { axis: "x", from: 3, to: 26, at: 52, front: "south" });
  // Its east end: iron cheeks closing z51..52 at x27.
  marquee_end(g, [27, 6, 51]);
  marquee_end(g, [27, 6, 52]);

  // Plot 1, 50th Street (south) run: front row z52, body z51..52, from x41 to x85, with cheeks at each end.
  marquee_run(g, { axis: "x", from: 41, to: 85, at: 52, front: "south" });
  marquee_end(g, [40, 6, 51]);
  marquee_end(g, [40, 6, 52]);
  marquee_end(g, [86, 6, 51]);
  marquee_end(g, [86, 6, 52]);

  // Letters on the banner row (plan.md Word placements). Centres are the middle letter's cell.
  // Plot 0 south: RADIO CITY x3..12, MUSIC HALL x16..25.
  marquee_word(g, "RADIO CITY", { center: [7, 8, 53], face: "south" });
  marquee_word(g, "MUSIC HALL", { center: [20, 8, 53], face: "south" });
  // Plot 0 west: RADIO CITY z8..17, MUSIC HALL z22..31, RADIO CITY z36..45.
  marquee_word(g, "RADIO CITY", { center: [0, 8, 12], face: "west" });
  marquee_word(g, "MUSIC HALL", { center: [0, 8, 26], face: "west" });
  marquee_word(g, "RADIO CITY", { center: [0, 8, 40], face: "west" });
  // Plot 1: MUSIC HALL x44..53, RADIO CITY x58..67, MUSIC HALL x72..81.
  marquee_word(g, "MUSIC HALL", { center: [48, 8, 53], face: "south" });
  marquee_word(g, "RADIO CITY", { center: [62, 8, 53], face: "south" });
  marquee_word(g, "MUSIC HALL", { center: [76, 8, 53], face: "south" });
}
