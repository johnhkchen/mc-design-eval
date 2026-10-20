import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538402995";
const W = 24, H = 23, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ground lookup and footprint helpers
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const inFp = (x, z) => x >= 0 && x < W && z >= 0 && z < D && ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isEdge = (x, z) => inFp(x, z) && NB.some(([dx, dz]) => !inFp(x + dx, z + dz));
const inward = (x, z) => {
  for (const [dx, dz] of NB) if (inFp(x + dx, z + dz) && !isEdge(x + dx, z + dz)) return [x + dx, z + dz];
  return null;
};

const minG = Math.min(...ground.values());
// storey lines relative to the lowest ground
const F = minG + 5;   // upper floor line (belt course)
const P = minG + 10;  // cornice row
const R = minG + 11;  // roof deck / coping top

const put = (x, y, z, block, props) => {
  if (y < 0 || y >= H || !inFp(x, z)) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// facade block for an edge cell at height y
function facade(x, y, z) {
  if (y === R) return "smooth_quartz";            // coping
  if (y === P) return "smooth_quartz";            // cornice
  if (y === F) return "smooth_quartz";            // storey belt course
  if (y > F) {                                    // upper storey
    if (y === F + 1 || y === P - 1) return "white_concrete"; // spandrels
    return (x + z) % 3 === 0 ? "smooth_quartz" : "glass";     // window grid
  }
  // ground storey shopfronts
  if (y === minG + 4) return "gray_concrete";     // signage fascia
  return (x + z) % 3 === 0 ? "smooth_quartz" : "glass";
}

// entrance on the north (lowest z) edge, middle of that run
const minZ = Math.min(...cells.map(([, z]) => z));
const northXs = cells.filter(([x, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const entX = northXs[Math.floor(northXs.length / 2)];
const entZ = minZ;

// roof plant centre
const cx = Math.round(cells.reduce((s, [x]) => s + x, 0) / cells.length);
const cz = Math.round(cells.reduce((s, [, z]) => s + z, 0) / cells.length);

// 1. foundation, base course, walls, floors
for (const [x, z, gc] of cells) {
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");
  const edge = isEdge(x, z);
  put(x, gc, z, edge ? "polished_granite" : "smooth_stone");

  if (edge) {
    for (let y = gc + 1; y <= R; y++) put(x, y, z, facade(x, y, z));
  } else {
    if (F > gc) put(x, F, z, "smooth_stone");          // upper floor slab
    if (R > gc) put(x, R, z, "light_gray_concrete");   // roof deck
  }
}

// 2. entrance doorway
for (const [x, z, gc] of cells) {
  if (x === entX && z === entZ && gc + 2 <= minG + 3) {
    put(x, gc + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gc + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// 3. warm lights behind the glass (in the interior cell next to the wall)
for (const [x, z, gc] of cells) {
  if (!isEdge(x, z)) continue;
  const inn = inward(x, z);
  if (!inn) continue;
  const [ix, iz] = inn;
  if ((x + z) % 6 === 2 && gc + 2 <= minG + 3 && !(x === entX && z === entZ)) {
    put(ix, gc + 2, iz, "glowstone");
  }
  if ((x + z) % 6 === 1 && F + 2 < P - 1) {
    put(ix, F + 2, iz, "glowstone");
  }
}

// 4. roof plant room and antenna
for (const [x, z] of cells) {
  if (isEdge(x, z)) continue;
  if (Math.abs(x - cx) <= 4 && Math.abs(z - cz) <= 3 && R + 2 < H) {
    put(x, R + 1, z, "light_gray_concrete");
    put(x, R + 2, z, "light_gray_concrete");
  }
}
if (R + 3 < H) {
  let best = null, bd = Infinity;
  for (const [x, z] of cells) {
    if (isEdge(x, z)) continue;
    const d = Math.abs(x - cx) + Math.abs(z - cz);
    if (d < bd) { bd = d; best = [x, z]; }
  }
  if (best) {
    const [ax, az] = best;
    for (let y = R + 1; y <= R + 3; y++) put(ax, y, az, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
