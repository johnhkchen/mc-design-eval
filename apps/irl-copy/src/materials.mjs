// Materials for the massing, from what's known about each building and what the aerial photo shows. Still placeholders
// for the design pipeline, but the right kind: painted clapboard on a 1900 wood-frame house, stucco on a 1930s one, brick
// on masonry, concrete on steel or concrete frames, and roofs the colour they are from above.

// approximate average colours of the blocks the roofs and ground may use (sRGB)
const ROOFS = {
  deepslate_tiles: [54, 54, 61], gray_concrete: [55, 58, 62], light_gray_concrete: [125, 125, 115], white_concrete: [207, 213, 214],
  smooth_stone: [158, 158, 158], stone: [125, 125, 125], polished_andesite: [132, 134, 133], tuff: [108, 109, 102],
  bricks: [150, 97, 83], terracotta: [152, 94, 67], red_terracotta: [143, 61, 46], brown_terracotta: [77, 51, 36],
  light_gray_terracotta: [135, 107, 98], white_terracotta: [209, 178, 161], cyan_terracotta: [87, 91, 91], green_terracotta: [76, 83, 42],
  dark_oak_planks: [66, 43, 20], spruce_planks: [114, 84, 48], mud_bricks: [137, 103, 79], smooth_sandstone: [223, 214, 170],
};
const near = (rgb, table) => { let best = null, d = Infinity;
  for (const [b, c] of Object.entries(table)) { const e = (rgb[0] - c[0]) ** 2 * 0.3 + (rgb[1] - c[1]) ** 2 * 0.59 + (rgb[2] - c[2]) ** 2 * 0.11; if (e < d) { d = e; best = b; } }
  return best; };
/** The roof block nearest an aerial colour. */
export const roofBlock = (rgb) => near(rgb, ROOFS);

// painted Victorian and Edwardian clapboard: pastels, one per house (stable by id)
const PAINT = ["light_blue_concrete_powder", "pink_concrete_powder", "yellow_concrete_powder", "lime_concrete_powder", "white_concrete_powder",
  "light_gray_concrete_powder", "cyan_terracotta", "white_terracotta", "magenta_concrete_powder", "orange_concrete_powder"];
const STUCCO = ["white_terracotta", "smooth_sandstone", "white_concrete", "light_gray_terracotta", "pink_terracotta"];
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

/** The wall block and the kind of building (for the manifest) from the assessor's record, if there is one. Houses are
 *  told by use (residential) and size (under 800 m2): the Palace's parcel is "Miscellaneous/Mixed-Use", year 1900. */
export function wallFor(id, rec, areaM2 = 0) {
  const pick = (list) => list[hash(id) % list.length];
  if (!rec) return { block: "smooth_sandstone", kind: "civic or unrecorded" };                  // park buildings
  if (rec.wall) return { block: rec.wall, kind: rec.wallKind ?? rec.wall };                     // a source that names the wall (France)
  const home = /resid|dwelling/i.test(rec.use ?? "") && areaM2 < 800;
  if (!home && rec.construction !== "C") return { block: "smooth_sandstone", kind: "civic or commercial" };
  const ct = rec.construction, y = rec.year ?? 1950;
  if (ct === "C") return { block: y < 1930 ? "bricks" : "stone_bricks", kind: "masonry" };
  if (ct === "A" || ct === "B" || ct === "S" || ct === "STE") return { block: "light_gray_concrete", kind: "steel or concrete frame" };
  // wood frame (D, WOO) and condominiums (NA): by age
  if (y < 1915) return { block: pick(PAINT), kind: y < 1901 ? "Victorian, painted wood" : "Edwardian, painted wood" };
  if (y < 1950) return { block: pick(STUCCO), kind: "stucco, interwar" };
  return { block: pick(["white_concrete", "light_gray_concrete", "white_terracotta"]), kind: "postwar" };
}

/** What open ground the aerial photo shows: green (by NDVI), sand, or paving. In a park, shade and dry grass read low
 *  on NDVI too, so only clearly bare, bright ground is paving there. */
export function groundFrom(r, g, b, nir, { park = false, dry = false } = {}) {
  if (!r && !g && !b) return null;
  const ndvi = (nir - r) / (nir + r + 1e-6), lum = 0.3 * r + 0.59 * g + 0.11 * b;
  if (ndvi > (park ? 0.02 : 0.18)) return "grass_block";
  if (park && lum < 140) return "grass_block";
  if (lum > 150 && r > b + 25 && g > b + 10) return "sand";
  // place.dryGrass (a California summer photo): tan, summer-dry grass reads as pavement by its near-infrared alone; warm and
  // a little green is grass, and a pale warm beach under sea haze is sand
  if (dry && ndvi > 0.02 && r > b + 8 && lum < 165) return "grass_block";
  if (dry && lum > 140 && r > b + 6 && g >= b) return "sand";
  return lum > 120 ? "smooth_stone" : "andesite";
}
