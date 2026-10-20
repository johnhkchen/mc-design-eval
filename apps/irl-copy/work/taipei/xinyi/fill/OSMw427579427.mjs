import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Comprehensive Medical Building (Rear): a 1990s-era, 15-storey concrete-frame
// medical office block. Podium of a shopfront storey with stone base and
// quartz trim, a repeating curtain-wall grid of blue-grey glass between
// white concrete mullions, quartz cornice and parapet, and a plant penthouse
// with louvres and a mast on the roof.

const W = 116, H = 90, D = 82;
const ROOF = 78;       // roof surface (top of solid roof deck at 77)
const CORNICE = 75;    // first cornice course
const TOP_STOREY = 15;

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw427579427.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw427579427.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => x + "," + z;

// footprint -> ground height (clamped so the building keeps its storeys)
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), Math.max(0, Math.min(Math.round(gr), CORNICE - 20)));
}
const has = (x, z) => ground.has(key(x, z));

const DIRS = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] };

// outward face of an edge cell (null for interior cells)
function faceOf(x, z) {
  for (const f of ["west", "east", "north", "south"]) {
    const [dx, dz] = DIRS[f];
    if (!has(x + dx, z + dz)) return f;
  }
  return null;
}

// distance (in blocks) from the outer edge of the footprint
const dist = new Map();
const queue = [];
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (faceOf(x, z)) { dist.set(k, 0); queue.push([x, z]); }
}
for (let h = 0; h < queue.length; h++) {
  const [x, z] = queue[h];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of Object.values(DIRS)) {
    const nx = x + dx, nz = z + dz, kk = key(nx, nz);
    if (has(nx, nz) && !dist.has(kk)) { dist.set(kk, d + 1); queue.push([nx, nz]); }
  }
}
const distOf = (x, z) => dist.get(key(x, z)) ?? 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

const GLASS = "light_blue_stained_glass";
const MULLION = "white_concrete";
const SPANDREL = "light_gray_concrete";
const STONE = "stone_bricks";
const BASE = "polished_granite";
const TRIM = "quartz_block";

let maxDist = -1, mastCell = null;

// 1) foundations, floors, interior roof deck, penthouse
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const d = distOf(x, z);

  for (let y = 0; y < gr; y++) put(x, y, z, STONE);

  // floor slabs: ground floor and each storey line
  for (let y = gr; y < CORNICE; y++) {
    if (y === gr || y % 5 === 0) put(x, y, z, SPANDREL);
  }

  // interior roof deck (solid under the parapet band)
  if (d > 0) {
    for (let y = CORNICE; y <= 77; y++) put(x, y, z, SPANDREL);
  }

  // penthouse / plant room
  if (d >= 8) {
    for (let y = ROOF; y <= 80; y++) {
      if (d === 8) {
        const louvre = ((x + z) % 3 === 0);
        put(x, y, z, louvre ? SPANDREL : "iron_bars");
        if (!louvre && y === 79) put(x, y, z, GLASS);
      } else {
        put(x, y, z, SPANDREL);
      }
    }
    put(x, 81, z, "smooth_quartz");
  }

  if (d > maxDist) { maxDist = d; mastCell = [x, z]; }
}

// 2) facades on edge cells
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const face = faceOf(x, z);
  if (!face) continue;

  const [odx, odz] = DIRS[face];
  const inX = -odx, inZ = -odz;           // inward direction
  const i = (face === "west" || face === "east") ? z : x;
  const sfTop = Math.floor(gr / 5) * 5 + 5; // top of the shopfront storey
  const isPillar = i % 4 === 0;
  const entrance = (i % 20 === 10) && sfTop > gr + 3;

  // ground / shopfront storey
  for (let y = gr; y < sfTop && y < CORNICE; y++) {
    if (y === gr) { put(x, y, z, BASE); continue; }
    if (y === sfTop - 1) { put(x, y, z, MULLION); continue; }
    if (entrance && y <= gr + 2) { put(x, y, z, "air"); continue; }
    put(x, y, z, isPillar ? MULLION : GLASS);
  }

  // upper storeys
  for (let y = Math.max(gr, sfTop); y < CORNICE; y++) {
    const st = Math.floor(y / 5);
    const r = y % 5;
    if (r === 0) { put(x, y, z, MULLION); continue; }       // floor line
    if (r === 4) { put(x, y, z, isPillar ? MULLION : SPANDREL); continue; }
    if (isPillar) { put(x, y, z, MULLION); continue; }
    put(x, y, z, GLASS);
    // warm lights behind some windows
    if (r === 2 && i % 8 === 2 && st % 2 === 0 && st <= TOP_STOREY) {
      const ix = x + inX, iz = z + inZ;
      if (has(ix, iz) && distOf(ix, iz) >= 1) {
        put(ix, y, iz, (st % 4 === 0) ? "lantern" : "glowstone",
          (st % 4 === 0) ? { hanging: "false", waterlogged: "false" } : undefined);
      }
    }
  }

  // cornice and parapet
  put(x, 75, z, TRIM);
  put(x, 76, z, MULLION);
  put(x, 77, z, TRIM);
}

// 3) roof mast on the deepest interior cell
if (mastCell && maxDist >= 9) {
  const [mx, mz] = mastCell;
  for (let y = 81; y <= 87; y++) put(mx, y, mz, "iron_bars");
  put(mx, 88, mz, "lightning_rod");
  put(mx, 89, mz, "glowstone");
}

g.save(OUT);
