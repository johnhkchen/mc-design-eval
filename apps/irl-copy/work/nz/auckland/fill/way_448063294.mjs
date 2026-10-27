// Way 448063294, Auckland (Eden Terrace / Newton edge, seen from Maungawhau): a 1930s reinforced-concrete and brick
// commercial block. Four flat tiers (1, 2, 3 and 4 storeys, each with a cornice and coping) stepping up to the north-west
// corner, a shopfront storey on the street side, a solid brick shell 1 cell thick, and air behind every window.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_448063294.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..57, z 0..29

const W = 58, D = 30, H = 30;
const key = (x, z) => z * W + x;
const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]];                       // N, S, E, W
const DOOR = { x: 26, z: 29, face: [0, 1] };                             // the street door on the south face

// the footprint: ground (floor level, 0 or 1) and the lidar roof height
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(key(x, z), { g, r });
const inFP = (x, z) => x >= 0 && z >= 0 && x < W && z < D && fp.has(key(x, z));

// Lidar noise out: the 3x3 median of the roof over the footprint, then four flat tiers, each a whole number of storeys
// (4 blocks) plus a 2-block parapet: 6 = one storey, 10 = two, 14 = three, 18 = four (the tower, about 18 above its ground).
const tierOf = (r) => (r <= 7 ? 6 : r <= 10 ? 10 : r <= 14 ? 14 : 18);
const TOP = new Map(), GROUND = new Map();
for (const [k, { g, r }] of fp) {
  const x = k % W, z = Math.floor(k / W), vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFP(x + dx, z + dz)) vals.push(fp.get(key(x + dx, z + dz)).r);
  vals.sort((a, b) => a - b);
  TOP.set(k, tierOf(vals[vals.length >> 1])); GROUND.set(k, g);
}
// Then the tiers themselves: each cell takes the most common tier of its 5x5 footprint neighbourhood (ties keep the cell's
// own tier), two passes, so stray cells at a odd height merge into their tier and the massing comes out in blocks.
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const [k, t] of TOP) {
    const x = k % W, z = Math.floor(k / W), count = new Map();
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inFP(x + dx, z + dz)) { const v = TOP.get(key(x + dx, z + dz)); count.set(v, (count.get(v) ?? 0) + 1); }
    const most = Math.max(...count.values());
    next.set(k, count.get(t) === most ? t : Math.max(...[...count].filter(([, c]) => c === most).map(([v]) => v)));
  }
  TOP.clear(); for (const [k, t] of next) TOP.set(k, t);
}
const top = (x, z) => TOP.get(key(x, z));
const ground = (x, z) => GROUND.get(key(x, z));

// A shell cell is on the outside of the footprint, or beside a cell of another tier (a wall between two tiers).
const isShell = (x, z) => DIRS.some(([dx, dz]) => !inFP(x + dx, z + dz) || top(x + dx, z + dz) !== top(x, z));

// The outward face at height y: the neighbour is outside the footprint, or stands lower than y (open sky there).
const exposedFace = (x, z, y) => DIRS.find(([dx, dz]) => !inFP(x + dx, z + dz) || y >= top(x + dx, z + dz)) ?? null;

// Hashed picks for the warm lights, so the same build comes out every time.
const warm = (x, y, z) => (x * 31 + y * 7 + z * 17) % 9 === 0;

const g = new Voxels([W, H, D]);

// Every footprint cell: foundation from y 0 up to its ground, then the walls, floors and roof.
for (const [k, t] of TOP) {
  const x = k % W, z = Math.floor(k / W), gr = GROUND.get(k);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  if (!isShell(x, z)) {
    for (let y = gr; y < t; y++) {
      const rel = (y - gr) % 4;
      if (y === t - 1 || (rel === 0 && y <= t - 2)) g.set(x, y, z, "smooth_stone");   // roof deck and the storey floors
    }
    continue;
  }
  for (let y = gr; y < t; y++) {
    const rel = (y - gr) % 4, out = exposedFace(x, z, y);
    if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }                           // base course
    if (y === t - 1) {                                                                    // roof deck, coping on the edge
      if (DIRS.some(([dx, dz]) => !inFP(x + dx, z + dz))) g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === t - 2) { g.set(x, y, z, "stone_bricks"); continue; }                        // cornice band
    if (rel === 0) { g.set(x, y, z, "smooth_stone"); continue; }                          // storey string course
    if (!out) { g.set(x, y, z, "bricks"); continue; }                                     // shared wall: plain brick
    const u = out[0] !== 0 ? z : x;                                                        // position along the face
    if (rel === 3) { g.set(x, y, z, "smooth_quartz"); continue; }                         // lintel
    const isDoor = x === DOOR.x && z === DOOR.z && out[0] === DOOR.face[0] && out[1] === DOOR.face[1] && (y === gr + 1 || y === gr + 2);
    if (isDoor) {
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const k0 = (y - gr) < 4;                                                              // the shopfront storey
    if (u % 4 === 0) g.set(x, y, z, "smooth_quartz");                                     // pilaster
    else if (k0 || u % 4 !== 3) g.set(x, y, z, "glass_pane");                             // window (ground: full shopfront)
    else g.set(x, y, z, "bricks");                                                        // pier
  }
}

// Warm light behind some glass: a glowstone in the air gap just inside the window, where the cell in is not shell.
for (const [k, t] of TOP) {
  const x = k % W, z = Math.floor(k / W), gr = GROUND.get(k);
  if (!isShell(x, z)) continue;
  for (let y = gr + 1; y < t - 2; y++) {
    if ((y - gr) % 4 === 0 || (y - gr) % 4 === 3) continue;
    const out = exposedFace(x, z, y);
    if (!out || !warm(x, y, z)) continue;
    const ix = x - out[0], iz = z - out[1];
    if (inFP(ix, iz) && !isShell(ix, iz) && y >= GROUND.get(key(ix, iz))) g.set(ix, y, iz, "glowstone");
  }
}

// Roof plant on the tallest tier, on the deck's open cells (a unit every few cells, sat on the roof deck).
for (const [k, t] of TOP) {
  const x = k % W, z = Math.floor(k / W);
  if (t === 18 && !isShell(x, z) && x % 4 === 1 && z % 4 === 1) g.set(x, t, z, "iron_block");
}

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_448063294.nbt");
console.log(`way_448063294: ${blocks} blocks, palette ${palette}`);
