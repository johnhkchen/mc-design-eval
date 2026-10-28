// Dalaran yard tiles on Lordaeron's yard contract (the same slots, widths, depths, sockets, tags and path_ok, so the
// client's tiler lays them unchanged): front yards 3 deep, back yards 4 deep, widths 1, 2, 3. Street to the south: a
// FRONT tile's z 0 touches the house, z 2 the street edge; a BACK tile's z 0 is the rear boundary, z 3 the house.
// Layers 0-1 ground, 2 the surface, 3 up the features. The dress is the courtyard house's and the hillside concept's:
// a white compound wall on a polished andesite plinth under a tile coping, a dark oak balustrade on red posts, paving
// of polished andesite and stone brick, stone lanterns, ponds with lilies, bamboo, cherry and flowering azalea.
// Sockets: wall (the compound wall), rail (the balustrade), '*' fits any.
import { Grid } from "../grid.mjs";

const GRASS = "grass_block[snowy=false]", MOSS = "mossy_stone_bricks";
const PLINTH = "polished_andesite", WALL = "calcite", COPING = "purpur_slab[type=bottom,waterlogged=false]";
const PAVE = (x, z) => ((x + z) % 2 ? "stone_bricks" : "polished_andesite");
const rail = (e = true, w = true, wood = "dark_oak") => `${wood}_fence[east=${e},north=false,south=false,waterlogged=false,west=${w}]`;
const POSTF = "dark_oak_fence[east=false,north=false,south=false,waterlogged=false,west=false]";
const LANTERN_UP = "lantern[hanging=false,waterlogged=false]", LANTERN = "lantern[hanging=true,waterlogged=false]";
const BLOOMS = ["pink_petals[facing=north,flower_amount=4]", "allium", "lily_of_the_valley", "azure_bluet", "pink_tulip", "white_tulip", "cornflower"];
const bloom = (x, z) => BLOOMS[(x * 3 + z * 5) % BLOOMS.length];
const AZALEA = "flowering_azalea", CHERRY = "cherry_leaves[distance=1,persistent=true,waterlogged=false]";

function tile(w, d, h = 7) {
  const g = new Grid([w, h, d]);
  for (let x = 0; x < w; x++) for (let z = 0; z < d; z++) { g.set(x, 0, z, "dirt"); g.set(x, 1, z, "dirt"); g.set(x, 2, z, GRASS); }
  return g;
}
// the compound wall: plinth, plaster, a tile coping (front 3 high; the back's a course taller)
const wallRow = (g, z, w, tall = false) => { for (let x = 0; x < w; x++) { g.set(x, 3, z, PLINTH); g.set(x, 4, z, WALL); if (tall) g.set(x, 5, z, WALL); g.set(x, tall ? 6 : 5, z, COPING); } };
// the balustrade along the street edge, on a polished andesite kerb
const railRow = (g, z, w) => { for (let x = 0; x < w; x++) { g.set(x, 2, z, PLINTH); g.set(x, 3, z, rail(true, true)); } };
// a lantern on a dark oak post (h posts, then the lantern)
const lamp = (g, x, z, h = 2) => { for (let y = 3; y < 3 + h; y++) g.set(x, y, z, POSTF); g.set(x, 3 + h, z, LANTERN_UP); };
// a stone lantern: a post, the light, a cap; 3 high
const toro = (g, x, z) => { g.set(x, 3, z, "andesite_wall[east=none,north=none,south=none,up=true,waterlogged=false,west=none]"); g.set(x, 4, z, LANTERN_UP); g.set(x, 5, z, "polished_andesite_slab[type=bottom,waterlogged=false]"); };
const pave = (g, x0, z0, x1, z1) => { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) g.set(x, 2, z, PAVE(x, z)); };

// front tiles: [id, width, tags, edge, path_ok cells, build(g)]
const FRONT = [
  ["front_path_1", 1, ["path", "gate"], "gate", [[0, 0], [0, 1], [0, 2]], (g) => pave(g, 0, 0, 0, 2)],
  ["front_wall_1", 1, ["plain", "town"], "wall", [[0, 0], [0, 1]], (g) => { wallRow(g, 2, 1); g.set(0, 3, 0, bloom(0, 0)); }],
  ["front_lamp_1", 1, ["plain", "town", "cottage", "lamp"], "*", [], (g) => { pave(g, 0, 2, 0, 2); toro(g, 0, 2); g.set(0, 3, 0, bloom(0, 1)); }],
  ["front_rail_1", 1, ["cottage"], "rail", [[0, 0], [0, 1]], (g) => { railRow(g, 2, 1); g.set(0, 3, 1, bloom(1, 1)); }],
  ["front_court_2", 2, ["plain", "town"], "wall", [[0, 0], [1, 0], [0, 1], [1, 1]], (g) => {
    pave(g, 0, 0, 1, 1); wallRow(g, 2, 2); g.set(1, 3, 0, "potted_flowering_azalea_bush");
  }],
  ["front_azalea_2", 2, ["cottage", "lamp"], "rail", [[0, 0], [0, 1]], (g) => {
    railRow(g, 2, 2); g.set(1, 3, 0, AZALEA); g.set(1, 3, 1, bloom(2, 1)); g.set(0, 3, 0, bloom(0, 2)); lamp(g, 0, 1, 1);
  }],
  ["front_pond_3", 3, ["plain", "town", "lamp"], "wall", [[0, 0], [0, 1]], (g) => {
    // a lily pond in a mossy stone rim, a stone lantern beside it
    g.set(1, 2, 0, MOSS); g.set(2, 2, 0, MOSS); g.set(1, 2, 1, "water"); g.set(2, 2, 1, "water"); g.set(1, 3, 1, "lily_pad");
    pave(g, 0, 0, 0, 1); toro(g, 2, 0); wallRow(g, 2, 3);
  }],
  ["front_garden_3", 3, ["cottage", "lamp"], "rail", [[0, 0], [0, 1]], (g) => {
    railRow(g, 2, 3);
    g.set(1, 3, 0, "peony[half=lower]"); g.set(1, 4, 0, "peony[half=upper]"); g.set(2, 3, 0, AZALEA);
    g.set(1, 3, 1, bloom(1, 1)); g.set(2, 3, 1, bloom(3, 2)); toro(g, 0, 1);
  }],
  ["front_smith_3", 3, ["trade:smith", "trade:armorer", "trade:toolsmith", "trade:weaponsmith", "lamp"], "wall", [[0, 0], [0, 1]], (g) => {
    pave(g, 0, 0, 2, 1);
    g.set(1, 3, 0, "anvil[facing=east]"); g.set(1, 3, 1, "iron_block");
    g.set(2, 2, 1, "water"); g.set(2, 3, 1, "polished_andesite_slab[type=bottom,waterlogged=true]");   // the quench trough
    g.set(2, 3, 0, "enterprise:decor_barrel[facing=up,open=false]");
    wallRow(g, 2, 3); toro(g, 0, 2);                                                            // the wall ends in a stone lantern
  }],
  ["front_baker_3", 3, ["trade:baker", "trade:farmer", "lamp"], "wall", [[0, 0], [0, 1]], (g) => {
    pave(g, 0, 0, 2, 1);
    // a clay oven: mud brick, a furnace mouth to the street, a tiled dome
    g.set(1, 3, 0, "mud_bricks"); g.set(2, 3, 0, "mud_bricks"); g.set(1, 3, 1, "furnace[facing=south,lit=true]"); g.set(2, 3, 1, "mud_bricks");
    g.set(1, 4, 0, "purpur_stairs[facing=east,half=bottom,shape=straight,waterlogged=false]"); g.set(2, 4, 0, "purpur_stairs[facing=west,half=bottom,shape=straight,waterlogged=false]");
    g.set(1, 4, 1, COPING); g.set(2, 4, 1, COPING);
    g.set(0, 3, 0, "hay_block[axis=y]");
    wallRow(g, 2, 3); toro(g, 0, 2);                                                            // the wall ends in a stone lantern
  }],
  ["front_dyer_3", 3, ["trade:dyer", "trade:shepherd", "lamp"], "rail", [[0, 0], [0, 1]], (g) => {
    pave(g, 0, 0, 2, 1);
    g.set(1, 3, 0, "enterprise:decor_cauldron[contents=red]"); g.set(2, 3, 0, "enterprise:decor_cauldron[contents=yellow]");
    g.set(1, 3, 1, "enterprise:decor_cauldron[contents=blue]");
    railRow(g, 2, 3); g.set(2, 4, 2, "red_carpet"); g.set(1, 4, 2, "yellow_carpet");                 // dyed silk drying on the rail
    g.set(0, 3, 1, POSTF); g.set(0, 4, 1, LANTERN_UP);
  }],
];

// back tiles: z 0 = rear boundary (the compound wall, a course taller), z 3 = against the house
const BACK = [
  ["back_wall_1", 1, ["plain"], "wall", (g) => { wallRow(g, 0, 1, true); g.set(0, 3, 2, bloom(0, 2)); }],
  ["back_lamp_1", 1, ["plain", "lamp"], "*", (g) => { wallRow(g, 0, 1, true); pave(g, 0, 2, 0, 2); toro(g, 0, 2); }],
  ["back_bamboo_2", 2, ["plain", "tree"], "wall", (g) => {
    wallRow(g, 0, 2, true);
    // a bamboo grove against the wall, its stalks to the coping's height and over
    for (const [x, n] of [[0, 4], [1, 5]]) for (let i = 0; i < n; i++) g.set(x, 3 + i, 1, `bamboo[age=0,leaves=${i >= n - 2 ? "large" : i >= n - 3 ? "small" : "none"},stage=0]`);
    g.set(0, 3, 2, bloom(4, 2));
  }],
  ["back_woodpile_2", 2, ["woodpile"], "wall", (g) => {
    wallRow(g, 0, 2, true);
    // firewood under a lean-to: logs stacked against the wall, a tile roof on posts
    for (let x = 0; x < 2; x++) { g.set(x, 3, 1, "dark_oak_log[axis=x]"); g.set(x, 4, 1, "dark_oak_log[axis=x]"); g.set(x, 5, 1, COPING); }
    g.set(0, 3, 2, "stripped_dark_oak_log[axis=y]"); g.set(1, 2, 2, "coarse_dirt");                   // the chopping block
  }],
  ["back_well_2", 2, ["well", "lamp"], "wall", (g) => {
    wallRow(g, 0, 2, true);
    // a stone-rimmed well under a small tiled roof on red posts
    g.set(0, 2, 2, "water"); g.set(1, 2, 2, PLINTH); g.set(0, 2, 1, PLINTH);
    g.set(0, 3, 2, "andesite_wall[east=none,north=none,south=none,up=true,waterlogged=false,west=none]");
    for (let y = 3; y <= 4; y++) g.set(1, y, 1, "mangrove_fence[east=false,north=false,south=false,waterlogged=false,west=false]");
    g.set(0, 5, 1, COPING); g.set(1, 5, 1, COPING); g.set(0, 4, 1, LANTERN);
  }],
  ["back_wash_3", 3, ["wash", "lamp"], "wall", (g) => {
    wallRow(g, 0, 3, true);
    for (const x of [0, 2]) { g.set(x, 3, 2, "mangrove_fence[east=false,north=false,south=false,waterlogged=false,west=false]"); g.set(x, 4, 2, "mangrove_fence[east=false,north=false,south=false,waterlogged=false,west=false]"); }
    g.set(0, 5, 2, rail(true, false)); g.set(1, 5, 2, rail(true, true)); g.set(2, 5, 2, rail(false, true));
    g.set(1, 4, 2, "cherry_trapdoor[facing=south,half=top,open=true,powered=false,waterlogged=false]");   // a silk sheet on the line
    g.set(0, 6, 2, LANTERN_UP);
  }],
  ["back_kitchen_3", 3, ["kitchen"], "wall", (g) => {
    wallRow(g, 0, 3, true);
    for (let x = 0; x < 3; x++) for (let z = 1; z < 4; z++) { g.set(x, 2, z, "farmland[moisture=7]"); g.set(x, 3, z, x === 1 ? "beetroots[age=3]" : "carrots[age=7]"); }
    g.set(1, 2, 2, "water"); g.set(1, 3, 2, "lily_pad");
  }],
  ["back_hens_3", 3, ["hens", "lamp"], "rail", (g) => {
    for (let x = 0; x < 3; x++) g.set(x, 3, 0, rail(true, true));
    // the coop: dark planks on red posts under a tile roof, a hay nest
    g.set(0, 3, 1, "dark_oak_planks"); g.set(1, 3, 1, "dark_oak_planks"); g.set(0, 4, 1, COPING); g.set(1, 4, 1, COPING);
    g.set(2, 3, 1, "hay_block[axis=y]"); g.set(2, 2, 2, "coarse_dirt"); g.set(1, 2, 2, "coarse_dirt");
    g.set(0, 3, 2, POSTF); g.set(0, 4, 2, LANTERN_UP);
  }],
  ["back_tree_3", 3, ["tree"], "wall", (g) => {
    wallRow(g, 0, 3, true);
    // a cherry: a short leaning trunk, a broad pink crown over the wall's coping
    for (let y = 3; y < 6; y++) g.set(1, y, 2, "cherry_log[axis=y]");
    for (let x = 0; x < 3; x++) for (let z = 1; z < 4; z++) for (const y of [6, 7]) if (!(y === 7 && (x !== 1 && z !== 2))) g.set(x, y, z, CHERRY);
    g.set(1, 6, 2, "cherry_log[axis=y]"); g.set(0, 3, 3, "pink_petals[facing=east,flower_amount=3]");
  }],
  ["back_pond_3", 3, ["tree", "lamp"], "wall", (g) => {
    wallRow(g, 0, 3, true);
    // a lily pond under a flowering azalea, a stone lantern
    for (let x = 1; x < 3; x++) for (let z = 1; z < 3; z++) g.set(x, 2, z, "water");
    g.set(1, 3, 1, "lily_pad"); g.set(1, 2, 3, MOSS); g.set(2, 2, 3, MOSS);
    g.set(0, 3, 1, AZALEA); g.set(0, 4, 1, "flowering_azalea_leaves[distance=1,persistent=true,waterlogged=false]"); toro(g, 0, 3);
  }],
  ["back_dyer_2", 2, ["trade:dyer", "trade:shepherd", "lamp"], "wall", (g) => {
    wallRow(g, 0, 2, true);
    g.set(0, 3, 1, rail(true, false)); g.set(1, 3, 1, rail(false, true)); g.set(0, 4, 1, "red_carpet"); g.set(1, 4, 1, "light_blue_carpet");   // silk on the drying rack
    g.set(0, 3, 2, "enterprise:decor_cauldron[contents=green]"); g.set(1, 3, 2, LANTERN_UP);
  }],
];

/** Every yard tile: { id, grid, meta } */
export function dalaranYards() {
  const out = [];
  for (const [id, w, tags, edge, pathOk, build] of FRONT) {
    const g = tile(w, 3); build(g);
    out.push({ id, grid: g, meta: { slot: "yard:front", width: w, depth: 3, tags, sockets: { left: edge === "gate" || edge === "*" ? "*" : edge, right: edge === "gate" || edge === "*" ? "*" : edge, street: edge }, path_ok: pathOk, lamp: tags.includes("lamp") } });
  }
  for (const [id, w, tags, edge, build] of BACK) {
    const g = tile(w, 4, 9); build(g);
    out.push({ id, grid: g, meta: { slot: "yard:back", width: w, depth: 4, tags, sockets: { left: edge, right: edge, rear: edge }, path_ok: [], lamp: tags.includes("lamp") } });
  }
  return out;
}
