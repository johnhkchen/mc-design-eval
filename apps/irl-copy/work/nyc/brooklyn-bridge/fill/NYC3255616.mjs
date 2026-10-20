import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3255616";
const W = 35, HGT = 30, D = 21;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = Array.isArray(raw) ? raw : raw.cells;

const info = new Map();
for (const c of cells) {
  info.set(`${c[0]},${c[1]}`, {
    x: c[0], z: c[1],
    g: Math.max(0, Math.round(c[2])),
    r: Number(c[3]),
  });
}
const has = (x, z) => info.has(`${x},${z}`);
const extFlag = (x, z) =>
  !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

// Smooth roof per cell over its neighbourhood, then quantise to even tiers
const quant = new Map();
for (const c of info.values()) {
  let sum = c.r, n = 1;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nb = info.get(`${c.x + dx},${c.z + dz}`);
    if (nb && Number.isFinite(nb.r)) { sum += nb.r; n++; }
  }
  const q = Math.round((sum / n) / 2) * 2;
  quant.set(`${c.x},${c.z}`, q);
}

// Main roof tier = most common quantised height; cells near it join it,
// the rest stay as lower setback wings.
const counts = new Map();
for (const q of quant.values()) counts.set(q, (counts.get(q) || 0) + 1);
let mainH = 18, best = -1;
for (const [h, n] of counts) if (n > best) { best = n; mainH = h; }

const roofOf = new Map();
for (const c of info.values()) {
  const k = `${c.x},${c.z}`;
  let H = quant.get(k);
  if (H >= mainH - 2) H = mainH;
  H = Math.min(HGT - 2, Math.max(c.g + 8, H));
  roofOf.set(k, H);
}

// Entrance: middle of the north (-z) street face
const northCells = [...info.values()]
  .filter(c => !has(c.x, c.z - 1))
  .sort((a, b) => a.x - b.x);
const doorCell = northCells.length ? northCells[Math.floor(northCells.length / 2)] : null;

const g = new Voxels([W, HGT, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= HGT || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const lightCandidates = [];

for (const c of info.values()) {
  const { x, z } = c;
  const gr = c.g;
  const H = roofOf.get(`${x},${z}`);

  // Foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "bricks");

  const fN = !has(x, z - 1), fS = !has(x, z + 1), fW = !has(x - 1, z), fE = !has(x + 1, z);
  const ext = fN || fS || fW || fE;

  if (!ext) {
    // Interior: floor slabs per storey, air gap otherwise, roof cap
    put(x, gr, z, "smooth_stone");
    for (let b = gr + 3; b <= H - 3; b += 2) put(x, b, z, "smooth_stone");
    put(x, H - 1, z, "smooth_stone");
    continue;
  }

  const t = (fN || fS) ? x : z;
  const dCell = doorCell && doorCell.x === x && doorCell.z === z && fN;
  const nearDoor = doorCell && fN && Math.abs(doorCell.x - x) === 1 && doorCell.z === z;

  for (let y = gr; y <= H; y++) {
    if (y === gr) {
      put(x, y, z, "stone_bricks");                       // base course
    } else if (y < gr + 3) {
      // Shopfront zone
      if (dCell && y === gr + 1) {
        put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (dCell && y === gr + 2) {
        put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (dCell) {
        put(x, y, z, "stone_bricks");                     // doorway lintel/ground
      } else if (nearDoor && y <= gr + 2) {
        put(x, y, z, "stone_bricks");                     // door surround
      } else if (t % 4 === 0 || t % 4 === 2) {
        put(x, y, z, "stone_bricks");                     // piers and frames
      } else {
        put(x, y, z, "glass");
        if (!dCell && ((x * 7 + y * 13 + z * 29) % 5 === 0)) lightCandidates.push({ x, y, z, fN, fS, fW, fE });
      }
    } else if (y === gr + 3) {
      put(x, y, z, "stone_bricks");                       // string course
    } else if (y <= H - 3) {
      const k = (y - (gr + 3)) % 2;
      if (k === 0) {
        put(x, y, z, "bricks");                           // spandrel band
      } else if (t % 4 === 0) {
        put(x, y, z, "bricks");                           // pier
      } else if (t % 4 === 2) {
        put(x, y, z, "iron_bars");                        // mullion
      } else {
        put(x, y, z, "glass");
        if ((x * 7 + y * 13 + z * 29) % 5 === 0) lightCandidates.push({ x, y, z, fN, fS, fW, fE });
      }
    } else if (y === H - 2) {
      put(x, y, z, "stone_bricks");                       // cornice
    } else if (y === H - 1) {
      put(x, y, z, "stone_bricks");                       // roof edge
    } else if (y === H) {
      put(x, y, z, "stone_brick_wall");                   // solid parapet
    }
  }
}

// Warm lights just behind some glass, inside the building
for (const L of lightCandidates) {
  let tx = L.x, tz = L.z;
  if (L.fN) tz = L.z + 1;
  else if (L.fS) tz = L.z - 1;
  else if (L.fW) tx = L.x + 1;
  else if (L.fE) tx = L.x - 1;
  if (!info.has(`${tx},${tz}`)) continue;
  if (extFlag(tx, tz)) continue;
  put(tx, L.y, tz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
