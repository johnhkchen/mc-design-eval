// Way 162091744: a four-storey interwar brick commercial block (cream plaster dressings, a shopfront ground floor, a
// cornice and a flat roof), with a three-storey belt under a lower attic where the lidar roof sits lower. Foundation to
// a common floor at y 2; each storey is a string-course slab, a sill row, two rows of glass in bays between brick piers,
// and a top cornice.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162091744.cells.json`, "utf8"));
const X = 29, Y = 30, Z = 48, FLOOR = 2;

const k2 = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;
const foot = new Map(cells.map(([x, z, g, r]) => [k2(x, z), { g, r }]));
const minX = Math.min(...cells.map((c) => c[0])), minZ = Math.min(...cells.map((c) => c[1]));
const NB = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const FACING = { n: "north", s: "south", w: "west", e: "east" };
const PANE = { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" };

// Massing: the lidar roof, averaged over each cell's 3x3 neighbourhood, snaps to three flat tiers:
// the core (4 storeys to 18), the belt (3 storeys and an attic to 16) and the low edge (3 storeys to 14).
const top = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const f = foot.get(k2(x + dx, z + dz)); if (f) { s += f.r; n++; }
  }
  const m = s / n;
  top.set(k2(x, z), m >= 17 ? 18 : m >= 15 ? 16 : 14);
}

// Exposed sides: a neighbour outside the footprint (out) or on a lower tier (lower).
function exposure(x, z) {
  const T = top.get(k2(x, z)), out = [], lower = [];
  for (const d of ["n", "s", "w", "e"]) {
    const [dx, dz] = NB[d]; const nb = top.get(k2(x + dx, z + dz));
    if (nb === undefined) out.push(d); else if (nb < T) lower.push(d);
  }
  const dirs = [...out, ...lower];
  const corner = dirs.some((d) => d === "e" || d === "w") && dirs.some((d) => d === "n" || d === "s");
  return { out, lower, dirs, corner, facade: dirs.length > 0 };
}

const put = new Map();                 // "x,y,z" -> { block, state }
const panes = new Map();               // glass pane cell -> wall axis ("x" runs along x, "z" along z)
const glowAt = [];                     // the open room one step inside a window bay
const set = (x, y, z, block, state) => put.set(k3(x, y, z), { block, state });
const has = (x, y, z) => put.has(k3(x, y, z));
const pane = (x, y, z, axis) => { set(x, y, z, "glass_pane", PANE); panes.set(k3(x, y, z), axis); };
const doorCands = [];

for (const [key] of foot) {
  const [x, z] = key.split(",").map(Number);
  const T = top.get(key), ex = exposure(x, z);
  const d0 = ex.dirs[0];
  const wallAxis = d0 === "n" || d0 === "s" ? "x" : "z";
  const u = wallAxis === "x" ? x - minX : z - minZ;  // position along the wall, for the bay rhythm
  const pier = ex.corner || u % 3 === 0;

  // foundation: solid from y 0 up to the common floor, so nothing floats on the slope
  for (let y = 0; y < FLOOR; y++) set(x, y, z, "stone_bricks");

  let lastF = FLOOR;
  for (let F = FLOOR; F + 4 <= T; F += 4) {
    lastF = F;
    const last = F + 8 > T, ground = F === FLOOR;
    const attic = F + 4 < T && last;           // the storey under an attic: its top row is a window, not a cornice
    // the floor slab: a string course on the facade, the base course on the ground storey
    if (ex.facade) set(x, F, z, ground ? "polished_andesite" : "smooth_quartz");
    else set(x, F, z, "smooth_stone");
    if (!ex.facade) continue;

    if (pier) {   // corners of the stepped outline are piers too: a column of quoins would paint whole walls cream
      for (let y = F + 1; y <= F + 2; y++) set(x, y, z, "bricks");
      set(x, F + 3, z, last && !attic ? "smooth_quartz" : "bricks");
      continue;
    }
    // a window bay
    if (ground) {
      set(x, F + 1, z, "polished_andesite");
      pane(x, F + 2, z, wallAxis);
      set(x, F + 3, z, "dark_oak_planks");
      if (ex.out.length === 1 && !ex.lower.length) doorCands.push({ x, z, d: ex.out[0], u });
    } else {
      if (last) pane(x, F + 1, z, wallAxis); else set(x, F + 1, z, "smooth_quartz");
      pane(x, F + 2, z, wallAxis);
      if (last && !attic) set(x, F + 3, z, "smooth_quartz"); else pane(x, F + 3, z, wallAxis);
    }
    // a warm light, in the open room one step in from this window
    const [dx, dz] = NB[d0];
    glowAt.push({ x: x - dx, z: z - dz, y: F + 2, ground, hash: (x * 7 + z * 13 + F) % 5 });
  }

  // the attic above the last storey, on the belt: a slab, then a plain brick parapet with a cornice on top
  const A = lastF + 4;
  if (A < T) {
    if (ex.facade) {
      set(x, A, z, "smooth_quartz");
      for (let y = A + 1; y <= T - 2; y++) set(x, y, z, "bricks");
      set(x, T - 1, z, "smooth_quartz");
    } else {
      set(x, A, z, "smooth_stone");
      set(x, T - 1, z, "gray_concrete");
    }
  } else if (!ex.facade) {
    set(x, T - 1, z, "gray_concrete");   // roof membrane: the top row of an open room
  }
}

// the panes join their neighbours along the wall (other panes, piers, quoins)
for (const [k, axis] of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const s = put.get(k); if (!s) continue;
  const conn = axis === "x"
    ? { east: has(x + 1, y, z), west: has(x - 1, y, z) }
    : { north: has(x, y, z - 1), south: has(x, y, z + 1) };
  s.state = { ...s.state, ...Object.fromEntries(Object.entries(conn).map(([a, b]) => [a, b ? "true" : "false"])) };
}

// one entrance on the widest exposed street front, on a window bay
const byDir = {};
for (const c of doorCands) (byDir[c.d] ??= []).push(c);
const frontDir = Object.entries(byDir).sort((a, b) => b[1].length - a[1].length)[0];
if (frontDir) {
  const row = frontDir[1].filter((c) => c.u % 3 !== 0).sort((a, b) => a.u - b.u);
  const door = row[Math.floor(row.length / 2)];
  if (door) {
    const state = (half) => ({ facing: FACING[door.d], half, hinge: "left", open: "false", powered: "false" });
    set(door.x, FLOOR + 1, door.z, "dark_oak_door", state("lower"));
    set(door.x, FLOOR + 2, door.z, "dark_oak_door", state("upper"));
  }
}

// warm light: glowstone behind about one upper window in four, shroomlight behind about one shopfront in three
for (const { x, z, y, ground, hash } of glowAt) {
  if (!foot.has(k2(x, z)) || exposure(x, z).facade) continue;
  if (ground ? hash % 3 !== 0 : hash % 4 !== 0) continue;
  set(x, y, z, ground ? "shroomlight" : "glowstone");
}

// roof plant: a 3x3 stone box on the core tier, near its middle, with a slab cap
const core = cells.filter(([x, z]) => top.get(k2(x, z)) === 18 && !exposure(x, z).facade);
if (core.length) {
  const cx = Math.round(core.reduce((s, c) => s + c[0], 0) / core.length);
  const cz = Math.round(core.reduce((s, c) => s + c[1], 0) / core.length);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const x = cx + dx, z = cz + dz;
    if (!foot.has(k2(x, z)) || top.get(k2(x, z)) !== 18 || exposure(x, z).facade) continue;
    set(x, 18, z, "stone_bricks");
    set(x, 19, z, "stone_bricks");
    set(x, 20, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

const g = new Voxels([X, Y, Z]);
for (const [k, { block, state }] of put) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = `${DIR}/way_162091744.nbt`;
const info = g.save(out);
const tiers = {};
for (const t of top.values()) tiers[t] = (tiers[t] ?? 0) + 1;
console.log(JSON.stringify({ file: out, tiers, ...info }));
