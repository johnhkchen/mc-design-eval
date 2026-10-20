import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408115";
const W = 22, H = 23, D = 22;
const ROOF = 11;          // roof surface about 11 blocks above lowest ground

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;

// Normalise grounds so the lowest footprint ground is y 0.
let minGround = Infinity;
for (const [, , gr] of raw) minGround = Math.min(minGround, Math.round(gr));
const ground = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const g = Math.min(ROOF - 2, Math.round(gr) - minGround);
  ground.set(key(x, z), Math.max(0, g));
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const FACE = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };
const inFoot = (x, z) => ground.has(key(x, z));
const missingOf = (x, z) =>
  Object.keys(FACE).filter(f => !inFoot(x + FACE[f][0], z + FACE[f][1]));

const cells = [...ground.keys()].map(k => k.split(",").map(Number));
const ringInfo = new Map();
for (const [x, z] of cells) {
  const m = missingOf(x, z);
  if (m.length) ringInfo.set(key(x, z), m);
}
const isRing = (x, z) => ringInfo.has(key(x, z));

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z] of cells) {
  const gr = ground.get(key(x, z));
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Interior: floor slab at storey line (y 5), roof slab (y 11), air otherwise.
for (const [x, z] of cells) {
  if (isRing(x, z)) continue;
  const gr = ground.get(key(x, z));
  if (gr <= 5) put(x, 5, z, "smooth_stone");
  put(x, ROOF, z, "light_gray_concrete");
}

// 3. Facade ring: base course, shopfront, storey line, windows, cornice, parapet.
const bandMat = (y, gr, mull) => {
  if (y === gr) return "polished_andesite";
  if (y <= 4) return mull ? "gray_concrete" : "light_blue_stained_glass";
  if (y === 5) return "light_gray_concrete";
  if (y <= 9) return mull ? "white_concrete" : "light_blue_stained_glass";
  if (y === 10) return "smooth_stone";
  return "white_concrete";
};

for (const [x, z] of cells) {
  const miss = ringInfo.get(key(x, z));
  if (!miss) continue;
  const gr = ground.get(key(x, z));
  const corner = miss.length >= 2;
  const face = miss[0];
  const index = (face === "N" || face === "S") ? x : z;
  const mull = corner || index % 3 === 0;
  for (let y = gr; y <= ROOF; y++) {
    put(x, y, z, bandMat(y, gr, mull));
  }
}

// 4. Warm lights behind glass (interior cell on the inward side of the facade).
for (const [x, z] of cells) {
  const miss = ringInfo.get(key(x, z));
  if (!miss || miss.length >= 2) continue;
  const gr = ground.get(key(x, z));
  const face = miss[0];
  const index = (face === "N" || face === "S") ? x : z;
  const ix = x - FACE[face][0], iz = z - FACE[face][1];
  if (!inFoot(ix, iz) || isRing(ix, iz)) continue;
  if (index % 6 === 1) put(ix, 6, iz, "glowstone");
  if (gr + 1 <= 4 && index % 6 === 4) put(ix, gr + 1, iz, "shroomlight");
}

// 5. Entrance on the south face (or nearest available face), with canopy.
let doorCell = null, doorFace = null;
for (const face of ["S", "E", "N", "W"]) {
  const cands = cells.filter(([x, z]) => {
    const m = ringInfo.get(key(x, z));
    return m && m.length === 1 && m[0] === face;
  });
  if (cands.length) {
    cands.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    doorCell = cands[Math.floor(cands.length / 2)];
    doorFace = face;
    break;
  }
}
if (doorCell && ground.get(key(...doorCell)) <= 3) {
  const [dx, dz] = doorCell;
  const gr = ground.get(key(dx, dz));
  const facing = FACING[doorFace];
  put(dx, gr, dz, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, gr + 1, dz, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy slab across the entrance bay, footprint cells only.
  const along = (doorFace === "N" || doorFace === "S") ? [1, 0] : [0, 1];
  for (const s of [-1, 0, 1]) {
    const cx = dx + along[0] * s, cz = dz + along[1] * s;
    if (inFoot(cx, cz)) put(cx, gr + 3, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  // Lanterns flanking the door on the ground floor.
  const lx = dx + along[0], lz = dz + along[1];
  if (inFoot(lx, lz)) put(lx, gr + 2, lz, "lantern", { hanging: "true", waterlogged: "false" });
}

// 6. Roof plant: a central equipment block and a lightning rod.
for (let x = 7; x <= 14; x++) {
  for (let z = 7; z <= 14; z++) {
    if (!inFoot(x, z) || isRing(x, z)) continue;
    put(x, ROOF + 1, z, "gray_concrete");
    put(x, ROOF + 2, z, "gray_concrete");
  }
}
if (inFoot(10, 10) && !isRing(10, 10)) put(10, ROOF + 3, 10, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
