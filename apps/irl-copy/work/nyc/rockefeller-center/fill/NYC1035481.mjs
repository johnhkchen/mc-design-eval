// NYC1035481: Olympic Tower, 641 Fifth Avenue, 1973 mixed residential and commercial tower. A pink-granite base
// with shops and a recessed bronze-door entrance on Fifth Avenue (the west face, x 0), then a bronze-tinted glass
// curtain wall on steel-grey spandrels, stepping from a low north wing through a middle mass to the tall south tower,
// its crown setback with a mechanical penthouse. Storeys are 3 blocks: a spandrel course and two rows of glass
// between iron mullions every third block. Each window has a one-block air gap behind it, and some hold warm lamps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 53, D = 55, HMAX = 185;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035481.cells.json`, "utf8"));

// Per footprint cell: ground (foundation depth) and lidar roof height above y 0.
const GROUND = Array.from({ length: D }, () => Array(W).fill(null));
const ROOF = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, g, r] of cells) { GROUND[z][x] = g; ROOF[z][x] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && GROUND[z][x] !== null;
const median = (a) => { const s = [...a].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

// Lidar noise: median of each cell's 3 x 3 neighbourhood, then snap to whole storeys (multiples of 3).
const TOP = Array.from({ length: D }, () => Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, z + dz)) nb.push(ROOF[z + dz][x + dx]);
  TOP[z][x] = Math.max(3 * Math.round(median(nb) / 3), GROUND[z][x] + 1, 3);
}
const top = (x, z) => (inside(x, z) ? TOP[z][x] : 0);

// Sides a cell at height y shows to the outside: the neighbour is off the lot or stands no higher than y.
const SIDES = { W: [-1, 0], N: [0, -1], E: [1, 0], S: [0, 1] };
const ORDER = ["W", "N", "E", "S"];                  // Fifth Avenue first: the west face is the street front
const exposed = (x, z, y) => ORDER.filter((d) => top(x + SIDES[d][0], z + SIDES[d][1]) <= y);
const primary = (x, z, y) => ORDER.find((d) => exposed(x, z, y).includes(d));

// The block grid: "x,y,z" -> { b, s } or null (air). Built in full, then written once.
const out = new Map();
const put = (x, y, z, b, s) => out.set(`${x},${y},${z}`, { b, s });
const air = (x, y, z) => out.set(`${x},${y},${z}`, null);
const hash = (x, y, z) => Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791);
const pane = (d) => (d === "W" || d === "E"
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });
const isMullion = (d, u) => u % 3 === 0;             // the wall's iron mullions, every third block along it
const wallIndex = (x, z, d) => (d === "W" || d === "E" ? z : x);

// 1. The envelope: foundation below each cell's ground, the core, roof surfaces, and the facade skin.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const T = TOP[z][x], G = GROUND[z][x];
  for (let y = 0; y < T; y++) {
    const d = primary(x, z, y);
    if (y < G) { d ? put(x, y, z, "polished_granite") : put(x, y, z, "stone"); continue; }
    if (!d) { put(x, y, z, y === T - 1 ? "gray_concrete" : "stone"); continue; }   // core, or roof surface
    if (y === T - 1) { put(x, y, z, "polished_granite"); continue; }                // cornice on each tier's top
    const row = y % 3, storey = Math.floor(y / 3);
    if (row === 0) { put(x, y, z, storey <= 2 ? "polished_granite" : "smooth_stone"); continue; }   // spandrel
    const u = wallIndex(x, z, d);
    if (u % 9 === 0) { put(x, y, z, "polished_granite"); continue; }                // granite pilaster every third bay
    if (isMullion(d, u)) { put(x, y, z, "iron_block"); continue; }
    put(x, y, z, "brown_stained_glass_pane", pane(d));
  }
  if (primary(x, z, T - 1)) put(x, T, z, "stone_bricks");                           // parapet on the top edge
}

// 2. Behind each window, a one-block air gap inside the wall; some gaps hold a warm lamp.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const T = TOP[z][x], G = GROUND[z][x];
  for (let y = G; y < T - 1; y++) {
    const d = primary(x, z, y);
    if (!d || y % 3 === 0 || isMullion(d, wallIndex(x, z, d))) continue;
    const ix = x + (d === "E" ? -1 : d === "W" ? 1 : 0), iz = z + (d === "S" ? -1 : d === "N" ? 1 : 0);
    if (!inside(ix, iz) || primary(ix, iz, y)) continue;
    air(ix, y, iz);
    const h = hash(x, y, z);
    if (h % (y < 6 ? 5 : 9) === 0) out.set(`${ix},${y},${iz}`, { b: (h >>> 8) % 3 ? "glowstone" : "shroomlight" });
  }
}

// 3. Fifth Avenue entrance: the middle of the tower's west face. A two-block recess with granite piers, bronze doors
// on the centre line, a stone canopy over the recess and a hanging lantern in the vestibule.
const EC = 41, EG = GROUND[EC][0];
for (let z = EC - 2; z <= EC + 2; z++) {
  for (let y = EG; y <= EG + 2; y++) {
    if (z === EC - 2 || z === EC + 2) put(0, y, z, "polished_granite");
    else put(0, y, z, "brown_stained_glass_pane", pane("W"));
  }
  put(0, EG + 3, z, "polished_granite");
  put(1, EG + 3, z, "polished_granite");
}
for (let z = EC - 1; z <= EC + 1; z++) for (let y = EG; y <= EG + 2; y++) air(1, y, z);
put(0, EG, EC, "iron_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
put(0, EG + 1, EC, "iron_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
put(0, EG + 2, EC, "brown_stained_glass_pane", pane("W"));
put(1, EG + 2, EC, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Crown: a mechanical penthouse of iron louvres with a warm light on the highest tier, set in from the edges.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z) || TOP[z][x] < 171 || x % 8 !== 4 || z % 8 !== 4) continue;
  const T = TOP[z][x];
  put(x, T, z, "iron_block"); put(x, T + 1, z, "iron_block"); put(x, T + 2, z, "shroomlight");
}

const g = new Voxels([W, HMAX, D]);
let placed = 0;
for (const [key, v] of out) {
  if (!v) continue;
  const [x, y, z] = key.split(",").map(Number);
  if (y < 0 || y >= HMAX) continue;
  g.set(x, y, z, v.b, v.s);
  placed++;
}
const stats = g.save(`${DIR}/NYC1035481.nbt`);
console.log(`placed ${placed}`, stats);
