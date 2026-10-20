// Lighting: lamp posts on both plots at plan.md's coordinates (lanterns on the parapet posts and rink rim are laid by the
// well part's helpers), then a report of every walkable ground cell with no light source within reach. A lantern gives 15
// and loses one per block, so a source within 7 blocks lifts a cell to 8 or more (the lamplighter's aim); the report
// lists the cells that miss it, it never refuses or changes a block.
import { lampPost, LAMPS_PLOT0, LAMPS_PLOT1, PLOT0, PLOT1, PLOT1_LEVELS, SITE } from "../vocab.mjs";

// Surface height (top solid block) under each plot 0 lamp, read off the GROUND map cell that holds it
// (map column = x/2, map row = z/2). Rows 2, 7, 12, 17, 22 and columns 1, 7 are the lamp cells.
const LAMP_BASE0 = {
  5: { 2: 5, 14: 5 },
  15: { 2: 5, 14: 5 },
  25: { 2: 4, 14: 5 },
  35: { 2: 4, 14: 5 },
  45: { 2: 4, 14: 4 },
};

// Blocks that give light, and their level at the source (a lit candle is 3 per candle; the rest are the vanilla levels)
const LIGHT_LEVEL = {
  lantern: 15, soul_lantern: 10, ochre_froglight: 15, shroomlight: 15, end_rod: 14, candle: 3,
};

// Plot 1 lamp columns: plan.md's x 74 stands in the step-up crosswalk (x 73..74), where the ground's half-step slab
// sits at y 1 and would take the post's first block. It moves onto the walk at x 72 (still g 0, clear of the pools).
const PLOT1_LAMP_XS = LAMPS_PLOT1.xs.map((x) => (x === 74 ? 72 : x));

// Plot 1 ground level under a lamp's x (PLOT1_LEVELS, the three terraces)
function plot1Level(x) {
  const band = PLOT1_LEVELS.find((b) => x >= b.x0 && x <= b.x1);
  if (!band) throw new Error(`no plot 1 terrace at x ${x}`);
  return band.g;
}

// Lamp posts, both plots: post and lantern stand on the surface the ground part laid
function lamps(g) {
  const res = { placed: 0, refused: [] };
  for (const z of LAMPS_PLOT0.zs) {
    for (const x of LAMPS_PLOT0.xs) {
      const r = lampPost(g, x, z, LAMP_BASE0[z][x]);
      res.placed += r.placed;
      res.refused.push(...r.refused);
    }
  }
  for (const z of LAMPS_PLOT1.zs) {
    for (const x of PLOT1_LAMP_XS) {
      const r = lampPost(g, x, z, plot1Level(x));
      res.placed += r.placed;
      res.refused.push(...r.refused);
    }
  }
  return res;
}

// Walkable ground cells of both plots: the top solid block at s with two air cells above it, stood on at s+1
function groundCells(g) {
  const cells = [];
  const boxes = [PLOT0, PLOT1];
  for (const box of boxes) {
    for (let x = box.x0; x <= box.x1; x++) {
      for (let z = box.z0; z <= box.z1; z++) {
        let s = null;
        for (let y = SITE[1] - 1; y >= 0; y--) {
          if (!g.isAir(x, y, z)) { s = y; break; }
        }
        if (s === null || s >= SITE[1] - 2) continue;
        if (!g.isAir(x, s + 1, z) || !g.isAir(x, s + 2, z)) continue;
        cells.push([x, s + 1, z]);
      }
    }
  }
  return cells;
}

// Light sources in the grid: every block in LIGHT_LEVEL (lit candles only, which is how the candle part writes them)
function lightSources(g) {
  const src = [];
  for (let x = 0; x < SITE[0]; x++)
    for (let y = 0; y < SITE[1]; y++)
      for (let z = 0; z < SITE[2]; z++) {
        const b = g.blockAt(x, y, z).replace(/^minecraft:/, "");
        if (LIGHT_LEVEL[b] !== undefined) src.push([x, y, z, LIGHT_LEVEL[b]]);
      }
  return src;
}

// Walkable cells by the light they get from the nearest source (level = 15 - Manhattan distance in open air):
// `under8` have no source within 7 (short of the lamplighter's aim of 8), `zero` have none within 14 (mob spawn light)
function darkReport(g) {
  const sources = lightSources(g);
  const nearest = (x, y, z) => Math.min(...sources.map(([sx, sy, sz, level]) =>
    Math.abs(sx - x) + Math.abs(sy - y) + Math.abs(sz - z) - level + 15));
  const under8 = [];
  const zero = [];
  for (const [x, y, z] of groundCells(g)) {
    const level = Math.max(0, 15 - nearest(x, y, z));
    if (level < 8) under8.push([x, y, z]);
    if (level === 0) zero.push([x, y, z]);
  }
  return { under8, zero };
}

export function build(g) {
  const { placed, refused } = lamps(g);
  console.log(`lights: ${placed} lamp block(s) placed, ${refused.length} refused`);
  for (const c of refused) console.log(`  refused ${c.join(",")}`);
  const { under8, zero } = darkReport(g);
  console.log(`lights: ${under8.length} walkable cell(s) under light 8, ${zero.length} at light 0`);
  for (const c of zero.slice(0, 30)) console.log(`  dark ${c.join(",")}`);
}
