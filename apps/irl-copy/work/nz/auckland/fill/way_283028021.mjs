// C-Vu Apartments, Auckland (way 283028021): a 2000s concrete-frame apartment block, ten storeys of 4-block floors to a
// flat roof at 42 on a dark basalt-look plinth. Cream render between light-grey floor bands and a cornice, blue-glass
// windows in three-bay runs with a render pier every fourth block, and a glazed lobby on the lowest street face with a
// canopy and hanging lantern. The top storey steps in one block from the outer ring (a terrace with a rail). The lidar's
// lower wings snap to their own cornices (36, 32, 28, 20). A one-block air gap sits behind the glass with a floor slab per
// storey; the core is solid. Some windows show warm light (glowstone or shroomlight) in the gap behind the pane.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_283028021.cells.json", "utf8"));
const W = 61, D = 37, H = 55;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance (1 on the outside ring), BFS through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const edge = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  if (edge) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median-smoothed lidar roof, snapped to the 4-block storey grid: the main block is 42, lower wings land on 36/32/28/20
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const Tt = Array.from({ length: W }, () => Array(D).fill(0));   // roof top of each column
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const r = median(x, z);
  Tt[x][z] = Math.max(r >= 40 ? 42 : 4 * Math.round(r / 4), G[x][z] + 8);
}

const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };
const SOLID = new Set(["found", "shell", "floor", "core", "membrane"]);
const along = (k, x, z) => (k === "N" || k === "S" ? x : z);   // position along the wall that faces k
const runArms = (k) => (k === "N" || k === "S"                  // a pane in a north/south wall joins east and west
  ? { east: "true", west: "true", north: "false", south: "false" }
  : { north: "true", south: "true", east: "false", west: "false" });
const outDirs = (x, z) => Object.keys(DIRS).filter(k => !inside(x + DIRS[k][0], z + DIRS[k][1]));

// what a cell is at height y: shell (the outer skin), gap (air behind the glass), floor, membrane, core, or nothing
const role = (x, z, y) => {
  if (!inside(x, z)) return "out";
  const g = G[x][z], T = Tt[x][z], d = dist[x][z];
  if (y < g) return "found";
  if (y >= T) return "none";
  if (T >= 42 && y === 36) return "floor";                      // top storey's floor: a terrace on the ring
  const sd = T >= 42 && y >= 37 ? 2 : 1;                         // the top storey steps in one block
  if (d < sd) return "none";
  if (d === sd) return "shell";
  if (d === sd + 1) return y === g || y % 4 === 0 || y === T - 1 ? "floor" : "gap";
  return y === T - 1 ? "membrane" : "core";
};
const BLOCK = { found: "polished_deepslate", floor: "light_gray_concrete", membrane: "gray_concrete", core: "smooth_quartz" };

// the entrance: the lowest street-facing shell cell, on its middle face (door, glazed lobby, canopy, lantern)
const ring = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && dist[x][z] === 1)
  for (const k of outDirs(x, z)) ring.push({ x, z, k });
const lowest = Math.min(...ring.map(c => G[c.x][c.z]));
const lowRing = ring.filter(c => G[c.x][c.z] === lowest);
const ent = lowRing[lowRing.length >> 1];
const entT = along(ent.k, ent.x, ent.z);
const onEntranceFace = (x, z, k) => k === ent.k && dist[x][z] === 1 && outDirs(x, z).includes(k) && Math.abs(along(k, x, z) - entT) <= 2;

const placements = [];                                            // [x, y, z, block, state]
const put = (x, y, z, block, state) => placements.push([x, y, z, block, state]);

// the outer skin: plinth, cornice, storey bands, glass in three-bay runs with a pier every fourth block
const facade = (x, z, y) => {
  const g = G[x][z], T = Tt[x][z];
  if (onEntranceFace(x, z, ent.k)) {
    const onDoor = x === ent.x && z === ent.z;
    if (onDoor && (y === g || y === g + 1)) return put(x, y, z, "dark_oak_door", { facing: FACING[ent.k], half: y === g ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    if (onDoor && y === g + 2) return put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
    if (y <= g + 2) return put(x, y, z, "gray_stained_glass_pane", runArms(ent.k));                              // lobby glazing
    if (y === g + 3 && Math.abs(along(ent.k, x, z) - entT) <= 1) return put(x, y, z, "light_gray_concrete");   // canopy
  }
  if (y === T - 1) return put(x, y, z, "light_gray_concrete");   // cornice
  if (y <= g + 1) return put(x, y, z, "polished_deepslate");     // basalt-look plinth
  if (y % 4 === 0) return put(x, y, z, "light_gray_concrete");   // storey band
  const ex = Object.keys(DIRS).filter(k => !SOLID.has(role(x + DIRS[k][0], z + DIRS[k][1], y)));   // faces to air or outside
  if (!ex.length) return put(x, y, z, "smooth_quartz");
  const k = ex[0], t = along(k, x, z);
  if (t % 4 === 0) return put(x, y, z, "smooth_quartz");        // render pier
  put(x, y, z, "light_blue_stained_glass_pane", runArms(k));
  // a warm light in some windows: in the gap behind the pane, standing on its floor
  const [dx, dz] = DIRS[k];
  if ((x * 31 + y * 17 + z * 13) % 9 === 0 && role(x - dx, z - dz, y) === "gap")
    put(x - dx, y, z - dz, (x + y) % 2 ? "glowstone" : "shroomlight");
};

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const T = Tt[x][z];
  for (let y = 0; y < T; y++) {
    const r = role(x, z, y);
    if (r === "shell") facade(x, z, y);
    else if (BLOCK[r]) put(x, y, z, BLOCK[r]);
  }
  // rail on the top storey's terrace edge, and roof plant on the main block
  if (T >= 42 && dist[x][z] === 1 && outDirs(x, z).length) put(x, 37, z, "iron_bars", runArms(outDirs(x, z)[0]));
  if (T >= 42 && dist[x][z] >= 5 && x % 7 === 3 && z % 5 === 2) { put(x, 42, z, "iron_block"); put(x, 43, z, "iron_block"); }
}

// the entrance's door, flanks and canopy are set by facade(); a placement the ring already wrote is overwritten, not doubled
const vox = new Voxels([W, H, D]);
for (const [x, y, z, block, state] of placements) vox.set(x, y, z, block, state);
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_283028021.nbt";
const { blocks, palette } = vox.save(out);
console.log(`way_283028021: ${blocks} blocks, ${palette} palette entries -> ${out}`);
