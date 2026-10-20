// Palette, site coordinates and a seeded rng for 30 Rockefeller Plaza (plan.md). Palette ids are palette.json's only.

// ---- palette (named constants; ids match palette.json) ----
export const LIMESTONE = "white_terracotta";              // body, piers, corners, parapets, fascia
export const COPING_STAIRS = "smooth_sandstone_stairs";   // ledge edges, copings (face outward)
export const COPING_SLAB = "smooth_sandstone_slab";       // string courses, deck caps
export const SPANDREL = "gray_terracotta";                // window spandrel course
export const WINDOW_DARK = "gray_stained_glass_pane";     // dark window glass (over BACKING_DARK)
export const BACKING_DARK = "black_concrete";             // behind dark glass
export const WINDOW_LIT = "yellow_stained_glass_pane";    // lit window glass (over SHROOMLIGHT)
export const SHROOMLIGHT = "shroomlight";                 // lit backing, floodlights, interior glow
export const SHOP_PANE = "glass_pane";                    // shop and lobby glass
export const GLASS = "glass";                             // glass-block screen
export const BRONZE = "polished_blackstone";              // frames, transoms, door frames
export const BRONZE_STAIRS = "polished_blackstone_stairs";
export const BRONZE_SLAB = "polished_blackstone_slab";
export const BRONZE_WALL = "polished_blackstone_wall";    // lamp posts
export const PLINTH = "polished_andesite";                // plinth course, deck curbs, paving
export const PLINTH_SLAB = "polished_andesite_slab";
export const DECK = "smooth_stone";                       // decks, paving
export const DECK_SLAB = "smooth_stone_slab";
export const SIGN_RED = "red_stained_glass";              // GE letters
export const GOLD = "gold_block";                         // WISDOM rays, dividers, crown
export const YELLOW_TERRACOTTA = "yellow_terracotta";     // WISDOM background
export const LIGHT_BLUE_TERRACOTTA = "light_blue_terracotta"; // WISDOM clouds
export const CYAN_TERRACOTTA = "cyan_terracotta";         // WISDOM cloud shade
export const SMOOTH_QUARTZ = "smooth_quartz";             // WISDOM figure
export const BLACK_TERRACOTTA = "black_terracotta";       // WISDOM inscription board
export const IRON_BARS = "iron_bars";                     // mast
export const LIGHTNING_ROD = "lightning_rod";             // mast tip
export const GRASS = "grass_block";                       // garden beds
export const MOSS = "moss_block";
export const OAK_LEAVES = "oak_leaves";                   // hedges (persistent)
export const AZALEA = "flowering_azalea";
export const LANTERN = "lantern";                         // hanging false; never chain
export const BANNERS = {                                  // flags, facing outward
  white: "white_wall_banner", blue: "blue_wall_banner", red: "red_wall_banner",
  yellow: "yellow_wall_banner", green: "green_wall_banner",
};

// ---- site (plot-local blocks; y 0 = lowest ground) ----
export const SITE = [146, 246, 54];                       // grid size x, y, z
export const CAP_Y = 245;                                 // nothing above this y
export const MIRROR_Z = 27.5;                             // N and S boxes mirror: z <-> 55 - z
export const GE_SIGN = { x: [76, 103], y: [197, 209], z: [12, 43] };   // N face z12, S face z43
export const WISDOM = { x: [144, 145], y: [3, 27], z: [20, 35] };      // east entrance frame
export const PORTAL_Z = [[21, 23], [26, 29], [32, 34]];   // east portals (x145, y3..9)
export const MARQUEE = { x: [68, 79], y: [12, 15], z: [0, 3] };
export const PENTHOUSE = { x: [96, 119], y: [233, 236], z: [25, 30] };
export const MAST = { x: [107, 108], y: [237, 244], z: [27, 28] };

// Walk level (the y the feet stand on) at a column: solid ground fills below it, plinths rise from it.
export function groundLevel(x, z) {
  if (x < 16) return z >= 48 ? 0 : 1;                     // west band; P1 pavilion and forecourt at 0
  if (x < 80) return 1;
  if (x < 132) return 2;
  return 3;                                               // north-east corner and plaza end
}

// Footprint (the lot): false outside it. Blocks x, z; 4x4-block cells (row r = z 4r..4r+3).
export function inLot(x, z) {
  if (x < 0 || x > 145 || z < 0 || z > 53) return false;
  const r = z >> 2;
  if (r === 0 && x <= 19) return false;                   // north-west corner cut
  if (x >= 144 && (r === 0 || (r >= 1 && r <= 2) || (r >= 10 && r <= 12))) return false;
  if (r === 13 && x > 15) return false;                   // south edge only at the west (forecourt)
  return true;
}

// ---- seeded rng: rng(seed)() returns a float in [0, 1) (mulberry32; same seed, same sequence) ----
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
