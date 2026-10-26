// FR241937481: a residential block of 1870 on the Paris footprint (11 x 41 cells). Haussmann massing: a plinth, a shopfront
// ground floor, four floors of bricks between stone string courses, a mansard with dormers on the tall cells, and flat-roofed
// wings at 30, 22 and 16 blocks where the lidar drops. Every column stands on the plinth and each storey on a full slab.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241937481.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR241937481.nbt";

const W = 11, D = 41, H = 49;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const roofAt = new Map();
for (const [x, z, , r] of cells) roofAt.set(key(x, z), r);
const inFp = (x, z) => roofAt.has(key(x, z));

// Lidar roof smoothed by the median of each cell's footprint neighbourhood, then snapped to four tiers.
const tierOf = (r) => (r >= 31 ? 33 : r >= 27 ? 30 : r >= 19 ? 22 : 16);
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
const cell = new Map();
for (const [x, z, g] of cells) {
  const around = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) around.push(roofAt.get(key(x + dx, z + dz)));
  cell.set(key(x, z), { x, z, g, T: tierOf(median(around)) });
}

// Distance from the outside edge (1 on the perimeter): the mansard steps in one cell per row.
const dist = new Map();
const queue = [];
for (const c of cell.values()) if (DIRS.some(([dx, dz]) => !inFp(c.x + dx, c.z + dz))) { dist.set(key(c.x, c.z), 1); queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS) {
    const k = key(c.x + dx, c.z + dz);
    if (inFp(c.x + dx, c.z + dz) && !dist.has(k)) { dist.set(k, d + 1); queue.push(cell.get(k)); }
  }
}

// A wall face is exposed where the neighbour is outside the footprint, or lower than this row (the roof above it is open).
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => { const n = cell.get(key(x + dx, z + dz)); return !n || n.T <= y; });

const MANSARD_TOP = 33, MANSARD_START = 26;
const MANSARD_K = [2, 2, 3, 4, 4, 5, 6];      // solid while distance >= K[row]: eave, steps, ridge on the tall cells

const BRICK = "bricks", STONE = "smooth_stone", QUOIN = "stone_bricks", ROOF = "deepslate_tiles", GLASS_PANE = "glass_pane";

const g = new Voxels([W, H, D]);
for (const c of cell.values()) {
  const { x, z, T } = c, d = dist.get(key(x, z));

  // plinth on the lowest ground, then the solid column up to the roof
  g.set(x, 0, z, STONE);

  for (let y = 1; y < T; y++) {
    if (y % 5 === 0 && y < T - 1) { g.set(x, y, z, STONE); continue; }     // floor slab and string course
    if (T === MANSARD_TOP && y >= MANSARD_START) {
      const k = MANSARD_K[y - MANSARD_START];
      if (d >= k) g.set(x, y, z, ROOF);
      continue;
    }
    if (y === T - 1) { g.set(x, y, z, ROOF); continue; }                  // flat roof, or the mansard's top row handled above
    const ex = exposed(x, z, y);
    if (!ex.length) continue;                                             // interior: air behind the glass
    const xFace = ex.some(([dx]) => dx !== 0), zFace = ex.some(([, dz]) => dz !== 0);
    if (xFace && zFace) { g.set(x, y, z, QUOIN); continue; }              // corner quoins
    const along = xFace ? z : x;
    const s = 5 * Math.floor(y / 5), row = y - s, win = along % 2 === 0;
    if (s === 0) {
      if (row === 1) g.set(x, y, z, QUOIN);                               // base course
      else if (row === 4) g.set(x, y, z, STONE);                          // sign band
      else g.set(x, y, z, win ? "glass" : QUOIN);                        // shopfront glass between pilasters
    } else if (row === 1 || row === 4) {
      g.set(x, y, z, win ? STONE : BRICK);                                // sill and lintel
    } else {
      g.set(x, y, z, win ? GLASS_PANE : BRICK);
    }
  }

  // dormer windows on the mansard steps that face outward
  if (T === MANSARD_TOP) {
    for (const y of [27, 28]) {
      if (d < MANSARD_K[y - MANSARD_START]) continue;
      const out = DIRS.find(([dx, dz]) => dist.get(key(x + dx, z + dz)) === d - 1);
      if (!out) continue;
      const along = out[0] !== 0 ? z : x;
      if (along % 4 === 2) g.set(x, y, z, GLASS_PANE);
    }
  }
}

// Entrance on the west face, near the middle: a dark oak door, a hanging lantern, and the stone sign band above.
const doorCand = [...cell.values()]
  .filter((c) => c.T >= 30 && !inFp(c.x - 1, c.z) && c.x <= 1)
  .sort((a, b) => Math.abs(a.z - 20) - Math.abs(b.z - 20));
const door = doorCand[0];
if (door) {
  const facing = { facing: "west", hinge: "left", open: "false", powered: "false" };
  g.set(door.x, 1, door.z, "dark_oak_door", { ...facing, half: "lower" });
  g.set(door.x, 2, door.z, "dark_oak_door", { ...facing, half: "upper" });
  g.set(door.x, 3, door.z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Chimney stacks on the flat wings' roofs, and warm lamps behind some upper-floor windows.
for (const c of cell.values()) {
  const { x, z, T } = c, d = dist.get(key(x, z));
  if (T !== MANSARD_TOP && d >= 2 && x % 4 === 1 && z % 8 === 4) {
    g.set(x, T, z, BRICK); g.set(x, T + 1, z, BRICK); g.set(x, T + 2, z, STONE, { type: "bottom" });
  }
}
for (const c of cell.values()) {
  const { x, z, T } = c;
  for (let s = 5; s + 3 < T - 1; s += 5) {
    const y = s + 2, ex = exposed(x, z, y);
    if (!ex.length) continue;
    const [dx, dz] = ex[0];
    const along = dx !== 0 ? z : x;
    if (along % 6 !== 0) continue;
    const xi = x - dx, zi = z - dz;
    if (inFp(xi, zi) && g.val(xi, y, zi) === 0) g.set(xi, y, zi, "glowstone");
  }
}

const info = g.save(OUT);
console.log(`built ${OUT}: ${info.blocks} blocks, palette ${info.palette}`);
