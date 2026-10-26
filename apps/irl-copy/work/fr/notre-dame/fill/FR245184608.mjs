// FR245184608: a pale limestone block, 4-5 storeys, with a setback massing from the lidar roof.
// Every column is solid from y 0 up to its tier top (foundation included), so nothing floats. The outer skin
// carries storey bands, mullioned windows and piers; each window has a one-block air pocket behind its glass,
// closed on all sides, with a warm glowstone in some of them. The roof is slate with a stone parapet, and the
// tiers come from a 3x3 median of the lidar so the noise reads as flat steps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184608.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184608.nbt";
const W = 29, H = 54, D = 42;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map(), roof = new Map();
for (const [x, z, g, r] of cells) { ground.set(key(x, z), g); roof.set(key(x, z), r); }
const has = (x, z) => roof.has(key(x, z));

// Tiers: a 3x3 median of the lidar roof, snapped to the nearest flat step (main hall 38, transept 30, aisle 20, low wing 8)
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const tierOf = (s) => (s >= 33 ? 38 : s >= 25 ? 30 : s >= 13 ? 20 : 8);
const top = new Map();   // column top, exclusive: solid from y 0 up to top - 1
for (const k of roof.keys()) {
  const [x, z] = k.split(",").map(Number);
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (has(x + dx, z + dz)) near.push(roof.get(key(x + dx, z + dz)));
  top.set(k, tierOf(median(near)));
}
const T = (x, z) => top.get(key(x, z)) ?? 0;
const occ = (x, y, z) => y >= 0 && y < T(x, z);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposedDirs = (x, y, z) => Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return !occ(x + dx, y, z + dz); });
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const grid = new Map();   // "x,y,z" -> { b, s }; a missing cell is air
const put = (x, y, z, b, s) => grid.set(`${x},${y},${z}`, s ? { b, s } : { b });
const clear = (x, y, z) => grid.delete(`${x},${y},${z}`);

// Glass on an outer face with an enclosed air pocket behind it (its inward neighbour), if the wall is thick enough
function glaze(x, y, z, d, glass) {
  const [ox, oz] = DIRS[d];
  const px = x - ox, pz = z - oz;
  put(x, y, z, glass);
  if (!occ(px, y, pz)) return;
  for (const [ax, ay, az] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const nx = px + ax, ny = y + ay, nz = pz + az;
    if (nx === x && ny === y && nz === z) continue;
    if (!occ(nx, ny, nz)) return;   // open to air elsewhere: keep it a solid wall
  }
  if (hash(px, y, pz) % 6 === 0) put(px, y, pz, "glowstone");
  else clear(px, y, pz);
}

// 1. the massing and its outer skin
const windows = [];
for (const [k, t] of top) {
  const [x, z] = k.split(",").map(Number);
  const g = ground.get(k);
  for (let y = 0; y < t; y++) {
    const ex = exposedDirs(x, y, z);
    let b = "calcite";
    if (y === t - 1) b = ex.length ? "stone_bricks" : "deepslate_tiles";   // parapet on the edge, slate inside
    else if (ex.length && y < g) b = "stone_bricks";                        // plinth below grade
    else if (ex.length) {
      const d = ex[0];
      const u = d === "N" || d === "S" ? x : z;
      const row = y % 5;
      if (y === g || row === 0) b = "stone_bricks";        // base course and string courses
      else if (row === 4) b = "calcite";                    // band above the glass
      else if (u % 4 === 3) b = "stone_bricks";             // mullion
      else if (u % 4 === 0) b = "calcite";                  // pier, the same pale stone as the wall
      else { windows.push({ x, y, z, d }); b = null; }      // glass, set below
    }
    if (b) put(x, y, z, b);
  }
}
for (const w of windows) glaze(w.x, w.y, w.z, w.d, hash(w.x, w.y, w.z) % 3 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");

// 2. the entrance on the north face, centred on x 14: jambs, a lintel, a glazed tympanum, a door
const gy = ground.get(key(14, 1)) ?? 0;
for (let y = gy; y <= gy + 4; y++) { put(12, y, 1, "chiseled_stone_bricks"); put(16, y, 1, "chiseled_stone_bricks"); }
for (let x = 13; x <= 15; x++) put(x, gy + 4, 1, "chiseled_stone_bricks");
put(14, gy, 1, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(14, gy + 1, 1, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
clear(14, gy, 2); clear(14, gy + 1, 2);   // a vestibule behind the door
for (let x = 13; x <= 15; x++) for (let y = gy + 2; y <= gy + 3; y++) glaze(x, y, 1, "N", "light_blue_stained_glass");

// 3. a rose window over the portal (glass in a stone ring)
const yc = Math.min(24, T(14, 1) - 5);
for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) {
  const r = Math.hypot(dx, dy);
  const x = 14 + dx, y = yc + dy;
  if (r <= 1.9) glaze(x, y, 1, "N", (dx + dy) & 1 ? "red_stained_glass" : "blue_stained_glass");
  else if (r <= 2.9) put(x, y, 1, "stone_bricks");
}

// 4. four pinnacles on the corners of the main hall
const main = [...top].filter(([, t]) => t === 38).map(([k]) => k.split(",").map(Number));
const xs = main.map((p) => p[0]), zs = main.map((p) => p[1]);
const corners = [[Math.min(...xs), Math.min(...zs)], [Math.max(...xs), Math.min(...zs)], [Math.min(...xs), Math.max(...zs)], [Math.max(...xs), Math.max(...zs)]];
for (const [cx, cz] of corners) {
  const [x, z] = main.reduce((best, p) => (Math.hypot(p[0] - cx, p[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz) ? p : best));
  put(x, 38, z, "stone_bricks");
  put(x, 39, z, "stone_bricks");
  put(x, 40, z, "stone_brick_slab", { type: "bottom" });
}

// 5. write it out
const g = new Voxels([W, H, D]);
for (const [k, { b, s }] of grid) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b, s);
}
const r = g.save(OUT);
console.log(`FR245184608: ${r.blocks} blocks, ${r.palette} palette entries -> ${OUT}`);
