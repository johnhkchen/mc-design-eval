import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86582.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86582.nbt";
const W = 13, H = 31, D = 14;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// Mid-century commercial office: grey stone plinth, light-concrete spandrels,
// white-concrete piers with clear parapet caps, blue-tinted glazing in a 3-block storey module.
const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, gr, rf] of cells) {
  let n = Math.max(1, Math.round((rf - gr) / 3));
  let top = gr + 3 * n;
  if (top > H) { n = Math.floor((H - gr) / 3); top = gr + 3 * n; }
  cell.set(key(x, z), { gr, top, n });
}
const has = (x, z) => cell.has(key(x, z));
const C = (x, z) => cell.get(key(x, z));
const topOf = (x, z) => (has(x, z) ? C(x, z).top : 0);

// N, S, W, E
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

// exposed sides of a cell at height y: missing neighbour, or neighbour roof below y
const exposures = (x, z, y) => {
  const out = [];
  DIRS.forEach(([dx, dz], i) => {
    if (topOf(x + dx, z + dz) <= y) out.push(i);
  });
  return out;
};
const isShell = (x, z, y) => exposures(x, z, y).length > 0;

// Front entrance: the north-most row (min z), column nearest its centre
let minZ = Infinity;
const allKeys = [...cell.keys()].map(k => k.split(",").map(Number));
for (const [, z] of allKeys) minZ = Math.min(minZ, z);
const frontXs = allKeys.filter(([, z]) => z === minZ).map(([x]) => x);
const meanX = frontXs.reduce((a, b) => a + b, 0) / frontXs.length;
const xm = frontXs.reduce((best, x) => (Math.abs(x - meanX) < Math.abs(best - meanX) ? x : best), frontXs[0]);
const zm = minZ;

// Main massing
for (const [x, z] of allKeys) {
  const c = C(x, z);

  // foundation up to street level (neutral stone, not brick)
  for (let y = 0; y < c.gr; y++) g.set(x, y, z, "stone");

  for (let y = c.gr; y < c.top; y++) {
    const ex = exposures(x, z, y);
    const rel = (y - c.gr) % 3;
    const st = Math.floor((y - c.gr) / 3);
    const roofRow = y === c.top - 1;

    // interior: slabs and air only
    if (ex.length === 0) {
      if (rel === 0 || roofRow) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // cornice course
    if (roofRow) { g.set(x, y, z, "smooth_quartz"); continue; }

    // spandrel / base course: granite plinth at street, light concrete above
    if (rel === 0) {
      g.set(x, y, z, st === 0 ? "polished_granite" : "light_gray_concrete");
      continue;
    }

    // window band (rel 1 and 2)
    const alongX = ex[0] <= 1; // N/S faces run along x
    const along = alongX ? x : z;
    const pier = ex.length > 1 || along % 3 === 0;

    // entrance door on the front face
    if (ex.includes(0) && x === xm && z === zm && (rel === 1 || rel === 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (pier) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, "light_blue_stained_glass");
    }
  }

  // parapet caps on the piers, standing on the cornice course
  if (c.top < H) {
    const ex = exposures(x, z, c.top - 1);
    if (ex.length > 0) {
      const alongX = ex[0] <= 1;
      const along = alongX ? x : z;
      if (ex.length > 1 || along % 3 === 0) {
        g.set(x, c.top, z, "smooth_quartz");
      }
    }
  }
}

// Warm lights behind some facade windows (interior cell directly inward)
for (const [x, z] of allKeys) {
  const c = C(x, z);
  for (let y = c.gr; y < c.top - 1; y++) {
    const ex = exposures(x, z, y);
    if (ex.length !== 1) continue;
    const rel = (y - c.gr) % 3;
    if (rel === 0) continue;
    const along = ex[0] <= 1 ? x : z;
    if (along % 3 === 0) continue;
    const [dx, dz] = DIRS[ex[0]];
    const ix = x - dx, iz = z - dz;
    if (!has(ix, iz)) continue;
    const ci = C(ix, iz);
    if (y <= ci.gr || y >= ci.top - 1) continue;
    if ((y - ci.gr) % 3 === 0) continue;
    if (isShell(ix, iz, y)) continue;
    const h = (x * 5 + z * 3 + Math.floor((y - c.gr) / 3) * 7) % 6;
    if (h !== 0) continue;
    const isGround = y - c.gr < 3;
    g.set(ix, y, iz, isGround ? "glowstone" : "shroomlight");
  }
}

// Rooftop mechanical penthouse on the tallest central cells
let maxTop = 0;
for (const [x, z] of allKeys) maxTop = Math.max(maxTop, C(x, z).top);
for (const [x, z] of allKeys) {
  const c = C(x, z);
  if (c.top !== maxTop) continue;
  if (x < 3 || x > 9 || z < 4 || z > 9) continue;
  if (c.top >= H) continue;
  g.set(x, c.top, z, "light_gray_concrete");
  if (c.top + 1 < H) {
    const ring = x === 3 || x === 9 || z === 4 || z === 9;
    g.set(x, c.top + 1, z, ring ? "light_blue_stained_glass" : "light_gray_concrete");
  }
}

g.save(OUT);
