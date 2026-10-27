// BNZ Tower (Auckland, 1-7 Queen St area): a late-1980s glazed office tower. Read from the lidar: a footprint of
// 1082 cells, most of it at roof 112-127 (about 30 storeys at 4 blocks), a lower ring and wings below 100, a podium
// at the foot. Articulation: a stone plinth, a pale concrete frame with polished-andesite mullions and blue glass,
// a spandrel belt per storey, a parapet and a plant room on the roof with a mast. Interiors are a 1-block air gap
// behind the glass with a slab per storey; warm light sits in some windows; the ground floor is a lobby with a door.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_157332769.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_157332769.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const X = 39, Z = 40, H = 140, MAX_TOP = 128;

// the footprint, keyed by cell
const byKey = new Map();
for (const [x, z, ground, roof] of cells) byKey.set(`${x},${z}`, { x, z, ground, roof });
const at = (x, z) => byKey.get(`${x},${z}`);
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

// Lidar noise out: the median of each cell and its 5 x 5 footprint neighbours, then snapped to clean tiers (the
// tower's crown at 128, the setback ring at 112, the wings and podium below) so the roof steps in planes, not
// ragged storeys. A column stands at least 4 blocks above its own ground so every cell carries a storey.
const TIERS = [[118, 128], [106, 112], [92, 96], [60, 64], [0, 40]];
const tier = (v) => (TIERS.find(([lo]) => v >= lo) ?? [0, 4])[1];
for (const c of byKey.values()) {
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = at(c.x + dx, c.z + dz); if (n) vals.push(n.roof); }
  c.top = Math.min(MAX_TOP, Math.max(tier(median(vals)), Math.ceil((c.ground + 4) / 4) * 4));
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// the faces of a cell at height y that look out: off the footprint, or over a neighbour that stops below y
const exposed = (c, y) => Object.entries(DIRS).filter(([, [dx, dz]]) => { const n = at(c.x + dx, c.z + dz); return !n || n.top <= y; }).map(([d]) => d);

const g = new Voxels([X, H, Z]);

// the entrance: the middle of the south-most row (the one the lidar's street edge sits on)
const zMin = Math.min(...[...byKey.values()].map((c) => c.z));
const row = [...byKey.values()].filter((c) => c.z === zMin).sort((a, b) => a.x - b.x);
const door = row[row.length >> 1];

for (const c of byKey.values()) {
  const { x, z, ground: gr, top: T } = c;
  for (let y = 0; y < T; y++) {
    // foundation: solid from y 0 up to the ground under the cell, so nothing floats on a slope
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }
    const ex = exposed(c, y);
    const shell = ex.length > 0;
    // roof: the cap is solid over the whole cell; the parapet stands on the storey below it
    if (y === T - 1) { g.set(x, y, z, shell ? "smooth_stone" : "gray_concrete"); continue; }
    if (shell && (y === T - 2 || y === T - 3)) { g.set(x, y, z, "light_gray_concrete"); continue; }
    // storey lines: a slab per storey (interior floor, or a white base course on the outside)
    const fl = y % 4;
    if (fl === 0) { g.set(x, y, z, shell ? "white_concrete" : "gray_concrete"); continue; }
    if (!shell) continue;                                  // the air gap behind the glass
    if (fl === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }   // spandrel belt
    // the window zone: a 3-block bay grid, two panes of glass to one frame pier; quoins at the corners
    const zFace = ex.some((d) => d === "N" || d === "S"), xFace = ex.some((d) => d === "E" || d === "W");
    if (zFace && xFace) { g.set(x, y, z, "white_concrete"); continue; }
    const p = zFace ? x : z;
    if (((p % 3) + 3) % 3 === 0) { g.set(x, y, z, "polished_andesite"); continue; }
    g.set(x, y, z, "light_blue_stained_glass");
    // a warm light just behind some panes, in the air gap on the first floor of a storey
    const [dx, dz] = DIRS[ex[0]], inner = at(x - dx, z - dz);
    if (fl === 1 && (x * 7 + z * 31 + y) % 9 === 0 && inner && inner.top > y && exposed(inner, y).length === 0) {
      g.set(x - dx, y, z - dz, "glowstone");
    }
  }
}

// the entrance bay: a door into the air gap, a lintel over it, and a canopy slab across the bay
const dy = door.ground;
for (const dxo of [-1, 0, 1]) {
  const c = at(door.x + dxo, door.z);
  if (c) g.set(c.x, dy + 2, c.z, "smooth_stone");
}
g.set(door.x, dy, door.z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(door.x, dy + 1, door.z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// roof plant: a 7 x 5 box on the top tier, glazed at its middle, with a mast on the centre
const tops = [...byKey.values()].filter((c) => c.top === Math.max(...[...byKey.values()].map((d) => d.top)));
const cx = Math.round(tops.reduce((s, c) => s + c.x, 0) / tops.length), cz = Math.round(tops.reduce((s, c) => s + c.z, 0) / tops.length);
const hi = tops[0].top;
for (let dz = -2; dz <= 2; dz++) for (let dx = -3; dx <= 3; dx++) {
  const c = at(cx + dx, cz + dz);
  if (!c || c.top !== hi) continue;
  const ring = Math.abs(dx) === 3 || Math.abs(dz) === 2;
  g.set(c.x, hi, c.z, "gray_concrete");
  if (ring) g.set(c.x, hi + 1, c.z, Math.abs(dx) === 3 && Math.abs(dz) === 2 ? "light_gray_concrete" : "light_blue_stained_glass");
  g.set(c.x, hi + 2, c.z, "smooth_stone");
}
g.set(cx, hi + 3, cz, "iron_bars");
for (let y = hi + 4; y < hi + 9; y++) g.set(cx, y, cz, "iron_bars");

const stats = g.save(OUT);
console.log(`BNZ Tower: ${stats.blocks} blocks, palette ${stats.palette}, top ${hi + 8}, door at ${door.x},${dy},${door.z}`);
