// Pitt Street Fire Station, Auckland: a 1920s brick fire station. Two-storey apparatus wing (red doors on the street
// face), a three- and four-storey office block behind it, and a six-storey hose-drying tower with louvred top storey
// and a bell. Lidar roof heights are snapped to flat tiers (9, 13, 17, 21, 25); each cell's storeys stack from its own
// ground (g), with a solid foundation below. Walls are 1 block thick around the footprint and every step, interior air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162153622.cells.json", "utf8"));

const key = (x, z) => `${x},${z}`;
const C = new Map();
for (const [x, z, g, r] of cells) C.set(key(x, z), { x, z, g, r });

// the lidar roof, smoothed by the median of its 3x3 neighbourhood, then snapped to a flat tier (blocks above y 0)
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
const tier = (r) => (r <= 11 ? 9 : r <= 14 ? 13 : r <= 19 ? 17 : r <= 22 ? 21 : 25);
for (const c of C.values()) {
  const rs = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = C.get(key(c.x + dx, c.z + dz)); if (n) rs.push(n.r); }
  c.S = tier(median(rs));
}

// the four faces: outward direction, and the along-axis index used to lay out piers and windows
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const neighbour = (c, d) => C.get(key(c.x + DIRS[d][0], c.z + DIRS[d][1]));
// a face is open to air at height y when there is no footprint beside it, or the neighbour's roof is below y
const exposedFaces = (c, y) => Object.keys(DIRS).filter((d) => { const n = neighbour(c, d); return !n || n.S <= y; });
const isWall = (c) => Object.keys(DIRS).some((d) => { const n = neighbour(c, d); return !n || n.S < c.S; });
const along = (c, d) => (d === "N" || d === "S" ? c.x : c.z);
const axisOf = (d) => (d === "N" || d === "S" ? "ns" : "ew");
const outward = (c) => Object.keys(DIRS).filter((d) => !neighbour(c, d));

// the street face: the outward direction with the most footprint cells on it
const faceCount = { N: 0, S: 0, E: 0, W: 0 };
for (const c of C.values()) for (const d of outward(c)) faceCount[d]++;
const STREET = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];
const streetCells = [...C.values()].filter((c) => outward(c).includes(STREET) && c.S >= 9).sort((a, b) => along(a, STREET) - along(b, STREET));
const L = streetCells;
const ENTRANCE = L.length >= 10 ? L[5] : null;
const BAY_CELLS = new Set();
if (L.length >= 10) {
  for (const c of [L[1], L[2], L[3], L[L.length - 4], L[L.length - 3], L[L.length - 2]]) BAY_CELLS.add(key(c.x, c.z));
}
const bayAt = (c) => BAY_CELLS.has(key(c.x, c.z));
const nearEntrance = (c) => ENTRANCE && outward(c).includes(STREET) && Math.abs(along(c, STREET) - along(ENTRANCE, STREET)) === 1;

// the tower: the cells on the top tier; the top storey is louvred, and the bell sits on its roof
const towerCells = [...C.values()].filter((c) => c.S === 25);
const tcx = towerCells.reduce((s, c) => s + c.x, 0) / towerCells.length, tcz = towerCells.reduce((s, c) => s + c.z, 0) / towerCells.length;
const bellCell = towerCells.filter((c) => !isWall(c)).sort((a, b) => Math.hypot(a.x - tcx, a.z - tcz) - Math.hypot(b.x - tcx, b.z - tcz))[0];
const chimneyCells = [...C.values()].filter((c) => c.S === 13 && !isWall(c) && c.x >= 18 && c.z >= 4 && c.z <= 20).sort((a, b) => a.x - b.x || a.z - b.z);
const chimneys = new Set([chimneyCells[Math.floor(chimneyCells.length / 3)], chimneyCells[Math.floor((chimneyCells.length * 2) / 3)]].filter(Boolean).map((c) => key(c.x, c.z)));

const g = new Voxels([32, 38, 26]);
const warmHash = (c, y) => (c.x * 7 + c.z * 13 + y * 5) % 9 === 0;

for (const c of C.values()) {
  const wall = isWall(c);
  const kTop = Math.floor((c.S - 2 - c.g) / 4);
  for (let y = 0; y < c.g; y++) g.set(c.x, y, c.z, "stone_bricks");          // foundation up to the lidar ground
  for (let y = c.g; y <= c.S; y++) {
    if (y === 0) { g.set(c.x, y, c.z, "stone_bricks"); continue; }            // plinth course at grade
    if (y === c.S) { if (wall) g.set(c.x, y, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; } // parapet
    if (y === c.S - 1) { g.set(c.x, y, c.z, wall ? "calcite" : "deepslate_tiles"); continue; }                              // cornice / roof
    const rel = y - c.g, k = Math.floor(rel / 4), row = rel % 4;
    if (row === 0) { g.set(c.x, y, c.z, wall ? "calcite" : "smooth_stone"); continue; }                                       // floor slab / string course
    if (!wall) continue;                                                                                                       // interior air gap
    const open = exposedFaces(c, y);
    if (!open.length) { g.set(c.x, y, c.z, "bricks"); continue; }                                                              // partition
    // piers between the windows, and the corners are quoins; ground-floor bays and the entrance are on the street face
    const outs = open.filter((d) => !neighbour(c, d));
    const face = outs[0] ?? open[0];
    const corner = open.some((d) => axisOf(d) === "ns") && open.some((d) => axisOf(d) === "ew");
    const a = along(c, face);
    const ground = k === 0;
    if (ground && face === STREET && row === 3 && (bayAt(c) || (ENTRANCE && c.x === ENTRANCE.x && c.z === ENTRANCE.z))) { g.set(c.x, y, c.z, "calcite"); continue; }
    if (row === 3) { g.set(c.x, y, c.z, "bricks"); continue; }                                                                 // spandrel
    if (ground && face === STREET && bayAt(c)) { g.set(c.x, y, c.z, "red_concrete"); continue; }                              // apparatus doors
    if (ground && face === STREET && ENTRANCE && c.x === ENTRANCE.x && c.z === ENTRANCE.z) {
      const up = row === 2;
      g.set(c.x, y, c.z, "oak_door", { facing: { N: "north", S: "south", E: "east", W: "west" }[face], half: up ? "upper" : "lower", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const pier = corner || a % 3 === 0 || (ENTRANCE && face === STREET && nearEntrance(c)) || (ground && face === STREET && bayAt(c));
    if (pier) { g.set(c.x, y, c.z, corner ? "calcite" : "bricks"); continue; }   // red brick piers, cream quoins at the corners
    if (k === kTop && c.S === 25) { g.set(c.x, y, c.z, "iron_bars", axisOf(face) === "ns" ? { north: "false", south: "false", east: "true", west: "true" } : { north: "true", south: "true", east: "false", west: "false" }); continue; }
    const pane = axisOf(face) === "ns" ? { north: "false", south: "false", east: "true", west: "true" } : { north: "true", south: "true", east: "false", west: "false" };
    g.set(c.x, y, c.z, "glass_pane", pane);
    // a warm light in some windows, standing on the floor inside, behind the glass
    if (row === 1 && warmHash(c, y)) {
      const inD = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] }[face];
      const inn = C.get(key(c.x + inD[0], c.z + inD[1]));
      if (inn && !isWall(inn) && y - 1 >= inn.g && (y - 1 - inn.g) % 4 === 0 && y < inn.S - 1) g.set(inn.x, y, inn.z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// roof equipment: the bell on the tower roof, two brick flues on the middle tier
if (bellCell) g.set(bellCell.x, 25, bellCell.z, "bell", { attachment: "floor", facing: "north", powered: "false" });
for (const c of C.values()) {
  if (!chimneys.has(key(c.x, c.z))) continue;
  for (let y = c.S; y < c.S + 3; y++) g.set(c.x, y, c.z, "bricks");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162153622.nbt";
console.log("street face", STREET, "bays", BAY_CELLS.size, "tiers", [...new Set([...C.values()].map((c) => c.S))].sort((a, b) => a - b));
console.log(g.save(out));
