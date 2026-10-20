// Group 1 of plan.md VOCABULARY: marble_cube, door_pair, rocket, planter, tier_ring, hang_lantern, meadow, plaza.
// Every helper takes the Grid first, then its position (and facing) as arguments. It writes only the cells of its
// own footprint, and only into air: a write into a solid cell is skipped and kept on g.refused (as guard() does),
// unless opts.over is true. Multi-cell pieces (doors, two-high plants) are all-or-nothing. Each helper returns the
// number of blocks it placed. Block ids are plan.md PALETTE, 1.21.1; states come from build.mjs B.* where it has one.
import { B, DIRS, face } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const inE = (x, z, [cx, cz, rx, rz]) => ((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2 <= 1;

// Air-only write, all or nothing: writes = [[x, y, z, block, state], ...]. Returns the count placed.
function putAll(g, opts, writes) {
  const blocked = writes.filter(([x, y, z]) => !opts.over && !g.isAir(x, y, z));
  if (blocked.length) {
    (g.refused ??= []).push(...blocked.map(([x, y, z, block]) => [x, y, z, block]));
    return 0;
  }
  for (const [x, y, z, block, state] of writes) g.set(x, y, z, block, state);
  return writes.length;
}
const put = (g, opts, x, y, z, block, state) => putAll(g, opts, [[x, y, z, block, state]]);

/** Four-walled cube on the plan's grid: plinth y1, hollow white marble walls 2 thick y2..10, roof y11. */
export function marble_cube(g, x0, x1, z0, z1, opts = {}) {
  let n = 0;
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) {
      const edge = x === x0 || x === x1 || z === z0 || z === z1;
      const wall = x - x0 < 2 || x1 - x < 2 || z - z0 < 2 || z1 - z < 2;
      if (edge) n += put(g, opts, x, 1, z, "polished_granite"); // plinth ring only (the podium is another part's)
      n += put(g, opts, x, 11, z, ...B.slab(edge ? "smooth_quartz" : "smooth_stone")); // roof: coping ring, slab field
      for (let y = 2; y <= 10; y++) if (wall) n += put(g, opts, x, y, z, "white_terracotta");
    }
  return n;
}

/** Two doors side by side, lower and upper halves, same facing; hinges mirrored (left cell hinge left).
 *  (x, y, z) is the left cell as seen from the front; the right cell is one step clockwise from facing. */
export function door_pair(g, x, y, z, facing, material, opts = {}) {
  const mat = material.replace(/_door$/, "");
  const [dx, , dz] = DIRS[face.cw(facing)];
  const writes = [];
  for (const [cx, cz, hinge] of [[x, z, "left"], [x + dx, z + dz, "right"]]) {
    writes.push([cx, y, cz, ...B.door(mat, facing, "lower", hinge)], [cx, y + 1, cz, ...B.door(mat, facing, "upper", hinge)]);
  }
  return putAll(g, opts, writes);
}

/** Standing 2x2 rocket: white body y..y+5 with a red band at y+2, iron cap at y+6, four 2-high fins at the base. */
export function rocket(g, x, z, y = 2, opts = {}) {
  const writes = [];
  for (let dy = 0; dy <= 5; dy++)
    for (let dx = 0; dx < 2; dx++)
      for (let dz = 0; dz < 2; dz++) writes.push([x + dx, y + dy, z + dz, dy === 2 ? "red_concrete" : "white_concrete"]);
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) writes.push([x + dx, y + 6, z + dz, "iron_block"]);
  for (const [fx, fz] of [[x, z - 1], [x + 1, z + 2], [x - 1, z + 1], [x + 2, z]])
    for (const dy of [0, 1]) writes.push([fx, y + dy, fz, "light_gray_concrete"]);
  return putAll(g, opts, writes);
}

/** Planting box: box = [x0, z0, x1, z1] soil cells at level y (grass_block), a 1-high polished granite curb round
 *  them at y+1, azalea in the middle and short grass inside. Nothing is written below y. */
export function planter(g, [x0, z0, x1, z1], y, opts = {}) {
  const cx = Math.floor((x0 + x1) / 2), cz = Math.floor((z0 + z1) / 2);
  let n = 0;
  for (let x = x0 - 1; x <= x1 + 1; x++)
    for (let z = z0 - 1; z <= z1 + 1; z++) {
      const inside = x >= x0 && x <= x1 && z >= z0 && z <= z1;
      if (inside) n += put(g, opts, x, y, z, "grass_block");
      n += put(g, opts, x, y + 1, z, inside ? (x === cx && z === cz ? "azalea" : "short_grass") : "polished_granite");
    }
  return n;
}

/** Slab over the cells of the outer ellipse not covered by the inner one: E = [cx, cz, rx, rz]; innerE may be null.
 *  slab is the material word ("smooth_sandstone" gives smooth_sandstone_slab, bottom). */
export function tier_ring(g, outerE, innerE, y, slab, opts = {}) {
  const mat = slab.replace(/_slab$/, "");
  const [cx, cz, rx, rz] = outerE;
  let n = 0;
  for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
    for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++)
      if (inE(x, z, outerE) && !(innerE && inE(x, z, innerE))) n += put(g, opts, x, y, z, ...B.slab(mat));
  return n;
}

/** Hanging lantern at (x, y, z). It hangs from the block above, so with air above it places nothing and says so. */
export function hang_lantern(g, x, y, z, opts = {}) {
  if (!opts.over && g.isAir(x, y + 1, z)) {
    (g.refused ??= []).push([x, y, z, "lantern (no block above)"]);
    return 0;
  }
  return put(g, opts, x, y, z, ...B.lantern(true));
}

const DOUBLE = new Set(["tall_grass", "large_fern"]);
const MEADOW = new Set(["grass_block", "podzol", "coarse_dirt", "short_grass", "tall_grass", "large_fern", "azure_bluet",
  "blue_orchid", "azalea", "flowering_azalea", "sugar_cane", "lily_pad"]);

/** Planting: cells = [[x, y, z, block], ...] with block one of MEADOW (tall_grass and large_fern take y and y+1).
 *  Each entry is written on its own (all or nothing per plant). */
export function meadow(g, cells, opts = {}) {
  let n = 0;
  for (const [x, y, z, block] of cells) {
    if (!MEADOW.has(block)) throw new Error(`meadow: unknown kind ${block}`);
    n += DOUBLE.has(block)
      ? putAll(g, opts, [[x, y, z, block, { half: "lower" }], [x, y + 1, z, block, { half: "upper" }]])
      : put(g, opts, x, y, z, block);
  }
  return n;
}

/** Plaza paving on the ellipse E(cx, cz, rx, rz) at level y: smooth_sandstone field, cut_sandstone on the edge
 *  ring and on a mid ring. */
export function plaza(g, cx, cz, rx, rz, y, opts = {}) {
  let n = 0;
  for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
    for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) {
      if (!inE(x, z, [cx, cz, rx, rz])) continue;
      const edge = !inE(x, z, [cx, cz, rx - 1, rz - 1]);
      const mid = inE(x, z, [cx, cz, rx / 2, rz / 2]) && !inE(x, z, [cx, cz, rx / 2 - 1, rz / 2 - 1]);
      n += put(g, opts, x, y, z, edge || mid ? "cut_sandstone" : "smooth_sandstone");
    }
  return n;
}
