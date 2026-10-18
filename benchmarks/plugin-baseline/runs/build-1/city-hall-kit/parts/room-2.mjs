// room: Portico vestibule interior designer's part: lamps only (plan ROOMS: "a floor inlay and lamps only").
// No furniture. Hanging lanterns on a 6-grid under the y 9 ceiling (the piano nobile floor), kept off the three door bays
// in front of the doorways. The paving bands are not built here: they would sit on the y 1 floor, which is the front
// shell's cell and outside this room's box, so they stay in `left` for the front shell.
import { hangingLantern } from "../vocab.mjs";

// The three door bays (x0..x1) on the z 3 wall; no lantern hangs over the stretch in front of them.
const DOOR_BAYS = [[86, 89], [94, 97], [102, 105]];
const inDoorBay = (x) => DOOR_BAYS.some(([a, b]) => x >= a && x <= b);

export function build(g) {
  for (const z of [6, 12, 18]) {
    for (const x of [67, 73, 79, 85, 91, 97, 103, 109, 115, 121]) {
      if (z === 6 && inDoorBay(x)) continue;
      hangingLantern(g, x, 8, z);
    }
  }
  // the stretch between the middle and east door bays (x 98..101) is out of reach of the grid's lanterns: one more at z 6
  hangingLantern(g, 99, 8, 6);
  // the south-east corner (x 126, z 22) is past the grid's last lantern: one more in the corner's reach
  hangingLantern(g, 124, 8, 21);
}
