// Lamps and hidden light (P6, element 27). Reads the finished ground and paths the earlier parts laid, so it places
// lamp posts beside every walkable pale path (about every 9 blocks, at the path edge, never in the bores or on the B
// pads) and a hidden `light` on an 11-block grid over the lawn, meadow and planting cells the lamps do not reach.
import { lampPost, hiddenLight, B_PADS, BIG_LAWN } from "../vocab.mjs";

// Walkable path surfaces laid by the terrain part (smooth sandstone and stone paths, the light paving of the promenade).
const PATH = new Set(["smooth_sandstone", "smooth_sandstone_slab", "smooth_sandstone_stairs", "smooth_stone",
  "smooth_stone_slab", "light_gray_concrete"]);
// Ground a lamp post may stand on beside a path.
const GROUND = new Set(["grass_block", "dirt", "coarse_dirt", "podzol", "moss_block", "rooted_dirt", "sand", "gravel",
  "stone", "clay"]);
const AIR = new Set(["air", "cave_air", "void_air"]);
const LAMP_SPACING = 9;        // Euclidean minimum between lamp posts (plan: every 9-10 along a path)
const LIGHT_GRID = 11;         // hidden light grid spacing (plan)
const LIGHT_REACH = 6;         // a hidden light is skipped within this distance of a lamp post

export function build(g) {
  const id = (x, y, z) => g.blockAt(x, y, z).replace(/^minecraft:/, "");
  const inB = (box, x, z) => x >= box.x0 && x <= box.x1 && z >= box.z0 && z <= box.z1;
  const inPad = (x, z, m = 0) => B_PADS.some((p) => inB({ x0: p.x0 - m, x1: p.x1 + m, z0: p.z0 - m, z1: p.z1 + m }, x, z));
  const inBores = (x, z) => x >= 41 && x <= 50 && z >= 79 && z <= 92;

  // Top solid y and block of every column, scanned once.
  const top = [];
  for (let z = 0; z < 146; z++) {
    top[z] = [];
    for (let x = 0; x < 120; x++) {
      let t = -1;
      for (let y = 29; y >= 1; y--) if (!AIR.has(id(x, y, z))) { t = y; break; }
      top[z][x] = { y: t, block: t < 0 ? "air" : id(x, t, z) };
    }
  }
  const at = (x, z) => (x < 0 || z < 0 || x > 119 || z > 145) ? null : top[z][x];

  // Path cells: a path surface on the ground, not the portal, retaining cut or lid cells above the ground.
  const isPath = (x, z) => {
    const c = at(x, z);
    if (!c || !PATH.has(c.block)) return false;
    if (x >= 28 && x <= 42 && z >= 76 && z <= 95 && c.y >= 5) return false;
    return true;
  };

  // Order: breadth-first from the lowest-numbered cell of each connected path, so lamps run along each path in turn.
  const seen = new Set();
  const order = [];
  for (let z = 0; z < 146; z++) for (let x = 0; x < 120; x++) {
    if (!isPath(x, z) || seen.has(z * 120 + x)) continue;
    const queue = [[x, z]];
    seen.add(z * 120 + x);
    for (let q = 0; q < queue.length; q++) {
      const [cx, cz] = queue[q];
      order.push([cx, cz]);
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, nz = cz + dz;
        if ((dx || dz) && nx >= 0 && nz >= 0 && nx < 120 && nz < 146 && !seen.has(nz * 120 + nx) && isPath(nx, nz)) {
          seen.add(nz * 120 + nx);
          queue.push([nx, nz]);
        }
      }
    }
  }

  // Air the Outpost part holds over the runnel channel: it carves y 4 where the mound rises (x 94..99, z 36..40), and
  // those cells are locked, so a lamp base there is refused.
  const LOCKED_AIR = (x, y, z) => y === 4 && x >= 94 && x <= 99 && z >= 36 && z <= 40;
  // The lamp stands on the ground beside the path: each 4-neighbour that is not path, at the path's level, with air
  // above, nearest side first.
  const sidesFor = (x, z) => {
    const T = at(x, z).y, out = [];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      const c = at(nx, nz);
      if (!c || isPath(nx, nz) || !GROUND.has(c.block)) continue;
      if (Math.abs(c.y - T) > 1 || nx > 116 || inPad(nx, nz) || inBores(nx, nz) || LOCKED_AIR(nx, c.y + 1, nz)) continue;
      let clear = true;
      for (let k = 1; k <= 4 && clear; k++) clear = AIR.has(id(nx, c.y + k, nz));
      if (clear) out.push([nx, c.y + 1, nz]);
    }
    return out;
  };

  // A lamp post lands whole or not at all. Earlier parts are locked, so a post whose base sits on a locked cell is
  // refused in part: the helper writes cell by cell and does not see the lock. Those fragments are taken back out (only
  // cells this part just placed are non-air here) and the side is passed over.
  const lampAt = (x, y, z) => {
    const r = lampPost(g, x, y, z);
    const want = ["dark_oak_fence", "dark_oak_fence", "dark_oak_fence", "lantern"];
    if (!r.refused.length && want.every((b, k) => id(x, y + k, z) === b)) return true;
    for (let k = 0; k < 4; k++) if (!AIR.has(id(x, y + k, z))) g.set(x, y + k, z, "air");
    return false;
  };

  const lamps = [];
  let placedLamps = 0;
  for (const [x, z] of order) {
    if (lamps.some(([lx, lz]) => Math.hypot(lx - x, lz - z) < LAMP_SPACING)) continue;
    for (const [sx, sy, sz] of sidesFor(x, z)) {
      if (lamps.some(([lx, lz]) => Math.hypot(lx - sx, lz - sz) < LAMP_SPACING)) continue;
      if (!lampAt(sx, sy, sz)) continue;
      lamps.push([sx, sz]);
      placedLamps++;
      break;
    }
  }

  // Hidden light on the 11-block grid over lawn, meadow and planting ground that no lamp reaches.
  // Ground a light may sit over: lawn, planting, meadow, sand and play ground, and the road and walk surfaces.
  const LIT = new Set(["grass_block", "moss_block", "podzol", "coarse_dirt", "rooted_dirt", "dirt", "sand", "gravel",
    "gray_concrete", "stone"]);
  const spot = (gx, gz) => {
    if (isPath(gx, gz) || inPad(gx, gz, 1) || inBores(gx, gz)) return null;
    const c = at(gx, gz);
    if (!c || !LIT.has(c.block) || !AIR.has(id(gx, c.y + 1, gz))) return null;
    if (lamps.some(([lx, lz]) => Math.hypot(lx - gx, lz - gz) < LIGHT_REACH)) return null;
    return c;
  };
  const near = [0, 1, -1, 2, -2];
  let placedLights = 0, ringed = 0;
  for (let gz = 5; gz < 146; gz += LIGHT_GRID) for (let gx = 5; gx < 120; gx += LIGHT_GRID) {
    // The grid point, or the nearest suitable cell beside it when the grid point is path, pad, or water.
    let hit = null;
    for (const dz of near) for (const dx of near) {
      if (hit) break;
      const x = gx + dx, z = gz + dz;
      if (x < 1 || z < 1 || x > 118 || z > 144) continue;
      const c = spot(x, z);
      if (c) hit = [x, z, c];
    }
    if (!hit) continue;
    const [x, z, c] = hit;
    const lawn = inB(BIG_LAWN, x, z);
    const r = hiddenLight(g, x, z, c.y);
    if (!r.placed) continue;
    placedLights++;
    if (lawn || c.block === "gray_concrete" || c.block === "stone") continue;
    // Moss carpet ring for planting, only on the cells that sit on the same surface level (a carpet over air floats).
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, nz = z + dz;
      if (!(dx || dz) || at(nx, nz)?.y !== c.y || isPath(nx, nz) || !AIR.has(id(nx, c.y + 1, nz))) continue;
      g.set(nx, c.y + 1, nz, "moss_carpet");
      ringed++;
    }
  }
  console.log(`lighting: ${placedLamps} lamp posts on ${order.length} path cells, ${placedLights} hidden lights (${ringed} ringed)`);
}
