// Room "P0 east bedroom" (interior designer's part): box x 11..12, y 6..8, z 14..20 (2 wide, 7 deep).
// Intended furniture: two white beds (bed A foot x 12 z 14, head on the partition x 10; bed B foot x 12 z 19, head
// on the south wall z 20), and a dresser of two barrels on the east wall (z 16..17) with a lantern and a potted poppy.
// Needs the partition x 10 solid except the doorway (see plan.md Notes): the beds' heads stand against it.
// Not built: shell west (plots 0-3) sets every cell of this room to air, and runParts locks those cells, so each
// write here was refused (air included). The furniture waits for the shell to leave the room's cells unclaimed.

export function build(g) {
  // one hanging lantern from the ceiling beam (11,9,16) lifts every floor cell of the room to 8+ (mcd room); no barrel
  // is built yet to stand one on, so a second lamp is not needed. Air only: a cell an earlier part claimed is refused.
  g.set(11, 8, 16, "lantern", { hanging: "true" });
  return {};
}
