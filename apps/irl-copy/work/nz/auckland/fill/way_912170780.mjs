// A 3-storey Edwardian brick commercial block on a slope: red brick walls, quartz string courses, cornice and parapet,
// glass sash windows on a 2-block grid, a dark-oak shopfront with a door on the street (west) face, a one-storey wing,
// a rooftop plant box. The shell is one block thick with air behind the glass and a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_912170780.cells.json`, "utf8"));

// lidar roof per cell: 0, 2 and 4 are the single-storey wing (edge noise on the west side), 12 is the 3-storey block
const foot = new Map();
for (const [x, z, g, roof] of cells) foot.set(`${x},${z}`, { g, R: roof <= 4 ? 4 : 12 });
const inF = (x, z) => foot.has(`${x},${z}`);
const FLOORS = [4, 8];                    // storey floor lines above y 0 (3 storeys of 4 blocks)
const glazed = (y, g) => (y > g && y <= Math.min(g + 2, 3)) || y === 6 || y === 7 || y === 9 || y === 10;

const v = new Voxels([7, 25, 11]);
const perimeter = new Set();
for (const [key] of foot) {
  const [x, z] = key.split(",").map(Number);
  if (!inF(x, z - 1) || !inF(x, z + 1) || !inF(x - 1, z) || !inF(x + 1, z)) perimeter.add(key);
}

for (const [key, { g, R }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const N = !inF(x, z - 1), S = !inF(x, z + 1), W = !inF(x - 1, z), E = !inF(x + 1, z);
  const per = perimeter.has(key);
  const corner = (W || E) && (N || S);
  const win = per && !corner && ((N || S) ? x % 2 === 1 : z % 2 === 1);

  for (let y = 0; y < g; y++) v.set(x, y, z, "polished_andesite");          // foundation under the slope
  v.set(x, g, z, per ? "polished_andesite" : "smooth_stone");               // base course / ground floor slab
  for (const F of FLOORS) if (F > g && F < R - 1) v.set(x, F, z, per ? "quartz_block" : "smooth_stone");
  for (let y = g + 1; per && y < R - 1; y++) {
    if (FLOORS.includes(y)) continue;
    let b = "bricks";
    if (win && glazed(y, g)) b = "glass_pane";
    else if (win && y === 5) b = "quartz_block";                           // sill under the 2nd storey window
    else if (win && y === 3 && g === 0) b = "quartz_block";                 // lintel over the ground floor window
    v.set(x, y, z, b);
  }
  v.set(x, R - 1, z, per ? "quartz_block" : "smooth_stone");                // roof slab; cornice on the face
  if (per) v.set(x, R, z, "quartz_block");                                  // parapet coping
}

// shopfront on the street face: pilasters, glass either side of the door, dark-oak hood
for (let z = 6; z <= 10; z++) {
  v.set(1, 3, z, "dark_oak_planks");
  for (const y of [1, 2]) {
    if (z === 6 || z === 10) v.set(1, y, z, "dark_oak_log");
    else if (z === 8) v.set(1, y, z, "dark_oak_door", { facing: "west", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    else v.set(1, y, z, "glass_pane");
  }
}
v.set(2, 1, 8, "lantern", { hanging: "false", waterlogged: "false" });
v.set(2, 1, 7, "glowstone");
v.set(2, 1, 9, "glowstone");

// warm lights behind some glass: glowstone on the 2nd storey, lanterns on the 3rd, shopfront-style on the ground floor
for (const key of perimeter) {
  const [x, z] = key.split(",").map(Number);
  const N = !inF(x, z - 1), S = !inF(x, z + 1), W = !inF(x - 1, z), E = !inF(x + 1, z);
  if ((N || S) && (W || E)) continue;
  if (!((N || S) ? x % 2 === 1 : z % 2 === 1)) continue;
  const [ix, iz] = N ? [x, z + 1] : S ? [x, z - 1] : W ? [x + 1, z] : [x - 1, z];
  if (!inF(ix, iz) || perimeter.has(`${ix},${iz}`)) continue;
  if (z === 6 && x === 1) continue;
  if ((x + z) % 3 === 0) v.set(ix, 6, iz, "glowstone");
  else if ((x + z) % 3 === 1) v.set(ix, 9, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// rooftop plant box on the flat roof
for (const [x, z] of [[3, 4], [4, 4], [3, 5], [4, 5]]) v.set(x, 12, z, "light_gray_concrete");

const { blocks, palette } = v.save(`${DIR}/way_912170780.nbt`);
console.log(`way_912170780.nbt: ${blocks} blocks, ${palette} palette entries`);
