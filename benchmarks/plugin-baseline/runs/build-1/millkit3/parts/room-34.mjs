// P5 hay loft: interior of the box x62..67, y7..11, z10..14 (floor y6 under it; ladder up at x62 z14, hay hole
// (64..65, 6, 12) under the aisle). The loft's hay stacks are Shell B's (hay_stack over x62..63 and x66..67, y7..8),
// and the roof's soffit and trusses fill the upper air at y9, so every cell this part used to write (the hay tops,
// the barrels at 66..67 z14, the lanterns on the stacks) is already built by an earlier part. Nothing is free here,
// so the part places no blocks. The loft's light needs a lantern in a free cell: a fitting or furnisher's job.
export function build(g) {
  return 0;
}
