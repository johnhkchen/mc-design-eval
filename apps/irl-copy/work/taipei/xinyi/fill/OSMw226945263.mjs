import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 信義經貿大樓 (Xinyi trade / office block): 1990s-era mid-rise, a three-storey
// shopfront podium with a setback office tower in pale concrete and blue-tinted
// glazing. Roof at ~70 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw226945263";
const W = 120, H = 82, D = 56;

const ROOF = 70;          // top of tower roof slab (absolute)
const PODIUM_TOP = 15;    // podium roof / terrace slab (absolute)
const SETBACK = 8;        // tower cells sit at least this far inside the footprint edge
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const rawList = Array.isArray(raw) ? raw : raw.cells;
const list = rawList
  .map((c) => (Array.isArray(c) ? c : [c.x, c.z, c.ground]))
  .filter(([x, z]) => x >= 0 && x < W && z >= 0 && z < D);

const minG = Math.min(...list.map((c) => c[2]));
const key = (x, z) => `${x},${z}`;
const gmap = new Map();
for (const [x, z, gr] of list) gmap.set(key(x, z), gr - minG);

// Distance (in cells) from the footprint edge, 1 = edge cell.
const dist = new Map();
const q = [];
for (const k of gmap.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (N4.some(([dx, dz]) => !gmap.has(key(x + dx, z + dz)))) {
    dist.set(k, 1);
    q.push(k);
  }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i].split(",").map(Number);
  const d = dist.get(q[i]);
  for (const [dx, dz] of N4) {
    const nk = key(x + dx, z + dz);
    if (gmap.has(nk) && !dist.has(nk)) {
      dist.set(nk, d + 1);
      q.push(nk);
    }
  }
}
const distOf = (x, z) => dist.get(key(x, z)) ?? 1;
const isTower = (x, z) => gmap.has(key(x, z)) && distOf(x, z) >= SETBACK;

// Directions in which a neighbour lies outside the building at this height.
function outDirs(x, z, y) {
  const outside = y < PODIUM_TOP
    ? (nx, nz) => !gmap.has(key(nx, nz))
    : (nx, nz) => !isTower(nx, nz);
  return N4.filter(([dx, dz]) => outside(x + dx, z + dz));
}

// Voxel buffer: later writes override earlier ones.
const buf = new Map();
function put(x, y, z, b, p) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  buf.set(`${x},${y},${z}`, [b, p]);
}

const facadeSpots = []; // for warm lights behind windows

function cellBlock(x, y, z, gr, fac) {
  if (fac) {
    const rel = y - gr;
    if (y < PODIUM_TOP && rel <= 4) {              // ground shopfront band
      if (rel === 4) return "white_concrete";
      if ((x + z) % 4 === 0) return "white_concrete";
      return "glass";
    }
    if (y % 5 === 0) return "white_concrete";      // storey line
    if (y % 5 === 4) return "light_gray_concrete"; // spandrel
    if ((x + z) % 6 === 0) return "white_concrete"; // full-height fin: breaks up flat walls
    if ((x + z) % 3 === 0) return "white_concrete"; // mullion
    return "light_blue_stained_glass";             // tinted office glazing
  }
  if (y % 5 === 0) return "light_gray_concrete";   // floor slab, interior
  return null;                                     // air behind the glass
}

// ---- main massing, column by column ----
for (const [k, gr] of gmap) {
  const [x, z] = k.split(",").map(Number);
  const d = distOf(x, z);
  const tower = d >= SETBACK;

  // foundation up to this cell's ground, then base course
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_andesite");
  put(x, gr, z, d === 1 ? "polished_granite" : "smooth_stone");

  const top = tower ? ROOF : PODIUM_TOP;
  for (let y = gr + 1; y < top; y++) {
    const dirs = outDirs(x, z, y);
    const fac = dirs.length > 0;
    const b = cellBlock(x, y, z, gr, fac);
    if (b) put(x, y, z, b);
    if (fac && y % 5 === 2 && !(y < PODIUM_TOP && y - gr <= 4)) {
      const [dx, dz] = dirs[0];
      facadeSpots.push({ x, y, z, ix: x - dx, iz: z - dz });
    }
  }

  if (tower) {
    put(x, ROOF, z, "light_gray_concrete");          // roof slab
    if (outDirs(x, z, ROOF - 1).length > 0) {        // roof parapet
      put(x, ROOF + 1, z, "white_concrete");
      put(x, ROOF + 2, z, "white_concrete");
    }
  } else {
    put(x, PODIUM_TOP, z, "smooth_stone");           // podium terrace
    if (d === 1) {                                   // podium parapet
      put(x, PODIUM_TOP + 1, z, "white_concrete");
      put(x, PODIUM_TOP + 2, z, "white_concrete");
    } else if (d >= 2 && d <= 5 && ((x * 5 + z * 3) % 13 === 0)) {
      put(x, PODIUM_TOP + 1, z, "moss_block");       // terrace planters
    }
  }
}

// ---- roof plant: penthouse block and mast ----
const xs = list.map((c) => c[0]);
const zs = list.map((c) => c[1]);
const cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
const cz = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);

for (const k of gmap.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (distOf(x, z) >= 12 && Math.abs(x - cx) <= 18 && Math.abs(z - cz) <= 9) {
    for (let y = ROOF + 1; y <= ROOF + 3; y++) put(x, y, z, "light_gray_concrete");
    put(x, ROOF + 3, z, "light_blue_stained_glass");
  }
}
if (isTower(cx, cz)) {
  for (let y = ROOF + 4; y <= ROOF + 9; y++) put(cx, y, cz, "iron_bars");
  put(cx, ROOF + 10, cz, "lightning_rod");
}

// ---- entrance on the south (max z) face: frame, dark glass doors, canopy, lanterns ----
const maxZ = Math.max(...zs);
const ex0 = cx - 3, ex1 = cx + 3;
for (let x = ex0 - 1; x <= ex1 + 1; x++) {
  const k = key(x, maxZ);
  if (!gmap.has(k) || distOf(x, maxZ) !== 1) continue;
  const gr = gmap.get(k);
  const door = x >= ex0 && x <= ex1;
  for (let y = gr + 1; y <= gr + 3; y++) {
    put(x, y, maxZ, door ? "tinted_glass" : "polished_granite");
  }
  put(x, gr + 4, maxZ, "polished_granite");          // entrance lintel
}
for (let x = cx - 6; x <= cx + 6; x++) {             // canopy
  for (let z = maxZ - 2; z <= maxZ; z++) {
    const k = key(x, z);
    if (!gmap.has(k)) continue;
    const gr = gmap.get(k);
    put(x, gr + 4, z, "smooth_stone");
    if (z === maxZ - 2 && (x === cx - 6 || x === cx + 6)) {
      for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "polished_granite"); // posts
    }
  }
}
for (const x of [ex0, ex1]) {                        // hanging lanterns under the canopy
  const k = key(x, maxZ - 2);
  if (!gmap.has(k)) continue;
  const gr = gmap.get(k);
  put(x, gr + 3, maxZ - 2, "lantern", { hanging: "true", waterlogged: "false" });
}

// ---- warm lights behind some windows ----
for (const s of facadeSpots) {
  if (((s.x * 13 + s.z * 7 + s.y * 3) % 7) !== 0) continue;
  const ik = key(s.ix, s.iz);
  if (!gmap.has(ik)) continue;
  if (outDirs(s.ix, s.iz, s.y).length > 0) continue;   // inner cell must be interior
  put(s.ix, s.y, s.iz, "glowstone");
}

// ---- write ----
const g = new Voxels([W, H, D]);
for (const [k, [b, p]] of buf) {
  const [x, y, z] = k.split(",").map(Number);
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}
g.save(`${DIR}/${ID}.nbt`);
