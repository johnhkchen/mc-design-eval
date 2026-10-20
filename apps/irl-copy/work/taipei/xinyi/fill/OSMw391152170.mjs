// 風雲頂客 (OSMw391152170): a c.1990s Taipei office block in white tile and blue glass.
// Ten storeys of 5 blocks, roof at y=54, plant penthouse to y=60 with a lightning rod.
// Two setbacks (y=35 and y=45) give a stepped Xinyi silhouette. Ground floor is a
// shopfront with an entrance canopy on the north face. Tiled spandrels, grey piers,
// blue glazing, and warm glowstone/shroomlight behind some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw391152170";
const W = 26, H = 66, D = 29;
const FLOORS = 10;
const FLOOR_H = 5;
const SETBACK_A = 7;   // storeys >= 7 are set back 2 cells
const SETBACK_B = 9;   // storeys >= 9 are set back 4 cells

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const parse = (k) => k.split(",").map(Number);
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const S = new Set(ground.keys());

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DNAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
function outs(set, x, z) {
  return DIRS.filter(([dx, dz]) => !set.has(key(x + dx, z + dz)));
}
function perimOf(set) {
  const p = new Set();
  for (const k of set) {
    const [x, z] = parse(k);
    if (outs(set, x, z).length) p.add(k);
  }
  return p;
}
function erode(set, r) {
  const out = new Set();
  for (const k of set) {
    const [x, z] = parse(k);
    let ok = true;
    for (let dx = -r; dx <= r && ok; dx++)
      for (let dz = -r; dz <= r && ok; dz++)
        if (!set.has(key(x + dx, z + dz))) ok = false;
    if (ok) out.add(k);
  }
  return out;
}
const isCorner = (o) =>
  o.length > 1 && o.some(([dx]) => dx !== 0) && o.some(([, dz]) => dz !== 0);
const hash = (x, z, k) => (x * 7 + z * 13 + k * 5) % 6;

// Footprint shapes per storey and their perimeters
const S2 = erode(S, 2);
const S3 = erode(S, 4);
const SH = [];
for (let k = 0; k < FLOORS; k++) SH[k] = k < SETBACK_A ? S : k < SETBACK_B ? S2 : S3;
const PER = SH.map(perimOf);
const EMPTY = new Set();

// 1. Foundations: solid from y 0 up to each cell's ground
for (const kk of S) {
  const [x, z] = parse(kk);
  const base = ground.get(kk);
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");
}

// 2. Storeys: floor slabs, walls, windows, piers, spandrels
for (let k = 0; k < FLOORS; k++) {
  const shape = SH[k], P = PER[k];
  const lo = k * FLOOR_H, hi = lo + FLOOR_H - 1;
  for (const kk of shape) {
    const [x, z] = parse(kk);
    const base = ground.get(kk);
    const o_ = outs(shape, x, z);
    const isP = P.has(kk);
    const corner = isCorner(o_);
    for (let y = Math.max(lo, base); y <= hi; y++) {
      const o = y - lo;
      if (!isP) {
        if (o === 0) put(x, y, z, "light_gray_concrete"); // interior floor slab
        continue;
      }
      if (corner) { put(x, y, z, "light_gray_concrete"); continue; }
      if (o === 0) { put(x, y, z, "smooth_stone"); continue; }          // storey line
      if (o === 4) { put(x, y, z, "white_terracotta"); continue; }      // spandrel
      if (k === 0 && o === 3) { put(x, y, z, "white_terracotta"); continue; } // shopfront fascia
      const [ox, oz] = o_[0];
      const t = ox !== 0 ? z : x;
      if (t % 3 === 0) {
        put(x, y, z, "light_gray_concrete"); // pier
      } else {
        put(x, y, z, "light_blue_stained_glass");
        if (o === 2 && hash(x, z, k) === 0) {
          const ix = x - ox, iz = z - oz;
          if (shape.has(key(ix, iz)) && !P.has(key(ix, iz)))
            put(ix, y, iz, "glowstone");
        } else if (o === 2 && hash(x, z, k) === 3) {
          const ix = x - ox, iz = z - oz;
          if (shape.has(key(ix, iz)) && !P.has(key(ix, iz)))
            put(ix, y, iz, "shroomlight");
        }
      }
    }
  }
}

// 3. Roofs of setbacks and top roof
for (let k = 1; k <= FLOORS; k++) {
  const prev = SH[k - 1];
  const cur = k <= FLOORS - 1 ? SH[k] : EMPTY;
  const y = k * FLOOR_H;
  for (const kk of prev) {
    if (cur.has(kk)) continue;
    const [x, z] = parse(kk);
    if (y < ground.get(kk)) continue;
    put(x, y, z, PER[k - 1].has(kk) ? "smooth_stone" : "light_gray_concrete");
  }
}

// 4. Terrace parapets
for (const kk of PER[0]) {
  const [x, z] = parse(kk);
  if (ground.get(kk) <= 36) put(x, 36, z, "light_gray_concrete");
}
for (const kk of PER[8]) {
  const [x, z] = parse(kk);
  if (ground.get(kk) <= 46) put(x, 46, z, "light_gray_concrete");
}

// 5. Top parapet and cornice on the crown tier
for (const kk of PER[9]) {
  const [x, z] = parse(kk);
  const corner = isCorner(outs(SH[9], x, z));
  for (let y = 51; y <= 53; y++)
    put(x, y, z, corner ? "light_gray_concrete" : "white_terracotta");
  put(x, 54, z, "smooth_stone");
}

// 6. Plant penthouse with glazed band and mast
const P3 = erode(SH[9], 3);
if (P3.size) {
  const PP = perimOf(P3);
  for (const kk of P3) {
    const [x, z] = parse(kk);
    put(x, 55, z, "light_gray_concrete");
  }
  for (const kk of PP) {
    const [x, z] = parse(kk);
    const o_ = outs(P3, x, z);
    const corner = isCorner(o_);
    const [ox, oz] = o_[0];
    const t = ox !== 0 ? z : x;
    for (let y = 51; y <= 54; y++) {
      if (corner) put(x, y, z, "light_gray_concrete");
      else if (y === 51 || y === 54) put(x, y, z, "white_terracotta");
      else if (t % 3 === 0) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, "light_blue_stained_glass");
    }
  }
  let cx = 0, cz = 0;
  for (const kk of P3) { const [x, z] = parse(kk); cx += x; cz += z; }
  cx /= P3.size; cz /= P3.size;
  let best = null, bd = Infinity;
  for (const kk of P3) {
    const [x, z] = parse(kk);
    const d = (x - cx) ** 2 + (z - cz) ** 2;
    if (d < bd) { bd = d; best = [x, z]; }
  }
  for (let y = 56; y <= 60; y++)
    put(best[0], y, best[1], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// 7. Entrance: iron door on the north face (nearest the centre), with canopy
let cxAll = 0;
for (const kk of S) cxAll += parse(kk)[0];
cxAll /= S.size;
let door = null, dd = Infinity;
for (const kk of PER[0]) {
  const [x, z] = parse(kk);
  const o_ = outs(SH[0], x, z);
  if (isCorner(o_)) continue;
  if (!o_.some(([dx, dz]) => dx === 0 && dz === -1)) continue;
  const d = Math.abs(x - cxAll);
  if (d < dd) { dd = d; door = [x, z, [0, -1]]; }
}
if (!door) {
  for (const kk of PER[0]) {
    const [x, z] = parse(kk);
    const o_ = outs(SH[0], x, z);
    if (!isCorner(o_)) { door = [x, z, o_[0]]; break; }
  }
}
if (door) {
  const [x, z, [ox, oz]] = door;
  const base = ground.get(key(x, z));
  const facing = DNAME[`${ox},${oz}`];
  put(x, base, z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, base + 1, z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // canopy: attached above the door, two deep, three wide
  const ax = ox !== 0 ? 0 : 1, az = ox !== 0 ? 1 : 0;
  for (let a = -1; a <= 1; a++) {
    for (let dp = 1; dp <= 2; dp++) {
      const cx2 = x + ox * dp + ax * a, cz2 = z + oz * dp + az * a;
      if (S.has(key(cx2, cz2))) continue;
      put(cx2, base + 3, cz2, "smooth_stone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
