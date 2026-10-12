// Part 2: Roofs. Deepslate-tile hips over the garage (G) and the main block (M), the entry gable with its white pediment
// and round window, and the bay cone with its rod finial. The dormer and chimney holes stay open (P6 builds the dormers).
// Every write is air-only: shell cells and cells an earlier roof step filled are left alone, so nothing is refused.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { roofHip, roofGable, roofCone, pediment, pedimentWindow } from "../vocab.mjs";

// Roof holes, y11..13: dormers at x21..23 and x39..41 (z7..10), rear dormer x29..31 (z26..28), chimney x40..42 (z24..26).
const HOLES = [[21, 23, 7, 10], [39, 41, 7, 10], [29, 31, 26, 28], [40, 42, 24, 26]];
const inHole = (x, y, z) => y >= 11 && y <= 13 && HOLES.some(([x0, x1, z0, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1);
const AIR = new Set(["minecraft:air", "minecraft:cave_air"]);

/** A grid view that writes only into free air outside the roof holes. */
function roofWriter(g) {
  const free = (x, y, z) => !inHole(x, y, z) && AIR.has(g.blockAt(x, y, z));
  return {
    set: (x, y, z, ...rest) => { if (free(x, y, z)) g.set(x, y, z, ...rest); },
    fill: (a, b, block, state) => {
      for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++)
        for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++)
          for (let z = Math.min(a[2], b[2]); z <= Math.max(a[2], b[2]); z++)
            if (free(x, y, z)) g.set(x, y, z, block, state);
    },
  };
}

/** Raking trim: smooth_quartz stairs on the front (z4) edge of the entry gable, placed before the gable's own steps. */
function gableTrim(w) {
  const steps = [[26, 10, "east"], [27, 11, "east"], [28, 12, "east"], [29, 13, "east"],
    [35, 10, "west"], [34, 11, "west"], [33, 12, "west"], [32, 13, "west"]];
  for (const [x, y, facing] of steps) w.set(x, y, 4, ...B.stairs("smooth_quartz", facing, "bottom"));
}

export function build(g) {
  const w = roofWriter(g);
  // Garage hip (footprint x0..18, z5..22). Its east ring at x18 is the seam with the main hip.
  roofHip(w, 0, 5, 18, 22);
  // Entry gable: trim and round window first, so the pediment and the gable steps leave them in place.
  gableTrim(w);
  pedimentWindow(w);
  pediment(w);
  roofGable(w);
  // Main hip (footprint x18..43, z7..28); cells already roofed by the garage or the gable are skipped.
  roofHip(w, 18, 7, 43, 28);
  // Turret-bay cone with its lightning-rod finial at y14.
  roofCone(w);
}
