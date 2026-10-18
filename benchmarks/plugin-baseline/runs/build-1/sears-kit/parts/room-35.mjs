// Room "P4 upper hall" (interior designer's part): the 1-wide upstairs hall x72, z14..20, feet y6, ceiling y9.
// It is a lane, not a room: every cell of its floor stays clear (the way from the stair top at (68,5,18) and the doorways
// in the partitions runs along it), so the furniture hangs from the ceiling. Hanging lanterns sit under the ceiling
// line at y8, clear of the 2-high walking path (y6..7), and light the hall to 8+ at every foot cell.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // hanging lanterns down the centre line, under the ceiling, one at each third of the hall
  for (const z of [15, 19]) {
    g.set(72, 9, z, "spruce_planks");   // the ceiling beam the lantern hangs from
    g.set(72, 8, z, ...B.lantern(true));
  }
}
