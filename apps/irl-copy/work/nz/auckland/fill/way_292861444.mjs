// Way 292861444, Mt Eden / Newton side of the CBD: a 1970s seven-storey concrete office block. A stepped tower on the
// lidar's 28-block roof with setbacks at 24, 20 and 16, and a two-storey wing (roof 10) on its east side. Concrete
// frame: white piers and light floor lines, teal glazing in ribbon windows set one block into an air gap, a
// glazed shopfront with a dark plinth on the ground storey, an entrance recess with a lintel, glowstone lit in some
// windows, a plant room on the tower roof, and moss on the setback terraces.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861444.cells.json`, "utf8"));
const SIZE = [33, 41, 32];

// footprint: "x,z" -> { g: lowest-ground surface under the cell, r: lidar roof, t: the tier roof we build to }
const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { g, r, t: 0 });
const cell = (x, z) => foot.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// Lidar noise into flat tiers: snap each roof to 28 (tower), 24, 20, 16 or 10 (wing), then one majority pass so
// the tier edges run straight. A tier is never lower than one storey above its own ground.
const snap = (r) => (r >= 27 ? 28 : r >= 23 ? 24 : r >= 19 ? 20 : r >= 15 ? 16 : 10);
for (const c of foot.values()) c.t = Math.max(snap(c.r), c.g + 4);
const majority = new Map();
for (const [key, c] of foot) {
  const [x, z] = key.split(",").map(Number);
  const votes = [[0, 0], ...DIRS].map(([dx, dz]) => cell(x + dx, z + dz)).filter(Boolean).map((n) => n.t);
  let best = c.t, most = 0;
  for (const t of new Set(votes)) { const n = votes.filter((v) => v === t).length; if (n > most) { best = t; most = n; } }
  majority.set(key, most >= 3 ? best : c.t);
}
for (const [key, c] of foot) c.t = Math.max(majority.get(key), c.g + 4);

// solid massing: every column is solid from y 0 to its tier (foundation below its ground, building above)
const solid = (x, y, z) => { const c = cell(x, z); return !!c && y >= 0 && y < c.t; };
const exposedAt = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));

// the entrance: the longest run of ground-storey street faces (the first storey above each cell's ground), door in the
// middle of it at that cell's ground, so it stands on the slope where the street meets the building
function findEntrance() {
  const faceAt = (x, z) => { const c = cell(x, z); if (!c) return null; const e = exposedAt(x, c.g + 1, z); return e.length && solid(x - e[0][0], c.g + 1, z - e[0][1]) ? e[0] : null; };
  const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
  let best = null;
  for (const key of foot.keys()) {
    const [x, z] = key.split(",").map(Number);
    const d = faceAt(x, z); if (!d) continue;
    const [sx, sz] = d[0] ? [0, 1] : [1, 0];                    // along the face
    if (same(faceAt(x - sx, z - sz), d)) continue;              // only start a run at its first cell
    let n = 0; while (same(faceAt(x + sx * n, z + sz * n), d)) n++;
    if (!best || n > best.n) best = { x, z, d, sx, sz, n };
  }
  if (!best || best.n < 3) return null;
  const k = Math.floor(best.n / 2);
  const x = best.x + best.sx * k, z = best.z + best.sz * k;
  return { x, z, d: best.d, yd: cell(x, z).g };
}

// the facade skin of one solid block: foundation, cornice, quoins, then the storey pattern on a face
function skin(x, y, z, c) {
  if (y < c.g) return ["stone_bricks"];                          // foundation under the lidar ground
  if (y === c.t - 1) return ["smooth_stone"];                    // roof surface and cornice
  const e = exposedAt(x, y, z);
  if (!e.length) return ["white_concrete"];                      // solid core
  if (e.length > 1) return ["smooth_stone"];                     // corner quoins
  const [dx, dz] = e[0];
  const pier = (dx ? z : x) % 3 === 0;                           // a pier every third block along the face
  if (y === 0) return ["polished_andesite"];                     // plinth
  if (y < 4) {                                                   // ground storey: shopfront with a fascia
    if (y === 3) return ["smooth_stone"];
    return pier ? ["polished_andesite"] : ["light_blue_stained_glass"];
  }
  const row = y % 4;                                             // 4-block storeys: floor line, two glazed rows, head course
  if (row === 0) return ["light_gray_concrete"];
  if (row === 3) return ["smooth_stone"];
  return pier ? ["white_concrete"] : ["cyan_stained_glass"];
}

const v = new Voxels(SIZE);
const door = findEntrance();
const windows = [];
for (const [key, c] of foot) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < c.t; y++) {
    if (door && x === door.x && z === door.z && (y === door.yd || y === door.yd + 1)) continue;   // the recessed doorway stays air
    const [block, state] = skin(x, y, z, c);
    if (block.endsWith("glass")) windows.push({ x, y, z });
    v.set(x, y, z, block, state);
  }
}

// each window is glass with an air gap behind it; some gaps hold glowstone
for (const w of windows) {
  const [dx, dz] = exposedAt(w.x, w.y, w.z)[0];
  const lit = (w.x * 3 + w.z * 5 + Math.floor(w.y / 4)) % 7 === 0;
  v.set(w.x - dx, w.y, w.z - dz, lit ? "glowstone" : "air");
}

// the entrance: iron doors one block behind the recess, a hanging lantern under the lintel
if (door) {
  const ix = door.x - door.d[0], iz = door.z - door.d[1], facing = FACING[door.d.join(",")];
  v.set(ix, door.yd, iz, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  v.set(ix, door.yd + 1, iz, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  v.set(door.x, door.yd + 1, door.z, "lantern", { hanging: "true", waterlogged: "false" });
}

// the parapet and terraces: a coping slab on every edge that drops away, moss on a setback's exposed top
for (const [key, c] of foot) {
  const [x, z] = key.split(",").map(Number);
  const nb = DIRS.map(([dx, dz]) => cell(x + dx, z + dz));
  const outside = nb.some((n) => !n), lower = nb.some((n) => n && n.t < c.t), higher = nb.some((n) => n && n.t > c.t);
  if (outside || lower) v.set(x, c.t, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  else if (higher) v.set(x, c.t, z, "moss_carpet");
}

// roof plant: a 3x3 plant room with a grille on the tower (nearest its centre), and a lift overrun on the same roof
const roofAt = (x, z, t, r) => { for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) { const n = cell(x + dx, z + dz); if (!n || n.t !== t) return false; } return true; };
const tower = [...foot.entries()].filter(([, c]) => c.t === 28).map(([k]) => k.split(",").map(Number));
const cxT = tower.reduce((s, [x]) => s + x, 0) / tower.length, czT = tower.reduce((s, [, z]) => s + z, 0) / tower.length;
const plant = tower.filter(([x, z]) => roofAt(x, z, 28, 1)).sort((a, b) => Math.hypot(a[0] - cxT, a[1] - czT) - Math.hypot(b[0] - cxT, b[1] - czT))[0];
if (plant) {
  const [px, pz] = plant;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    v.set(px + dx, 28, pz + dz, "light_gray_concrete"); v.set(px + dx, 29, pz + dz, "light_gray_concrete");
    v.set(px + dx, 30, pz + dz, "iron_bars");
  }
  const lift = tower.find(([x, z]) => Math.abs(x - px) >= 3 && roofAt(x, z, 28, 0) && DIRS.every(([dx, dz]) => cell(x + dx, z + dz)?.t === 28));
  if (lift) { for (let y = 28; y <= 30; y++) v.set(lift[0], y, lift[1], "stone_bricks"); v.set(lift[0], 31, lift[1], "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); }
}

const out = v.save(`${DIR}/way_292861444.nbt`);
console.log(JSON.stringify({ cells: cells.length, windows: windows.length, door, ...out }));
