import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738140";
const W = 21, H = 23, D = 12;

// Footprint: [x, z, ground] per cell. y 0 is the lowest ground under the footprint.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.round(gr));
}
const has = (x, z) => ground.has(`${x},${z}`);
const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const doorX = minX + Math.floor((maxX - minX) / 2);
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundation, floor slabs, roof slab for every footprint cell.
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");   // foundation
  put(x, gr, z, "smooth_stone");                               // ground slab
  put(x, gr + 5, z, "smooth_stone");                           // storey-2 slab
  put(x, gr + 10, z, "light_gray_concrete");                   // roof slab
}

// Pass 2: facades on perimeter cells, door, glow behind windows, parapet.
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  if (!isEdge(x, z)) continue;

  const isFront = z === minZ, isBack = z === maxZ;
  const isWest = x === minX, isEast = x === maxX;
  const corner = (isFront || isBack) && (isWest || isEast);
  const alongX = isFront || isBack;
  const t = alongX ? x : z;
  const base = alongX ? minX : minZ;
  const len = alongX ? maxX - minX : maxZ - minZ;
  const rel = t - base;
  const pillar = corner || rel % 3 === 0 || rel === len;

  // Inward direction for glowing interior light.
  let dx = 0, dz = 0;
  if (!corner) {
    if (isFront) dz = 1; else if (isBack) dz = -1;
    else if (isWest) dx = 1; else if (isEast) dx = -1;
  }
  const pane = alongX ? PANE_EW : PANE_NS;
  const isDoor = isFront && x === doorX;

  // Ground storey (gr+1 .. gr+4)
  for (let yy = gr + 1; yy <= gr + 4; yy++) {
    if (isDoor && (yy === gr + 1 || yy === gr + 2)) {
      const half = yy === gr + 1 ? "lower" : "upper";
      put(x, yy, z, "dark_oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (isDoor && yy === gr + 3) {
      put(x, yy, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (yy === gr + 1) {
      put(x, yy, z, "polished_andesite");                       // plinth
    } else if (yy === gr + 4) {
      // fascia with occasional red sign panel
      put(x, yy, z, !pillar && rel % 6 === 1 ? "red_concrete" : "smooth_quartz");
    } else {
      // shopfront: glass bays between concrete mullions
      put(x, yy, z, pillar ? "gray_concrete" : "glass");
    }
  }

  // Upper storey (gr+6 .. gr+9)
  for (let yy = gr + 6; yy <= gr + 9; yy++) {
    if (yy === gr + 6 || yy === gr + 9) {
      put(x, yy, z, pillar ? "light_gray_concrete" : "smooth_quartz"); // spandrels / storey lines
    } else {
      if (pillar) {
        put(x, yy, z, "light_gray_concrete");
      } else {
        put(x, yy, z, "light_blue_stained_glass_pane", pane);
      }
    }
  }

  // Warm light behind some upper windows (air gap sits between glass and light).
  if (!pillar && !corner && rel % 6 === 2) {
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && !isEdge(ix, iz)) put(ix, gr + 7, iz, "glowstone");
  }

  // Parapet on top of the roof slab.
  put(x, gr + 11, z, "white_concrete");
  if (!pillar) put(x, gr + 11, z, "smooth_quartz");
}

// Pass 3: roof equipment on interior cells (stair/lift housing and AC units).
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  if (!has(x, z) || isEdge(x, z)) continue;
  if (x >= minX + 3 && x <= minX + 6 && z >= minZ + 3 && z <= minZ + 6) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "light_gray_concrete");
    put(x, gr + 13, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  if (x >= maxX - 5 && x <= maxX - 4 && z >= minZ + 3 && z <= minZ + 4) {
    put(x, gr + 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
