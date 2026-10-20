import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded building: treated as a 5-storey 1990s Taipei commercial block.
// Pale tiled/concrete piers, blue-tinted glazing in bays, granite shopfront,
// stone cornice and parapet, one central mechanical penthouse with a mast.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397479";
const W = 25, H = 38, D = 19;
const ROOF = 26;                 // roof top, absolute, from lidar record
const FLOORS = [6, 11, 16, 21];  // storey slab levels for storeys 2..5

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const KEY = (x, z) => `${x},${z}`;
const G = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  G.set(KEY(x, z), Math.min(Math.max(0, Math.round(gr)), 20));
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => G.has(KEY(x, z));
const gnd = (x, z) => G.get(KEY(x, z));
const exp = (x, z) => ({ n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) });
const isPerim = (x, z) => { const f = exp(x, z); return f.n || f.s || f.w || f.e; };

// Pier columns: corners always; otherwise every third cell along the exposed face.
const isPier = (x, z) => {
  const f = exp(x, z);
  const ns = f.n || f.s, we = f.w || f.e;
  if (ns && we) return true;
  if (ns) return x % 3 === 0;
  if (we) return z % 3 === 0;
  return true;
};

// Main entrance: south-facing (exposed +z) non-pier cell nearest the middle.
const midX = (minX + maxX) / 2;
let entrance = null, best = Infinity;
for (const [x, z] of cells) {
  if (exp(x, z).s && !isPier(x, z)) {
    const d = Math.abs(x - midX);
    if (d < best) { best = d; entrance = KEY(x, z); }
  }
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  g.set(x, y, z, id);
};

// Wall block for a perimeter cell at height y (null = open air).
const wallId = (x, z, y, gr) => {
  const pier = isPier(x, z);
  if (y < 6) {                       // ground storey: granite base + shopfront
    if (pier) return "polished_granite";
    if (y <= 3) return entrance === KEY(x, z) ? null : "light_blue_stained_glass";
    return y === 4 ? "smooth_stone" : "light_gray_concrete";
  }
  const k = Math.floor((y - 6) / 5) + 1;  // storey 2..5 -> k 1..4
  const rel = (y - 6) % 5;
  if (k === 4 && rel === 3) return "smooth_stone";   // cornice
  if (k === 4 && rel === 4) return "stone_bricks";   // parapet
  if (rel === 0) return "light_gray_concrete";       // storey line
  if (rel === 4) return pier ? "white_concrete" : "light_gray_concrete"; // spandrel
  return pier ? "white_concrete" : "light_blue_stained_glass";           // window band
};

// Pass 1: foundations, floor slabs, roof deck, perimeter walls.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  for (const b of FLOORS) if (b >= gr) put(x, b, z, "light_gray_concrete");
  put(x, ROOF - 1, z, isPerim(x, z) ? "stone_bricks" : "gray_concrete");
  if (isPerim(x, z)) {
    for (let y = gr; y <= ROOF - 1; y++) {
      const id = wallId(x, z, y, gr);
      if (id !== null) put(x, y, z, id);
    }
  }
}

// Pass 2: warm lights standing on interior floors, just behind some windows.
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z) || isPier(x, z) || entrance === KEY(x, z)) continue;
  const f = exp(x, z);
  let ix = x, iz = z;
  if (f.n) iz = z + 1; else if (f.s) iz = z - 1; else if (f.w) ix = x + 1; else ix = x - 1;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  const gi = gnd(ix, iz);
  // shopfront lamp on the ground floor
  if (gr > 0 && gi === gr && (x + z) % 4 === 0) {
    put(ix, gr, iz, "lantern");
    g.set(ix, gr, iz, "lantern", { hanging: "false" });
  }
  // upper-storey lamps
  for (let k = 1; k <= 4; k++) {
    const b = 6 + 5 * (k - 1);
    if ((x + z + k) % 3 !== 0) continue;
    if (gi > b) continue;
    g.set(ix, b + 1, iz, "lantern", { hanging: "false" });
  }
}

// Pass 3: central mechanical penthouse with a lightning-rod mast.
const cx = Math.round(midX), cz = Math.round((minZ + maxZ) / 2);
const bx0 = cx - 4, bx1 = cx + 4, bz0 = cz - 3, bz1 = cz + 3;
for (let x = bx0; x <= bx1; x++) {
  for (let z = bz0; z <= bz1; z++) {
    if (!has(x, z)) continue;
    const ring = x === bx0 || x === bx1 || z === bz0 || z === bz1;
    const corner = (x === bx0 || x === bx1) && (z === bz0 || z === bz1);
    for (let y = ROOF; y <= ROOF + 2; y++) {
      if (!ring) continue;
      if (y === ROOF + 1 && !corner) put(x, y, z, "light_blue_stained_glass");
      else put(x, y, z, "light_gray_concrete");
    }
    put(x, ROOF + 3, z, "stone_bricks");
  }
}
if (has(cx, cz)) put(cx, ROOF + 4, cz, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
