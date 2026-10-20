import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453245237";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 33, H = 76, D = 16;
const ROOF = 63;          // highest built block; roof slab sits at y = 63
const FLOOR_H = 5;        // storey height in blocks
const PH_Y0 = 64;         // mechanical penthouse starts on the roof
const PH_TOP = 68;        // penthouse cap
const PH_X0 = 9, PH_X1 = 23, PH_Z0 = 4, PH_Z1 = 11;
const ENTRY_COLS = [15, 16];

const g = new Voxels([W, H, D]);

const foot = new Map();
for (const [x, z, gr] of cells) foot.set(`${x},${z}`, gr);
const has = (x, z) => foot.has(`${x},${z}`);
const isEdge = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
// facade runs along x when the missing neighbour is on the z axis
const runsAlongX = (x, z) => !has(x, z - 1) || !has(x, z + 1);

function facadeBlock(x, z, y, gr) {
  const rel = y - gr;
  const k = Math.floor(rel / FLOOR_H);
  const off = rel % FLOOR_H;

  if (y === ROOF) return ["smooth_quartz"];          // roof slab / parapet cap

  if (!isEdge(x, z)) {
    // interior: floor slab each storey, air gap between
    return off === 0 ? ["smooth_quartz"] : null;
  }

  const alongX = runsAlongX(x, z);
  const col = alongX ? x : z;
  const southFace = alongX && z === D - 1;

  if (k === 0) {
    if (off === 0) return ["polished_granite"];      // base course
    if (off === 4) return ["white_concrete"];        // lintel band
    // entrance opening on the south face, centre bay
    if (southFace && ENTRY_COLS.includes(col) && off <= 2) return null;
    if (col % 3 === 0) return ["white_concrete"];    // mullion
    return ["light_blue_stained_glass"];             // shopfront glazing
  }

  if (off === 0) return ["light_gray_concrete"];     // spandrel / floor line
  if (off === 4) return ["white_concrete"];          // cornice band
  if (col % 3 === 0) return ["white_concrete"];      // mullion
  if (off === 2 && k % 3 === 1 && col % 9 === 1) return ["glowstone"]; // warm lit office
  return ["light_blue_stained_glass"];
}

function inPH(x, z) {
  return x >= PH_X0 && x <= PH_X1 && z >= PH_Z0 && z <= PH_Z1 && has(x, z);
}

for (const [x, z, gr0] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = Math.min(gr0, ROOF);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // building shell and floors up to the roof
  for (let y = gr; y <= ROOF; y++) {
    const b = facadeBlock(x, z, y, gr);
    if (b) g.set(x, y, z, b[0]);
  }

  // mechanical penthouse on the roof, centre of the plan
  if (inPH(x, z)) {
    const edge = x === PH_X0 || x === PH_X1 || z === PH_Z0 || z === PH_Z1;
    for (let y = PH_Y0; y < PH_TOP; y++) {
      if (!edge) continue;
      if (y === PH_Y0 || y === PH_TOP - 1) {
        g.set(x, y, z, "white_concrete");
      } else if ((x + z) % 3 === 0) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
    }
    g.set(x, PH_TOP, z, "smooth_quartz");
  }
}

// broadcast-style antenna on the penthouse centre
if (has(16, 8)) {
  for (let y = PH_TOP + 1; y <= PH_TOP + 3; y++) g.set(16, y, 8, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
