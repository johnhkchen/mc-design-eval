// Interior designer for "Food hall atrium volume" (room 6): the open air over the food hall, no floor. It is lit by
// lanterns hung on chains from the bottom chord of each steel truss, down three centre lines (under the monitors and
// along the hall's middle), so the air reads as a lit hall at night. Inside the box [20,7,36,87,27,131] only.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { trussZ } from "../vocab/base.mjs";

// the three hanging lines: west (under the west monitor), centre, east (under the east monitor)
const LINES = [37, 53, 70];
const LANTERN_Y = 13;   // the lantern hangs here; its chain runs up from it to the chord at y 23

export function build(g) {
  for (let k = 0; k < 12; k++) {
    const z = trussZ(k);
    for (const x of LINES) {
      // a chain column (1.21.1 id `chain`, not iron_chain) from the chord down to the lantern, then the lantern
      for (let y = LANTERN_Y + 1; y <= 22; y++) g.set(x, y, z, "chain", { axis: "y", waterlogged: "false" });
      g.set(x, LANTERN_Y, z, ...B.lantern(true));
    }
  }
}
