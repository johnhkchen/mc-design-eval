import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw967579698.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw967579698.nbt";

// Footprint 22 x 1: a two-storey tiled-and-glass shophouse row slice, c. 1980s-90s Xinyi commercial.
const W = 22, H = 23, D = 1;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (z !== 0) continue;
  ground.set(x, Math.round(gr));
}
const L = ground.size ? Math.min(...ground.values()) : 0; // lowest ground under footprint

const g = new Voxels([W, H, D]);
const put = (x, y, id, props) => {
  if (y >= 0 && y < H) g.set(x, y, 0, id, props);
};

const DOOR_X = new Set([2, 17]);
const LIT = new Map([
  [7, 2],   // shopfront display light
  [12, 3],
]);
const LIT_UPPER = new Map([
  [8, 6],   // lit upper window
  [13, 8],
]);

// Facade block for column x at height rel above lowest ground (rel 0..10).
function facade(x, rel) {
  const pil = x % 5 === 0 || x === W - 1;
  const door = DOOR_X.has(x);
  const mull = x % 5 === 1 || x % 5 === 4;
  const isLitGround = LIT.get(x) === rel;
  const isLitUpper = LIT_UPPER.get(x) === rel;

  // Penthouse on the roof, x 16..19
  if (rel >= 11 && x >= 16 && x <= 19) {
    if (rel === 13) return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }];
    if (rel === 12 && (x === 17 || x === 18)) return ["glass", null];
    return ["light_gray_concrete", null];
  }

  switch (rel) {
    case 0: // plinth course
      return ["polished_andesite", null];
    case 1: // ground storey, bulkhead / door base
      if (pil) return ["light_gray_concrete", null];
      if (door) return ["oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }];
      return ["polished_andesite", null];
    case 2: // shopfront glass / door top / lit display
      if (pil) return ["light_gray_concrete", null];
      if (door) return ["oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }];
      if (isLitGround) return ["glowstone", null];
      if (mull) return ["dark_oak_planks", null];
      return ["glass", null];
    case 3: // shopfront glass with transom
      if (pil) return ["light_gray_concrete", null];
      if (isLitGround) return ["glowstone", null];
      if (mull) return ["dark_oak_planks", null];
      return ["glass", null];
    case 4: // fascia / awning band
      if (pil) return ["light_gray_concrete", null];
      return ["red_concrete", null];
    case 5: // storey line
      if (pil) return ["light_gray_concrete", null];
      return ["smooth_stone", null];
    case 6: // upper window head
    case 8: // upper window sill
      if (pil) return ["light_gray_concrete", null];
      if (mull) return ["polished_andesite", null];
      if (isLitUpper) return ["glowstone", null];
      return ["glass_pane", null];
    case 7: // upper window transom
      if (pil) return ["light_gray_concrete", null];
      return ["polished_andesite", null];
    case 9: // lintel
      if (pil) return ["light_gray_concrete", null];
      return ["light_gray_concrete", null];
    case 10: // cornice
      return ["smooth_stone", null];
    case 11: // parapet cap
      if (pil) return ["light_gray_concrete", null];
      return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }];
    default:
      return null;
  }
}

for (let x = 0; x < W; x++) {
  const gr = ground.get(x) ?? L;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) put(x, y, "stone_bricks");

  // Facade stacked from the lowest ground so storeys line up across the row.
  for (let rel = 0; rel <= 11; rel++) {
    const y = L + rel;
    if (y < gr) continue; // already foundation
    const b = facade(x, rel);
    if (!b) continue;
    const [id, props] = b;
    put(x, y, id, props ?? undefined);
  }
}

g.save(OUT);
