// way/810360600: a 1970s reinforced-concrete office block on a ground-floor shopfront base, Auckland CBD edge.
// Massing from the lidar roof heights, quantised to three setback tiers (36, 44, 52) so each tier stands on the
// one below; a 4-block storey with a solid floor slab per storey, a 1-cell shell with air behind the glass, a
// plant room on the top tier. Facade: white concrete piers on a 3-block bay, blue glass with grey spandrels,
// a shopfront with a door and canopy on the longest street face, and a few lit windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_810360600.cells.json", "utf8"));

const SIZE = [27, 65, 28];
const BASE = 8;                                     // the ground floor's slab: the plinth runs from each cell's ground up to here
const tierOf = (roof) => (roof < 44 ? 36 : roof < 50 ? 44 : 52);

const F = new Map();                                // "x,z" -> { ground, top }
for (const [x, z, ground, roof] of cells) F.set(`${x},${z}`, { ground, top: tierOf(roof) });

// lidar noise: a one-cell spike of a higher tier reads as a pole, so each cell takes the most common tier of its
// 3x3 neighbourhood (ties go down), twice
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const [key, c] of F) {
    const [x, z] = key.split(",").map(Number), votes = {};
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const n = F.get(`${x + dx},${z + dz}`); if (n) votes[n.top] = (votes[n.top] || 0) + 1;
    }
    const top = Number(Object.keys(votes).sort((a, b) => votes[b] - votes[a] || a - b)[0]);
    next.set(key, { ground: c.ground, top });
  }
  F.clear(); for (const [k, v] of next) F.set(k, v);
}
const topAt = (x, z) => (F.has(`${x},${z}`) ? F.get(`${x},${z}`).top : -1);

// the outward faces of a cell at height y: any side with no neighbour standing that high
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z, y) => Object.keys(DIRS).filter(d => topAt(x + DIRS[d][0], z + DIRS[d][1]) <= y);

// the entrance: the street face with the most wall at ground level, its middle cell
const faceLen = Object.fromEntries(Object.keys(DIRS).map(d => [d, 0]));
for (const [key, c] of F) { const [x, z] = key.split(",").map(Number); if (c.top > 9) for (const d of exposed(x, z, 9)) faceLen[d]++; }
const entranceDir = Object.keys(faceLen).sort((a, b) => faceLen[b] - faceLen[a])[0];
const entranceCells = [...F.keys()].map(k => k.split(",").map(Number))
  .filter(([x, z]) => F.get(`${x},${z}`).top > 9 && exposed(x, z, 9).includes(entranceDir));
const alongOf = ([x, z]) => (entranceDir === "N" || entranceDir === "S" ? x : z);
const ent = entranceCells.sort((a, b) => alongOf(a) - alongOf(b))[Math.floor(entranceCells.length / 2)];
const entKey = `${ent[0]},${ent[1]}`;

const g = new Voxels(SIZE);
const DIRNAME = { N: "north", S: "south", W: "west", E: "east" };
const glass = "light_blue_stained_glass", pier = "white_concrete", slab = "light_gray_concrete";
const hash = (x, y, z) => (x * 7 + y * 13 + z * 29) % 11;

for (const [key, { ground, top }] of F) {
  const [x, z] = key.split(",").map(Number);

  // foundation under the ground, then a stone base course up to the ground floor's slab
  for (let y = 0; y < BASE; y++) g.set(x, y, z, y < 4 ? "stone_bricks" : "polished_andesite");

  for (let y = BASE; y <= top; y++) {
    if (y % 4 === 0) { g.set(x, y, z, slab); continue; }    // floor slab (and the roof at the tier's top)
    if (y >= top) continue;
    const out = exposed(x, z, y);
    if (!out.length) continue;                              // interior: air behind the glass
    const r = y % 4, groundFloor = y < 12;
    const corner = out.includes("N") || out.includes("S") ? (out.includes("E") || out.includes("W")) : false;
    const dir = out.includes("N") || out.includes("S") ? out.find(d => d === "N" || d === "S") : out[0];
    const u = dir === "N" || dir === "S" ? x : z;
    if (key === entKey && (y === 9 || y === 10)) {          // the door, two blocks tall
      g.set(x, y, z, "dark_oak_door", { facing: DIRNAME[dir], half: y === 9 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (corner || u % 3 === 0) { g.set(x, y, z, pier); continue; }
    if (groundFloor && r === 3) { g.set(x, y, z, "gray_concrete"); continue; }   // shopfront transom
    if (!groundFloor && r === 1) { g.set(x, y, z, "gray_concrete"); continue; }  // spandrel under each window band
    const lit = r === 2 && hash(x, y, z) === 0;
    g.set(x, y, z, lit ? "glowstone" : glass);
  }

  // parapet on the roof edge of each tier
  if (exposed(x, z, top).length) g.set(x, top + 1, z, pier);
}

// the entrance canopy: a dark lintel over the door and the bays either side of it
const [ex, ez] = ent;
for (const [dx, dz] of entranceDir === "N" || entranceDir === "S" ? [[-1, 0], [0, 0], [1, 0]] : [[0, -1], [0, 0], [0, 1]]) {
  const x = ex + dx, z = ez + dz;
  if (F.has(`${x},${z}`)) g.set(x, 11, z, "dark_oak_planks");
}

// roof plant: a solid box on the top tier, on cells whose four neighbours are on the top tier too
const top52 = [...F.keys()].map(k => k.split(",").map(Number))
  .filter(([x, z]) => topAt(x, z) === 52 && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => topAt(x + dx, z + dz) >= 52));
const minX = Math.min(...top52.map(c => c[0])), minZ = Math.min(...top52.map(c => c[1]));
for (const [x, z] of top52) {
  if (x >= minX + 2 && x <= minX + 7 && z >= minZ + 2 && z <= minZ + 7) {
    g.set(x, 53, z, "light_gray_concrete");
    g.set(x, 54, z, "light_gray_concrete");
    g.set(x, 55, z, "gray_concrete");
  }
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_810360600.nbt");
console.log(`entrance ${entranceDir} at ${entKey}; ${stats.blocks} blocks, ${stats.palette} palette entries`);
