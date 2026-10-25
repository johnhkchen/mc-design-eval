import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499451.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499451.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 15, D = 13, H_MAX = 21;
const g = new Voxels([W, H_MAX, D]);

const cell = new Map();
for (const [x, z, ground, roof] of cells) {
  cell.set(`${x},${z}`, { x, z, g: ground, r: roof, d: 0 });
}
const has = (x, z) => cell.has(`${x},${z}`);
const get = (x, z) => cell.get(`${x},${z}`);

const DIRS = [
  { name: "north", dx: 0, dz: -1, axis: "z" },
  { name: "east", dx: 1, dz: 0, axis: "x" },
  { name: "south", dx: 0, dz: 1, axis: "z" },
  { name: "west", dx: -1, dz: 0, axis: "x" },
];

// Edge distance: 1 on the perimeter, increasing inward
const queue = [];
for (const c of cell.values()) {
  if (DIRS.some(({ dx, dz }) => !has(c.x + dx, c.z + dz))) { c.d = 1; queue.push(c); }
}
while (queue.length) {
  const c = queue.shift();
  for (const { dx, dz } of DIRS) {
    const n = get(c.x + dx, c.z + dz);
    if (n && n.d === 0) { n.d = c.d + 1; queue.push(n); }
  }
}

// One flat roof level for the whole massing: mean lidar roof, clamped
const meanRoof = cells.reduce((s, c) => s + c[3], 0) / cells.length;
const H = Math.max(9, Math.min(19, Math.round(meanRoof)));
const T = H - 4;        // top of walls
const R0 = T + 1;       // first roof course

// Door on south face, nearest the middle
let doorKey = null;
{
  let best = Infinity;
  const midX = (W - 1) / 2;
  for (const c of cell.values()) {
    if (!has(c.x, c.z + 1) && c.d === 1) {
      const dist = Math.abs(c.x - midX);
      if (dist < best) { best = dist; doorKey = `${c.x},${c.z}`; }
    }
  }
}

const WALL = "stone_bricks";
const BAND = "smooth_stone";
const BASE = "polished_andesite";
const FOUND = "stone";
const SLATE = "deepslate_tiles";
const EAVE = "stone_brick_stairs";

for (const c of cell.values()) {
  const { x, z, d } = c;
  const gr = c.g;

  // Foundation under each cell
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const missing = DIRS.filter(({ dx, dz }) => !has(x + dx, z + dz));

  if (d === 1) {
    const corner = missing.length >= 2;
    for (let y = gr; y <= T; y++) {
      let block = WALL;
      if (y === gr) block = BASE;
      else if (corner) block = BAND;          // quoins at corners
      else if (y === gr + 3 || y === T) block = BAND; // storey line and cornice
      g.set(x, y, z, block);
    }

    if (missing.length === 1 && !corner) {
      const face = missing[0];
      const idx = face.axis === "z" ? x : z;
      const isDoor = doorKey === `${x},${z}` && face.name === "south";

      if (isDoor) {
        // Doorway with a hood over it, flanked by pilasters
        g.set(x, gr, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        g.set(x, gr + 1, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        g.set(x, gr + 2, z, "stone_brick_stairs", { facing: "south", half: "top", shape: "straight", waterlogged: "false" });
        for (const dx of [-1, 1]) {
          const px = x + dx;
          if (has(px, z)) {
            for (let y = gr; y <= T; y++) g.set(px, y, z, y === gr ? BASE : BAND);
          }
        }
      } else if (idx % 3 === 1) {
        const rows = [gr + 1, gr + 2, gr + 4].filter((y) => y < T);
        const paneProps = face.axis === "z"
          ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
          : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
        for (const y of rows) g.set(x, y, z, "glass_pane", paneProps);

        // Sill under the lower window row
        g.set(x, gr + 1, z, "glass_pane", paneProps);

        // Warm light behind some glass
        const ix = x - face.dx, iz = z - face.dz;
        const inner = get(ix, iz);
        if (inner && inner.d >= 2 && idx % 2 === 0) {
          g.set(ix, gr + 1, iz, "shroomlight");
        }
        if (inner && inner.d >= 2 && idx % 4 === 1 && gr + 4 < T) {
          g.set(ix, gr + 4, iz, "glowstone");
        }
      }
    }
  }

  // Interior floors (air gap behind glass, slab per storey)
  if (d >= 2) {
    g.set(x, gr, z, "stone_bricks");
    if (gr + 3 < T) g.set(x, gr + 3, z, BAND);
  }
}

// Hipped roof over the whole footprint, three courses rising from the cornice.
// e = distance to the nearest outer edge of the rectangle (0 on the rim).
for (const c of cell.values()) {
  const { x, z } = c;
  const ez = Math.min(z, D - 1 - z);
  const ex = Math.min(x, W - 1 - x);
  const e = Math.min(ex, ez);

  let facing;
  if (ez <= ex) facing = z < D - 1 - z ? "north" : "south";
  else facing = x < W - 1 - x ? "west" : "east";

  for (let j = 0; j < 3; j++) {
    const y = R0 + j;
    if (y >= H_MAX) continue;
    if (e < j) continue;
    if (e === j) {
      g.set(x, y, z, EAVE, { facing, half: "bottom", shape: "straight", waterlogged: "false" });
    } else {
      g.set(x, y, z, SLATE);
    }
  }
}

g.save(OUT);
