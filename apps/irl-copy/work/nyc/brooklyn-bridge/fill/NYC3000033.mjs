import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3000033.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3000033.nbt";

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const W = 5, H = 15, D = 7;
const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Smooth the lidar roof into one flat parapet height for the whole block.
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const roofTop = roofs[Math.floor(roofs.length / 2)];

const fp = new Map();
for (const [x, z, ground] of cells) {
  fp.set(`${x},${z}`, { gr: Math.round(ground) });
}
const has = (x, z) => fp.has(`${x},${z}`);

// Entrance: the north-facing exposed cell closest to the middle of that face.
const northCells = cells
  .map(([x, z, ground]) => ({ x, z, gr: Math.round(ground) }))
  .filter(c => !has(c.x, c.z - 1));
const meanX = northCells.reduce((s, c) => s + c.x, 0) / Math.max(1, northCells.length);
northCells.sort((a, b) => Math.abs(a.x - meanX) - Math.abs(b.x - meanX) || a.gr - b.gr);
const door = northCells[0] ? { x: northCells[0].x, z: northCells[0].z } : null;

// Main massing: each cell gets its ground, a shared roof level.
for (const [x, z, ground] of cells) {
  const gr = Math.round(ground);
  const wt = Math.min(Math.max(roofTop - 1, gr + 2), H - 3); // wall top / deck
  const exposedZ = !has(x, z - 1) || !has(x, z + 1);
  const exposedX = !has(x - 1, z) || !has(x + 1, z);
  const perimeter = exposedX || exposedZ;
  const corner = exposedX && exposedZ;
  const isDoor = door && door.x === x && door.z === z;

  // Foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y < wt; y++) {
    const rel = y - gr;

    // Interior: air with a floor slab every storey.
    if (!perimeter) {
      if (rel > 0 && rel % 2 === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    // Entrance: two-high iron door on the north face.
    if (isDoor && rel === 0) {
      put(x, y, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isDoor && rel === 1) {
      put(x, y, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }

    // Base course and storey lines in stone (even rows).
    if (rel === 0 || (rel % 2 === 0)) {
      put(x, y, z, "stone_bricks");
      continue;
    }

    // Cornice line at the top of the wall.
    if (y === wt - 1) {
      put(x, y, z, "stone_bricks");
      continue;
    }

    // Brick corners and piers; glazed steel-sash bays between.
    if (corner) {
      put(x, y, z, "bricks");
      continue;
    }
    const t = exposedZ && !exposedX ? x : z;
    if (t % 3 === 0) {
      put(x, y, z, "bricks");
    } else if ((t + y) % 5 === 0) {
      put(x, y, z, "glowstone");
    } else {
      put(x, y, z, "gray_stained_glass");
    }
  }

  // Roof deck and parapet.
  put(x, wt, z, "stone");
  if (perimeter && wt + 1 < H) put(x, wt + 1, z, "stone_bricks");
}

// Rooftop mechanical unit on an interior roof cell, if one exists.
const interior = cells
  .map(([x, z, ground]) => ({ x, z, gr: Math.round(ground) }))
  .find(c => has(c.x - 1, c.z) && has(c.x + 1, c.z) && has(c.x, c.z - 1) && has(c.x, c.z + 1));
if (interior) {
  const wt = Math.min(Math.max(roofTop - 1, interior.gr + 2), H - 3);
  if (wt + 1 < H) put(interior.x, wt + 1, interior.z, "iron_block");
}

g.save(OUT);
