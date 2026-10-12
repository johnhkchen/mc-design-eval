// Room: Back bedroom (second bedroom at the back). Inner air x1..14, y10..12, z24..29 (floor spruce_planks at y9).
// Doorway (11,10..11,23) on the north wall from the landing. Rear windows on z=30 at x3..4 and x11..12 (y10..12): the
// two desks sit under them and nothing hangs over them. Beds sleep head-to-the-party-wall, one each side; the rug
// runs between them, and the chests and the desk nook are the work side. Lanterns and wall torches keep every cell lit.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const FLOOR_Y = 10;                 // standing cells; the spruce floor is the shell's y9
const SHELF_Y = 11;                 // things standing on a 1-high block at y10

const BED = "red_bed";
const CARPET = "red_carpet";
const CHEST = "chest";
const BARREL = "barrel";
const BOOKSHELF = "bookshelf";
const TABLE = "spruce_slab";        // desk top: a top-half slab at y10
const SEAT = "spruce_stairs";       // chairs: bottom-half stairs, high back away from the desk
const LANTERN = "lantern";
const CANDLE = "candle";
const TORCH = "wall_torch";
const POT = "flower_pot";

/** A single bed: head at `head`, foot at `foot` (the foot-to-head direction is `facing`), on row z. */
function bed(g, head, foot, z, facing) {
  g.set(head, FLOOR_Y, z, BED, { facing, part: "head", occupied: "false" });
  g.set(foot, FLOOR_Y, z, BED, { facing, part: "foot", occupied: "false" });
}

/** A nightstand: a barrel at y10 with a lantern standing on its lid. */
function nightstand(g, x, z) {
  g.set(x, FLOOR_Y, z, BARREL, { facing: "up", open: "false" });
  g.set(x, SHELF_Y, z, LANTERN, { hanging: "false", waterlogged: "false" });
}

/** A two-cell desk top at z, under a rear window; the chair stands in front of it (z-1) with its back to the room. */
function desk(g, x0, x1, z, chairX) {
  for (let x = x0; x <= x1; x++) g.set(x, FLOOR_Y, z, TABLE, { type: "top", waterlogged: "false" });
  g.set(chairX, FLOOR_Y, z - 1, SEAT, { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
}

export function build(g) {
  // the rug, centred between the beds
  for (let x = 5; x <= 10; x++) for (let z = 26; z <= 28; z++) g.set(x, FLOOR_Y, z, CARPET);

  // sleeping side: a bed on each party wall, head to the wall, with a nightstand at the head
  bed(g, 1, 2, 25, "west");
  bed(g, 14, 13, 25, "east");
  nightstand(g, 1, 24);
  nightstand(g, 14, 24);

  // storage: a chest on each side wall in front of the rug line
  g.set(1, FLOOR_Y, 27, CHEST, { facing: "east", type: "single", waterlogged: "false" });
  g.set(14, FLOOR_Y, 27, CHEST, { facing: "west", type: "single", waterlogged: "false" });

  // work side (focal): the west window desk is the reading nook; the lantern on it is the brightest light
  desk(g, 3, 4, 29, 3);
  g.set(3, SHELF_Y, 29, LANTERN, { hanging: "false", waterlogged: "false" });
  g.set(4, SHELF_Y, 29, POT);

  // east window: a desk with a lantern, and a shelf of books in the SE corner with a candle
  desk(g, 11, 12, 29, 11);
  g.set(12, SHELF_Y, 29, LANTERN, { hanging: "false", waterlogged: "false" });
  g.set(13, FLOOR_Y, 29, BOOKSHELF);
  g.set(14, FLOOR_Y, 29, BOOKSHELF);
  g.set(14, SHELF_Y, 29, CANDLE, { candles: "1", lit: "true", waterlogged: "false" });

  // a floor lantern on the rug's north edge, lighting the middle of the room between the beds
  g.set(8, FLOOR_Y, 25, LANTERN, { hanging: "false", waterlogged: "false" });

  // wall torches on both party walls at chest height, so the room has light away from the windows
  g.set(1, SHELF_Y, 27, TORCH, { facing: "east" });
  g.set(14, SHELF_Y, 27, TORCH, { facing: "west" });
}
