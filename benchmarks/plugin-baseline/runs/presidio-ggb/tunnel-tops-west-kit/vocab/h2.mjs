// Helper set 2 (plan.md VOCABULARY): ground column, curved path, retaining wall, balance log, picnic table, seat wall,
// shrub mound, lamp post. Each takes its position as arguments and returns { box, placed, refused }: the footprint it
// may write and what it did. Writes go only into air unless `over` names what the helper may replace (the ground's
// own part passes over: true). A refused cell is counted and listed, never thrown, so no helper knocks out an
// earlier part's ground, sand or floor. Block ids are literals from plan.md PALETTE.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// the ground's own surface blocks: all a curved path may replace (its surface row only)
const GROUND = ["grass_block", "dirt", "coarse_dirt", "podzol", "rooted_dirt", "moss_block", "gravel", "sand", "clay", "stone"];

const id = (b) => (b.includes(":") ? b : `minecraft:${b}`);
const mk = (g, over, box) => ({ g, over, out: { box, placed: 0, refused: [] } });
const done = ({ out }) => out;

// one cell: air only, or a block `over` names
function put(ctx, x, y, z, block, state = {}, nbt) {
  const { g, over, out } = ctx;
  const cur = g.blockAt(x, y, z);
  const may = over === true || (Array.isArray(over) && over.map(id).includes(cur));
  if (!g.inBounds(x, y, z) || !(g.isAir(x, y, z) || may)) { out.refused.push([x, y, z, id(block)]); return; }
  g.set(x, y, z, block, state, nbt);
  out.placed++;
}

// the cells a polyline passes through, each segment stepped one cell at a time
function trail(points) {
  if (points.length < 2) throw new Error("curvePath needs at least 2 points");
  const seen = new Map();
  for (let i = 0; i + 1 < points.length; i++) {
    const [x0, z0] = points[i], [x1, z1] = points[i + 1];
    const n = Math.max(Math.abs(x1 - x0), Math.abs(z1 - z0), 1);
    for (let s = 0; s <= n; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / n), z = Math.round(z0 + ((z1 - z0) * s) / n);
      seen.set(`${x},${z}`, [x, z]);
    }
  }
  return [...seen.values()];
}

// direction name of a horizontal unit vector (x east, z south)
const dirOf = (dx, dz) => (dx > 0 ? "east" : dx < 0 ? "west" : dz > 0 ? "south" : "north");

/** Ground column at (x, z): stone at y 1 (clay under water), dirt y 2..H-1, `surface` at H. */
export function groundColumn(g, x, z, surface, H, { over = false } = {}) {
  if (H < 2) throw new Error(`groundColumn ${x},${z}: H ${H} is below y 2`);
  const ctx = mk(g, over, [x, 1, z, x, H, z]);
  const wet = id(surface) === "minecraft:water";
  put(ctx, x, 1, z, wet ? "clay" : "stone");
  for (let y = 2; y < H; y++) put(ctx, x, y, z, "dirt");
  put(ctx, x, H, z, surface);
  return done(ctx);
}

/** A pale path swept along a polyline, `width` wide, its surface block at row y (the ground's top; nothing below). */
export function curvePath(g, points, { width = 2, y, block = "smooth_sandstone", over = GROUND } = {}) {
  const lo = -Math.floor((width - 1) / 2);
  const cells = trail(points);
  const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
  const ctx = mk(g, over, [Math.min(...xs) + lo, y, Math.min(...zs) + lo, Math.max(...xs) + lo + width - 1, y, Math.max(...zs) + lo + width - 1]);
  // brush squares overlap at every step: write each surface cell once
  const target = new Map();
  for (const [cx, cz] of cells)
    for (let dz = 0; dz < width; dz++) for (let dx = 0; dx < width; dx++) target.set(`${cx + lo + dx},${cz + lo + dz}`, [cx + lo + dx, cz + lo + dz]);
  for (const [x, z] of target.values()) put(ctx, x, y, z, block);
  return done(ctx);
}

/** Retaining wall over x0..x1, z0..z1: smooth_stone from y0 to hTop-1, calcite course at hTop, smooth_stone_slab cap above. */
export function retainWall(g, x0, x1, z0, z1, hTop, { y0 = 5, over = false } = {}) {
  const ctx = mk(g, over, [x0, y0, z0, x1, hTop + 1, z1]);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    for (let y = y0; y < hTop; y++) put(ctx, x, y, z, "smooth_stone");
    put(ctx, x, hTop, z, "calcite");
    put(ctx, x, hTop + 1, z, ...B.slab("smooth_stone", "bottom"));
  }
  return done(ctx);
}

/** One stripped oak beam of `len` along axis x or z, from (x, y, z). Stack five crosswise for the balance logs. */
export function balanceLog(g, x, z, len, axis, { y = 4, over = false } = {}) {
  if (axis !== "x" && axis !== "z") throw new Error(`balanceLog axis must be x or z, got ${axis}`);
  const [dx, dz] = axis === "x" ? [1, 0] : [0, 1];
  const ctx = mk(g, over, [x, y, z, x + dx * (len - 1), y, z + dz * (len - 1)]);
  for (let i = 0; i < len; i++) put(ctx, x + dx * i, y, z + dz * i, "stripped_oak_log", { axis });
  return done(ctx);
}

/** Picnic table centred on (x, y, z), y the first air level above the ground. Top runs along `axis`, seats on both sides.
 *  Footprint 3x3 x 2 high; nothing is written above y+1 outside it, so a 2-high lane stays clear past it. */
export function picnicTable(g, x, y, z, { axis = "x", over = false } = {}) {
  const ctx = mk(g, over, [x - 1, y, z - 1, x + 1, y + 1, z + 1]);
  const U = axis === "x" ? [1, 0] : [0, 1], V = axis === "x" ? [0, 1] : [1, 0];   // U along the table, V across it
  const at = (k, j) => [x + k * U[0] + j * V[0], z + k * U[1] + j * V[1]];
  const [px, pz] = at(0, 0);
  put(ctx, px, y, pz, ...B.fence("spruce"));
  for (let k = -1; k <= 1; k++) { const [tx, tz] = at(k, 0); put(ctx, tx, y + 1, tz, ...B.slab("spruce", "top")); }
  for (const j of [-1, 1]) {
    const [sx, sz] = at(0, j);
    put(ctx, sx, y, sz, ...B.stairs("spruce", dirOf(j * V[0], j * V[1])));   // back to the outside, seat faces the table
  }
  return done(ctx);
}

/** Seat wall along x0..x1 at row z: calcite riser at y, spruce_slab seat on it at y+1. `aisles` ([a, b] x ranges) get a
 *  smooth_sandstone_slab half-step at y instead. */
export function seatWall(g, x0, x1, y, z, { aisles = [], over = false } = {}) {
  const ctx = mk(g, over, [x0, y, z, x1, y + 1, z]);
  for (let x = x0; x <= x1; x++) {
    if (aisles.some(([a, b]) => x >= a && x <= b)) { put(ctx, x, y, z, ...B.slab("smooth_sandstone", "bottom")); continue; }
    put(ctx, x, y, z, "calcite");
    put(ctx, x, y + 1, z, ...B.slab("spruce", "bottom"));
  }
  return done(ctx);
}

/** Domed shrub heap w x d, h layers high, its first layer at y, centred on (cx, cz). Persistent leaves, flowering on a
 *  deterministic 1-in-4 (seed shifts it). The ground under it is not touched. */
export function shrubMound(g, cx, cz, w, d, h, y, { seed = 0, over = false } = {}) {
  const rx = w / 2, rz = d / 2, Rx = Math.floor(w / 2), Rz = Math.floor(d / 2);
  const ctx = mk(g, over, [cx - Rx, y, cz - Rz, cx + Rx, y + h - 1, cz + Rz]);
  for (let k = 0; k < h; k++) {
    const s = 1 - k / h;   // each layer narrower than the one below: a dome
    for (let dx = -Rx; dx <= Rx; dx++) for (let dz = -Rz; dz <= Rz; dz++) {
      if ((dx / (rx * s + 0.5)) ** 2 + (dz / (rz * s + 0.5)) ** 2 > 1) continue;
      const x = cx + dx, z = cz + dz;
      const flowering = (Math.abs(x) * 7 + Math.abs(z) * 13 + seed + k) % 4 === 0;
      put(ctx, x, y + k, z, flowering ? "flowering_azalea_leaves" : "azalea_leaves", { persistent: "true" });
    }
  }
  return done(ctx);
}

/** Lamp post on (x, y, z): dark_oak_fence y..y+2, lantern standing on it at y+3. y is the first air level above the ground. */
export function lampPost(g, x, y, z, { over = false } = {}) {
  const ctx = mk(g, over, [x, y, z, x, y + 3, z]);
  for (let k = 0; k < 3; k++) put(ctx, x, y + k, z, ...B.fence("dark_oak"));
  put(ctx, x, y + 3, z, ...B.lantern(false));
  return done(ctx);
}
