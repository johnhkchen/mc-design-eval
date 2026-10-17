// Part: room: owner stair hall (interior). The flight x86 z14->10 is built and locked; this furnishes only the air
// cells round it (the box is one column wide, so the hall is the stair well). A coat rack at the north end where the
// hall meets the parlor opening, and a lantern hung from the stair's stringer so the climb is lit.
// Palette-only: no banner (not in palette.json), so the coat rack is a fence post with a lantern standing on it.

export function build(g) {
  // Coat rack: a spruce fence post on the floor, a standing lantern on its top (the hook and the light)
  g.set(86, 2, 10, "minecraft:spruce_fence");
  g.set(86, 3, 10, "minecraft:lantern", { hanging: "false", waterlogged: "false" });

  // Lantern hanging from the stair's top stringer at the north end (stringer at 86,5,10 is a block above it)
  g.set(86, 4, 10, "minecraft:lantern", { hanging: "true", waterlogged: "false" });
}
