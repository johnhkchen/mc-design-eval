// Room: Home office (interior designer). Inner air x19..22, y1..4, z12..16; floor dark_oak_planks (laid by P1).
// Door (23,1..2,14) on the east wall; arched window (20..21,2..4,11) on the north wall. Focal piece: the desk under the
// window. Bookcases along the west wall, a leather-style chair (oak stairs) at the desk, a floor lantern by the chair,
// lanterns over the desk and chair. The window cells (20..21,2..4,12) and the door path (22,1..2,14) stay clear.
import { B } from "../vocab.mjs";

export function build(g) {
  // west wall bookcases: solid dark oak body (x19, z12..13 and z15..16), flower pots on top
  g.fill([19, 1, 12], [19, 3, 13], "dark_oak_planks");
  g.fill([19, 1, 15], [19, 3, 16], "dark_oak_planks");
  g.set(19, 4, 12, "flower_pot");
  g.set(19, 4, 16, "flower_pot");

  // desk: 2x2 pedestal of dark oak planks under a closed dark oak trapdoor top (no dark oak slab in the palette)
  for (const x of [20, 21]) for (const z of [13, 14]) {
    g.set(x, 1, z, "dark_oak_planks");
    g.set(x, 2, z, ...B.trapdoor("dark_oak", "north", "top", false));
  }
  g.set(21, 3, 13, ...B.lantern(false));       // desk lamp, standing on the desk top

  // chair: oak stairs facing the desk (north), back to the south
  g.set(20, 1, 15, ...B.stairs("oak", "north", "bottom"));

  // floor lamp by the door path, and a hanging lantern over the chair
  g.set(22, 1, 12, ...B.lantern(false));
  g.set(20, 4, 15, ...B.lantern(true));
}
