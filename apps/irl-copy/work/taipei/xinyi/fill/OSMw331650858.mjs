import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw331650858";
const W = 36, D = 27, H = 71;
const ROOF = 59;        // roof top is 59 blocks above the lowest ground (lidar)
const STOREY = 5;       // ~5 blocks per storey, about 12 storeys
const ENT_X = [16, 17, 18, 19];   // entrance bay on the z=0 face

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
const inside = (x, z) => x >= 0 && x < W && z >= 0 && z < D;

// deterministic pseudo-random for scattered lit windows
function hash(x, y, z) {
  let n = (x * 374761393 + y * 668265263 + z * 2246822519) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177) | 0;
  return (n >>> 0) % 11;
}

// 1. foundations, floor plates and facade
for (const [x, z, gr] of cells) {
  if (!inside(x, z)) continue;
  for (let y = 0; y < gr; y++) g.set(x, y, z, "gray_concrete");

  const edge = isEdge(x, z);
  const corner = isCorner(x, z);
  const onZFace = !has(x, z - 1) || !has(x, z + 1);
  const u = onZFace ? x : z;
  const pierCol = corner || (u % 4 === 0);
  const entranceCol = z === 0 && ENT_X.includes(x);

  for (let y = gr; y <= ROOF; y++) {
    const k = Math.floor(y / STOREY);
    const ly = y % STOREY;

    if (y === ROOF) {
      g.set(x, y, z, edge ? "white_concrete" : "gray_concrete");   // cornice / roof deck
      continue;
    }

    if (!edge) {
      // interior: only floor plates, air between them
      if (ly === 0) g.set(x, y, z, "light_gray_concrete");
      // lit entrance hall: warm glass back wall just inside the recess
      if (k === 0 && z === 1 && ENT_X.includes(x) && ly >= 1 && ly <= 3) {
        g.set(x, y, z, "yellow_stained_glass");
      }
      continue;
    }

    // entrance recess on the z=0 face, ground floor only (y 1..3)
    if (k === 0 && entranceCol && ly >= 1 && ly <= 3) continue;

    if (k === 0 && ly === 0) {
      g.set(x, y, z, "stone_bricks");                                  // base course
    } else if (k === 0 && ly === 4) {
      g.set(x, y, z, "stone_bricks");                                  // entrance canopy / fascia
    } else if (ly === 0) {
      g.set(x, y, z, "light_gray_concrete");                           // spandrel
    } else if (ly === 4) {
      // dark head over each window bay gives the grid shadow; piers stay pale
      g.set(x, y, z, pierCol ? "white_concrete" : "gray_concrete");
    } else {
      if (pierCol) {
        g.set(x, y, z, "white_concrete");
      } else if (k === 0) {
        g.set(x, y, z, "cyan_stained_glass");                          // shopfront glass
      } else {
        const lit = hash(x, y, z) === 0;
        g.set(x, y, z, lit ? "yellow_stained_glass" : "light_blue_stained_glass");
      }
    }
  }

  // parapet on the roof edge, dark cap at the corners for a crisp outline
  if (edge) g.set(x, ROOF + 1, z, corner ? "stone_bricks" : "light_gray_concrete");
}

// 2. rooftop water tank (3x3) with cap
for (let x = 8; x <= 10; x++) for (let z = 9; z <= 11; z++) {
  if (!has(x, z)) continue;
  for (let y = ROOF + 1; y <= ROOF + 3; y++) g.set(x, y, z, "iron_block");
  g.set(x, ROOF + 4, z, "gray_concrete");
}

// 3. stair and lift penthouse, solid, glazed band on its perimeter
for (let x = 22; x <= 27; x++) for (let z = 9; z <= 14; z++) {
  if (!has(x, z)) continue;
  const rim = x === 22 || x === 27 || z === 9 || z === 14;
  for (let y = ROOF + 1; y <= ROOF + 4; y++) {
    const band = y === ROOF + 2 || y === ROOF + 3;
    if (rim && band) g.set(x, y, z, "light_blue_stained_glass");
    else if (rim) g.set(x, y, z, "white_concrete");
    else g.set(x, y, z, "light_gray_concrete");
  }
  g.set(x, ROOF + 5, z, "gray_concrete");
}

// 4. antenna on the penthouse
if (has(24, 11)) {
  for (let y = ROOF + 6; y <= ROOF + 7; y++) g.set(24, y, 11, "lightning_rod", { facing: "up" });
}

// 5. entrance lantern standing on the canopy, warm light at street level
if (has(17, 0)) g.set(17, 5, 0, "lantern", { hanging: "false", waterlogged: "false" });
if (has(18, 0)) g.set(18, 5, 0, "lantern", { hanging: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
