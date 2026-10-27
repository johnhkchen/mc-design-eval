// WW Building, Auckland CBD: a 1970s concrete-frame office block on a stone plinth. Lidar roofs snap to 4-block storeys
// (tiers at 8, 12, 16, 20, 24) with a plant room on the top tier; white piers frame blue-tinted glass panes; a lintel and
// door mark the entrance on the lowest street face. The shell is one block thick with an air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154109393.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154109393.nbt";
const SIZE = [49, 38, 29];

// Lidar roof heights become massing tiers: 1-3 blocks stay (low pavilions), taller ones snap to whole storeys.
// A tier is always at least one block above its ground.
const cells = new Map();
for (const [x, z, g, r] of JSON.parse(readFileSync(CELLS, "utf8"))) {
  const T = r <= 3 ? r : Math.min(24, 4 * Math.round(r / 4));
  cells.set(`${x},${z}`, { g, T: Math.max(T, g + 1) });
}
const at = (x, z) => cells.get(`${x},${z}`);
const NB = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const OPP = { W: "E", E: "W", N: "S", S: "N" };
const nb = (x, z, d) => [x + NB[d][0], z + NB[d][1]];
const edgeOf = (x, z, d) => !at(...nb(x, z, d));                           // the footprint's own edge (outside)
const airAbove = (x, z, d, y) => { const c = at(...nb(x, z, d)); return !c || y >= c.T; };

// The directions a wall cell faces at height y: its footprint edge, or else the lower roof it rises above (a setback).
function faceDirs(x, z, y) {
  const edge = Object.keys(NB).filter((d) => edgeOf(x, z, d));
  return edge.length ? edge : Object.keys(NB).filter((d) => airAbove(x, z, d, y));
}

// What a building cell is at (x, y, z), or null for air. Interiors are air except floor slabs and the roof deck.
function kindAt(x, z, y) {
  const c = at(x, z);
  if (!c || y < c.g || y >= c.T) return null;
  const dirs = faceDirs(x, z, y);
  if (!dirs.length) {
    if (y === c.T - 1) return "roof";
    if (y === c.g || y % 4 === 0) return "slab";
    return null;
  }
  if (y === c.T - 1) return "cornice";
  if (y === c.g) return "plinth";
  const axes = new Set(dirs.map((d) => (d === "W" || d === "E" ? "x" : "z")));
  if (axes.size > 1) return "pier";                                          // corner
  if (y % 4 === 0) return "band";
  if (y % 4 === 3) return "spandrel";
  const idx = axes.has("x") ? z : x;                                         // position along the facade
  return idx % 3 === 0 ? "pier" : "pane";
}

const MAT = {
  roof: "stone", slab: "smooth_stone", cornice: "smooth_quartz", plinth: "polished_andesite",
  band: "smooth_quartz", spandrel: "light_gray_concrete", pier: "white_concrete", found: "stone_bricks",
  plant: "light_gray_concrete",
};

// Pane arms join the neighbours along the facade (any building cell, not air), so a window band reads as one glass wall.
function paneState(x, z, y, dirs) {
  const axis = dirs.every((d) => d === "W" || d === "E") ? "x" : "z";
  const on = (dx, dz) => (kindAt(x + dx, z + dz, y) ? "true" : "false");
  if (axis === "x") return { north: on(0, -1), south: on(0, 1), east: "false", west: "false", waterlogged: "false" };
  return { north: "false", south: "false", east: on(1, 0), west: on(-1, 0), waterlogged: "false" };
}

const g = new Voxels(SIZE);

// 1. foundation, walls, floor slabs, roof deck and cornice
for (const [key, c] of cells) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < c.g; y++) g.set(x, y, z, MAT.found);
  for (let y = c.g; y < c.T; y++) {
    const kind = kindAt(x, z, y);
    if (!kind) continue;
    if (kind === "pane") {
      const dirs = faceDirs(x, z, y);
      g.set(x, y, z, "light_blue_stained_glass_pane", paneState(x, z, y, dirs));
      // a warm light on the floor just behind every third pane on the upper windows
      const inward = nb(x, z, OPP[dirs[0]]);
      const idx = dirs[0] === "W" || dirs[0] === "E" ? z : x;
      if (y % 4 === 1 && idx % 6 === 4 && !kindAt(...inward, y) && at(...inward)) {
        g.set(inward[0], y, inward[1], "glowstone");
      }
      continue;
    }
    g.set(x, y, z, MAT[kind]);
  }
}

// 2. the rooftop plant room on the top tier, a plinth with a low ring of walls
const plant = new Set();
for (const [key, c] of cells) {
  const [x, z] = key.split(",").map(Number);
  if (c.T === 24 && x >= 12 && x <= 16 && z >= 9 && z <= 14 && !Object.keys(NB).some((d) => edgeOf(x, z, d))) plant.add(key);
}
for (const key of plant) {
  const [x, z] = key.split(",").map(Number), c = at(x, z);
  g.set(x, c.T, z, MAT.plant);
  const ring = Object.keys(NB).some((d) => !plant.has(`${nb(x, z, d)[0]},${nb(x, z, d)[1]}`));
  if (ring) g.set(x, c.T + 1, z, MAT.plant);
}

// 3. the entrance: the street face with the lowest ground (at least 5 cells and a storey of height), its middle bay
const faces = {};
for (const [key, c] of cells) {
  const [x, z] = key.split(",").map(Number);
  const edge = Object.keys(NB).filter((d) => edgeOf(x, z, d));
  if (edge.length === 1 && c.T - c.g >= 4) (faces[edge[0]] ??= []).push({ x, z, g: c.g, T: c.T });
}
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const front = Object.keys(faces).filter((d) => faces[d].length >= 5)
  .sort((a, b) => mean(faces[a].map((c) => c.g)) - mean(faces[b].map((c) => c.g)))[0];
const along = (c) => (front === "W" || front === "E" ? c.z : c.x);
const ends = faces[front].map(along).sort((a, b) => a - b);
const mid = ends[Math.floor(ends.length / 2)];
const door = faces[front].filter((c) => Math.abs(along(c) - mid) <= 4)
  .sort((a, b) => a.g - b.g || Math.abs(along(a) - mid) - Math.abs(along(b) - mid))[0];
const facing = { W: "west", E: "east", N: "north", S: "south" }[front];
const doorState = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
g.set(door.x, door.g, door.z, "dark_oak_door", doorState("lower"));
g.set(door.x, door.g + 1, door.z, "dark_oak_door", doorState("upper"));
for (const c of faces[front]) if (Math.abs(along(c) - along(door)) <= 1) g.set(c.x, c.g + 2, c.z, MAT.cornice);   // lintel over the bay

const stats = g.save(OUT);
console.log(`WW Building: ${cells.size} footprint cells, ${stats.blocks} blocks, ${stats.palette} palette entries, door on ${front} face`);
