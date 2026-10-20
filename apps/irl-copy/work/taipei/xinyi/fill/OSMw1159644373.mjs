import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1159644373";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 37, H = 23, D = 33;
const TOP = 11;      // parapet top (roof is ~11 blocks above lowest ground)
const FLOOR1 = 5;    // slab between ground storey and upper storey
const ROOF = 10;     // roof deck / cornice level

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.max(0, Math.min(TOP, Math.round(gr))));
const has = (x, z) => ground.has(key(x, z));
const groundOf = (x, z) => ground.get(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const inwardOf = (x, z) => {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !isEdge(nx, nz)) return [nx, nz];
  }
  return null;
};

// 1. Foundations, floors, roof deck, walls
for (const [x, z] of cells) {
  const gr = groundOf(x, z);

  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!isEdge(x, z)) {
    // interior: floor slab per storey and roof deck, no interior fit-out
    if (gr <= FLOOR1) g.set(x, FLOOR1, z, "light_gray_concrete");
    if (gr <= ROOF) g.set(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  const pier = (x + z) % 4 === 0 || (x + z) % 4 === 3;

  for (let y = gr; y <= TOP; y++) {
    let b = null;
    if (y === gr) {
      b = "smooth_stone";                       // base course
    } else if (y <= 4) {                        // ground storey: shopfront
      if (pier) b = "white_concrete";
      else if (y === 4) b = "smooth_quartz";    // lintel
      else b = "glass";                         // shopfront glazing
    } else if (y === FLOOR1) {
      b = "smooth_quartz";                      // storey line
    } else if (y <= 9) {                        // upper storey
      if (y === 6 || y === 9) b = "light_gray_concrete";  // spandrels
      else b = pier ? "white_concrete" : "gray_stained_glass";
    } else if (y === ROOF) {
      b = "smooth_quartz";                      // cornice
    } else {
      b = "white_concrete";                     // parapet
    }
    if (b) g.set(x, y, z, b);
  }
}

// 2. Entrance: north-facing edge cell on the ground storey, near the middle
{
  let best = null, bestScore = Infinity;
  for (const [x, z] of cells) {
    if (!isEdge(x, z)) continue;
    const gr = groundOf(x, z);
    if (gr > 2) continue;
    const northFace = !has(x, z - 1) ? 0 : 100;
    const score = northFace * 100 + z * 2 + Math.abs(x - 18);
    if (score < bestScore) { bestScore = score; best = [x, z, gr]; }
  }
  if (best) {
    const [ex, ez, gr] = best;
    g.set(ex, gr + 1, ez, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(ex, gr + 2, ez, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(ex, gr + 3, ez, "smooth_quartz");   // canopy band over the door
  }
}

// 3. Warm light behind some glass
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const gr = groundOf(x, z);
  const pier = (x + z) % 4 === 0 || (x + z) % 4 === 3;
  if (pier) continue;
  const inn = inwardOf(x, z);
  if (!inn) continue;
  const [ix, iz] = inn;
  const igr = groundOf(ix, iz);

  // upper storey: shroomlight behind the window
  if (gr <= 7 && (x * 5 + z * 3) % 7 === 0 && igr <= 7) {
    g.set(ix, 7, iz, "shroomlight");
  }
  // ground storey: glowstone behind the shopfront glass
  if (gr <= 2 && (x * 3 + z * 5) % 9 === 0 && igr <= 2) {
    g.set(ix, 2, iz, "glowstone");
  }
}

// 4. Roof penthouse on interior roof deck (stands on the roof at y 10)
for (const [x, z] of cells) {
  if (isEdge(x, z)) continue;
  if (groundOf(x, z) > ROOF) continue;
  if (x < 13 || x > 23 || z < 11 || z > 21) continue;
  g.set(x, 11, z, "light_gray_concrete");
  g.set(x, 12, z, "light_gray_concrete");
  g.set(x, 13, z, "smooth_quartz");
}

g.save(`${DIR}/${ID}.nbt`);
