// Shared vocabulary: palette by role, one window, one turret cap, one cornice, one battlement.
export * from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { arch, roof, cylinder, parapet, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export const P = {
  wall: "calcite", wallStairs: "calcite", trim: "smooth_sandstone", quoin: "stone_bricks",
  brick: "bricks", slate: "dark-slate", rockBase: "stone", base: "stone_bricks", floor: "stone_bricks",
};
export const LOG = [];
export const note = (s) => { LOG.push(s); console.log(s); };

/** Deterministic hash noise 0..1. */
export const hash = (x, z, s = 0) => { let h = (x * 374761393 + z * 668265263 + s * 144665) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

/**
 * One window (the whole castle's vocabulary): a 3-wide glazed opening in a 1-thick wall with a pointed head
 * (chamfer stairs, then a one-cell spire), dark jambs, and a quartz sill standing proud. face: north|south|east|west,
 * plane = wall coordinate, pos = min coordinate along the wall, y = sill row, h = rows.
 */
export function archWindow(g, face, plane, pos, y, { w = 3, h = 6, block = P.wall, frame = "stone_bricks", pane = "gray_stained_glass_pane", sill = "smooth_sandstone" } = {}) {
  const ns = face === "north" || face === "south";
  const out = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] }[face];
  const cell = (i) => (ns ? [pos + i, plane] : [plane, pos + i]);
  const lo = ns ? "west" : "north", hi = ns ? "east" : "south";
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
    const [x, z] = cell(i), yy = y + j;
    if (!g.inBounds(x, yy, z)) continue;
    const top = j === h - 1, shoulder = j === h - 2;
    const edge = i === 0 || i === w - 1;
    if (top && edge) { g.set(x, yy, z, block); continue; }
    if (shoulder && edge) { g.set(x, yy, z, ...B.stairs("calcite", i === 0 ? lo : hi, "top")); continue; }
    if (top && w > 3 && (i === 1 || i === w - 2)) { g.set(x, yy, z, block); continue; }
    g.set(x, yy, z, "minecraft:air");
    g.set(x, yy, z, pane, {});
  }
  // jambs and sill proud of the wall
  for (let j = -1; j <= h - 2; j++) for (const i of [-1, w]) {
    const [x, z] = cell(i), yy = y + j;
    if (g.inBounds(x, yy, z) && !g.isAir(x, yy, z) && j >= 0 && frame) g.set(x, yy, z, frame);
  }
  for (let i = -1; i <= w; i++) {
    const [x, z] = cell(i), sx = x + out[0], sz = z + out[1];
    if (g.inBounds(sx, y - 1, sz) && g.isAir(sx, y - 1, sz)) g.set(sx, y - 1, sz, ...B.slab(sill, "top"));
  }
}
/** A narrow arrow slit (1 x h) in a wall. */
export function slit(g, x, y, z, h = 3, pane = "glass_pane") { for (let j = 0; j < h; j++) g.set(x, y + j, z, pane, {}); }

/** One turret cap: dark-slate cone with finial. rect = [x0,z0,x1,z1] of the shaft, y = shaft top + 1. */
export function turretCap(g, rect, y, o = {}) {
  const r = roof(g, [rect], "tower-cap", { y, material: P.slate, ...o });
  if (r.warnings?.length) for (const w of r.warnings) note(`WARN turretCap ${rect}: ${w.code} ${w.message ?? ""}`);
  return r;
}
/** Round tower: hollow calcite cylinder with a deck on top. centre [cx,cz], base y, height. */
export function roundTower(g, cx, cz, radius, y0, height, o = {}) {
  cylinder(g, { base: [cx, y0, cz], radius, height, hollow: true, block: o.block ?? P.wall, bands: o.bands });
  // deck so the cap has something to sit on
  for (let x = cx - radius; x <= cx + radius; x++) for (let z = cz - radius; z <= cz + radius; z++)
    if ((x - cx) ** 2 + (z - cz) ** 2 <= (radius + 0.5) ** 2) g.set(x, y0 + height - 1, z, o.block ?? P.wall);
}
export const rectOf = (cx, cz, r) => [cx - r, cz - r, cx + r, cz + r];

/** Cornice: upside-down quartz stair lip around a rect at y (outside the wall). */
export function corniceRing(g, [x0, z0, x1, z1], y, mat = "smooth_sandstone") {
  for (let x = x0 - 1; x <= x1 + 1; x++) for (const [z, f] of [[z0 - 1, "south"], [z1 + 1, "north"]]) g.set(x, y, z, ...B.stairs(mat, f, "top"));
  for (let z = z0; z <= z1; z++) for (const [x, f] of [[x0 - 1, "east"], [x1 + 1, "west"]]) g.set(x, y, z, ...B.stairs(mat, f, "top"));
}
/** Battlement: crenellated parapet ring, y = first course above the deck. */
export function battlement(g, from, to, y, block = P.wall, sides) {
  return parapet(g, { from: [from[0], y, from[1]], to, block, style: "crenellated", ...(sides ? { sides } : {}) });
}

/** Arrow slits spiralling up a round tower (cx,cz,r), from y0 every `step`. */
export function spiralSlits(g, cx, cz, r, y0, y1, step = 4, turn = 70) {
  let k = 0;
  for (let y = y0; y <= y1; y += step, k++) {
    const a = (k * turn * Math.PI) / 180;
    for (const rr of [r, r + 0.5, r - 0.5]) {
      const x = Math.round(cx + rr * Math.cos(a)), z = Math.round(cz + rr * Math.sin(a));
      if (g.inBounds(x, y, z) && !g.isAir(x, y, z) && g.blockAt(x, y, z).includes("calcite")) { slit(g, x, y, z, 2); break; }
    }
  }
}

/** Panes and iron bars need connection states or they render as lone posts: connect to solid and pane neighbours. */
export function fixPanes(g) {
  const SOLID = /(stairs|slab|lantern|banner|torch|chain|leaves|trapdoor|campfire|lightning_rod|sign|door)/;
  const D = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
  let n = 0;
  for (const c of [...g.cells.values()]) {
    if (!/(glass_pane|iron_bars)$/.test(c.block)) continue;
    const [x, y, z] = c.pos, st = {};
    for (const [d, [dx, dz]] of Object.entries(D)) {
      const nb = g.blockAt(x + dx, y, z + dz);
      st[d] = String(!g.isAir(x + dx, y, z + dz) && !SOLID.test(nb));
    }
    st.waterlogged = "false";
    g.set(x, y, z, c.block, st); n++;
  }
  return n;
}

/** Remove rock specks that touch the build on one face or none (boulder fringes, noisy heightfield tops). */
export function despeckle(g, passes = 3) {
  const ROCK = /^minecraft:(stone|andesite|tuff|cobblestone|mossy_cobblestone|gravel|moss_block|stone_bricks|cracked_stone_bricks|mossy_stone_bricks)$/;
  const N = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  let removed = 0;
  for (let p = 0; p < passes; p++) {
    for (const c of [...g.cells.values()]) {
      if (!ROCK.test(c.block)) continue;
      const [x, y, z] = c.pos;
      if (y === 0) continue;
      let n = 0;
      for (const [dx, dy, dz] of N) { if (g.inBounds(x + dx, y + dy, z + dz) && !g.isAir(x + dx, y + dy, z + dz)) n++; }
      if (n <= 1) { g.unset(x, y, z); removed++; }
    }
  }
  return removed;
}

/** A finial on top of whatever is the highest block in column (x,z): sandstone wall post and a lightning rod. */
export function finialAt(g, x, z, posts = 1) {
  let y = g.size[1] - 2;
  while (y > 0 && g.isAir(x, y, z)) y--;
  for (let i = 1; i <= posts; i++) g.set(x, y + i, z, ...B.wall("stone_brick"));
  g.set(x, y + posts + 1, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}
