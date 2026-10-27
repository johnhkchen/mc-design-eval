// Alfred Nathan House: read from the record (59 x 34 blocks, roof ~26 blocks above the lowest ground, 1.2 blocks per metre).
// A stripped-classical inter-war office block: reinforced concrete framed, cream render on piers and string courses,
// a basalt plinth on the Auckland volcanic bluestone, a 4-block storey grid, five storeys on the main body, a sixth
// setback on the central core, and a glazed plant lantern on top. Windows are glass with cream piers and spandrels;
// some have a glowstone just inside, so the facade reads at dusk.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_23893966.cells.json`, "utf8"));

const FOUND = "cobbled_deepslate", PLINTH = "polished_basalt", RENDER = "smooth_quartz";
const SHOP = "glass_pane", GLASS = "light_blue_stained_glass_pane", FLOOR = "smooth_stone";
const ROOF = "gray_concrete", AC = "light_gray_concrete", LIGHT = "glowstone", LANTERN = "light_blue_stained_glass";
const DOOR = "dark_oak_door";
const SIDES = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const k = (x, z) => `${x},${z}`;

// Cell records keyed by x,z; lidar roof is smoothed over the 3x3 neighbourhood (rim speckle reads 0, 1, 4, 7).
const cell = new Map();
for (const [x, z, gr, r] of cells) cell.set(k(x, z), { x, z, gr, r });
for (const c of cell.values()) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cell.get(k(c.x + dx, c.z + dz)); if (n) v.push(n.r); }
  v.sort((a, b) => a - b); c.rs = v[v.length >> 1];
  c.T = c.rs <= 17 ? 16 : c.rs <= 21 ? 20 : 24;     // flat tiers: 4 storeys (wing), 5 (main), 6 (central setback)
}
// tiers as clean blocks, not cell-by-cell steps: a majority vote over each cell's 3x3 neighbourhood, twice
for (let pass = 0; pass < 2; pass++) {
  for (const c of cell.values()) {
    const n = {};
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const m = cell.get(k(c.x + dx, c.z + dz)); if (m) n[m.T] = (n[m.T] ?? 0) + 1; }
    const top = Object.entries(n).sort((a, b) => b[1] - a[1] || b[0] - a[0])[0];
    c.T2 = top && top[1] > n[c.T] ? +top[0] : c.T;
  }
  for (const c of cell.values()) c.T = c.T2;
}

// the sides of cell c (at height y) that face outside the building: no footprint cell there, or one roofed below y
const exposed = (x, z, y) => SIDES.filter(([dx, dz]) => { const n = cell.get(k(x + dx, z + dz)); return !n || n.T <= y; });

const g = new Voxels([59, 38, 34]);
const windows = [], doors = new Map();

// the entrance: the longest straight run of ground-level exterior wall on any one side, its middle cell
let ent = null;
for (const [dx, dz, name] of SIDES) {
  const fixed = (c) => (dx !== 0 ? c.x : c.z), along = (c) => (dx !== 0 ? c.z : c.x);
  const lines = new Map();
  for (const c of cell.values()) {
    const e = exposed(c.x, c.z, c.gr + 1);
    if (e.length === 1 && e[0][0] === dx && e[0][1] === dz) (lines.get(fixed(c)) ?? lines.set(fixed(c), []).get(fixed(c))).push(c);
  }
  for (const run0 of lines.values()) {
    run0.sort((a, b) => along(a) - along(b));
    let run = [];
    const flush = () => { if (run.length && (!ent || run.length > ent.len)) ent = { c: run[run.length >> 1], len: run.length, dx, dz, name }; run = []; };
    for (const c of run0) { if (run.length && along(c) !== along(run[run.length - 1]) + 1) flush(); run.push(c); }
    flush();
  }
}

for (const c of cell.values()) {
  for (let y = 0; y < c.T; y++) {
    if (y < c.gr) { g.set(c.x, y, c.z, FOUND); continue; }
    const ex = exposed(c.x, c.z, y);
    if (y === c.T - 1) { g.set(c.x, y, c.z, ex.length ? RENDER : ROOF); continue; }     // coping on the edge, roof deck inside
    if (!ex.length) { if (y === c.gr || y % 4 === 0) g.set(c.x, y, c.z, FLOOR); continue; }   // interior: air, with a slab per storey
    // exterior wall: basalt plinth, cream string courses and spandrels, cream piers every third bay, glazing between
    const [dx, dz] = ex[0], u = dx !== 0 ? c.z : c.x;
    const pier = ex.length > 1 || u % 3 === 0;
    if (y === c.gr) g.set(c.x, y, c.z, PLINTH);
    else if (y % 4 === 0 || y % 4 === 3 || pier) g.set(c.x, y, c.z, RENDER);
    else {
      const st = dx !== 0 ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
                          : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
      g.set(c.x, y, c.z, y < 4 ? SHOP : GLASS, st);
      windows.push({ x: c.x, y, z: c.z, dx, dz });
    }
  }
}

// the entrance: a dark oak door in the middle of the chosen run, a cream lintel over it
if (ent) {
  const { c, name } = ent, facing = name, y0 = c.gr;
  g.set(c.x, y0, c.z, DOOR, { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(c.x, y0 + 1, c.z, DOOR, { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(c.x, y0 + 2, c.z, RENDER);
  doors.set(k(c.x, c.z), facing);
}

// warm light behind about one window in four: a glowstone on the inside, resting on the floor slab below it
for (const w of windows) {
  const ix = w.x - w.dx, iz = w.z - w.dz, inner = cell.get(k(ix, iz));
  if (!inner || inner.T <= w.y || exposed(ix, iz, w.y).length) continue;
  if (!(w.y - 1 === inner.gr || (w.y - 1) % 4 === 0)) continue;
  if ((w.x * 7 + w.y * 13 + w.z * 31) % 4 === 0) g.set(ix, w.y, iz, LIGHT);
}

// roof plant: a 3 x 3 glazed lantern on the central setback, where the lidar peaks at 25
let plant = null, best = -1;
for (const c of cell.values()) {
  let ok = true, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const m = cell.get(k(c.x + dx, c.z + dz));
    if (!m || m.T !== 24) ok = false; else if (m.r >= 25) n++;
  }
  if (ok && n > best) { best = n; plant = c; }
}
if (plant) {
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const x = plant.x + dx, z = plant.z + dz;
    g.set(x, 24, z, dx || dz ? RENDER : LANTERN);
    g.set(x, 25, z, dx || dz ? RENDER : LANTERN);
  }
}

// roof plant units: 2 x 1 x 2 boxes on the flat roofs, away from the parapet
const used = new Set();
const place = (tier, count) => {
  for (const c of [...cell.values()].sort((a, b) => a.x - b.x || a.z - b.z)) {
    if (count <= 0) break;
    const patch = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => cell.get(k(c.x + dx, c.z + dz)));
    if (patch.some((m) => !m || m.T !== tier || exposed(m.x, m.z, tier - 1).length || used.has(k(m.x, m.z)))) continue;
    if (plant && patch.some((m) => Math.abs(m.x - plant.x) <= 1 && Math.abs(m.z - plant.z) <= 1)) continue;
    for (const m of patch) { used.add(k(m.x, m.z)); g.set(m.x, tier, m.z, AC); }
    count--;
  }
};
place(24, 2); place(20, 3); place(16, 1);

const stat = g.save(`${DIR}/way_23893966.nbt`);
console.log(JSON.stringify({ footprint: cells.length, windows: windows.length, entrance: ent && [ent.c.x, ent.c.z, ent.name], plant: plant && [plant.x, plant.z], ...stat }));
