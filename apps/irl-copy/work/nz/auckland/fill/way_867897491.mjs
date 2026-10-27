// Horizon Hotel (OSM way 867897491), Queen Street side of Auckland's CBD: a concrete-framed hotel of the 1970s-80s.
// Massing from the lidar roof: a tower core to y 51 (about 43 m), a two-cell setback ring to y 44 (the terrace the
// lidar's rim noise hides), and low wings where the lidar reads low (median-smoothed, rounded to storey lines).
// Storey lines sit at y = 3 + 4k, so every floor stands on the one below; the ground floor is glazed shopfront with a
// stone plinth, and the facade is a grid of glass panes in white concrete frames with grey spandrels.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_867897491.cells.json`, "utf8"));   // [x, z, ground, roof]
const [W, H, D] = [77, 64, 34];
const TOWER_TOP = 51, SETBACK_TOP = 44, RING = 2;

// N, S, W, E (outward normals): index 0 is the -z face the entrance sits on
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];

// the footprint, with each cell's lidar ground and roof
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, roof });
const at = (x, z) => foot.get(`${x},${z}`);

// smooth the lidar roof over the 3x3 neighbourhood (median), then sort into tower, setback and wings
const med = new Map();
for (const [x, z] of [...foot.keys()].map((k) => k.split(",").map(Number))) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = at(x + dx, z + dz); if (c) v.push(c.roof); }
  v.sort((a, b) => a - b); med.set(`${x},${z}`, v[Math.floor(v.length / 2)]);
}

// distance in cells from the outer edge (1 = on the edge)
const dist = new Map(); const queue = [];
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (DIRS.some(([dx, dz]) => !at(x + dx, z + dz))) { dist.set(k, 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i]; const d = dist.get(`${x},${z}`);
  for (const [dx, dz] of DIRS) {
    const k = `${x + dx},${z + dz}`;
    if (foot.has(k) && !dist.has(k)) { dist.set(k, d + 1); queue.push([x + dx, z + dz]); }
  }
}

// each cell's column: solid from y 0 up to top (foundation to ground, then the building)
const column = new Map();
for (const [k, { ground }] of foot) {
  const m = med.get(k), d = dist.get(k);
  const tower = m >= 46;
  const top = tower ? (d <= RING ? SETBACK_TOP : TOWER_TOP) : Math.max(8, Math.round(m / 4) * 4);
  column.set(k, { ground, top, tower, dist: d });
}
const col = (x, z) => column.get(`${x},${z}`);
const solid = (x, y, z) => { const c = col(x, z); return !!c && y >= 0 && y < c.top; };
const exposedFaces = (x, y, z) => DIRS.flatMap(([dx, dz], i) => (solid(x + dx, y, z + dz) ? [] : [i]));

const g = new Voxels([W, H, D]);
const lit = [];
for (const [k, c] of column) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.top; y++) {
    const faces = exposedFaces(x, y, z);
    if (y === c.top - 1) {                                  // the roof surface
      if (faces.length) g.set(x, y, z, "white_concrete");   // cornice / parapet at the edge
      else g.set(x, y, z, c.tower && c.dist <= RING ? "smooth_stone" : "stone");
      continue;
    }
    if (!faces.length) {                                    // inside: the foundation, and a floor slab per storey
      if (y < c.ground || y % 4 === 3) g.set(x, y, z, "stone");
      continue;                                             // the air above a floor is the gap behind the glass
    }
    const face = faces[0], u = face < 2 ? x : z;            // the facade grid runs along the face
    if (y < 3) { g.set(x, y, z, "stone_bricks"); continue; } // plinth
    if (y % 4 === 3) { g.set(x, y, z, "white_concrete"); continue; } // storey line / floor band
    if (u % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; } // frame piers, every third block
    if (y >= 7 && y % 4 === 2) { g.set(x, y, z, "light_gray_concrete"); continue; } // spandrel
    g.set(x, y, z, "light_blue_stained_glass");
    if (y % 4 === 0 && (x * 7 + z * 13 + y * 5) % 11 === 0) lit.push([x, y, z, face]);
  }
}

// warm light in some windows: the air cell behind the glass, resting on its floor slab
for (const [x, y, z, face] of lit) {
  const [dx, dz] = DIRS[face], ix = x - dx, iz = z - dz;
  if (!solid(ix, y, iz)) g.set(ix, y, iz, "glowstone");
}

// the entrance on the -z face, under a dark timber canopy, with a lantern beneath it
const ex = 40;
g.set(ex, 3, 0, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(ex, 4, 0, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [ex - 1, ex + 1]) for (const y of [3, 4]) g.set(x, y, 0, "stone_bricks");
for (let x = ex - 2; x <= ex + 2; x++) g.set(x, 6, 0, "dark_oak_planks");
g.set(ex, 5, 0, "lantern", { hanging: "true", waterlogged: "false" });

// roof plant: a grilled box on the tower roof, standing on the roof surface
for (let z = 14; z <= 19; z++) for (let x = 32; x <= 44; x++) {
  const c = col(x, z);
  if (!c || c.top !== TOWER_TOP || c.dist < 3) continue;
  const edge = x === 32 || x === 44 || z === 14 || z === 19;
  g.set(x, 51, z, "light_gray_concrete");
  if (!edge) continue;
  if (x % 2 === 0) g.set(x, 52, z, "iron_bars");
  else g.set(x, 52, z, "light_gray_concrete");
}

const stats = g.save(`${DIR}/way_867897491.nbt`);
console.log(`way_867897491: ${stats.blocks} blocks, ${stats.palette} palette entries, ${lit.length} lit windows`);
