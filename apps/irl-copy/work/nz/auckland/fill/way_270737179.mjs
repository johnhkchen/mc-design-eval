// Mt Eden shop-and-residence, Auckland: a two-storey Edwardian brick commercial block of the kind that lines the
// Mt Eden and Eden Terrace roads. Red brick walls on a stone plinth, cream rendered string courses and cornice,
// a dark-timbered shopfront on the ground floor with a door on the street face, and a stepped lower wing on the east
// (its ground is two blocks higher). Each storey is 4 blocks (about 3.3 m), counted from its own ground. The facade
// sits in front of a one-block air gap; the body behind it is solid, so every floor and tier stands on what is below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270737179.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270737179.nbt";

const W = 18, D = 9, H = 20, STOREY = 4, MAX_STOREYS = 2;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const idx = (x, z) => z * W + x;
const ground = new Int16Array(W * D).fill(-1);       // -1 = outside the footprint
const roof = new Int16Array(W * D);
for (const [x, z, g, r] of cells) { ground[idx(x, z)] = g; roof[idx(x, z)] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[idx(x, z)] >= 0;

// The four sides: E = +x, S = +z. The facing word is what a door's `facing` state takes.
const SIDES = [
  { dx: 1, dz: 0, name: "E", facing: "east" },
  { dx: -1, dz: 0, name: "W", facing: "west" },
  { dx: 0, dz: 1, name: "S", facing: "south" },
  { dx: 0, dz: -1, name: "N", facing: "north" },
];

// 1. Smooth the lidar roof: the median over a 5x5 neighbourhood of footprint cells, then whole storeys from the ground.
//    The wide window keeps single-cell notches from becoming towers.
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const storeys = new Int8Array(W * D);
const top = new Int16Array(W * D);                    // absolute y of the roof surface (the first air block)
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inside(x + dx, z + dz)) vals.push(roof[idx(x + dx, z + dz)]);
  const rs = median(vals), c = idx(x, z);
  storeys[c] = Math.min(MAX_STOREYS, Math.max(1, Math.round((rs - ground[c]) / STOREY)));
  top[c] = ground[c] + STOREY * storeys[c];
}

// 2. Facade cells: a footprint cell on the outside edge, or beside a cell with a lower roof, faces that way. Two outside
//    faces make a true corner (a quoin); a step-down beside an outside face is just facade. Behind a single-face cell,
//    one cell in, is the air gap.
const faceDirs = new Map();                            // cell index -> [{ side, outside }]
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const c = idx(x, z), dirs = [];
  for (const s of SIDES) {
    const nx = x + s.dx, nz = z + s.dz;
    if (!inside(nx, nz)) dirs.push({ ...s, outside: true });
    else if (top[idx(nx, nz)] < top[c]) dirs.push({ ...s, outside: false });
  }
  if (dirs.length) faceDirs.set(c, dirs);
}
const isCorner = (dirs) => dirs.filter((d) => d.outside).length >= 2;
const faceOf = (dirs) => (dirs.length && !isCorner(dirs) ? dirs.find((d) => d.outside) || dirs[0] : null);
const gap = new Uint8Array(W * D);
for (const [c, dirs] of faceDirs) {
  const s = faceOf(dirs);
  if (!s || isCorner(dirs)) continue;
  const x = c % W, z = Math.floor(c / W);
  const gx = x - s.dx, gz = z - s.dz;
  if (inside(gx, gz) && !faceDirs.has(idx(gx, gz))) gap[idx(gx, gz)] = 1;
}

// 3. The shop door: on the street face with the most outside ground-floor cells, the cell nearest that face's middle
//    on the lowest ground.
const faceCount = {};
for (const [, dirs] of faceDirs) { const s = faceOf(dirs); if (s && s.outside) faceCount[s.name] = (faceCount[s.name] || 0) + 1; }
const doorFace = Object.entries(faceCount).sort((a, b) => b[1] - a[1])[0][0];
const doorSide = SIDES.find((s) => s.name === doorFace);
const doorCands = [];
for (const [c, dirs] of faceDirs) { const s = faceOf(dirs); if (s && s.outside && s.name === doorFace) doorCands.push(c); }
const along = (c) => (doorSide.dx !== 0 ? Math.floor(c / W) : c % W);
const mid = doorCands.reduce((a, c) => a + along(c), 0) / doorCands.length;
doorCands.sort((a, b) => ground[a] - ground[b] || Math.abs(along(a) - mid) - Math.abs(along(b) - mid));
const doorCell = doorCands[0];

// 4. Build the massing, column by column, from y 0.
const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const warm = (x, z, k) => (x * 5 + z * 7 + k) % 3 === 0;   // which upper windows carry a light behind the glass

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const c = idx(x, z), gr = ground[c], R = top[c];
  const dirs = faceDirs.get(c) || [];
  const face = faceOf(dirs);
  const corner = dirs.length > 0 && isCorner(dirs);
  const outward = dirs.some((d) => d.outside);
  const isDoor = c === doorCell;
  // the along-face index: the window grid is three cells wide, with a brick pier every third cell
  const a = face ? (face.dx !== 0 ? z : x) : 0;
  const pier = a % 3 === 0;

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");                 // foundation up to the cell's ground

  for (let y = gr; y < R; y++) {
    const rel = y - gr, k = rel >> 2, rr = rel & 3, topRow = y === R - 1;
    if (corner) {                                                             // corners: brick on the same storey lines as the facade
      put(x, y, z, rr === 0 ? (k === 0 ? "polished_andesite" : "smooth_quartz") : "bricks");
      continue;
    }
    if (face) {
      if (k === 0) {                                                          // ground floor: plinth, shopfront, fascia
        if (rr === 0) put(x, y, z, "polished_andesite");
        else if (rr === 3) put(x, y, z, "dark_oak_planks");
        else if (isDoor && face.name === doorFace) {
          if (rr === 1) put(x, y, z, "dark_oak_door", { facing: face.facing, half: "lower", hinge: "left", open: "false", powered: "false" });
          else put(x, y, z, "dark_oak_door", { facing: face.facing, half: "upper", hinge: "left", open: "false", powered: "false" });
        }
        else if (pier) put(x, y, z, "dark_oak_planks");
        else put(x, y, z, "glass");
      } else {                                                                // upper floors: sill, sash windows, head
        if (rr === 0) put(x, y, z, "smooth_quartz");                          // string course
        else if (rr === 3) put(x, y, z, "bricks");                            // spandrel
        else if (pier) put(x, y, z, "bricks");
        else put(x, y, z, "glass");
      }
      continue;
    }
    if (gap[c] && (rr === 1 || rr === 2)) {
      if (rr === 1 && k > 0 && warm(x, z, k)) put(x, y, z, "glowstone");      // a warm light behind an upper window
      continue;                                                                // the air gap
    }
    if (topRow) put(x, y, z, "smooth_stone");                                  // roof membrane
    else put(x, y, z, rr === 0 && k > 0 ? "smooth_quartz" : "bricks");          // body; floor lines in stone
  }

  // Parapet: brick on the outside edge with a stone coping, the cornice line running round below it.
  if (outward && !corner) {
    put(x, R, z, "bricks");
    put(x, R + 1, z, "smooth_quartz_slab", { type: "bottom" });
  }
}

// Roof plant: 2x2 units, 1 high, on roof areas at least one cell in from the edge.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (x % 6 !== 2 || z % 4 !== 1) continue;
  const c = idx(x, z);
  if (!inside(x, z) || faceDirs.has(c)) continue;
  const R = top[c];
  const pad = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => inside(x + dx, z + dz) && !faceDirs.has(idx(x + dx, z + dz)) && top[idx(x + dx, z + dz)] === R);
  if (!pad) continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) put(x + dx, R, z + dz, "iron_block");
}

// Verify: nothing floats. Every block must connect to the ground through face-adjacent blocks. A window head over
// the air gap is held up by the wall beside it, so a block-below test would flag every window; connection does not.
const seen = new Uint8Array(W * H * D), at3 = (x, y, z) => (z * H + y) * W + x;
const queue = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (g.val(x, 0, z)) { seen[at3(x, 0, z)] = 1; queue.push([x, 0, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, y, z] = queue[i];
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const nx = x + dx, ny = y + dy, nz = z + dz;
    if (nx < 0 || ny < 0 || nz < 0 || nx >= W || ny >= H || nz >= D) continue;
    if (seen[at3(nx, ny, nz)] || !g.val(nx, ny, nz)) continue;
    seen[at3(nx, ny, nz)] = 1; queue.push([nx, ny, nz]);
  }
}
let floating = 0;
for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g.val(x, y, z) && !seen[at3(x, y, z)]) floating++;

const stats = g.save(OUT);
console.log(`way_270737179: ${stats.blocks} blocks, ${stats.palette} palette entries; storeys ${[...new Set(storeys.filter(Boolean))].join(",")}; door ${doorFace} face; unsupported ${floating}`);
