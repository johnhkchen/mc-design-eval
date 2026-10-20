import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1335587033";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Low-rise two-storey commercial block (1970s-80s Taipei shophouse type):
// white-painted render walls, stone plinth, shopfront ground floor, tinted
// glass strip windows on the upper floor, flat deck roof with a parapet.
const W = 7, H = 19, D = 30;
const g = new Voxels([W, H, D]);

const ROOF = 7;   // roof deck layer (top of building is ~7 blocks above lowest ground)
const FLOOR = 4;  // storey line between ground floor and upper floor
const PARAPET = 8;

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const WALL = "white_concrete";
const PLINTH = "stone_bricks";
const BAND = "light_gray_concrete";
const MULLION = "light_gray_concrete";
const GLASS_GROUND = "light_blue_stained_glass";
const GLASS_UPPER = "cyan_stained_glass";
const DECK = "smooth_stone";
const CORNER = "stone_bricks";

function isEdge(x, z) {
  return x === 0 || x === W - 1 || z === 0 || z === D - 1;
}
function isCorner(x, z) {
  return (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
}

// Decide what a shell cell is at height y for ground level gr.
function shellBlock(x, y, z, gr) {
  if (y < gr) return null;
  // parapet above the deck
  if (y === PARAPET) return isCorner(x, z) ? CORNER : WALL;
  if (y > ROOF) return null;
  if (y === ROOF) return BAND; // cornice course under parapet line
  // plinth course at the base
  if (y === gr) return PLINTH;
  // storey line
  if (y === FLOOR) return BAND;
  if (isCorner(x, z)) return CORNER;

  const ground = y < FLOOR;
  const isSide = x === 0 || x === W - 1;

  if (isSide) {
    // bays: glass on z where (z-1)%3 !== 2, otherwise a mullion column
    const bay = (z - 1) % 3 !== 2;
    if (!bay) return MULLION;
    return ground ? GLASS_GROUND : GLASS_UPPER;
  }

  // end walls (z = 0 or z = D-1)
  if (x === 3 && ground) {
    // entrance zone: door cells handled below, lintel above
    return WALL;
  }
  if (x === 3) return MULLION;
  if (x === 2 || x === 4) return MULLION;
  return ground ? GLASS_GROUND : GLASS_UPPER;
}

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, PLINTH);

  // Roof deck across the whole footprint
  if (ROOF >= gr) put(x, ROOF, z, DECK);

  if (edge) {
    for (let y = gr; y <= PARAPET; y++) {
      const b = shellBlock(x, y, z, gr);
      if (b) put(x, y, z, b);
    }
    // Entrance door on the north end (z = 0), centred at x = 3
    if (z === 0 && x === 3) {
      const lo = gr + 1, hi = gr + 2;
      if (hi < FLOOR) {
        put(x, lo, z, "spruce_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, hi, z, "spruce_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      }
    }
    // Lanterns beside the entrance on the ground floor
    if (z === 0 && (x === 2 || x === 4)) {
      put(x, gr + 2, z, MULLION);
    }
  } else {
    // Interior: ground floor slab, storey slab, and air gap elsewhere
    if (gr < FLOOR) put(x, gr, z, DECK);
    if (FLOOR > gr) put(x, FLOOR, z, DECK);
  }
}

// Warm lights behind the glass: glowstone in the air gap on upper windows,
// lanterns in ground-floor shopfronts, spaced so the facade glows at dusk.
for (const [x, z, gr] of cells) {
  if (!(x === 0 || x === W - 1)) continue;
  if (z <= 0 || z >= D - 1) continue;
  const bay = (z - 1) % 3 !== 2;
  if (!bay) continue;
  const inner = x === 0 ? 1 : W - 2;
  if (z % 6 === 1) {
    put(inner, FLOOR + 1, z, "glowstone");
  }
  if (z % 6 === 4 && gr + 1 < FLOOR) {
    put(inner, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Interior air gaps behind end-wall windows
for (const [x, z, gr] of cells) {
  if (z === 0 && x === 1) put(1, FLOOR + 1, 1, "glowstone");
  if (z === 0 && x === 5) put(5, FLOOR + 1, 1, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
