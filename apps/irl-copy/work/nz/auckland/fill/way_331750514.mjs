// Atrium on Elliott: a 1990s-2000s glass-and-concrete office tower on a stone podium, with a sunken ground-level
// atrium court in the middle of its plan. Massing follows the lidar roof (median-smoothed, quantised to 4-block
// storeys so the setbacks are flat tiers); each storey is a 4-block bay: spandrel, two rows of glass, a head band;
// piers every 4 blocks; a shopfront base with a door and a canopy on the west face; warm glowstone behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_331750514.cells.json", "utf8"));
const W = 87, H = 127, D = 104;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const K = (x, z) => x * 1000 + z;

// per footprint cell: ground g, lidar roof r, smoothed roof rs, court flag, and the flat tier top Q
const info = new Map();
for (const [x, z, g, r] of cells) info.set(K(x, z), { x, z, g, r });
for (const c of info.values()) {
  const a = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const n = info.get(K(c.x + dx, c.z + dz)); if (n) a.push(n.r); }
  a.sort((p, q) => p - q); c.rs = a[a.length >> 1];
  // a low, enclosed hollow in the middle of the plan is the atrium: open to the sky at ground level
  c.court = DIRS.every(([dx, dz]) => info.has(K(c.x + dx, c.z + dz))) && c.rs - c.g < 6;
  c.Q = c.court ? null : Math.max(4 * Math.round(c.rs / 4), c.g + 8);
}
// the lidar's tallest cells (the roof near 115) are a thin diagonal strip one or two blocks wide, which reads as a
// needle: read it as a tower core (within two blocks of it, 116 high) with a setback ring two more blocks out (96 high)
const ring = new Map();
let frontier = [...info.values()].filter((c) => c.r >= 95 && !c.court);
for (const c of frontier) ring.set(K(c.x, c.z), 0);
for (let d = 1; d <= 4; d++) {
  const next = [];
  for (const c of frontier) for (const [dx, dz] of DIRS) {
    const n = info.get(K(c.x + dx, c.z + dz));
    if (n && !n.court && !ring.has(K(n.x, n.z))) { ring.set(K(n.x, n.z), d); next.push(n); }
  }
  frontier = next;
}
for (const c of info.values()) {
  const d = ring.get(K(c.x, c.z));
  if (c.court || d === undefined) continue;
  c.Q = Math.max(c.Q, d <= 2 ? 116 : 96);
}
const maxQ = Math.max(...[...info.values()].filter((c) => !c.court).map((c) => c.Q));

// the west face's entrance: the middle two cells of the west edge
const minX = Math.min(...[...info.values()].filter((c) => !c.court).map((c) => c.x));
const westZ = [...info.values()].filter((c) => c.x === minX && !c.court).map((c) => c.z).sort((a, b) => a - b);
const doorZ = [westZ[westZ.length >> 1], westZ[(westZ.length >> 1) + 1]];
const canopyZ = [doorZ[0] - 1, doorZ[0], doorZ[1], doorZ[1] + 1];

// a neighbour column is open to the outside at height y if it is absent, the atrium court above its floor, or a
// building cell above its own roof (a setback's exposed side). Another building cell is closed (shared room)
function open(nx, nz, y) {
  const n = info.get(K(nx, nz));
  if (!n) return true;
  if (n.court) return y >= n.g;
  return y >= n.Q;
}
const openSides = (x, z, y) => DIRS.filter(([dx, dz]) => open(x + dx, z + dz, y));

function facade(c, x, y, z, sides) {
  const k = Math.floor((y - c.g) / 4), o = (y - c.g) % 4;
  if (y === c.Q - 1) return ["smooth_stone"];                       // cornice band
  const [dx] = sides[0];
  const along = dx !== 0 ? z : x;
  const pier = sides.length > 1 || along % 4 === 0;
  if (k === 0 && x === minX && (o === 1 || o === 2) && doorZ.includes(z)) {
    return ["iron_door", { facing: "west", half: o === 1 ? "lower" : "upper", hinge: z === doorZ[0] ? "left" : "right", open: "false", powered: "false" }];
  }
  if (k === 0) {                                                    // shopfront: granite base, glass, black frames, fascia
    if (o === 0) return ["polished_granite"];
    if (o === 3) return x === minX && canopyZ.includes(z) ? ["stone_brick_slab", { type: "top", waterlogged: "false" }] : ["gray_concrete"];
    return pier ? ["black_concrete"] : ["light_blue_stained_glass"];
  }
  if (pier) return ["white_concrete"];                              // office bays: piers, spandrels, glass, head band
  if (o === 0) return ["light_gray_concrete"];
  if (o === 3) return ["gray_concrete"];
  return ["light_blue_stained_glass"];
}

// what stands at (x, y, z), as [block, state?] or null
function facadeAt(x, y, z) {
  const c = info.get(K(x, z));
  if (!c || c.court || y < c.g || y >= c.Q) return null;
  const sides = openSides(x, z, y);
  return sides.length ? facade(c, x, y, z, sides) : null;
}
const isGlass = (x, y, z) => { const f = facadeAt(x, y, z); return !!f && f[0] === "light_blue_stained_glass"; };

function cellAt(x, y, z) {
  const c = info.get(K(x, z));
  if (!c) return null;
  if (y < c.g) return y === c.g - 1 ? ["smooth_stone"] : ["stone_bricks"];      // foundation and paved ground
  if (c.court) return null;                                                      // the atrium stays open to the sky
  if (y >= c.Q) {
    const edge = DIRS.some(([dx, dz]) => !info.has(K(x + dx, z + dz)));
    if (y === c.Q && edge) return ["white_concrete"];                           // parapet on the footprint's edge
    // roof plant: 8 x 8 boxes, 3 high, on the top tier
    const inner = DIRS.every(([dx, dz]) => { const n = info.get(K(x + dx, z + dz)); return n && !n.court && n.Q === maxQ; });
    if (c.Q === maxQ && y < c.Q + 3 && inner && ((x >> 3) + (z >> 3)) % 2 === 0) return y === c.Q + 2 ? ["smooth_stone_slab", { type: "bottom", waterlogged: "false" }] : ["light_gray_concrete"];
    return null;
  }
  const sides = openSides(x, z, y);
  if (sides.length) return facade(c, x, y, z, sides);
  if (y === c.Q - 1 || openSides(x, z, y + 1).length) return c.Q <= 40 ? ["moss_block"] : ["gray_concrete"];   // roof membrane: planted podium terraces, grey above; also the floor a setback exposes
  const o = (y - c.g) % 4;
  if (o === 0) return ["light_gray_concrete"];                                  // floor slab per storey
  // warm glowstone standing on the floor, behind a pane of glass, in some bays
  if (o === 1 && ((Math.imul(x, 73856093) ^ Math.imul(z, 19349663) ^ Math.imul(y, 83492791)) >>> 0) % 9 === 0 &&
    DIRS.some(([dx, dz]) => isGlass(x + dx, y, z + dz))) return ["glowstone"];
  return null;
}

const V = new Voxels([W, H, D]);
let placed = 0;
for (const c of info.values()) {
  for (let y = 0; y < H; y++) {
    const b = cellAt(c.x, y, c.z);
    if (!b) continue;
    V.set(c.x, y, c.z, b[0], b[1]);
    placed++;
  }
}
const stats = V.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_331750514.nbt");
console.log(JSON.stringify({ cells: info.size, courtCells: [...info.values()].filter((c) => c.court).length, maxQ, placed, ...stats }));
