import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001565.cells.json`, "utf8"));

// 29 Willow Street: 1887 Brooklyn Heights brownstone-trimmed red-brick walk-up, four storeys
// on a three-block storey module, flat tar roof behind a brick parapet, two chimney stacks.
const W = 17, H = 25, D = 6;
const g = new Voxels([W, H, D]);

const cell = new Map();
let G = Infinity;
for (const [x, z, gr, roof] of cells) {
  const ground = Math.round(gr);
  const top = Math.round(roof);
  cell.set(`${x},${z}`, { g: ground, r: top });
  G = Math.min(G, ground);
}
const has = (x, z) => cell.has(`${x},${z}`);
const solid = new Set();

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
  solid.add(`${x},${y},${z}`);
};

const modRow = (y) => (((y - G) % 3) + 3) % 3; // storey module shared by the whole building
const windows = [];

// Pass 1: foundations, interior floors, perimeter walls, windows and door
for (const [key, { g: gr, r }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const mX = !has(x - 1, z) || !has(x + 1, z);
  const mZ = !has(x, z - 1) || !has(x, z + 1);
  const per = mX || mZ;

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!per) {
    // Interior: floor slab at each storey line, ground floor, and the roof deck
    for (let y = gr; y < r; y++) {
      if (y === gr || y === r - 1 || modRow(y) === 0) {
        put(x, y, z, y === r - 1 ? "gray_concrete" : "smooth_stone");
      }
    }
    continue;
  }

  // Perimeter wall, ground to just under the roof
  for (let y = gr; y < r; y++) {
    const rel = modRow(y);
    const isBelt = y === gr || y === r - 1 || rel === 0;
    const isFrontBack = mZ && !mX;   // runs along x
    const isSide = mX && !mZ;        // runs along z
    const winHere = (isFrontBack && x % 3 !== 0) || isSide;

    // Entrance on the z=0 front: door at x=8, flanking piers
    if (z === 0 && x === 8 && (y === gr + 1 || y === gr + 2)) {
      const upper = y === gr + 2;
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: upper ? "upper" : "lower",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (z === 0 && x === 7 && (y === gr + 1 || y === gr + 2)) {
      put(x, y, z, "bricks");
      continue;
    }

    if (isBelt) {
      // Brownstone-toned trim: sill/lintel belts, plinth and cornice
      put(x, y, z, "brown_terracotta");
    } else if (winHere) {
      const props = isFrontBack
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, y, z, "glass_pane", props);
      const dx = isSide ? (!has(x - 1, z) ? 1 : -1) : 0;
      const dz = isFrontBack ? (!has(x, z - 1) ? 1 : -1) : 0;
      windows.push({ x, y, z, rel, dx, dz });
    } else {
      put(x, y, z, "bricks");
    }
  }

  // Brick parapet on the roof edge
  if (r < H) put(x, r, z, "bricks");
}

// Pass 2: warm lanterns just inside some lower-row windows (they stand on the storey floor)
for (const w of windows) {
  if (w.rel !== 1) continue;
  if ((w.x + w.y) % 3 !== 0) continue;
  const xi = w.x + w.dx, zi = w.z + w.dz;
  if (!has(xi, zi)) continue;
  if (!solid.has(`${xi},${w.y - 1},${zi}`)) continue;
  if (solid.has(`${xi},${w.y},${zi}`)) continue;
  put(xi, w.y, zi, "lantern", { hanging: "false", waterlogged: "false" });
}

// Pass 3: two chimney stacks rising from the flat roof
const chimneys = [[3, 2], [13, 3]];
for (const [cx, cz] of chimneys) {
  if (!has(cx, cz)) continue;
  const { r } = cell.get(`${cx},${cz}`);
  put(cx, r, cz, "bricks");
  put(cx, r + 1, cz, "bricks");
  put(cx, r + 2, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/NYC3001565.nbt`);
