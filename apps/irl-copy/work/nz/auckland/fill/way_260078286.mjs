// Mt Eden / Newton office block, Auckland (way 260078286): a 1970s reinforced-concrete office block, ten storeys on a
// stepped massing. Lidar roofs are median-smoothed and snapped to the 4-block storey grid; the outer rings are stepped
// in (the tall edge drops to 28 and 32) so the crown reads as tiers from the air. Ground floor is a shopfront under a
// stone lintel canopy, with a timber door in the bay nearest the lowest street ground. Facades are a 4-block storey
// rhythm: white floor band, two rows of tinted glass between white piers, a light-grey spandrel. Parapet with a cap,
// roof plant boxes with lanterns on the tower. Interiors are air with a floor slab per storey; some windows show glowstone.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260078286.cells.json", "utf8"));
const W = 48, D = 49, H = 53;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
// a one-cell sliver joined to the rest by a single side reads as a stray pillar once it is built up: leave it out
const slivers = cells.filter(([x, z]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => inside(x + dx, z + dz)).length <= 1);
for (const [x, z] of slivers) G[x][z] = -1;

// distance from the outside edge (1 on the outer ring), BFS through the footprint
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (!inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1)) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median of the 3x3 lidar roof, snapped to the storey grid, at least one storey above the ground under the cell,
// then stepped in at the edge: the outer ring tops out at 28, the next two at 32
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = Array.from({ length: W }, () => Array(D).fill(0));   // roof top (y of the roof block)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const gr = G[x][z], d = dist[x][z];
  let top = 4 * Math.round(median(x, z) / 4);
  if (d === 1) top = Math.min(top, 28);
  else if (d <= 3) top = Math.min(top, 32);
  T[x][z] = Math.max(top, gr + 4);
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const inwardOf = { N: "S", S: "N", W: "E", E: "W" };
// faces of a cell exposed at height y: beside the outside, or beside a neighbour whose roof is below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || T[nx][nz] <= y;
});
const isInteriorAir = (x, z, y) => inside(x, z) && y >= G[x][z] && y < T[x][z] && y !== G[x][z] && y % 4 !== 0 && exposed(x, z, y).length === 0;

// entrance: the outside-facing boundary cell with the lowest ground, its bay is the three cells along that face
let door = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  for (const k of ["N", "S", "W", "E"]) {
    const [dx, dz] = DIRS[k];
    if (!inside(x + dx, z + dz) && (!door || G[x][z] < door.g)) door = { x, z, face: k, g: G[x][z] };
  }
}
const bay = new Set();
if (door) {
  const along = door.face === "N" || door.face === "S" ? [1, 0] : [0, 1];
  for (const s of [-1, 0, 1]) {
    const x = door.x + along[0] * s, z = door.z + along[1] * s;
    if (inside(x, z) && exposed(x, z, G[x][z] + 1).includes(door.face)) bay.add(`${x},${z}`);
  }
}

const g = new Voxels([W, H, D]);
const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const DOOR_FACING = { N: "north", S: "south", W: "west", E: "east" };

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = T[x][z], d = dist[x][z];
  // foundation: solid from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey and on the ground floor
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    // the face the facade is laid out on: a north/south wall runs along x, an east/west wall along z
    const alongX = ex.includes("N") || ex.includes("S");
    const along = alongX ? x : z;
    const corner = ex.some(k => k === "N" || k === "S") && ex.some(k => k === "E" || k === "W");
    if (y === gr) { g.set(x, y, z, "polished_andesite"); continue; }   // base course

    const entranceBay = bay.has(`${x},${z}`);
    const row = y % 4, ground = y < gr + 4;
    if (entranceBay && ground && y === gr + 3) { g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }   // canopy over the door
    if (entranceBay && ground && (y === gr + 1 || y === gr + 2) && x === door.x && z === door.z) {
      const state = { facing: DOOR_FACING[door.face], hinge: "left", open: "false", powered: "false" };
      g.set(x, y, z, "oak_door", { ...state, half: y === gr + 1 ? "lower" : "upper" });
      continue;
    }
    if (row === 0) { g.set(x, y, z, "white_concrete"); continue; }                 // floor band
    if (row === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }            // spandrel
    // rows 1 and 2: glass between piers
    const pier = corner || along % 3 === 0;
    if (pier) { g.set(x, y, z, "white_concrete"); continue; }
    const state = alongX ? PANE_NS : PANE_EW;
    if (ground) g.set(x, y, z, "glass_pane", state);
    else g.set(x, y, z, "gray_stained_glass_pane", state);
    // a lit room behind some panes: glowstone in the air one cell inside the wall
    if (!ground && (x * 7 + z * 13 + y * 5) % 9 === 0) {
      const [dx, dz] = DIRS[inwardOf[ex[0]]];
      const ix = x + dx, iz = z + dz;
      if (isInteriorAir(ix, iz, y)) g.set(ix, y, iz, "glowstone");
    }
  }
  // roof: a deck on the top cell, a parapet with a cap on the outer ring
  g.set(x, top, z, "smooth_stone");
  if (d === 1) {
    g.set(x, top + 1, z, "white_concrete");
    g.set(x, top + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
  // plant boxes with a lantern on the core of the tower
  if (d >= 4 && top >= 32 && x % 7 === 3 && z % 7 === 3) {
    g.set(x, top + 1, z, "stone_bricks");
    g.set(x, top + 2, z, "stone_bricks");
    g.set(x, top + 3, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260078286.nbt";
const { blocks, palette } = g.save(out);
const tops = {}; for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) tops[T[x][z]] = (tops[T[x][z]] || 0) + 1;
console.log(`saved ${out}: ${blocks} blocks, ${palette} palette entries; roof tiers`, JSON.stringify(tops));
