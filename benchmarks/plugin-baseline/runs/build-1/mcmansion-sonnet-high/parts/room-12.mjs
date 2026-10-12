// room: Bedroom 3 (plan ROOMS): inner air x27..32, y6..8, z9..14; floor = the y5 layer (oak_planks, shell).
// Guest/girl's room in pink and white. Entry: door (26,6..7,14) from the upper hall, so the way in is (27,6,14).
// Bay opening (30..32,6..8,8) to the turret nook: keep (30..32,6..8,9) clear. East window (33,7..8,10..11): nothing on
// (32,7..8,10..11). Layout: bed focal on the east wall (head against the wall, facing east), white/red rug in the
// middle, dresser (2 chests) and wardrobe (birch planks) on the west wall, a dressing table with a stool by the bay.
// Light: three hanging lanterns under the ceiling (y8), the brightest one over the bed.

const BOX = { x0: 27, y0: 6, z0: 9, x1: 32, y1: 8, z1: 14 };
const inBox = (x, y, z) => x >= BOX.x0 && x <= BOX.x1 && y >= BOX.y0 && y <= BOX.y1 && z >= BOX.z0 && z <= BOX.z1;

// Places one block only into air inside this room's box (earlier parts' blocks are locked).
function put(g, x, y, z, block, state = {}) {
  if (!inBox(x, y, z)) throw new Error(`room-12: ${x},${y},${z} is outside the room box`);
  if (!g.isAir(x, y, z)) return;
  g.set(x, y, z, block, state);
}

export function build(g) {
  // bed: white, head against the east wall, facing east (foot -> head); one bed = two cells along x
  put(g, 31, 6, 13, "white_bed", { facing: "east", part: "foot", occupied: "false" });
  put(g, 32, 6, 13, "white_bed", { facing: "east", part: "head", occupied: "false" });

  // bedside table: barrel with a potted plant (the pink note)
  put(g, 32, 6, 12, "barrel", { facing: "up", open: "false" });
  put(g, 32, 7, 12, "potted_azalea_bush");

  // rug: white carpet with a red centre
  put(g, 29, 6, 11, "red_carpet");
  for (let x = 28; x <= 30; x++)
    for (let z = 10; z <= 12; z++) put(g, x, 6, z, "white_carpet");

  // dresser: two chests on the west wall, fronts facing the room
  put(g, 27, 6, 9, "chest", { facing: "east", type: "single", waterlogged: "false" });
  put(g, 27, 6, 10, "chest", { facing: "east", type: "single", waterlogged: "false" });

  // wardrobe: a tall birch cabinet on the west wall, z11..12, three high
  for (let y = 6; y <= 8; y++)
    for (let z = 11; z <= 12; z++) put(g, 27, y, z, "birch_planks");

  // dressing table by the bay: slab table with a stool (stair facing east: back to the east, seat faces west)
  put(g, 28, 6, 9, "oak_slab", { type: "bottom", waterlogged: "false" });
  put(g, 29, 6, 9, "oak_stairs", { facing: "east", half: "bottom", shape: "straight", waterlogged: "false" });

  // lights: hanging lanterns from the ceiling, the brightest over the bed
  put(g, 31, 8, 12, "lantern", { hanging: "true", waterlogged: "false" });
  put(g, 28, 8, 12, "lantern", { hanging: "true", waterlogged: "false" });
  put(g, 29, 8, 10, "lantern", { hanging: "true", waterlogged: "false" });
}
