// 1440 R St NW, Dupont-area walk-up: a 3-storey red-brick block with limestone bands and a deep-tile roof.
// Lidar roof: 7 blocks everywhere except a 6-block lower wing (x 5-6, z 1-7) and two single-cell noise readings
// at (4,9),(4,10), which are smoothed to 7. Walls are the exterior ring of the footprint; the interior is air
// (an air gap behind the glass) with a floor slab at y0 and y3, and a roof slab on top.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC68626.cells.json`, "utf8"));
const W = 8, D = 13;
const F = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const inF = (x, z) => F.has(`${x},${z}`);
const roof = (x, z) => (x >= 5 && x <= 6 && z >= 1 && z <= 7 ? 6 : 7);   // smoothed roof tiers
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));
const isDoor = (x, z) => x === 5 && z === 12;                               // the one-cell stub on the south side is the entrance
const windowBay = (x, z, face) => (face === "N" || face === "S" ? [1, 2, 4, 5].includes(x) : z % 3 !== 0);

const g = new Voxels([W, 19, D]);
const lamp = new Set();   // interior cells behind a lit window

for (const [key, { g: ground }] of F) {
  const [x, z] = key.split(",").map(Number);
  const h = roof(x, z), ex = exposed(x, z), ring = ex.length > 0;
  const face = ex.length === 1 ? ex[0] : null;
  for (let y = 0; y < h; y++) {
    if (y < ground) { g.set(x, y, z, "stone_bricks"); continue; }      // foundation under the ground
    if (y === h - 1) { g.set(x, y, z, ring ? "calcite" : "deepslate_tiles"); continue; }   // cornice / roof
    if (y === 0) { g.set(x, y, z, ring ? "stone_bricks" : "spruce_planks"); continue; }     // plinth / floor
    if (y === 3) { g.set(x, y, z, ring ? "calcite" : "spruce_planks"); continue; }          // string course / floor
    if (!ring) continue;                                                                    // air gap
    if (isDoor(x, z) && (y === 1 || y === 2)) {
      g.set(x, y, z, "oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (face && windowBay(x, z, face)) {
      const ew = face === "N" || face === "S";
      g.set(x, y, z, "glass_pane", { north: String(!ew), south: String(!ew), east: String(ew), west: String(ew), waterlogged: "false" });
      if ((y === 1 || y === 4) && (x * 7 + z * 3 + y) % 4 === 0) {          // warm light behind some glass
        const [dx, dz] = DIRS[face], ix = x - dx, iz = z - dz;
        if (inF(ix, iz) && exposed(ix, iz).length === 0) lamp.add(`${ix},${iz},${y}`);
      }
    } else {
      g.set(x, y, z, "bricks");                                              // pier
    }
  }
}
for (const k of lamp) { const [x, z, y] = k.split(",").map(Number); g.set(x, y, z, "glowstone"); }

const info = g.save(`${DIR}/DC68626.nbt`);
console.log(JSON.stringify(info));
