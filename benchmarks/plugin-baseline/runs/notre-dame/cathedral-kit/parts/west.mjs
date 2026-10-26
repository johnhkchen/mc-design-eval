// Part 3: west front. The three deep portals, the Gallery of Kings, the west rose frame, the tower lancet pairs of the
// rose stage, the belfry lancets, the Grande Galerie colonnade, the rose-stage balustrade and the facade buttresses'
// set-offs. Everything writes only into air (the shell's reserved cells); the glass of the lancets is placed here,
// the rose glass is left open for P6.
import {
  portal, kingNiche, roseWindow, colonnade, balustrade, setoffButtress, lancetOpening,
  BLUE_GLASS_PANE,
} from "../vocab.mjs";

// A portal's void, carved open. The vocab portal() fills the splay with chiseled_sandstone from y0+3 (its tympanum
// fill), which makes a solid wall, so the void is cleared again here, in this part's own cells: the same outline
// (pointed, grown rings - 1 - d per depth d), from the first air row above the lintel.
function openPortal(g, z, w, h, y0, rings = 4) {
  const hw = Math.floor(w / 2);
  const springY = y0 + h - 1 - hw;
  const inside = (u, y, e) => y >= y0 && y <= y0 + h - 1 + e && Math.abs(u) <= hw + e - Math.max(0, y - springY - e);
  for (let d = 0; d <= rings; d++) {
    const e = Math.max(0, rings - 1 - d);
    for (let u = -(hw + e); u <= hw + e; u++) for (let y = y0 + 3; y <= y0 + h - 1 + e; y++) {
      if (!inside(u, y, e)) continue;
      if (g.blockAt(2 + d, y, z + u) === "minecraft:chiseled_sandstone") g.set(2 + d, y, z + u, "minecraft:air");
    }
  }
}

export function build(g) {
  // Portals on the west plane x 2: the parvis floor is the rock top (y 3), so the doorways start at y 4.
  // Centre z 37 (y 4..22, 11 wide), north (St Anne/Virgin) z 17 and south z 57 (y 4..19).
  portal(g, 2, 37, 11, 19, "west", { y0: 4 });
  openPortal(g, 37, 11, 19, 4);
  portal(g, 2, 17, 9, 16, "west", { y0: 4 });
  openPortal(g, 17, 9, 16, 4);
  portal(g, 2, 57, 9, 16, "west", { y0: 4 });
  openPortal(g, 57, 9, 16, 4);

  // Gallery of Kings: 28 niches, every 2 blocks from z 10 to z 64, feet at y 32.
  for (let z = 10; z <= 64; z += 2) kingNiche(g, 2, 32, z, "west");

  // West rose: centre (x 3, y 49, z 37), radius 7, glass left open for the glazier.
  roseWindow(g, [3, 49, 37], "west", 7, false);

  // Tower lancet pairs of the rose stage (3 wide, y 42..56), centres z 11, 23 (north) and 51, 63 (south).
  for (const z of [11, 23, 51, 63]) lancetOpening(g, 2, 42, z, "west", 3, 15, BLUE_GLASS_PANE);

  // Grande Galerie: colonnettes along the front, every 2 blocks, y 60..65.
  colonnade(g, [2, 9, 2, 65], 60, 65, 2, { facing: "west" });

  // Balustrade of the Virgin's gallery across the front at y 39.
  balustrade(g, [2, 7, 2, 67], 39);

  // Top balustrade of the central terrace over the Grande Galerie, y 66.
  balustrade(g, [2, 28, 2, 46], 66);

  // Facade buttresses: set-offs (stairs) every 8 blocks above the plinth.
  for (const z0 of [7, 25, 47, 65]) {
    setoffButtress(g, [0, 3, z0, 1, 92, z0 + 2], "west", [11, 19, 27, 35, 43, 51, 59, 67, 75, 83, 91]);
  }

  // Belfry lancets (4 wide, y 71..91): two per tower face, west face first.
  for (const z of [10, 23, 50, 63]) lancetOpening(g, 0, 71, z, "west", 4, 21, BLUE_GLASS_PANE);
  // North and south faces of the two towers, x 5 and 16 (centres of x 4..7 and 15..18).
  for (const x of [5, 16]) {
    lancetOpening(g, x, 71, 7, "north", 4, 21, BLUE_GLASS_PANE);
    lancetOpening(g, x, 71, 27, "south", 4, 21, BLUE_GLASS_PANE);
    lancetOpening(g, x, 71, 47, "north", 4, 21, BLUE_GLASS_PANE);
    lancetOpening(g, x, 71, 67, "south", 4, 21, BLUE_GLASS_PANE);
  }
}
