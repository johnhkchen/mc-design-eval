// DC68312: a vacant c.1890 Renaissance-Revival commercial block in red brick with limestone trim (NW Washington).
// Stepped massing from the lidar roof record: a 7-block core, 6-block shoulders, 4-block wings. Every footprint
// cell is a solid column from y 0 up to its roof, so nothing floats; each window sits in the facade shell with a
// one-cell air gap behind it, and calcite floor slabs run at y 3 and under every cornice.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC68312.cells.json", "utf8"));
const key = (x, z) => `${x},${z}`;
// the lidar's 3 at (2,5) is a noise dip among 4-6 neighbours: smoothed up to the 4 of its wing
const roof = new Map(cells.map(([x, z, ground, r]) => [key(x, z), { ground, r: Math.max(r, 4) }]));
const inF = (x, z) => roof.has(key(x, z));
const rAt = (x, z) => roof.get(key(x, z)).r;
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DOOR = [4, 5];                                  // the entrance on the south (Mall-facing) front, under the 6-block shoulder

const g = new Voxels([10, 19, 6]);
const gaps = new Map();                               // air cells behind a window or door: "air", or a warm light

for (const [k, { r }] of roof) {
  const [x, z] = k.split(",").map(Number);
  const out = DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));  // outward faces onto the street or open ground
  const perim = out.length > 0;
  const corner = out.some(([dx]) => dx) && out.some(([, dz]) => dz);
  const step = DIRS.some(([dx, dz]) => inF(x + dx, z + dz) && rAt(x + dx, z + dz) < r);  // a lower tier beside it
  const face = perim && !corner ? out[0] : null;
  const index = face ? (face[0] ? z : x) : 0;         // position along the wall: x on a north/south face, z on east/west

  for (let y = 0; y < r; y++) {
    let b = "bricks", s = null;
    if (y === 0) b = "stone_bricks";                   // plinth course
    else if (y === r - 1) b = perim || step ? "bricks" : "gray_concrete";    // brick parapet, else tar roof
    else if (y === 3) b = "calcite";                   // floor slab + string course
    else if (y === r - 2 && perim && r >= 7) b = "calcite";   // limestone cornice band under the parapet (7-block tiers only, so 6-block tiers keep their window row)
    else if (perim) {
      if (x === DOOR[0] && z === DOOR[1] && (y === 1 || y === 2)) {
        b = "dark_oak_door";
        s = { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
        gaps.set(key(x, z - 1) + "," + y, "air");     // the vestibule behind the door
      } else if (corner || index % 4 === 0 || index % 4 === 3) b = "bricks";   // brick piers and corners between the window pairs
      else {
        const ground = y <= 2;
        const inward = [x - face[0], y, z - face[1]];
        if (ground && (x + z) % 3 === 0) b = "oak_planks";          // boarded up: the building is vacant
        else if (!ground && (2 * x + z) % 7 === 0) b = "air";       // a broken pane
        else {
          b = "glass_pane";
          s = face[0]
            ? { east: "false", north: "true", south: "true", west: "false", waterlogged: "false" }
            : { east: "true", north: "false", south: "false", west: "true", waterlogged: "false" };
        }
        if (inF(inward[0], inward[2])) {
          const warm = ground && y === 1 && (x + 2 * z) % 5 === 1 && b === "glass_pane";
          gaps.set(key(inward[0], inward[2]) + "," + y, warm ? "glowstone" : "air");
        }
      }
    }
    g.set(x, y, z, b, s);
  }
}

// carve the air gaps behind the glass (and the vestibule), never a facade cell
for (const [k, b] of gaps) {
  const [x, z, y] = k.split(",").map(Number);
  const perim = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dz]) => !inF(x + dx, z + dz));
  if (perim) continue;
  if (b === "air") g.set(x, y, z, "air");
  else g.set(x, y, z, b);
}

// roof plant: a brick flue on the core, and two light-grey condenser boxes on the tower roof
for (const y of [7, 8]) g.set(6, y, 2, "bricks");
g.set(6, 9, 2, "stone_brick_slab", { type: "top", waterlogged: "false" });
for (const x of [6, 7]) g.set(x, 7, 4, "light_gray_concrete");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC68312.nbt";
console.log(g.save(out));
