import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453245232";
const W = 34, H = 38, D = 16;

// Record: no era given. Read as a 5-storey, late-20th-century Taipei commercial
// block: stone plinth, white concrete frame with pale-blue glass bays, shopfront
// at grade, parapet with quartz cornice, rooftop plant room and a mast.
// Roof level sits 26 blocks above the lowest ground; storey lines are absolute.

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map(c => c[2]));
const ground = new Map();
for (const [x, z, gr] of raw) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, gr - minG);
}
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

const ROOF = 26;                 // roof deck top (absolute, lowest ground = 0)
const B = [0, 6, 11, 16, 21, 26]; // storey lines: ground storey 6 tall, upper storeys 5 tall

const g = new Voxels([W, H, D]);
const put = (x, y, z, name, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const missingDirs = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

// Entrance: outer cell on the +z (front) face nearest the middle of the frontage.
let entrance = null;
{
  let best = -Infinity;
  for (const key of ground.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (missingDirs(x, z).length === 0) continue;
    const frontFace = !has(x, z + 1) ? 1 : 0;
    const score = frontFace * 100 - Math.abs(x - 17) - (z === Math.max(...[...ground.keys()].map(k => +k.split(",")[1])) ? 0 : 5);
    if (score > best) { best = score; entrance = { x, z }; }
  }
}

function facade(x, z, y, gr, s, loc, missing) {
  const corner = missing.length >= 2;
  const pier = corner || (x + z) % 3 === 0;
  if (s === 0) {
    if (loc === 0) return put(x, y, z, "polished_granite");
    if (loc <= 3) return put(x, y, z, pier ? "white_concrete" : "glass");
    if (loc === 4) return put(x, y, z, "white_concrete");
    return put(x, y, z, "smooth_stone"); // awning / storey line at grade
  }
  if (loc === 0) return put(x, y, z, "white_concrete");     // spandrel
  if (loc === 4) return put(x, y, z, "light_gray_concrete"); // storey band
  // loc 1..3: window zone
  if (pier) return put(x, y, z, "white_concrete");
  put(x, y, z, "light_blue_stained_glass_pane");
  // warm light behind some glass, in the interior air cell
  if (loc === 2 && missing.length > 0 && ((x * 7 + z * 3 + s) % 5 === 0)) {
    const [dx, dz] = missing[0];
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz)) put(ix, y, iz, "shroomlight");
  }
}

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const missing = missingDirs(x, z);
  const per = missing.length > 0;

  // foundation: solid from 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // body: gr .. ROOF-1
  for (let y = gr; y < ROOF; y++) {
    let s = 0;
    for (let i = 0; i < 5; i++) if (B[i] <= y) s = i;
    const loc = y - B[s];

    if (per) {
      if (entrance && entrance.x === x && entrance.z === z && (y === gr + 1 || y === gr + 2)) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      } else {
        facade(x, z, y, gr, s, loc, missing);
      }
    } else {
      // interior: floor slab per storey, air elsewhere
      if (loc === 0 || y === gr) put(x, y, z, "light_gray_concrete");
    }
  }

  // roof deck over the whole footprint
  put(x, ROOF, z, "light_gray_concrete");

  // parapet and quartz cornice on the outer ring
  if (per) {
    put(x, ROOF + 1, z, "quartz_block");
    put(x, ROOF + 2, z, "white_concrete");
  }
}

// Rooftop plant room: a box inside the roof, with a slab cap.
for (let x = 10; x <= 23; x++) {
  for (let z = 4; z <= 11; z++) {
    if (!has(x, z)) continue;
    const ring = x === 10 || x === 23 || z === 4 || z === 11;
    if (ring) {
      for (let y = ROOF + 1; y <= ROOF + 4; y++) {
        put(x, y, z, y === ROOF + 2 && !(x === 10 || x === 23) ? "light_blue_stained_glass_pane" : "light_gray_concrete");
      }
    }
    put(x, ROOF + 5, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Mast on the plant room.
if (has(17, 8)) {
  for (let y = ROOF + 6; y <= ROOF + 9; y++) put(17, y, 8, "lightning_rod");
}

// Entrance door pair already placed; keep a warm lantern on each side of it.
if (entrance) {
  const { x, z } = entrance;
  const gr = groundAt(x, z);
  if (gr !== undefined) {
    if (has(x - 1, z)) put(x - 1, gr + 3, z, "lantern", { hanging: "false", waterlogged: "false" });
    if (has(x + 1, z)) put(x + 1, gr + 3, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
