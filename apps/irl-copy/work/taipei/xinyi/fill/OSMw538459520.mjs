import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538459520";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 11 x 18 footprint, two storeys of 5 blocks, flat parapet roof at y 11,
// plant room on the roof. Era: 1960s-70s Taipei concrete shophouse-office,
// white render, light grey pillars and string courses, glazed shopfront.
const W = 11, H = 23, D = 18;
const PARAPET_Y = 11;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, Math.max(0, Math.min(H - 2, Math.round(gr))));
}
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Outward face of a perimeter cell (null if interior).
function faceOf(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}

const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Material of a facade (perimeter) cell at height y.
function facadeBlock(face, x, z, y) {
  const t = face === "N" || face === "S" ? x : z;
  const maxT = face === "N" || face === "S" ? W - 1 : D - 1;
  const pillar = t % 3 === 0 || t === maxT;

  if (y === 0) return { id: "polished_andesite" };
  if (y === 4 || y === 5) return { id: "light_gray_concrete" };   // string courses
  if (y === 9) return { id: "white_concrete" };                    // lintel band
  if (y === 10) return { id: "smooth_stone" };                     // cornice
  if (y === PARAPET_Y) return { id: "white_concrete" };            // parapet
  if ((y >= 1 && y <= 3) || (y >= 6 && y <= 8)) {
    if (pillar) return { id: "light_gray_concrete" };
    return { id: "glass" };
  }
  return { id: "white_concrete" };
}

// 1. Foundations, floor slabs and roof deck on every footprint cell.
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (faceOf(x, z) === null) {
    put(x, gr, z, "smooth_stone");                       // ground floor slab
    if (5 >= gr) put(x, 5, z, "smooth_stone");          // upper floor slab
    if (10 >= gr) put(x, 10, z, "light_gray_concrete"); // roof deck
  }
}

// 2. Perimeter walls with articulated facade.
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const face = faceOf(x, z);
  if (!face) continue;
  for (let y = gr; y <= PARAPET_Y; y++) {
    // Entrance: oak door centred on the north (street) face, glass transom above.
    if (face === "N" && x === 5 && z === 0 && (y === 1 || y === 2)) {
      put(x, y, z, "oak_door", {
        facing: "north",
        half: y === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    const b = facadeBlock(face, x, z, y);
    put(x, y, z, b.id);
  }
}

// 3. Warm lights behind some windows (shroomlight on the inner side of the glass).
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const face = faceOf(x, z);
  if (!face) continue;
  const t = face === "N" || face === "S" ? x : z;
  for (const y of [2, 7]) {
    if (y < gr) continue;
    const isWindow = (y >= 1 && y <= 3) || (y >= 6 && y <= 8);
    if (!isWindow) continue;
    if (facadeBlock(face, x, z, y).id !== "glass") continue;
    if ((t + (y > 5 ? 1 : 0)) % 4 !== 0) continue;
    const [dx, dz] = inward[face];
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && faceOf(ix, iz) === null && gnd(ix, iz) <= y) {
      put(ix, y, iz, "shroomlight");
    }
  }
}

// 4. Roof: plant room block in the middle, AC units, lightning rod.
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  if (faceOf(x, z) !== null) continue;
  if (x < 3 || x > 7 || z < 4 || z > 13) continue;
  if (gr > 10) continue;
  const ring = x === 3 || x === 7 || z === 4 || z === 13;
  const corner = (x === 3 || x === 7) && (z === 4 || z === 13);
  put(x, 11, z, "light_gray_concrete");
  if (ring && !corner && (x + z) % 3 !== 0) put(x, 12, z, "glass");
  else put(x, 12, z, "light_gray_concrete");
  put(x, 13, z, "smooth_stone");
}

for (const [x, z, y, id] of [
  [9, 11, 3, "iron_block"],
  [9, 11, 4, "iron_block"],
  [9, 11, 14, "iron_block"],
]) {
  if (has(x, z) && gnd(x, z) <= 10) put(x, y, z, id);
}
if (has(1, 1) && gnd(1, 1) <= 10) {
  put(1, 11, 1, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
