// Part 7, Grounds and lights (lamp posts, woodpiles on the pavement flanks and in the cart passage edges).
// The paving itself is the shell's (pavingPatch in parts/shell.mjs); this part adds only what stands on it.
// Woodpiles sit on the pavement top (planks at y 5) and keep out of the clear zones (x 9..33, z 4..5 and 32..33, y 6..8).
// South piles mirror the north ones by z -> 37 - z (the pile's outer cell row moves from z 0..1 to z 36..37).
import { lampPost, woodPile } from "../vocab.mjs";

const mirrorZ = (z) => 37 - z;

export function build(g) {
  const report = [];
  const log = (name, out) => report.push([name, out.placed, out.refused.length]);

  // lamp posts: fence posts with a lantern on top, at x 1 and 41, z 1 and 36 (plan SITE: outside every clear zone)
  for (const [x, z] of [[1, 1], [41, 1], [1, mirrorZ(1)], [41, mirrorZ(1)]]) {
    log(`lamp ${x},${z}`, lampPost(g, x, z));
  }
  // alley lanterns mid-run (the alleys x 0..1 and x 41..42 were dark z 12..25 with only the corner posts), and one
  // gutter lamp per street at x 13 so the gutter cells at x 12..13 are lit too
  for (const [x, z] of [[1, 18], [41, 18], [13, 1], [13, mirrorZ(1)]]) {
    log(`lamp ${x},${z}`, lampPost(g, x, z));
  }

  // north pavement flanks: each pile two deep across z (z 0..1), outside the shopfront's x 9..33
  log("oak flank", woodPile(g, 2, 5, 0, 3, "oak", { axis: "x" }));
  log("spruce flank", woodPile(g, 38, 5, 0, 3, "spruce", { axis: "x" }));

  // south pavement flanks: the same, mirrored (z 36..37)
  log("jungle flank", woodPile(g, 2, 5, mirrorZ(1), 3, "jungle", { axis: "x" }));
  log("acacia flank", woodPile(g, 38, 5, mirrorZ(1), 3, "acacia", { axis: "x" }));

  // cart passage edges: x 35..36 only, so the lane x 37 stays open through the block
  log("birch passage", woodPile(g, 35, 5, 10, 5, "birch", { axis: "z" }));
  log("dark oak passage", woodPile(g, 35, 5, 22, 5, "dark_oak", { axis: "z" }));

  const refused = report.filter(([, , r]) => r > 0);
  for (const [name, placed, r] of report) console.log(`  grounds: ${name}: ${placed} placed, ${r} refused`);
  if (refused.length) console.log(`  grounds: refused in ${refused.map(([n]) => n).join(", ")}`);
}
