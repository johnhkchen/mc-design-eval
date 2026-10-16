// Stairs and ladders: every flight runs north (z15 -> z11), top step flush in the upper floor layer.
import { flight } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const rail = (g, x, z0, z1, y = 8, wood = "spruce_fence") => {
  for (let z = z0; z <= z1; z++) if (g.get?.(x, y, z)?.[0] === "air" || !g.get) g.set(x, y, z, wood);
};

export function build(g) {
  const flights = [
    [33, "spruce", 32], [44, "dark_oak", 45], [54, "spruce", null], [88, "dark_oak", 87], [91, "dark_oak", 92],
  ];
  for (const [x, material, railX] of flights) {
    flight(g, { from: [x, 3, 15], facing: "north", to: 7, material });
    // a jump from each step to the next needs the cell three above the lower foot clear; flight() clears two, so the
    // upper floor's hole (x, 7, 14) and the cells above it on the flight's line are cut here too
    for (let i = 0; i < 4; i++) g.set(x, 6 + i, 15 - i, "air");
    if (railX !== null) rail(g, railX, 11, 14);
  }
  // barn loft ladder, tower ladder (hatch at the belvedere floor), tank ladder
  // plots 5/6 walls are shell B's (built after this part), so these two ladders are set directly: wall x61 / x79 follows
  for (let y = 1; y <= 6; y++) g.set(62, y, 14, "ladder", { facing: "east" });
  for (let y = 1; y <= 8; y++) g.set(78, y, 16, "ladder", { facing: "west" });
  // tower ladder up through the belvedere floor's open hatch (44,12,9) to (44,13,9): a ladder cell there, so the climb
  // steps out at the belvedere's floor (an open trapdoor above the hatch would not be a place to stand)
  for (let y = 8; y <= 13; y++) if (g.isAir(44, y, 9)) g.set(44, y, 9, "ladder", { facing: "east" });
}
