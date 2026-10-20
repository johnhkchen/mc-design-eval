import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Reads as a 1970s-80s Taipei mid-rise: concrete frame,
// white tiled facade, blue-glass windows, shopfront ground storey, 4 storeys
// on 5-block floor lines, a parapet, and a small penthouse on the roof.
const W = 20, H = 33, D = 17;
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/OSMw1016280213.cells.json`, "utf8"));

const g = new Voxels([W, H, D]);
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const minG = Math.min(...cells.map((c) => c[2]));
const R = minG + 20;   // roof slab, about 21 blocks above lowest ground
const P = R + 1;       // parapet course

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Main entrance: on the south face, nearest the middle of that face.
const southX = cells.filter(([x, z]) => !has(x, z + 1)).map((c) => c[0]);
const meanX = southX.reduce((a, b) => a + b, 0) / southX.length;
const doorX = southX.reduce((best, x) => (Math.abs(x - meanX) < Math.abs(best - meanX) ? x : best), southX[0]);

for (const [x, z, gr] of cells) {
  const nN = !has(x, z - 1), nS = !has(x, z + 1);
  const nW = !has(x - 1, z), nE = !has(x + 1, z);
  const edge = nN || nS || nW || nE;

  // Foundation fill from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground deck at this cell's ground, then the storey slabs above it.
  if (gr <= R) put(x, gr, z, "light_gray_concrete");
  for (let k = 0; k <= 4; k++) {
    const yy = minG + 5 * k;
    if (yy > gr && yy <= R) put(x, yy, z, "light_gray_concrete");
  }

  if (!edge) continue;

  // Facade: N/S faces are indexed by x, E/W faces by z.
  const idx = (nN || nS) ? x : z;
  const door = nS && x === doorX;

  for (let y = gr + 1; y < R; y++) {
    const rel = y - minG;
    if (rel % 5 === 0) continue;          // storey line handled by slabs
    const s = rel % 5;                    // 1..4 inside a storey
    const storey = Math.floor(rel / 5);
    const pier = idx % 3 === 0;
    let b = "white_concrete", p;

    if (storey === 0) {
      if (door) {
        if (s === 1 || s === 2) {
          b = "oak_door";
          p = { facing: "south", half: s === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
        } else if (s === 3) {
          b = "light_blue_stained_glass";
        } else {
          b = "dark_oak_slab";
          p = { type: "bottom", waterlogged: "false" };
        }
      } else if (s <= 3 && !pier) {
        b = "light_blue_stained_glass";
      } else if (s === 4) {
        b = "light_gray_concrete";
      }
    } else {
      if (s <= 3 && !pier) {
        b = "light_blue_stained_glass";
        // a few warm lights in the lower row of the windows
        if (s === 1 && (idx * 7 + storey * 3) % 11 === 0) b = "shroomlight";
      } else if (s === 4) {
        b = "light_gray_concrete";
      }
    }
    put(x, y, z, b, p);
  }

  // Parapet on the roof edge.
  put(x, P, z, "white_concrete");
}

// Roof penthouse: a lift and stair housing, central, with one glazed face.
for (let x = 6; x <= 13; x++) {
  for (let z = 5; z <= 11; z++) {
    if (!has(x, z)) continue;
    for (let y = R + 1; y <= R + 3; y++) {
      if (x === 6 || x === 13 || z === 5 || z === 11) {
        const glass = y === R + 2 && z === 11 && x > 6 && x < 13;
        put(x, y, z, glass ? "light_blue_stained_glass" : "light_gray_concrete");
      }
    }
    put(x, R + 4, z, "stone_bricks");
  }
}

g.save(`${dir}/OSMw1016280213.nbt`);
