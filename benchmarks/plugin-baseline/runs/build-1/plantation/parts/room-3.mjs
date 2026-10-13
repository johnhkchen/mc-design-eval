// Part: room: dining room (interior furnisher, East front formal dining). Inner air box [52,4,43,68,9,49], floor y4.
// Long table on the centre line z44 (fence legs, top slab, x56..66) with five chairs each side (z43 north, z45 south);
// a barrel sideboard on the east wall; three hanging lanterns on iron_chain over the table. Lanes: z46..47 from the hall
// door (x51) and z48..49 both stay clear; the chimney at x61..62 z46..47 is the shell's brick stack.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { porchLantern } from "../vocab.mjs";

export function build(g) {
  // table: fence legs on the centre line z44, a top slab on them (top half of y5, sitting on the fence tops)
  for (const x of [56, 58, 60, 62, 64, 66]) g.set(x, 4, 44, ...B.fence("dark_oak"));
  for (let x = 56; x <= 66; x++) g.set(x, 5, 44, ...B.slab("dark_oak", "top"));

  // chairs: north side (z43, back to the north wall, seat facing the table) and south side (z45, back to the south)
  for (const x of [57, 59, 61, 63, 65]) {
    g.set(x, 4, 43, ...B.stairs("dark_oak", "north", "bottom"));
    g.set(x, 4, 45, ...B.stairs("dark_oak", "south", "bottom"));
  }

  // sideboard: two barrels on the east wall, north end (clear of the lanes)
  g.set(68, 4, 43, "barrel", { facing: "up", open: "false" });
  g.set(68, 4, 44, "barrel", { facing: "up", open: "false" });

  // hanging lanterns on iron_chain under the upper floor (y10), over the table
  for (const x of [58, 62, 66]) porchLantern(g, x, 9, 44);

  // floor lanterns against the north and west walls, on the cells between the chairs (clear of the z46..49 lanes)
  for (const [x, z] of [[52, 44], [56, 43], [58, 43], [62, 43], [64, 43], [67, 43]]) g.set(x, 4, z, ...B.lantern(false));
}
