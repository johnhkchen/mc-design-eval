// Prisoner Services, Auckland (way 326340906): a 1970s government office block, five storeys over a basalt plinth, with two
// six-storey wings (a 24-block tier, setback to 20 at its edge) and a low three-storey wing to the south. The lidar roof is
// median-smoothed and snapped to the 4-block storey grid: 24 (wings), 20 (main body), 16 and 12 (low wings). Facades are a
// 4-block storey rhythm: white bands at each floor line and head, light-grey concrete piers every third block, tinted glass
// panes between them, deepslate plinth at the ground. A dark-oak entrance with a glass lobby on the west face and a hanging
// lantern under the lintel. Some windows have glowstone just behind the glass. Roof: grey membrane, cornice and parapet on
// the outer ring, a plant room on each tower. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326340906.cells.json", "utf8"));
const W = 45, D = 62, TOP = 38;
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const G = grid(-1), R = grid(0);                                 // ground (foundation height), lidar roof, -1 = not footprint
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance (1 on the outside ring), BFS through the footprint
const dist = grid(0), queue = [];
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

// median-smoothed roof, then tiers on the storey grid; the tower wings set back to 20 at their edge
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tierOf = (r) => (r >= 23 ? 24 : r >= 18 ? 20 : r >= 16 ? 16 : 12);
const H = grid(0);                                              // roof surface: building occupies y < H
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  let h = tierOf(median(x, z));
  if (h === 24 && dist[x][z] <= 2) h = 20;
  H[x][z] = h;
}
// no lone spikes: a cell with at most one neighbour as tall as it drops to its tallest neighbour
const spikes = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => (inside(x + dx, z + dz) ? H[x + dx][z + dz] : 0));
  if (nb.filter((h) => h >= H[x][z]).length <= 1) spikes.push([x, z, Math.max(...nb)]);
}
for (const [x, z, h] of spikes) H[x][z] = h;

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter((k) => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});

// the entrance: a west-face wall cell at the ground, nearest the middle of the block's west side
let door = null, best = Infinity;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || G[x][z] > 0 || H[x][z] < 16 || !exposed(x, z, 1).includes("W")) continue;
  const score = x * 2 + Math.abs(z - 12);
  if (score < best) { best = score; door = [x, z]; }
}
const lobby = new Set();
if (door) for (const dz of [-1, 1]) lobby.add(`${door[0]},${door[1] + dz}`);

const g = new Voxels([W, TOP, D]);
const glassAt = [];                                             // [x, y, z, face] of each glass pane, for the lit ones

// a facade block in a wall cell: y%4 == 0 is a floor line, 1-2 glass and piers, 3 the head band; the ground storey has a plinth
const wallBlock = (x, z, y, faces) => {
  const face = faces[0];
  const along = face === "N" || face === "S" ? x : z;
  const corner = faces.length > 1;
  if (y === 0) return ["deepslate_bricks"];                                // ground-storey plinth
  if (y % 4 === 0 || y % 4 === 3) return ["white_concrete"];              // floor line and head band
  if (!corner && along % 3 === 0 && !lobby.has(`${x},${z}`)) return ["light_gray_concrete"];
  glassAt.push([x, y, z, face]);
  const ns = face === "N" || face === "S";
  return ["gray_stained_glass_pane", { north: String(!ns), south: String(!ns), east: String(ns), west: String(ns), waterlogged: "false" }];
};

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], d = dist[x][z];
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");             // foundation: solid from y 0 up to the ground
  for (let y = gr; y < top; y++) {
    const faces = exposed(x, z, y);
    if (faces.length === 0) {                                              // interior: air, with a floor slab per storey
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const [block, state] = wallBlock(x, z, y, faces);
    g.set(x, y, z, block, state);
  }
  g.set(x, top, z, "gray_concrete");                                       // roof membrane
  if (d === 1) { g.set(x, top, z, "smooth_stone"); g.set(x, top + 1, z, "light_gray_concrete"); }   // cornice, parapet
}

// the entrance: dark-oak door in the middle of the lobby, a hanging lantern under the lintel
if (door) {
  const [x, z] = door, face = "W";
  const state = (half) => ({ facing: FACING[face], half, hinge: "left", open: "false", powered: "false" });
  g.set(x, 0, z, "dark_oak_door", state("lower"));
  g.set(x, 1, z, "dark_oak_door", state("upper"));
  g.set(x, 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  for (const [lx, lz] of [[x, z - 1], [x, z + 1]]) {
    if (!inside(lx, lz)) continue;
    g.set(lx, 1, lz, "gray_stained_glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    g.set(lx, 2, lz, "gray_stained_glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
  }
}

// warm light behind some panes: a glowstone in the air just inside the glass (one pane in nine)
for (const [x, y, z, face] of glassAt) {
  if ((x * 7 + z * 13 + y * 5) % 9 !== 0) continue;
  const [dx, dz] = DIRS[face], ix = x - dx, iz = z - dz;
  if (!inside(ix, iz) || exposed(ix, iz, y).length || g.val(ix, y, iz)) continue;
  g.set(ix, y, iz, "glowstone");
}

// roof plant rooms: a solid 3 x 3 box, two blocks high, on the flat top of each tower wing (the largest 24-block tiers)
const seen = grid(false), wings = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && H[x][z] === 24 && !seen[x][z]) {
  const comp = [[x, z]]; seen[x][z] = true;
  for (let i = 0; i < comp.length; i++) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = comp[i][0] + dx, nz = comp[i][1] + dz;
    if (inside(nx, nz) && !seen[nx][nz] && H[nx][nz] === 24) { seen[nx][nz] = true; comp.push([nx, nz]); }
  }
  if (comp.length >= 30) wings.push(comp);
}
for (const comp of wings) {
  const cx = comp.reduce((s, [x]) => s + x, 0) / comp.length, cz = comp.reduce((s, [, z]) => s + z, 0) / comp.length;
  let pick = null, pd = Infinity;
  for (const [x, z] of comp) {
    let ok = true;
    for (let dx = -2; dx <= 2 && ok; dx++) for (let dz = -2; dz <= 2 && ok; dz++) if (!(inside(x + dx, z + dz) && H[x + dx][z + dz] === 24 && dist[x + dx][z + dz] >= 3)) ok = false;
    const dd = Math.hypot(x - cx, z - cz);
    if (ok && dd < pd) { pd = dd; pick = [x, z]; }
  }
  if (!pick) continue;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    for (let y = 24; y <= 25; y++) g.set(pick[0] + dx, y, pick[1] + dz, "light_gray_concrete");
    g.set(pick[0] + dx, 26, pick[1] + dz, "smooth_stone");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326340906.nbt");
