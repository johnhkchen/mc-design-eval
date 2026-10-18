// Room "P1 north-east bedroom" (interior designer's part): builds nothing for now. shell west writes every cell of this
// room at y6..8 (air included), and runParts refuses any write into an earlier part's cells, so no furniture can land
// here. The plan, for when the shell leaves the interior unowned: a red bed with its head on the east wall (foot
// (27,6,14) facing east, head (28,6,14)); a chest at (26,6,14) facing south with a lit candle on it at (26,7,14); a
// barrel nightstand at (28,6,15) with a standing lantern on it at (28,7,15); a potted poppy on the floor at (28,6,16) by
// the east window. The door lane (x26..28, z15) and the two cells over the bed stay clear.
export function build(g) {
  // Lamplighter: the ceiling at y9 is still air (no roof.json yet, so the roof part is skipped), so the hanging lantern
  // is not free. The barrel the designer planned is not built either, so the standing lantern goes on the floor block
  // (oak_planks, y5) in the south-west corner, off the designer's bed, chest, poppy and door lane.
  g.set(26, 6, 16, "lantern", { hanging: "false", waterlogged: "false" });
}
