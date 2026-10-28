// Lordaeron's founding kit (thread 0012): what a town founded on open ground stands with before its houses come. Parts
// on the yard contract: layers 0-1 ground (dirt), 2 the surface, 3 up the features; authored with the street (or the
// square) to the south. No point-of-interest blocks (decorative twins only), no beds; every walkable cell lit.
//   founding_stone_3   the charter stone at the square's edge: a carved stone on a stepped plinth, the founders' banner
//   market_cross_5     the square's centrepiece: a stone cross on two steps, lanterns hung from its arms
//   well_3             a well: a fieldstone curb, a timber frame and a slate hood, a bucket's chain and a lantern
//   camp_9x7           the settlers' first nights: two tents, a covered cart with its load, a cook fire, lamps
//   stake_1            where the wall will run: a post with a cloth, every 8 along the line
//   gate_posts_5       the road's way in: two posts on fieldstone bases either side of a 3-wide street, lanterns
//   notice_board_3     a timber board under a little roof, by the bell
import { Grid } from "../grid.mjs";

const GRASS = "grass_block[snowy=false]";
const fence = (wood = "spruce", e = false, w = false, n = false, s = false) => `${wood}_fence[east=${e},north=${n},south=${s},waterlogged=false,west=${w}]`;
const stairs = (b, f, half = "bottom") => `${b}_stairs[facing=${f},half=${half},shape=straight,waterlogged=false]`;
const slab = (b, t = "bottom") => `${b}_slab[type=${t},waterlogged=false]`;
const wall = (b, up = true) => `${b}_wall[east=none,north=none,south=none,up=${up},waterlogged=false,west=none]`;
const LANTERN = "lantern[hanging=false,waterlogged=false]", HANGING = "lantern[hanging=true,waterlogged=false]";

function ground(w, d, h, surface = () => GRASS) {
  const g = new Grid([w, h, d]);
  for (let x = 0; x < w; x++) for (let z = 0; z < d; z++) { g.set(x, 0, z, "dirt"); g.set(x, 1, z, "dirt"); g.set(x, 2, z, surface(x, z)); }
  return g;
}

export function foundingStone() {
  const g = ground(3, 3, 9, (x, z) => (x === 1 && z === 1 ? "stone_bricks" : "cobblestone"));
  // the plinth: a ring of slab steps round a stone base, the stone 3 high, carved, a wall cap, the banner on its face
  for (let x = 0; x < 3; x++) for (let z = 0; z < 3; z++) if (x !== 1 || z !== 1) g.set(x, 3, z, slab("stone_brick"));
  g.set(1, 3, 1, "stone_bricks"); g.set(1, 4, 1, "chiseled_stone_bricks"); g.set(1, 5, 1, "mossy_stone_bricks"); g.set(1, 6, 1, wall("stone_brick"));
  g.set(1, 7, 1, LANTERN);
  g.set(1, 5, 2, "white_wall_banner[facing=south]");                              // the founders' banner, toward the square
  return g;
}

export function marketCross() {
  const g = ground(5, 5, 11, () => "cobblestone");
  // two steps: the outer ring a stair up toward the middle, the inner 3 x 3 a full course
  for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) {
    const ring = Math.max(Math.abs(x - 2), Math.abs(z - 2));
    if (ring === 2) g.set(x, 3, z, x === 0 && z !== 0 && z !== 4 ? stairs("stone_brick", "east") : x === 4 && z !== 0 && z !== 4 ? stairs("stone_brick", "west") : z === 0 && x !== 0 && x !== 4 ? stairs("stone_brick", "south") : z === 4 && x !== 0 && x !== 4 ? stairs("stone_brick", "north") : slab("stone_brick"));
    else if (ring === 1) g.set(x, 3, z, "stone_bricks");
    else g.set(x, 3, z, "chiseled_stone_bricks");
  }
  for (let x = 1; x < 4; x++) for (let z = 1; z < 4; z++) if (x !== 2 || z !== 2) g.set(x, 4, z, slab("stone_brick"));
  // the shaft and the head: a wall shaft 3 high, a carved head, its arms upturned stairs east and west, lanterns hung
  g.set(2, 4, 2, "stone_bricks");
  for (let y = 5; y <= 7; y++) g.set(2, y, 2, wall("stone_brick"));
  g.set(2, 8, 2, "chiseled_stone_bricks"); g.set(2, 9, 2, wall("stone_brick"));
  g.set(1, 8, 2, stairs("stone_brick", "east", "top")); g.set(3, 8, 2, stairs("stone_brick", "west", "top"));
  g.set(1, 7, 2, HANGING); g.set(3, 7, 2, HANGING);
  return g;
}

export function well() {
  const g = ground(3, 3, 9, () => "cobblestone");
  // the curb round the shaft, the water, a timber frame with a crossbar, a slate hood, a chain to the water
  for (let x = 0; x < 3; x++) for (let z = 0; z < 3; z++) if (x !== 1 || z !== 1) g.set(x, 3, z, x % 2 === 0 && z % 2 === 0 ? "mossy_cobblestone" : wall("cobblestone"));
  g.set(1, 2, 1, "water"); g.set(1, 1, 1, "water");
  for (const x of [0, 2]) { g.set(x, 4, 1, fence()); g.set(x, 5, 1, fence()); }
  g.set(1, 5, 1, "chain[axis=y,waterlogged=false]"); g.set(1, 4, 1, "chain[axis=y,waterlogged=false]");
  for (let x = 0; x < 3; x++) { g.set(x, 6, 0, stairs("deepslate_tile", "south")); g.set(x, 6, 2, stairs("deepslate_tile", "north")); g.set(x, 6, 1, "stripped_spruce_log[axis=x]"); g.set(x, 7, 1, slab("deepslate_tile")); }
  g.set(1, 5, 0, HANGING);
  return g;
}

/** A ridge tent along z: 3 wide, `len` deep, its mouth to the south: canvas stairs leaning in to a slab ridge (an
 *  A-frame), a pole at each end of the ridge, a hay bedroll at the back. canvas: a block with stairs and slabs. */
function tent(g, x0, z0, len, canvas) {
  for (let z = z0; z < z0 + len; z++) {
    g.set(x0, 3, z, `${canvas}_stairs[facing=east,half=bottom,shape=straight,waterlogged=false]`);
    g.set(x0 + 2, 3, z, `${canvas}_stairs[facing=west,half=bottom,shape=straight,waterlogged=false]`);
    g.set(x0 + 1, 4, z, `${canvas}_slab[type=bottom,waterlogged=false]`);
  }
  g.set(x0 + 1, 3, z0, "hay_block[axis=z]");                                   // the bedroll at the back
  g.set(x0 + 1, 3, z0 + len - 1, fence()); g.set(x0 + 1, 4, z0 + len - 1, fence());   // the front pole
  g.set(x0 + 1, 5, z0 + len - 1, fence());
}

export function camp() {
  const W = 9, D = 7, g = ground(W, D, 8, (x, z) => ((x * 7 + z * 3) % 5 === 0 ? "coarse_dirt" : (x * 5 + z) % 7 === 0 ? "dirt_path" : GRASS));
  tent(g, 0, 0, 3, "smooth_sandstone"); tent(g, 4, 0, 3, "birch");
  // the cook fire between the tents and the street: a stone ring, the fire (out by day), a spit on two posts
  g.set(3, 2, 4, "cobblestone"); g.set(3, 3, 4, "campfire[facing=south,lit=false,signal_fire=false,waterlogged=false]");
  g.set(2, 3, 4, fence()); g.set(4, 3, 4, fence());
  g.set(2, 3, 5, "spruce_stairs[facing=east,half=bottom,shape=straight,waterlogged=false]");                     // a seat
  // the cart: a plank bed on four wheels, a hooped cover of white wool on fences, barrels and hay, its shafts down
  const cx = 6, cz = 4;
  for (let x = cx; x < cx + 3; x++) for (let z = cz; z < cz + 2; z++) g.set(x, 3, z, slab("oak", "top"));
  for (const [x, z, f] of [[cx, cz - 1, "north"], [cx + 2, cz - 1, "north"], [cx, cz + 2, "south"], [cx + 2, cz + 2, "south"]]) g.set(x, 3, z, `dark_oak_trapdoor[facing=${f},half=bottom,open=true,powered=false,waterlogged=false]`);
  g.set(cx, 4, cz, "enterprise:decor_barrel[facing=up,open=false]"); g.set(cx + 1, 4, cz, "hay_block[axis=x]"); g.set(cx + 1, 4, cz + 1, "enterprise:decor_barrel[facing=up,open=false]");
  for (let x = cx; x < cx + 3; x++) { g.set(x, 5, cz, "white_carpet"); g.set(x, 5, cz + 1, "white_carpet"); }
  g.set(cx + 2, 4, cz, fence("oak")); g.set(cx + 2, 4, cz + 1, fence("oak"));
  g.set(cx - 1, 3, cz, fence("oak", true)); g.set(cx - 1, 3, cz + 1, fence("oak", true));
  // stores: a chest and crates by the tents, a woodpile
  g.set(3, 3, 0, "chest[facing=south,type=single,waterlogged=false]"); g.set(3, 3, 1, "enterprise:decor_barrel[facing=up,open=false]");
  g.set(8, 3, 1, "oak_log[axis=z]"); g.set(8, 3, 2, "oak_log[axis=z]"); g.set(8, 4, 1, "oak_log[axis=z]");
  // lamps on posts so no grass lies dark
  for (const [x, z] of [[0, 4], [5, 6], [8, 6], [3, 2]]) { g.set(x, 3, z, fence()); g.set(x, 4, z, LANTERN); }
  return g;
}

export function stake() {
  const g = ground(1, 1, 7);
  g.set(0, 3, 0, fence()); g.set(0, 4, 0, fence()); g.set(0, 5, 0, "red_carpet");    // a cloth on the post's head
  return g;
}

export function gatePosts() {
  const g = ground(5, 1, 9, (x) => (x === 0 || x === 4 ? "cobblestone" : "dirt_path"));
  for (const x of [0, 4]) {
    g.set(x, 3, 0, "mossy_cobblestone"); g.set(x, 4, 0, "cobblestone");
    for (let y = 5; y <= 6; y++) g.set(x, y, 0, "spruce_log[axis=y]");
    g.set(x, 7, 0, slab("spruce")); g.set(x, 8, 0, LANTERN);
  }
  return g;
}

export function noticeBoard() {
  const g = ground(3, 1, 8, () => "cobblestone");
  for (const x of [0, 2]) for (let y = 3; y <= 5; y++) g.set(x, y, 0, "spruce_log[axis=y]");
  g.set(1, 4, 0, "birch_planks"); g.set(1, 5, 0, "birch_planks");                  // the board, pale where notices hang
  g.set(1, 3, 0, slab("spruce", "top"));
  for (let x = 0; x < 3; x++) g.set(x, 6, 0, slab("deepslate_tile"));
  g.set(1, 6, 0, "deepslate_tile_stairs[facing=south,half=bottom,shape=straight,waterlogged=false]");
  g.set(0, 7, 0, LANTERN);
  return g;
}

export function lordaeronFounding() {
  return [
    { id: "founding_stone_3", grid: foundingStone(), meta: { width: 3, depth: 3, tags: ["founding", "square", "lamp"], place: "the forum's edge, beside the bell, facing the square" } },
    { id: "market_cross_5", grid: marketCross(), meta: { width: 5, depth: 5, tags: ["founding", "square", "centrepiece", "lamp"], place: "the forum's middle until the forum's buildings come; stays as the market cross" } },
    { id: "well_3", grid: well(), meta: { width: 3, depth: 3, tags: ["founding", "square", "well", "lamp"], place: "beside the cross, or on the main street" } },
    { id: "camp_9x7", grid: camp(), meta: { width: 9, depth: 7, tags: ["founding", "camp", "temporary", "lamp"], place: "a plot at the main street's end; cleared when the first house has its beds (never counted as beds)" } },
    { id: "stake_1", grid: stake(), meta: { width: 1, depth: 1, tags: ["founding", "wall_line", "temporary"], place: "every 8 along the inner wall's line, until the stockade" } },
    { id: "gate_posts_5", grid: gatePosts(), meta: { width: 5, depth: 1, tags: ["founding", "gate", "temporary", "lamp"], place: "astride the main street where it crosses the inner wall's line: x 1-3 the street" } },
    { id: "notice_board_3", grid: noticeBoard(), meta: { width: 3, depth: 1, tags: ["founding", "square", "lamp"], place: "by the bell, facing the square" } },
  ];
}
