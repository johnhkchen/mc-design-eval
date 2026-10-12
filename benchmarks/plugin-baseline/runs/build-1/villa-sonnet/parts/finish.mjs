// P6 FINISH (plan.md PARTS 6): window grilles on every x=0 / x=35 window and the two back-wall windows, the rear door pair
// and rear lane (gravel / dirt_path), the rear lampstands and pots, the remaining potted plants, and the fixes that fall
// between the parts. Writes only into air: the grilles and the door sit in cells P1 left open, the lane is ground at y0.
import {
  WINDOWS, REAR_DOOR, REAR_LAMPSTANDS, FINISH_POTS, GRAVEL, DIRT_PATH, windowGrille, doorPair, lampStand, pot,
} from "../vocab.mjs";

const span = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);

/** Window grilles: copper_bars filling each 1x2 opening (y3..4) in the x=0, x=35 and back walls. */
function grilles(g) {
  for (const w of WINDOWS) windowGrille(g, w.x, w.y, w.z, w.axis);
}

/** Rear service door: a spruce_door pair in the back wall, opening outward (south) and standing open. */
function rearDoor(g) {
  doorPair(g, REAR_DOOR.x0, REAR_DOOR.z, "x", "south");
}

/** Rear lane z46..47 across the site: gravel with a dirt_path stripe, 70 / 30 by position. */
function rearLane(g) {
  for (const x of span(0, 35)) for (const z of span(46, 47)) {
    const h = (x * 7 + z * 11) % 10;
    g.set(x, 0, z, h < 7 ? GRAVEL : DIRT_PATH);
  }
}

/** Rear lampstands flank the door (base y2, inside the colonnade) and pots stand on the lane (pedestal y1). */
function rearLamps(g) {
  for (const [x, z] of REAR_LAMPSTANDS) lampStand(g, x, z, 2);
}

/** Potted plants: the rear-lane pots and the remaining walkway and pilaster pots, cycling the plant list. */
function plants(g) {
  const cycle = ["fern", "azalea", "flowering_azalea", "cornflower", "allium"];
  const rearPots = [[16, 46], [19, 46]];
  rearPots.forEach(([x, z], i) => pot(g, x, z, cycle[i], 1));
  FINISH_POTS.filter(([, z]) => z < 46).forEach(([x, z], i) => pot(g, x, z, cycle[(i + 2) % cycle.length], 2));
}

export function build(g) {
  grilles(g);
  rearLane(g);
  rearDoor(g);
  rearLamps(g);
  plants(g);
}
