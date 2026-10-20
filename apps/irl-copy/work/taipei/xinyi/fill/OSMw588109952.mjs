import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109952";
const W = 33, D = 23, H = 43;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// Common floor datum: lowest ground under the footprint.
const B = Math.min(...cells.map(c => c[2]));
const ROOF_O = 31;                 // parapet top, offset from B (~31 blocks)

// ---- entrance: on the street (north) face, lowest ground, middle x --------
let pool = cells.filter(([x, z]) => !has(x, z - 1));
if (!pool.length) pool = cells.filter(([x, z]) => isEdge(x, z));
const minG = Math.min(...pool.map(c => c[2]));
pool = pool.filter(c => c[2] === minG).sort((a, b) => a[0] - b[0]);
const [dx, dz] = pool[Math.floor(pool.length / 2)];

let doorFacing = "north";
if (!has(dx, dz - 1)) doorFacing = "north";
else if (!has(dx, dz + 1)) doorFacing = "south";
else if (!has(dx + 1, dz)) doorFacing = "east";
else doorFacing = "west";

// ---- facade logic -----------------------------------------------------------
function edgeContent(x, z, o) {
  const nN = !has(x, z - 1), nS = !has(x, z + 1);
  const nW = !has(x - 1, z), nE = !has(x + 1, z);
  const corner = (nN || nS) && (nW || nE);
  const col = (nN || nS) ? x : z;            // position along the wall
  const pier = corner || (col % 3 === 0);

  if (o === ROOF_O) return "smooth_quartz";  // parapet cap
  const r = o % 5, s = Math.floor(o / 5);
  if (r === 0) return pier ? "smooth_quartz" : "white_concrete"; // storey line
  if (s === 0 && r === 1) return "stone_bricks";                  // base course
  if (pier) return "smooth_quartz";                                // mullion / pier
  if (r === 4) return "white_concrete";                            // spandrel
  return "light_blue_stained_glass_pane";                          // glazing
}

function nearEdge(x, z) {
  return isEdge(x + 1, z) || isEdge(x - 1, z) || isEdge(x, z + 1) || isEdge(x, z - 1) ||
         (has(x + 1, z) && isEdge(x + 1, z)) || (has(x, z + 1) && isEdge(x, z + 1));
}

// ---- build ------------------------------------------------------------------
for (const [x, z, gy] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  for (let o = 0; o <= ROOF_O; o++) {
    const y = B + o;
    if (y >= H) break;

    if (edge) {
      g.set(x, y, z, edgeContent(x, z, o));
      continue;
    }

    // interior: floor slab per storey (and roof slab), air gap otherwise
    const r = o % 5;
    if (o <= 30 && r === 0) {
      g.set(x, y, z, "smooth_quartz");
    } else if (o >= 31 && x >= 11 && x <= 13 && z >= 8 && z <= 12 && o <= 32) {
      g.set(x, y, z, "light_gray_concrete");          // roof plant box
    } else if (o > 30) {
      g.set(x, y, z, "air");
    } else if (r === 2 && nearEdge(x, z) && ((x * 7 + z * 5 + Math.floor(o / 5) * 3) % 13 === 0)) {
      g.set(x, y, z, "glowstone");                     // warm light behind glass
    } else {
      g.set(x, y, z, "air");
    }
  }
}

// ---- entrance door (two blocks tall, on storey 0 at the base course) --------
g.set(dx, B + 1, dz, "dark_oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dx, B + 2, dz, "dark_oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });

g.save(`${DIR}/${ID}.nbt`);
