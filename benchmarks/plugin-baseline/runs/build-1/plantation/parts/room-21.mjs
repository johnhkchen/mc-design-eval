// Part: room: east upper corridor and wing passage (room 21, upper floor y11..16, box x52..68 z51..60).
// Upstairs passage from the hall (west door x51 z51..52) east to the master bedroom and master bath doors (z50),
// the wing passage (x52..53 z53..60, opening z61) and the bedroom 5 and bath doors (z53 / x54 z57).
// Lanes kept clear: z52 is the through lane (carpeted), z51 x52..55 and x66..67 are the door first cells.
// Furniture stands on the north wall (z51) between x56 and x68: a linen run of barrels and chests, a console
// (dark oak fences with a top slab) carrying a potted plant and a standing lantern. Hanging lanterns down the lane
// and in the wing passage. Chimney cells x61..62 z56..57 are left alone (roof part).
//
// Built nothing yet: the shell (parts/shell.mjs) carves every interior cell of the upper floor to air, and runParts
// locks air like any block, so each furniture, carpet and lantern write here was refused (32 of 32). The layout above
// needs the shell to leave these air cells unclaimed, or a part given { carve: true } to lay them.

// Lamplighter: 14 lanterns, all hung under the upper plate (y16) except two standing lanterns (y11) in the east
// bath corner and the wing passage. Probed on a copy: every floor cell at 0 dark, min 7, two cells at 7. No lantern
// stands on the z52 through lane (a standing one there cuts the lane once the z51 furniture line is in).
const LANTERNS_STANDING = [[63, 55], [53, 58]]; // x, z at y11
const LANTERNS_HANGING = [
  [57, 57], [65, 57], [60, 59], [56, 59], [67, 52], [67, 59], [63, 52],
  [58, 60], [56, 52], [53, 52], [60, 52], [56, 55],
]; // x, z at y16

export function build(g) {
  for (const [x, z] of LANTERNS_STANDING) g.set(x, 11, z, "lantern", { hanging: "false" });
  for (const [x, z] of LANTERNS_HANGING) g.set(x, 16, z, "lantern", { hanging: "true" });
  return { placed: "none (shell-owned air)" };
}
