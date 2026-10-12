// Part "Openings and signs" (parts/fittings.mjs): storefront glazing, entrance and rear doors, slot window, awning,
// MART lettering, service logo panel, canopy brand roundel. Builds only into the air the shell left open.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { storefront_bay, glass_double_door, slot_window, awning, mart_letters, logo_panel, brand_roundel } from "../vocab.mjs";

export function build(g) {
  // Shop north face (z=24): glass bays either side of the main double door (x16..17, y1..2), transom glass above it.
  glass_double_door(g, 16, 24, "north");
  storefront_bay(g, 11, 22, 24, { mullions: [13, 20], open: [[16, 17]] });
  storefront_bay(g, 16, 17, 24, { mullions: [], open: [] }); // transom y3..4 over the door (door cells are not air now)

  // Service block north face: recessed slot window (glass at z25, frames at x27 and x29 come from the shell).
  slot_window(g, 28, 24);

  // Shop west window band (plan OPENINGS: x=9, z26..31, y2..4): the shell leaves it air, so the glazier fills it here.
  // Panes run along z, so they join north and south (the white corner piers at z25 and z32).
  for (let z = 26; z <= 31; z++) for (let y = 2; y <= 4; y++)
    g.set(9, y, z, "light_blue_stained_glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

  // Storefront cantilever (2 deep, z22..23) and the MART letters standing on the red fascia. The roof keeps its cornice
  // off the awning cells (roof.json keep), so the back row is not lost to it.
  awning(g, 10, 23);
  mart_letters(g, 12, 6, 23);

  // Service logo panel on the grey block, and the canopy brand roundel on the north fascia.
  logo_panel(g, 25, 4, 23);
  brand_roundel(g, 20, 8, 8);

  // Rear and side doors: service east door (x=32, z31) faces east; delivery door (x=29, z33) faces south.
  for (const [x, z, facing] of [[32, 31, "east"], [29, 33, "south"]]) {
    g.set(x, 1, z, ...B.door("iron", facing, "lower", "left"));
    g.set(x, 2, z, ...B.door("iron", facing, "upper", "left"));
  }
}
