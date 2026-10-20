import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw309235487";
const W = 21, H = 62, D = 15;
const ROOF = 50;      // roof slab level above lowest ground (lidar)
const PODIUM_TOP = 10; // two-storey podium
const TERRACE = 30;   // setback terrace level: upper tower sits two cells in

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const fp = new Map();
for (const c of cells) {
  const [x, z, gr] = c;
  fp.set(`${x},${z}`, Math.max(0, Math.round(gr ?? 0)));
}
const inFp = (x, z) => fp.has(`${x},${z}`);
const groundAt = (x, z) => fp.get(`${x},${z}`);
const nbrs = (x, z) => [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];

// Depth = steps inward from the outer edge of the footprint
const depth = new Map();
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  const edge = nbrs(x, z).some(([nx, nz]) => !inFp(nx, nz));
  depth.set(key, edge ? 0 : Infinity);
}
for (let pass = 0; pass < 40; pass++) {
  for (const key of fp.keys()) {
    const [x, z] = key.split(",").map(Number);
    let best = depth.get(key);
    for (const [nx, nz] of nbrs(x, z)) {
      if (!inFp(nx, nz)) continue;
      best = Math.min(best, depth.get(`${nx},${nz}`) + 1);
    }
    depth.set(key, best);
  }
}
const dAt = (x, z) => depth.get(`${x},${z}`) ?? Infinity;

let minZ = Infinity, maxZ = -Infinity;
for (const k of fp.keys()) {
  const z = Number(k.split(",")[1]);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (!inFp(x, z)) return;
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Facade test: outer skin of podium, outer skin of upper tower (depth 2)
const facade = (x, z, y) => (y < TERRACE ? dAt(x, z) === 0 : dAt(x, z) === 2);

// Bay index along the face the cell sits on (corners use the z-face)
const bayIdx = (x, z) => {
  const onZFace = !inFp(x, z - 1) || !inFp(x, z + 1);
  return onZFace ? x : z;
};
const isMullion = (x, z) => bayIdx(x, z) % 3 === 0;

// Step toward the interior: neighbour one level deeper
const inward = (x, z) => {
  const d = dAt(x, z);
  for (const [nx, nz] of nbrs(x, z)) {
    if (inFp(nx, nz) && dAt(nx, nz) > d) return [nx, nz];
  }
  return null;
};

// 1. Foundations, floors, walls, terraces, parapet
for (const [key, gr] of fp) {
  const [x, z] = key.split(",").map(Number);
  const d = dAt(x, z);

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const top = d >= 2 ? ROOF : TERRACE;

  for (let y = gr; y <= top; y++) {
    const rel = y % 5;
    const fac = facade(x, z, y);

    if (y === TERRACE && d < 2) {
      put(x, y, z, "smooth_stone"); // terrace paving
      continue;
    }
    if (rel === 0) {
      put(x, y, z, fac ? "white_concrete" : "light_gray_concrete");
      continue;
    }
    if (!fac) continue; // air gap behind the glass

    if (y < 5) {
      // shopfront: andesite piers, glass between
      put(x, y, z, isMullion(x, z) ? "polished_andesite" : "glass");
    } else if (rel === 4) {
      put(x, y, z, "light_gray_concrete"); // spandrel
    } else {
      put(x, y, z, isMullion(x, z) ? "white_concrete" : "light_blue_stained_glass");
    }
  }

  // terrace guard rail on the outer ring
  if (d === 0) put(x, TERRACE + 1, z, "white_concrete");

  // roof parapet on the upper tower edge
  if (d === 2) {
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "white_concrete");
  }
}

// 2. Entrance: recessed doorway on the street face, canopy, lanterns
const entranceXs = [9, 10, 11];
for (const x of entranceXs) {
  if (!inFp(x, minZ)) continue;
  const gr = groundAt(x, minZ);
  if (gr > 3) continue;
  for (let y = Math.max(gr, 1); y <= 3; y++) {
    put(x, y, minZ, "air");                 // open doorway
    if (inFp(x, minZ + 1)) put(x, y, minZ + 1, "glass"); // glazed back wall
  }
}
// canopy across the entrance bay
for (let x = 8; x <= 12; x++) {
  for (const zz of [minZ, minZ + 1]) {
    if (inFp(x, zz)) put(x, 4, zz, "polished_andesite");
  }
}
// hanging lanterns beneath the canopy at the bay corners
for (const x of [8, 12]) {
  if (inFp(x, minZ) && groundAt(x, minZ) <= 3) {
    put(x, 3, minZ, "lantern", { hanging: "true" });
  }
}

// 3. Warm lights behind some windows
for (const [key, gr] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = Math.max(gr, 5); y <= ROOF - 1; y++) {
    if (y % 5 !== 2) continue;
    if (!facade(x, z, y)) continue;
    if (isMullion(x, z)) continue;
    if ((x * 7 + z * 3 + y) % 11 !== 0) continue;
    const n = inward(x, z);
    if (!n) continue;
    const [ix, iz] = n;
    if (y < groundAt(ix, iz)) continue;
    put(ix, y, iz, (x + y) % 2 === 0 ? "glowstone" : "shroomlight");
  }
}

// 4. Roof plant: central louvred penthouse and lightning rod
for (let x = 6; x <= 14; x++) {
  for (let z = 4; z <= 10; z++) {
    if (!inFp(x, z)) continue;
    const ring = x === 6 || x === 14 || z === 4 || z === 10;
    if (ring) {
      for (let y = ROOF + 1; y <= ROOF + 3; y++) {
        put(x, y, z, y === ROOF + 2 ? "iron_bars" : "light_gray_concrete");
      }
    }
    put(x, ROOF + 4, z, "light_gray_concrete");
  }
}
for (let y = ROOF + 5; y <= ROOF + 7; y++) put(10, y, 7, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
