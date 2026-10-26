import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1776 Massachusetts Ave NW, Commercial-Office-Large: a 1970s precast-and-glass office block on a granite base.
// The lidar roof record is median-smoothed over each cell's footprint neighbours, then read as flat tiers: a one-storey
// wing on the south-west (4), two storeys (7), three (10), four (13), and a two-block penthouse (15) on the core.
// Storeys are 3-block modules: a cream spandrel course, then two rows of glass between piers. The inside is air behind
// the glass with a floor slab per storey; the roof is a gray deck with a cream parapet and rooftop units.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC63376.cells.json`, "utf8")); // [x, z, ground, roof] per footprint cell

const W = 24, D = 21, Y = 16;
const g = new Voxels([W, Y, D]);

const CREAM = "smooth_quartz", BASE = "polished_granite", SLAB = "smooth_stone", ROOF = "gray_concrete";
const GLASS = "light_blue_stained_glass_pane", UNIT = "light_gray_concrete";
const PANE_EW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const FLOORS = [4, 7, 10, 13]; // storey floor levels: each storey's slab, and the ceiling of the one below

const k = (x, z) => `${x},${z}`;
const roof = new Map(cells.map(([x, z, , r]) => [k(x, z), r]));
const inFoot = (x, z) => roof.has(k(x, z));

// flat tiers: the median roof of a cell and its footprint neighbours, then the nearest storey top
const storeyTop = (r) => (r <= 5 ? 4 : r <= 8 ? 7 : r <= 11 ? 10 : r <= 14 ? 13 : 15);
const median = (v) => v.sort((a, b) => a - b)[v.length >> 1];
const T = new Map();
for (const [x, z] of cells) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) near.push(roof.get(k(x + dx, z + dz)));
  T.set(k(x, z), storeyTop(median(near)));
}
// one majority vote over each cell's footprint neighbours, so the tier edges run straight rather than stair-stepped
const VOTED = new Map();
for (const [x, z] of cells) {
  const votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!inFoot(x + dx, z + dz)) continue;
    const t = T.get(k(x + dx, z + dz)); votes.set(t, (votes.get(t) ?? 0) + 1);
  }
  const own = T.get(k(x, z));
  const [best] = [...votes].sort((a, b) => b[1] - a[1] || (a[0] === own ? -1 : b[0] === own ? 1 : 0))[0];
  VOTED.set(k(x, z), best);
}
const top = (x, z) => VOTED.get(k(x, z)) ?? 0;

// a face is outside when its neighbour has no solid at this height: off the footprint, or in a lower tier
const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]];
const faces = (x, y, z) => DIRS.filter(([dx, dz]) => top(x + dx, z + dz) <= y);

// the block at a cell: 1-block base course, glass with cream piers and spandrels, the entrance on the z = 0 front
function kind(x, y, z) {
  const t = top(x, z);
  if (y >= t) return null;
  if (z === 0 && x >= 2 && x <= 4 && y >= 1 && y <= 3) {
    if (x === 3 && y <= 2) return { id: "dark_oak_door", state: { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
    return { id: BASE };
  }
  const f = faces(x, y, z), out = f.length > 0;
  if (y === t - 1) return out ? { id: CREAM } : { id: ROOF };
  if (y === 0) return out ? { id: BASE } : { id: SLAB };
  if (!out) return FLOORS.includes(y) ? { id: SLAB } : null;
  if (y === 3 || FLOORS.includes(y)) return { id: CREAM };
  const zWall = f.some(([, dz]) => dz !== 0), xWall = f.some(([dx]) => dx !== 0);
  if ((zWall && xWall) || (zWall && x % 3 === 0) || (xWall && z % 3 === 0)) return { id: CREAM };
  return { id: GLASS, state: zWall ? PANE_EW : PANE_NS };
}

const lamps = [];
for (const [x, z] of cells) {
  for (let y = 0; y < top(x, z); y++) {
    const c = kind(x, y, z);
    if (!c) continue;
    g.set(x, y, z, c.id, c.state);
    if (c.id === GLASS && (x * 5 + z * 3 + y * 7) % 6 === 0) { const [[dx, dz]] = faces(x, y, z); lamps.push([x - dx, y, z - dz]); }
  }
}
// warm light behind some panes: a glowstone in the air cell just inside the glass
for (const [x, y, z] of lamps) if (top(x, z) > y && !faces(x, y, z).length && !kind(x, y, z)) g.set(x, y, z, "glowstone");

// the entrance's inside light
g.set(3, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });

// rooftop units: 2x2 boxes standing on the roof deck, away from the parapet
const used = new Set();
for (const [t, n] of [[13, 1], [10, 1], [7, 2]]) {
  let placed = 0;
  for (const [x, z] of cells) {
    if (placed >= n) break;
    const sq = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
    if (!sq.every(([a, b]) => top(a, b) === t && !faces(a, t - 1, b).length && !used.has(k(a, b)))) continue;
    for (const [a, b] of sq) { used.add(k(a, b)); g.set(a, t, b, UNIT); }
    placed++;
  }
}

const { blocks, palette } = g.save(`${DIR}/DC63376.nbt`);
console.log(`DC63376.nbt: ${blocks} blocks, ${palette} palette entries, ${lamps.length} window lamps`);
