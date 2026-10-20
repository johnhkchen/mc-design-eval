// Lighting and grounds (plan.md ROOMS, OPENINGS, Battery detail): hanging lanterns in every room and under every
// porch and hood, lamp posts at the doors, on the battery deck and on the glacis. Every write goes into air; a cell an
// earlier part filled is refused by runParts and reported, never overwritten. No apron paths: the palette has no path
// block, so the ground course stays smooth stone (noted in the summary).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { lamp_post } from "../vocab.mjs";

// a lantern hanging from the block above it (the cell at y+1 must be solid)
const hang = (g, [x, y, z]) => g.set(x, y, z, ...B.lantern(true));

// a ceiling block in the cell above a hanging lantern where the roof leaves air over an upper room or a garage (the roof
// is open there): the room's own floor or wall material
const CEILINGS = [
  [3, 6, 3, "spruce_planks"], [11, 6, 4, "spruce_planks"], [14, 6, 4, "spruce_planks"],
  [32, 6, 4, "spruce_planks"], [39, 6, 4, "spruce_planks"], [20, 3, 2, "white_concrete"],
  [32, 6, 7, "spruce_planks"], [39, 6, 7, "spruce_planks"],
  // hall aisles: the plan's lean-to stairs are not built here, so a granite block sits over each aisle lantern (y4)
  [46, 4, 6, "granite"], [46, 4, 11, "granite"], [61, 4, 6, "granite"], [61, 4, 11, "granite"],
  // officers' house: upper rooms under the hip roof; the porch deck's bottom slab (plan.md, plot 6 porch) over the two lanterns
  [68, 6, 4, "dark_oak_planks"], [71, 6, 4, "dark_oak_planks"],
  [67, 3, 9, "deepslate_tile_slab", { type: "bottom", waterlogged: "false" }], [72, 3, 9, "deepslate_tile_slab", { type: "bottom", waterlogged: "false" }],
];

// the rooms' hanging lanterns, from plan.md ROOMS (ground rooms hang from the floor course y3, upper rooms from the roof)
const HANGING = [
  // family house 0: parlour (ground), bedroom (upper), porch corners under the brick slab at y3
  [3, 2, 3], [3, 5, 3], [2, 2, 6], [4, 2, 6],
  // duplex 1: west and east units, ground and upper, and the two door hoods
  [11, 2, 4], [14, 2, 4], [11, 5, 4], [14, 5, 4], [10, 2, 9], [15, 2, 9],
  // garage 2 and shed 3
  [20, 2, 2], [25, 2, 1],
  // barracks 4: gallery ceiling at the doors, day room and squad room
  [31, 2, 10], [35, 2, 10], [40, 2, 10],
  [32, 2, 4], [39, 2, 4], [32, 2, 7], [39, 2, 7],
  [32, 5, 4], [39, 5, 4], [32, 5, 7], [39, 5, 7],
  // hall 5: aisles under the lean-tos (x46 / x61 at y4 stairs)
  [46, 3, 6], [46, 3, 11], [61, 3, 6], [61, 3, 11],
  // officers' house 6: hall and rooms ground and upper, porch under the deck slab
  [68, 2, 4], [71, 2, 4], [68, 5, 4], [71, 5, 4], [67, 2, 9], [72, 2, 9],
  // battery 7: no magazine lanterns here; the battery part carves the magazines to air, so those cells are locked
];

// the lamp posts: fence post with a standing lantern on top (y+1); doors, the nave centre line, the deck, the glacis
const POSTS = [
  // by the garage apron (x19 is the apron's west edge, stands on the ground course)
  [19, 1, 5],
  // in front of the hall's main door (plot front edge z19, on the ground course)
  [50, 1, 19], [57, 1, 19],
  // hall nave centre line, on the polished granite floor
  [53, 1, 4], [53, 1, 9], [53, 1, 14],
  // and along the nave side walls, where the centre line leaves the edges at light 6-7
  [48, 1, 8], [59, 1, 8],
  // battery deck: beside the gun pits and at the rear corners (deck walk is y4, the rail is z21)
  [78, 4, 11], [91, 4, 11], [78, 4, 20], [91, 4, 20],
  // battery glacis: on the grass top at z0..1 (top y1, so the post stands at y2)
  [80, 2, 1], [89, 2, 1],
];

export function build(g) {
  for (const [x, y, z, block, state] of CEILINGS) g.set(x, y, z, `minecraft:${block}`, state);
  for (const p of HANGING) hang(g, p);
  for (const p of POSTS) lamp_post(g, p);
}
