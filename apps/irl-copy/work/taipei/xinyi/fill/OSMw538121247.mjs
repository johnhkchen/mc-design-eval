import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538121247.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538121247.nbt";
const W = 28, H = 23, D = 18;

// Era: 1980s-90s low-rise commercial block, two storeys of pale concrete with
// shopfronts at street level, a tiled-looking stone parapet and a roof bulkhead.
const FOUNDATION = "stone_bricks";
const BASE = "polished_andesite";
const STOREY_BAND = "smooth_stone";
const WALL = "white_concrete";
const PILLAR_GROUND = "stone_bricks";
const SHOP_GLASS = "light_blue_stained_glass";
const PANE = "light_blue_stained_glass_pane";
const PARAPET = "stone_bricks";
const ROOF = "light_gray_concrete";
const FLOOR = "smooth_stone";

const raw = JSON.parse(readFileSync(SRC, "utf8"));
const cellsArr = Array.isArray(raw) ? raw : raw.cells;
const ground = new Map();
for (const [x, z, gy] of cellsArr) ground.set(`${x},${z}`, Math.round(gy));

const inside = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward face of a boundary cell (null for interior cells).
const faceOf = (x, z) => {
  if (!inside(x, z - 1)) return "north";
  if (!inside(x, z + 1)) return "south";
  if (!inside(x - 1, z)) return "west";
  if (!inside(x + 1, z)) return "east";
  return null;
};
const missingCount = (x, z) =>
  [!inside(x, z - 1), !inside(x, z + 1), !inside(x - 1, z), !inside(x + 1, z)].filter(Boolean).length;

const alongOf = (face, x, z) => (face === "north" || face === "south" ? x : z);
const isPillar = (u, corner) => corner || ((((u % 3) + 3) % 3) === 0);
const inwardOf = {
  north: [0, 1],
  south: [0, -1],
  west: [1, 0],
  east: [-1, 0],
};
const paneProps = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- 1. Foundation: solid from y0 up to each cell's ground ----
for (const [x, z, gr] of cellsArr) {
  const b = Math.round(gr);
  for (let y = 0; y < b; y++) put(x, y, z, FOUNDATION);
}

// ---- 2. Interior: floor slabs per storey, air between them ----
for (const [x, z, gr] of cellsArr) {
  const b = Math.round(gr);
  if (faceOf(x, z)) continue;
  put(x, b + 0, z, FLOOR);
  put(x, b + 5, z, FLOOR);
  put(x, b + 10, z, FLOOR);
  put(x, b + 11, z, ROOF);
}

// ---- 3. Facade: base course, shopfront, storey lines, windows, parapet ----
const faceCounts = { north: 0, south: 0, west: 0, east: 0 };
for (const [x, z] of cellsArr.map(([a, c]) => [a, c])) {
  const f = faceOf(x, z);
  if (f) faceCounts[f]++;
}

for (const [x, z, gr] of cellsArr) {
  const b = Math.round(gr);
  const face = faceOf(x, z);
  if (!face) continue;
  const corner = missingCount(x, z) >= 2;
  const u = alongOf(face, x, z);
  const pillar = isPillar(u, corner);

  put(x, b + 0, z, BASE);
  // Ground floor: stone piers and full shop glass.
  for (let h = 1; h <= 3; h++) {
    if (pillar) put(x, b + h, z, PILLAR_GROUND);
    else put(x, b + h, z, SHOP_GLASS);
  }
  put(x, b + 4, z, STOREY_BAND);
  // Upper storey: spandrels, white mullions, glass panes.
  put(x, b + 5, z, WALL);
  for (let h = 6; h <= 8; h++) {
    if (pillar) put(x, b + h, z, WALL);
    else put(x, b + h, z, PANE, paneProps(face));
  }
  put(x, b + 9, z, WALL);
  put(x, b + 10, z, STOREY_BAND);
  put(x, b + 11, z, PARAPET);
}

// ---- 4. Entrance on the longest street-facing side ----
const mainFace = Object.keys(faceCounts).reduce((a, c) => (faceCounts[c] > faceCounts[a] ? c : a), "south");
const onMain = cellsArr
  .map(([x, z, gr]) => ({ x, z, b: Math.round(gr) }))
  .filter((c) => faceOf(c.x, c.z) === mainFace && missingCount(c.x, c.z) < 2)
  .sort((p, q) => alongOf(mainFace, p.x, p.z) - alongOf(mainFace, q.x, q.z));
if (onMain.length) {
  let pick = onMain[Math.floor(onMain.length / 2)];
  const idx = onMain.indexOf(pick);
  for (let k = 0; k < onMain.length; k++) {
    const cand = onMain[(idx + k) % onMain.length];
    if (!isPillar(alongOf(mainFace, cand.x, cand.z), false)) { pick = cand; break; }
  }
  const doorProps = (half) => ({
    facing: mainFace,
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  put(pick.x, pick.b + 1, pick.z, "dark_oak_door", doorProps("lower"));
  put(pick.x, pick.b + 2, pick.z, "dark_oak_door", doorProps("upper"));
}

// ---- 5. Warm lights behind some windows (glowstone at street level, shroomlight upstairs) ----
for (const [x, z, gr] of cellsArr) {
  const b = Math.round(gr);
  const face = faceOf(x, z);
  if (!face || missingCount(x, z) >= 2) continue;
  const u = alongOf(face, x, z);
  if (isPillar(u, false)) continue;
  const [dx, dz] = inwardOf[face];
  const ix = x + dx, iz = z + dz;
  if (!inside(ix, iz) || faceOf(ix, iz)) continue;
  const hsh = (x * 31 + z * 17 + u * 7) % 9;
  if (hsh === 0) put(ix, b + 2, iz, "glowstone");
  else if (hsh === 4) put(ix, b + 7, iz, "shroomlight");
}

// ---- 6. Roof: stair bulkhead near the centre plus a few AC units ----
let sumX = 0, sumZ = 0, n = 0;
for (const [x, z] of cellsArr.map(([a, c]) => [a, c])) { sumX += x; sumZ += z; n++; }
const cx = sumX / n, cz = sumZ / n;

let best = null;
for (const [x, z, gr] of cellsArr) {
  let ok = true;
  for (let dx = -1; dx <= 1 && ok; dx++)
    for (let dz = -1; dz <= 1 && ok; dz++) {
      const px = x + dx, pz = z + dz;
      if (!inside(px, pz) || faceOf(px, pz)) ok = false;
    }
  if (!ok) continue;
  const d = Math.hypot(x - cx, z - cz);
  if (!best || d < best.d) best = { x, z, b: Math.round(gr), d };
}
if (best) {
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      put(best.x + dx, best.b + 12, best.z + dz, WALL);
      put(best.x + dx, best.b + 13, best.z + dz, PARAPET);
    }
}
for (const [x, z, gr] of cellsArr) {
  const b = Math.round(gr);
  if (faceOf(x, z)) continue;
  if (x % 6 !== 2 || z % 5 !== 1) continue;
  if (best && Math.abs(x - best.x) <= 2 && Math.abs(z - best.z) <= 2) continue;
  put(x, b + 12, z, ROOF);
}

g.save(OUT);
