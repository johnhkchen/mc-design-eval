// DC82526: the 60 x 59 U-plan office range at 25 Independence Ave SE, Capitol Hill, as a 1.21.1 module. The record gives
// no era, so it is read from the form: a Beaux-Arts-style limestone office block of three storeys and a short attic
// pavilion, around an open courtyard the lidar roofs leave out. Lidar roofs are smoothed (3x3 median over footprint
// cells, 0-5 returns dropped as noise) into two tiers: 12 blocks (three 4-block storeys) and 14 (the attic pavilion).
// Storey lines sit at y 0, 4, 8 (a band under each window head); a cornice and a parapet cap every roof. Each column is
// solid from y 0 up to its ground (foundation), then its storeys, so nothing floats. Shell cells carry calcite walls,
// stone pilasters every third cell, two-block glass windows between them, and a few glowstone-lit panels. Interiors
// are air behind the glass with a floor slab per storey. Three doors sit on the most exposed face under stone hoods.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC82526.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC82526.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const FACES = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposed = (c) => Object.entries(FACES).filter(([, [dx, dz]]) => !inF(c.x + dx, c.z + dz)).map(([n]) => n);
const along = (c, face) => (face === "north" || face === "south" ? c.x : c.z);

// Palette: pale limestone walls, darker stone for the base, bands, pilasters and cornice; glass and warm light in the windows.
const FOUND = "stone_bricks";
const WALL = "smooth_quartz";
const BAND = "stone_bricks";
const PILASTER = "stone_bricks";
const CORNICE = "chiseled_stone_bricks";
const PARAPET = "stone_brick_wall";
const ROOF = "smooth_stone";
const FLOOR = "smooth_stone";
const GLASS = "glass_pane";
const LIT = "glowstone";
const HOOD = "stone_brick_stairs";
const DOOR = "dark_oak_door";
const PLANT = "iron_block";

// Smoothed roof tier per cell: the 3x3 median of the valid lidar returns, snapped to 12 or 14.
const tier = new Map();
for (const c of F.values()) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n && n.r >= 6) v.push(n.r);
  }
  v.sort((a, b) => a - b);
  const m = v.length ? v[v.length >> 1] : 12;
  tier.set(key(c.x, c.z), m >= 13 ? 14 : 12);
}

// Entrances: the face with the most single-exposed ground-level cells; three doors near its quarters, on the 1 mod 3 cells
// (the pilasters are the 0 mod 3 cells, so each door sits between a pilaster and a window).
const runs = {};
for (const c of F.values()) if (c.g === 0 && exposed(c).length === 1) (runs[exposed(c)[0]] ??= []).push(c);
const face = Object.keys(FACES).sort((a, b) => (runs[b]?.length ?? 0) - (runs[a]?.length ?? 0))[0];
const run = runs[face];
const lo = Math.min(...run.map((c) => along(c, face))), hi = Math.max(...run.map((c) => along(c, face)));
const doors = new Map();
for (const f of [0.2, 0.5, 0.8]) {
  const want = lo + (hi - lo) * f;
  const pick = run.filter((c) => along(c, face) % 3 === 1)
    .sort((a, b) => Math.abs(along(a, face) - want) - Math.abs(along(b, face) - want))[0];
  if (pick) doors.set(key(pick.x, pick.z), pick);
}

// Blocks by position; panes and walls get their connection states in a second pass once every neighbour is known.
const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const near = (x, y, z) => B.has(`${x},${y},${z}`);

for (const c of F.values()) {
  const t = tier.get(key(c.x, c.z));
  const ex = exposed(c);
  const shell = ex.length > 0;
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, FOUND);                       // foundation to the cell's ground
  for (let y = c.g; y <= t; y++) {
    if (y === t - 1) { put(c.x, y, c.z, shell ? CORNICE : ROOF); continue; }    // cornice on the shell, roof membrane inside
    if (y === t) { if (shell) put(c.x, y, c.z, PARAPET); continue; }
    if (y > t) continue;
    const k = y % 4, s = Math.floor(y / 4);
    if (k === 0 || k === 3) { if (shell) put(c.x, y, c.z, BAND); else if (k === 0) put(c.x, y, c.z, FLOOR); continue; }
    if (!shell) continue;                                                       // interior air behind the glass
    if (ex.length > 1) { put(c.x, y, c.z, PILASTER); continue; }                // corner quoin
    const f = ex[0], a = along(c, f);
    const d = doors.get(key(c.x, c.z));
    if (d) { put(c.x, y, c.z, DOOR, { facing: f, half: k === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (a % 3 === 0) { put(c.x, y, c.z, PILASTER); continue; }
    if (k === 1 && (a * 5 + s * 3) % 13 === 2) { put(c.x, y, c.z, LIT); continue; }  // a lit room behind the glass
    put(c.x, y, c.z, GLASS);
  }
}

// Stone hoods over the doors: the course at the head of the storey, the door's cell and its two neighbours along the face.
for (const d of doors.values()) {
  const f = exposed(d)[0], [dx, dz] = f === "north" || f === "south" ? [1, 0] : [0, 1];
  for (const s of [-1, 0, 1]) {
    const x = d.x + dx * s, z = d.z + dz * s;
    if (!inF(x, z) || !exposed({ x, z }).includes(f)) continue;
    put(x, 3, z, HOOD, { facing: f, half: "top", shape: "straight", waterlogged: "false" });
  }
}

// Roof plant: pairs of air-handling units on the flat roof of the courtyard-side range (interior cells at the 12 tier).
for (const c of F.values()) {
  if (exposed(c).length || tier.get(key(c.x, c.z)) !== 12) continue;
  if (c.x % 9 !== 4 || c.z % 7 !== 3) continue;
  const n = F.get(key(c.x + 1, c.z));
  if (!n || exposed(n).length || tier.get(key(n.x, n.z)) !== 12) continue;
  put(c.x, 12, c.z, PLANT); put(c.x + 1, 12, c.z, PLANT);
}

// Panes connect to any neighbour across the wall; parapets connect along the wall.
for (const [k, e] of B) {
  const [x, y, z] = k.split(",").map(Number);
  if (e.block === GLASS) {
    const st = { waterlogged: "false" };
    for (const [n, [dx, dz]] of Object.entries(FACES)) st[n] = near(x + dx, y, z + dz) ? "true" : "false";
    e.state = st;
  }
  if (e.block === PARAPET) {
    const st = { up: "true", waterlogged: "false" };
    for (const [n, [dx, dz]] of Object.entries(FACES)) st[n] = near(x + dx, y, z + dz) ? "low" : "none";
    e.state = st;
  }
}

const g = new Voxels([60, 26, 59]);
for (const [k, { block, state }] of B) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
console.log(g.save(OUT));
