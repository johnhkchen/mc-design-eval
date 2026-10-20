import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772039814";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 14 x 15 footprint, roof about 11 blocks above lowest ground:
// two storeys of about 5 blocks, cornice at 10, parapet cap at 11.
const W = 14, H = 23, D = 15;
const BELT_Y = 5;       // storey line between floors
const WALL_TOP = 10;    // cornice course
const PARAPET_Y = 11;   // parapet cap / roof edge
const g = new Voxels([W, H, D]);

const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
const coords = [];
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
  coords.push([x, z]);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const k = (x, z) => `${x},${z}`;
const has = (x, z) => ground.has(k(x, z));
const exposedFaces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("n");
  if (!has(x, z + 1)) f.push("s");
  if (!has(x - 1, z)) f.push("w");
  if (!has(x + 1, z)) f.push("e");
  return f;
};
const isPerim = (x, z) => exposedFaces(x, z).length > 0;
const inward = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Entrance: on the south (front) face, column nearest the middle.
const centerX = (minX + maxX) / 2;
let doorX = null, bestD = Infinity;
for (const [x, z] of coords) {
  if (exposedFaces(x, z).includes("s")) {
    const d = Math.abs(x - centerX);
    if (d < bestD) { bestD = d; doorX = x; }
  }
}

// Facade material for one wall position at height y.
function facade(y, along, gr) {
  if (y === BELT_Y) return { b: "polished_andesite" };
  if (y === WALL_TOP) return { b: "smooth_quartz" };
  const col = along % 3;
  if (y >= 6 && y <= 9) {
    if (col === 0 || y === 6 || y === 9) return { b: "smooth_quartz" };
    return { b: "light_blue_stained_glass" };
  }
  // ground storey (shopfront)
  if (y === gr) return { b: "stone_bricks" };
  if (y === 4) return { b: "smooth_quartz" };
  if (col === 0) return { b: "stone_bricks" };
  return { b: "light_blue_stained_glass" };
}

for (const [x, z] of coords) {
  const gr = ground.get(k(x, z));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = exposedFaces(x, z);

  if (faces.length === 0) {
    // Interior: floor slab per storey, roof deck, air elsewhere.
    if (gr <= BELT_Y) put(x, BELT_Y, z, "smooth_stone");
    put(x, WALL_TOP, z, "gray_concrete");
    const dx = x - minX, dz = z - minZ;
    if (dz === 4 && (dx === 3 || dx === 9)) put(x, WALL_TOP + 1, z, "iron_block");
    continue;
  }

  // Perimeter wall.
  const pref = ["s", "n", "e", "w"];
  const face = pref.find((f) => faces.includes(f));
  const along = (face === "n" || face === "s") ? x - minX : z - minZ;
  const isDoorCell = face === "s" && x === doorX;

  for (let y = gr; y <= WALL_TOP; y++) {
    let { b, p } = facade(y, along, gr);
    if (isDoorCell && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "south", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (isDoorCell && y === gr + 3) { b = "smooth_quartz"; }
    put(x, y, z, b, p);
  }

  // Parapet cap at roof edge.
  put(x, PARAPET_Y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });

  // Warm light behind a few upper-floor windows, in the interior cell just inside.
  const col = along % 3;
  const winIdx = Math.floor(along / 3);
  if (!isDoorCell && col === 1 && winIdx % 2 === 0) {
    const [dx, dz] = inward[face];
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && !isPerim(ix, iz)) put(ix, 7, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
