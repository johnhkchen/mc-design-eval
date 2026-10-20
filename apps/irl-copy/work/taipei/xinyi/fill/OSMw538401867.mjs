import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538401867";
const W = 21, H = 23, D = 13;

// Materials: late-1980s Xinyi commercial block, painted concrete with stone plinth,
// light-gray storey bands, tinted glass in aluminium-look frames, flat roof with parapet.
const BASE = "stone_bricks";
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const SLAB = "smooth_stone";
const ROOF = "gray_concrete";
const GLASS = "light_blue_stained_glass_pane";

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// ---- read footprint: [x, z, ground] per cell ----
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? raw.footprint ?? []);
const occ = new Set();
const grd = new Map();
const key = (x, z) => x * 100 + z;
for (const c of list) {
  const x = Math.round(Array.isArray(c) ? c[0] : c.x);
  const z = Math.round(Array.isArray(c) ? c[1] : c.z);
  const gv = Math.round(Array.isArray(c) ? c[2] : c.ground);
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  occ.add(key(x, z));
  grd.set(key(x, z), Math.max(0, gv || 0));
}
const has = (x, z) => occ.has(key(x, z));
const groundAt = (x, z) => grd.get(key(x, z)) ?? 0;
const faces = (x, z) => ({
  N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z),
});

// door sits at the median x of the south (+z) facade
const southXs = [];
for (const k of occ) {
  const x = Math.floor(k / 100), z = k % 100;
  if (!has(x, z + 1)) southXs.push(x);
}
southXs.sort((a, b) => a - b);
const doorX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -1;

// ---- pass 1: foundation, floors, body, roof, parapet ----
for (const k of occ) {
  const x = Math.floor(k / 100), z = k % 100;
  const f = faces(x, z);
  const missing = Object.values(f).filter(Boolean).length;
  const bnd = missing > 0;
  const gr = groundAt(x, z);
  const b = Math.min(gr, 4); // body base (ground-floor slab level)

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);
  // ground-floor slab / plinth course
  put(x, b, z, bnd ? BASE : SLAB);

  // first-floor slab
  if (5 > b) put(x, 5, z, bnd ? BAND : SLAB);

  // exterior walls, storey by storey (air behind them stays empty)
  if (bnd) {
    for (let y = b + 1; y <= 9; y++) put(x, y, z, WALL);
    put(x, 9, z, BAND);            // upper storey line
    if (5 > b) put(x, 5, z, BAND); // floor line on facade
    put(x, 10, z, BAND);           // cornice
    put(x, 11, z, WALL);           // parapet
  } else {
    put(x, 10, z, SLAB);           // roof deck
  }
}

// ---- pass 2: facade articulation, shopfront, door, warm light ----
for (const k of occ) {
  const x = Math.floor(k / 100), z = k % 100;
  const f = faces(x, z);
  const missing = Object.values(f).filter(Boolean).length;
  if (missing === 0) continue;
  if (missing > 1) continue; // corner pillar stays solid wall
  const gr = groundAt(x, z);
  const b = Math.min(gr, 4);
  const gTop = Math.min(b + 3, 4);

  const dir = f.N ? "N" : f.S ? "S" : f.W ? "W" : "E";
  const alongX = dir === "N" || dir === "S";
  const idx = alongX ? x : z;
  const inX = x + (f.W ? 1 : f.E ? -1 : 0);
  const inZ = z + (f.N ? 1 : f.S ? -1 : 0);
  const inward = has(inX, inZ) && !faces(inX, inZ).N && !(Object.values(faces(inX, inZ)).some(Boolean));

  const pane = alongX
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  // upper storeys: window column every third cell, lit behind the glass
  if (idx % 3 === 1) {
    for (let y = 6; y <= 8; y++) put(x, y, z, GLASS, pane);
    if (inward) {
      if (idx % 6 === 1) put(inX, 6, inZ, "lantern", { hanging: "false", waterlogged: "false" });
      else if (idx % 6 === 4) put(inX, 7, inZ, "glowstone");
    }
  }

  // ground storey
  if (dir === "S") {
    const isDoor = idx === doorX && b + 2 <= 4;
    for (let y = b + 1; y <= gTop; y++) {
      if (isDoor && (y === b + 1 || y === b + 2)) continue;
      if (idx % 3 !== 0) put(x, y, z, GLASS, pane); // continuous shopfront, pillars every third cell
    }
    if (isDoor) {
      const dp = { facing: "south", hinge: "left", open: "false", powered: "false" };
      put(x, b + 1, z, "dark_oak_door", { ...dp, half: "lower" });
      put(x, b + 2, z, "dark_oak_door", { ...dp, half: "upper" });
      if (inward) put(inX, b + 1, inZ, "lantern", { hanging: "false", waterlogged: "false" });
    }
  } else if (idx % 3 === 1 && b + 1 <= gTop) {
    for (let y = b + 1; y <= gTop; y++) put(x, y, z, GLASS, pane);
  }
}

// ---- roof plant: two small mechanical boxes on the roof ----
for (const k of occ) {
  const x = Math.floor(k / 100), z = k % 100;
  if (faces(x, z).N || faces(x, z).S || faces(x, z).W || faces(x, z).E) continue;
  if (x % 7 === 3 && z % 5 === 2) {
    put(x, 11, z, ROOF);
    put(x, 12, z, ROOF);
  }
}

g.save(`${DIR}/${ID}.nbt`);
