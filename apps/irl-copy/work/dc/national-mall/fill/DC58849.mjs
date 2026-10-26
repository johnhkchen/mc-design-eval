import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 920 R St NW (Dupont/Shaw): a 1910s-20s red-brick educational block with cream stone dressings.
// Lidar roofs are rounded to the nearest 3-block storey line (3 = one storey, 6 = two, 9 = three + cornice):
// a tower at the west end on a 6-high wing, stepping down to a 3-high east wing.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC58849.cells.json`, "utf8"));

const tierTop = (r) => (r >= 8 ? 9 : r >= 5 ? 6 : 3);
const top = new Map();
for (const [x, z, , r] of cells) top.set(`${x},${z}`, tierTop(r));
const inside = (x, z) => top.has(`${x},${z}`);
const T = (x, z) => top.get(`${x},${z}`) ?? 0;
// air beside (x, z) at height y: outside the footprint, or the neighbour's roof is at or below y
const open = (x, z, y) => !inside(x, z) || T(x, z) <= y;
const exposed = (x, z, y) => open(x - 1, z, y) || open(x + 1, z, y) || open(x, z - 1, y) || open(x, z + 1, y);
const zFaced = (x, z, y) => open(x, z - 1, y) || open(x, z + 1, y);   // the street/garden faces (north/south)

const g = new Voxels([7, 21, 3]);
const DOOR = [5, 0];      // entrance on the street face, ground floor
const LIGHTS = new Set(["1,1,1", "5,1,1", "1,4,1"]);   // lanterns / glowstone behind the glass

for (const [key, t] of top) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < t; y++) {
    const shell = exposed(x, z, y);
    if (y === t - 1) {                       // roof: cornice on the outside edge, a flat roof deck inside
      g.set(x, y, z, shell ? "smooth_quartz" : "smooth_stone");
      continue;
    }
    if (!shell) {                            // inside: air gap, with a floor slab at each storey line
      if (y === 0) g.set(x, y, z, "smooth_stone");
      else if (y % 3 === 0) g.set(x, y, z, "oak_planks");
      if (LIGHTS.has(`${x},${y},${z}`)) g.set(x, y, z, y % 3 === 1 && y > 1 ? "glowstone" : "lantern", { hanging: "false", waterlogged: "false" });
      continue;
    }
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }          // base course
    if (y % 3 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }    // string course at each storey line
    // storey rows: entrance, glass panes in bays, brick piers between
    if (z === DOOR[1] && x === DOOR[0] && (y === 1 || y === 2)) {
      g.set(x, y, z, "oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const pane = zFaced(x, z, y) ? x % 2 === 1 : z === 1;
    if (pane) {
      const st = zFaced(x, z, y)
        ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
        : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
      g.set(x, y, z, "glass_pane", st);
    } else {
      g.set(x, y, z, "bricks");
    }
  }
}

// roof plant on the low east wing
g.set(5, 3, 1, "iron_block");
g.set(3, 3, 2, "iron_block");

const r = g.save(`${DIR}/DC58849.nbt`);
console.log(`saved ${DIR}/DC58849.nbt: ${r.blocks} blocks, ${r.palette} palette entries`);
