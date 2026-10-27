// way 332241951: a two-storey Edwardian brick shop block (c. 1915), Mt Eden village style: a stone plinth, a
// shopfront on the ground floor, upper sash windows between brick piers, a stone string course, and a
// stone-capped parapet over a flat roof with one plant box. The lidar roof reads 8-10 across the cells; the
// edge dips are noise, so the massing is one flat tier. Footprint cells only; interiors are air with floor slabs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_332241951.cells.json`, "utf8"));

const TOP = 10;                       // roof top above y 0 (lidar 8-10, smoothed to one tier)
const g = new Voxels([13, 23, 13]);

const key = (x, z) => `${x},${z}`;
const foot = new Set(cells.map(([x, z]) => key(x, z)));
const inF = (x, z) => foot.has(key(x, z));
const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };
const outFaces = (x, z) => Object.keys(OUT).filter((f) => !inF(x + OUT[f][0], z + OUT[f][1]));
const along = (x, z, f) => (f === "N" || f === "S" ? x : z);
const pane = (f) => (f === "N" || f === "S"
  ? { north: "false", south: "false", east: "true", west: "true" }
  : { north: "true", south: "true", east: "false", west: "false" });

// bays: the outline is a diagonal staircase (facets of 1-3 cells), so the bays run round the whole outline instead:
// walking the wall cells in order round the footprint, every fourth non-corner cell is a brick pier and the rest glass
const ringCx = cells.reduce((a, c) => a + c[0], 0) / cells.length, ringCz = cells.reduce((a, c) => a + c[1], 0) / cells.length;
const ring = cells.filter(([x, z]) => outFaces(x, z).length === 1)
  .sort((a, b) => Math.atan2(a[1] - ringCz, a[0] - ringCx) - Math.atan2(b[1] - ringCz, b[0] - ringCx));
const piers = new Set();
ring.forEach(([x, z], k) => { if (k % 4 === 0) piers.add(key(x, z)); });

// the street front: the face with the most single-face cells; the door sits on its middle non-pier cell
const faceCount = {};
for (const [x, z] of cells) { const fs = outFaces(x, z); if (fs.length === 1) faceCount[fs[0]] = (faceCount[fs[0]] ?? 0) + 1; }
const frontFace = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];
const frontCells = cells.filter(([x, z]) => { const fs = outFaces(x, z); return fs.length === 1 && fs[0] === frontFace && !piers.has(key(x, z)); });
const mid = cells.filter(([x, z]) => outFaces(x, z).includes(frontFace)).map(([x, z]) => along(x, z, frontFace)).sort((a, b) => a - b);
const medAlong = mid[Math.floor(mid.length / 2)];
const [dx, dz] = frontCells.reduce((best, c) => (Math.abs(along(c[0], c[1], frontFace) - medAlong) < Math.abs(along(best[0], best[1], frontFace) - medAlong) ? c : best));
const doorKey = key(dx, dz);

// one wall column: the perimeter cell's block at height y, by its place on the facade
function wallBlock(x, z, fs, y) {
  const f = fs[0];
  const corner = fs.length > 1;
  const pier = !corner && piers.has(key(x, z));
  if (y <= 1 || y === 5) return ["stone_bricks"];                 // plinth + base course, storey string course
  if (y === TOP - 1) return ["stone_brick_slab", { type: "bottom" }]; // coping
  if (corner) return ["stone_bricks"];                            // quoins
  if (pier) return ["bricks"];                                    // brick piers between the bays
  if (y === 4) return ["dark_oak_planks"];                        // shopfront fascia
  if (y === 8) return ["stone_bricks"];                           // upper lintel band
  if (doorKey === key(x, z) && f === frontFace && y <= 3) {       // the entrance, under the fascia canopy
    return y === 2
      ? ["dark_oak_door", { facing: FACING[f], half: "lower", hinge: "left", open: "false", powered: "false" }]
      : ["dark_oak_door", { facing: FACING[f], half: "upper", hinge: "left", open: "false", powered: "false" }];
  }
  return ["glass_pane", pane(f)];                                 // shop glass (y 2-3) and upper sash glass (y 6-7)
}

for (const [x, z] of cells) {
  const fs = outFaces(x, z);
  for (let y = 0; y < TOP; y++) {
    if (fs.length) { g.set(x, y, z, ...wallBlock(x, z, fs, y)); continue; }
    // interior: plinth, floor slabs for the ground floor, upper floor and roof; air between (no rooms)
    if (y === 0) g.set(x, y, z, "stone_bricks");
    else if (y === 1 || y === 5 || y === TOP - 1) g.set(x, y, z, "smooth_stone");
  }
}

// warm light behind some of the glass: a glowstone just inside a window, every third window round the outline
let lit = 0;
for (const [x, z] of ring) {
  if (piers.has(key(x, z)) || key(x, z) === doorKey) continue;
  const f = outFaces(x, z)[0];
  const [ix, iz] = [x - OUT[f][0], z - OUT[f][1]];
  if (!inF(ix, iz) || outFaces(ix, iz).length) continue;
  if (lit % 3 === 0) g.set(ix, 2, iz, "glowstone");
  else if (lit % 3 === 1) g.set(ix, 6, iz, "lantern", { hanging: "false", waterlogged: "false" });
  lit++;
}

// roof plant: a 2x2 iron box on the roof deck, set inboard of the parapet
const inset = (x, z) => [-1, 0, 1].every((a) => [-1, 0, 1].every((b) => inF(x + a, z + b)));
let plant = null, best = Infinity;
for (const [x, z] of cells) {
  if (!inset(x, z) || !inset(x + 1, z) || !inset(x, z + 1) || !inset(x + 1, z + 1)) continue;
  const d = Math.hypot(x - 6, z - 6);
  if (d < best) { best = d; plant = [x, z]; }
}
if (plant) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) g.set(plant[0] + i, TOP, plant[1] + j, "iron_block");

const out = `${DIR}/way_332241951.nbt`;
const r = g.save(out);
console.log(`front ${frontFace}, door ${doorKey}, plant ${plant}, blocks ${r.blocks}, palette ${r.palette}`);
