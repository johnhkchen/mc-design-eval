// Wynyard Car Park, Auckland (way 877996923): a precast-concrete multi-storey car park of the late 20th century, on the flat
// ground of the Wynyard Quarter. Lidar roofs sit at 28 (seven storeys) with an eastern section at 32 (eight): a 3x3 median,
// snapped to the 4-block storey grid. Ground floor is a retail base (stone course, glass shopfront, white piers); the decks
// above are open, screened by iron bars between light-grey piers, with glowstone behind some bays so the car park glows at
// dusk. Columns on a 6-block grid carry the floor slabs; the lift overrun sits on the roof. A vehicle door on the west face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_877996923.cells.json", "utf8"));
const W = 90, D = 78, TOP = 45;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, gr, r] of cells) { G[x][z] = gr; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

const DIRS = [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]];

// edge distance (1 on the outside ring), BFS through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (DIRS.some(([dx, dz]) => !inside(x + dx, z + dz))) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// lidar roof: 3x3 median, then snapped to the 4-block storey grid (8 to 32)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = Array.from({ length: W }, () => Array(D).fill(0));    // roof tier: the top surface, a multiple of 4
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) T[x][z] = Math.min(32, Math.max(8, 4 * Math.round(median(x, z) / 4)));
const top = (x, z) => (inside(x, z) ? T[x][z] : 0);

// faces of a cell exposed at height y: outside the footprint, or beside a neighbour whose tier stops below y
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || top(x + dx, z + dz) <= y);

// the entrance: the west face's main run, near its middle (a door cell and a passage cell side by side)
const wFace = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x - 1, z)) wFace.push([x, z]);
const perX = {};
for (const [x] of wFace) perX[x] = (perX[x] || 0) + 1;
const xe = +Object.keys(perX).sort((a, b) => perX[b] - perX[a])[0];
const run = wFace.filter(([x]) => x === xe).map(([, z]) => z).sort((a, b) => a - b);
const ze = run[run.length >> 1];
if (!inside(xe, ze + 1)) throw new Error("entrance passage cell is off the footprint");
const gE = G[xe][ze];
const nearEntrance = (x, z) => Math.abs(z - ze) <= 1 && x >= xe && x - xe <= 4;

// structural columns on a 6-block grid, inside the envelope (they carry the floor slabs and the roof over the air)
const colAt = (x, z) => dist[x][z] >= 2 && x % 6 === 3 && z % 6 === 3 && !nearEntrance(x, z);

const PANE = (face) => (face === "N" || face === "S")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const g = new Voxels([W, TOP, D]);

// pass 1: the envelope, decks and columns, cell by cell
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], t = T[x][z], d = dist[x][z], col = colAt(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");      // foundation: solid from y 0 up to the ground
  for (let y = gr; y < t; y++) {
    const ex = exposed(x, z, y), shell = ex.length > 0, ground = y < 4;
    if (y === t - 1) {                                              // roof deck; a cornice on the outer ring
      g.set(x, y, z, shell && d === 1 ? "white_concrete" : "smooth_stone");
      continue;
    }
    if (ground && y === gr) {                                       // ground-floor base course
      if (shell) g.set(x, y, z, "stone_bricks");
      else if (col) g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (y % 4 === 0) {                                              // storey line: a floor slab, or the white spandrel on the face
      g.set(x, y, z, col ? "light_gray_concrete" : shell ? "white_concrete" : "smooth_stone");
      continue;
    }
    if (!shell) { if (col) g.set(x, y, z, "light_gray_concrete"); continue; }
    if (ex.length >= 2) { g.set(x, y, z, ground ? "white_concrete" : "light_gray_concrete"); continue; }   // corner pier
    const [, , face] = ex[0];
    const s = face === "N" || face === "S" ? x : z;                 // position along the face: 3-block bays
    if (s % 3 === 0) { g.set(x, y, z, ground ? "white_concrete" : "light_gray_concrete"); continue; }
    g.set(x, y, z, ground ? "glass_pane" : "iron_bars", PANE(face));  // shopfront glass below, deck screens above
  }
}

// parapet on the outer ring
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && dist[x][z] === 1) g.set(x, T[x][z], z, "white_concrete");

// pass 2: glowstone behind some upper-deck bays (inside the air, on the slab below), so the deck shows warm at dusk
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || dist[x][z] !== 1) continue;
  for (let y = 5; y < T[x][z] - 1; y += 4) {
    const ex = exposed(x, z, y);
    if (ex.length !== 1) continue;
    const [dx, dz, face] = ex[0];
    const s = face === "N" || face === "S" ? x : z;
    if (s % 3 !== 1 || (Math.floor(s / 3) + y) % 3 !== 0) continue;
    const ix = x - dx, iz = z - dz;
    if (inside(ix, iz) && dist[ix][iz] >= 2 && !colAt(ix, iz) && !nearEntrance(ix, iz)) g.set(ix, y, iz, "glowstone");
  }
}

// the entrance: iron door on the door cell, an open passage beside it, a white lintel over both
g.set(xe, gE, ze, "iron_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(xe, gE + 1, ze, "iron_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const z of [ze, ze + 1]) g.set(xe, gE + 2, z, "white_concrete");
g.set(xe, gE, ze + 1, "air"); g.set(xe, gE + 1, ze + 1, "air");

// lift overrun: a solid core, 6 by 4 blocks, on the 32 roof where the deck is deepest into the building
let best = null;
for (let x0 = 0; x0 <= W - 6; x0++) for (let z0 = 0; z0 <= D - 4; z0++) {
  let ok = true, sum = 0;
  for (let x = x0; x < x0 + 6 && ok; x++) for (let z = z0; z < z0 + 4; z++) {
    if (!inside(x, z) || T[x][z] !== 32 || dist[x][z] < 4) { ok = false; break; }
    sum += dist[x][z];
  }
  if (ok && (!best || sum > best.sum)) best = { x0, z0, sum };
}
if (best) {
  const y0 = 32;
  for (let x = best.x0; x < best.x0 + 6; x++) for (let z = best.z0; z < best.z0 + 4; z++) {
    for (let y = y0; y < y0 + 3; y++) g.set(x, y, z, y === y0 + 2 ? "white_concrete" : "light_gray_concrete");
    g.set(x, y0 + 3, z, "smooth_stone");
  }
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_877996923.nbt");
console.log("way 877996923 Wynyard Car Park:", stats, "entrance", { xe, ze }, "lift core", best);
