// 1816 R St NW (Store-Misc), Dupont Circle: a 3-storey brick commercial block with a shopfront, stone bands and a
// cornice, its rear wing stepping down. Ground is flat (lidar ground 0 everywhere), so no foundation fill.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC75561.cells.json`, "utf8"));

const foot = new Set();
const roofAt = new Map();
for (const [x, z, , roof] of cells) { foot.add(`${x},${z}`); roofAt.set(`${x},${z}`, roof); }
const inFoot = (x, z) => foot.has(`${x},${z}`);
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// Rows per cell: y0 plinth, then window rows (odd y) over solid bands/floor slabs (even y), capped at the top row T.
// The main body is one flat tier at 7 blocks (lidar 6/7 is noise); the rear rows keep their lidar step (6, then 4).
const topRow = (x, z) => (z <= 5 ? 7 : roofAt.get(`${x},${z}`)) - 1;

const g = new Voxels([9, 19, 9]);

for (const key of foot) {
  const [x, z] = key.split(",").map(Number);
  const T = topRow(x, z);
  const normals = DIRS.filter(([dx, dz]) => !inFoot(x + dx, z + dz));
  const perim = normals.length > 0;

  for (let y = 0; y <= T; y++) {
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }                  // plinth course
    if (y === T) {                                                              // roof deck / cornice
      if (!perim) g.set(x, y, z, "stone");
      else g.set(x, y, z, (x + z) % 2 ? "stone_bricks" : "smooth_stone");      // dentil rhythm
      continue;
    }
    if (y % 2 === 0) {                                                          // storey band = floor slab
      g.set(x, y, z, !perim ? "smooth_stone" : y === 4 ? "smooth_stone" : "bricks"); // stone string course at 2nd floor
      continue;
    }
    if (!perim) continue;                                                       // interior air behind the glass
    if (normals.length > 1) { g.set(x, y, z, "stone_bricks"); continue; }      // quoins at corners
    const [dx] = normals[0];
    const u = dx !== 0 ? z : x;                                                 // position along the face
    if (u % 4 === 0) { g.set(x, y, z, y === 1 ? "stone_bricks" : "bricks"); continue; } // brick piers
    const pane = dx !== 0
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
    g.set(x, y, z, "glass_pane", pane);
  }
}

// Shopfront door in the middle of the front (z 0) at ground level
g.set(4, 1, 0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(4, 2, 0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// Warm lights behind the glass (air gap cells inside the front and the 2nd floor)
g.set(2, 1, 1, "glowstone");
g.set(6, 3, 1, "glowstone");
g.set(2, 5, 1, "lantern", { hanging: "false", waterlogged: "false" });

// Roof equipment: a small stone plant box on the roof deck
g.set(2, 7, 2, "stone_bricks"); g.set(3, 7, 2, "stone_bricks");
g.set(2, 7, 3, "stone_bricks"); g.set(3, 7, 3, "stone_bricks");
g.set(2, 8, 2, "smooth_stone"); g.set(3, 8, 2, "smooth_stone");
g.set(2, 8, 3, "smooth_stone"); g.set(3, 8, 3, "smooth_stone");

const out = g.save(`${DIR}/DC75561.nbt`);
console.log(JSON.stringify(out));
