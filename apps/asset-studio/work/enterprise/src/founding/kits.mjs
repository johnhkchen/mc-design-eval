// Dalaran's and Stormwind's founding kits (thread 0012): the same seven parts as Lordaeron's (src/lordaeron/founding.mjs,
// batch 034), the same ids and sizes and the same contract, so a founder lays any kingdom's kit the same way: layers
// 0-1 ground, 2 the surface, 3 up the features; the street or square to the south; no point-of-interest blocks, no
// beds, every walkable cell lit. Only the centrepiece differs by kingdom: Lordaeron's market cross, Dalaran's well
// pavilion under a hipped roof, Stormwind's fountain. Each kingdom is a style below.
import { Grid } from "../grid.mjs";
import { hipRoof } from "../dalaran/modules.mjs";

const GRASS = "grass_block[snowy=false]";
const fenceOf = (wood) => `${wood}_fence[east=false,north=false,south=false,waterlogged=false,west=false]`;
const stairs = (b, f, half = "bottom") => `${b}_stairs[facing=${f},half=${half},shape=straight,waterlogged=false]`;
const slab = (b, t = "bottom") => `${b}_slab[type=${t},waterlogged=false]`;
const wall = (b) => `${b}_wall[east=none,north=none,south=none,up=true,waterlogged=false,west=none]`;
const LANTERN = "lantern[hanging=false,waterlogged=false]", HANGING = "lantern[hanging=true,waterlogged=false]";

export const KITS = {
  // Dalaran: polished andesite and dressed stone, red mangrove posts, dark timber, violet tile, red and gold cloth
  dalaran: { pave: "polished_andesite", pave2: "stone_bricks", stone: "stone_brick", plinth: "polished_andesite", carve: "chiseled_stone_bricks",
    post: "stripped_mangrove_log[axis=y]", wood: "dark_oak", postWood: "mangrove", roof: "purpur", banner: "red", cloth: "yellow_carpet",
    canvas: ["cherry", "smooth_sandstone"], board: "stripped_birch_wood[axis=y]", curb: "andesite", base: "polished_andesite" },
  // Stormwind: white stone and smooth quartz, blue-grey slate, oak, its blue and gold
  stormwind: { pave: "smooth_stone", pave2: "stone_bricks", stone: "stone_brick", plinth: "smooth_quartz", carve: "chiseled_quartz_block",
    post: "quartz_pillar[axis=y]", wood: "oak", postWood: "oak", roof: "deepslate_tile", banner: "blue", cloth: "blue_carpet",
    canvas: ["smooth_quartz", "birch"], board: "birch_planks", curb: "stone_brick", base: "stone_bricks" },
};

function ground(w, d, h, surface = () => GRASS) {
  const g = new Grid([w, h, d]);
  for (let x = 0; x < w; x++) for (let z = 0; z < d; z++) { g.set(x, 0, z, "dirt"); g.set(x, 1, z, "dirt"); g.set(x, 2, z, surface(x, z)); }
  return g;
}

function foundingStone(S) {
  const g = ground(3, 3, 9, (x, z) => (x === 1 && z === 1 ? S.base : S.pave));
  for (let x = 0; x < 3; x++) for (let z = 0; z < 3; z++) if (x !== 1 || z !== 1) g.set(x, 3, z, slab(S.stone));
  g.set(1, 3, 1, S.plinth); g.set(1, 4, 1, S.carve); g.set(1, 5, 1, S.plinth); g.set(1, 6, 1, wall(S.stone));
  g.set(1, 7, 1, LANTERN);
  g.set(1, 5, 2, `${S.banner}_wall_banner[facing=south]`);
  return g;
}

/** Dalaran: a well under a little pavilion: an andesite curb round the water, four red posts, a hipped violet roof. */
function wellPavilion(S) {
  const g = ground(5, 5, 12, (x, z) => ((x + z) % 2 ? S.pave : S.pave2));
  for (let x = 1; x < 4; x++) for (let z = 1; z < 4; z++) if (x !== 2 || z !== 2) g.set(x, 3, z, wall(S.curb));
  g.set(2, 2, 2, "water"); g.set(2, 1, 2, "water");
  for (const [x, z] of [[0, 0], [4, 0], [0, 4], [4, 4]]) for (let y = 3; y <= 6; y++) g.set(x, y, z, S.post);
  for (let x = 0; x < 5; x++) for (const z of [0, 4]) g.set(x, 6, z, `stripped_dark_oak_log[axis=x]`);
  for (let z = 1; z < 4; z++) for (const x of [0, 4]) g.set(x, 6, z, `stripped_dark_oak_log[axis=z]`);
  g.paste(hipRoof(5, 5), 0, 7, 0);
  g.set(2, 6, 2, "chain[axis=y,waterlogged=false]"); g.set(2, 5, 2, "chain[axis=y,waterlogged=false]");
  g.set(1, 6, 1, HANGING); g.set(3, 6, 3, HANGING);
  return g;
}

/** Stormwind: a fountain: a quartz basin of still water two steps up, a column in the middle with lanterns. */
function fountain(S) {
  const g = ground(5, 5, 11, (x, z) => ((x + z) % 2 ? S.pave : S.pave2));
  for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) {
    const ring = Math.max(Math.abs(x - 2), Math.abs(z - 2));
    if (ring === 2) g.set(x, 3, z, x === 0 || x === 4 || z === 0 || z === 4 ? (x % 4 === 0 && z % 4 === 0 ? "smooth_quartz" : stairs("quartz", x === 0 ? "east" : x === 4 ? "west" : z === 0 ? "south" : "north")) : "smooth_quartz");
    else if (ring === 1) { g.set(x, 3, z, "water"); g.set(x, 2, z, "smooth_quartz"); }
  }
  g.set(2, 3, 2, "quartz_pillar[axis=y]"); g.set(2, 4, 2, "quartz_pillar[axis=y]"); g.set(2, 5, 2, S.carve); g.set(2, 6, 2, wall("stone_brick")); g.set(2, 7, 2, LANTERN);
  for (const [x, z] of [[0, 0], [4, 0], [0, 4], [4, 4]]) { g.set(x, 4, z, wall("stone_brick")); g.set(x, 5, z, LANTERN); }
  return g;
}

function well(S) {
  const g = ground(3, 3, 9, () => S.pave);
  for (let x = 0; x < 3; x++) for (let z = 0; z < 3; z++) if (x !== 1 || z !== 1) g.set(x, 3, z, x % 2 === 0 && z % 2 === 0 ? S.base : wall(S.curb));
  g.set(1, 2, 1, "water"); g.set(1, 1, 1, "water");
  for (const x of [0, 2]) { g.set(x, 4, 1, fenceOf(S.postWood)); g.set(x, 5, 1, fenceOf(S.postWood)); }
  g.set(1, 5, 1, "chain[axis=y,waterlogged=false]"); g.set(1, 4, 1, "chain[axis=y,waterlogged=false]");
  for (let x = 0; x < 3; x++) { g.set(x, 6, 0, stairs(S.roof, "south")); g.set(x, 6, 2, stairs(S.roof, "north")); g.set(x, 6, 1, `stripped_${S.wood}_log[axis=x]`); g.set(x, 7, 1, slab(S.roof)); }
  g.set(1, 5, 0, HANGING);
  return g;
}

function tent(g, S, x0, z0, len, canvas) {
  for (let z = z0; z < z0 + len; z++) {
    g.set(x0, 3, z, stairs(canvas, "east")); g.set(x0 + 2, 3, z, stairs(canvas, "west")); g.set(x0 + 1, 4, z, slab(canvas));
  }
  g.set(x0 + 1, 3, z0, "hay_block[axis=z]");
  for (let y = 3; y <= 5; y++) g.set(x0 + 1, y, z0 + len - 1, fenceOf(S.postWood));
}

function camp(S) {
  const W = 9, D = 7, g = ground(W, D, 8, (x, z) => ((x * 7 + z * 3) % 5 === 0 ? "coarse_dirt" : (x * 5 + z) % 7 === 0 ? "dirt_path" : GRASS));
  tent(g, S, 0, 0, 3, S.canvas[0]); tent(g, S, 4, 0, 3, S.canvas[1]);
  g.set(3, 2, 4, "cobblestone"); g.set(3, 3, 4, "campfire[facing=south,lit=false,signal_fire=false,waterlogged=false]");
  g.set(2, 3, 4, fenceOf(S.postWood)); g.set(4, 3, 4, fenceOf(S.postWood));
  g.set(2, 3, 5, stairs(S.wood, "east"));
  const cx = 6, cz = 4;
  for (let x = cx; x < cx + 3; x++) for (let z = cz; z < cz + 2; z++) g.set(x, 3, z, slab(S.wood, "top"));
  for (const [x, z, f] of [[cx, cz - 1, "north"], [cx + 2, cz - 1, "north"], [cx, cz + 2, "south"], [cx + 2, cz + 2, "south"]]) g.set(x, 3, z, `dark_oak_trapdoor[facing=${f},half=bottom,open=true,powered=false,waterlogged=false]`);
  g.set(cx, 4, cz, "enterprise:decor_barrel[facing=up,open=false]"); g.set(cx + 1, 4, cz, "hay_block[axis=x]"); g.set(cx + 1, 4, cz + 1, "enterprise:decor_barrel[facing=up,open=false]");
  for (let x = cx; x < cx + 3; x++) { g.set(x, 5, cz, "white_carpet"); g.set(x, 5, cz + 1, "white_carpet"); }
  g.set(cx + 2, 4, cz, fenceOf(S.wood)); g.set(cx + 2, 4, cz + 1, fenceOf(S.wood));
  g.set(3, 3, 0, "chest[facing=south,type=single,waterlogged=false]"); g.set(3, 3, 1, "enterprise:decor_barrel[facing=up,open=false]");
  g.set(8, 3, 1, `${S.wood}_log[axis=z]`); g.set(8, 3, 2, `${S.wood}_log[axis=z]`); g.set(8, 4, 1, `${S.wood}_log[axis=z]`);
  for (const [x, z] of [[0, 4], [5, 6], [8, 6], [3, 2]]) { g.set(x, 3, z, fenceOf(S.postWood)); g.set(x, 4, z, LANTERN); }
  return g;
}

function stake(S) {
  const g = ground(1, 1, 7);
  g.set(0, 3, 0, fenceOf(S.postWood)); g.set(0, 4, 0, fenceOf(S.postWood)); g.set(0, 5, 0, S.cloth);
  return g;
}

function gatePosts(S) {
  const g = ground(5, 1, 9, (x) => (x === 0 || x === 4 ? S.base : "dirt_path"));
  for (const x of [0, 4]) {
    g.set(x, 3, 0, S.base); g.set(x, 4, 0, S.plinth);
    for (let y = 5; y <= 6; y++) g.set(x, y, 0, S.post);
    g.set(x, 7, 0, slab(S.roof)); g.set(x, 8, 0, LANTERN);
  }
  return g;
}

function noticeBoard(S) {
  const g = ground(3, 1, 8, () => S.pave);
  for (const x of [0, 2]) for (let y = 3; y <= 5; y++) g.set(x, y, 0, S.post);
  g.set(1, 4, 0, S.board); g.set(1, 5, 0, S.board);
  g.set(1, 3, 0, slab(S.wood, "top"));
  for (let x = 0; x < 3; x++) g.set(x, 6, 0, slab(S.roof));
  g.set(1, 6, 0, stairs(S.roof, "south"));
  g.set(0, 7, 0, LANTERN);
  return g;
}

export function foundingKit(kingdom) {
  const S = KITS[kingdom], centre = kingdom === "dalaran" ? ["well_pavilion_5", wellPavilion(S), "a well under a little pavilion: red posts, a hipped violet roof, lanterns hung under it"]
    : ["fountain_5", fountain(S), "a quartz fountain basin of still water, a column in the middle with a lantern, lanterns at its corners"];
  return [
    { id: "founding_stone_3", grid: foundingStone(S), meta: { width: 3, depth: 3, tags: ["founding", "square", "lamp"], place: "the forum's edge, beside the bell, facing the square" } },
    { id: centre[0], grid: centre[1], meta: { width: 5, depth: 5, tags: ["founding", "square", "centrepiece", "lamp"], place: `the forum's middle (the kingdom's centrepiece, in place of Lordaeron's market cross): ${centre[2]}` } },
    { id: "well_3", grid: well(S), meta: { width: 3, depth: 3, tags: ["founding", "square", "well", "lamp"], place: "beside the centrepiece, or on the main street" } },
    { id: "camp_9x7", grid: camp(S), meta: { width: 9, depth: 7, tags: ["founding", "camp", "temporary", "lamp"], place: "a plot at the main street's end; cleared when the first house has its beds (never counted as beds)" } },
    { id: "stake_1", grid: stake(S), meta: { width: 1, depth: 1, tags: ["founding", "wall_line", "temporary"], place: "every 8 along the inner wall's line, until the stockade" } },
    { id: "gate_posts_5", grid: gatePosts(S), meta: { width: 5, depth: 1, tags: ["founding", "gate", "temporary", "lamp"], place: "astride the main street where it crosses the inner wall's line: x 1-3 the street" } },
    { id: "notice_board_3", grid: noticeBoard(S), meta: { width: 3, depth: 1, tags: ["founding", "square", "lamp"], place: "by the bell, facing the square" } },
  ];
}
