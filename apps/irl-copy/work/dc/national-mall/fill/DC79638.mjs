// DC79638: a 1930s federal office bar (Stripped Classical, limestone on a granite plinth), two wings split by a
// 5-cell passage. Storeys are 3 blocks (floor line + two window rows); the lidar roof is smoothed into three flat tiers
// (7, 10 and 13 blocks, parapets to 8, 11 and 14), so the centre reads as a tower-block over stepped wings.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC79638.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inFoot = (x, z) => foot.has(key(x, z));

// Roof: median of a 5x5 neighbourhood (lidar noise), then three tiers. n = storeys above the 3-block plinth.
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const tier = new Map();
for (const [x, z] of cells) {
  const near = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const c = foot.get(key(x + dx, z + dz)); if (c) near.push(c.r); }
  const rs = median(near);
  tier.set(key(x, z), rs < 4 ? 0 : rs < 8.5 ? 1 : rs < 11.5 ? 2 : 3);
}
const nOf = (x, z) => tier.get(key(x, z)) ?? -1;
const capOf = (n) => 3 + 3 * n;                       // roof deck row: floor lines at 3, 6, .. 3+3n
const topOf = (x, z) => (nOf(x, z) <= 0 ? 3 : capOf(nOf(x, z)) + 1);   // first empty row above a cell

// The sides a cell at height y is exposed on: off the footprint, or the neighbour is lower than y.
const DIRS = { w: [-1, 0], e: [1, 0], n: [0, -1], s: [0, 1] };
const exposed = (x, y, z) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d], nx = x + dx, nz = z + dz;
  return !inFoot(nx, nz) || topOf(nx, nz) <= y;
});
const OPP = { w: "e", e: "w", n: "s", s: "n" };
const FACING = { n: "north", s: "south", w: "west", e: "east" };

const SIZE = [63, 26, 134];
const g = new Voxels(SIZE);
const glass = [];                                      // {x, y, z, axis} to set pane connections after the shell is up

const PIER = "white_concrete", STRING = "smooth_quartz", PANE = "light_blue_stained_glass_pane";
for (const [x, z] of cells) {
  for (let y = 0; y < 3; y++) g.set(x, y, z, "polished_granite");        // foundation and plinth
  const n = nOf(x, z);
  if (n <= 0) continue;
  const cap = capOf(n);
  for (let y = 3; y <= cap; y++) {
    const ex = exposed(x, y, z);
    if ((y - 3) % 3 === 0) { g.set(x, y, z, ex.length ? STRING : "stone"); continue; }   // floor lines and roof deck
    if (!ex.length) continue;                                                             // interior air behind the glass
    const alongX = ex.some((d) => d === "n" || d === "s");       // a north/south face: the run goes along x
    const alongZ = ex.some((d) => d === "w" || d === "e");       // a west/east face: the run goes along z
    if (alongX && alongZ) { g.set(x, y, z, PIER); continue; }    // corners are piers
    const u = alongX ? x : z;
    if (u % 3 === 0) { g.set(x, y, z, PIER); continue; }
    g.set(x, y, z, PANE);
    glass.push({ x, y, z, axis: alongX ? "x" : "z", ex });
  }
  // parapet on the roof edge
  const edge = Object.entries(DIRS).some(([, [dx, dz]]) => !inFoot(x + dx, z + dz));
  if (edge) g.set(x, cap + 1, z, STRING);
}

// Glass panes connect along their run to any block beside them; a few windows get a warm light just inside.
let lit = 0;
for (const p of glass) {
  const [a, b] = p.axis === "x" ? [[-1, 0], [1, 0]] : [[0, -1], [0, 1]];
  const conn = (d) => (g.get(p.x + d[0], p.y, p.z + d[1]) ? "true" : "false");
  const state = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  if (p.axis === "x") { state.east = conn(b); state.west = conn(a); } else { state.north = conn(a); state.south = conn(b); }
  g.set(p.x, p.y, p.z, PANE, state);
  const d = p.ex[0], [dx, dz] = DIRS[OPP[d]];           // inward: opposite the exposed side
  const ix = p.x + dx, iz = p.z + dz;
  const h = (p.x * 73856093 ^ p.y * 19349663 ^ p.z * 83492791) >>> 0;
  if (h % 7 === 0 && p.y >= 4 && inFoot(ix, iz) && !exposed(ix, p.y, iz).length && !g.get(ix, p.y, iz)) {
    g.set(ix, p.y, iz, h % 5 === 0 ? "shroomlight" : "glowstone"); lit++;
  }
}

// Entrances: the longest run of exposed storey-one faces on each side, with a two-cell-deep recess, a door and lanterns under the lintel.
const entrances = [];
for (const d of ["n", "s", "w", "e"]) {
  const alongX = d === "n" || d === "s";
  const lines = new Map();                                // the run's fixed coordinate -> sorted run coordinate
  for (const [x, z] of cells) {
    if (nOf(x, z) < 1 || !exposed(x, 4, z).includes(d)) continue;
    const k = alongX ? z : x, u = alongX ? x : z;
    if (!lines.has(k)) lines.set(k, []);
    lines.get(k).push(u);
  }
  let best = null;
  for (const [k, us] of lines) {
    us.sort((p, q) => p - q);
    let start = us[0], prev = us[0];
    const flush = (end) => { if (!best || end - start > best.end - best.start) best = { k, start, end }; };
    for (let i = 1; i <= us.length; i++) {
      if (i < us.length && us[i] === prev + 1) { prev = us[i]; continue; }
      if (i < us.length) { flush(prev); start = us[i]; prev = us[i]; } else flush(prev);
    }
  }
  if (!best || best.end - best.start < 4) continue;
  const c = Math.floor((best.start + best.end) / 2);
  const [cx, cz] = alongX ? [c, best.k] : [best.k, c];
  entrances.push({ d, cx, cz, alongX });
}
for (const { d, cx, cz, alongX } of entrances) {
  const at = (o) => (alongX ? [cx + o, cz] : [cx, cz + o]);
  for (const o of [-1, 0, 1]) {                          // recess: two rows open, lintel is the storey-two floor line
    const [x, z] = at(o);
    g.set(x, 4, z, "air");
    g.set(x, 5, z, o !== 0 ? "lantern" : "air", o !== 0 ? { hanging: "true", waterlogged: "false" } : undefined);
  }
  const [dx0, dz0] = at(0);
  g.set(dx0, 4, dz0, "iron_door", { facing: FACING[d], half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx0, 5, dz0, "iron_door", { facing: FACING[d], half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Roof plant: 3x3 boxes on the tallest tier, set well in from the parapet.
let plant = 0;
for (let z = 8; z < 130 && plant < 4; z += 9) for (let x = 6; x < 58 && plant < 4; x += 10) {
  let ok = true;
  for (let dz = -4; dz <= 4 && ok; dz++) for (let dx = -4; dx <= 4 && ok; dx++) if (nOf(x + dx, z + dz) !== 3) ok = false;
  if (!ok) continue;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) for (const y of [13, 14]) g.set(x + dx, y, z + dz, "stone_bricks");
  plant++;
}

const out = g.save(`${DIR}/DC79638.nbt`);
console.log({ cells: cells.length, entrances: entrances.length, glass: glass.length, lit, plant, ...out });
