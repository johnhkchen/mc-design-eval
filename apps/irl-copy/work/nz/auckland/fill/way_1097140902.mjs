// Mt Eden / Eden Terrace: a 1960s-70s three-storey concrete office block on a corner, rebuilt from the lidar roof.
// Tiers are read from a smoothed lidar roof: a two-storey podium (roof 8), a three-storey core inset one cell (roof 12),
// and a small plant penthouse inset again (roof 15, the lidar's peak). Cream concrete walls with light-grey piers and
// storey bands, tinted glazing in a 3-block bay rhythm, a stone base and shopfront at ground, two entrances, and
// glowstone lit offices behind some windows. Every column is solid from y 0 up to its top, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1097140902.cells.json`, "utf8"));
const W = 28, H = 27, D = 25;
const POD = 8, CORE = 12, PENT = 15;             // tier tops (y): 2 storeys, 3 storeys, plant room
const STOREY = 4;

const roof = new Map();
for (const [x, z, , ro] of cells) roof.set(`${x},${z}`, ro);
const fp = (x, z) => roof.has(`${x},${z}`);
const smooth = (x, z) => {                         // 3x3 mean of the lidar roof over footprint cells
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (fp(x + dx, z + dz)) { s += roof.get(`${x + dx},${z + dz}`); n++; }
  return s / n;
};
const within = (x, z, k, ok) => {                  // every cell within k of (x, z) passes ok (and is in the footprint)
  for (let dx = -k; dx <= k; dx++) for (let dz = -k; dz <= k; dz++) if (!fp(x + dx, z + dz) || !ok(x + dx, z + dz)) return false;
  return true;
};

const top = new Map();                              // "x,z" -> tier top y
const sm = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) sm.set(`${x},${z}`, smooth(x, z));
const isCore = (x, z) => sm.get(`${x},${z}`) >= 9.5 && within(x, z, 1, () => true);
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  let t = POD;
  if (isCore(x, z)) t = CORE;
  if (t === CORE && sm.get(`${x},${z}`) >= 12.5 && within(x, z, 1, isCore)) t = PENT;
  top.set(`${x},${z}`, t);
}
const T = (x, z) => top.get(`${x},${z}`) ?? 0;
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // north, south, west, east (outward = the neighbour)
const NAME = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };
// the neighbours that expose this cell's face at height y: outside the footprint, or a lower tier (its wall rises from the
// ground past the podium, so the core's walls hold the core up at every height, not only above the podium roof)
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !fp(x + dx, z + dz) || T(x + dx, z + dz) <= y || T(x + dx, z + dz) < T(x, z));

const put = new Map();
const set = (x, y, z, block, state) => put.set(`${x},${y},${z}`, { x, y, z, block, state });
const pane = (dz) => (dz !== 0
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const windows = [];                                 // exterior glazed cells, for doors and lights

for (const [key, t] of top) {
  const [x, z] = key.split(",").map(Number);
  set(x, 0, z, "stone_bricks");                     // base course and foundation on every cell
  for (let y = 1; y < t; y++) {
    if (y === t - 1) { set(x, y, z, "smooth_stone"); continue; }     // roof covering
    if (y % STOREY === 0) { set(x, y, z, "light_gray_concrete"); continue; }   // floor slab / storey line
    const ex = exposed(x, z, y);
    if (!ex.length) continue;                       // interior air behind the glass
    const [dx, dz] = ex[0];
    const along = dz !== 0 ? x : z;
    const corner = ex.some(([a]) => a !== 0) && ex.some(([, b]) => b !== 0);
    const pier = corner || along % 3 === 0;
    const r = y % STOREY;
    const ground = y < STOREY;
    if (r === 3) { set(x, y, z, pier ? "light_gray_concrete" : "white_concrete"); continue; }
    if (pier) { set(x, y, z, ground ? "stone_bricks" : "light_gray_concrete"); continue; }
    windows.push({ x, y, z, dx, dz, ground, along });   // glazed below, once the reveals are cut
  }
  // parapet / cornice on the roof edge; the edge against a higher tier stays open
  if (exposed(x, z, t).some(([dx, dz]) => !fp(x + dx, z + dz) || T(x + dx, z + dz) < t)) set(x, t, z, "light_gray_concrete");
}

// glazing sits one block back from the face, so each window is a reveal that casts shadow (the wall's depth reads at
// a glance); where the cell behind is not free the pane stays in the face
const recessed = new Map();
for (const w of windows) {
  const ix = w.x - w.dx, iz = w.z - w.dz, k = `${ix},${w.y},${iz}`;
  if (fp(ix, iz) && !put.has(k)) { set(ix, w.y, iz, "light_blue_stained_glass_pane", pane(w.dz)); recessed.set(`${w.x},${w.y},${w.z}`, true); }
  else set(w.x, w.y, w.z, "light_blue_stained_glass_pane", pane(w.dz));
}

// two entrances: the middle ground-floor glazed bay of the two faces with the most ground glazing
const byFace = new Map();
for (const w of windows) if (w.ground && w.y === 1) {
  const k = `${w.dx},${w.dz}`;
  if (!byFace.has(k)) byFace.set(k, []);
  byFace.get(k).push(w);
}
const doorFaces = [...byFace.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 2);
const doorCells = new Set();
for (const [k, ws] of doorFaces) {
  ws.sort((a, b) => a.along - b.along);
  const d = ws[Math.floor(ws.length / 2)];
  const facing = NAME[k];
  // the door opens flush in the face: take out the pane the recess put behind it
  for (const y of [1, 2]) put.delete(`${d.x - d.dx},${y},${d.z - d.dz}`);
  set(d.x, 1, d.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  set(d.x, 2, d.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  doorCells.add(`${d.x},${d.z}`);
  // a lintel course over the door, in the storey band's stone
  for (const s of [-1, 0, 1]) {
    const lx = d.dz !== 0 ? d.x + s : d.x, lz = d.dz !== 0 ? d.z : d.z + s;
    if (fp(lx, lz)) set(lx, 3, lz, "stone_bricks");
  }
}

// warm lights: some offices lit behind the glass, on a loose rhythm across the bays
for (const w of windows) {
  if (w.y % STOREY !== 2 || doorCells.has(`${w.x},${w.z}`)) continue;
  if ((w.along * 5 + w.y * 3) % 7 !== 0) continue;
  const back = recessed.has(`${w.x},${w.y},${w.z}`) ? 2 : 1;   // behind the pane
  const ix = w.x - back * w.dx, iz = w.z - back * w.dz;
  if (fp(ix, iz) && !put.has(`${ix},${w.y},${iz}`)) set(ix, w.y, iz, "glowstone");
}

// plant on the podium roof (a pair of iron boxes on the ring) and on the penthouse
const ringFree = (a, b) => T(a, b) === POD && exposed(a, b, POD - 1).length === 0;
let plant = 0;
for (const [key] of top) {
  if (plant >= 2) break;
  const [x, z] = key.split(",").map(Number);
  const block = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => [x + a, z + b]);
  if (block.every(([a, b]) => ringFree(a, b)) && !block.some(([a, b]) => put.has(`${a},${POD},${b}`))) {
    for (const [a, b] of block) set(a, POD, b, "iron_block");
    plant++;
  }
}
for (const [key, t] of top) if (t === PENT) {
  const [x, z] = key.split(",").map(Number);
  if (!exposed(x, z, PENT).length) { set(x, PENT, z, "iron_block"); break; }
}

// the volume, and a check that every block is held up: all blocks reach y 0 through blocks that touch
const g = new Voxels([W, H, D]);
for (const { x, y, z, block, state } of put.values()) {
  if (x < 0 || x >= W || z < 0 || z >= D || y >= H) throw new Error(`out of the box: ${x},${y},${z}`);
  g.set(x, y, z, block, state);
}
const seen = new Set(), stack = [];
for (const v of put.values()) if (v.y === 0) { stack.push(v); seen.add(`${v.x},${v.y},${v.z}`); }
while (stack.length) {
  const { x, y, z } = stack.pop();
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const k = `${x + dx},${y + dy},${z + dz}`;
    if (put.has(k) && !seen.has(k)) { seen.add(k); stack.push(put.get(k)); }
  }
}
const floating = put.size - seen.size;
const res = g.save(`${DIR}/way_1097140902.nbt`);
console.log(JSON.stringify({ blocks: res.blocks, palette: res.palette, floating, doors: doorFaces.map(([k]) => NAME[k]), plant }));
