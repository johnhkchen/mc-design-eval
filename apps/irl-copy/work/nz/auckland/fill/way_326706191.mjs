// Luna Apartments (way 326706191): a 1990s-2000s six-storey apartment block in painted render, with a glazed
// window grid, a stone plinth on the downhill side, a recessed entrance, and roof plant. Solid massing from the
// ground to the lidar roof (y 27), no interiors: each window has one air block behind the pane.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326706191.cells.json", "utf8"));

const X = 142, Y = 40, Z = 48;
const g = new Voxels([X, Y, Z]);

// Footprint: key -> { ground, roof }
const key = (x, z) => (x + 1) * 256 + (z + 1);
const unkey = (k) => [Math.floor(k / 256) - 1, (k % 256) - 1];
const F = new Map();
for (const [x, z, ground, roof] of cells) F.set(key(x, z), { gr: ground, ro: roof });
const inF = (x, z) => F.has(key(x, z));

// order matters: first exposed side wins (N, S, E, W)
const DIRS = [
  { n: "N", dx: 0, dz: -1, facing: "north" },
  { n: "S", dx: 0, dz: 1, facing: "south" },
  { n: "E", dx: 1, dz: 0, facing: "east" },
  { n: "W", dx: -1, dz: 0, facing: "west" },
];

// distance in cells from the outside edge (1 = facade cell)
const dist = new Map();
const q = [];
for (const k of F.keys()) {
  const [x, z] = unkey(k);
  if (DIRS.some((d) => !inF(x + d.dx, z + d.dz))) { dist.set(k, 1); q.push(k); }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = unkey(q[i]);
  for (const d of DIRS) {
    const nk = key(x + d.dx, z + d.dz);
    if (F.has(nk) && !dist.has(nk)) { dist.set(nk, dist.get(q[i]) + 1); q.push(nk); }
  }
}

// the facade side of a cell: the first exposed side, or null inside the footprint
const facadeOf = (x, z) => DIRS.find((d) => !inF(x + d.dx, z + d.dz)) ?? null;

// Tiers: the lidar roof reads 27 across the block (its 20+ cells smoothed to one flat tier); the few low cells are
// two-storey wings at least 8 above their ground.
const topOf = (x, z) => {
  const { gr, ro } = F.get(key(x, z));
  return ro >= 20 ? 27 : Math.max(ro, gr + 8);
};

// Facade grid, absolute: a 4-block storey = a floor band (y%4==0), two glazed rows (1, 2), a spandrel (3).
const BASE = "polished_andesite", BAND = "smooth_quartz", SPANDREL = "light_gray_concrete";
const WALL = "white_concrete", PLINTH = "stone_bricks", GLASS = "light_blue_stained_glass_pane";
const ROOF = "gray_concrete", CORNICE = "smooth_quartz", PARAPET = "stone_brick_wall";

// Pass A: solid massing, plinth, facade skin, cornice, parapet
const glass = [];      // { x, y, z, dir } for every window pane
const parapet = [];    // { x, z } for parapet cells
for (const k of F.keys()) {
  const [x, z] = unkey(k);
  const { gr } = F.get(k);
  const T = topOf(x, z);
  const face = facadeOf(x, z);
  const alongAxisX = face && (face.n === "N" || face.n === "S");
  for (let y = 0; y <= T; y++) {
    if (y < gr) { g.set(x, y, z, PLINTH); continue; }
    if (y === T) { g.set(x, y, z, face ? CORNICE : ROOF); continue; }
    if (!face) { g.set(x, y, z, WALL); continue; }
    if (y === gr) { g.set(x, y, z, BASE); continue; }
    if (y % 4 === 0) { g.set(x, y, z, BAND); continue; }
    if (y % 4 === 3) { g.set(x, y, z, SPANDREL); continue; }
    const along = alongAxisX ? x : z;
    if (along % 4 === 1 || along % 4 === 2) { g.set(x, y, z, WALL); glass.push({ x, y, z, face }); }
    else g.set(x, y, z, WALL);   // a pier between the bays
  }
  if (face && T >= 27) { g.set(x, 28, z, PARAPET); parapet.push({ x, z }); }
}

// Pass B: glass over an air gap (or a warm light behind the pane in some windows)
for (const w of glass) {
  const ix = w.x - w.face.dx, iz = w.z - w.face.dz;
  g.set(w.x, w.y, w.z, GLASS);
  if (!inF(ix, iz) || dist.get(key(ix, iz)) < 2) continue;
  const h = (w.x * 7 + w.y * 5 + w.z * 11) % 23;
  if (h === 0) g.set(ix, w.y, iz, "shroomlight");
  else if (h % 3 === 0) g.set(ix, w.y, iz, "glowstone");
  else g.set(ix, w.y, iz, "air");
}

// Pass C: two recessed entrances on the longest facade runs: 3 wide, 2 high, a dark canopy at the next course,
// a door one cell in, and a hanging lantern
const runs = [];
for (const d of DIRS) {
  const byFixed = new Map();
  for (const k of F.keys()) {
    const [x, z] = unkey(k);
    const f = facadeOf(x, z);
    if (!f || f.n !== d.n) continue;
    const fixed = d.n === "N" || d.n === "S" ? z : x;
    const along = d.n === "N" || d.n === "S" ? x : z;
    if (!byFixed.has(fixed)) byFixed.set(fixed, new Map());
    byFixed.get(fixed).set(along, true);
  }
  for (const [fixed, m] of byFixed) runs.push({ d, fixed, m, len: m.size });
}
runs.sort((a, b) => b.len - a.len);
const entrances = [];
for (const run of runs) {
  if (entrances.length >= 2) break;
  const alongs = [...run.m.keys()].sort((a, b) => a - b);
  const ax = run.d.n === "N" || run.d.n === "S";
  const at = (al) => (ax ? [al, run.fixed] : [run.fixed, al]);
  let pick = null;
  for (let i = 1; i < alongs.length - 1 && !pick; i++) {
    const a = alongs[i];
    if (!run.m.has(a - 1) || !run.m.has(a + 1)) continue;
    const [cx, cz] = at(a);
    if (!inF(cx - run.d.dx, cz - run.d.dz)) continue;
    pick = a;
  }
  if (pick === null) continue;
  const [cx, cz] = at(pick);
  const gr = F.get(key(cx, cz)).gr;
  entrances.push({ run, a: pick, cx, cz, gr });
  for (const al of [pick - 1, pick, pick + 1]) {
    const [x, z] = at(al);
    g.set(x, gr + 1, z, "air"); g.set(x, gr + 2, z, "air");
  }
  for (let al = pick - 2; al <= pick + 2; al++) {
    if (!run.m.has(al)) continue;
    const [x, z] = at(al);
    g.set(x, gr + 3, z, "dark_oak_planks");
  }
  const ix = cx - run.d.dx, iz = cz - run.d.dz;
  const door = { facing: run.d.facing, hinge: "left", open: "false", powered: "false" };
  g.set(ix, gr + 1, iz, "dark_oak_door", { ...door, half: "lower" });
  g.set(ix, gr + 2, iz, "dark_oak_door", { ...door, half: "upper" });
  g.set(cx, gr + 2, cz, "lantern", { hanging: "true", waterlogged: "false" });
}

// Pass D: roof plant (iron units on the flat roof, away from the edge)
let units = 0;
for (let x = 6; x < X - 8 && units < 4; x += 14) {
  for (let z = 6; z < Z - 7 && units < 4; z += 12) {
    const cellsOk = [];
    for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 2; dz++) cellsOk.push([x + dx, z + dz]);
    if (!cellsOk.every(([cx, cz]) => inF(cx, cz) && dist.get(key(cx, cz)) >= 4 && topOf(cx, cz) === 27)) continue;
    for (const [cx, cz] of cellsOk) for (const y of [28, 29]) g.set(cx, y, cz, "iron_block");
    units++;
  }
}

// Pass E: pane and parapet connections from the built neighbours
const PANE_ID = "minecraft:" + GLASS;
for (const w of glass) {
  if (g.get(w.x, w.y, w.z)?.block !== PANE_ID) continue;   // an entrance replaced it
  const alongX = w.face.n === "N" || w.face.n === "S";
  const solid = (x, z) => !!g.get(x, w.y, z);
  const st = {
    north: alongX ? "false" : (solid(w.x, w.z - 1) ? "true" : "false"),
    south: alongX ? "false" : (solid(w.x, w.z + 1) ? "true" : "false"),
    east: alongX ? (solid(w.x + 1, w.z) ? "true" : "false") : "false",
    west: alongX ? (solid(w.x - 1, w.z) ? "true" : "false") : "false",
  };
  g.set(w.x, w.y, w.z, GLASS, st);
}
for (const p of parapet) {
  const at28 = (x, z) => !!g.get(x, 28, z)?.block?.includes("stone_brick_wall");
  const st = (c) => (c ? "low" : "none");
  g.set(p.x, 28, p.z, PARAPET, {
    north: st(at28(p.x, p.z - 1)), south: st(at28(p.x, p.z + 1)),
    east: st(at28(p.x + 1, p.z)), west: st(at28(p.x - 1, p.z)), up: "true", waterlogged: "false",
  });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326706191.nbt";
const r = g.save(out);
console.log(`Luna Apartments: ${cells.length} footprint cells, ${glass.length} window cells, ${entrances.length} entrances, ${units} roof units; ${r.blocks} blocks, palette ${r.palette}`);
