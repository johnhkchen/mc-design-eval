// ROOM: sewing room (plan.md ROOMS, box [11,9,8,13,11,9]): a tiny room over the porch. Sewing table under the front
// window with a chair facing it, a potted plant pair by the window, a fabric barrel, a red rug at the entry, and one
// hanging lantern over the table. Air only: every cell is written only where the shell left air.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hangLamp } from "../vocab.mjs";

const AIR = ["minecraft:air", "minecraft:cave_air"];
// Writes into air only; a cell an earlier part owns is skipped, never overwritten.
const put = (g, x, y, z, block, state) => {
  if (!AIR.includes(g.blockAt(x, y, z))) return false;
  g.set(x, y, z, block, state);
  return true;
};

export function build(g) {
  // Floor y9 (spruce_planks at y8 from the shell), ceiling y12 (birch_planks). Entry (12,9..10,10) from the upper hall.
  // Front window (12,9..11,7). Layout by row, z8 (front) then z9 (entry row):
  //   z8: potted fern | sewing table under the window | chair (stairs facing the table)
  //   z9: potted red tulip | red rug at the entry | fabric barrel
  put(g, 11, 9, 8, "potted_fern", {});
  put(g, 12, 9, 8, "crafting_table", {});
  put(g, 13, 9, 8, ...B.stairs("spruce", "west", "bottom"));
  put(g, 11, 9, 9, "potted_red_tulip", {});
  put(g, 12, 9, 9, "red_carpet", {});
  put(g, 13, 9, 9, "barrel", { facing: "up", open: "false" });

  // Lantern hangs over the sewing table; the ceiling at y12 is directly above it (hangLamp checks).
  hangLamp(g, 12, 11, 8, { drop: 1 });
}
