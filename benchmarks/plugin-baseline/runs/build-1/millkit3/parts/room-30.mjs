// P4 stair strip
// One cell wide: the attic flight (x54, z15->11) fills the strip, so there is no floor for furniture. The room is
// lit by one hanging lantern at the landing end, under the attic floor at z10 (y6). The cells the flight's jumps need
// (54, 6..9, 15..12) stay clear, so the lantern cannot hang at the foot.
export function build(g) {
  if (g.isAir(54, 6, 10)) g.set(54, 6, 10, "lantern", { hanging: "true" });
}
