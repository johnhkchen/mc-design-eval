// Part: room: Camelback kitchen (interior of box x16..19, y3..6, z14..16; door x17 z13; stair at x19 is locked).
// Stove on the west wall (furnace z14, written by the chimneys part's hearth_nook; smoker z15), a barrel store on z16,
// a two-cell table on z16 with one chair, lanterns hung from the y7 ceiling. Nothing on x17 z14 (the cell in front of
// the door) and nothing in x19.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { table_set, hanging_lantern } from "../vocab.mjs";

export function build(g) {
  // y3 (standing level): rows run along x16..19 (x19 is the stair flight, left untouched by '.'), successive rows along z14..16
  layers(g, [16, 3, 14], {
    S: ["smoker", { facing: "east", lit: "true" }],
    B: ["barrel", { facing: "up" }],
    C: ["spruce_stairs", { facing: "north", half: "bottom" }],
  }, [
    "....",   // z14: the stove is the chimneys part's furnace at x16; the door cell x17 stays clear
    "SC..",   // z15: smoker by the wall, chair at x17 facing the table
    "B...",   // z16: barrel store (table legs at x17..18 come from table_set)
  ]);
  // Table: spruce fence legs on y3, top slab (type top) on y4, x17..18 at z16.
  table_set(g, 17, 3, 16, 2);
  // Barrel stacked on the store (y4).
  layers(g, [16, 4, 16], { B: ["barrel", { facing: "up" }] }, ["B..."]);
  // Lanterns hang from the y7 ceiling, over the path and the store.
  hanging_lantern(g, 18, 6, 14);
  hanging_lantern(g, 16, 6, 16);
}
