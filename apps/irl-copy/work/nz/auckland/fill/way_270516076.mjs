// Way 270516076: a two-storey 1930s stripped-classical shop block (cream plaster on a basalt plinth, the
// Auckland look of the inter-war Karangahape and Newton frontages), a single-storey wing on its low side, a
// parapet with a cornice, a shopfront on the street sides, steel-sash windows above, and a roof plant box.
// Lidar roof >= 7 is the main tier (ground storey y 2-4, band y 5, upper storey y 6-8, roof slab y 9, parapet
// y 10, cap y 11); roof <= 6 is the wing (walls y 2-4, roof slab y 5). Every footprint cell is filled y 0-1.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_270516076.cells.json", "utf8"));

const roofAt = new Map(cells.map(([x, z, , r]) => [x + "," + z, r]));
const top = (x, z) => roofAt.get(x + "," + z);                     // undefined outside the footprint
const isMain = (x, z) => (top(x, z) ?? 0) >= 7;
const DIRS = [
  { k: "N", dx: 0, dz: -1, facing: "north" },
  { k: "S", dx: 0, dz: 1, facing: "south" },
  { k: "E", dx: 1, dz: 0, facing: "east" },
  { k: "W", dx: -1, dz: 0, facing: "west" },
];
const outside = (x, z) => DIRS.filter((d) => top(x + d.dx, z + d.dz) === undefined);   // on the street edge
const stepped = (x, z) => DIRS.filter((d) => !isMain(x + d.dx, z + d.dz));             // edge or the lower wing
const interior = (x, z) => top(x, z) !== undefined && outside(x, z).length === 0;

// blocks
const PLINTH = "polished_andesite", BULK = "polished_andesite", WALL = "smooth_quartz", PIER = "quartz_pillar";
const BAND = "chiseled_quartz_block", CORNICE = "smooth_quartz", PARAPET = "smooth_quartz", CAP = "smooth_quartz_slab";
const ROOF = "stone", FLOOR = "stone", PLANT = "stone_bricks", PLANT_CAP = "stone_brick_slab";
const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };
const PILLAR = { axis: "y" };
const pane = (d) =>
  d.k === "N" || d.k === "S"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

const g = new Voxels([33, 24, 35]);
const windows = [];                                                  // glazed bays, for the lights behind them

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const main = isMain(x, z), out = outside(x, z), step = stepped(x, z);
  g.set(x, 0, z, PLINTH); g.set(x, 1, z, PLINTH);

  // roof and band
  if (main) {
    if (out.length) { g.set(x, 9, z, CORNICE); g.set(x, 10, z, PARAPET); g.set(x, 11, z, CAP, SLAB_BOTTOM); }
    else g.set(x, 9, z, ROOF);
    g.set(x, 5, z, step.length ? BAND : FLOOR);
  } else {
    g.set(x, 5, z, out.length ? CORNICE : ROOF);
  }

  // the street edge: shopfront below, steel-sash windows above, pilasters every fourth cell. On the diagonal
  // stair a cell can face two ways; it takes the first, so the stair reads as a wall, not a row of pillars.
  if (out.length) {
    const d = out[0], idx = d.k === "N" || d.k === "S" ? x : z;
    if (idx % 4 === 0) for (const y of [2, 3, 4]) g.set(x, y, z, PIER, PILLAR);
    else {
      g.set(x, 2, z, BULK);
      g.set(x, 3, z, "light_blue_stained_glass_pane", pane(d));
      g.set(x, 4, z, "light_blue_stained_glass_pane", pane(d));
      windows.push({ x, z, d, main, ground: true });
    }
    if (main) {
      if (idx % 4 === 0) for (const y of [6, 7, 8]) g.set(x, y, z, PIER, PILLAR);
      else if (idx % 4 === 3) for (const y of [6, 7, 8]) g.set(x, y, z, WALL);
      else {
        g.set(x, 6, z, "light_blue_stained_glass_pane", pane(d));
        g.set(x, 7, z, "light_blue_stained_glass_pane", pane(d));
        g.set(x, 8, z, WALL);
        windows.push({ x, z, d, main, ground: false });
      }
    }
  }

  // the wing's walls, and the main block's upper walls wherever they meet the wing (no open edge over it)
  if (main) for (const d of step) if (!out.includes(d)) for (const y of [6, 7, 8]) g.set(x, y, z, WALL);
}

// the entrance: a door in the longest straight run of street edge (one outward direction), a quartz hood over it
const runs = [];
for (const d of DIRS) {
  const edge = cells.map(([x, z]) => [x, z]).filter(([x, z]) => outside(x, z).some((o) => o.k === d.k && isMain(x, z)));
  const lines = new Map();                                       // a row (N/S faces) or column (E/W faces) of the edge
  for (const [x, z] of edge) { const key = d.dz ? z : x, along = d.dz ? x : z; lines.set(key, [...(lines.get(key) ?? []), along]); }
  for (const [key, alongs] of lines) {
    alongs.sort((a, b) => a - b);
    let start = alongs[0], prev = alongs[0];
    for (const a of [...alongs.slice(1), Infinity]) {
      if (a !== prev + 1) { runs.push({ d, key, from: start, to: prev, len: prev - start + 1 }); start = a; }
      prev = a;
    }
  }
}
const run = runs.sort((a, b) => b.len - a.len)[0];
const along = run.from + Math.floor(run.len / 2), xd = run.d.dz ? along : run.key, dz = run.d.dz ? run.key : along;
const doorState = (half) => ({ facing: run.d.facing, half, hinge: "left", open: "false", powered: "false" });
g.set(xd, 2, dz, "dark_oak_door", doorState("lower"));
g.set(xd, 3, dz, "dark_oak_door", doorState("upper"));
const flank = run.d.dz ? [[xd - 1, dz], [xd + 1, dz]] : [[xd, dz - 1], [xd, dz + 1]];
for (const [x, z] of flank) if (top(x, z) !== undefined) g.set(x, 3, z, WALL);
for (const [x, z] of [...flank, [xd, dz]]) if (top(x, z) !== undefined)
  g.set(x, 4, z, "smooth_quartz_stairs", { facing: run.d.facing, half: "top", shape: "straight", waterlogged: "false" });

// warm light: glowstone behind the upper glass (on the floor slab), lanterns hanging under the ground-floor ceiling
for (const w of windows) {
  const ix = w.x - w.d.dx, iz = w.z - w.d.dz;
  if (!interior(ix, iz)) continue;
  if (w.ground && (w.x * 3 + w.z) % 4 === 0) g.set(ix, 4, iz, "lantern", { hanging: "true", waterlogged: "false" });
  if (!w.ground && isMain(ix, iz) && (w.x + 2 * w.z) % 5 === 0) g.set(ix, 6, iz, "glowstone");
}

// roof plant: a 3 x 3 box on the main roof, nearest the middle of the main tier
const mainCells = cells.filter(([x, z]) => isMain(x, z));
const mx = mainCells.reduce((s, [x]) => s + x, 0) / mainCells.length, mz = mainCells.reduce((s, [, z]) => s + z, 0) / mainCells.length;
let best = null;
for (const [x, z] of mainCells) {
  const block = [];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) block.push([x + i, z + j]);
  if (!block.every(([a, b]) => isMain(a, b) && interior(a, b))) continue;
  const dist = Math.hypot(x - mx, z - mz);
  if (!best || dist < best.dist) best = { dist, block };
}
if (best) for (const [x, z] of best.block) {
  g.set(x, 10, z, PLANT); g.set(x, 11, z, PLANT);
  g.set(x, 12, z, PLANT_CAP, SLAB_BOTTOM);
}

const info = g.save(DIR + "way_270516076.nbt");
console.log(JSON.stringify({ ...info, entrance: [xd, dz], windows: windows.length, plant: !!best }));
