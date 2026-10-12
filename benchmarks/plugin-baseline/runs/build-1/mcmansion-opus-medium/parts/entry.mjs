// P3 entry and garage front: portico floor, steps, four columns, entablature + slab ceiling, portico hanging lamps,
// the entry door (E8), the Palladian over it, three carriage doors with headers (E16, E38 front), and coach lights.
// Only air is written: P1 left every cell here empty (plan.md RESERVED / OPENINGS).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  POLISHED_DIORITE, PORTICO, column, entablature, entryDoor, carriageDoor, coachLight, hangLamp,
} from "../vocab.mjs";

const put = (g, x, y, z, pair) => g.set(x, y, z, ...pair);

/** Portico floor: polished diorite y1 over x11..22 z5..8. */
function porticoFloor(g) {
  for (let x = PORTICO.x0; x <= PORTICO.x1; x++) for (let z = 5; z <= PORTICO.z1; z++) {
    put(g, x, 1, z, B.block(POLISHED_DIORITE));
  }
}

/** Front steps: quartz stairs at y1 over x12..21 z4, climbing south onto the portico floor. */
function steps(g) {
  for (let x = 12; x <= 21; x++) put(g, x, 1, 4, B.stairs("quartz", "south", "bottom"));
}

/** Palladian window over the entry, in the entry projection's front wall (z9): glass y6..7, arch row y8 with quartz
 *  shoulders, a quartz sill one cell out at y5 (the belt course above the sill is P1's). */
function palladian(g) {
  for (let x = 15; x <= 18; x++) for (let y = 6; y <= 7; y++) put(g, x, y, 9, B.pane());
  put(g, 15, 8, 9, B.stairs("quartz", "west", "top"));
  put(g, 16, 8, 9, B.pane());
  put(g, 17, 8, 9, B.pane());
  put(g, 18, 8, 9, B.stairs("quartz", "east", "top"));
  for (let x = 15; x <= 18; x++) put(g, x, 5, 8, B.slab("smooth_quartz", "top"));
}

export function build(g) {
  porticoFloor(g);
  steps(g);
  for (const x of [11, 14, 19, 22]) column(g, x, 5);
  entablature(g);
  hangLamp(g, 16, 8, 7);
  hangLamp(g, 17, 8, 7);
  entryDoor(g);
  palladian(g);
  for (const x0 of [30, 34, 38]) carriageDoor(g, x0);
  // x29 is the main house's east wall (P1 shell, locked), so the plan's x29 lamp cannot stand there: skipped, see plan.md Notes.
  for (const x of [33, 37, 41]) coachLight(g, x, 12);
}
