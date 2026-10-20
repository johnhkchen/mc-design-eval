import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no source. Read as a late-1990s/2000s Taipei office tower: ~23 storeys
// (116 blocks / 5), a three-storey glass-and-stone podium, two setbacks, white
// precast-look frames, blue-tinted glazing, a light-grey spandrel band and a crown
// with plant boxes and a mast.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw980871929.cells.json";
const OUT   = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw980871929.nbt";
const W = 43, H = 128, D = 38;
const ROOF_Y = 116;           // roof top, absolute block y
const PODIUM_Y = 16;          // podium top (3 storeys)
const TIER2_Y = 90;           // first setback
const TIER3_Y = 110;          // second setback (crown)

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const K = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, g] of cells) {
  ground.set(K(x, z), Math.max(0, Math.min(Math.round(g), ROOF_Y - 6)));
}

const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Distance (in cells) from the footprint edge: 0 on the perimeter.
const dist = new Map();
const q = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (dirs.some(([dx, dz]) => !ground.has(K(x + dx, z + dz)))) {
    dist.set(k, 0);
    q.push([x, z]);
  }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i];
  const d = dist.get(K(x, z));
  for (const [dx, dz] of dirs) {
    const kk = K(x + dx, z + dz);
    if (ground.has(kk) && !dist.has(kk)) {
      dist.set(kk, d + 1);
      q.push([x + dx, z + dz]);
    }
  }
}

// Setback threshold: how far in from the edge a cell must be to exist at height y.
const th = (y) => (y < PODIUM_Y ? 0 : y < TIER2_Y ? 3 : y < TIER3_Y ? 7 : 10);

function inS(x, z, y) {
  if (y < 0 || y > ROOF_Y) return false;
  const k = K(x, z);
  const g = ground.get(k);
  if (g === undefined || y < g) return false;
  return dist.get(k) >= th(y);
}

// Entrance: centre of the lowest-z row of the north face.
function entranceCells() {
  const row = [];
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (!ground.has(K(x, z - 1))) row.push([x, z]);
  }
  const set = new Set();
  if (!row.length) return set;
  const zmin = Math.min(...row.map((r) => r[1]));
  const xs = row.filter((r) => r[1] === zmin).map((r) => r[0]).sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  for (const x of xs) if (Math.abs(x - mid) <= 2) set.add(K(x, zmin));
  return set;
}

// Mast centre: crown cell nearest the centroid of the crown.
const crownCells = [...ground.keys()]
  .filter((k) => dist.get(k) >= 10)
  .map((k) => k.split(",").map(Number));
let mastX = null, mastZ = null;
if (crownCells.length) {
  const ax = crownCells.reduce((s, c) => s + c[0], 0) / crownCells.length;
  const az = crownCells.reduce((s, c) => s + c[1], 0) / crownCells.length;
  let best = Infinity;
  for (const [x, z] of crownCells) {
    const d = (x - ax) ** 2 + (z - az) ** 2;
    if (d < best) { best = d; mastX = x; mastZ = z; }
  }
}

const entrance = entranceCells();
const blocks = new Map();
const put = (x, y, z, name) => blocks.set(`${x},${y},${z}`, [x, y, z, name]);

for (const [k, g] of ground) {
  const [x, z] = k.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g; y++) put(x, y, z, "stone");

  for (let y = g; y <= ROOF_Y; y++) {
    if (!inS(x, z, y)) continue;

    const missing = dirs.filter(([dx, dz]) => !inS(x + dx, z + dz, y));
    const perim = missing.length > 0;
    const top = !inS(x, z, y + 1);
    const podium = y < PODIUM_Y;
    const rel = y - g;
    const r = rel % 5;

    // Roof / terrace / parapet surface.
    if (top) {
      put(x, y, z, perim ? "white_concrete" : "light_gray_concrete");
      // Plant boxes and roof plant on non-edge roof cells above the podium.
      if (!perim && y >= PODIUM_Y && (x * 5 + z * 3) % 13 === 0 && !(x === mastX && z === mastZ)) {
        put(x, y + 1, z, "gray_concrete");
        put(x, y + 2, z, "gray_concrete");
      }
      continue;
    }

    // Interior: floor slab at each storey line, otherwise air behind the glass.
    if (!perim) {
      if (r === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Corner pilasters.
    if (missing.length >= 2) {
      put(x, y, z, "white_concrete");
      continue;
    }

    // Single exposed face.
    const [dx, dz] = missing[0];
    const coord = dz !== 0 ? x : z;     // position along the face
    const isEntr = podium && rel >= 1 && rel <= 3 && entrance.has(k) && dz === -1;

    let name;
    let glassy = false;
    if (rel === 0) {
      name = podium ? "stone_bricks" : "white_concrete";          // base course
    } else if (isEntr && rel === 3) {
      name = "light_gray_concrete";                               // entrance canopy
    } else if (isEntr) {
      name = "glass";                                             // entrance opening
    } else if (podium && rel <= 3) {
      if (coord % 3 === 0) name = "white_concrete";               // storefront mullions
      else { name = "glass"; glassy = true; }
    } else if (r === 0) {
      name = "white_concrete";                                    // storey line
    } else if (r === 4) {
      name = "light_gray_concrete";                               // spandrel
    } else if (coord % 3 === 0) {
      name = "white_concrete";                                    // mullion
    } else {
      name = podium ? "glass" : "light_blue_stained_glass";
      glassy = true;
    }
    put(x, y, z, name);

    // Warm light behind some windows, one cell inside the wall.
    if (glassy && r === 2 && (coord + Math.floor(rel / 5) * 3) % 7 === 0) {
      const ix = x - dx, iz = z - dz;
      if (inS(ix, iz, y)) put(ix, y, iz, "glowstone");
    }
  }
}

// Mast on the crown.
if (mastX !== null) {
  for (let y = ROOF_Y + 1; y <= ROOF_Y + 6; y++) put(mastX, y, mastZ, "light_gray_concrete");
  put(mastX, ROOF_Y + 7, mastZ, "end_rod");
}

const g = new Voxels([W, H, D]);
for (const [x, y, z, name] of blocks.values()) g.set(x, y, z, name);
g.save(OUT);
