// Finishing: banners, lamps, doors, barrels, courtyard greenery, arrow slits on the gate towers.
import { P, B, tree, spiralSlits, hash } from "./shared.mjs";
import { GTOWERS } from "./gatehouse.mjs";
const door = (g, x, y, z, facing) => { g.set(x, y, z, ...B.door("spruce", facing, "lower")); g.set(x, y + 1, z, ...B.door("spruce", facing, "upper")); };
export function details(g, { level }) {
  if (level < 2) return;
  const lozenge = () => B.banner("light_blue", [["rhombus", "white"], ["border", "white"]], { facing: "north" });
  // Bavarian lozenge banners on the front curtain walls and the stair-turret flank
  for (const x of [26, 31, 36, 75, 80, 85]) g.set(x, 17, 7, ...lozenge());
  for (const x of [26, 31, 36, 75, 80, 85]) for (const y of [16, 17]) if (g.isAir(x, y, 7)) { /* banner hangs from the wall face behind it */ }
  // lamp posts along the processional way in the lower court
  for (const z of [14, 19, 24]) for (const x of [52, 58]) { g.set(x, 11, z, ...B.wall("stone_brick")); g.set(x, 12, z, ...B.wall("stone_brick")); g.set(x, 13, z, ...B.lantern(false)); }
  // wall lanterns on the retaining wall balustrade
  for (let x = 26; x <= 86; x += 6) if (g.blockAt(x, 17, 28).includes("wall")) g.set(x, 18, 28, ...B.lantern(false));
  // barrels and hay by the west curtain wall (the castle's stores)
  for (const [x, z] of [[25, 12], [25, 13], [26, 12], [25, 20], [26, 21]]) g.set(x, 11, z, "barrel", { facing: "up", open: "false" });
  for (const [x, z] of [[27, 12], [26, 13], [25, 21]]) g.set(x, 11, z, "hay_block", { axis: "y" });
  for (const [x, z] of [[86, 12], [86, 13], [85, 12]]) g.set(x, 11, z, "barrel", { facing: "up", open: "false" });
  // azaleas in the lower court corners
  [[30, 15], [30, 24], [82, 15], [82, 24]].forEach(([x, z], i) => tree(g, [x, 11, z], "azalea", 1, i + 5));
  // doors: main tower onto the upper court, the balcony door on the Palas
  door(g, 51, 17, 36, "west");
  g.set(51, 19, 36, "smooth_sandstone");
  door(g, 74, 26, 31, "north");
  // arrow slits spiralling up the gate towers
  for (const [cx, cz] of GTOWERS) spiralSlits(g, cx, cz, 4, 15, 34, 3, 80);
}
