// Part: joinery. Shutters flat on the wall beside every opening the shell carved.
// The shell carves all openings to air and runParts locks every cell an earlier part placed (air included), so the
// doors, windows, rear-porch door and hall chandeliers that belong in those cells are refused. They are not written
// here: filling them needs the shell to leave the opening cells unplaced. The grand stair is the stair joiner's.
import { shutterPair } from "../vocab.mjs";

export function build(g) {
  // ---- front windows: shutters flat on z41, beside the openings at z42
  for (const x of [28, 34, 40, 54, 60, 66]) {
    shutterPair(g, x, x + 1, 4, 5, "north", 42);
    shutterPair(g, x, x + 1, 11, 5, "north", 42);
  }

  // ---- end walls (west x26, east x69): shutters beside the windows at z45..46 and z58..59 and the door at z51..52
  for (const x of [26, 69]) {
    const face = x === 26 ? "west" : "east";
    for (const z of [45, 58]) {
      shutterPair(g, z, z + 1, 5, 4, face, x);
      shutterPair(g, z, z + 1, 12, 4, face, x);
    }
    shutterPair(g, 51, 52, 12, 4, face, x);
  }

  // ---- south wall z61 (main block, outside the wing): shutters on z62
  for (const x of [29, 33, 61, 65]) {
    shutterPair(g, x, x + 1, 5, 4, "south", 61);
    shutterPair(g, x, x + 1, 12, 4, "south", 61);
  }
}
