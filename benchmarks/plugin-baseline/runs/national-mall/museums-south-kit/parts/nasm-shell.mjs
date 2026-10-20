// NASM shell: four marble cubes (walls, roofs, plinth ring), the podium floor between and under them, clerestory slots.
import { marble_cube, slot, NASM_CUBES, NASM_BAYS } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const BAYS = [[15, 24, 5, 25], [38, 49, 6, 24], [63, 72, 5, 25]];   // x0, x1, z0, z1: face rows are left for the glass part

export function build(g) {
  for (const c of NASM_CUBES) marble_cube(g, c.x0, c.x1, c.z0, c.z1);
  // podium y 1, x 2..85, z 4..26: granite on the perimeter, smooth_stone inside; bay face rows and G2's recess stay free
  for (let x = 2; x <= 85; x++)
    for (let z = 4; z <= 26; z++) {
      const bay = BAYS.find(([x0, x1]) => x >= x0 && x <= x1);
      if (bay && (z <= bay[2] || z >= bay[3])) continue;
      if (g.get && g.get(x, 1, z) && g.get(x, 1, z)[0] !== "air") continue;
      const edge = x === 2 || x === 85 || z === 4 || z === 26;
      g.set(x, 1, z, edge ? "polished_granite" : "smooth_stone");
    }
  const slots = [[5, 11], [28, 34], [53, 59], [76, 82]];
  for (const [a, b] of slots) {
    slot(g, a, b, 4, 5, { over: true });
    slot(g, a, b, 26, 25, { over: true });
  }
}
