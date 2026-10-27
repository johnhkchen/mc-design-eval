// A three-storey Edwardian commercial block (c. 1910-1930) on Karangahape-style street frontage: red brick walls on a
// dark plinth, pale Oamaru-style dressings (smooth quartz) for string courses, window heads, quoins and the coping,
// shopfront glass with dark timber posts at ground level, sash-style glass panes in the upper storeys, a corbelled
// cornice, and a flat roof with plant on the tallest tier. The footprint is one-block-thick perimeter shell with
// air inside behind the glass; floor slabs at each storey line and a roof deck at each tier's top.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_1014529460.cells.json`, "utf8"));

const DATUM = 2;                       // ground-floor slab; everything below it is plinth/foundation
const FLOORS = [2, 6, 10];             // floor slabs (y of the top of each slab's block)
const g = new Voxels([11, 28, 10]);

// Lidar roof heights smoothed into flat tiers: 15 (main block), 14 (east/north wings), 13 (setback), 10 (annex).
const tier = (r) => (r >= 15 ? 15 : r >= 14 ? 14 : r >= 13 ? 13 : 10);
const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, top: tier(roof) }]));
const inside = (x, z) => cell.has(`${x},${z}`);

function facing(x, z) {
  const N = !inside(x, z - 1), S = !inside(x, z + 1), W = !inside(x - 1, z), E = !inside(x + 1, z);
  return { N, S, E, W, corner: (N || S) && (E || W), perimeter: N || S || E || W, idx: N || S ? x : z };
}

// Foundation and plinth: solid from y 0 up to the datum under every footprint cell (nothing floats on a slope).
for (const [key, { ground }] of cell) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < DATUM; y++) g.set(x, y, z, y < ground ? "stone_bricks" : "polished_andesite");
}

// Perimeter shell: each cell is one bay of the facade, windows on bays off the pier grid, piers and quoins between.
function shell(y, f, t) {
  const win = !f.corner && f.idx % 3 !== 0;
  if (y === t - 1) return "smooth_quartz";                     // coping
  if (y === DATUM) return "polished_andesite";                 // base course / stall riser
  if (y <= 4) {                                                // shopfront storey
    if (f.corner) return "dark_oak_log";
    if (win) return "glass_pane";
    return f.N ? "dark_oak_log" : "bricks";
  }
  if (y === 5) return f.N ? "dark_oak_planks" : "bricks";      // shop fascia / lintel course
  if (FLOORS.includes(y)) return "smooth_quartz";              // string courses at each storey line
  if (y === 13 && t === 15) return "polished_andesite";        // corbelled cornice on the main block
  if (f.corner) return "smooth_quartz";                        // quoins
  return win && y !== 9 ? "glass_pane" : "bricks";             // sash glazing; brick piers and spandrels
}

const interior = [];
for (const [key, { top: t }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const f = facing(x, z);
  if (f.perimeter) {
    for (let y = DATUM; y < t; y++) g.set(x, y, z, shell(y, f, t));
    if (f.N && f.idx === 3 && !f.corner) {                     // entrance on the street face, in the pier grid
      g.set(x, 3, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, 4, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
  } else {
    interior.push({ x, z, t });
    for (const y of FLOORS) if (y < t) g.set(x, y, z, "smooth_stone");
    g.set(x, t - 1, z, "smooth_stone");                        // roof deck
  }
}

// Warm light: glowstone on the ground floor just inside a shop window, lanterns hung from the main roof deck.
const behindGlass = ({ x, z }) => [[x, z - 1], [x, z + 1], [x - 1, z], [x + 1, z]]
  .some(([a, b]) => inside(a, b) && facing(a, b).perimeter && !facing(a, b).corner);
const lit = interior.filter(behindGlass);
for (const { x, z } of lit.slice(0, 3)) g.set(x, 3, z, "glowstone");
for (const { x, z, t } of interior.filter((c) => c.t === 15).slice(0, 2)) g.set(x, 13, z, "lantern", { hanging: "true", waterlogged: "false" });

// Roof plant on the main block: a small air-handling box on one interior bay.
const plant = interior.find((c) => c.t === 15 && c.x >= 4 && c.x <= 6 && c.z >= 4 && c.z <= 6) ?? interior.find((c) => c.t === 15);
if (plant) { g.set(plant.x, 15, plant.z, "iron_block"); g.set(plant.x, 16, plant.z, "iron_block"); }

// Glass panes connect to the neighbours they meet in the wall plane (panes, piers, quoins); not to air or doors.
const joins = (b) => b && b !== "lantern" && !/door/.test(b);
for (let y = 0; y < 28; y++) for (let z = 0; z < 10; z++) for (let x = 0; x < 11; x++) {
  const here = g.get(x, y, z);
  if (!here || here.block !== "glass_pane") continue;
  const near = (dx, dz) => { const n = g.get(x + dx, y, z + dz); return joins(n?.block) ? "true" : "false"; };
  g.set(x, y, z, "glass_pane", { north: near(0, -1), south: near(0, 1), west: near(-1, 0), east: near(1, 0), waterlogged: "false" });
}

const out = g.save(`${dir}/way_1014529460.nbt`);
console.log(`saved ${out.blocks} blocks, palette ${out.palette}`);
