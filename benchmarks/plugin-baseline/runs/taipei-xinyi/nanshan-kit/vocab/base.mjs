// Shared by every part and by build.mjs: palette ids, plan.md's site coordinates, the footprint and ground maps, rng, and the views
// that move plan coordinates into the grid. Parts write PLOT-LOCAL coordinates (plan.md): plot 0 is the site origin, plot 1 starts at
// x PLOT1_X of the site (onPlot1). build.mjs adds the MARGIN (withMargin), so parts never see grid coordinates.

/** Site size in blocks [x, y, z] from plan.md (x 0..308, y 0..400, z 0..126). */
export const SITE = [309, 401, 127];
/** Empty blocks around the site: a roof on a wall at the site edge grows the grid by one, so the edge needs room. */
export const MARGIN = 2;
/** Grid size build.mjs creates: the site plus MARGIN on each side in x and z. */
export const GRID = [SITE[0] + 2 * MARGIN, SITE[1], SITE[2] + 2 * MARGIN];
/** Plot 0, Taipei Nan Shan Plaza: site origin, size in blocks, top y. */
export const PLOT0 = { id: 0, x0: 0, z0: 0, w: 248, d: 90, maxY: 390 };
/** Plot 1, Taipei Sky Tower: site origin, size in blocks, top y. */
export const PLOT1 = { id: 1, x0: 252, z0: 0, w: 57, d: 127, maxY: 400 };
/** Site x of plot 1's local x = 0. */
export const PLOT1_X = PLOT1.x0;

// Footprint ('#' = build here) and ground (top y of the ground; '.' = none). Rows run along +z, columns along +x.
// One character per 6x6 blocks on plot 0 and 3x3 blocks on plot 1 (brief.txt).
const FOOT = { 0: [
    "............................###....##.....",
    "..........................##############..",
    "##################........##############..",
    "##################........##############..",
    "#########################################.",
    "#########################################.",
    "#########################################.",
    "#########################################.",
    "#########################################.",
    "#########################################.",
    "#################.........##############..",
    "#################.........##############..",
    "#################.........##############..",
    "#################...........###....##.....",
    "...##.....................................",
  ], 1: [
  "......#######......",
  "....###########....",
  "...#############...",
  "..################.",
  ".#################.",
  ".##################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  ".#################.",
  "..###############..",
  "...##############..",
  "...##############..",
  "..###############..",
  ".##################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  "###################",
  ".##################",
  "...................",
] };
const GROUND = { 0: [
  "...........................33333..33333...",
  "222223333333333333........33333333333333..",
  "222223333333333333........33333333333333..",
  "2222233333333333333333333333333333333333..",
  "22222333333333333333333333333333333333333.",
  "222223333333333333333333333333333333333333",
  "222223333333333333333333333333333333333333",
  "222223333333333333333333333333333333333333",
  "112223333333333333333333333333333333333333",
  "112223333333333333333333333333333333333333",
  "1122233333333333333333333333333333333333..",
  "11222333333333333.........33333333333333..",
  "11222333333333333.........33333333333333..",
  "11222333333333333..........33333..33333...",
  "..222333333333333.........................",
], 1: [
  ".....000000000.....",
  "....000000000000...",
  "..000000000000000..",
  ".00000000000000000.",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  ".00000000000000000.",
  "..000000000000000..",
  "..000000000000000..",
  ".00000000000000000.",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  "0000000000000000000",
  ".00000000000000000.",
] };

const CELL = { 0: 6, 1: 3 };
const cellMap = (plot, x, z, map) => {
  const c = CELL[plot], row = map[Math.floor(z / c)], ch = row?.[Math.floor(x / c)];
  return ch;
};
/** True if plot-local block (x, z) of plot (0 or 1) is a footprint cell ('#'): build only there. */
export const onFootprint = (plot, x, z) => cellMap(plot, x, z, FOOT[plot]) === "#";
/** Top y of the ground at plot-local block (x, z) of plot (0 or 1), or null where there is no ground. */
export const groundTop = (plot, x, z) => {
  const ch = cellMap(plot, x, z, GROUND[plot]);
  return ch === undefined || ch === "." ? null : Number(ch);
};

/** A view of grid g in which every write and read is shifted by (dx, 0, dz): the coordinates passed in are offset. */
export function shiftView(g, dx, dz) {
  const at = (x, y, z) => [x + dx, y, z + dz];
  const box = (a, b) => [[a[0] + dx, a[1], a[2] + dz], [b[0] + dx, b[1], b[2] + dz]];
  const self = new Proxy(g, {
    get(t, p) {
      if (p === "set") return (x, y, z, ...rest) => { t.set(...at(x, y, z), ...rest); return self; };
      if (p === "unset") return (x, y, z) => { t.unset(...at(x, y, z)); return self; };
      if (p === "fill") return (a, b, ...rest) => { t.fill(...box(a, b), ...rest); return self; };
      if (p === "get" || p === "blockAt" || p === "isAir" || p === "inBounds") return (x, y, z) => t[p](...at(x, y, z));
      const v = Reflect.get(t, p);
      return typeof v === "function" ? v.bind(t) : v;
    },
  });
  return self;
}
/** A view of grid g where x and z are site coordinates (plan.md's, origin at the site corner): adds the MARGIN. */
export const withMargin = (g) => shiftView(g, MARGIN, MARGIN);
/** A view of grid g where x is plot-1-local: adds PLOT1_X. Give it a withMargin view to reach grid coordinates. */
export const onPlot1 = (g) => shiftView(g, PLOT1_X, 0);

/** A seeded rng(seed): returns a function giving floats in [0, 1); the same seed gives the same build. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Palette: every id is in palette.json (roles or objects) and was checked against 1.21.1.
// Fins, frames, canopies
export const FIN = "smooth_quartz";
export const FIN_SLAB = "smooth_quartz_slab";
export const FIN_STAIRS = "smooth_quartz_stairs";
/** Quartz column: colonnade piers, crown fins above y365, porte-cochère posts. */
export const PILLAR = "quartz_pillar";
export const CANOPY_SLAB = "quartz_slab";
// Glass
export const GLASS_GRAY = "gray_stained_glass";
export const GLASS_BLACK = "black_stained_glass";
export const GLASS_LIGHT_GRAY = "light_gray_stained_glass";
export const GLASS_CYAN = "cyan_stained_glass";
export const GLASS_WHITE = "white_stained_glass";
export const GLASS_RED = "red_stained_glass";
export const GLASS_CLEAR = "glass";
export const PANE_CLEAR = "glass_pane";
export const PANE_LIGHT_GRAY = "light_gray_stained_glass_pane";
export const PANE_GRAY = "gray_stained_glass_pane";
// Concrete, stone, plinth
export const CONCRETE_LIGHT_GRAY = "light_gray_concrete";
export const CONCRETE_GRAY = "gray_concrete";
export const CONCRETE_WHITE = "white_concrete";
export const STONE = "smooth_stone";
export const STONE_SLAB = "smooth_stone_slab";
/** The plinth on both plots, and the ground fill under the footprint. */
export const ANDESITE = "polished_andesite";
export const ANDESITE_SLAB = "polished_andesite_slab";
export const DIORITE = "polished_diorite";
export const DIORITE_SLAB = "polished_diorite_slab";
export const BRICKS = "stone_bricks";
// Gold screen
export const TERRA_YELLOW = "yellow_terracotta";
export const TERRA_ORANGE = "orange_terracotta";
export const GOLD = "gold_block";
/** Open, lying on the face: the screen lattice. */
export const TRAPDOOR_BIRCH = "birch_trapdoor";
export const SLAB_BIRCH = "birch_slab";
// Metal
export const IRON = "iron_block";
export const IRON_BARS = "iron_bars";
export const LIGHTNING_ROD = "lightning_rod";
export const END_ROD = "end_rod";
// Light (functional)
export const SEA_LANTERN = "sea_lantern";
export const FROGLIGHT_OCHRE = "ochre_froglight";
export const FROGLIGHT_PEARL = "pearlescent_froglight";
export const SHROOMLIGHT = "shroomlight";
export const GLOWSTONE = "glowstone";
/** Lit (lit: true) at the aircraft lights; enclosed by red glass. */
export const REDSTONE_LAMP = "redstone_lamp";
/** Hang with hanging: true from a solid block (this build has no chain). */
export const LANTERN = "lantern";
// Planting
export const MOSS = "moss_block";
export const AZALEA = "flowering_azalea";
/** Use with persistent: true. */
export const OAK_LEAVES = "oak_leaves";
// Doors (both halves, facing out)
export const DOOR_OAK = "oak_door";
export const DOOR_BIRCH = "birch_door";
