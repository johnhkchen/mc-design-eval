import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "OSMw1071343778";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const W = 31, D = 14, H = 23;
const ROOF = 11;          // roof surface, about 11 blocks above lowest ground
const STOREY = 5;         // storey height in blocks
const FLOOR_LINES = [STOREY, STOREY * 2];   // 5 and 10
const CORNICE_Y = 10;
const PARAPET_Y = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

// Facade material for a wall block at height y, index a along the face,
// on a cell whose local ground is gr. Returns null for an opening (air).
function facade(y, a, gr) {
  if (y === gr) return { name: "stone_bricks" };                // base course
  if (y < STOREY) {                                             // ground-floor shopfront
    if (y === STOREY - 1) return { name: "smooth_stone" };      // fascia / lintel
    if (a % 3 === 0) return { name: "white_concrete" };          // piers
    if (a >= 13 && a <= 17) {                                   // entrance bay
      if (y < gr + 4) return null;                              // doorway opening
    }
    return { name: "light_blue_stained_glass_pane" };           // shop glazing
  }
  if (y === FLOOR_LINES[0]) return { name: "light_gray_concrete" }; // storey line
  if (y > FLOOR_LINES[0] && y < CORNICE_Y) {                    // upper storey window grid
    if (a % 3 === 0) return { name: "white_concrete" };          // mullions
    if (y === 8 && a % 9 === 4) return { name: "glowstone" };   // warm lit window
    return { name: "light_blue_stained_glass_pane" };
  }
  if (y === CORNICE_Y) return { name: "stone_bricks" };          // cornice
  if (y === PARAPET_Y) return { name: "white_concrete" };        // parapet
  return null;
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const top = Math.max(ROOF, gr);
  const westOrEast = !has(x, z - 1) || !has(x, z + 1);   // on a N or S face
  const edge = !has(x, z - 1) || !has(x, z + 1) || !has(x + 1, z) || !has(x - 1, z);
  // Index along the face: x for north/south faces, z for east/west faces.
  const a = westOrEast ? x : z;

  for (let y = gr; y <= top; y++) {
    if (edge) {
      const b = facade(y, a, gr);
      if (b) g.set(x, y, z, b.name);
    } else {
      // Interior: floor slabs only, open air between (no interiors modelled).
      if (y === gr || FLOOR_LINES.includes(y) || y === top) {
        g.set(x, y, z, "light_gray_concrete");
      }
    }
  }

  // Roof-top plant room on the inner roof, set back from the parapet.
  const inner = !edge && x >= 9 && x <= 13 && z >= 5 && z <= 8;
  if (inner && gr <= ROOF) {
    for (let y = ROOF + 1; y <= ROOF + 2; y++) {
      g.set(x, y, z, y === ROOF + 2 ? "stone_bricks" : "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
