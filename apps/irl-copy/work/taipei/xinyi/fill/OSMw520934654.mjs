import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1970s-80s Taipei commercial block: stone plinth, white tiled-concrete
// walls, two storeys in 7 blocks (ground shopfront 4 blocks, upper storey with a
// storey line, stone cornice and parapet), flat gray roof deck.
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw520934654.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw520934654.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 34, H = 19, D = 13;
const g = new Voxels([W, H, D]);

const gr = new Map();
for (const [x, z, gy] of cells) gr.set(x + "," + z, gy);
const inside = (x, z) => gr.has(x + "," + z);
const L = Math.min(...cells.map((c) => c[2]));   // lowest ground under the footprint
const TOP = L + 6;                                // roof top layer, 7 blocks above L

const perimeter = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

const windowBlock = (idx) => {
  const m = ((idx % 4) + 4) % 4;
  if (m === 1 || m === 2) return "glass";
  if (m === 0) return "smooth_quartz";
  return "white_concrete";
};

const DOOR_X = 16;

for (const [x, z, gy] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const perim = perimeter(x, z);
  const street = z === 0;
  const idx = street || z === D - 1 ? x : z; // facade index along the face

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy && y < H; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gy; y <= TOP && y < H; y++) {
    const rel = y - L;

    if (!perim) {
      // Interior: floor slabs, roof deck, air gap, warm light behind street glass.
      let b = null;
      if (y === gy || rel === 4) b = "smooth_stone";
      else if (rel === 6) b = "gray_concrete";
      else if (rel === 5 && z === 1 && x % 8 === 5) b = "glowstone";
      if (b) g.set(x, y, z, b);
      continue;
    }

    // Perimeter facade.
    if (y === gy || rel === 0) { g.set(x, y, z, "stone_bricks"); continue; }
    if (rel === 4) { g.set(x, y, z, "stone_bricks"); continue; }     // storey line
    if (rel === 6) { g.set(x, y, z, "stone_bricks"); continue; }     // parapet cap

    if (rel === 5) { g.set(x, y, z, windowBlock(idx)); continue; }   // upper windows

    // rel 1..3: ground storey
    if (street) {
      if (rel === 3) { g.set(x, y, z, "stone_bricks"); continue; }  // shopfront lintel
      if (idx === DOOR_X) {
        if (rel === 1) g.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        if (rel === 2) g.set(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      g.set(x, y, z, windowBlock(idx));
      continue;
    }
    g.set(x, y, z, windowBlock(idx));
  }
}

g.save(OUT);
