// Dalaran's earthworks: the same tiles as Lordaeron's (one geometry, one contract for the placer) in the hillside
// concept's dress: pale dressed stone on a polished andesite footing and coping, a dark timber balustrade on red posts
// in place of a cobble parapet, lanterns on red posts, wide flights of polished stone lit on both cheeks, and terraces
// paved to walk on with flowering beds (azalea, peony, lilac, bamboo) at the upper course's foot.
import { allEarthworks, LORDAERON } from "../lordaeron/earthworks.mjs";

const rail = (p, wood = "dark_oak") => `${wood}_fence[east=${p.east === "low"},north=${p.north === "low"},south=${p.south === "low"},waterlogged=false,west=${p.west === "low"}]`;
const FENCE = "dark_oak_fence[east=false,north=false,south=false,waterlogged=false,west=false]", POST = "mangrove_fence[east=false,north=false,south=false,waterlogged=false,west=false]";

export const DALARAN = {
  ...LORDAERON,
  foot: (r) => (r < 0.8 ? "polished_andesite" : "andesite"),
  course: (r) => (r < 0.7 ? "stone_bricks" : r < 0.85 ? "cracked_stone_bricks" : r < 0.95 ? "mossy_stone_bricks" : "chiseled_stone_bricks"),
  low: (r) => (r < 0.75 ? "grass_block[snowy=false]" : r < 0.9 ? "coarse_dirt" : "podzol"),
  drain: (r) => (r < 0.5 ? "gravel" : "polished_andesite"),
  coping: "polished_andesite",
  stair: "polished_andesite", batter: () => "polished_andesite", tread: "polished_andesite", tread_slab: "polished_andesite",
  // the balustrade: dark timber rails, a red (mangrove) post wherever the rail ends, turns or carries a lamp; wooden
  // fences of any wood join, so the posts and rails read as one balustrade
  parapet: (p, post) => rail(p, post ? "mangrove" : "dark_oak"),
  cheek_post: POST, cheek_lamps: [0, 1],
  guard: (e, w) => rail({ east: e ? "low" : "none", west: w ? "low" : "none", north: "none", south: "none" }, !e || !w ? "mangrove" : "dark_oak"),
  vine: 0.55,
  terrace_bed: (r) => (r < 0.8 ? "grass_block[snowy=false]" : "podzol"),
  terrace_walk: (q) => (q < 0.5 ? "polished_andesite" : "stone_bricks"),
  terrace_plants: ["flowering_azalea", "azalea", "peony", "rose_bush", "lilac", "bamboo", "pink_petals", "flowering_azalea_leaves", "allium", "lily_of_the_valley"],
  terrace_carpet: () => false,
  lamp_post: [FENCE, FENCE],
};

export const dalaranEarthworks = () => allEarthworks(DALARAN);
