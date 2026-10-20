// Shared constants for every part: palette ids (all in palette.json), plan.md's site coordinates, a seeded rng.
// Site coordinates are KIT coordinates (the whole grid) unless a name says local; plot p's local (0, 0) is PLOT_ORIGIN[p].

// ---- palette: every id here is in palette.json ----
// limestone body, piers, parapets
export const LIMESTONE = "smooth_sandstone";
// limestone stair, for the stepped portal and quoins
export const LIMESTONE_STAIRS = "smooth_sandstone_stairs";
// limestone slab, the parapet coping
export const LIMESTONE_SLAB = "smooth_sandstone_slab";
// limestone wall
export const LIMESTONE_WALL = "sandstone_wall";
// trim: cornice band, quoin courses, lintels
export const TRIM = "cut_sandstone";
// trim slab
export const TRIM_SLAB = "cut_sandstone_slab";
// carved accents: pier heads, portal lintel heads
export const CARVED = "chiseled_sandstone";
// plinth course, pylons, plinth body, forecourt paving
export const PLINTH = "polished_andesite";
// plinth stair
export const PLINTH_STAIRS = "polished_andesite_stairs";
// plinth slab
export const PLINTH_SLAB = "polished_andesite_slab";
// dark base courses and spandrels
export const DARK = "polished_deepslate";
// dark stair
export const DARK_STAIRS = "polished_deepslate_stairs";
// dark slab
export const DARK_SLAB = "polished_deepslate_slab";
// window glass
export const GLASS = "glass_pane";
// dark office behind glass
export const OFFICE_DARK = "gray_concrete";
// lit office, lobby and shop light
export const LIT = "ochre_froglight";
// bronze: frames, fascias, door surrounds
export const BRONZE = "waxed_exposed_cut_copper";
// bronze stair
export const BRONZE_STAIRS = "waxed_exposed_cut_copper_stairs";
// bronze slab
export const BRONZE_SLAB = "waxed_exposed_cut_copper_slab";
// copper rings of the armillary sphere, ecliptic band
export const COPPER = "waxed_exposed_copper";
// weathered copper: Atlas shoulder and thigh highlights (≤20%)
export const COPPER_WEATHERED = "waxed_weathered_cut_copper";
// Atlas figure body (dark bronze)
export const ATLAS_BODY = "brown_terracotta";
// armillary end stubs
export const LIGHTNING_ROD = "lightning_rod";
// gilded relief fields
export const GOLD = "gold_block";
// Deco pattern on gilding
export const YELLOW = "yellow_terracotta";
// heraldic quarters (plots 1 and 2 only)
export const RED = "red_terracotta";
// heraldic quarters and the French field
export const BLUE = "blue_terracotta";
// roof decks and forecourt joints
export const ROOF_DECK = "smooth_stone";
// deck slab
export const ROOF_SLAB = "smooth_stone_slab";
// garden soil
export const GRASS = "grass_block";
// garden moss patches (about 1 in 8)
export const MOSS = "moss_block";
// garden gravel paths
export const GRAVEL = "gravel";
// garden path edge
export const DIRT_PATH = "dirt_path";
// garden hedges
export const AZALEA = "azalea_leaves";
// garden flowering accents
export const AZALEA_FLOWERING = "flowering_azalea_leaves";
// garden tree crowns (persistent)
export const OAK_LEAVES = "oak_leaves";
// garden tree trunks (axis y)
export const OAK_LOG = "oak_log";
// garden flower beds
export const POPPY = "poppy";
// garden flower beds
export const ALLIUM = "allium";
// garden flower beds
export const CORNFLOWER = "cornflower";
// garden flower beds
export const OXEYE_DAISY = "oxeye_daisy";
// garden flower beds
export const RED_TULIP = "red_tulip";
// garden flower beds
export const WHITE_TULIP = "white_tulip";
// entrance doors, in bronze frames
export const DOOR = "dark_oak_door";
// lamps (hung from iron_bars, never chain)
export const LANTERN = "lantern";
// lamp posts
export const FENCE = "oak_fence";
// lantern arms and hangers
export const IRON_BARS = "iron_bars";
// lit shop displays
export const CANDLE = "candle";

// ---- site: plan.md's coordinates ----
// the whole site grid: kit x 0..199, y 0..155, z 0..54
export const SITE_SIZE = [200, 156, 55];
// kit [x, z] of each plot's local (0, 0): plot 0 (International Building), plot 1 (British Empire), plot 2 (La Maison Française)
export const PLOT_ORIGIN = [[0, 0], [88, 0], [146, 0]];
// local [x, z] extent of each plot's bounding box
export const PLOT_SIZE = [[84, 55], [54, 19], [54, 19]];
// highest block y of each plot
export const PLOT_MAX_Y = [155, 50, 50];
// the entrance cell before Atlas (the street is just outside the notch)
export const ENTRANCE = [72, 1, 27];
// the armillary sphere's centre, kit coordinates
export const ATLAS_CENTRE = [67, 16, 27.5];
// the forecourt: open to sky, paving at y 1, Atlas on the axis z 27.5
export const FORECOURT = { x0: 63, x1: 71, z0: 20, z1: 35, y: 1 };
// the E portal: piers y 2..17, coping y 18, face at x 62
export const PORTAL = { x0: 58, x1: 62, z0: 20, z1: 35, y0: 2, y1: 18 };
// the lobby behind the portal: closed air, lit ceiling at y 16
export const LOBBY = { x0: 50, x1: 59, z0: 22, z1: 33, y0: 2, y1: 15, ceilingY: 16 };
// the Atlas plinth: kit cells x 64..70, z 24..31, y 2..5
export const PLINTH_BOX = { x0: 64, x1: 70, z0: 24, z1: 31, y0: 2, y1: 5 };
// deck y of each roof (coping is one above, per plan.md ROOFS)
export const DECK = { T1: 141, PH: 147, T2: 131, T3: 104, T4: 58, B: 35, A: 6, PODIUM: 22, SETBACK: 26, INNER: 28, PORTAL: 17, PLOT_PH: 30, PLOT_W: 33, PLOT_W2: 36 };
// spandrel rows: y ≡ 1 (mod 3), i.e. 7, 10, 13 …
export const isSpandrelRow = (y) => y % 3 === 1;
// glass rows: the two above each spandrel row (y ≡ 0 or 2, mod 3)
export const isGlassRow = (y) => y % 3 !== 1;

// Is the local cell [lx, lz] of plot p on the lot (the footprint map, with its cut corners and the off-lot forecourt notch)?
export function onLot(p, lx, lz) {
  const [sx, sz] = PLOT_SIZE[p];
  if (lx < 0 || lz < 0 || lx >= sx || lz >= sz) return false;
  if (p !== 0) return true;
  if (lx <= 3 && lz <= 1) return false;                                              // NW corner cut
  if (lx <= 1 && lz >= 2 && lz <= 3) return false;
  if ((lx <= 19 && lz >= 46 && lz <= 49) || (lx <= 21 && lz >= 50 && lz <= 51) || (lx <= 29 && lz >= 52)) return false; // SW notch
  if (lx >= 72 && lz >= 20 && lz <= 35) return false;                                // forecourt notch: sidewalk, build nothing
  return true;
}

// The ground course y of local cell [lx, lz] of plot p (the block at that y is the paving/plinth; people walk at y + 1).
export function groundAt(p, lx, lz) {
  if (p === 0) return lx >= 74 && lx <= 75 && lz >= 16 && lz <= 17 ? 2 : lx < 37 ? 0 : 1;
  return lx <= 17 ? 0 : lx <= 41 ? 1 : 2;
}

// Seeded rng: rng(seed)() returns a float in [0, 1). Same seed, same sequence, every run.
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

// Position hash in [0, 1) for irregular choices that must not change between runs (lit windows: hash3(x, y, z) < 0.25).
export function hash3(x, y, z) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
