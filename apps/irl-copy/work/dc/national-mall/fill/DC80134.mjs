import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Constitution Hall (DC80134): 1929 Colonial/Classical Revival assembly hall.
// Red brick walls on a stone base, limestone-look trim, pier pilasters, a
// centred north portico with columns and doors, slate-grey roof with a
// quartz cornice, roof plant, and warm light behind some windows.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC80134.cells.json`, "utf8"));

const W = 32, HH = 23, D = 26;
const g = new Voxels([W, HH, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
let minx = Infinity, maxx = -Infinity, minz = Infinity, maxz = -Infinity;
for (const [x, z, gr, r] of cells) {
  map.set(key(x, z), { G: gr, R: r });
  minx = Math.min(minx, x); maxx = Math.max(maxx, x);
  minz = Math.min(minz, z); maxz = Math.max(maxz, z);
}
const has = (x, z) => map.has(key(x, z));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const cx = Math.floor((minx + maxx) / 2);

// Smooth lidar roof heights: weighted average with footprint neighbours,
// so adjacent cells step in clean tiers rather than noise.
const Rs = new Map();
for (const [x, z, gr, r] of cells) {
  let sum = 2 * r, n = 2;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (has(x + dx, z + dz)) { sum += map.get(key(x + dx, z + dz)).R; n++; }
  }
  Rs.set(key(x, z), Math.round(sum / n));
}

const paneNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, gr0] of cells) {
  const G = clamp(gr0, 0, HH - 5);
  const R = clamp(Rs.get(key(x, z)), G + 4, HH - 1);
  const tot = R - G;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  // Roof slab over every cell; supported by the perimeter walls.
  g.set(x, R - 1, z, "deepslate_tiles");

  // Exterior faces: sides where the footprint ends.
  const faces = {
    n: !has(x, z - 1), // north (front)
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
  const face = faces.n ? "n" : faces.s ? "s" : faces.w ? "w" : faces.e ? "e" : null;

  if (face) {
    const alongN = face === "n" || face === "s";
    const along = alongN ? x : z;
    const start = alongN ? minx : minz;
    const p = (along - start) % 4;
    const isFront = face === "n";
    const dist = Math.abs(x - cx);

    // Walls, rel 0 .. tot-3
    for (let rel = 0; rel <= tot - 3; rel++) {
      const y = G + rel;
      let block = null, props;

      if (rel === 0) {
        block = "stone_bricks";                          // base course
      } else if (rel % 4 === 3) {
        block = "quartz_block";                          // storey line
      } else if (rel % 4 === 0) {
        block = "bricks";                                // spandrel
      } else if (p === 1 || p === 2) {
        block = "glass_pane";                            // window
        props = alongN ? paneNS : paneEW;
      } else {
        block = "quartz_pillar";                         // pier frame
        props = { axis: "y" };
      }

      // Centred portico on the north face.
      if (isFront && dist <= 5 && rel <= tot - 4) {
        if (dist === 5) {
          block = "quartz_pillar"; props = { axis: "y" };
        } else if (rel === 0) {
          block = "stone_bricks";
        } else {
          block = "smooth_stone";
        }
      }

      if (block) g.set(x, y, z, block, props);
    }

    // Cornice under the roof.
    if (tot - 2 >= 0) g.set(x, R - 2, z, "quartz_block");

    // Entrance doors in the centre of the north face.
    if (isFront && x === cx) {
      g.set(x, G, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, G + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    }

    // Warm light behind some windows, two cells in from the wall.
    if (p === 1 && (along - start) % 8 === 1) {
      const inward = { n: [0, 2], s: [0, -2], w: [2, 0], e: [-2, 0] }[face];
      const xi = x + inward[0], zi = z + inward[1];
      if (has(xi, zi)) {
        const inner = map.get(key(xi, zi));
        const yl = inner.G + 1;
        if (yl < inner.R - 3) g.set(xi, yl, zi, "glowstone");
      }
    }
  }

  // Roof plant: small units standing on the roof slab, away from the edge.
  const edgeDist = Math.min(x - minx, maxx - x, z - minz, maxz - z);
  if (!face && edgeDist >= 3 && x % 8 === 4 && z % 8 === 4 && R + 1 < HH) {
    g.set(x, R, z, "stone_bricks");
    g.set(x, R + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/DC80134.nbt`);
