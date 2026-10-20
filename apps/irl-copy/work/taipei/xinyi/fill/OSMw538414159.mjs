import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538414159.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538414159.nbt";

const W = 23, H = 23, D = 10;

// Era and type: no record, so a low-rise 1980s-90s Taipei commercial block:
// two storeys of pale tiled quartz walls, white piers, glazed shopfronts,
// a red fascia band at the front, a parapet cap and rooftop plant.
const FOUND = "stone_bricks";
const WALL = "smooth_quartz";
const PIER = "quartz_pillar";
const CAP = "smooth_quartz_slab";
const FLOOR = "smooth_stone";
const ROOF = "gray_concrete";
const GLASS = "glass";
const FASCIA = "red_terracotta";
const GLOW = "glowstone";
const LANTERN = "lantern";
const PLANT = "light_gray_concrete";

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const list = (Array.isArray(raw) ? raw : (raw.cells ?? []))
  .map(c => (Array.isArray(c) ? c : [c.x, c.z, c.ground]));

const minG = Math.min(...list.map(c => c[2]));
const ground = new Map();
for (const [x, z, gr] of list) ground.set(`${x},${z}`, gr - minG);

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const set = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!has(x, z) && !(x >= 0 && z >= 0)) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

const DIRS = [
  { n: "north", dx: 0, dz: -1, along: "x" },
  { n: "south", dx: 0, dz: 1, along: "x" },
  { n: "west", dx: -1, dz: 0, along: "z" },
  { n: "east", dx: 1, dz: 0, along: "z" },
];

const isInterior = (x, z) => has(x, z) && DIRS.every(d => has(x + d.dx, z + d.dz));

// Pass 1: foundations, floors, walls, piers, glazing, fascia, parapet, roof.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = DIRS.filter(d => !has(x + d.dx, z + d.dz));
  const perim = faces.length > 0;

  // Foundation under the cell, so nothing floats on a slope.
  for (let y = 0; y < gr; y++) set(x, y, z, FOUND);

  if (!perim) {
    set(x, gr, z, FLOOR);       // ground floor slab
    set(x, gr + 5, z, FLOOR);   // upper floor slab
    set(x, gr + 10, z, ROOF);   // roof slab
    continue;
  }

  // Solid perimeter wall from ground to the roof slab level.
  for (let y = gr; y <= gr + 10; y++) set(x, y, z, WALL);
  // Parapet cap.
  set(x, gr + 11, z, CAP, { type: "bottom", waterlogged: "false" });

  const pier = faces.length > 1 || faces.some(d => (d.along === "x" ? x : z) % 3 === 0);

  if (pier) {
    for (let y = gr; y <= gr + 10; y++) set(x, y, z, PIER, { axis: "y" });
  } else {
    // Glazing on ground and upper storeys.
    for (const y of [gr + 1, gr + 2, gr + 3, gr + 6, gr + 7, gr + 8]) set(x, y, z, GLASS);
    // Red fascia band over the shopfronts on the street (north) face.
    if (faces.some(d => d.n === "north")) set(x, gr + 4, z, FASCIA);
  }
}

// Pass 2: door on the north front, lights behind glass, roof plant.
const doorCandidates = [];
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (z !== 0) continue;
  if (x % 3 === 0 || x === 0 || x === W - 1) continue;
  doorCandidates.push({ x, gr, dist: Math.abs(x - 11) });
}
doorCandidates.sort((a, b) => a.dist - b.dist);
if (doorCandidates.length) {
  const { x: dx, gr } = doorCandidates[0];
  g.set(dx, gr + 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, gr + 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = DIRS.filter(d => !has(x + d.dx, z + d.dz));
  if (!faces.length) continue;
  const pier = faces.length > 1 || faces.some(d => (d.along === "x" ? x : z) % 3 === 0);
  if (pier) continue;

  for (const d of faces) {
    const a = d.along === "x" ? x : z;
    const ix = x - d.dx, iz = z - d.dz; // inward cell
    if (!isInterior(ix, iz)) continue;
    if (a % 6 === 1) {
      set(ix, gr + 7, iz, GLOW);            // warm light in upper storey
    }
    if (d.n === "north" && a % 6 === 4) {
      set(ix, gr + 4, iz, LANTERN, { hanging: "true", waterlogged: "false" });
    }
  }
}

// Roof: gray roof surface with a few plant boxes.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!isInterior(x, z)) continue;
  if (x % 7 === 3 && z % 4 === 2) {
    set(x, gr + 11, z, PLANT);
    set(x, gr + 12, z, PLANT);
  }
}

// Re-assert door cells in case the glazing pass overwrote them.
if (doorCandidates.length) {
  const { x: dx, gr } = doorCandidates[0];
  g.set(dx, gr + 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, gr + 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

g.save(OUT);
