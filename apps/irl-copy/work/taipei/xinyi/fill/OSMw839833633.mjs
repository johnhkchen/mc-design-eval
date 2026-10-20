import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833633";
const W = 21, H = 23, D = 30;
const ROOF = 11;          // parapet course; roof deck sits at y 10
const CORNICE = 10;
const STOREY2 = 5;        // second-floor line

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => x + "," + z;
const ground = new Map();
for (const c of raw) {
  const [x, z, gr] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), Math.min(9, Math.max(0, Math.round(gr))));
}
const inFp = (x, z) => ground.has(key(x, z));
const outsOf = (x, z) => {
  const o = [];
  if (!inFp(x, z - 1)) o.push("N");
  if (!inFp(x, z + 1)) o.push("S");
  if (!inFp(x - 1, z)) o.push("W");
  if (!inFp(x + 1, z)) o.push("E");
  return o;
};
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const vox = new Voxels([W, H, D]);
const set = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) vox.set(x, y, z, id, p); else vox.set(x, y, z, id);
};
// glass pane connections: along x (ns face) or along z (ew face)
const pane = (alongX) => alongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// choose entrance: north-facing perimeter cell nearest the middle, low ground preferred
let doorKey = null, bestScore = Infinity;
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!outsOf(x, z).includes("N") || gr > 4) continue;
  const score = Math.abs(x - 10) + 3 * gr;
  if (score < bestScore) { bestScore = score; doorKey = k; }
}

// ---- pass 1: foundations, floors, facades, roof deck ----
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const outs = outsOf(x, z);
  const perim = outs.length > 0;
  const corner = outs.length >= 2;
  const alongX = outs.includes("N") || outs.includes("S");
  const u = alongX ? x : z;

  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");   // foundation

  if (!perim) {
    set(x, gr, z, "smooth_stone");                              // ground floor slab
    if (STOREY2 > gr) set(x, STOREY2, z, "smooth_stone");       // second floor slab
    set(x, CORNICE, z, "light_gray_concrete");                  // roof deck
    continue;
  }

  for (let y = gr; y <= ROOF; y++) {
    let id, p;
    if (y === gr) id = "stone_bricks";                          // base course
    else if (y === ROOF) id = "stone_brick_wall";               // parapet
    else if (y === CORNICE) id = "smooth_stone";                // cornice
    else if (y === 9) id = "white_concrete";                    // spandrel
    else if (y === STOREY2) id = "smooth_stone";                // storey line
    else {
      const groundRow = y < STOREY2;
      const isWin = !corner && (u % 3) !== 0;
      if (!isWin) id = "white_concrete";
      else if (groundRow) id = "glass";
      else { id = "gray_stained_glass_pane"; p = pane(alongX); }
    }
    set(x, y, z, id, p);
  }
}

// ---- pass 2: entrance with door, lintel and transom ----
if (doorKey) {
  const [dx, dz] = doorKey.split(",").map(Number);
  const gr = ground.get(doorKey);
  const base = { facing: "north", hinge: "left", open: "false", powered: "false" };
  set(dx, gr + 1, dz, "oak_door", { ...base, half: "lower" });
  set(dx, gr + 2, dz, "oak_door", { ...base, half: "upper" });
  set(dx, gr + 3, dz, "smooth_stone");
  set(dx, gr + 4, dz, "glass");
}

// ---- pass 3: warm lights behind some windows (inside air cell) ----
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const outs = outsOf(x, z);
  if (outs.length !== 1) continue;                  // plain facade cells only
  const o = outs[0];
  const alongX = o === "N" || o === "S";
  const u = alongX ? x : z;
  if ((u % 3) === 0) continue;                      // piers
  const [ix, iz] = [x + INWARD[o][0], z + INWARD[o][1]];
  if (!inFp(ix, iz)) continue;
  const ig = ground.get(key(ix, iz));
  if (u % 6 === 2 && ig < 7) set(ix, 7, iz, "glowstone");           // upper window
  if (u % 6 === 1 && ig < 2 && gr < 2) set(ix, 2, iz, "shroomlight"); // shopfront
}

// ---- pass 4: roof equipment on interior roof deck ----
const interior3x3 = (cx, cz) => {
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) {
    const x = cx + dx, z = cz + dz;
    if (!inFp(x, z) || outsOf(x, z).length) return false;
  }
  return true;
};
const cands = [];
for (let cx = 0; cx < W - 2; cx++) for (let cz = 0; cz < D - 2; cz++)
  if (interior3x3(cx, cz)) cands.push([cx, cz]);
cands.sort((a, b) => Math.hypot(a[0] + 1 - 10, a[1] + 1 - 14) - Math.hypot(b[0] + 1 - 10, b[1] + 1 - 14));

const tanks = [];
for (const c of cands) {
  if (tanks.length === 2) break;
  if (tanks.every(t => Math.hypot(t[0] - c[0], t[1] - c[1]) >= 7)) tanks.push(c);
}
const inTank = (x, z) => tanks.some(([cx, cz]) => x >= cx && x <= cx + 2 && z >= cz && z <= cz + 2);

for (const [cx, cz] of tanks) {
  for (let x = cx; x <= cx + 2; x++) for (let z = cz; z <= cz + 2; z++) {
    for (let y = 11; y <= 13; y++) {
      const centre = x === cx + 1 && z === cz + 1;
      if (!centre) set(x, y, z, "light_gray_concrete");
    }
    set(x, 14, z, "iron_block");
  }
}

// antenna mast on a free interior cell
let mast = null;
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (outsOf(x, z).length === 0 && !inTank(x, z)) {
    if (!mast || x + z > mast[0] + mast[1]) mast = [x, z];
  }
}
if (mast) {
  for (let y = 11; y <= 14; y++) set(mast[0], y, mast[1], "iron_bars");
  set(mast[0], 15, mast[1], "lightning_rod");
}

vox.save(`${DIR}/${ID}.nbt`);
