// DC58290: a 1930s stripped-classical federal office block (the Federal Triangle idiom). Calcite (Indiana limestone)
// walls on a granite base, quartz string courses and piers, a 4-storey podium-and-tower on the west and south ranges,
// a 1-storey east wing under a cornice, a plaza deck where the wings meet, and a bronze-doored entrance on the north face.
// Walls are one block thick around air; every storey has a floor slab; the roof is a deck with a cornice on its edge.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC58290.cells.json`, "utf8"));
const W = 20, D = 14, H = 25;

// lidar roof height per footprint cell (ground is 0 under every cell)
const raw = new Map();
for (const [x, z, , roof] of cells) raw.set(`${x},${z}`, roof);
const inF = (x, z) => raw.has(`${x},${z}`);

// lidar noise smoothed: the median of the footprint cells in each 3x3, snapped to the massing's tiers
const median = (xs) => { const s = xs.slice().sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const tierOf = (m) => (m >= 13 ? 13 : m >= 11 ? 12 : m >= 4 ? 5 : 1);
const TOP = new Map();                                    // solid layers per cell: y 0 .. top-1
for (const k of raw.keys()) {
  const [x, z] = k.split(",").map(Number), near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) near.push(raw.get(`${x + dx},${z + dz}`));
  TOP.set(k, tierOf(median(near)));
}
const top = (x, z) => TOP.get(`${x},${z}`) ?? 0;

const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
// a face is exposed at height y when the cell beside it is off the footprint or stands no higher than y
const faces = (x, z, y) => Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return !inF(x + dx, z + dz) || top(x + dx, z + dz) <= y; });

const FLOORS = [0, 3, 6, 9];                              // floor slabs inside, string courses outside, at storey lines
const g = new Voxels([W, H, D]);
const lightCands = [];

for (const k of raw.keys()) {
  const [x, z] = k.split(",").map(Number), t = top(x, z);
  for (let y = 0; y < t; y++) {
    const fs = faces(x, z, y), perim = fs.length > 0;
    const nsFace = fs.includes("N") || fs.includes("S"), ewFace = fs.includes("E") || fs.includes("W");
    if (y === t - 1) {                                    // roof: decking inside, a cornice slab on the edge
      if (!perim) g.set(x, y, z, "smooth_stone");
      else g.set(x, y, z, t <= 1 ? "smooth_stone_slab" : "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    } else if (FLOORS.includes(y)) {                      // floor slab (interior); base course and string course outside
      if (!perim) g.set(x, y, z, "smooth_stone");
      else g.set(x, y, z, y === 0 ? "polished_granite" : "smooth_quartz");
    } else if (!perim) {                                  // interior air behind the glass
      continue;
    } else if (nsFace && ewFace) {                        // corner pier
      g.set(x, y, z, "smooth_quartz");
    } else if (y % 3 !== 1 && y > 2) {                    // lintel band between window rows
      g.set(x, y, z, "calcite");
    } else {                                              // window row: glass panes between quartz piers
      const bay = nsFace ? x : z;
      if (bay % 3 === 0) g.set(x, y, z, "smooth_quartz");
      else {
        const pane = nsFace ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
                            : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
        g.set(x, y, z, "glass_pane", pane);
        const inward = nsFace ? [x, z + (fs.includes("N") ? 1 : -1)] : [x + (fs.includes("W") ? 1 : -1), z];
        lightCands.push({ x: inward[0], y, z: inward[1], n: bay + y });
      }
    }
  }
}

// warm light behind some panes: a glowstone on the inside cell, only where that cell is still air
let lit = 0;
for (const c of lightCands) {
  if (c.n % 11 !== 0 || !inF(c.x, c.z) || g.val(c.x, c.y, c.z) !== 0) continue;
  g.set(c.x, c.y, c.z, "glowstone"); lit++;
}

// the entrance: a bronze double door in the north wall between the piers at x 3 and 6, with a lantern inside
for (const x of [4, 5]) {
  const hinge = x === 4 ? "left" : "right";
  for (const [y, half] of [[1, "lower"], [2, "upper"]]) g.set(x, y, 0, "iron_door", { facing: "north", half, hinge, open: "false", powered: "false" });
}
g.set(4, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

// roof plant: a 2x2 mechanical box on the 13-tier, the valid 2x2 nearest the middle of that tier
const tall = [...TOP.entries()].filter(([, t]) => t === 13).map(([k]) => k.split(",").map(Number));
const cxT = tall.reduce((s, [x]) => s + x, 0) / tall.length, czT = tall.reduce((s, [, z]) => s + z, 0) / tall.length;
let best = null;
for (const [x, z] of tall) {
  const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => top(x + dx, z + dz) === 13 && !faces(x + dx, z + dz, 12).length);
  if (!ok) continue;
  const d = Math.abs(x + 0.5 - cxT) + Math.abs(z + 0.5 - czT);
  if (!best || d < best.d) best = { x, z, d };
}
if (best) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) for (let y = 13; y <= 14; y++) g.set(best.x + dx, y, best.z + dz, "smooth_stone");

const r = g.save(`${DIR}/DC58290.nbt`);
console.log(`DC58290: ${r.blocks} blocks, palette ${r.palette}, ${lit} lit windows, plant at ${best ? `${best.x},${best.z}` : "none"}`);
