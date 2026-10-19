// DC63312: 1000 Independence Ave SW, DC 20585 (the James V. Forrestal Building, a federal office block of the late 1960s),
// as a 1.21.1 module. A pale precast-concrete office with a ribbon-and-pier window grid, a dark glass band, a stone base and
// stepped tiers that follow the lidar roof: the wings sit at 13 and 15, the main slab at 17, and a 19 core stands on it.
// Lidar roof heights are smoothed (3x3 median over the footprint) and snapped to those four tiers, so every column is solid
// from y 0 up to its tier and nothing floats. Storeys are 3 blocks: a floor line (y % 3 == 0) and two window rows above it,
// so a 19-block roof reads as about six storeys at this scale. Glass sits on the exposed faces only (a neighbour missing or
// lower than that height), with an air gap behind each pane and a few glowstone lamps on the floor line.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC63312.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC63312.nbt";

const key = (x, z) => `${x},${z}`;
const RAW = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const F = new Map(cells.map(([x, z, g]) => [key(x, z), { x, z, g, t: 0 }]));
const at = (x, z) => F.get(key(x, z));

// Storey tiers: 13 (lidar 13-14), 15 (15-16), 17 (17-18), 19 (19+), from the 3x3 median of the footprint's roof heights.
const tierOf = (r) => (r <= 14 ? 13 : r <= 16 ? 15 : r <= 18 ? 17 : 19);
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const r = RAW.get(key(c.x + dx, c.z + dz)); if (r !== undefined) vals.push(r);
  }
  vals.sort((a, b) => a - b);
  c.t = tierOf(vals[vals.length >> 1]);
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const INWARD = { N: "S", S: "N", W: "E", E: "W" };
// A face at height y is exposed when the neighbour across it is missing or lower than y (a street face, or a setback).
const exposed = (c, y) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d]; const n = at(c.x + dx, c.z + dz); return !n || n.t <= y;
});

const g = new Voxels([92, 31, 59]);

// 1. Solid columns: foundation below each cell's ground, a stone base to y 3, then pale concrete up to the tier.
for (const c of F.values()) {
  for (let y = 0; y < c.t; y++) {
    let b = y < c.g ? "stone" : y < 3 ? "polished_andesite" : "white_concrete";
    if (y === c.t - 1) b = exposed(c, y).length ? "smooth_stone" : "gray_concrete";   // cornice ring, else roof deck
    g.set(c.x, y, c.z, b);
  }
  if (exposed(c, c.t - 1).length) g.set(c.x, c.t, c.z, "smooth_stone");              // parapet on the roof edge
}

// 2. Facades: floor lines every third row, window rows between them, piers every third column.
const windows = [];
for (const c of F.values()) {
  for (let y = 3; y < c.t - 1; y++) {
    for (const d of exposed(c, y)) {
      const u = d === "N" || d === "S" ? c.x : c.z;
      const floor = y % 3 === 0;
      const pier = u % 3 === 0;
      g.set(c.x, y, c.z, floor || pier ? "light_gray_concrete" : "gray_stained_glass");
      if (!floor && !pier) windows.push({ c, y, d });
    }
  }
}

// 3. Air gap behind each pane (one block in), with glowstone lamps on some sills; only where the cell inside is solid
//    and not itself a face at that height, so no wall is opened.
for (const { c, y, d } of windows) {
  const [dx, dz] = DIRS[INWARD[d]];
  const p = at(c.x + dx, c.z + dz);
  if (!p || p.t <= y + 1 || exposed(p, y).length) continue;
  g.set(p.x, y, p.z, "air");
  if (y % 3 === 1 && (p.x * 5 + p.z * 11 + y * 3) % 7 === 0) g.set(p.x, y, p.z, "glowstone");   // sits on the floor line
}

// 4. Main entrance on the north face, near x 18 on lowish ground: a door in a stone surround under a glass transom.
let best = null;
for (const c of F.values()) {
  if (at(c.x, c.z - 1) || c.g > 2) continue;
  const dist = Math.abs(c.x - 18);
  if (!best || dist < best.dist) best = { c, dist };
}
if (best) {
  const { x, z } = best.c;
  for (const dx of [-1, 1]) if (at(x + dx, z)) for (const y of [3, 4, 5]) g.set(x + dx, y, z, "smooth_stone");
  const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(x, 3, z, "dark_oak_door", { ...door, half: "lower" });
  g.set(x, 4, z, "dark_oak_door", { ...door, half: "upper" });
  g.set(x, 5, z, "gray_stained_glass");
}

// 5. Roof plant: 2x2x2 light-grey boxes on the interior of the upper tiers.
for (const c of F.values()) {
  if (c.t < 17 || c.x % 6 !== 2 || c.z % 6 !== 2) continue;
  const sq = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => at(c.x + a, c.z + b));
  if (sq.some((n) => !n || n.t !== c.t || exposed(n, c.t - 1).length)) continue;
  for (const n of sq) for (const y of [c.t, c.t + 1]) g.set(n.x, y, n.z, "light_gray_concrete");
}

g.save(OUT);
