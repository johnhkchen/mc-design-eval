import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR301499602.cells.json`, "utf8"));

const W = 16, H = 22, D = 19;
const vx = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) vx.set(x, y, z, id, p);
  else vx.set(x, y, z, id);
};
const key = (x, z) => `${x},${z}`;

// footprint lookup
const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(key(x, z), { g: gr, r: rf });

const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// depth from the edge (0 = perimeter cell)
const depth = new Map();
const queue = [];
for (const [k] of map) {
  const [x, z] = k.split(",").map(Number);
  if (dirs.some(([dx, dz]) => !map.has(key(x + dx, z + dz)))) {
    depth.set(k, 0);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(key(x, z));
  for (const [dx, dz] of dirs) {
    const nk = key(x + dx, z + dz);
    if (map.has(nk) && !depth.has(nk)) {
      depth.set(nk, d + 1);
      queue.push([x + dx, z + dz]);
    }
  }
}

// global roof (median, flat top) and eave line
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const R = roofs[Math.floor(roofs.length / 2)];
const maxG = Math.max(...cells.map((c) => c[2]));
const E = Math.max(R - 2, maxG + 6); // top of walls/ceiling; roof sits on it

const xs = cells.map((c) => c[0]);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2;

// front door: perimeter cell facing +z, nearest the centre
let door = null;
for (const [k] of map) {
  const [x, z] = k.split(",").map(Number);
  if (depth.get(k) !== 0) continue;
  if (!map.has(key(x, z + 1))) {
    if (!door || Math.abs(x - cx) < Math.abs(door[0] - cx)) door = [x, z];
  }
}

// chimney cell: deepest interior cell
let chim = null;
for (const [k, d] of depth) {
  if (!chim || d > chim[1]) chim = [k.split(",").map(Number), d];
}

for (const [x, z, gr] of cells) {
  const k = key(x, z);
  const d = depth.get(k) ?? 0;
  const perim = d === 0;
  const outs = dirs.filter(([dx, dz]) => !map.has(key(x + dx, z + dz)));
  const isDoor = door && door[0] === x && door[1] === z;

  // foundation
  for (let y = 0; y < gr; y++) put(x, y, z, "granite");

  // ground course / floor
  put(x, gr, z, perim ? "polished_granite" : "spruce_planks");

  // walls, window grid and interior storey floors
  for (let y = gr + 1; y < E - 1; y++) {
    const rel = y - gr;
    if (!perim) {
      if (rel === 5) put(x, y, z, "spruce_planks");
      continue;
    }
    if (rel === 5) {
      put(x, y, z, "smooth_stone"); // storey string course
      continue;
    }
    const isWinRow = (rel - 1) % 5 < 3 && y < E - 2;
    if (outs.length === 1 && isWinRow && !(isDoor && rel <= 2)) {
      const along = outs[0][0] !== 0 ? z : x;
      const m = ((along % 3) + 3) % 3;
      if (m === 1) {
        // glass pane centred in a framed bay
        put(x, y, z, "glass_pane");
        if (rel === 2 && along % 6 === 1) {
          const [ox, oz] = outs[0];
          const ix = x - ox, iz = z - oz;
          if (map.has(key(ix, iz)) && (depth.get(key(ix, iz)) ?? 0) >= 1) {
            put(ix, y, iz, "glowstone");
          }
        }
      } else {
        // polished pilasters framing each window
        put(x, y, z, "polished_andesite");
      }
      continue;
    }
    if (isDoor && rel <= 2) continue; // door set later
    put(x, y, z, "stone_bricks");
  }

  // ceiling / cornice line
  put(x, E - 1, z, "smooth_stone");

  // stepped roof: edge ring one layer, inner cells two layers
  if (d === 1) put(x, E, z, "deepslate_tiles");
  if (d >= 2) {
    put(x, E, z, "deepslate_tiles");
    put(x, E + 1, z, "deepslate_tiles");
  }
}

// entrance: two-high door, dark canopy over it
if (door) {
  const [x, z] = door;
  const gr = map.get(key(x, z)).g;
  const props = { facing: "south", hinge: "left", open: "false", powered: "false" };
  put(x, gr, z, "polished_granite");
  put(x, gr + 1, z, "oak_door", { ...props, half: "lower" });
  put(x, gr + 2, z, "oak_door", { ...props, half: "upper" });
  // canopy: dark slab band across the front wall above the door
  for (let dx = -1; dx <= 1; dx++) {
    const cxp = x + dx;
    if (!map.has(key(cxp, z))) continue;
    const cg = map.get(key(cxp, z)).g;
    put(cxp, cg + 3, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }
  put(x, gr + 3, z, "polished_andesite");
}

// chimney stack on the roof
if (chim) {
  const [x, z] = chim[0];
  for (let y = E + 2; y <= E + 3; y++) put(x, y, z, "bricks");
  put(x, E + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

vx.save(`${DIR}/FR301499602.nbt`);
