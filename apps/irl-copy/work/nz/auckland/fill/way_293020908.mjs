// WU Building (way 293020908), Mt Eden / Newton edge of the CBD, as a Minecraft module at 1.2 blocks per metre.
// Read from the lidar record: a 1980s-style concrete-and-tinted-glass office block, six storeys of 4 blocks on a
// stone plinth, a white-concrete stair-and-lift tower stepping up the north-west corner to about 47 blocks, a flat roof
// with plant boxes, and a recessed lobby on the south face where the ground is highest (y 4, the ground-floor datum).
// Hollow: a 1-block shell with a slab per storey and air between, so the glass has air behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020908.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020908.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof]
const key = (x, z) => `${x},${z}`;
const FP = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inFP = (x, z) => FP.has(key(x, z));

// Storey datum: the ground floor sits at y 4, the highest ground under the footprint (south face), so every cell is
// filled solid from y 0 (the plinth; downhill cells show their extra storey) and nothing floats on the slope.
const DATUM = 4, STOREY = 4;

// Smooth the lidar roof (3x3 median over footprint cells, drops single-cell noise), then quantise to whole storeys
// above the datum: a flat tier at 4 + 4n. The corner tower's 46 becomes 48 (about 47 blocks, the record's roof).
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const H = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const near = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const c = FP.get(key(x + dx, z + dz)); if (c) near.push(c.roof);
  }
  // the tower keeps its full height: a cell whose own 3x3 neighbourhood reaches the lidar's 44+ is not smoothed down
  const tight = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = FP.get(key(x + dx, z + dz)); if (c) tight.push(c.roof);
  }
  const r3 = median(tight);
  const r = r3 >= 44 ? r3 : median(near);
  H.set(key(x, z), DATUM + STOREY * Math.max(1, Math.round((r - DATUM) / STOREY)));
}
const h = (x, z) => H.get(key(x, z)) ?? 0;

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];          // north, south, west, east (outward)
// A face is exterior at height y when the neighbour is outside the footprint or its roof is at or below y.
const exteriorFaces = (x, z, y) => DIRS.filter(([dx, dz]) => !inFP(x + dx, z + dz) || h(x + dx, z + dz) <= y);

const GLASS = "light_blue_stained_glass_pane";
const g = new Voxels([33, 59, 33]);
const panes = [];
const hash = (x, y, z) => (x * 73856093 ^ y * 19349663 ^ z * 83492791) >>> 0;

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const top = h(x, z);
  const tower = top >= 40;
  const wall = tower ? "white_concrete" : "light_gray_concrete";
  // plinth to the datum: solid stone, the downhill side's extra storey
  for (let y = 0; y < DATUM; y++) g.set(x, y, z, "stone_bricks");

  for (let y = DATUM; y < top; y++) {
    const rel = (y - DATUM) % STOREY, storey = Math.floor((y - DATUM) / STOREY);
    const faces = exteriorFaces(x, z, y);
    if (y === top - 1) {                                   // the roof: cornice on the edge, deck inside
      g.set(x, y, z, faces.length ? "smooth_stone" : "gray_concrete");
      continue;
    }
    if (rel === 0) {                                       // storey line: floor slab, spandrel band on the face
      g.set(x, y, z, faces.length && storey === 0 ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (!faces.length) continue;                           // interior air (the room)
    if (faces.length >= 2 || rel === 3) { g.set(x, y, z, wall); continue; }   // corners and the head course
    const [dx, dz] = faces[0];
    const along = dz !== 0 ? x : z;                        // position along the face
    const entrance = storey === 0 && dz === 1 && z === 32 && x >= 9 && x <= 11;
    if (entrance && x === 10) {                            // lobby door, two blocks high
      const half = rel === 1 ? "lower" : "upper";
      g.set(x, y, z, "iron_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (along % 3 === 0) { g.set(x, y, z, wall); continue; }   // bay mullion
    g.set(x, y, z, GLASS);
    panes.push([x, y, z, dz !== 0]);
  }
}

// Roof: the lowest tier's edge gets a parapet, a plant box row sits on the deck, and the tower carries a lightning rod.
let topMax = 0, tower = null;
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const top = h(x, z);
  if (exteriorFaces(x, z, top - 1).length) g.set(x, top, z, top >= 40 ? "white_concrete" : "light_gray_concrete");
  if (top > topMax) { topMax = top; tower = [x, z]; }
}
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (h(x, z) === 28 && x >= 14 && x <= 19 && z >= 12 && z <= 15) g.set(x, 28, z, "light_gray_concrete");
}
if (tower) g.set(tower[0], topMax, tower[1], "lightning_rod");

// Glass: connect each pane to its neighbours along the face, and light some windows from behind (glowstone or
// shroomlight in the room cell just inside the glass).
for (const [x, y, z, alongX] of panes) {
  const solid = (a, b, c) => g.get(a, b, c) !== null;
  const state = alongX
    ? { north: "false", south: "false", east: String(solid(x + 1, y, z)), west: String(solid(x - 1, y, z)), waterlogged: "false" }
    : { north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)), east: "false", west: "false", waterlogged: "false" };
  g.set(x, y, z, GLASS, state);
}

// Lit windows: about one in five panes has a glowstone or shroomlight in the room just inside it (the cell one step
// in from the face, where the room air is).
for (const [x, y, z, alongX] of panes) {
  const n = hash(x, y, z) % 9;
  if (n !== 0 && n !== 4) continue;
  const inward = alongX
    ? [[x, z - 1], [x, z + 1]].find(([cx, cz]) => inFP(cx, cz) && h(cx, cz) > y && exteriorFaces(cx, cz, y).length === 0)
    : [[x - 1, z], [x + 1, z]].find(([cx, cz]) => inFP(cx, cz) && h(cx, cz) > y && exteriorFaces(cx, cz, y).length === 0);
  if (inward) g.set(inward[0], y, inward[1], n === 0 ? "glowstone" : "shroomlight");
}

// Lobby: lanterns hang under the entrance soffit, lighting the recess at dusk.
g.set(9, 7, 32, "lantern", { hanging: "true", waterlogged: "false" });
g.set(11, 7, 32, "lantern", { hanging: "true", waterlogged: "false" });

const stats = g.save(OUT);
console.log(JSON.stringify({ footprint: cells.length, tallestTop: topMax, ...stats }));
