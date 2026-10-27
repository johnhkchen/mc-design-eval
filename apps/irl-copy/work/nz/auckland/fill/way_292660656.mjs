// A 1930s concrete-frame commercial block on the Mt Eden side of Newton: four storeys on a ground floor
// shopfront, cream plaster on a basalt plinth, quartz string courses and a parapet, flat roof with a plant room.
// Massing: lidar roof heights are snapped to four storey tiers (18, 15, 11, 7), so every tier stands on the
// columns below it; a downhill side (ground 0 to 2) gets an extra lower-ground storey, as the lidar asks.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292660656.cells.json`, "utf8"));

const W = 51, H = 31, D = 42;

// storey tiers: a lidar roof snaps to the nearest tier at or above it (flat tiers, no noise)
const tier = (r) => (r >= 16 ? 18 : r >= 12 ? 15 : r >= 8 ? 11 : 7);

// storey bands on absolute lines (floors at 3, 7, 11, 15); rows name each block's role down the band
const BANDS = [
  { b0: 0, b1: 3, rows: ["plinth", "win", "win"] },
  { b0: 3, b1: 7, rows: ["sill", "shop", "shop", "transom"] },
  { b0: 7, b1: 11, rows: ["course", "win", "win", "spandrel"] },
  { b0: 11, b1: 15, rows: ["course", "win", "win", "spandrel"] },
  { b0: 15, b1: 18, rows: ["course", "win", "cap"] },
];
const bandAt = (y) => BANDS.find((b) => y >= b.b0 && y < b.b1);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const NAMES = Object.keys(DIRS);

const cellMap = new Map();
for (const [x, z, G, R] of cells) cellMap.set(`${x},${z}`, { x, z, G, R: tier(R) });
const cellList = [...cellMap.values()];
const at = (x, z) => cellMap.get(`${x},${z}`);

// a side of a cell is open to air at height y when the neighbour is outside the footprint or its tier is lower;
// nothing above ground (y < G) is exposed, so the foundation stays buried
function exposed(x, z, y, dir) {
  const c = at(x, z); if (!c || y < c.G) return false;
  const [dx, dz] = DIRS[dir]; const nb = at(x + dx, z + dz);
  return !nb || y >= nb.R;
}
const faces = (x, z, y) => NAMES.filter((d) => exposed(x, z, y, d));

// entrances: the two faces with the most single-face ground-floor cells; the middle cell of each run
const byFace = {};
for (const c of cellList) {
  if (c.G > 4 || c.R <= 5) continue;
  const f = faces(c.x, c.z, 4);
  if (f.length === 1) (byFace[f[0]] ??= []).push(c);
}
const doors = new Map();   // "x,z" -> outward dir
const canopy = new Set();  // "x,z" cells carrying a canopy slab at y 6
for (const [dir] of Object.entries(byFace).sort((a, b) => b[1].length - a[1].length).slice(0, 2)) {
  const run = byFace[dir].sort((a, b) => (dir === "north" || dir === "south" ? a.x - b.x : a.z - b.z));
  const e = run[Math.floor(run.length / 2)];
  doors.set(`${e.x},${e.z}`, dir);
  for (const c of run) {
    const u = dir === "north" || dir === "south" ? c.x : c.z;
    const eu = dir === "north" || dir === "south" ? e.x : e.z;
    if (Math.abs(u - eu) <= 1) canopy.add(`${c.x},${c.z}`);
  }
}

// the block of one footprint column at height y
function blockFor(c, y, stats) {
  if (y < c.G) return ["polished_andesite"];
  const fs = faces(c.x, c.z, y);
  const cap = y === c.R - 1;
  if (!fs.length) return cap ? ["gray_concrete"] : ["smooth_quartz"];
  if (cap) return ["quartz_bricks"];
  const d = fs.length === 1 ? fs[0] : null;               // corners (two open faces) are piers
  const band = bandAt(y); const type = band.rows[y - band.b0];
  if (type === "plinth" || type === "sill") return ["polished_andesite"];
  if (type === "course") return ["quartz_bricks"];
  const k = `${c.x},${c.z}`;
  if (d && doors.get(k) === d && (y === 4 || y === 5)) {
    stats.doors++;
    return ["dark_oak_door", { facing: d, half: y === 4 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (canopy.has(k) && y === 6) return ["dark_oak_slab", { type: "bottom", waterlogged: "false" }];
  const u = d === "north" || d === "south" ? c.x : c.z;
  if (!d || u % 3 === 0) return ["quartz_pillar", { axis: "y" }];   // piers every third cell, corners
  if (type === "win") {
    stats.windows++;
    const s = d === "north" || d === "south"
      ? { north: "false", south: "false", east: "true", west: "true" }
      : { north: "true", south: "true", east: "false", west: "false" };
    return ["glass_pane", { ...s, waterlogged: "false" }];
  }
  if (type === "shop") { stats.shop++; return ["glass"]; }
  return null;                                             // transom or spandrel: plain plaster
}

const g = new Voxels([W, H, D]);
const stats = { doors: 0, windows: 0, shop: 0, lights: 0, plant: 0 };

// pass 1: the solid massing, from y 0 to each column's tier, facade features on the open faces
for (const c of cellList) {
  for (let y = 0; y < c.R; y++) {
    const b = blockFor(c, y, stats);
    if (b) g.set(c.x, y, c.z, b[0], b[1]);
    else g.set(c.x, y, c.z, "smooth_quartz");
  }
}

// pass 2: an air gap behind each glass bay (one cell in, only where that cell is enclosed), some lit warm
for (const c of cellList) {
  for (let y = c.G; y < c.R; y++) {
    const fs = faces(c.x, c.z, y);
    if (fs.length !== 1) continue;
    const d = fs[0]; const band = bandAt(y); const type = band.rows[y - band.b0];
    const isDoor = doors.get(`${c.x},${c.z}`) === d && (y === 4 || y === 5);
    if (!isDoor && type !== "win" && type !== "shop") continue;
    const [dx, dz] = DIRS[d];
    const ix = c.x - dx, iz = c.z - dz; const inner = at(ix, iz);
    if (!inner || y < inner.G || y >= inner.R || faces(ix, iz, y).length) continue;
    const lit = !isDoor && (c.x * 7 + c.z * 5 + y * 3) % 4 === 0;
    if (lit) { g.set(ix, y, iz, y < 7 ? "shroomlight" : "glowstone"); stats.lights++; }
    else g.set(ix, y, iz, "air");
  }
}

// roof: a 3x3 plant room on the flat top tier, near the middle of the roof, standing on the membrane
const top = cellList.filter((c) => c.R === 18);
const mx = top.reduce((s, c) => s + c.x, 0) / top.length, mz = top.reduce((s, c) => s + c.z, 0) / top.length;
const inTop = (x, z) => at(x, z)?.R === 18 && !faces(x, z, 17).length;
let best = null;
for (const c of top) {
  let ok = true;
  for (let dx = -2; dx <= 2 && ok; dx++) for (let dz = -2; dz <= 2 && ok; dz++) if (!inTop(c.x + dx, c.z + dz)) ok = false;
  if (!ok) continue;
  const dd = (c.x - mx) ** 2 + (c.z - mz) ** 2;
  if (!best || dd < best.dd) best = { x: c.x, z: c.z, dd };
}
if (best) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    g.set(best.x + dx, 18, best.z + dz, "light_gray_concrete");
    g.set(best.x + dx, 19, best.z + dz, "smooth_stone");
    stats.plant++;
  }
}

const out = g.save(`${DIR}/way_292660656.nbt`);
console.log(JSON.stringify({ ...stats, ...out, columns: cellList.length, tiers: [...new Set(cellList.map((c) => c.R))] }));
