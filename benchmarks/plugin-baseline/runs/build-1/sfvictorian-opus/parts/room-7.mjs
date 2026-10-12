// Room: front bedroom (plan.md ROOMS, interior designer). Main bedroom: double bed facing the bay, wardrobe, vanity,
// reading chair in the bay alcove. Inner air x2..9 z8..17 y9..11, plus the bay alcove (2..5, 9..11, 6); the one way in
// is the door at (10, 9..10, 12). Everything is added into air only (put); the window cells stay clear.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  DARK_OAK_FENCE, DARK_OAK_PLANKS, DARK_OAK_STAIRS, RED_BED, WHITE_CARPET, BARREL, POTTED_FERN, SPRUCE_PRESSURE_PLATE,
  hangLamp,
} from "../vocab.mjs";

const isAir = (g, x, y, z) => ["minecraft:air", "minecraft:cave_air"].includes(g.blockAt(x, y, z));
// Add into air only: a cell another part already owns is skipped, never overwritten.
function put(g, x, y, z, block, state) {
  if (!isAir(g, x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
}

export function build(g) {
  // Floor: a white rug under the middle of the room, clear of the door path (door (10,12) -> bed (5,15..16)).
  for (let x = 3; x <= 6; x++) for (let z = 10; z <= 12; z++) put(g, x, 9, z, WHITE_CARPET);

  // Double bed on the south side, head to the south wall, looking north across the room at the bay.
  // Minecraft bed facing = direction from foot to head, so facing=south puts the head at z16 and the foot at z15.
  put(g, 5, 9, 15, RED_BED, { facing: "south", part: "foot", occupied: "false" });
  put(g, 5, 9, 16, RED_BED, { facing: "south", part: "head", occupied: "false" });

  // Bedside barrels, each with a lantern standing on top: a lit pair bracketing the headboard.
  for (const x of [4, 6]) {
    put(g, x, 9, 16, BARREL, { facing: "up", open: "false" });
    put(g, x, 10, 16, "lantern", B.lantern(false)[1]);
  }

  // Wardrobe against the party wall: a dark oak cabinet, two wide and three tall.
  for (let z = 12; z <= 13; z++) for (let y = 9; y <= 11; y++) put(g, 2, y, z, DARK_OAK_PLANKS);

  // Vanity under the front window: a fence leg with a plate for the dressing top, and a stool facing it.
  put(g, 8, 9, 8, DARK_OAK_FENCE);
  put(g, 8, 10, 8, SPRUCE_PRESSURE_PLATE);
  put(g, 8, 9, 9, ...B.stairs("dark_oak", "north", "bottom"));

  // Reading chair in the bay alcove: stairs facing the window (north), back to the wall, with a standing lantern beside it.
  put(g, 3, 9, 6, ...B.stairs("dark_oak", "north", "bottom"));
  put(g, 2, 9, 6, "lantern", B.lantern(false)[1]);
  put(g, 5, 9, 6, POTTED_FERN);

  // Ceiling lamp over the rug: the focal light, hung from the floor slab above.
  hangLamp(g, 5, 11, 11, { drop: 1 });
}
