// NYC1034353, 1192 Avenue of the Americas (1930): a four-storey Deco block, limestone over granite, a flat roof
// deck with a parapet, and a few roof-level plant boxes where the lidar stands a block proud.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034353.cells.json`, "utf8"));

const FOUND = "polished_granite", WALL = "smooth_quartz", PIER = "quartz_pillar", BAND = "polished_andesite";
const GLASS = "light_blue_stained_glass_pane", PLANT = "stone_bricks", GILT = "gold_block";
const FLOORS = [3, 6, 9];   // storey lines; the roof deck at 12 closes the fourth storey
const DECK = 12;

// Lidar roof height: 4 is the one-storey corner wing, 14 the five spots a block proud (plant), everything else one tier at 13
const tier = (roof) => (roof <= 5 ? 4 : roof >= 14 ? 14 : 13);

const g = new Voxels([6, 26, 19]);

for (const [x, z, ground, roof] of cells) {
  const T = tier(roof);
  const top = T === 4 ? 3 : DECK;
  for (let y = 0; y <= ground; y++) g.set(x, y, z, FOUND);                  // foundation and base course under every cell
  for (let y = ground + 1; y <= top; y++) {
    if (y === top || FLOORS.includes(y)) { g.set(x, y, z, BAND); continue; } // storey lines and roof deck span the footprint
    const perim = x === 0 || x === 5 || z === 0 || z === 18;
    if (!perim) continue;                                                   // interior: air behind the glass
    const corner = (x === 0 || x === 5) && (z === 0 || z === 18);
    let pier = corner, win = false;
    if (!corner) {
      if (x === 0 || x === 5) { pier = z % 3 === 0; win = !pier; }         // street and east faces: piers every 3
      else if (z === 0) { pier = x === 1 || x === 4; win = !pier; }         // north end: windows at x 2, 3
      else { pier = x === 3; win = x === 1 || x === 2; }                    // south end: x 4 is blind wall
    }
    if (pier) { g.set(x, y, z, PIER, { axis: "y" }); continue; }
    if (x === 0 && (z === 1 || z === 2) && y <= 2) {                        // entrance: a pair of bronze doors
      g.set(x, y, z, "iron_door", { facing: "west", half: y === 1 ? "lower" : "upper", hinge: z === 1 ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    if (win) {
      const pane = x === 0 || x === 5
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
      g.set(x, y, z, GLASS, pane);
      continue;
    }
    g.set(x, y, z, WALL);
  }
  if (T === 14) g.set(x, 13, z, PLANT);
}

for (const z of [1, 2]) g.set(0, 3, z, GILT);                                // gilt lintel over the doors
const lanterns = [[1, 2, 1], [1, 5, 4], [1, 8, 7], [1, 5, 13], [1, 8, 10], [1, 11, 16], [4, 8, 4], [4, 11, 10]];
for (const [x, y, z] of lanterns) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });

const { blocks, palette } = g.save(`${DIR}/NYC1034353.nbt`);
console.log(`NYC1034353.nbt: ${blocks} blocks, ${palette} palette entries`);
