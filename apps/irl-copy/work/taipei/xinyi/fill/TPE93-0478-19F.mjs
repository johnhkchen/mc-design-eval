import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE93-0478-19F.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE93-0478-19F.nbt";

const W = 67, H = 105, D = 68;
const ROOF = 93;          // roof top, absolute y, from lidar record
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), Math.max(0, Math.round(gr)));
const inFP = (x, z) => G.has(key(x, z));

// Erosion of the footprint: a cell survives if every cell within d (Chebyshev) is footprint.
const erodeCache = new Map();
function erode(d) {
  if (erodeCache.has(d)) return erodeCache.get(d);
  const S = new Set();
  for (const k of G.keys()) {
    const [x, z] = k.split(",").map(Number);
    let ok = true;
    for (let dx = -d; dx <= d && ok; dx++)
      for (let dz = -d; dz <= d && ok; dz++)
        if (!inFP(x + dx, z + dz)) ok = false;
    if (ok) S.add(k);
  }
  erodeCache.set(d, S);
  return S;
}

// Tiers: podium (3 storeys), tower A (setback 5), tower B (setback 10) to roof.
const TIERS = [
  { name: "podium", from: 0, to: 14, d: 0 },
  { name: "towerA", from: 15, to: 59, d: 5 },
  { name: "towerB", from: 60, to: ROOF, d: 10 },
];
for (const t of TIERS) t.S = erode(t.d);
const tierAt = (y) => TIERS.find((t) => y <= t.to) ?? TIERS[TIERS.length - 1];

const isPerim = (x, z, S) =>
  !S.has(key(x + 1, z)) || !S.has(key(x - 1, z)) || !S.has(key(x, z + 1)) || !S.has(key(x, z - 1));

const hash = (x, y, z) => {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2246822519);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
};

// Bounding box / centre of the tower B tier.
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);

// Entrance: the footprint's north (min z) face, centred on its x extent.
let zFace = Infinity;
for (const k of G.keys()) zFace = Math.min(zFace, Number(k.split(",")[1]));
const faceXs = [...G.keys()].map((k) => k.split(",").map(Number)).filter(([, z]) => z === zFace).map(([x]) => x).sort((a, b) => a - b);
const doorX = faceXs[Math.floor(faceXs.length / 2)];
const doorG = G.get(key(doorX, zFace));

// 1. Foundation, tiers, facades.
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF; y++) {
    const t = tierAt(y);
    const S = t.S;
    if (!S.has(k)) continue;
    const perim = isPerim(x, z, S);
    const floorRow = y === gr || y === t.to || y === t.from || y % 5 === 0;
    if (!perim) {
      if (floorRow) g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (!perim && !floorRow) continue;

    const xFree = !S.has(key(x + 1, z)) || !S.has(key(x - 1, z));
    const zFree = !S.has(key(x, z + 1)) || !S.has(key(x, z - 1));
    const corner = xFree && zFree;
    const idx = xFree ? z : x; // position along the face

    if (corner || y === ROOF) { g.set(x, y, z, "white_concrete"); continue; }

    if (t === TIERS[0] && y - gr < 4) {
      // Shopfront storey.
      if (y === gr) g.set(x, y, z, "polished_andesite");
      else if (idx % 3 === 0) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "cyan_stained_glass");
      continue;
    }

    const r = y % 5;
    if (r === 0) { g.set(x, y, z, "white_concrete"); continue; }
    if (r === 4) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (idx % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }

    g.set(x, y, z, "cyan_stained_glass");
    if (hash(x, y, z) % 11 === 0) {
      // Warm light just inside the glass.
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, nz = z + dz;
        if (S.has(key(nx, nz)) && !isPerim(nx, nz, S)) {
          g.set(nx, y, nz, "glowstone");
          break;
        }
      }
    }
  }
}

// 2. Entrance on the north face: double door with flanking glass already in place.
g.set(doorX, doorG, zFace, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(doorX, doorG + 1, zFace, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// 3. Roof plant room on tower B, centred, inside the eroded core.
const PH = new Set();
const core = erode(13);
for (const k of core) {
  const [x, z] = k.split(",").map(Number);
  if (Math.abs(x - cx) <= 10 && Math.abs(z - cz) <= 10) PH.add(k);
}
let mastX = null, mastZ = null, best = Infinity;
for (const k of PH) {
  const [x, z] = k.split(",").map(Number);
  const d = (x - cx) ** 2 + (z - cz) ** 2;
  if (d < best) { best = d; mastX = x; mastZ = z; }
  const perim = isPerim(x, z, PH);
  for (let y = ROOF + 1; y <= ROOF + 4; y++) {
    if (y === ROOF + 4) g.set(x, y, z, "light_gray_concrete");
    else if (perim) g.set(x, y, z, y === ROOF + 2 ? "cyan_stained_glass" : "light_gray_concrete");
  }
}

// 4. Antenna mast on top of the plant room.
if (mastX !== null) {
  for (let y = ROOF + 5; y <= 102; y++) g.set(mastX, y, mastZ, "iron_bars");
  g.set(mastX, 103, mastZ, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(OUT);
