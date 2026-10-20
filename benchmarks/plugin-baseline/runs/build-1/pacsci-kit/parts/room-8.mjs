// Part "room: IMAX theatre": the interior designer's part. A raked theatre inside the dome: the floor rises from the
// south entrance (y 1) to the stage at the north (y 8), seats are stairs on solid tiers, a centre aisle ramps up
// between them, the screen is a sea-lantern panel on the north wall, and lamp posts light the side aisles.
// Writes only into air inside ROOM_BOX.imax: a cell the dome or shell already filled (its drum and ribs) is left as it
// is, so the part never writes into an earlier part.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const SQ = "smooth_quartz";
const SEAT_X = [[8, 18], [21, 31]];   // seat blocks either side of the centre aisle
const AISLE_X = [19, 20];             // centre aisle (the entrance is x 18..21)

// Walking height (y of the floor cell a player stands on) for a row at z: rises 1 every 3 rows toward the north,
// capped at the stage (y 8). The row at z 51 is the entrance level, y 1.
function walkY(z) {
  return 1 + Math.min(7, Math.floor((51 - z) / 3));
}

// Set a block only into air: the dome's shell and meridians are earlier parts and stay as they are.
function put(g, x, y, z, block, state) {
  if (g.isAir(x, y, z)) g.set(x, y, z, block, state);
}

export function build(g) {
  // Tiers and the centre aisle ramp: solid smooth_quartz up to the cell below the walking surface.
  for (let z = 22; z <= 51; z++) {
    const w = walkY(z);
    for (const [x0, x1] of SEAT_X) {
      for (let x = x0; x <= x1; x++) {
        for (let y = 1; y < w; y++) put(g, x, y, z, SQ);
      }
    }
    for (const x of AISLE_X) {
      for (let y = 1; y < w; y++) put(g, x, y, z, SQ);
    }
  }

  // Seats: stairs on top of each tier, backs to the south, facing the screen (north). Rows 24..50 only, so the
  // entrance rows (z 51..52) and the stage stay clear.
  for (let z = 24; z <= 50; z++) {
    const w = walkY(z);
    for (const [x0, x1] of SEAT_X) {
      for (let x = x0; x <= x1; x++) put(g, x, w, z, ...B.stairs("smooth_quartz", "south", "bottom"));
    }
  }

  // Screen: a white frame on the north wall with a sea-lantern field, above the stage.
  for (let x = 16; x <= 23; x++) {
    for (let y = 9; y <= 14; y++) {
      const field = x >= 17 && x <= 22 && y >= 10 && y <= 13;
      put(g, x, y, 20, field ? "sea_lantern" : "white_concrete");
    }
  }

  // Lamp posts in the side aisles: quartz pillar with a standing lantern on top (it needs the block under it).
  for (const x of [4, 35]) {
    for (const z of [26, 34, 42, 50]) {
      for (let y = 1; y <= 4; y++) put(g, x, y, z, ...B.pillar("quartz_pillar"));
      put(g, x, 5, z, ...B.lantern(false));
    }
  }
}
