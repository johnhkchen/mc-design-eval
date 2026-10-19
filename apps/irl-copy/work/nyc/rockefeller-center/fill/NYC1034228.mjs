// 2 West 45th Street, 1910 commercial and office building: a Beaux-Arts office block of brick and granite on the
// 20 x 28 footprint. Lidar roofs are read as three clean tiers (3 x 3 majority of built cells, so the 1-2 block noise
// goes): a 61-block tower bay in the middle of the lot, a 58-block shaft (about 19 storeys) round it, and a 55-block
// lower wing at the rear. Granite plinth at y 0 and a two-storey base (shopfront glass between granite piers, a
// chiseled belt course at y 3, windows above); then the shaft in brick piers with white terracotta spandrels at every
// third block and steel-sash windows in pairs of panes. A recessed doorway with iron doors in the street (north) front,
// a three-course cornice and a tar roof, with a small bulkhead on the tower. Windows are panes one block out with air
// behind them (the spandrel row is the floor slab); some have glowstone behind the glass. No interiors. The lidar's
// open cells are a paved court.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034228.cells.json`, "utf8"));
const X = 20, Y = 73, Z = 28;

const key = (x, z) => `${x},${z}`;
const roofOf = new Map(cells.map(([x, z, , roof]) => [key(x, z), roof]));

// Tier of one lidar roof: under 20 is no roof (a court), 60 and over the tower, 57-59 the shaft, the rest the wing.
const tierOf = (r) => (r < 20 ? 0 : r >= 60 ? 61 : r >= 57 ? 58 : 55);
const raw = (x, z) => (roofOf.has(key(x, z)) ? tierOf(roofOf.get(key(x, z))) : 0);
const top = new Map();                                    // block height of each footprint cell's roof (0 = court)
for (const k of roofOf.keys()) {
  const [x, z] = k.split(",").map(Number);
  const own = raw(x, z);
  if (!own) { top.set(k, 0); continue; }
  const votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const t = raw(x + dx, z + dz); if (t) votes.set(t, (votes.get(t) || 0) + 1);
  }
  let best = own;
  for (const [t, n] of votes) if (n > (votes.get(best) || 0)) best = t;
  top.set(k, best);
}
const topOf = (x, z) => top.get(key(x, z)) ?? 0;
const open = (x, y, z) => topOf(x, z) <= y;

const D = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };   // outward; N = low z = the 45th Street front
const SIDES = ["N", "S", "W", "E"];
const faceOf = (x, y, z) => SIDES.find((d) => open(x + D[d][0], y, z + D[d][1])) ?? null;

const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows
const paneOn = (d) => (d === "N" || d === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

// What a face cell is: a block, a door half, or a glass pane with what goes behind it (air, or glowstone when lit).
function facade(x, y, z, d) {
  const [dx] = D[d], k = SIDES.indexOf(d);
  const along = dx === 0 ? x : z, len = dx === 0 ? X : Z;
  const pier = along === 0 || along === len - 1 || along % 3 === 0;   // corners and every third column
  const t = topOf(x, z);
  const pane = { b: "glass_pane", s: paneOn(d), carve: lit(along, y, k) ? "glowstone" : "air" };
  if (y >= t - 3) return { b: y === t - 1 ? "smooth_stone" : y === t - 2 ? "calcite" : "white_terracotta" };   // cornice
  if (d === "N" && y <= 2 && x >= 8 && x <= 10) {                                                          // doorway
    if (x !== 9) return { b: "polished_granite" };
    return { door: y === 1 ? "lower" : "upper" };
  }
  if (y === 0) return { b: "polished_granite" };                                       // plinth
  if (y <= 2) return pier ? { b: "polished_granite" } : { b: "glass", carve: "air" };   // shopfront
  if (y === 3) return { b: "chiseled_stone_bricks" };                                  // belt course
  if (y <= 5) return pier ? { b: "stone_bricks" } : pane;                              // second storey
  if ((y - 6) % 3 === 0) return { b: "white_terracotta" };                             // spandrel = floor slab
  return pier ? { b: "bricks" } : pane;
}

const g = new Voxels([X, Y, Z]);
const carves = [], faces = [];
for (const k of top.keys()) {
  const [x, z] = k.split(",").map(Number), t = topOf(x, z);
  if (!t) { g.set(x, 0, z, "polished_andesite"); continue; }                           // court paving
  for (let y = 0; y < t; y++) {
    g.set(x, y, z, y === t - 1 ? "gray_concrete" : y < 6 ? "stone_bricks" : "bricks");  // core, tar roof on top
    const d = faceOf(x, y, z);
    if (!d) continue;
    const e = facade(x, y, z, d);
    faces.push([x, y, z, d, e]);
    if (e.carve) carves.push([x - D[d][0], y, z - D[d][1], e.carve]);
  }
}
for (const [x, y, z, block] of carves) g.set(x, y, z, block);
for (const [x, y, z, d, e] of faces) {
  if (e.door) { g.set(x, y, z, "iron_door", door(e.door)); continue; }
  g.set(x, y, z, e.b, e.s);
}

// Roof bulkhead on the tower (lift shaft and tanks): only where every cell under it is tower roof and inside.
let bulk = 0;
for (let z = 10; z <= 11; z++) for (let x = 3; x <= 5; x++) {
  if (topOf(x, z) !== 61 || faceOf(x, 60, z)) continue;
  bulk++;
  g.set(x, 61, z, "bricks"); g.set(x, 62, z, "stone_bricks");
}

const out = g.save(`${DIR}/NYC1034228.nbt`);
console.log(JSON.stringify({ ...out, bulkheadCells: bulk, footprint: top.size }));
