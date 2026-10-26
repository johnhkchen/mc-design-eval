// FR245184660: a residential building of 1700, seven storeys under a slate roof, cream limestone walls. Its
// footprint's lidar roof heights are smoothed into four flat tiers (27, 20, 12, 6 blocks), each tier split into
// storeys on a common floor level (y 2, the highest ground under it). The footprint's outer ring is the wall (solid
// stone columns with glass bays), the inside is air with a floor slab per storey, and each tier's top is a roof slab.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184660.cells.json", "utf8"));

const g = new Voxels([8, 43, 13]);

// footprint: key "x,z" -> { ground, tier }
const B = Math.max(...cells.map((c) => c[2]));                      // floor level: the highest ground under the footprint
const TIERS = [[22, 27, 7], [14, 20, 5], [9, 12, 3], [0, 6, 1]];    // [lidar roof from, tier top, storeys]
const tierOf = (R) => { const t = TIERS.find(([lo]) => R >= lo); return { top: t[1], n: t[2] }; };
const F = new Map();
for (const [x, z, ground, roof] of cells) F.set(`${x},${z}`, { ground, ...tierOf(roof) });
const at = (x, z) => F.get(`${x},${z}`);

// each tier's storey floor lines: p[k] = the bottom course of storey k; the last storey ends under the roof
const plans = new Map();
for (const [, top, n] of TIERS) plans.set(top, Array.from({ length: n }, (_, k) => Math.round(B + (k * (top - B)) / n)));

// a footprint cell's neighbours: outside the footprint, or in another tier (a setback face)
const sides = (x, z) => {
  const me = at(x, z); let outside = 0, step = 0;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const o = at(x + dx, z + dz);
    if (!o) outside++; else if (o.top !== me.top) step++;
  }
  return { outside, exposed: outside + step };
};

const WALL = "calcite", BASE = "stone_bricks", FOUND = "stone", FLOOR = "smooth_stone", ROOF = "deepslate_tiles";
const CORNER = "chiseled_stone_bricks", LIT = "glowstone", PANE = "glass_pane";

const panes = [];
for (const [key, c] of F) {
  const [x, z] = key.split(",").map(Number);
  const { top, n } = c;
  const p = plans.get(top);
  const sd = sides(x, z);
  const boundary = sd.exposed > 0;
  // storey rows: string course at p[k], windows between, lintel above; the last storey ends in a cornice under the parapet
  const storeyOf = (y) => { let k = 0; for (let i = 0; i < n; i++) if (y >= p[i]) k = i; return k; };
  const isCourse = (y) => p.includes(y) && y >= B;
  const lastWindowRow = (y) => { const k = storeyOf(y); const e = k < n - 1 ? p[k + 1] - 1 : top - 2; return { k, e, s: p[k] }; };

  for (let y = 0; y < B; y++) g.set(x, y, z, FOUND);            // foundation: solid from the lowest ground to the floor level
  for (let y = B; y <= top; y++) {
    if (y >= top) { if (sd.outside > 0) g.set(x, y, z, WALL); continue; }  // parapet course, on the outside faces only (a step's bump read as stray)
    if (!boundary) {
      if (y === top - 1) g.set(x, y, z, ROOF);
      else if (isCourse(y) && y > B) g.set(x, y, z, FLOOR);
      continue;                                                 // interior: air, with a floor slab per storey
    }
    if (y === top - 1) { g.set(x, y, z, sd.exposed >= 2 ? CORNER : "chiseled_stone_bricks"); continue; }  // cornice
    if (sd.exposed >= 2) { g.set(x, y, z, CORNER); continue; }   // quoins at the corners
    const { s, e } = lastWindowRow(y);
    if (y === s) { g.set(x, y, z, BASE); continue; }             // string course / base course
    if (y === e) { g.set(x, y, z, WALL); continue; }             // lintel
    if (y > s && y < e && sd.outside > 0 && (x + z) % 2 === 0) {  // glazed bays, outside faces only
      if ((x * 5 + z * 3 + y) % 11 === 0) g.set(x, y, z, LIT);
      else { g.set(x, y, z, PANE); panes.push([x, y, z]); }
      continue;
    }
    g.set(x, y, z, WALL);
  }
}

// chimney stacks on some interior cells of the tallest tier, standing on the roof slab
for (const [key, c] of F) {
  const [x, z] = key.split(",").map(Number);
  if (c.top !== 27 || sides(x, z).exposed > 0) continue;
  if ((x * 3 + z * 5) % 13 === 2) { g.set(x, 27, z, "bricks"); g.set(x, 28, z, "bricks"); }
}

// the entrance on the street (north) face of the cell at x 4, z 0: a dark oak door, lintel above
g.set(4, B, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(4, B + 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// glass panes connect to the solid or glass neighbours beside them, so a bay reads as one window band
const solid = (x, y, z) => { const b = g.get(x, y, z); return b && b.block !== "minecraft:dark_oak_door" ? b : null; };
for (const [x, y, z] of panes) {
  if (g.get(x, y, z)?.block !== "minecraft:glass_pane") continue;
  const conn = (dx, dz) => (solid(x + dx, y, z + dz) ? "true" : "false");
  g.set(x, y, z, PANE, { north: conn(0, -1), south: conn(0, 1), east: conn(1, 0), west: conn(-1, 0), waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184660.nbt");
