// FALLINGWATER: building + landscape in one pipeline. Frank Lloyd Wright's house (1935-39) at Bear Run, Pennsylvania,
// cantilevered over a waterfall, anchored into horizontal sandstone ledges, with a boulder rising through the living
// room hearth, in mixed deciduous woods. The site is half the design: terrain, water and building must interlock.
// 1:1 scale, a player (2 blocks) is an adult: 1 block ≈ 0.9 m.

export const SCALE = "SCALE (1:1, a player is 2 blocks tall): a storey is 3-4 blocks floor to floor (Wright's low ceilings), doors 2 tall, " +
  "parapets 1-1.5 blocks, the terraces' parapets have rounded-looking ends (stairs/slabs).";

// rough real dimensions -> blocks (1 block ≈ 0.9 m)
export const SITE = {
  size: { w: 80, d: 70, h: 40 },          // the whole site box: stream, falls, banks, woods, the house, the bridge
  house: { w: 44, d: 34, h: 18 },         // main house incl. cantilevered terraces (about 40 x 30 m with terraces)
  stream: "Bear Run flows across the site, roughly east to west, 6-10 blocks wide, over two stepped sandstone ledges: an upper fall " +
    "of about 4 blocks directly UNDER the house's terraces and a lower, smaller cascade below; a plunge pool beneath the main fall",
  rock: "horizontal ledges of buff-grey sandstone in courses 1-3 blocks thick, each stepping back irregularly, overhanging lips over " +
    "recessed weaker layers; the house's stone piers grow out of the upper ledge; a large boulder breaks up through the living room floor at the hearth",
  woods: "mixed deciduous woods (oak, birch, maple-like dark oak), rhododendron (azalea / flowering azalea) understory on the banks, moss on the rocks",
  approach: "a driveway bridge crosses the stream upstream of the house; a path and a 'hatch' stair drop from the living room down to the water",
};

export const MATERIALS = [
  "reinforced-concrete cantilevered terraces in a light ochre / apricot (smooth sandstone, birch, or light-ochre terracotta: choose what reads as warm cream)",
  "vertical walls and piers in rough, horizontally coursed local sandstone (buff-grey stone with deep joints; stone bricks / tuff / sandstone mixes)",
  "long ribbon windows and corner windows with no corner post, framed in Cherokee red steel (red terracotta / red nether bricks / red concrete frames, glass panes)",
  "flat roofs, deep overhangs; a tall stone chimney mass rising through the house",
].join("; ");

export const DESIGN = [
  "Two main levels of horizontal cream terraces stacked and cantilevered in opposite directions over the falls, the upper terrace turned 90° to the lower;",
  "a vertical stone core (chimney + piers) anchors them to the ledge; the horizontals echo the rock strata below; deep shadows under each terrace;",
  "a guest wing up the hill behind, linked by a covered walkway with a curving canopy (optional, can be omitted at this scale).",
].join(" ");

/** Concept prompts: the iconic view, the site plan and a section across the stream (all the same design). */
export const PROMPTS = {
  iconic: [
    "Minecraft build concept, vanilla Minecraft blocks only, crisp voxel style, natural daylight, no characters.",
    "Fallingwater (Frank Lloyd Wright, 1935) rebuilt in Minecraft at 1:1 scale on its site: the ICONIC VIEW from downstream, standing below the falls",
    "looking up: the waterfall pouring over horizontal sandstone ledges in the foreground, the house's cream concrete terraces cantilevered over the falls",
    "above, the stone chimney core, red-framed ribbon windows, mixed woods around.",
    `Materials: ${MATERIALS}. Design: ${DESIGN} Site: ${SITE.stream}; ${SITE.rock}; ${SITE.woods}. ${SCALE}`,
    "Skilled human builder quality: the rock ledges read as natural strata, the water as real water, the trees as natural crowns, the house crisp.",
  ].join(" "),
  sheet: [
    "Minecraft builder reference sheet for a BUILDING ON ITS SITE, vanilla Minecraft blocks only, crisp voxel style, plain light background, no characters.",
    "Three views at one scale: TOP-LEFT a SITE PLAN seen straight from above (the stream, the falls, the ledges, the house footprint and terraces, the bridge, trees as dots);",
    "TOP-RIGHT a SECTION cut north-south through the house and the falls (the ledges, the water levels, the plunge pool, the cantilevers, the floors);",
    "BOTTOM the ICONIC VIEW from downstream looking up at the house over the falls.",
    "Subject: Fallingwater (Frank Lloyd Wright) at 1:1 scale.",
    `Site about ${SITE.size.w} blocks east-west, ${SITE.size.d} north-south; the house about ${SITE.house.w} x ${SITE.house.d}, ${SITE.house.h} tall above the upper ledge.`,
    `Materials: ${MATERIALS}. Design: ${DESIGN} Site: ${SITE.stream}; ${SITE.rock}; ${SITE.woods}; ${SITE.approach}. ${SCALE}`,
  ].join(" "),
};

/** What must WORK (checked deterministically): the landscape's function contract. */
export const CONTRACT = [
  "the stream is continuous water from the upstream edge to the downstream edge; the falls drop over the ledge; no water inside the house",
  "every house pier and wall rests on rock or terrain (no floating supports); the terraces cantilever (nothing under their outer edges but air and water)",
  "the bridge deck and the path from the bridge to the house entrance are walkable (2 blocks headroom, steps of at most 1 block)",
  "trees keep 2 blocks clear of the house and the path",
];

/** Standard viewpoints for render and judging (camera in site coordinates; filled once the site plan sets the axes). */
export const VIEWS = {
  iconic: "downstream, below the lower cascade, eye at water level + 2, looking up at the terraces over the main fall",
  approach: "from the driveway bridge, eye height, looking at the house's entrance side",
  plan: "straight down",
  section: "a north-south cut through the main fall and the living room",
};
