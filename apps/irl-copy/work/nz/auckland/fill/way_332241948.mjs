// way 332241948: a 1960s-70s brick-and-concrete office block on a sloping site (Mt Eden / Newton edge).
// Four flat tiers from the lidar roof: a 4-storey wing (top 16), a 5-storey body (top 20), a 5-storey tower bay (top 22).
// Brick panels with white-concrete piers and spandrels, ribbon glazing, a shopfront and entrance on the lowest street face,
// stone plinth and string courses, a parapet, plant boxes on the tower roof, and warm lights behind some glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const SIZE = [56, 35, 46];
const D = 46;
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

const raw = JSON.parse(readFileSync(`${DIR}/way_332241948.cells.json`, "utf8"));
const k = (x, z) => x * 100 + z;
const fp = new Map(raw.map(([x, z, g, r]) => [k(x, z), { x, z, g, r }]));
const inFp = (x, z) => fp.has(k(x, z));
const at = (x, z) => fp.get(k(x, z));

// LiDAR noise: 3x3 median of ground and roof over the footprint, then snap the roof to flat tiers.
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[(s.length - 1) >> 1]; };
for (const c of fp.values()) {
  const nb = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at(c.x + dx, c.z + dz); if (n) nb.push(n); }
  c.g = median(nb.map((n) => n.g));
  const rm = median(nb.map((n) => n.r));
  c.T = rm >= 21 ? 22 : rm >= 19 ? 20 : 16;          // top of the tier (deck is T-1, parapet sits on T)
  c.deck = c.T - 1;
  c.S = [c.g];                                         // slab rows: the ground slab, then every storey line above it
  for (let y = 4; y < c.deck; y += 4) if (y > c.g) c.S.push(y);
  c.slab = new Set(c.S);
}

const outDirs = (c) => DIRS.filter(([dx, dz]) => !inFp(c.x + dx, c.z + dz));
const aboveDirs = (c, y) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return n && y >= n.T; });
const exposed = (c, y) => [...outDirs(c), ...aboveDirs(c, y)];   // faces that look onto air at this row
const isAir = (c, y) => y > c.g && y < c.deck && !c.slab.has(y) && exposed(c, y).length === 0;

// The entrance face: the largest street-level (ground 0) face of the footprint.
const faceCount = new Map();
for (const c of fp.values()) if (c.g === 0) for (const d of outDirs(c)) faceCount.set(d[2], (faceCount.get(d[2]) ?? 0) + 1);
const frontName = [...faceCount.entries()].sort((a, b) => b[1] - a[1])[0][0];
const front = DIRS.find((d) => d[2] === frontName);
const frontCells = [...fp.values()].filter((c) => c.g === 0 && outDirs(c).some((d) => d[2] === frontName));
const frontAlong = (c) => (front[0] !== 0 ? c.z : c.x);
frontCells.sort((p, q) => frontAlong(p) - frontAlong(q));
const door = frontCells[Math.floor(frontCells.length / 2)];

const g = new Voxels(SIZE);
const put = (c, y, block, state) => g.set(c.x, y, c.z, block, state);
const paneState = (dx) => (dx !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

// One wall row of a perimeter / setback cell: piers, glazing with air behind, spandrels, the shopfront and the door.
function wallRow(c, y, ex) {
  const a = Math.max(...c.S.filter((s) => s < y));
  const b = Math.min(...c.S.filter((s) => s > y), c.deck);
  const j = y - a;                                     // 1 = first row above the slab below
  const top = y === b - 1;                             // spandrel row under the next slab
  if (ex.some(([dx]) => dx !== 0) && ex.some(([, dz]) => dz !== 0)) { put(c, y, "white_concrete"); return; }   // corner column
  const [dx, dz] = ex[0];
  const idx = dx !== 0 ? c.z : c.x;
  if (top) { put(c, y, "bricks"); return; }
  const isFront = front && ex.some((d) => d[2] === frontName) && a === 0;
  if (isFront) {
    const m = frontAlong(door);
    if (c.x === door.x && c.z === door.z && (j === 1 || j === 2)) {
      put(c, y, "iron_door", { facing: frontName, half: j === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      return;
    }
    if (idx % 3 === 0 || Math.abs(idx - m) === 1) { put(c, y, "white_concrete"); return; }
    put(c, y, "glass_pane", paneState(dx));
    return;
  }
  if (idx % 3 === 0) { put(c, y, "white_concrete"); return; }
  const bc = at(c.x - dx, c.z - dz);
  if (bc && isAir(bc, y)) {
    put(c, y, "glass_pane", paneState(dx));
    if (j === 1 && (idx + y) % 7 === 0) g.set(bc.x, y, bc.z, "glowstone");     // a warm lamp on the floor behind the glass
  } else put(c, y, "bricks");
}

for (const c of fp.values()) {
  const out = outDirs(c);
  for (let y = 0; y <= c.T; y++) {
    if (y < c.g) { put(c, y, "stone"); continue; }                              // foundation up to the lidar ground
    if (y === c.T) { if (out.length) put(c, y, "smooth_stone"); continue; }    // parapet
    if (y === c.deck) { put(c, y, "light_gray_concrete"); continue; }           // roof deck over the whole footprint
    const ex = exposed(c, y);
    if (c.slab.has(y)) { put(c, y, ex.length ? (y === c.g ? "stone_bricks" : "smooth_stone") : "stone"); continue; }
    if (ex.length) wallRow(c, y, ex);
  }
}

// The entrance canopy: a flat hood cantilevered from the lintel over the door (attached to the wall, so nothing floats),
// with a hanging lantern under it for the dusk.
for (let s = 1; s <= 2; s++) for (let t = -1; t <= 1; t++) {
  const x = door.x + front[0] * s + (front[0] === 0 ? t : 0), z = door.z + front[1] * s + (front[1] === 0 ? t : 0);
  g.set(x, 3, z, "smooth_stone");
}
g.set(door.x + front[0] * 2, 2, door.z + front[1] * 2, "lantern", { hanging: "true", waterlogged: "false" });

// Plant boxes on the tower roof, set in from the edge so they stand on the deck.
for (const c of fp.values()) {
  if (c.T !== 22) continue;
  const inset = DIRS.every(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return n && n.T === 22; });
  if (inset && c.x % 8 >= 3 && c.x % 8 <= 4 && c.z % 8 >= 3 && c.z % 8 <= 4) {
    put(c, 22, "light_gray_concrete"); put(c, 23, "light_gray_concrete");
  }
}

const info = g.save(`${DIR}/way_332241948.nbt`);
console.log(JSON.stringify({ front: frontName, door: [door.x, door.z], ...info }));
