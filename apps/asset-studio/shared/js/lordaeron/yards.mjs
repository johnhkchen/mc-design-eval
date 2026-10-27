// Lordaeron yard tiles: front yards 3 deep, back yards 4 deep, in widths 1, 2, 3, tiled by the client's solver to any
// plot width. Authored with the street to the south: a FRONT tile's z 0 touches the house, z 2 the street edge; a BACK
// tile's z 0 is the plot's rear boundary, z 3 touches the house. Layers 0-1 are ground (dirt), 2 the surface, 3 up the
// features. Sockets on left/right name the edge treatment along the street edge (front) or the rear boundary (back) so
// neighbours continue it. `path_ok` lists the cells (x, z) where the client may cut the door path.
// Decorative job-site lookalikes are the mod's twins (enterprise:decor_*), never the vanilla blocks.
import { Grid } from "../grid.mjs";

const GRASS = "grass_block[snowy=false]", PATH = "dirt_path", GRAVEL = "gravel", COARSE = "coarse_dirt";
const HEDGE = "oak_leaves[distance=1,persistent=true,waterlogged=false]";
const PAVE = "stone_brick_slab[type=bottom,waterlogged=false]", COBBLE_PAVE = "cobblestone_slab[type=bottom,waterlogged=false]";
const fence = (e = true, w = true) => `spruce_fence[east=${e},north=false,south=false,waterlogged=false,west=${w}]`;
const LANTERN_UP = "lantern[hanging=false,waterlogged=false]";
const FLOWERS = ["poppy", "oxeye_daisy", "cornflower", "allium", "azure_bluet", "red_tulip", "white_tulip", "lily_of_the_valley"];
const flower = (x, z) => FLOWERS[(x * 3 + z * 5) % FLOWERS.length];

function tile(w, d, h = 7) {
  const g = new Grid([w, h, d]);
  for (let x = 0; x < w; x++) for (let z = 0; z < d; z++) { g.set(x, 0, z, "dirt"); g.set(x, 1, z, "dirt"); g.set(x, 2, z, GRASS); }
  return g;
}
const lamp = (g, x, z, h = 2) => { for (let y = 3; y < 3 + h; y++) g.set(x, y, z, fence(false, false)); g.set(x, 3 + h, z, LANTERN_UP); };
const hedgeRow = (g, z, w) => { for (let x = 0; x < w; x++) g.set(x, 3, z, HEDGE); };
const picketRow = (g, z, w) => { for (let x = 0; x < w; x++) g.set(x, 3, z, fence(true, true)); };

// front tiles: [id, width, tags, edge, path_ok cells, build(g)]
const FRONT = [
  ["front_path_1", 1, ["path", "gate"], "gate", [[0, 0], [0, 1], [0, 2]], (g) => { for (let z = 0; z < 3; z++) g.set(0, 2, z, PATH); }],
  ["front_hedge_1", 1, ["plain"], "hedge", [[0, 0], [0, 1]], (g) => { hedgeRow(g, 2, 1); g.set(0, 3, 0, flower(0, 0)); }],
  ["front_lamp_1", 1, ["plain", "lamp"], "*", [], (g) => { lamp(g, 0, 2); g.set(0, 3, 0, flower(0, 0)); }],          // a lamp post in the boundary line: fits any edge
  ["front_picket_1", 1, ["cottage"], "picket", [[0, 0], [0, 1]], (g) => { picketRow(g, 2, 1); g.set(0, 3, 1, flower(0, 1)); }],
  ["front_cottage_2", 2, ["cottage"], "picket", [[0, 0], [1, 0], [0, 1], [1, 1]], (g) => {
    picketRow(g, 2, 2); for (let x = 0; x < 2; x++) for (let z = 0; z < 2; z++) g.set(x, 3, z, flower(x, z));
  }],
  ["front_bench_2", 2, ["plain", "lamp"], "hedge", [[0, 0]], (g) => {
    hedgeRow(g, 2, 2); g.set(0, 2, 0, GRAVEL); g.set(0, 2, 1, GRAVEL);
    g.set(0, 3, 1, "oak_stairs[facing=north,half=bottom,shape=straight,waterlogged=false]"); lamp(g, 1, 1); g.set(1, 3, 0, "potted_red_tulip");
  }],
  ["front_forecourt_3", 3, ["plain", "town", "lamp"], "wall", [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]], (g) => {
    for (let x = 0; x < 3; x++) for (let z = 0; z < 2; z++) g.set(x, 3, z, PAVE);
    for (let x = 0; x < 3; x++) g.set(x, 3, 2, `cobblestone_wall[east=${x < 2 ? "low" : "low"},north=none,south=none,up=${x === 1},waterlogged=false,west=low]`);
    g.set(1, 4, 2, LANTERN_UP);
  }],
  ["front_garden_3", 3, ["cottage", "lamp"], "picket", [[0, 0], [1, 0], [0, 1], [1, 1]], (g) => {
    picketRow(g, 2, 3); for (let x = 0; x < 2; x++) for (let z = 0; z < 2; z++) g.set(x, 3, z, flower(x + 1, z));
    g.set(2, 3, 0, "oak_leaves[distance=1,persistent=true,waterlogged=false]"); lamp(g, 2, 1, 1);
  }],
  ["front_smith_3", 3, ["trade:smith", "trade:armorer", "trade:toolsmith", "trade:weaponsmith", "lamp"], "wall", [[0, 0], [0, 1]], (g) => {
    for (let x = 0; x < 3; x++) for (let z = 0; z < 2; z++) g.set(x, 2, z, COARSE);
    g.set(1, 3, 0, "anvil[facing=east]");
    g.set(2, 3, 0, "cobblestone_wall[east=none,north=none,south=low,up=true,waterlogged=false,west=none]"); g.set(2, 2, 1, "water"); // the quench trough
    g.set(2, 3, 1, "cobblestone_slab[type=bottom,waterlogged=true]");
    g.set(1, 3, 1, "iron_block"); g.set(0, 3, 1, COBBLE_PAVE);
    for (let x = 0; x < 3; x++) g.set(x, 3, 2, `cobblestone_wall[east=low,north=none,south=none,up=${x === 0},waterlogged=false,west=low]`);
    g.set(0, 4, 2, LANTERN_UP);
  }],
  ["front_baker_3", 3, ["trade:baker", "trade:farmer", "lamp"], "wall", [[0, 0], [0, 1]], (g) => {
    for (let x = 0; x < 3; x++) for (let z = 0; z < 2; z++) g.set(x, 3, z, COBBLE_PAVE);
    // the domed bread oven: brick, a furnace mouth to the street, a stair dome
    g.set(1, 3, 0, "bricks"); g.set(2, 3, 0, "bricks"); g.set(1, 3, 1, "furnace[facing=south,lit=true]"); g.set(2, 3, 1, "bricks");
    g.set(1, 4, 0, "brick_stairs[facing=east,half=bottom,shape=straight,waterlogged=false]"); g.set(2, 4, 0, "brick_stairs[facing=west,half=bottom,shape=straight,waterlogged=false]");
    g.set(1, 4, 1, "brick_slab[type=bottom,waterlogged=false]"); g.set(2, 4, 1, "brick_slab[type=bottom,waterlogged=false]");
    g.set(0, 3, 0, "hay_block[axis=y]");                                                       // flour sacks
    for (let x = 0; x < 3; x++) g.set(x, 3, 2, `cobblestone_wall[east=low,north=none,south=none,up=${x === 0},waterlogged=false,west=low]`);
    g.set(0, 4, 2, LANTERN_UP);
  }],
  ["front_dyer_3", 3, ["trade:dyer", "trade:shepherd", "lamp"], "picket", [[0, 0], [0, 1]], (g) => {
    for (let x = 0; x < 3; x++) for (let z = 0; z < 2; z++) g.set(x, 2, z, COARSE);
    g.set(1, 3, 0, "enterprise:decor_cauldron[contents=blue]"); g.set(2, 3, 0, "enterprise:decor_cauldron[contents=red]");
    g.set(1, 3, 1, "enterprise:decor_cauldron[contents=yellow]");
    g.set(2, 3, 1, fence(false, false)); g.set(2, 4, 1, "white_wool");                         // a fleece drying on a post
    picketRow(g, 2, 3); g.set(0, 4, 2, LANTERN_UP);
  }],
];

// back tiles: z 0 = rear boundary, z 3 = against the house
const BACK = [
  ["back_hedge_1", 1, ["plain"], "hedge", (g) => { hedgeRow(g, 0, 1); g.set(0, 3, 0, HEDGE); g.set(0, 4, 0, HEDGE); g.set(0, 3, 2, flower(0, 2)); }],
  ["back_lamp_1", 1, ["plain", "lamp"], "*", (g) => { g.set(0, 3, 0, HEDGE); g.set(0, 4, 0, HEDGE); lamp(g, 0, 2); }],
  ["back_woodpile_2", 2, ["woodpile"], "hedge", (g) => {
    for (let x = 0; x < 2; x++) { g.set(x, 3, 0, HEDGE); g.set(x, 4, 0, HEDGE); }
    for (let x = 0; x < 2; x++) { g.set(x, 3, 1, "oak_log[axis=x]"); g.set(x, 4, 1, "oak_log[axis=x]"); }
    g.set(0, 3, 2, "stripped_oak_log[axis=y]"); g.set(1, 2, 2, COARSE);                        // the chopping block
  }],
  ["back_well_2", 2, ["well", "lamp"], "hedge", (g) => {
    for (let x = 0; x < 2; x++) { g.set(x, 3, 0, HEDGE); g.set(x, 4, 0, HEDGE); }
    g.set(0, 2, 1, "water"); g.set(0, 3, 1, "cobblestone_wall[east=none,north=none,south=none,up=true,waterlogged=false,west=none]");
    g.set(0, 2, 2, "cobblestone"); g.set(1, 2, 1, "cobblestone"); g.set(0, 3, 2, "spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]");
    g.set(0, 4, 2, "spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]"); g.set(0, 5, 2, "spruce_slab[type=bottom,waterlogged=false]");
    g.set(1, 3, 2, "lantern[hanging=false,waterlogged=false]");
  }],
  ["back_wash_3", 3, ["wash", "lamp"], "hedge", (g) => {
    for (let x = 0; x < 3; x++) { g.set(x, 3, 0, HEDGE); g.set(x, 4, 0, HEDGE); }
    for (const x of [0, 2]) { g.set(x, 3, 2, fence(false, false)); g.set(x, 4, 2, fence(false, false)); }
    g.set(0, 5, 2, fence(true, false)); g.set(1, 5, 2, fence(true, true)); g.set(2, 5, 2, fence(false, true));
    g.set(1, 4, 2, "birch_trapdoor[facing=south,half=top,open=true,powered=false,waterlogged=false]");  // a sheet on the line
    g.set(0, 6, 2, LANTERN_UP);
  }],
  ["back_kitchen_3", 3, ["kitchen"], "hedge", (g) => {
    for (let x = 0; x < 3; x++) { g.set(x, 3, 0, HEDGE); g.set(x, 4, 0, HEDGE); }
    for (let x = 0; x < 3; x++) for (let z = 1; z < 4; z++) { g.set(x, 2, z, "farmland[moisture=7]"); g.set(x, 3, z, x === 1 ? "carrots[age=5]" : "wheat[age=6]"); }
    g.set(1, 2, 2, "water"); g.set(1, 3, 2, "lily_pad");                                       // the water that keeps it tilled
  }],
  ["back_hens_3", 3, ["hens", "lamp"], "fence", (g) => {
    for (let x = 0; x < 3; x++) { g.set(x, 3, 0, fence(x > 0 ? true : true, true)); }
    // the coop: planks on posts, a slab roof, a hay nest
    g.set(0, 3, 1, "spruce_planks"); g.set(1, 3, 1, "spruce_planks"); g.set(0, 4, 1, "spruce_slab[type=bottom,waterlogged=false]"); g.set(1, 4, 1, "spruce_slab[type=bottom,waterlogged=false]");
    g.set(2, 3, 1, "hay_block[axis=y]"); g.set(2, 2, 2, COARSE); g.set(1, 2, 2, COARSE);
    g.set(0, 3, 2, fence(false, false)); g.set(0, 4, 2, LANTERN_UP);
  }],
  ["back_tree_3", 3, ["tree"], "hedge", (g) => {
    for (let x = 0; x < 3; x++) { g.set(x, 3, 0, HEDGE); g.set(x, 4, 0, HEDGE); }
    for (let y = 3; y < 7; y++) g.set(1, y, 2, "oak_log[axis=y]");
    for (let x = 0; x < 3; x++) for (let z = 1; z < 4; z++) for (const y of [5, 6]) if (!(x === 1 && z === 2)) g.set(x, y, z, HEDGE);
    g.set(1, 7, 2, HEDGE);
  }],
  ["back_dyer_2", 2, ["trade:dyer", "trade:shepherd", "lamp"], "hedge", (g) => {
    for (let x = 0; x < 2; x++) { g.set(x, 3, 0, HEDGE); g.set(x, 4, 0, HEDGE); }
    g.set(0, 3, 1, fence(true, false)); g.set(1, 3, 1, fence(false, true)); g.set(0, 4, 1, "white_wool"); g.set(1, 4, 1, "light_blue_wool");   // the drying rack
    g.set(0, 3, 2, "enterprise:decor_cauldron[contents=green]"); g.set(1, 3, 2, LANTERN_UP);
  }],
];

/** Every yard tile: { id, grid, meta } */
export function allYards() {
  const out = [];
  for (const [id, w, tags, edge, pathOk, build] of FRONT) {
    const g = tile(w, 3); build(g);
    out.push({ id, grid: g, meta: { slot: "yard:front", width: w, depth: 3, tags, sockets: { left: edge === "gate" || edge === "*" ? "*" : edge, right: edge === "gate" || edge === "*" ? "*" : edge, street: edge }, path_ok: pathOk, lamp: tags.includes("lamp") } });
  }
  for (const [id, w, tags, edge, build] of BACK) {
    const g = tile(w, 4, 8); build(g);
    out.push({ id, grid: g, meta: { slot: "yard:back", width: w, depth: 4, tags, sockets: { left: edge, right: edge, rear: edge }, path_ok: [], lamp: tags.includes("lamp") } });
  }
  return out;
}

/** Lay tiles left to right into one strip (the solver's job; here for the golden yards). */
export function strip(tiles, ids, depth) {
  const lib = new Map(tiles.map((t) => [t.id, t])), seq = ids.map((id) => lib.get(id));
  const W = seq.reduce((a, t) => a + t.meta.width, 0), H = Math.max(...seq.map((t) => t.grid.size[1]));
  const g = new Grid([W, H, depth]);
  let x = 0;
  for (const t of seq) { g.paste(t.grid, x, 0, 0); x += t.meta.width; }
  return g;
}
