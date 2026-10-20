import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541455335";
const W = 32, H = 47, D = 21;

// Era/type read from the record: a late-20th / early-21st-century Xinyi mid-rise
// office block, 7 storeys of 5 blocks, white concrete frame with tinted glazing,
// granite base, smooth-quartz mullions and cornice, and a plant penthouse on the roof.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const S = new Map();
for (const [x, z, gr] of cells) S.set(`${x},${z}`, gr);
const has = (x, z) => S.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Entrance: centre bay on the south (+z) face.
const DOOR_X = 16;

for (const [x, z, gr] of cells) {
  const mxMiss = !has(x - 1, z) || !has(x + 1, z); // on an east/west face
  const mzMiss = !has(x, z - 1) || !has(x, z + 1); // on a north/south face
  const perim = mxMiss || mzMiss;
  const corner = mxMiss && mzMiss;
  // Mullions: every 4th column on N/S faces, every 4th row-column on E/W faces; corners are pilasters.
  const mull = corner || (mzMiss ? x % 4 === 0 : z % 4 === 0);
  const doorCell = perim && x === DOOR_X && !has(x, z + 1);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");

  // Storeys: h 0..35 (7 storeys x 5 blocks), roof cornice at h 35, parapet at h 36.
  for (let h = 0; h <= 35; h++) {
    const y = gr + h;
    const k = Math.floor(h / 5);
    const band = h % 5 === 0;

    if (perim) {
      if (doorCell && h >= 1 && h <= 3) continue; // open entrance
      let id;
      if (h === 35) id = "smooth_quartz";                 // cornice
      else if (h === 0) id = "polished_granite";          // base course
      else if (doorCell && h === 4) id = "smooth_quartz"; // lintel over door
      else if (band) id = "light_gray_concrete";          // floor spandrel
      else id = mull ? "smooth_quartz" : "light_blue_stained_glass";
      put(x, y, z, id);
    } else {
      // Interior: only floor slabs, one air gap behind the glass, a few warm lights.
      if (band) {
        put(x, y, z, "light_gray_concrete");
      } else {
        const nearPerim =
          !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1) ||
          !has(x - 1, z) || !has(x + 1, z) ||
          [[x-1,z],[x+1,z],[x,z-1],[x,z+1]].some(([a,b]) => {
            const gg = S.get(`${a},${b}`);
            return gg === undefined ? false : false;
          });
        // Depth-1 cells: any neighbour that is a perimeter cell.
        const adjPerim = [[x-1,z],[x+1,z],[x,z-1],[x,z+1]].some(([a,b]) => {
          if (!has(a, b)) return true;
          const la = has(a - 1, b) && has(a + 1, b) && has(a, b - 1) && has(a, b + 1);
          return !la;
        });
        if (adjPerim && h % 5 === 2 && (x + z + k) % 4 === 0) {
          put(x, y, z, "glowstone");
        }
      }
    }
  }

  // Parapet on the perimeter.
  if (perim) put(x, gr + 36, z, "white_concrete");
}

// Plant penthouse on the roof deck, centred on the footprint.
const PH = { x0: 8, x1: 23, z0: 6, z1: 14 };
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!has(x, z)) continue;
    const gr = S.get(`${x},${z}`);
    const border = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    for (let h = 36; h <= 39; h++) {
      if (!border) continue;
      put(x, gr + h, z, h % 2 === 0 ? "iron_bars" : "light_gray_concrete");
    }
    put(x, gr + 40, z, "smooth_quartz"); // penthouse cap
  }
}

// Roof mast centred on the penthouse.
const cx = 16, cz = 10;
if (has(cx, cz)) {
  const gr = S.get(`${cx},${cz}`);
  for (let h = 41; h <= 44; h++) put(cx, gr + h, cz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
