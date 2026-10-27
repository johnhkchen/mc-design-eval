// WF Building (way 104475940): a 1970s-80s Auckland office tower in white concrete and blue glass. The lidar roof
// gives three clean tiers: a low wing (37), a shoulder (52) and a central core (55) set back one ring from the shoulder.
// Every column stands on a stone foundation from y 0 to its ground; walls are a one-block shell around an air
// interior with a floor slab per storey (4 blocks: spandrel, two glass rows, head band); a granite base course, a
// dark-oak entrance on the south face under a canopy, a parapet at each roof edge, roof boxes and a mast on the core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_104475940.cells.json", "utf8"));

const W = 58, H = 67, D = 61;
const CORE = 55, SHOULDER = 52, WING = 37;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];      // +x, -x, +z (south), -z (north)
const key = (x, z) => `${x},${z}`;

// 1. Tiers: snap the lidar roof to three levels (noise-free), then pull the core back one ring where it meets a lower tier.
const cellAt = new Map();
for (const [x, z, G, R] of cells) {
  const base = R >= 54 ? CORE : R >= 49 ? SHOULDER : R >= 30 ? WING : R;
  cellAt.set(key(x, z), { G, T: Math.max(base, G + 8) });
}
const setback = [];
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const c = cellAt.get(key(x, z));
  if (c.T !== CORE) continue;
  if (NB.some(([dx, dz]) => { const n = cellAt.get(key(x + dx, z + dz)); return !n || n.T < CORE; })) setback.push(c);
}
for (const c of setback) c.T = SHOULDER;

// Which sides of a cell are open air at height y: outside the footprint, or over a neighbour whose roof is lower.
function openSides(x, y, z, c) {
  const out = [];
  NB.forEach(([dx, dz], i) => {
    const n = cellAt.get(key(x + dx, z + dz));
    if (n ? y >= n.T : y >= c.G) out.push(i);
  });
  return out;
}

// 2. Facade for an exposed wall cell at height y.
function facade(x, y, z, c, sides) {
  if (y === c.G) return { b: "polished_granite" };                                    // base course
  const corner = sides.length >= 2 && (sides.includes(0) || sides.includes(1)) && (sides.includes(2) || sides.includes(3));
  if (corner) return { b: "white_concrete" };                                          // concrete corner piers
  const m = y % 4;
  if (m === 0) return { b: "white_concrete" };                                         // spandrel = storey slab line
  if (m === 3) return { b: "light_gray_concrete" };                                    // head band under each storey
  const alongZ = sides.some((i) => i === 0 || i === 1);                                // wall runs along z on an x face
  const s = alongZ ? z : x;
  if (s % 3 === 0) return { b: y < c.G + 4 ? "polished_granite" : "white_concrete" };  // mullions (granite at the base)
  return { b: "light_blue_stained_glass" };
}

const grid = new Voxels([W, H, D]);

// 3. Massing: stone foundation to the ground, then the shell and the air interior with its floor slabs.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const c = cellAt.get(key(x, z));
  for (let y = 0; y < c.G; y++) grid.set(x, y, z, "stone_bricks");
  for (let y = c.G; y < c.T; y++) {
    const sides = openSides(x, y, z, c);
    let f = null;
    if (y === c.T - 1) f = { b: sides.length ? "light_gray_concrete" : "smooth_stone" };   // roof cap, cornice on the edge
    else if (sides.length) f = facade(x, y, z, c, sides);
    else if (y === c.G) f = { b: "smooth_stone" };                                         // lobby floor
    else if (y % 4 === 0) f = { b: "white_concrete" };                                     // interior storey slab
    if (f) grid.set(x, y, z, f.b, f.st);
  }
}

// 4. Parapet on every roof edge (outside edge, or a step down to a lower tier).
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const c = cellAt.get(key(x, z));
  if (NB.some(([dx, dz]) => { const n = cellAt.get(key(x + dx, z + dz)); return !n || n.T < c.T; })) grid.set(x, c.T, z, "white_concrete");
}

// 5. Roof plant: 2x2 boxes on the core and a mast on its middle.
let cx = 0, cz = 0, nCore = 0;
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const c = cellAt.get(key(x, z));
  if (c.T !== CORE) continue;
  cx += x; cz += z; nCore++;
  if (x % 8 === 3 && z % 8 === 3 && [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => cellAt.get(key(x + dx, z + dz))?.T === CORE)) {
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) for (const y of [CORE, CORE + 1]) grid.set(x + dx, y, z + dz, "light_gray_concrete");
  }
}
{
  const mx = Math.round(cx / nCore), mz = Math.round(cz / nCore);
  let best = null;
  for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
    if (cellAt.get(key(x, z)).T !== CORE) continue;
    const d = (x - mx) ** 2 + (z - mz) ** 2;
    if (!best || d < best.d) best = { x, z, d };
  }
  for (let y = CORE; y < CORE + 5; y++) grid.set(best.x, y, best.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// 6. Entrance: the south-most exposed south face near the middle of the building, a dark-oak door and a canopy on posts.
let door = null;
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (cellAt.has(key(x, z + 1)) || z > 57) continue;
  if (!door || z > door.z || (z === door.z && Math.abs(x - 29) < Math.abs(door.x - 29))) door = { x, z, G: cellAt.get(key(x, z)).G };
}
const dy = door.G + 1;
grid.set(door.x, dy, door.z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
grid.set(door.x, dy + 1, door.z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let dx = -2; dx <= 2; dx++) {
  for (const dz of [1, 2]) if (!cellAt.has(key(door.x + dx, door.z + dz))) grid.set(door.x + dx, door.G + 3, door.z + dz, "smooth_stone");
}
for (const dx of [-2, 2]) {
  const px = door.x + dx, pz = door.z + 2;
  for (let y = 0; y < door.G; y++) grid.set(px, y, pz, "stone_bricks");
  for (let y = door.G; y < door.G + 3; y++) grid.set(px, y, pz, "polished_granite");
}

// 7. Warm lights: some upper-floor windows get a glowstone just inside the glass.
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const c = cellAt.get(key(x, z));
  for (let y = c.G + 4; y < c.T - 1; y++) {
    if (y % 4 === 0 || y % 4 === 3) continue;
    const sides = openSides(x, y, z, c);
    if (!sides.length || c.T - 1 - y < 2) continue;
    if (hash(x, y, z) % 100 >= 12) continue;
    const [dx, dz] = NB[sides[0]];
    const inner = cellAt.get(key(x - dx, z - dz));
    if (inner && y >= inner.G && y < inner.T - 1) grid.set(x - dx, y, z - dz, "glowstone");
  }
}

const stats = grid.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_104475940.nbt");
console.log(JSON.stringify({ footprint: cells.length, ...stats, door: { x: door.x, y: dy, z: door.z }, core: nCore }));
