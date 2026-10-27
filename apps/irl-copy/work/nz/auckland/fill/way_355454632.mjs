// West Plaza, Auckland (OSM way 355454632): an 80 x 37 footprint, a 1990s glass office tower on a granite podium, a low
// wing along the north edge, and a plant room on the crown. The massing follows the lidar roof, median-smoothed over
// 5 x 5 cells and rounded up to whole 4-block storeys, so the tiers are flat and every storey stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_355454632.cells.json`, "utf8"));
const W = 80, D = 37, H = 104, STOREY = 4;

// the footprint, the lidar's roof and ground per cell
const inside = new Uint8Array(W * D), roofAt = new Int16Array(W * D), groundAt = new Int16Array(W * D);
for (const [x, z, ground, roof] of cells) { const i = z * W + x; inside[i] = 1; roofAt[i] = roof; groundAt[i] = ground; }
const fp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && inside[z * W + x] === 1;

// the storey tier of each cell: the median roof over its 5 x 5 neighbourhood, rounded up to a whole storey (min 1 storey)
const top = new Int16Array(W * D);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!fp(x, z)) continue;
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (fp(x + dx, z + dz)) v.push(roofAt[(z + dz) * W + x + dx]);
  v.sort((a, b) => a - b);
  let t = Math.max(STOREY, Math.ceil(v[v.length >> 1] / STOREY) * STOREY);
  // the lidar's stray mid-height cells (ramps at the tower's edge) snap to the podium or the shaft: no ragged ziggurat
  if (t > 12 && t < 88) t = t <= 50 ? 12 : 88;
  top[z * W + x] = t;
}
const T = (x, z) => top[z * W + x];
const B = (x, z) => groundAt[z * W + x];

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// the faces of a cell at height y that look out on air: outside the footprint, or over a lower neighbour's roof
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const openFaces = (x, z, y) => DIRS.filter(([, dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  return !fp(nx, nz) || T(nx, nz) <= y;
}).map(([d]) => d);
// piers sit on every third column of a north or south face and every third row of an east or west face
const onPier = (x, z, faces) => faces.some((d) => (d === "N" || d === "S" ? x % 3 === 0 : z % 3 === 0));

// 1. the solid body: granite foundation to the ground, a floor slab each storey, glass and piers between, air inside
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!fp(x, z)) continue;
  const b = B(x, z), t = T(x, z);
  for (let y = 0; y < t; y++) {
    if (y < b) { put(x, y, z, "polished_granite"); continue; }
    const f = openFaces(x, z, y);
    if (y % STOREY === 0) { put(x, y, z, f.length ? "smooth_stone" : "light_gray_concrete"); continue; } // belt course / floor slab
    if (y === t - 1) { put(x, y, z, f.length ? "white_concrete" : "light_gray_concrete"); continue; }   // cornice / roof deck
    if (!f.length) continue;                                                                          // air behind the glass
    if (onPier(x, z, f)) put(x, y, z, "white_concrete");
    else if (y % STOREY === 3) put(x, y, z, "light_gray_concrete");                                    // spandrel
    else put(x, y, z, "light_blue_stained_glass");
  }
  // a parapet on the edge of each roof tier, so the setbacks read
  if (openFaces(x, z, t - 1).length) put(x, t, z, "white_concrete");
}

// 2. the ground storey: a recessed entrance with a lintel and a warm light, on the north face where the ground is low
const doorCands = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!fp(x, z) || B(x, z) > 1 || T(x, z) < STOREY || x % 3 === 0) continue;
  if (openFaces(x, z, 1).includes("N")) doorCands.push(x + z * W);
}
doorCands.sort((a, b) => a - b);
const doors = new Set([1, 2, 3].map((k) => doorCands[Math.floor((doorCands.length * k) / 4)]).filter((v) => v !== undefined));
for (const key of doors) {
  const x = key % W, z = Math.floor(key / W);
  const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(x, 1, z, "iron_door", door("lower"));
  put(x, 2, z, "iron_door", door("upper"));
  put(x, 3, z, "glowstone");
}

// 3. warm light behind some windows (1 window in 9), in the air gap just inside the glass
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!fp(x, z)) continue;
  for (let y = 1; y < T(x, z); y++) {
    if (y % STOREY === 0 || y % STOREY === 3 || y >= T(x, z) - 1) continue;
    const f = openFaces(x, z, y);
    if (!f.length || onPier(x, z, f) || (x * 7 + z * 13 + y * 5) % 9 !== 0) continue;
    const [face] = f;
    const [ix, iz] = face === "N" ? [x, z + 1] : face === "S" ? [x, z - 1] : face === "W" ? [x + 1, z] : [x - 1, z];
    if (fp(ix, iz) && g.get(ix, y, iz) === null) put(ix, y, iz, (x + y + z) % 2 ? "glowstone" : "shroomlight");
  }
}

// 4. roof terraces: air-conditioning plant on the podium roofs
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!fp(x, z) || T(x, z) !== 3 * STOREY) continue;
  if (!openFaces(x, z, T(x, z) - 1).length && (x + 2 * z) % 13 === 0) put(x, T(x, z), z, "iron_block");
}

// 5. the crown: a plant room set inside the top tier (its walls and roof stand on the crown's deck), with a mast
const crownTop = Math.max(...top);
const isCore = (x, z) => fp(x, z) && T(x, z) === crownTop && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => fp(x + dx, z + dz) && T(x + dx, z + dz) === crownTop);
let sx = 0, sz = 0, n = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (isCore(x, z)) { sx += x; sz += z; n++; }
const cx = Math.round(sx / n), cz = Math.round(sz / n);
let room = null;
for (let hw = 6, hd = 4; hw >= 2 && !room; hw--, hd--) {
  const x0 = cx - hw, x1 = cx + hw, z0 = cz - hd, z1 = cz + hd;
  let ok = true;
  for (let z = z0; z <= z1 && ok; z++) for (let x = x0; x <= x1 && ok; x++) ok = isCore(x, z);
  if (ok) room = { x0, x1, z0, z1 };
}
if (room) {
  const { x0, x1, z0, z1 } = room;
  for (let y = crownTop; y < crownTop + 3; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    if (edge) put(x, y, z, "light_gray_concrete");
  }
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) put(x, crownTop + 3, z, "light_gray_concrete");
  for (let y = crownTop + 4; y < crownTop + 9; y++) put(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

const stats = g.save(`${DIR}/way_355454632.nbt`);
console.log(`footprint ${cells.length} cells; tiers ${[...new Set(top.filter((v) => v))].sort((a, b) => a - b).join(", ")}; ` +
  `doors ${doors.size}; crown ${crownTop} (${n} core cells); plant room ${room ? JSON.stringify(room) : "none"}; ` +
  `blocks ${stats.blocks}, palette ${stats.palette}`);
