// Part: room: Bungalow kitchen. Interior of box [86,3,15, 89,6,16] only (plan: kitchen x86..89 z15..16).
// Focal piece: the lit furnace stove at x86 z15, against the chimney (x86 z14 is chimney footing).
// Layout (floor y 3, rows z15 / z16, columns x86..89):
//   z15:  stove  .  table  table      (table = spruce fence legs + top slab, surface y5, lantern on it)
//   z16:  barrel .  .      barrel     (x88 z16 kept clear: the way to the back door at x88 z17)
// Entry from the partition opening (z14, x87..89) lands on x87 z15; a 2-high lane runs x87 z15 -> x87 z16 -> x88 z16.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { table_set } from "../vocab.mjs";

export function build(g) {
  // Standing level: barrels on the floor row y3. The stove at x86 z15 is the chimney part's hearth_nook (already built).
  layers(g, [86, 3, 15], {
    "B": ["barrel", { facing: "up" }],
  }, [
    "    ",     // z15: stove at x86 is the chimney part's; lane clear at x87..89 apart from the table (below)
    "B  B",     // z16: barrel x86 and x89; x87..88 open
  ]);

  // Table: fence legs at x88 and x89 (z15), spruce slab tops at y4 (top half): surface at y5.
  table_set(g, 88, 3, 15, 2);

  // Table lamp: a standing lantern on the table top (cell y5 sits on the slab's top face).
  layers(g, [88, 5, 15], {
    "L": ["lantern", { hanging: "false" }],
  }, [
    ["L "],
  ]);
}
