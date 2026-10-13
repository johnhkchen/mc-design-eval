// Lumber Hall: palette as named constants (palette.json's ids only), plan.md's site constants, and a seeded rng.

// frame: stripped dark oak log (posts, beams, piers; set its axis per placement)
export const FRAME_LOG = "stripped_dark_oak_log";
// frame: stripped dark oak wood (cut ends of the frame logs)
export const FRAME_WOOD = "stripped_dark_oak_wood";
// infill: calcite (the daub between the timbers)
export const INFILL = "calcite";
// trim: dark oak planks (fascia frames, flooring of the stores)
export const TRIM_PLANKS = "dark_oak_planks";
// trim: dark oak stairs (brackets, braces, awnings' upside-down lips; set facing and half)
export const TRIM_STAIRS = "dark_oak_stairs";
// trim: dark oak slab (sills, window sills, door sills; set type)
export const TRIM_SLAB = "dark_oak_slab";
// trim: dark oak trapdoor (shutters, hatches, valances; set facing, half, open)
export const TRIM_TRAPDOOR = "dark_oak_trapdoor";
// trim: dark oak door (loading doors and the double doors; set facing, half, hinge)
export const TRIM_DOOR = "dark_oak_door";
// trim: dark oak fence (lamp posts, hoist arms, rails)
export const TRIM_FENCE = "dark_oak_fence";
// trim: dark oak fence gate
export const TRIM_FENCE_GATE = "dark_oak_fence_gate";
// base: cobbled deepslate (the plinth course)
export const BASE = "cobbled_deepslate";
// base: cobbled deepslate stairs (plinth steps)
export const BASE_STAIRS = "cobbled_deepslate_stairs";
// base: cobbled deepslate slab (plinth caps)
export const BASE_SLAB = "cobbled_deepslate_slab";
// roof: the slate mix (cobbled deepslate, deepslate tiles, polished deepslate)
export const ROOF_COBBLE = "cobbled_deepslate";
// roof: deepslate tiles
export const ROOF_TILES = "deepslate_tiles";
// roof: polished deepslate
export const ROOF_POLISHED = "polished_deepslate";
// glass: glass pane (windows, loading-door transoms, lobby windows)
export const GLASS_PANE = "glass_pane";
// ground: polished andesite (pavement)
export const POLISHED_ANDESITE = "polished_andesite";
// ground: andesite (one in six of the pavement)
export const ANDESITE = "andesite";
// ground: cobblestone (gutters, cart-passage floor, podium fill)
export const COBBLESTONE = "cobblestone";
// metal: iron chain (hoist chains; set axis y)
export const IRON_CHAIN = "iron_chain";
// metal: lantern (the only light; set hanging)
export const LANTERN = "lantern";
// functional: ladder (keeper ladders; set facing)
export const LADDER = "ladder";
// functional: barrel (stock in the stores; set facing)
export const BARREL = "barrel";
// functional: candle (counting-room and office light)
export const CANDLE = "candle";

// shop woods: the six Folio woods, one per business (the shop accents stay with their wood)
export const WOODS = ["oak", "spruce", "birch", "jungle", "acacia", "dark_oak"];
// shop: the blocks of one wood: { log, strippedLog, planks, stairs, trapdoor, leaves } (ids as palette.json's "shop" role)
export const woodBlocks = (wood) => ({
  log: `${wood}_log`, strippedLog: `stripped_${wood}_log`, planks: `${wood}_planks`,
  stairs: `${wood}_stairs`, trapdoor: `${wood}_trapdoor`, leaves: `${wood}_leaves`,
});

// site: plot extent and grid size (x 0..42, z 0..37, y 0..39), from plan.md SITE
export const SITE = { x0: 0, x1: 42, z0: 0, z1: 37, size: [43, 40, 38] };
// site: the podium's top course; the pavement top is y 4 and people stand in y 5
export const PAVEMENT_Y = 4;
// site: the shop storey's floor (people stand here) and its top course
export const SHOP_FLOOR_Y = 5, SHOP_TOP_Y = 11;
// site: the first floor's floor block (timber store air y 13..17)
export const FIRST_FLOOR_Y = 12;
// site: the loft's floor block (loft air y 19..23)
export const LOFT_FLOOR_Y = 18;
// site: the roof's start course (eave of the granary roof)
export const ROOF_Y = 24;
// site: the top of the gable triangles
export const GABLE_TOP_Y = 34;
// site: the north face's shopfront and fascia plane (z); the south face is mirrorZ(NORTH_FACE_Z)
export const NORTH_FACE_Z = 5;
// site: the north first-floor and loft front planes (z); the jetties project toward the street
export const NORTH_FIRST_Z = 4, NORTH_LOFT_Z = 3;
// site: the entrance cell (pavement top y 4, so stand in y 5)
export const ENTRANCE = [5, 5, 3];
// site: the cart passage lane (clear x 35..39, y 5..9, through the block)
export const CART_LANE_X = 37;
// site: the hoist beams' x positions (twin logs at x and x+1, two beams)
export const HOIST_X = [11, 30];
// site: the side walls' x positions (west and east end bays)
export const WEST_WALL_X = [2, 8], EAST_WALL_X = [34, 40];
// site: mirror a z across the building's centre line (north <-> south face; facings flip n <-> s)
export const mirrorZ = (z) => 37 - z;

// rng(seed): a seeded random function returning floats in [0, 1) (mulberry32), so a rebuild is identical
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
