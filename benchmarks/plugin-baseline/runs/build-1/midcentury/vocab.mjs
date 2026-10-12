// Shared vocabulary for the mid-century house (plan.md): palette constants, site coordinates, and one helper per
// plan.md VOCABULARY item. Helpers take the grid first, then plan.md's arguments, in plan.md's coordinates (x east,
// y up with ground top = 0, z = 0 the street). Every helper writes only through g.set, so runParts' ownership and
// palette reports apply. Shaped blocks come from the build library's B.* helpers.
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// ---- grid -----------------------------------------------------------------------------------------------------------
// Grid index = plan.md coordinates, as build.mjs makes it (34 x 9 x 34). build.mjs drops writes below y=0 (the
// bedding and the pool basin), so helpers may ask for y=-1 and -2 and those cells are simply not stored.
export const GRID_SIZE = [34, 9, 34];
export const AIR = "minecraft:air";

// ---- palette (palette.json ids only) --------------------------------------------------------------------------------
export const ACACIA_DOOR = "acacia_door";
export const BARREL = "barrel";
export const BIRCH_PLANKS = "birch_planks";
export const BIRCH_SLAB = "birch_slab";
export const BIRCH_STAIRS = "birch_stairs";
export const BIRCH_TRAPDOOR = "birch_trapdoor";
export const BLACK_CONCRETE = "black_concrete";
export const BOOKSHELF = "bookshelf";
export const CACTUS = "cactus";
export const CAMPFIRE = "campfire";
export const CAULDRON = "cauldron";
export const CYAN_BED = "cyan_bed";
export const CYAN_CARPET = "cyan_carpet";
export const CYAN_CONCRETE = "cyan_concrete";
export const DARK_OAK_DOOR = "dark_oak_door";
export const DARK_OAK_FENCE = "dark_oak_fence";
export const DARK_OAK_LOG = "dark_oak_log";
export const DARK_OAK_PLANKS = "dark_oak_planks";
export const DARK_OAK_SLAB = "dark_oak_slab";
export const DAYLIGHT_DETECTOR = "daylight_detector";
export const DEAD_BUSH = "dead_bush";
export const DIRT = "dirt";
export const END_ROD = "end_rod";
export const FLOWER_POT = "flower_pot";
export const FURNACE = "furnace";
export const GLASS_PANE = "glass_pane";
export const GRASS_BLOCK = "grass_block";
export const GRAVEL = "gravel";
export const IRON_BLOCK = "iron_block";
export const IRON_TRAPDOOR = "iron_trapdoor";
export const ITEM_FRAME = "item_frame";
export const JUNGLE_LEAVES = "jungle_leaves";
export const JUNGLE_LOG = "jungle_log";
export const LARGE_FERN = "large_fern";
export const LANTERN = "lantern";
export const LECTERN = "lectern";
export const LIGHT_BLUE_BED = "light_blue_bed";
export const LIGHT_BLUE_CONCRETE = "light_blue_concrete";
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";
export const MUD_BRICK_SLAB = "mud_brick_slab";
export const MUD_BRICKS = "mud_bricks";
export const ORANGE_BED = "orange_bed";
export const ORANGE_CARPET = "orange_carpet";
export const ORANGE_CONCRETE = "orange_concrete";
export const PACKED_MUD = "packed_mud";
export const POTTED_CACTUS = "potted_cactus";
export const QUARTZ_SLAB = "quartz_slab";
export const QUARTZ_STAIRS = "quartz_stairs";
export const RED_CONCRETE = "red_concrete";
export const SAND = "sand";
export const SEA_LANTERN = "sea_lantern";
export const SHORT_GRASS = "short_grass";
export const SMOKER = "smoker";
export const SMOOTH_QUARTZ = "smooth_quartz";
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";
export const SMOOTH_RED_SANDSTONE_STAIRS = "smooth_red_sandstone_stairs";
export const SMOOTH_STONE = "smooth_stone";
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";
export const SPRUCE_FENCE = "spruce_fence";
export const SPRUCE_PLANKS = "spruce_planks";
export const SPRUCE_SLAB = "spruce_slab";
export const SPRUCE_STAIRS = "spruce_stairs";
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";
export const WATER = "water";
export const WHITE_BED = "white_bed";
export const WHITE_CARPET = "white_carpet";
export const WHITE_CONCRETE = "white_concrete";
export const YELLOW_BED = "yellow_bed";
export const YELLOW_CARPET = "yellow_carpet";
export const YELLOW_CONCRETE = "yellow_concrete";

// ---- site coordinates (plan.md) -------------------------------------------------------------------------------------
export const BEAM_XS = [10, 13, 16, 19, 22, 25, 28, 31];   // beam lines; the header skips them
export const HOUSE = { x0: 10, x1: 31, z0: 8, z1: 25 };     // main house shell (walls on the perimeter)
export const ROOF = { x0: 9, x1: 32, z0: 6, z1: 27 };       // main roof incl. overhangs
export const ATRIUM = { x0: 17, x1: 21, z0: 12, z1: 17 };   // open courtyard: roof hole, glass ring on the outside
export const CHIMNEY = { x0: 20, x1: 21, z0: 21, z1: 22 };  // chimney hole in the roof
export const CARPORT = { x0: 0, x1: 9, z0: 7, z1: 21 };
export const FEATURE_WALL = { x0: 11, x1: 17, z: 7 };       // freestanding ledgestone leaf
export const ENTRY = { x: 19, z: 9 };                        // front door cell (x=19 on the z=9 door wall)
export const CAR = { x: 3, z: 1 };                           // car nose-left corner, parked on the driveway
export const DECK = { x0: 11, x1: 24, z0: 29, z1: 33 };     // pool deck
export const PIT = { x0: 13, x1: 17, z0: 20, z1: 23 };      // conversation pit (floor y=0)
export const KITCHEN = { x0: 11, x1: 15, z0: 9, z1: 13 };   // galley kitchen room
export const LEDGE_CAP_XS = [11, 12, 14, 15, 17];           // x cells of the feature wall capped at y=5
// Kidney pool cells by z (inclusive x spans), RESERVED in plan.md.
const POOL_SPANS = { 29: [[14, 17], [20, 21]], 30: [[13, 22]], 31: [[13, 22]], 32: [[14, 21]] };
export const POOL_CELLS = new Set(Object.entries(POOL_SPANS).flatMap(([z, spans]) =>
  spans.flatMap(([a, b]) => range(a, b).map((x) => `${x},${z}`))));
// Roof bands (plan.md ROOFS): z rows, the block's top y and its half.
export const ROOF_BANDS = [
  { name: "A", zs: [[6, 10], [23, 27]], y: 6, half: "bottom" },
  { name: "B", zs: [[11, 13], [20, 22]], y: 6, half: "top" },
  { name: "C", zs: [[14, 15], [18, 19]], y: 7, half: "bottom" },
  { name: "ridge", zs: [[16, 17]], y: 7, half: "top" },
];

// ---- plumbing ---------------------------------------------------------------------------------------------------------
// `mcd states` (26.3) lists no waterlogged, powered or water level, and the B.* helpers add them, so put() drops
// those keys: a state the toolkit does not list would be rejected, and the vanilla defaults are the same.
const UNLISTED = new Set(["waterlogged", "powered", "level"]);
const put = (g, x, y, z, block, state) => g.set(x, y, z, block,
  state && Object.fromEntries(Object.entries(state).filter(([k]) => !UNLISTED.has(k))));
const isAir = (g, x, y, z) => g.isAir(x, y, z);
function range(a, b) { return Array.from({ length: b - a + 1 }, (_, i) => a + i); }
function* cells([x0, y0, z0], [x1, y1, z1]) {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) yield [x, y, z];
}
function fill(g, a, b, block, state) { for (const [x, y, z] of cells(a, b)) put(g, x, y, z, block, state); }
const inBox = (b, x, z) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;
const inHole = (x, z) => inBox(ATRIUM, x, z) || inBox(CHIMNEY, x, z);
const atriumEdge = (x, z) =>
  ((x === ATRIUM.x0 - 1 || x === ATRIUM.x1 + 1) && z >= ATRIUM.z0 && z <= ATRIUM.z1) ||
  ((z === ATRIUM.z0 - 1 || z === ATRIUM.z1 + 1) && x >= ATRIUM.x0 && x <= ATRIUM.x1);
const bandAt = (z) => ROOF_BANDS.find((b) => b.zs.some(([a, c]) => z >= a && z <= c));
const dirOf = (v) => Object.keys(DIRS).find((k) => DIRS[k].every((c, i) => c === v[i]));
/** Seeded PRNG (mulberry32): the same seed gives the same flecks and mud every run. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- exterior ---------------------------------------------------------------------------------------------------------
/** stucco_wall(x0,z0,x1,z1,y0=2,y1=4): white_concrete fill. */
export function stucco_wall(g, x0, z0, x1, z1, y0 = 2, y1 = 4) {
  fill(g, [x0, y0, z0], [x1, y1, z1], WHITE_CONCRETE);
}

/** header_course(...): dark_oak_planks at y=5, skipping every beam-line x so the roof's beam logs go there. */
export function header_course(g, x0, z0, x1, z1) {
  for (const x of range(x0, x1)) {
    if (BEAM_XS.includes(x)) continue;
    for (const z of range(z0, z1)) put(g, x, 5, z, DARK_OAK_PLANKS);
  }
}

/** post(x,z,y0=2,y1=4): dark_oak_log, axis=y. */
export function post(g, x, z, y0 = 2, y1 = 4) {
  for (const y of range(y0, y1)) put(g, x, y, z, ...B.log("dark_oak", "y"));
}

/** glass_bay(x0,x1,z,y0,y1), or along z with axis="z" (x0..x1 become z0..z1 at x=fixed): glass_pane in air only. */
export function glass_bay(g, a0, a1, fixed, y0 = 2, y1 = 4, axis = "x") {
  for (const a of range(a0, a1)) for (const y of range(y0, y1)) {
    const [x, z] = axis === "x" ? [a, fixed] : [fixed, a];
    if (isAir(g, x, y, z)) put(g, x, y, z, GLASS_PANE);
  }
}

/** slider_gap(x0,z): 2 wide along x, 2 high AIR (y=2..3), glass_pane at y=4 above. Never closed. */
export function slider_gap(g, x0, z) {
  for (const x of [x0, x0 + 1]) {
    put(g, x, 2, z, AIR);
    put(g, x, 3, z, AIR);
    put(g, x, 4, z, GLASS_PANE);
  }
}

/** clerestory(z=8,y=4): glass_pane at x=22..24, 26..27, 29..30; dark_oak_log axis=y mullions at x=25 and x=28. */
export function clerestory(g, z = 8, y = 4) {
  for (const x of [22, 23, 24, 26, 27, 29, 30]) put(g, x, y, z, GLASS_PANE);
  for (const x of [25, 28]) put(g, x, y, z, ...B.log("dark_oak", "y"));
}

/** orange_entry: orange_concrete panels and transom, acacia_door (lower, upper) facing north at x=19, z=9. */
export function orange_entry(g) {
  for (const y of [2, 3, 4]) {
    put(g, 18, y, ENTRY.z, ORANGE_CONCRETE);
    put(g, 20, y, ENTRY.z, ORANGE_CONCRETE);
  }
  put(g, ENTRY.x, 4, ENTRY.z, ORANGE_CONCRETE);
  put(g, ENTRY.x, 2, ENTRY.z, ...B.door("acacia", "north", "lower", "left"));
  put(g, ENTRY.x, 3, ENTRY.z, ...B.door("acacia", "north", "upper", "left"));
}

/** ledgestone_wall(x0,x1,z=7,y0=1,y1=4): mud_bricks, ~25% packed_mud (seeded); mud_brick_slab cap at y=5 on the capped x. */
export function ledgestone_wall(g, x0, x1, z = FEATURE_WALL.z, y0 = 1, y1 = 4, seed = 1) {
  const rand = rng(seed);
  for (const x of range(x0, x1)) for (const y of range(y0, y1)) {
    put(g, x, y, z, rand() < 0.25 ? PACKED_MUD : MUD_BRICKS);
  }
  for (const x of LEDGE_CAP_XS) {
    if (x >= x0 && x <= x1) put(g, x, 5, z, ...B.slab("mud_brick", "bottom"));
  }
}

/** roof_band(zA,zB,y,half): smooth_stone_slab over x=9..32, skipping the atrium and chimney holes. */
export function roof_band(g, zA, zB, y, half) {
  for (const z of range(zA, zB)) for (const x of range(ROOF.x0, ROOF.x1)) {
    if (inHole(x, z)) continue;
    put(g, x, y, z, SMOOTH_STONE_SLAB, { type: half, waterlogged: "false" });
  }
}

/** fascia_ring(): dark_oak_slab on the outermost ring (z=6, z=27, x=9, x=32) and the atrium hole edge, same half as its band. */
export function fascia_ring(g) {
  for (const z of range(ROOF.z0, ROOF.z1)) for (const x of range(ROOF.x0, ROOF.x1)) {
    const ring = z === ROOF.z0 || z === ROOF.z1 || x === ROOF.x0 || x === ROOF.x1;
    if (!ring && !atriumEdge(x, z)) continue;
    const band = bandAt(z);
    put(g, x, band.y, z, DARK_OAK_SLAB, { type: band.half, waterlogged: "false" });
  }
}

/** beam_line(x): dark_oak_log axis=z at y=5 over z=5..28. Call it for each beam x (10, 13, ..., 31). */
export function beam_line(g, x) {
  for (const z of range(5, 28)) put(g, x, 5, z, ...B.log("dark_oak", "z"));
}

/** carport(): posts, beams, the flat smooth_stone_slab deck with its dark_oak_slab fascia, and the paved floor. */
export function carport(g) {
  for (const z of [8, 14, 20]) {
    for (const y of range(1, 3)) put(g, 1, y, z, ...B.log("dark_oak", "y"));
    for (const x of range(0, 9)) put(g, x, 4, z, ...B.log("dark_oak", "x"));
  }
  for (const z of range(7, 21)) for (const x of range(0, 9)) put(g, x, 5, z, ...B.slab("smooth_stone", "bottom"));
  for (const z of range(7, 21)) put(g, 0, 5, z, ...B.slab("dark_oak", "bottom"));
  for (const x of range(0, 9)) {
    put(g, x, 5, 7, ...B.slab("dark_oak", "bottom"));
    put(g, x, 5, 21, ...B.slab("dark_oak", "bottom"));
  }
  fill(g, [1, 0, 7], [9, 0, 21], SMOOTH_STONE);
}

/** breeze_screen(z=21): x=1..9, y=1..4, white_concrete where (x+y) is even; the rest stays air. */
export function breeze_screen(g, z = 21) {
  for (const x of range(1, 9)) for (const y of range(1, 4)) {
    if ((x + y) % 2 === 0) put(g, x, y, z, WHITE_CONCRETE);
  }
}

/** joint_row(z): light_gray_concrete at y=0, x=1..8 (driveway joint). */
export function joint_row(g, z) {
  for (const x of range(1, 8)) put(g, x, 0, z, LIGHT_GRAY_CONCRETE);
}

/** stepping_pad(z): smooth_stone pad at y=0, x=18..20. */
export function stepping_pad(g, z) {
  for (const x of range(18, 20)) put(g, x, 0, z, SMOOTH_STONE);
}

/** car_50s(x=3,z=1): two-tone 1950s car, nose to the street; x..x+2 wide, z..z+6 long. */
export function car_50s(g, x = CAR.x, z = CAR.z) {
  const C = CYAN_CONCRETE, K = BLACK_CONCRETE, G = GLASS_PANE, W = WHITE_CONCRETE;
  // [dz, y, [left, middle, right]] from the nose row (dz=0 is z=1 in plan.md); null leaves the cell alone.
  const rows = [
    [0, 1, [YELLOW_CONCRETE, IRON_BLOCK, YELLOW_CONCRETE]],
    [1, 1, [K, C, K]],
    [2, 1, [C, C, C]],
    [3, 1, [C, C, C]],
    [4, 1, [C, C, C]],
    [5, 1, [K, C, K]],
    [6, 1, [RED_CONCRETE, IRON_BLOCK, RED_CONCRETE]],
    [2, 2, [G, G, G]],
    [3, 2, [G, W, G]],
    [4, 2, [G, G, G]],
    [6, 2, [W, null, W]],
  ];
  for (const [dz, y, blocks] of rows) {
    blocks.forEach((block, i) => { if (block) put(g, x + i, y, z + dz, block); });
  }
}

/** palm(x,z): jungle_log trunk y=1..7; crown of jungle_leaves at y=7 (3x3) and y=6 (the 2-cell cross); air cells only. */
export function palm(g, x, z) {
  for (const y of range(1, 7)) put(g, x, y, z, ...B.log("jungle", "y"));
  const crown = (y, offsets) => {
    for (const [dx, dz] of offsets) {
      if (isAir(g, x + dx, y, z + dz)) put(g, x + dx, y, z + dz, JUNGLE_LEAVES);
    }
  };
  const top = [];
  for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1]) if (dx || dz) top.push([dx, dz]);
  crown(7, top);
  crown(6, [[1, 0], [2, 0], [-1, 0], [-2, 0], [0, 1], [0, 2], [0, -1], [0, -2], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
}

/** saguaro(x,z,h): cactus trunk y=1..h; with h=3 one arm at x-1 (y=2,3). Sand under each cactus column. */
export function saguaro(g, x, z, h) {
  put(g, x, 0, z, SAND);
  for (const y of range(1, h)) put(g, x, y, z, CACTUS);
  if (h === 3) {
    put(g, x - 1, 0, z, SAND);
    put(g, x - 1, 2, z, CACTUS);
    put(g, x - 1, 3, z, CACTUS);
  }
}

/** barrel_cactus(x,z): cactus at y=1 and y=2 on sand. */
export function barrel_cactus(g, x, z) {
  put(g, x, 0, z, SAND);
  put(g, x, 1, z, CACTUS);
  put(g, x, 2, z, CACTUS);
}

/** mailbox(x=9,z=1): dark_oak_fence post at y=1, smoker box at y=2 facing east. */
export function mailbox(g, x = 9, z = 1) {
  put(g, x, 1, z, ...B.fence("dark_oak"));
  put(g, x, 2, z, SMOKER, { facing: "east", lit: "false" });
}

/** kidney_pool(): light_blue_concrete floor (y=-2) and liner (y=-1 on the rim), water at y=-1 (inside) and y=0,
 *  smooth_quartz_slab coping at y=0 on the pool-deck cells beside the pool. */
export function kidney_pool(g) {
  const inPool = (x, z) => POOL_CELLS.has(`${x},${z}`);
  for (const key of POOL_CELLS) {
    const [x, z] = key.split(",").map(Number);
    put(g, x, -2, z, LIGHT_BLUE_CONCRETE);
    const rim = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inPool(x + dx, z + dz));
    if (rim) put(g, x, -1, z, LIGHT_BLUE_CONCRETE);
    else put(g, x, -1, z, WATER, { level: "0" });
    put(g, x, 0, z, WATER, { level: "0" });
  }
  for (const key of POOL_CELLS) {
    const [x, z] = key.split(",").map(Number);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      const onDeck = nx >= DECK.x0 && nx <= DECK.x1 && nz >= DECK.z0 && nz <= DECK.z1;
      if (!inPool(nx, nz) && onDeck) put(g, nx, 0, nz, SMOOTH_QUARTZ_SLAB, { type: "bottom", waterlogged: "false" });
    }
  }
}

/** lounger(x,z,axis): 2 long, 1 wide: foot (x,z) smooth_quartz_slab bottom at y=1; head smooth_quartz_stairs at y=1,
 *  facing the foot cell (plan.md wording; stairs facing = the side of the full-height back, see toolkit.md). */
export function lounger(g, x, z, axis = "x") {
  const [hx, hz] = axis === "x" ? [x + 1, z] : [x, z + 1];
  put(g, x, 1, z, ...B.slab("smooth_quartz", "bottom"));
  put(g, hx, 1, hz, ...B.stairs("smooth_quartz", dirOf([x - hx, 0, z - hz]), "bottom"));
}

/** patio_table(x,z): dark_oak_fence leg at y=1, smooth_quartz_slab bottom tabletop at y=2, two stair chairs at y=1
 *  on opposite sides (east and west of the leg), facing the table. */
export function patio_table(g, x, z) {
  put(g, x, 1, z, ...B.fence("dark_oak"));
  put(g, x, 2, z, ...B.slab("smooth_quartz", "bottom"));
  put(g, x - 1, 1, z, ...B.stairs("smooth_quartz", "east", "bottom"));
  put(g, x + 1, 1, z, ...B.stairs("smooth_quartz", "west", "bottom"));
}

/** garden_lamp(x,z): dark_oak_fence at y=1..2, standing lantern (hanging=false) at y=3. */
export function garden_lamp(g, x, z) {
  for (const y of [1, 2]) put(g, x, y, z, ...B.fence("dark_oak"));
  put(g, x, 3, z, LANTERN, { hanging: "false" });
}

/** hung_lantern(x,z,y=4): lantern hanging=true under a beam or the ceiling (y=5). */
export function hung_lantern(g, x, z, y = 4) {
  put(g, x, y, z, LANTERN, { hanging: "true" });
}

// ---- interior ---------------------------------------------------------------------------------------------------------
/** terrazzo_floor(box): smooth_stone with ~12% light_gray_concrete and ~6% white_concrete flecks (seeded). box = [x0,y0,z0,x1,y1,z1]. */
export function terrazzo_floor(g, [x0, y0, z0, x1, y1, z1], seed = 1) {
  const rand = rng(seed);
  for (const [x, y, z] of cells([x0, y0, z0], [x1, y1, z1])) {
    const r = rand();
    put(g, x, y, z, r < 0.06 ? WHITE_CONCRETE : r < 0.18 ? LIGHT_GRAY_CONCRETE : SMOOTH_STONE);
  }
}

/** panel_wall(x,y0..y1,z,facing): open spruce_trapdoors against the wall, half alternating bottom/top up the column. */
export function panel_wall(g, x, y0, y1, z, facing) {
  for (const y of range(y0, y1)) {
    put(g, x, y, z, ...B.trapdoor("spruce", facing, (y - y0) % 2 === 0 ? "bottom" : "top", true));
  }
}

/** sofa_low(x,z,len,axis,facing): smooth_red_sandstone_stairs seat row at y=2 facing `facing`; iron_trapdoor backrest
 *  behind the seat; arms at both ends, stairs turned outward across the sofa. */
export function sofa_low(g, x, z, len, axis = "x", facing = "north") {
  const along = axis === "x" ? [1, 0, 0] : [0, 0, 1];
  const back = DIRS[OPPOSITE[facing]];
  const cell = (i) => [x + along[0] * i, z + along[2] * i];
  for (const i of range(0, len - 1)) {
    const [sx, sz] = cell(i);
    put(g, sx, 2, sz, ...B.stairs("smooth_red_sandstone", facing, "bottom"));
    put(g, sx + back[0], 2, sz + back[2], ...B.trapdoor("iron", facing, "bottom", true));
  }
  const [lx, lz] = cell(-1), [rx, rz] = cell(len);
  put(g, lx, 2, lz, ...B.stairs("smooth_red_sandstone", dirOf([-along[0], 0, -along[2]]), "bottom"));
  put(g, rx, 2, rz, ...B.stairs("smooth_red_sandstone", dirOf(along), "bottom"));
}

/** egg_chair(x,z,facing): seat stairs at y=2; a high back of two stacked iron_trapdoors behind it (y=2, 3); one iron_trapdoor
 *  on each side at y=2 making the shell. */
export function egg_chair(g, x, z, facing) {
  const back = DIRS[OPPOSITE[facing]];
  const side = back[0] ? [0, 0, 1] : [1, 0, 0];
  put(g, x, 2, z, ...B.stairs("smooth_red_sandstone", facing, "bottom"));
  for (const y of [2, 3]) put(g, x + back[0], y, z + back[2], ...B.trapdoor("iron", facing, "bottom", true));
  for (const s of [-1, 1]) put(g, x + side[0] * s, 2, z + side[2] * s, ...B.trapdoor("iron", facing, "bottom", true));
}

/** sideboard(x,z,len,axis): birch_trapdoor cabinet fronts (closed) at y=2, a birch_slab top half at y=3 over them,
 *  and a potted_cactus on the top at y=4. */
export function sideboard(g, x, z, len, axis = "x") {
  const along = axis === "x" ? [1, 0, 0] : [0, 0, 1];
  const front = axis === "x" ? "south" : "east";
  for (const i of range(0, len - 1)) {
    const cx = x + along[0] * i, cz = z + along[2] * i;
    put(g, cx, 2, cz, ...B.trapdoor("birch", front, "bottom", false));
    put(g, cx, 3, cz, ...B.slab("birch", "top"));
  }
  put(g, x + along[0] * Math.floor((len - 1) / 2), 4, z + along[2] * Math.floor((len - 1) / 2), POTTED_CACTUS);
}

/** coffee_table(x,z,base=2): spruce_fence leg, spruce_slab top half on it, flower_pot on top. base = the standing y. */
export function coffee_table(g, x, z, base = 2) {
  put(g, x, base, z, ...B.fence("spruce"));
  put(g, x, base + 1, z, ...B.slab("spruce", "top"));
  put(g, x, base + 2, z, FLOWER_POT);
}

/** conversation_pit(x0,z0,x1,z1): smooth_quartz floor at y=0; a ring of smooth_quartz_stairs at y=1 facing inward,
 *  quartz_slab corners; orange_carpet cushions on the ring at y=2; coffee_table in the middle. */
export function conversation_pit(g, x0, z0, x1, z1) {
  fill(g, [x0, 0, z0], [x1, 0, z1], SMOOTH_QUARTZ);
  for (const [x, , z] of cells([x0, 1, z0], [x1, 1, z1])) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    if (!edge) continue;
    if ((x === x0 || x === x1) && (z === z0 || z === z1)) {
      put(g, x, 1, z, ...B.slab("quartz", "bottom"));
      continue;
    }
    const facing = z === z0 ? "south" : z === z1 ? "north" : x === x0 ? "east" : "west";
    put(g, x, 1, z, ...B.stairs("smooth_quartz", facing, "bottom"));
    put(g, x, 2, z, ORANGE_CARPET);
  }
  coffee_table(g, Math.floor((x0 + x1) / 2), Math.floor((z0 + z1) / 2), 1);
}

/** fireplace_stack(): the freestanding fireplace at x=20..21, z=21..22, y=1..8 (plan.md part 3 spec). */
export function fireplace_stack(g) {
  fill(g, [20, 1, 21], [21, 1, 22], MUD_BRICKS);
  put(g, 20, 2, 21, CAMPFIRE, { lit: "true", facing: "north" });
  put(g, 20, 2, 22, CAMPFIRE, { lit: "true", facing: "north" });
  put(g, 21, 2, 21, MUD_BRICKS);
  put(g, 21, 2, 22, MUD_BRICKS);
  fill(g, [20, 3, 21], [21, 3, 22], MUD_BRICKS);
  fill(g, [20, 4, 21], [21, 7, 22], BLACK_CONCRETE);
  fill(g, [20, 8, 21], [21, 8, 22], SMOOTH_STONE_SLAB, { type: "bottom", waterlogged: "false" });
}

/** dining_set(x,z): table footprint x..x+1, z..z+2: spruce_fence legs at the corners (y=2), spruce_slab top half (y=3);
 *  six birch_stairs chairs (three each side, facing the table); a hung lantern above the middle. */
export function dining_set(g, x, z) {
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 2], [1, 2]]) put(g, x + dx, 2, z + dz, ...B.fence("spruce"));
  for (const dx of [0, 1]) for (const dz of [0, 1, 2]) put(g, x + dx, 3, z + dz, ...B.slab("spruce", "top"));
  for (const dz of [0, 1, 2]) {
    put(g, x - 1, 2, z + dz, ...B.stairs("birch", "east", "bottom"));
    put(g, x + 2, 2, z + dz, ...B.stairs("birch", "west", "bottom"));
  }
  hung_lantern(g, x, z + 1);
}

/** galley_kitchen(): KITCHEN room. Counter run and appliances along the north wall (z=9..10), fridge at x=15, upper
 *  cabinets at y=4, breakfast bar along z=13 with stools on the kitchen side, an orange carpet accent. */
export function galley_kitchen(g) {
  for (const x of range(KITCHEN.x0, 14)) put(g, x, 2, 10, ...B.slab("smooth_quartz", "bottom"));
  put(g, 11, 2, 9, SMOKER, { facing: "south", lit: "false" });
  put(g, 12, 2, 9, FURNACE, { facing: "south", lit: "false" });
  put(g, 13, 2, 9, CAULDRON);
  put(g, 14, 2, 9, WHITE_CONCRETE);
  put(g, 15, 2, 9, IRON_BLOCK);
  put(g, 15, 3, 9, IRON_BLOCK);
  put(g, 15, 2, 10, ...B.trapdoor("iron", "south", "bottom", false));
  put(g, 15, 3, 10, ...B.trapdoor("iron", "south", "top", false));
  for (const x of range(11, 14)) put(g, x, 4, 9, ...B.trapdoor("spruce", "south", "top", false));
  for (const x of [11, 13, 15]) put(g, x, 2, KITCHEN.z1, ...B.fence("spruce"));
  for (const x of range(KITCHEN.x0, KITCHEN.x1)) put(g, x, 3, KITCHEN.z1, ...B.slab("spruce", "top"));
  for (const x of [12, 14]) {
    put(g, x, 2, 12, ...B.fence("dark_oak"));
    put(g, x, 3, 12, ...B.slab("birch", "top"));
  }
  put(g, 12, 2, 11, ORANGE_CARPET);
}

/** bed_double(x,z,facing,color): a bed pair (foot at x,z; head one cell along `facing`), spruce_planks headboard behind
 *  the head, and a birch_slab nightstand on a spruce_fence beside the head on each side. */
export function bed_double(g, x, z, facing, color) {
  const [dx, , dz] = DIRS[facing];
  const [sx, , sz] = dx ? [0, 0, 1] : [1, 0, 0];
  const bed = `${color}_bed`;
  put(g, x, 2, z, bed, { facing, part: "foot" });
  put(g, x + dx, 2, z + dz, bed, { facing, part: "head" });
  put(g, x + 2 * dx, 2, z + 2 * dz, SPRUCE_PLANKS);
  for (const s of [-1, 1]) {
    const nx = x + dx + sx * s, nz = z + dz + sz * s;
    put(g, nx, 2, nz, ...B.fence("spruce"));
    put(g, nx, 3, nz, ...B.slab("birch", "top"));
  }
}

/** wardrobe(x,z,len,axis): spruce_planks two high in a row, open spruce_trapdoor fronts in front of it. */
export function wardrobe(g, x, z, len, axis = "x") {
  const along = axis === "x" ? [1, 0, 0] : [0, 0, 1];
  const front = axis === "x" ? "south" : "east";
  const [fx, , fz] = DIRS[front];
  for (const i of range(0, len - 1)) {
    const cx = x + along[0] * i, cz = z + along[2] * i;
    put(g, cx, 2, cz, SPRUCE_PLANKS);
    put(g, cx, 3, cz, SPRUCE_PLANKS);
    put(g, cx + fx, 2, cz + fz, ...B.trapdoor("spruce", front, "bottom", true));
    put(g, cx + fx, 3, cz + fz, ...B.trapdoor("spruce", front, "top", true));
  }
}

/** bath_fit(box): box = [x0,y0,z0,x1,y1,z1] of the bath room (y0 = standing height). Tub: smooth_quartz_slab rim on the
 *  z0 row with water inside (z0+1); basin = cauldron at (x0, z1); mirror = glass_pane above it; WC = quartz_stairs at (x1, z1). */
export function bath_fit(g, [x0, y0, z0, x1, , z1]) {
  for (const x of range(x0, x1)) {
    put(g, x, y0, z0, ...B.slab("smooth_quartz", "bottom"));
    put(g, x, y0, z0 + 1, WATER, { level: "0" });
  }
  put(g, x0, y0, z1, CAULDRON);
  put(g, x0, y0 + 1, z1, GLASS_PANE);
  put(g, x0, y0 + 2, z1, GLASS_PANE);
  put(g, x1, y0, z1, ...B.stairs("quartz", "north", "bottom"));
}
