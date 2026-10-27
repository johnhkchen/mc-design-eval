// One NZ: a glass-and-concrete office block of the 1990s-2000s on a stone podium, 107 x 87 blocks, its tallest tier
// 84 blocks (about 17 storeys). The lidar roof is median-smoothed over 5 x 5 cells and snapped to 4-block storeys, so each
// tier is flat and stands on the one below. Facade: a stone base course, white spandrels, grey mullions, cyan glass panes
// with a shopfront at ground level, a dark-oak entrance with a lintel, a parapet and cornice, roof plant boxes. Interiors are
// solid except a one-block air gap behind the glass with a floor slab per storey, and lamps in some of those gaps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const W = 107, D = 87, STORY = 4, MAX_TOP = 84;
const cells = JSON.parse(readFileSync(`${DIR}/way_293128269.cells.json`, "utf8"));

const G = new Int16Array(W * D).fill(-1), R = new Int16Array(W * D);
for (const [x, z, ground, roof] of cells) { G[z * W + x] = ground; R[z * W + x] = roof; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[z * W + x] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (dx, dz) => `${dx},${dz}`;

// Flat tiers: the median of the lidar roof over a 7 x 7 cell window, snapped to whole storeys (5 x 5 left needle spires, 9 x 9 flattened the tower).
const T = new Int16Array(W * D);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const v = [];
  for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) if (inside(x + dx, z + dz)) v.push(R[(z + dz) * W + x + dx]);
  v.sort((a, b) => a - b);
  T[z * W + x] = Math.min(MAX_TOP, Math.max(STORY, STORY * Math.round(v[v.length >> 1] / STORY)));
}
const top = (x, z) => T[z * W + x];

// The sides of a cell that face open air at height y: off the footprint, or next to a tier that stops below y.
function openSides(x, z, y) {
  const out = [];
  for (const [dx, dz] of DIRS) if (!inside(x + dx, z + dz) || top(x + dx, z + dz) <= y) out.push([dx, dz]);
  return out;
}
const outerAt = (x, z, y) => inside(x, z) && y < top(x, z) && openSides(x, z, y).length > 0;

// The main entrance: the face with the most open cells at street level, centred on that face.
const count = new Map();
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inside(x, z))
  for (const [dx, dz] of openSides(x, z, 1)) count.set(key(dx, dz), (count.get(key(dx, dz)) || 0) + 1);
const [entKey] = [...count].sort((a, b) => b[1] - a[1])[0];
const [edx, edz] = entKey.split(",").map(Number);
const along = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++)
  if (inside(x, z) && openSides(x, z, 1).some(([a, b]) => a === edx && b === edz)) along.push(edx !== 0 ? z : x);
along.sort((a, b) => a - b);
const entrance = { c0: along[along.length >> 1], dx: edx, dz: edz };
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// What the outside of the wall is at (x, y, z): a corner pier, a door, a shopfront, a glass pane, a mullion, a spandrel...
function facadeBlock(x, z, y) {
  if (!outerAt(x, z, y)) return null;
  const t = top(x, z), open = openSides(x, z, y);
  if (open.length >= 2) return { b: "light_gray_concrete" };
  const [dx, dz] = open[0];
  const c = dx !== 0 ? z : x;
  const atEntrance = open.some(([a, b]) => a === entrance.dx && b === entrance.dz) && Math.abs(c - entrance.c0) <= 2;
  if (atEntrance) {
    if (y === 0) return { b: "stone_bricks" };
    if (y === 3) return { b: "light_gray_concrete" };
    if (c === entrance.c0) return { door: true, facing: FACING[key(dx, dz)], half: y === 1 ? "lower" : "upper" };
    return { b: "light_blue_stained_glass" };
  }
  if (y === 0) return { b: "stone_bricks" };                                // base course
  if (y === t - 1) return { b: "smooth_stone" };                            // cornice
  if (y % STORY === 0) return { b: "white_concrete" };                      // storey spandrel
  if (c % 3 === 0) return { b: "light_gray_concrete" };                     // mullion
  if (y < STORY) return { b: "light_blue_stained_glass" };                  // shopfront
  const planeAlongZ = dx !== 0;                                             // the pane joins its neighbours in the wall plane
  return { b: "cyan_stained_glass_pane", pane: true,
    s: { north: String(planeAlongZ), south: String(planeAlongZ), east: String(!planeAlongZ), west: String(!planeAlongZ), waterlogged: "false" } };
}

// Air gap behind the glass: the inside cell next to a facade cell, below the roof.
const gapAt = (x, z, y) => inside(x, z) && y < top(x, z) - 1 && !outerAt(x, z, y) && DIRS.some(([dx, dz]) => outerAt(x + dx, z + dz, y) && y < top(x + dx, z + dz) - 1);
const hash = (x, y, z) => (x * 73 + y * 151 + z * 307 + ((x * z) % 17) * 13) % 97;

const g = new Voxels([W, 95, D]);
const placeFacade = (x, y, z, f) => {
  if (f.door) {
    const st = { facing: f.facing, half: f.half, hinge: "left", open: "false", powered: "false" };
    g.set(x, y, z, "dark_oak_door", st);
  } else g.set(x, y, z, f.b, f.s);
};

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const t = top(x, z), gr = G[z * W + x];
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");                    // foundation down to y 0
  for (let y = gr; y < t; y++) {
    const f = facadeBlock(x, z, y);
    if (f) { placeFacade(x, y, z, f); continue; }
    if (y === t - 1) { g.set(x, y, z, "gray_concrete"); continue; }        // roof membrane
    if (gapAt(x, z, y)) {
      if (y % STORY === 0) { g.set(x, y, z, "smooth_quartz"); continue; }   // floor slab per storey
      const lit = DIRS.some(([dx, dz]) => facadeBlock(x + dx, z + dz, y)?.pane);
      if (lit && y % STORY === 1 && hash(x, y, z) % 5 === 0) {              // warm light behind a pane, standing on the slab
        if (hash(x, y, z) % 2) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
        else g.set(x, y, z, "glowstone");
      }
      continue;
    }
    g.set(x, y, z, "stone");                                                // solid core
  }
  if (outerAt(x, z, t)) g.set(x, t, z, "light_gray_concrete");              // parapet on the outer wall
}

// Roof plant: 3 x 3 boxes of two blocks on roofs of the taller tiers, placed only on flat interior roof.
const used = new Set();
for (let z = 0; z + 2 < D; z++) for (let x = 0; x + 2 < W; x++) {
  const t = top(x, z);
  if (!inside(x, z) || t < 16 || hash(x, t, z) % 29 !== 0) continue;
  let ok = true;
  for (let dz = 0; dz < 3 && ok; dz++) for (let dx = 0; dx < 3 && ok; dx++) {
    const cx = x + dx, cz = z + dz;
    ok = inside(cx, cz) && top(cx, cz) === t && !openSides(cx, cz, t - 1).length && !used.has(cz * W + cx);
  }
  if (!ok) continue;
  for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) {
    used.add((z + dz) * W + x + dx);
    g.set(x + dx, t, z + dz, "light_gray_concrete");
    g.set(x + dx, t + 1, z + dz, dx === 1 && dz === 1 ? "iron_bars" : "light_gray_concrete");
  }
}

// Every block must stand on something: the block below, or (a floor plate over the air gap) a solid neighbour in its own course.
let floating = 0, vertical = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inside(x, z))
  for (let y = 1; y < 95; y++) if (g.val(x, y, z) && !g.val(x, y - 1, z)) {
    vertical++;
    if (!DIRS.some(([dx, dz]) => g.val(x + dx, y, z + dz))) floating++;
  }
console.log(JSON.stringify({ verticallyUnsupported: vertical }));
const stats = g.save(`${DIR}/way_293128269.nbt`);
console.log(JSON.stringify({ storeys: Math.max(...T) / STORY, topMax: Math.max(...T), entrance: entKey, floatingBlocks: floating, ...stats }));
