// Room "P1 south-east bedroom" (interior designer's part): one bed with its head on the east wall (the window pair is
// at z18..19, so the head sits at z20, against solid wall). Interior air box [26,6,18,28,8,20]; the west (x25) and north
// (z17) openings stay clear as the lanes in.
// The chest, rug and bedside lantern were dropped: shell-west carves this whole box to air and locks those cells, so
// any furniture written here is refused. They belong in the shell (leave the interior unset) and need a re-run.
import { bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // the bed: foot at (27,6,20), head at (28,6,20) against the east wall x29
  bed(g, [27, 6, 20], "east", "red");
  // the lamp: a standing lantern on the oak floor (28,5,18) in the north-east corner, clear of the bed's foot lane (x26,
  // z20) and of the west and north doorways. Measured with mcd room in a scratch copy: min light 11, 0 dark. No ceiling
  // covers this room (at z19 the roof part leaves x19..28 air at y9, so the room is open above y8), so a hanging lantern has nothing to hang from.
  // Not yet in the build: shell-west locks this room's air, so the write is refused until that part leaves it unset.
  g.set(28, 6, 18, "lantern", { hanging: "false", waterlogged: "false" });
}
