import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw258816686";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: 42 x 80 footprint, roof ~7 blocks above the lowest ground.
// Reading: a low-rise 1980s-90s Xinyi commercial block (white walls,
// grey concrete floor bands, glazed shopfronts, stone-brick cornice, flat
// roof with a few plant rooms). Downhill side shows the extra storeys.
const W = 42, H = 19, D = 80;

const foot = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  foot.set(`${x},${z}`, gr);
  if (gr < minG) minG = gr;
}
const has = (x, z) => foot.has(`${x},${z}`);
const roofY = minG + 7;

function outward(x, z) {
  if (!has(x - 1, z)) return [-1, 0];
  if (!has(x + 1, z)) return [1, 0];
  if (!has(x, z - 1)) return [0, -1];
  if (!has(x, z + 1)) return [0, 1];
  return null;
}

const g = new Voxels([W, H, D]);

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  // Building top: shared roof level, at least 6 blocks of wall on high cells.
  const T = Math.min(H, Math.max(roofY, gr + 6));
  const n = outward(x, z);
  const edge = n !== null;
  const [nx, nz] = n ?? [0, 0];
  const along = nx !== 0 ? z : x;
  const ix = x - nx, iz = z - nz;

  for (let y = gr; y <= T - 3; y++) {
    const rel = (T - 3 - y) % 5;

    if (rel === 0) {
      g.set(x, y, z, "light_gray_concrete"); // floor slab line
      continue;
    }
    if (!edge) continue; // interior stays air behind the glass

    if (y === gr) {
      g.set(x, y, z, "stone_bricks"); // base course
      continue;
    }
    if (rel === 4) {
      g.set(x, y, z, "white_concrete"); // spandrel
      continue;
    }

    // Window bands: quartz piers every 3 cells, glass panes between.
    if (along % 3 === 0) {
      g.set(x, y, z, "quartz_pillar", { axis: "y" });
    } else {
      const alongX = nx !== 0;
      g.set(x, y, z, "glass_pane", {
        north: alongX ? "true" : "false",
        south: alongX ? "true" : "false",
        east: alongX ? "false" : "true",
        west: alongX ? "false" : "true",
        waterlogged: "false",
      });
    }

    // Warm light just behind more panes, so the facade glows at dusk.
    if (rel === 2 && (along % 6 === 1 || along % 6 === 4) && has(ix, iz)) {
      if (outward(ix, iz) === null) g.set(ix, y, iz, "shroomlight");
    }
  }

  // Roof deck directly on the top wall course.
  g.set(x, T - 2, z, "light_gray_concrete");

  // Cornice on the edge.
  if (edge) {
    g.set(x, T - 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// A few plant rooms on the roof, instead of a checkerboard of units.
const plantRooms = [
  [4, 6, 8, 6], [26, 4, 9, 7], [10, 40, 10, 8], [28, 44, 8, 7], [14, 66, 12, 6],
];
for (const [px, pz, w, d] of plantRooms) {
  for (let x = px; x < px + w; x++) {
    for (let z = pz; z < pz + d; z++) {
      if (!has(x, z)) continue;
      const gr = foot.get(`${x},${z}`);
      const T = Math.min(H, Math.max(roofY, gr + 6));
      if (T - 1 > H - 1) continue;
      const rim = x === px || x === px + w - 1 || z === pz || z === pz + d - 1;
      g.set(x, T - 1, z, rim ? "stone_bricks" : "smooth_stone");
    }
  }
}

// Entrance on the z-min face: glazed flanks, double doors, concrete lintel.
for (let x = 19; x <= 22; x++) {
  if (!has(x, 0)) continue;
  const gr = foot.get(`${x},0`);
  if (x === 19 || x === 22) {
    g.set(x, gr + 1, 0, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
    g.set(x, gr + 2, 0, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
  } else {
    const hinge = x === 20 ? "left" : "right";
    g.set(x, gr + 1, 0, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
    g.set(x, gr + 2, 0, "dark_oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
  }
  g.set(x, gr + 3, 0, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
