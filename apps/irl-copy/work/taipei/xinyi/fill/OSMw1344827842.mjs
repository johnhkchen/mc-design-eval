import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1344827842.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1344827842.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 10, H = 19, D = 11;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const at = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const minG = Math.min(...cells.map((c) => c[2]));
const maxG = Math.max(...cells.map((c) => c[2]));
// Roof about 7 blocks above the lowest ground (two-storey mid-rise commercial block).
const roof = Math.max(minG + 7, maxG + 3);

const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;

const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const exposedFaces = (x, z) => DIRS.filter((d) => !at.has(key(x + d.dx, z + d.dz)));

// Along-wall index: N/S faces run along x, E/W faces run along z.
const along = (d, x, z) => (d.dz !== 0 ? x : z);
const alongRange = (d) => (d.dz !== 0 ? [minX, maxX] : [minZ, maxZ]);

// Single entrance: prefer south, then north, west, east; centred along its face.
const doorFor = (() => {
  for (const name of ["south", "north", "west", "east"]) {
    const d = DIRS.find((q) => q.n === name);
    const [a0, a1] = alongRange(d);
    const mid = (a0 + a1) / 2;
    let best = null;
    for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
      if (!exposedFaces(x, z).some((f) => f.n === name)) continue;
      const dist = Math.abs(along(d, x, z) - mid);
      if (!best || dist < best.dist) best = { x, z, dist };
    }
    if (best) return { x: best.x, z: best.z, d };
  }
  return null;
})();

// 1. Foundations, floors, roof, walls.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const exp = exposedFaces(x, z);

  if (exp.length === 0) {
    // Interior: floor slab at the upper storey line, roof slab on top. Air otherwise.
    if (gr + 4 < roof) put(x, gr + 4, z, "smooth_stone");
    put(x, roof, z, "smooth_stone");
    continue;
  }

  // Exterior shell column. Pattern keyed to the first exposed face.
  const d = exp[0];
  const [a0] = alongRange(d);
  const p = along(d, x, z) - a0;
  const isDoor = doorFor && doorFor.x === x && doorFor.z === z && doorFor.d.n === d.n;

  for (let y = gr; y < roof; y++) {
    const rel = y - gr;
    let id = "white_concrete";
    let props;

    if (rel === 0) {
      id = "smooth_stone"; // base course
    } else if (rel <= 2) {
      if (isDoor && rel <= 2) {
        id = "dark_oak_door";
        props = {
          facing: d.n,
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
      } else if (p % 3 === 0) {
        id = "dark_oak_planks"; // shopfront mullion
      } else {
        id = "glass"; // shopfront glazing
      }
    } else if (rel === 3) {
      id = "light_gray_concrete"; // storey line
    } else if (rel <= 5) {
      id = p % 3 === 1 ? "glass" : "white_concrete"; // upper windows
    } else if (rel === 6) {
      id = "light_gray_concrete"; // cornice course
    } else {
      id = "white_concrete";
    }

    put(x, y, z, id, props);
  }

  // Parapet on the roof line of exterior cells.
  put(x, roof, z, "white_concrete");

  // Warm lights in the interior room behind upper-storey windows.
  if (p % 6 === 1) {
    const ix = x - d.dx, iz = z - d.dz;
    if (at.has(key(ix, iz)) && exposedFaces(ix, iz).length === 0) {
      put(ix, at.get(key(ix, iz)) + 5, iz, "shroomlight");
    }
  }
}

// 2. Rooftop plant box on the interior cell nearest the centroid.
{
  let best = null;
  for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
    if (exposedFaces(x, z).length) continue;
    const dist = Math.hypot(x - cx, z - cz);
    if (!best || dist < best.dist) best = { x, z, dist };
  }
  if (best) {
    put(best.x, roof + 1, best.z, "light_gray_concrete");
    put(best.x, roof + 2, best.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(OUT);
