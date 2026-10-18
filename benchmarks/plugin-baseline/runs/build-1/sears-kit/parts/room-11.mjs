// Room "P1 dining room" (interior designer's part): a 3 x 3 dining room, x 26..28, z 14..16, feet at y 2.
// Intended furnishing: a table at the centre (27,15) under a hanging lantern, one chair on the north side (27,14), a barrel
// sideboard with a flower pot in the north-east corner (28,14), and the south side kept open for the doorways.
// Nothing is placed yet: shell-west carves the whole P1 interior to air and runParts locks those cells, so every write
// here was refused (parts-report.json, REFUSED 6). Furnish once room parts may write into the interior air they are given.
export function build(g) {
  // the one hanging lantern over the table's cell, from the ceiling block at y5 (oak_planks over the whole room).
  // Refused today: shell-west locks the interior air, so runParts refuses this write (parts-report REFUSED 1). In a
  // scratch copy with the lantern placed the room reads min 11, 0 dark, 0 dim, so the spot is right once room parts may write.
  g.set(27, 4, 15, "lantern", { hanging: "true", waterlogged: "false" });
}
