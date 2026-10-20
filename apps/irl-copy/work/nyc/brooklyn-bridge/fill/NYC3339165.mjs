import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3339165.cells.json`, "utf8"));

const W = 10, H = 16, D = 5;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground (foundation top) from lidar.
const occ = new Map();
const roofs = [];
for (const [x, z, gr, rf] of cells) {
  const ground = Math.min(Math.max(0, Math.round(gr)), 10);
  occ.set(`${x},${z}`, { ground });
  roofs.push(Math.round(rf));
}
const has = (x, z) => occ.has(`${x},${z}`);
const isPerimeter = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// One clean flat roof for the whole block (lidar noise smoothed away),
// about 4 blocks above the lowest ground, never lower than the highest foundation + 4.
roofs.sort((a, b) => a - b);
const median = roofs[Math.floor(roofs.length / 2)];
const maxGround = Math.max(...[...occ.values()].map((c) => c.ground));
const R = Math.min(Math.max(median, maxGround + 4, 6), 10);

for (const [key, { ground: gr }] of occ) {
  const [x, z] = key.split(",").map(Number);
  const per = isPerimeter(x, z);
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const pier = corner || (x % 3 === 0 && (z === 0 || z === D - 1)) || ((x === 0 || x === W - 1) && per);
  const entrance = z === 0 && x === 4;

  // Foundation: solid from y0 up to the ground course.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // Base course / ground floor slab.
  g.set(x, gr, z, per ? "stone_bricks" : "smooth_stone");

  // Storeys of 2 blocks: even rel = concrete spandrel / floor line, odd rel = window band or brick pier.
  for (let y = gr + 1; y <= R - 2; y++) {
    const rel = y - gr;
    if (per) {
      if (rel % 2 === 0) {
        g.set(x, y, z, "light_gray_concrete");
      } else if (entrance && rel === 1) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (entrance && rel === 3) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (entrance && rel === 5) {
        g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else if (pier) {
        g.set(x, y, z, "bricks");
      } else {
        g.set(x, y, z, "glass");
      }
    } else {
      // Interior: floor slabs at storey lines, air gap otherwise.
      if (rel % 2 === 0) g.set(x, y, z, "smooth_stone");
      // Warm lights behind the front windows.
      if (rel % 2 === 1 && z === 1 && x % 3 === 1 && rel >= 3) g.set(x, y, z, "glowstone");
    }
  }

  // Roof slab on every cell (sits on the floor slab below).
  if (R - 1 > gr) g.set(x, R - 1, z, "smooth_stone");

  // Brick parapet with stone coping on the perimeter.
  if (per && R < H) g.set(x, R, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Roof mechanical box near the middle of the roof.
  if ((x === 4 || x === 5) && z === 2 && R + 1 < H) {
    g.set(x, R, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/NYC3339165.nbt`);
