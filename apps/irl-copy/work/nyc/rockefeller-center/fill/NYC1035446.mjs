// 22 East 49th Street (1930, commercial and office): a seven-storey brick block on a granite plinth, stone
// string courses at each floor line, a stone cornice and parapet, a shopfront at street level and a stair bulkhead
// on the roof. Built from the lidar cells: the main roof is the common nonzero height; zero returns (a lidar gap)
// take that height; a cell higher than the main roof is roof equipment.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1035446.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 3, Z = 17, Y = 36;

// Main roof: the most common nonzero lidar roof.
const counts = new Map();
for (const [, , , r] of cells) if (r) counts.set(r, (counts.get(r) ?? 0) + 1);
const main = [...counts].sort((a, b) => b[1] - a[1])[0][0];

const at = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof: roof || main }]));

const FLOORS = new Set([0, 3, 6, 9, 12, 15, 18]);   // storey lines; y 0 is the plinth
const LIGHTS = [[1, 5], [1, 11], [4, 2], [4, 14], [7, 5], [7, 11], [10, 1], [10, 8], [13, 4], [13, 13], [16, 2], [16, 8], [16, 14]];  // [y, z], glowstone behind the glass at x=1

const g = new Voxels([X, Y, Z]);

const paneStates = (z) => (z === 0 || z === Z - 1
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }   // end faces run east-west
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }); // long faces run north-south

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const { ground, roof } = at.get(`${x},${z}`);
  const perim = x === 0 || x === X - 1 || z === 0 || z === Z - 1;
  const endFace = z === 0 || z === Z - 1;
  const pierCol = endFace ? x !== 1 : z % 3 === 0;   // corners on the ends; mullions every third block on the long faces

  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");   // foundation under a sloping ground (none here)

  for (let y = ground; y < roof; y++) {
    const gf = y === 1 || y === 2;
    let b = null, st;
    if (y === main - 1) b = perim ? "polished_andesite" : "stone";   // cornice over the walls, roof deck inside
    else if (y >= main) b = y < roof - 1 ? "stone_bricks" : "polished_andesite";   // roof equipment above the main roof
    else if (FLOORS.has(y)) b = perim ? (y === 0 ? "polished_granite" : "stone_bricks") : "smooth_stone";
    else if (y === 19) b = perim ? "bricks" : null;   // top storey: solid band under the cornice
    else if (perim) {
      if (pierCol) b = gf ? "polished_granite" : "bricks";
      else { b = "glass_pane"; st = paneStates(z); }
    }
    if (b) g.set(x, y, z, b, st);
  }
  if (perim && roof === main) g.set(x, main, z, "stone_bricks");   // parapet
}

// Entrance on the north end: an iron door in the middle of the granite front.
g.set(1, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(1, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// Shop light at street level, and warm lit offices behind some of the glass.
g.set(1, 1, 5, "glowstone"); g.set(1, 1, 11, "glowstone");
for (const [y, z] of LIGHTS) g.set(1, y, z, "glowstone");

const out = g.save(`${dir}/NYC1035446.nbt`);
console.log(JSON.stringify({ main, ...out }));
