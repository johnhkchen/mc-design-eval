// Room "P0 west bedroom" (interior designer's part): the inner air is x3..4, z14..20, floor layer y5, feet y6, head
// room to y8. The door (5, 6..7, 16) opens onto the cell (4, 6, 16), which stays clear. The west wall (x2) is solid
// only at z16..18 (windows at z14..15 and z19..20), so the two beds take the heads there (x3, against x2), feet at
// x4, at z17 and z18. The room is 2 wide: a bed row cuts it, so the south pocket (z19..20) is a barrel dresser, and
// the north end (z14..15) is the walk-in: a barrel dresser under the north window and a lamp post.
//
// Nothing is placed here yet. Part "shell west" fills the whole interior (x3..4 z14..20, y2..top) with air, and
// runParts locks every cell an earlier part wrote, air included, so each cell of this room is refused. The intended
// layout is kept below for when the shell leaves these cells unowned (shell-west.mjs owns that fix, not this part).
//
// Intended feet layer y6 (rows z14..20, columns x3..4):
//   z14 barrel barrel | z15 oak_fence . | z16 . . (door lane) | z17 red bed foot x4, head x3 | z18 blue bed (same)
//   z19 barrel barrel | z20 barrel barrel
// Intended head layer y7: potted_poppy + lantern (not hanging) on the north dresser at z14, lantern on the post at z15,
// lantern on the south dresser at z19.
// Lamplighter: two standing lanterns, on the fence post at z15 and the south barrel at z19. On the scratch copy of this
// layout the 14 feet cells read min 12 (no dim or dark cell); the third lantern on the north dresser at z14 is not needed.
// Each lantern goes only where its support was placed above it, into air, so with no furniture in the build neither is
// written (and nothing hangs over air).
export function build(g) {
  const lampOn = (x, z) => {
    if (g.blockAt(x, 6, z) !== "minecraft:air" && g.isAir(x, 7, z)) g.set(x, 7, z, "lantern", { hanging: "false", waterlogged: "false" });
  };
  lampOn(3, 15);
  lampOn(3, 19);
}
