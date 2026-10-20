// Part "room: B upper exhibit floor": the upper gallery of hands-on exhibits, inside ROOM_BOX.b_upper (y 11..17, the
// floor deck at y 10, the ceiling deck at y 18). The stair joiner's flight sits at x 43..44, z 25..32 and is kept clear.
// Layout: a glass-cased focal piece (a glowing sea-lantern core) centred on the north doorways' view down the room;
// four hands-on tables (a quartz block, an end rod exhibit on top, a stair chair each side) on the south half; a clear
// lane along z 35..37 from the stair to the east, and lanterns hung from the deck above every few cells.
import { ROOM_BOX } from "../vocab/base.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const PANE = "gray_stained_glass_pane";
const FLOOR_Y = 11;

// The four cells of a glass case's wall ring, joined to their neighbours in the ring (panes connect sideways only).
function paneState(ring, x, z) {
  const on = (dx, dz) => ring.has(`${x + dx},${z + dz}`);
  return {
    north: String(on(0, -1)),
    south: String(on(0, 1)),
    east: String(on(1, 0)),
    west: String(on(-1, 0)),
    waterlogged: "false",
  };
}

export function build(g) {
  const [bx0, by0, bz0, bx1, by1, bz1] = ROOM_BOX.b_upper;

  // Focal piece: a 3x3 glass case on a quartz plinth, a sea-lantern core, a quartz lid. Centred on x 105, z 40.
  const cx0 = 104, cx1 = 106, cz0 = 39, cz1 = 41;
  g.fill([cx0, FLOOR_Y, cz0], [cx1, FLOOR_Y, cz1], "smooth_quartz");
  const ring = new Set();
  for (let x = cx0; x <= cx1; x++) for (let z = cz0; z <= cz1; z++) if (!(x === 105 && z === 40)) ring.add(`${x},${z}`);
  for (const key of ring) {
    const [x, z] = key.split(",").map(Number);
    for (const y of [FLOOR_Y + 1, FLOOR_Y + 2]) g.set(x, y, z, PANE, paneState(ring, x, z));
  }
  g.set(105, FLOOR_Y + 1, 40, "sea_lantern");
  for (let x = cx0; x <= cx1; x++) for (let z = cz0; z <= cz1; z++) g.set(x, FLOOR_Y + 3, z, ...B.slab("smooth_quartz", "bottom"));

  // Four hands-on tables on the south half. Each is a quartz block (the table top is its face), an end rod exhibit
  // standing on it, and a stair chair north (facing north, back to the wall side) and south of it.
  for (const tx of [60, 78, 122, 136]) {
    const tz = 42;
    g.set(tx, FLOOR_Y, tz, "smooth_quartz");
    g.set(tx, FLOOR_Y + 1, tz, "end_rod", { facing: "up" });
    g.set(tx, FLOOR_Y, tz - 1, ...B.stairs("smooth_quartz", "north", "bottom"));
    g.set(tx, FLOOR_Y, tz + 1, ...B.stairs("smooth_quartz", "south", "bottom"));
  }

  // Lamps hung on chains from the deck (y 18): chain y 15..17, lantern hanging at y 14, so the light reaches the floor
  // (y 11) at 12 minus the distance across; a lattice of them every 8 cells keeps every floor cell lit.
  for (const lx of [48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128, 136]) for (const lz of [28, 36, 44, 49]) {
    for (let y = by1 - 2; y <= by1; y++) g.set(lx, y, lz, ...B.chain("y", false));
    g.set(lx, by1 - 3, lz, ...B.lantern(true));
  }
}
