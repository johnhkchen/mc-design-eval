// Room: nave marketplace (plot 1). Interior furnisher + lamplighter for the inner air box [48,1,15,63,36,63].
// Layout: two market rows of spruce counters on barrels (z 22..24, z 54..56), a 4-wide aisle at z 37..41 kept clear,
// a lit smooth_quartz plinth with a lantern as the focal piece on the centre line, and lamp pillars (polished andesite
// with a standing lantern on top) down both sides and the centre. Block light only reaches about 15 blocks, so the
// lamps sit at floor height: a hanging lantern at the 26-block ceiling would leave the floor dark.
import { stall, ROOM_BOXES } from "../vocab.mjs";

const ROOM = ROOM_BOXES.navemarket;   // [48,1,15,63,36,63]
const [X0, Y0, Z0, X1, , Z1] = ROOM;

// a lamp pillar: polished andesite at y 1, a standing lantern on top at y 2 (only into air)
function lampPillar(g, x, z) {
  if (x < X0 || x > X1 || z < Z0 || z > Z1) return false;
  if (!/air$/.test(g.blockAt(x, Y0, z)) || !/air$/.test(g.blockAt(x, Y0 + 1, z))) return false;
  g.set(x, Y0, z, "polished_andesite");
  g.set(x, Y0 + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  return true;
}

export function build(g) {
  // ---- market counters: two rows of stalls, each row two stalls wide (x 50..52 and 58..60)
  for (const z of [23, 55]) for (const x of [50, 58]) stall(g, x, z, { y: 1, room: ROOM });

  // ---- focal piece: a lit 2x2 smooth quartz plinth on the centre line, lantern on top
  for (const x of [55, 56]) for (const z of [45, 46]) g.set(x, Y0, z, "smooth_quartz");
  for (const x of [55, 56]) for (const z of [45, 46]) g.set(x, Y0 + 1, z, "smooth_quartz");
  g.set(55, Y0 + 2, 45, "lantern", { hanging: "false", waterlogged: "false" });

  // ---- lamp pillars: down both side lanes and the centre line, clear of the aisle z 37..41
  for (const z of [18, 26, 34, 42, 50, 58]) {
    lampPillar(g, 49, z);
    lampPillar(g, 62, z);
  }
  for (const z of [18, 30, 60]) lampPillar(g, 55, z);

  // ---- floor lanterns standing on the ground course where the room check finds dim cells (lanes, not the aisle)
  for (const [x, z] of [[53, 55], [55, 43], [53, 23], [61, 34], [49, 35], [54, 63]]) g.set(x, Y0, z, "lantern", { hanging: "false", waterlogged: "false" });
}
