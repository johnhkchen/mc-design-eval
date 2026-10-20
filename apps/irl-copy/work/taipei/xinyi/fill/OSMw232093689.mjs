import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// YES世貿, Xinyi district, Taipei.
// Late-1990s to early-2000s speculative office tower: light stone-clad podium,
// tinted-glass curtain wall with white spandrel bands and light-grey mullions,
// one setback at storey 9, a flat roof with a penthouse core, and a mast.
// Roof slab at y=69 (lidar: about 69 blocks above lowest ground).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw232093689";
const W = 41, H = 81, D = 37;

const PODIUM_TOP = 20;   // stone-clad podium and shopfront storeys below y=20
const SETBACK = 45;      // upper tower erodes by 3 cells above this level
const ROOF = 69;         // main roof slab
const PENT_TOP = 73;     // penthouse top course
const MAST_BASE = 74;
const MAST_TOP = 79;
const LAMP_Y = 80;

const GLASS = "light_blue_stained_glass";
const PODIUM_GLASS = "cyan_stained_glass";
const FRAME = "light_gray_concrete";
const BAND = "white_concrete";
const STONE = "smooth_quartz";      // light stone cladding, reads as granite at this scale
const STONE_TRIM = "quartz_pillar"; // podium mullions and corners
const CORE = "light_gray_concrete";
const FOUND = "stone_bricks";

const key = (x, z) => `${x},${z}`;
const parse = (k) => k.split(",").map(Number);
const N4 = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

function erode(S) {
  const out = new Set();
  for (const k of S) {
    const [x, z] = parse(k);
    if (N4.every(([dx, dz]) => S.has(key(x + dx, z + dz)))) out.add(k);
  }
  return out;
}

// Neighbour directions that leave the set: the outward normals of an edge cell.
const missing = (S, x, z) => N4.filter(([dx, dz]) => !S.has(key(x + dx, z + dz)));

function hash(x, y, z) {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2246822519);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) % 100;
}

// ---- footprint and ground ----
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) {
    ground.set(key(x, z), Math.max(0, Math.round(gr)));
  }
}
const F = new Set(ground.keys());
let C = F;
for (let i = 0; i < 3; i++) C = erode(C);   // upper tower after the setback
let P = C;
for (let i = 0; i < 3; i++) P = erode(P);   // penthouse core

// ---- volume ----
const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: a north-facing (-z) edge cell nearest the footprint's centre in x.
let cxSum = 0;
for (const k of F) cxSum += parse(k)[0];
const cx = cxSum / F.size;
let doorKey = null, bestD = Infinity;
for (const k of F) {
  const [x, z] = parse(k);
  const m = missing(F, x, z);
  if (m.length === 1 && m[0][2] === "north") {
    const d = Math.abs(x - cx);
    if (d < bestD) { bestD = d; doorKey = k; }
  }
}
const doorX = doorKey ? parse(doorKey)[0] : -99;
const doorZ = doorKey ? parse(doorKey)[1] : -99;

// Warm light behind a glass face: shroomlight or glowstone one cell inside.
function lightInside(x, y, z, dx, dz, region, id) {
  if (y >= 41 && y <= 43) return;          // solid core band
  if (y % 5 === 0) return;                 // floor slab row
  const ix = x - dx, iz = z - dz;
  if (!region.has(key(ix, iz))) return;
  if (missing(region, ix, iz).length) return; // must not be an edge cell
  put(ix, y, iz, id);
}

// One course of an exterior wall cell at height y.
function wallSection(x, y, z, gr, miss, region) {
  const podium = y < PODIUM_TOP;
  if (miss.length >= 2) {                  // corner column, a stone pier with a cap
    put(x, y, z, podium ? STONE_TRIM : BAND);
    return;
  }
  const [dx, dz, name] = miss[0];
  const i = dx !== 0 ? z : x;             // position along this wall
  const r = y % 5;
  const h = hash(x, y, z);

  // Entrance portal on the podium front: a glass vestibule three cells wide,
  // a centre door, and a stone lintel carried by the flanking piers.
  if (podium && name === "north" && z === doorZ && Math.abs(x - doorX) <= 1) {
    if (y === gr + 3) { put(x, y, z, STONE_TRIM); return; }
    if (y === gr + 1 || y === gr + 2) {
      if (x === doorX) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, y, z, GLASS);
      }
      return;
    }
  }

  if (podium) {
    if (r === 0 || (y < 5 && r === 4)) {
      put(x, y, z, STONE);
    } else if (i % 4 === 0) {
      put(x, y, z, STONE_TRIM);
    } else {
      put(x, y, z, PODIUM_GLASS);
      if (h % 9 === 0) lightInside(x, y, z, dx, dz, region, "glowstone");
    }
    return;
  }

  // Tower curtain wall: a spandrel band every storey, mullions every third cell.
  if (r === 0) {
    put(x, y, z, BAND);
  } else if (i % 3 === 0) {
    put(x, y, z, FRAME);
  } else {
    put(x, y, z, GLASS);
    if (h % 31 === 0) lightInside(x, y, z, dx, dz, region, "shroomlight");
  }
}

// ---- build each footprint column ----
for (const k of F) {
  const [x, z] = parse(k);
  const gr = ground.get(k);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  const perimF = missing(F, x, z).length > 0;
  const inC = C.has(k);
  const inP = P.has(k);

  // Base and tower up to the setback; solid core band at 41..43 for interior cells.
  for (let y = gr; y <= 44; y++) {
    if (y === 44) {
      // Ledge level: a stone cap on the ledge, slab under the upper tower.
      put(x, y, z, inC ? CORE : "smooth_stone");
      continue;
    }
    if (perimF) {
      if (y === gr) put(x, y, z, STONE);
      else if (y === PODIUM_TOP) put(x, y, z, "smooth_stone");   // podium cornice
      else wallSection(x, y, z, gr, missing(F, x, z), F);
    } else {
      if (y === gr || y % 5 === 0) put(x, y, z, CORE);
      else if (y >= 41 && y <= 43) put(x, y, z, CORE);
    }
  }

  // Upper tower above the setback.
  if (inC) {
    const mC = missing(C, x, z);
    for (let y = SETBACK; y <= ROOF; y++) {
      if (y === ROOF) {
        put(x, y, z, mC.length ? "smooth_stone" : "gray_concrete");   // roof edge coping
        continue;
      }
      if (mC.length) wallSection(x, y, z, gr, mC, C);
      else if (y % 5 === 0) put(x, y, z, CORE);
    }
    if (mC.length) {
      put(x, 70, z, "smooth_stone");           // cornice course
      put(x, 71, z, BAND);                     // parapet
    }
  }

  // Penthouse core on the roof.
  if (inP) {
    const mP = missing(P, x, z);
    for (let y = 70; y <= PENT_TOP; y++) {
      if (y === PENT_TOP) put(x, y, z, BAND);
      else if (y === 70) put(x, y, z, mP.length ? "smooth_stone" : CORE);
      else if (mP.length) wallSection(x, y, z, gr, mP, P);
      else put(x, y, z, CORE);
    }
  }
}

// ---- mast and aviation light on the penthouse centre ----
if (P.size) {
  let sx = 0, sz = 0;
  for (const k of P) { const [x, z] = parse(k); sx += x; sz += z; }
  sx /= P.size; sz /= P.size;
  let best = null, bd = Infinity;
  for (const k of P) {
    const [x, z] = parse(k);
    const d = (x - sx) ** 2 + (z - sz) ** 2;
    if (d < bd) { bd = d; best = [x, z]; }
  }
  const [mx, mz] = best;
  for (let y = MAST_BASE; y <= MAST_TOP; y++) put(mx, y, mz, "iron_bars");
  put(mx, LAMP_Y, mz, "redstone_lamp", { lit: "true" });
}

g.save(`${DIR}/${ID}.nbt`);
