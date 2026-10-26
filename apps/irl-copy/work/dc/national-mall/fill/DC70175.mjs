// DC70175: a three-storey Federal-style office block (Indiana limestone on a granite plinth, a
// smooth-stone string course at each floor line, a parapet roof) on the 13 x 9 footprint. Roof is
// one flat tier at 11 blocks (the lidar's 10/11 is noise). The one-cell bump at (2,8) is a glass
// stair tower; the front (z=0) carries the centred entrance.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70175.cells.json", "utf8"));
const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFp = (x, z) => fp.has(`${x},${z}`);
const ROOF = 11;                                  // flat roof tier; lidar 10/11 is noise
const STRING = [3, 6, 9];                         // storey lines (smooth stone)
const WINDOW_ROWS = { 1: 0, 2: 0, 4: 1, 5: 1, 7: 2, 8: 2 };   // window rows -> floor index
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const g = new Voxels([13, 23, 9]);

for (const [x, z, ground] of cells) {
  const perim = !inFp(x, z - 1) || !inFp(x, z + 1) || !inFp(x - 1, z) || !inFp(x + 1, z);
  // the bump (z = 8) is a stair tower: glass in the window rows, stone elsewhere
  const bump = z === 8;
  const face = bump ? "bump" : z === 0 ? "front" : z === 7 ? "back" : x === 0 ? "west" : x === 12 ? "east" : null;
  for (let y = ground; y < ROOF; y++) {
    if (!perim) {
      // interior: floor slabs at 0, 3, 6, 9 and the roof deck at 10; air between (the gap behind the glass)
      if (y === 0 || STRING.includes(y)) g.set(x, y, z, "smooth_stone");
      else if (y === 10) g.set(x, y, z, "stone");
      continue;
    }
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }   // plinth
    if (STRING.includes(y)) { g.set(x, y, z, "smooth_stone"); continue; } // string courses
    if (y === 10) { g.set(x, y, z, "calcite"); continue; }           // parapet
    if (!(y in WINDOW_ROWS)) continue;
    if (bump) { g.set(x, y, z, "glass_pane", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" }); continue; }
    if (face === "front" && x === 6 && y <= 2) {         // centred entrance
      g.set(x, y, z, "iron_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    let win;
    if (face === "front") win = [1, 2, 4, 5, 7, 8, 10, 11].includes(x);
    else if (face === "back") win = [4, 5, 7, 8, 10, 11].includes(x);
    else win = [1, 2, 4, 5].includes(z);                 // the flanks (x = 0 / 12), z is the bay coordinate
    if (win) g.set(x, y, z, "glass_pane", face === "front" || face === "back" ? PANE_EW : PANE_NS);
    else g.set(x, y, z, "calcite");                       // pier between bays
  }
}

// the stair tower's top: a lantern on the parapet
g.set(2, ROOF, 8, "lantern", { hanging: "false", waterlogged: "false" });

// roof equipment: two plant boxes and a lightning rod, all standing on the roof deck
for (const [x, z] of [[2, 2], [3, 2], [2, 3], [3, 3], [9, 5], [10, 5]]) g.set(x, ROOF, z, "smooth_stone");
g.set(6, ROOF, 4, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// warm light behind the glass: glowstone on the ground floor, shroomlight upstairs, lanterns hung from the slabs
for (const [x, y, z] of [[2, 1, 1], [8, 1, 1], [11, 1, 1], [1, 1, 2], [5, 4, 1], [8, 4, 1]]) {
  g.set(x, y, z, x === 5 || x === 8 && y === 4 ? "shroomlight" : "glowstone");
}
g.set(3, 5, 3, "lantern", { hanging: "true", waterlogged: "false" });
g.set(6, 8, 4, "lantern", { hanging: "true", waterlogged: "false" });

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70175.nbt");
console.log(out);
