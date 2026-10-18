// P3 giant order: the doric columns on every front (y 10..33), plot 3 antae pilasters (y 10..33).
// Column footprints are the plan's 2x2 cells (x0..x0+1, z0..z0+1); the pilasters are 3 wide on the reserved cells.
import { doricColumn, antaPilaster, faceFrame } from "../vocab.mjs";

const Y0 = 10, Y1 = 33;

// Plot 0: six per face. North/south faces run along x at z 2 and z 60; east/west faces run along z at x 60 and x 2.
const DOME_AXIS = [11, 19, 27, 35, 43, 51];

// Plot 1: the six giant columns (x 75..116) and the flanking pairs (67-68, 70-71, 120-121, 123-124), at z 1.
const PORTICO_X = [75, 83, 91, 99, 107, 115, 67, 70, 120, 123];

// Plot 2: one pair of giant columns per wing bay, at x 131 and 139, z 2.
const WING_X = [131, 139];

// Plot 3: a pair in antis on the north face (x 156, 164 at z 1) and on the east face (x 173 at z 10 and 20).
const PAVILION_N_X = [156, 164];
const PAVILION_E_Z = [10, 20];

export function build(g) {
  let n = 0;
  // plot 0, the dome pavilion: 24 columns, 6 per face
  for (const a of DOME_AXIS) {
    n += doricColumn(g, a, 2, Y0, Y1);  // north
    n += doricColumn(g, a, 60, Y0, Y1); // south
    n += doricColumn(g, 60, a, Y0, Y1); // east
    n += doricColumn(g, 2, a, Y0, Y1);  // west
  }
  // plot 1, the east portico: six giant columns and four flanking
  for (const x of PORTICO_X) n += doricColumn(g, x, 1, Y0, Y1);
  // plot 2, the wing bay: a pair of giant columns
  for (const x of WING_X) n += doricColumn(g, x, 2, Y0, Y1);
  // plot 3, the corner pavilion: two columns in antis per face
  for (const x of PAVILION_N_X) n += doricColumn(g, x, 1, Y0, Y1);
  for (const z of PAVILION_E_Z) n += doricColumn(g, 173, z, Y0, Y1);

  // plot 3 anta pier faces: pilasters on the reserved cells (north at z 0, east at x 175)
  const N = faceFrame("north", [144, 0, 175, 31]);
  const E = faceFrame("east", [144, 0, 175, 31]);
  n += antaPilaster(g, N, 147, 0, Y0, Y1).placed ?? 0;
  n += antaPilaster(g, N, 172, 0, Y0, Y1).placed ?? 0;
  n += antaPilaster(g, E, 1, 0, Y0, Y1).placed ?? 0;
  n += antaPilaster(g, E, 28, 0, Y0, Y1).placed ?? 0;
  return n;
}
