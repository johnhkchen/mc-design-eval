import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC66620.cells.json`, "utf8"));

// Renwick Gallery (Old Corcoran): French Second Empire, 1859-71.
// Three storeys of sandstone, quoins, belt courses, window bays,
// and a slate mansard roof with dormers. Roof is one flat tier height.
const W = 14, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const fp = new Map();
for (const [x, z, gr] of cells) fp.set(key(x, z), { x, z, g: gr });

// One smoothed roof height for the whole building (median of lidar values).
const rs = cells.map(c => c[3]).sort((a, b) => a - b);
const groundMax = Math.max(...cells.map(c => c[2]));
let ROOF = rs[Math.floor(rs.length / 2)];
ROOF = Math.max(ROOF, groundMax + 9);
ROOF = Math.min(ROOF, H - 1);
for (const c of fp.values()) c.r = ROOF;

let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
for (const c of fp.values()) {
  xmin = Math.min(xmin, c.x); xmax = Math.max(xmax, c.x);
  zmin = Math.min(zmin, c.z); zmax = Math.max(zmax, c.z);
}
const xlen = xmax - xmin + 1, zlen = zmax - zmin + 1;

// Distance from the outside edge (0 = exterior wall cell).
const dist = new Map();
const queue = [];
for (const c of fp.values()) {
  const edge = DIRS.some(([dx, dz]) => !fp.has(key(c.x + dx, c.z + dz)));
  if (edge) { dist.set(key(c.x, c.z), 0); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS) {
    const k = key(c.x + dx, c.z + dz);
    if (fp.has(k) && !dist.has(k)) {
      dist.set(k, d + 1);
      queue.push(fp.get(k));
    }
  }
}
const dOf = (x, z) => dist.get(key(x, z));

function outDirs(x, z, mode) {
  const res = [];
  for (const [dx, dz] of DIRS) {
    if (mode === "edge" && !fp.has(key(x + dx, z + dz))) res.push([dx, dz]);
    if (mode === "inner" && dOf(x + dx, z + dz) === 0) res.push([dx, dz]);
  }
  return res;
}
const alongOf = (dx, x, z) => (dx !== 0 ? z - zmin : x - xmin);
const lenOf = (dx) => (dx !== 0 ? zlen : xlen);

// Front entrance: centre of the min-z face.
let doorX = xmin + Math.floor(xlen / 2);
if (!fp.has(key(doorX, zmin))) {
  const first = [...fp.values()].filter(c => c.z === zmin).sort((a, b) => a.x - b.x)[0];
  doorX = first.x;
}
const isDoor = (x, z) => x === doorX && z === zmin;
// Door surround cells (flanking the door on the front face).
const isSurround = (x, z) => z === zmin && Math.abs(x - doorX) === 1;

for (const c of fp.values()) {
  const { x, z, g: gr, r: R } = c;
  const d = dOf(x, z);

  // Foundation up to ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < R; y++) {
    const rel = y - gr;

    if (d === 0) {
      if (y < R - 3) {
        // Wall shell.
        if (rel === 0) { g.set(x, y, z, "polished_granite"); continue; }
        if (rel % 3 === 0) { g.set(x, y, z, "smooth_red_sandstone"); continue; }

        const outs = outDirs(x, z, "edge");
        let dir = outs[0] || [0, 1];
        let corner = false;
        for (const [dx, dz] of outs) {
          const a = alongOf(dx, x, z), L = lenOf(dx);
          if (a === 0 || a === L - 1) { corner = true; dir = [dx, dz]; }
          else { dir = [dx, dz]; corner = false; break; }
        }
        const [dx, dz] = dir;
        const a = alongOf(dx, x, z), L = lenOf(dx);

        if (corner) {
          // Quoins: alternating cut stone at the corners.
          g.set(x, y, z, (rel % 2 === 0) ? "cut_sandstone" : "smooth_red_sandstone");
          continue;
        }
        if (isDoor(x, z) && rel >= 1 && rel <= 2) {
          const half = rel === 1 ? "lower" : "upper";
          g.set(x, y, z, "dark_oak_door", {
            facing: "north", half, hinge: "left", open: "false", powered: "false",
          });
          continue;
        }
        if (isSurround(x, z) && rel >= 1 && rel <= 2) {
          g.set(x, y, z, "chiseled_red_sandstone");
          continue;
        }
        const bay = a % 3 === 1 && a > 0 && a < L - 1;
        if (bay) {
          // Sill course at the base of each window.
          if (rel % 3 === 1) {
            g.set(x, y, z, "glass_pane");
          } else {
            g.set(x, y, z, "glass_pane");
          }
          // Warm light behind some glass: glowstone one cell inside.
          if (rel === 2 && a % 6 === 4) {
            const ix = x - dx, iz = z - dz;
            if (fp.has(key(ix, iz)) && dOf(ix, iz) >= 1) g.set(ix, y, iz, "glowstone");
          }
        } else {
          g.set(x, y, z, "red_sandstone");
        }
      } else if (y === R - 3) {
        // Cornice over the exterior wall.
        g.set(x, y, z, "smooth_red_sandstone");
      }
    } else {
      // Interior: floor slabs, ceiling, mansard; otherwise open air.
      if (rel === 0) { g.set(x, y, z, "smooth_stone"); continue; }
      if (y < R - 3) {
        if (rel % 3 === 0) g.set(x, y, z, "smooth_red_sandstone");
        continue;
      }
      if (y === R - 3) { g.set(x, y, z, "deepslate_tiles"); continue; }
      if (y === R - 2) {
        if (d === 1) {
          // Dormer glazing set into the mansard face.
          const outs = outDirs(x, z, "inner");
          const isDormer = outs.length > 0 && outs.some(([dx]) => {
            const a = alongOf(dx, x, z), L = lenOf(dx);
            return a % 3 === 1 && a > 0 && a < L - 1;
          });
          g.set(x, y, z, isDormer ? "glass_pane" : "deepslate_tiles");
        } else {
          g.set(x, y, z, "deepslate_tiles");
        }
        continue;
      }
      if (y === R - 1 && d >= 2) {
        g.set(x, y, z, "deepslate_tiles");
        continue;
      }
    }
  }
}

g.save(`${DIR}/DC66620.nbt`);
