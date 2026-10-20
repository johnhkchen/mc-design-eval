// Tunnel Tops west, helpers h4 (plan.md VOCABULARY): walkStrip, portalFace, fenceNet, runnel, overlookDeck,
// promenade, cypress. Each takes the grid first, then its position (and facing) as arguments, and returns
// { placed, refused }. Writes go only into air unless `over: true` (then they may replace a surface cell
// an earlier part laid); anything refused is listed as [x, y, z] so the caller can see it.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

/** A writer that only places into air (or over non-air when `over`), and keeps count of what it refused. */
function placer(g, { over = false } = {}) {
  const out = { placed: 0, refused: [] };
  out.set = (x, y, z, block, state) => {
    if (g.inBounds(x, y, z) && (over || g.isAir(x, y, z))) {
      g.set(x, y, z, block, state);
      out.placed++;
    } else out.refused.push([x, y, z]);
    return out;
  };
  return out;
}

/**
 * A walk at surface height `height` (a number or (x, z) => H) over the box x0..x1 by z0..z1. Each cell gets the full
 * `block` at its H. Where H changes by 1 along `dir` ("x" or "z"), the lower cell gets a bottom slab at H+1 on its own
 * full block (the half-step). Covers y H and H+1 only.
 */
export function walkStrip(g, x0, z0, x1, z1, { height, dir = "x", block = "smooth_stone", over = false } = {}) {
  const H = typeof height === "function" ? height : () => height;
  const w = placer(g, { over });
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) w.set(x, H(x, z), z, block, {});
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const nx = dir === "x" ? x + 1 : x, nz = dir === "z" ? z + 1 : z;
    if (nx > x1 || nz > z1) continue;
    const h = H(x, z), hn = H(nx, nz);
    if (hn === h + 1) w.set(x, h + 1, z, ...B.slab(block, "bottom"));
    if (h === hn + 1) w.set(nx, hn + 1, nz, ...B.slab(block, "bottom"));
  }
  return w;
}

/**
 * The west tunnel portal face: face columns x0..x0+1 over z0..z1. Plinth polished_andesite y5, smooth_stone y6..9,
 * calcite coping y10 (and calcite lintel y9 over each mouth). The coping is proud at x0-1. Mouths are left open
 * (air) at y5..8. The pier between the mouths carries a wall lantern at (x0-1, 7, pier start) on a stone bracket.
 * mouths: [[z0, z1], ...] (plan: [[80, 84], [87, 91]]).
 */
export function portalFace(g, x0, z0, z1, { mouths = [[80, 84], [87, 91]], over = false } = {}) {
  const w = placer(g, { over });
  const inMouth = (z) => mouths.some(([a, b]) => z >= a && z <= b);
  for (let z = z0; z <= z1; z++) {
    for (const x of [x0, x0 + 1]) {
      if (!inMouth(z)) {
        w.set(x, 5, z, "polished_andesite", {});
        for (let y = 6; y <= 9; y++) w.set(x, y, z, "smooth_stone", {});
      } else w.set(x, 9, z, "calcite", {});
      w.set(x, 10, z, "calcite", {});
    }
    w.set(x0 - 1, 10, z, "calcite", {});
  }
  const pier = [mouths[0][1] + 1, mouths[1][0] - 1];
  if (g.isAir(x0 - 1, 6, pier[0])) w.set(x0 - 1, 6, pier[0], "smooth_stone", {});
  w.set(x0 - 1, 7, pier[0], ...B.lantern(false));
  return w;
}

/**
 * A spruce fence lattice over x0..x1 by z0..z1 (rows run north at z0 to south at z1). Each row's top rises linearly
 * from ySouth at z1 to yNorth at z0, and the lattice fills y yLow..top where (x + y) is even.
 */
export function fenceNet(g, x0, z0, x1, z1, { yLow = 5, yNorth = 11, ySouth = 8, over = false } = {}) {
  const w = placer(g, { over });
  const rows = z1 - z0;
  for (let z = z0; z <= z1; z++) {
    const t = rows ? (z - z0) / rows : 0;
    const top = Math.round(yNorth + (ySouth - yNorth) * t);
    for (let x = x0; x <= x1; x++) for (let y = yLow; y <= top; y++) if ((x + y) % 2 === 0) w.set(x, y, z, ...B.fence("spruce"));
  }
  return w;
}

/**
 * A water runnel: stone bed at y-1 along z, 1-wide water source at y in the channel, stone side walls at y on z-1 and
 * z+1, and a top-half stone slab lip on z-2 and z+2. The water at x1 is always written (it runs out into the sister
 * module), even over ground, so it is never refused.
 */
export function runnel(g, x0, x1, z, { y = 3, over = false } = {}) {
  const w = placer(g, { over });
  for (let x = x0; x <= x1; x++) {
    w.set(x, y - 1, z, "stone", {});
    w.set(x, y, z - 1, "stone", {});
    w.set(x, y, z + 1, "stone", {});
    w.set(x, y, z - 2, ...B.slab("smooth_stone", "top"));
    w.set(x, y, z + 2, ...B.slab("smooth_stone", "top"));
    if (x === x1) {
      g.set(x, y, z, "water", { level: "0" });
      w.placed++;
    } else w.set(x, y, z, "water", { level: "0" });
  }
  return w;
}

/**
 * An overlook deck over x0..x0+7 by z0..z0+6 with its floor at `floor` (plan: 7). Spruce planks floor, stripped spruce
 * posts down to the ground at the corners and the edge midpoints, a spruce fence rail at floor+1 on the north, east and
 * west edges (the south edge is open to the Cliff Walk), two benches on row z0+1 (stairs facing south, so the seat
 * looks north, with open trapdoor arms), and two dark oak lamp posts at the inner south corners. Nothing above the
 * benches, so the lane past them stays clear.
 */
export function overlookDeck(g, x0, z0, { floor = 7, over = false } = {}) {
  const w = placer(g, { over });
  const x1 = x0 + 7, z1 = z0 + 6, xm = Math.floor((x0 + x1) / 2), zm = Math.floor((z0 + z1) / 2);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) w.set(x, floor, z, "spruce_planks", {});
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1], [xm, z0], [xm, z1], [x0, zm], [x1, zm]]) {
    for (let y = floor - 1; y >= 0 && g.isAir(x, y, z); y--) w.set(x, y, z, ...B.log("stripped_spruce", "y"));
  }
  for (const bx of [x0 + 2, x0 + 5]) {
    w.set(bx, floor + 1, z0 + 1, ...B.stairs("spruce", "south", "bottom"));
    w.set(bx + 1, floor + 1, z0 + 1, ...B.stairs("spruce", "south", "bottom"));
    w.set(bx - 1, floor + 1, z0 + 1, ...B.trapdoor("spruce", "north", "bottom", true));
    w.set(bx + 2, floor + 1, z0 + 1, ...B.trapdoor("spruce", "north", "bottom", true));
  }
  for (let x = x0; x <= x1; x++) w.set(x, floor + 1, z0, ...B.fence("spruce"));
  for (let z = z0 + 1; z <= z1; z++) { w.set(x0, floor + 1, z, ...B.fence("spruce")); w.set(x1, floor + 1, z, ...B.fence("spruce")); }
  for (const lx of [x0 + 1, x1 - 1]) {
    for (let y = floor + 1; y <= floor + 3; y++) w.set(lx, y, z1 - 1, ...B.fence("dark_oak"));
    w.set(lx, floor + 4, z1 - 1, ...B.lantern(false));
  }
  return w;
}

/**
 * A promenade over x0..x1 by z0..z1 at surface y: light_gray_concrete paving with a calcite band on the z0 and z1 edges.
 */
export function promenade(g, x0, z0, x1, z1, { y = 8, over = false } = {}) {
  const w = placer(g, { over });
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edge = z === z0 || z === z1;
    w.set(x, y, z, edge ? "calcite" : "light_gray_concrete", {});
  }
  return w;
}

// Deterministic rng (mulberry32) so a cypress is the same every time for the same seed.
const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/**
 * A Monterey cypress rooted at (x, y, z), y being the first air cell above the ground. Trunk dark_oak_log 4-6 high; the
 * top block sometimes leans one east (a horizontal log). The crown is a flat-topped dark_oak_leaves disc 7-11 wide,
 * 2-3 thick, longer to the east, persistent.
 */
export function cypress(g, x, y, z, seed = 1, { over = false } = {}) {
  const w = placer(g, { over });
  const R = rng(seed);
  const h = 4 + Math.floor(R() * 3);
  const lean = R() < 0.6 ? 1 : 0;
  const thick = 2 + Math.floor(R() * 2);
  const span = 7 + Math.floor(R() * 5);
  const west = Math.floor(span * 0.4), east = span - west - 1;
  const bz = Math.max(2, Math.floor(span / 3));
  for (let i = 0; i < h; i++) w.set(x, y + i, z, ...B.log("dark_oak", "y"));
  if (lean) w.set(x + 1, y + h - 1, z, ...B.log("dark_oak", "x"));
  const cx = x + lean, mid = (east - west) / 2, a = span / 2;
  for (let t = 0; t < thick; t++) for (let dx = -west; dx <= east; dx++) for (let dz = -bz; dz <= bz; dz++) {
    const u = (dx - mid) / a;
    if (u * u + (dz / bz) ** 2 <= 1.15) w.set(cx + dx, y + h + t, z + dz, "dark_oak_leaves", { persistent: "true", distance: "1", waterlogged: "false" });
  }
  return w;
}
