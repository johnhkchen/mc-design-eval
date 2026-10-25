import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499600";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const N = 11;
const W_MAX = 15;
const map = new Map();
const roofs = [];
let gmax = -Infinity;
for (const [x, z, gr, ro] of cells) {
  const g = Math.round(gr);
  map.set(`${x},${z}`, { g, r: ro });
  roofs.push(ro);
  if (g > gmax) gmax = g;
}
roofs.sort((a, b) => a - b);
const R = Math.round(roofs[Math.floor(roofs.length / 2)]);

// Walls stop 4 blocks below the roof; the gable roof is 4 layers.
let W = Math.max(R - 4, gmax + 3);
W = Math.min(W, W_MAX);

const g = new Voxels([N, 20, N]);

const stair = (x, y, z, facing, id = "deepslate_tile_stairs") =>
  g.set(x, y, z, id, { facing, half: "bottom", shape: "straight", waterlogged: "false" });

const pane = (x, y, z, along) =>
  g.set(x, y, z, "glass_pane", {
    north: along === "ns" ? "true" : "false",
    south: along === "ns" ? "true" : "false",
    east: along === "ew" ? "true" : "false",
    west: along === "ew" ? "true" : "false",
    waterlogged: "false",
  });

for (const [key, c] of map) {
  const [x, z] = key.split(",").map(Number);
  const gr = c.g;
  const d = Math.min(x, z, N - 1 - x, N - 1 - z);

  // Foundation up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (d === 0) {
    let face = null;
    if (z === 0) face = "north";
    else if (z === N - 1) face = "south";
    else if (x === 0) face = "west";
    else if (x === N - 1) face = "east";
    const corner = (x === 0 || x === N - 1) && (z === 0 || z === N - 1);
    const t = face === "north" || face === "south" ? x : z;

    for (let y = gr; y <= W - 1; y++) {
      let id = "stone_bricks";
      if (y === gr) id = "granite";
      if (y === W - 1) id = "chiseled_stone_bricks";
      if (!face || corner) {
        g.set(x, y, z, id);
        continue;
      }
      // Centred entrance on the south face with a lintel
      if (face === "south" && t === 5 && (y === gr || y === gr + 1)) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "south",
          half: y === gr ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (face === "south" && (t === 4 || t === 6) && y === gr + 2) {
        g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }
      if (face === "south" && t === 5 && y === gr + 2) {
        g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }
      // Window grid: panes on even positions, stone piers between
      const isWin = t >= 2 && t <= 8 && t % 2 === 0 && y >= gr + 1 && y <= W - 3
        && !(face === "south" && t === 5);
      if (isWin) {
        pane(x, y, z, face === "north" || face === "south" ? "ew" : "ns");
        // warm light behind the glass in some windows (air gap cell)
        if ((t + y) % 4 === 0) {
          const ix = face === "west" ? 1 : face === "east" ? N - 2 : x;
          const iz = face === "north" ? 1 : face === "south" ? N - 2 : z;
          g.set(ix, y, iz, "glowstone");
        }
      } else {
        g.set(x, y, z, id);
      }
    }
  } else {
    // Interior: air gap, ceiling slab at top of walls
    g.set(x, W - 1, z, "stone_bricks");
  }
}

// Gable roof running east-west: slopes face north and south.
// Layer j sits at y = W + j; dz = distance to the nearest long side.
for (let j = 0; j < 4; j++) {
  const y = W + j;
  for (const [key] of map) {
    const [x, z] = key.split(",").map(Number);
    const dz = Math.min(z, N - 1 - z);
    if (dz <= j) continue;
    if (dz === j + 1) {
      stair(x, y, z, z < (N - 1) / 2 ? "north" : "south");
    } else {
      g.set(x, y, z, "deepslate_tiles");
    }
  }
}

// Chimney on the ridge over solid roof blocks
const cx = 2, cz = 5;
if (map.has(`${cx},${cz}`)) {
  for (let y = W; y < Math.min(W + 6, 20); y++) {
    g.set(cx, y, cz, "stone_bricks");
  }
  g.set(cx, Math.min(W + 6, 19), cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
