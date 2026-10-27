// Mt Eden / Eden Terrace office block, 1970s reinforced concrete: a seven-storey white-concrete tower with a
// plant-room setback on its inner core, a four-storey brick wing on the north-west, and a ground-level paved deck
// where the lidar reads no roof. Massing from the lidar roof heights; facade from the storey grid (4 blocks a storey).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089918.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089918.nbt";
const SIZE = [26, 44, 20];
const TOWER_TOP = 30, PLANT_TOP = 33, WING_TOP = 16;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const nb4 = (x, z) => Object.values(DIRS).map(([dx, dz]) => [x + dx, z + dz]);
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

// ---- lidar roof heights: fill small zero gaps inside the body; big zero areas are ground-level deck
const roof = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const zeroSeen = new Set();
for (const [k0, r0] of roof) {
  if (r0 !== 0 || zeroSeen.has(k0)) continue;
  const comp = [], stack = [k0]; zeroSeen.add(k0);
  while (stack.length) {
    const k = stack.pop(); comp.push(k);
    const [x, z] = k.split(",").map(Number);
    for (const [nx, nz] of nb4(x, z)) { const nk = key(nx, nz); if (roof.get(nk) === 0 && !zeroSeen.has(nk)) { zeroSeen.add(nk); stack.push(nk); } }
  }
  if (comp.length >= 6) continue;
  for (const k of comp) {
    const [x, z] = k.split(",").map(Number), vals = [];
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const v = roof.get(key(x + dx, z + dz)); if (v) vals.push(v); }
    if (vals.length >= 3) roof.set(k, median(vals));
  }
}

// ---- cells: kind from the smoothed lidar height (flat tiers, not noise)
const kindOf = (r) => (r >= 22 ? "tower" : r >= 10 ? "wing" : "podium");
const topOf = { tower: TOWER_TOP, wing: WING_TOP, podium: 1 };
const cmap = new Map();
for (const [x, z, ground] of cells) {
  const kind = kindOf(roof.get(key(x, z)));
  cmap.set(key(x, z), { x, z, base: ground, kind, top: topOf[kind], plant: false, door: false });
}
const all = [...cmap.values()];

// distance in cells from the outline (inward), to set the plant-room setback on the tower core
const dist = new Map(), q = [];
for (const c of all) if (nb4(c.x, c.z).some(([x, z]) => !cmap.has(key(x, z)))) { dist.set(key(c.x, c.z), 0); q.push(c); }
for (let i = 0; i < q.length; i++) {
  const c = q[i], dc = dist.get(key(c.x, c.z));
  for (const [x, z] of nb4(c.x, c.z)) { const k = key(x, z); if (cmap.has(k) && !dist.has(k)) { dist.set(k, dc + 1); q.push(cmap.get(k)); } }
}
for (const c of all) if (c.kind === "tower" && dist.get(key(c.x, c.z)) >= 3) { c.plant = true; c.top = PLANT_TOP; }

// a cell's exposed faces at height y: outside the footprint, or the neighbour is lower than y
const exposed = (c, y) => Object.entries(DIRS).filter(([, [dx, dz]]) => {
  const n = cmap.get(key(c.x + dx, c.z + dz));
  return !n || n.base + n.top <= y;
}).map(([d]) => d);

// the entrance: a tower outline cell facing south (+z), nearest the middle of the frontage
let doorCell = null;
for (const c of all) {
  if (c.kind !== "tower" || c.plant || c.base !== 0) continue;
  if (exposed(c, 1).join() !== "S") continue;
  if (!doorCell || Math.abs(c.x - 13) < Math.abs(doorCell.x - 13)) doorCell = c;
}
if (doorCell) doorCell.door = true;

const paneState = (d) => (d === "N" || d === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const inward = (d) => { const [dx, dz] = DIRS[d]; return [-dx, -dz]; };

const g = new Voxels(SIZE);
const lit = [];   // window panes on the lower row of each storey, for the warm lights behind them
const counts = { glass: 0, lights: 0 };

for (const c of all) {
  const wallMat = c.kind === "wing" ? "bricks" : "white_concrete";
  const hgen = Math.min(c.top, TOWER_TOP);          // the generic storey stack; the plant room is added after
  for (let j = 0; j < hgen; j++) {
    const y = c.base + j, exp = exposed(c, y), wall = exp.length > 0;
    let block = null, state;
    if (j === hgen - 1) block = "smooth_stone";                              // roof cap / cornice; roof deck inside
    else if (j === hgen - 2) block = wall ? "light_gray_concrete" : "smooth_stone";
    else if (j === 0) block = wall ? "polished_andesite" : "smooth_stone";  // base course / ground floor slab
    else if (j % 4 === 0) block = "smooth_stone";                           // storey floor slab (interior and line)
    else if (!wall) block = null;                                           // air behind the glass
    else if (j % 4 === 3) block = "light_gray_concrete";                    // spandrel band: the storey line
    else if (exp.length > 1) block = wallMat;                               // corner column
    else {
      const d = exp[0], idx = d === "N" || d === "S" ? c.x : c.z;
      if (c.door && d === "S" && j === 1) { block = "iron_door"; state = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }; }
      else if (c.door && d === "S" && j === 2) { block = "iron_door"; state = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }; }
      else if (idx % 3 === 2) block = "gray_concrete";                       // window frame between bays
      else { block = "light_blue_stained_glass_pane"; state = paneState(d); counts.glass++; if (j % 4 === 1) lit.push({ c, d, y }); }
    }
    if (block) g.set(c.x, y, c.z, block, state);
  }
  // the entrance lintel above the door: a stone course across the entry
  if (c.door) g.set(c.x, c.base + 3, c.z, "smooth_stone");
}

// warm light behind some lower-row panes: a lamp on the floor just inside the glass
lit.forEach(({ c, d, y }, n) => {
  const storey = Math.floor((y - c.base) / 4);
  if ((c.x + c.z + storey) % 4 !== 0) return;
  const [ix, iz] = inward(d), inner = cmap.get(key(c.x + ix, c.z + iz));
  if (!inner || inner.base + inner.top <= y || exposed(inner, y).length) return;
  const block = storey % 3 === 0 ? "lantern" : storey % 3 === 1 ? "glowstone" : "shroomlight";
  g.set(inner.x, y, inner.z, block, block === "lantern" ? { hanging: "false" } : undefined);
  counts.lights++;
});

// the plant room on the tower core: a deck at 30, louvred walls on the setback's edge, a roof cap at 32
for (const c of all) {
  if (!c.plant) continue;
  g.set(c.x, c.base + 30, c.z, "smooth_stone");
  g.set(c.x, c.base + 32, c.z, "smooth_stone");
  const exp = exposed(c, c.base + 31);
  if (exp.length === 1) {
    const d = exp[0], idx = d === "N" || d === "S" ? c.x : c.z;
    if (idx % 2 === 0) g.set(c.x, c.base + 31, c.z, "iron_bars", paneState(d));
    else g.set(c.x, c.base + 31, c.z, "light_gray_concrete");
  } else if (exp.length > 1) g.set(c.x, c.base + 31, c.z, "light_gray_concrete");
}

// any footprint cell's foundation below its ground (none in this footprint: all ground is 0)
for (const c of all) for (let y = 0; y < c.base; y++) g.set(c.x, y, c.z, "polished_andesite");

const kinds = all.reduce((o, c) => ((o[c.kind] = (o[c.kind] || 0) + 1), o), {});
const res = g.save(OUT);
console.log(JSON.stringify({ cells: all.length, kinds, plant: all.filter((c) => c.plant).length, panes: counts.glass, lights: counts.lights, ...res }));
