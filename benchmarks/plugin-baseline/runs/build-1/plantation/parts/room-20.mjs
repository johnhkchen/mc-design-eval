// Part: room: west hall bath (plan.md ROOMS/FLOORS; box [40,11,54,43,16,60], door from the west corridor at z53 x41..42).
// Hall bath for bedrooms 2-4: a tub on the south wall (focal, faces the door), a basin washstand on the east wall,
// candles and a lantern for light. The lane x41..42 stays clear from the door to the tub.
//
// Furniture removed: every cell of this box is air that the mansion shell carved, and runParts locks earlier parts'
// cells (air included), so all 25 writes (chest, barrels, stairs, carpet, cauldrons, candles, lanterns, chains) were
// refused. The layout is in the pre-fix copy (/tmp/room-20.before-lock-fix.mjs); re-add it once room interiors can take fit-out.

import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Nothing to place: the bath interior is owned by the shell (see note above).
  // Lamplighter: one standing lantern on the floor against the west wall, out of the door-to-tub lane (x41..42).
  // It stands on the shell's floor at y10 and lifts all 28 floor cells to light 8+ (mcd room).
  g.set(40, 11, 56, ...B.lantern(false));
}
