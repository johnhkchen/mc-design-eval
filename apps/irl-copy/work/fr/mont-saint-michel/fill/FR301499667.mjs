import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499667";
const W = 18, H = 30, D = 11;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const c of raw) {
  const [x, z, gr, roof] = c;
  cellMap.set(key(x, z), { x, z, g: Math.round(gr), roof: Number(roof) });
}
const has = (x, z) => cellMap.has(key(x, z));
const cells = [...cellMap.values()];

// Smoothed roof height: median lidar roof, clamped to the volume.
const roofs = cells.map(c => c.roof).filter(v => Number.isFinite(v)).sort((a, b) => a - b);
const R = Math.min(H - 3, roofs.length ? Math.round(roofs[Math.floor(roofs.length / 2)]) : 18);

// Edge distance (4-neighbour): perimeter cells = 1.
const dist = new Map();
const queue = [];
for (const c of cells) {
  if (!has(c.x - 1, c.z) || !has(c.x + 1, c.z) || !has(c.x, c.z - 1) || !has(c.x, c.z + 1)) {
    dist.set(key(c.x, c.z), 1);
    queue.push(c);
  }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = c.x + dx, nz = c.z + dz, nk = key(nx, nz);
    if (has(nx, nz) && !dist.has(nk)) {
      dist.set(nk, d + 1);
      queue.push(cellMap.get(nk));
    }
  }
}
const D_OF = (c) => dist.get(key(c.x, c.z)) || 3;

// Roof top per cell (exclusive). Rises two blocks per ring in from the eaves,
// capped at the smoothed lidar ridge, so the hip reaches the lidar height.
const TOP = new Map();
for (const c of cells) {
  const g0 = c.g;
  const T = Math.min(H - 1, Math.max(g0 + 7, Math.min(R, g0 + 6 + 2 * D_OF(c))));
  TOP.set(key(c.x, c.z), T);
  c.T = T;
}
const topAt = (x, z) => (has(x, z) ? TOP.get(key(x, z)) : -Infinity);

const g = new Voxels([W, H, D]);
const put = (x, y, z, name, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

const paneProps = (facing) => {
  const ew = facing === "N" || facing === "S";
  return {
    north: ew ? "false" : "true",
    south: ew ? "false" : "true",
    east: ew ? "true" : "false",
    west: ew ? "true" : "false",
    waterlogged: "false",
  };
};

// Pass 1: foundations, storey slab, walls with pilasters, roof.
for (const c of cells) {
  const d = D_OF(c);
  const g0 = c.g;
  for (let y = 0; y <= g0; y++) put(c.x, y, c.z, "stone_bricks");
  put(c.x, g0 + 5, c.z, "stone_bricks");

  if (d === 1) {
    for (let y = g0 + 1; y <= g0 + 4; y++) put(c.x, y, c.z, "calcite");
    put(c.x, g0 + 1, c.z, "stone_bricks");
  }

  // Roof: solid core, with an outward-facing stair course where the roof drops.
  const T = c.T;
  const dirs = [
    ["N", c.x, c.z - 1],
    ["S", c.x, c.z + 1],
    ["W", c.x - 1, c.z],
    ["E", c.x + 1, c.z],
  ];
  let lowFacing = null;
  for (const [f, nx, nz] of dirs) {
    if (topAt(nx, nz) < T) { lowFacing = f; break; }
  }
  if (lowFacing && T - 1 >= g0 + 6) {
    for (let y = g0 + 6; y <= T - 2; y++) put(c.x, y, c.z, "deepslate_tiles");
    put(c.x, T - 1, c.z, "deepslate_tile_stairs", {
      facing: { N: "north", S: "south", W: "west", E: "east" }[lowFacing],
      half: "bottom",
      shape: "straight",
      waterlogged: "false",
    });
  } else {
    for (let y = g0 + 6; y < T; y++) {
      put(c.x, y, c.z, y === T - 1 ? "polished_deepslate" : "deepslate_tiles");
    }
  }
}

// Pass 2: openings and facade articulation on the perimeter.
const facingsOf = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};
const inward = (f, x, z) => ({ N: [x, z + 1], S: [x, z - 1], W: [x + 1, z], E: [x - 1, z] })[f];
const alongOf = (f, x, z) => (f === "N" || f === "S" ? x : z);

const frontCells = cells
  .filter(c => D_OF(c) === 1 && facingsOf(c.x, c.z).length === 1 && facingsOf(c.x, c.z)[0] === "N")
  .sort((a, b) => a.x - b.x);
const frontMin = frontCells.length ? frontCells[0].x : 0;
const frontMax = frontCells.length ? frontCells[frontCells.length - 1].x : 0;
const doorX = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)].x : -1;

for (const c of cells) {
  if (D_OF(c) !== 1) continue;
  const fs = facingsOf(c.x, c.z);
  if (fs.length === 0) continue;
  const g0 = c.g;

  if (fs.length >= 2) {
    for (let y = g0 + 1; y <= g0 + 4; y++) put(c.x, y, c.z, "stone_bricks");
    continue;
  }

  const f = fs[0];
  const idx = alongOf(f, c.x, c.z);

  if (f === "N") {
    const isEnd = c.x === frontMin || c.x === frontMax;
    const rel = c.x - frontMin;
    if (c.x === doorX) {
      // Entrance: stone surround, glazed transom, lantern under the cornice line.
      put(c.x, g0 + 1, c.z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(c.x, g0 + 2, c.z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(c.x, g0 + 3, c.z, "glass_pane", paneProps("N"));
      put(c.x, g0 + 4, c.z, "lantern", { hanging: "true", waterlogged: "false" });
      put(c.x, g0 + 5, c.z, "dark_oak_planks");
    } else if (isEnd || rel % 4 === 0) {
      for (let y = g0 + 1; y <= g0 + 4; y++) put(c.x, y, c.z, "stone_bricks");
    } else {
      // Shopfront glazing with a dark fascia band and a lantern line behind.
      for (let y = g0 + 1; y <= g0 + 3; y++) put(c.x, y, c.z, "glass_pane", paneProps("N"));
      put(c.x, g0 + 4, c.z, "dark_oak_planks");
      const [ix, iz] = inward("N", c.x, c.z);
      if (has(ix, iz) && rel % 4 === 2) {
        put(ix, g0 + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
    // Door surround: stone jambs on the neighbouring front cells.
    if (Math.abs(c.x - doorX) === 1) {
      for (let y = g0 + 1; y <= g0 + 4; y++) put(c.x, y, c.z, "stone_bricks");
    }
  } else {
    // Side and rear: punched windows on a three-bay rhythm, stone pilasters between.
    if (idx % 3 === 1) {
      put(c.x, g0 + 1, c.z, "stone_bricks");
      for (let y = g0 + 2; y <= g0 + 4; y++) put(c.x, y, c.z, "glass_pane", paneProps(f));
      const [ix, iz] = inward(f, c.x, c.z);
      if (has(ix, iz) && idx % 6 === 1) {
        put(ix, g0 + 2, iz, "lantern", { hanging: "true", waterlogged: "false" });
      }
    } else if (idx % 3 === 0) {
      for (let y = g0 + 1; y <= g0 + 4; y++) put(c.x, y, c.z, "stone_bricks");
    }
  }
}

// Chimney from the highest roof cell, rising through the roof.
let top = null;
for (const c of cells) {
  if (!top || c.T > top.T || (c.T === top.T && D_OF(c) > D_OF(top))) top = c;
}
if (top) {
  for (let y = top.T - 1; y <= Math.min(H - 3, top.T + 2); y++) put(top.x, y, top.z, "stone_bricks");
  put(top.x, Math.min(H - 1, top.T + 3), top.z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
