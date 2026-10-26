import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC78064.cells.json`, "utf8"));

const W = 68, H = 30, D = 98;
const g = new Voxels([W, H, D]);

// Footprint lookup
const m = new Map();
for (const [x, z, gr, rf] of cells) {
  m.set(`${x},${z}`, { gr: Math.round(gr), rf: Math.round(rf) });
}
const has = (x, z) => m.has(`${x},${z}`);
const nbrs = (x, z) => [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];
const ring0 = (x, z) => has(x, z) && nbrs(x, z).some(([nx, nz]) => !has(nx, nz));
const ring1 = (x, z) => has(x, z) && !ring0(x, z) && nbrs(x, z).some(([nx, nz]) => ring0(nx, nz));

// Footprint extents for entrance placement
let xMin = Infinity, xMax = -Infinity, zMin = Infinity;
for (const [x, z] of m.keys().map(k => k.split(",").map(Number))) {
  xMin = Math.min(xMin, x); xMax = Math.max(xMax, x); zMin = Math.min(zMin, z);
}
const cx = (xMin + xMax) / 2;
const isPier = (x, z) => (x + z) % 3 === 0;
const isEntrance = (x, z) => ring0(x, z) && z === zMin && Math.abs(x - cx) <= 3;

// Hash for scattered lights
const hsh = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

for (const [key, { gr, rf }] of m) {
  const [x, z] = key.split(",").map(Number);
  const stories = Math.min(9, Math.max(2, Math.round((rf - gr) / 3)));
  let top = Math.min(26, gr + 3 * stories);
  const outer = ring0(x, z);

  // Foundation: solid from y0 up to the ground under this cell
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Body of the cell, storey by storey (3 blocks per storey)
  for (let y = gr; y < top; y++) {
    const f = y - gr;
    const off = f % 3;

    if (outer) {
      let b;
      if (f === 0) {
        b = "stone_bricks";                       // base course
      } else if (off === 0) {
        b = "white_concrete";                     // storey line band
      } else if (isEntrance(x, z) && f < 3) {
        b = off === 1 ? "glass" : "white_concrete"; // recessed entrance and canopy
      } else if (off === 1) {
        b = isPier(x, z) ? "bricks" : "glass";    // window row with brick piers
      } else {
        b = "bricks";                             // lintel course
      }
      g.set(x, y, z, b);
    } else if (ring1(x, z) && off === 1) {
      // Air gap behind a window, or a lit shroomlight in the gap
      const behindWindow = nbrs(x, z).some(([nx, nz]) =>
        has(nx, nz) && ring0(nx, nz) && !isPier(nx, nz) && m.get(`${nx},${nz}`).gr <= y);
      if (behindWindow) {
        if (hsh(x, y, z) % 9 === 0) g.set(x, y, z, "shroomlight");
        // otherwise leave as air
      } else {
        g.set(x, y, z, "stone");
      }
    } else {
      g.set(x, y, z, "stone");                    // structural core
    }
  }

  // Roof cap: parapet on the outer ring, roof deck inside
  if (outer) {
    g.set(x, top, z, "white_concrete");
  } else {
    g.set(x, top, z, "light_gray_concrete");
    // Roof equipment: small plant pods and a glazed skylight
    if (x % 9 === 4 && z % 9 === 4 && top + 1 < H) {
      g.set(x, top + 1, z, "stone_bricks");
      if (x % 18 === 4 && z % 18 === 4 && top + 2 < H) {
        g.set(x, top + 2, z, "glass");
      }
    }
  }
}

g.save(`${DIR}/DC78064.nbt`);
