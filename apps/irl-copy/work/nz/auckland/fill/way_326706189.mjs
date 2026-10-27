// Saint Benedict's Church, Auckland (Mt Eden / Eden Terrace side of the CBD view from Maungawhau).
// Read from the lidar: a 42 x 53 footprint, a flat-topped nave/aisle mass stepping between 8 and 24 blocks
// (about 2 to 6 storeys of 4), a taller 5 x 5 tower over the highest cluster, and a Gothic Revival read: cream
// rendered walls, stone-brick pilasters and window heads, lancet-proportioned glazing with warm glass, a slate roof
// behind a parapet, and a stepped spire. Lidar roofs are followed cell by cell and smoothed into flat tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_326706189.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const W = 42, D = 53;
const ground = Array.from({ length: W }, () => Array(D).fill(-1));
const roof = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z, g, r] of cells) { ground[x][z] = g; roof[x][z] = r; }
const inside = (x, z) => x >= 0 && x < W && z >= 0 && z < D && ground[x][z] >= 0;

// Lidar noise -> flat tiers on the storey grid (4 blocks), 8 to 24 high; the 3 x 3 mean keeps the massing honest
const tier = (v) => Math.min(24, Math.max(8, Math.round(v / 4) * 4));
const smoothed = (x, z) => {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) { s += roof[x + dx][z + dz]; n++; }
  return s / n;
};
const top = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) top[x][z] = tier(smoothed(x, z));

// The tower: the 5 x 5 square wholly on the footprint with the highest lidar roof; its roof is lifted to one tier
let best = null;
for (let cx = 2; cx < W - 2; cx++) for (let cz = 2; cz < D - 2; cz++) {
  let ok = true, s = 0;
  for (let dx = -2; dx <= 2 && ok; dx++) for (let dz = -2; dz <= 2; dz++) { if (!inside(cx + dx, cz + dz)) { ok = false; break; } s += smoothed(cx + dx, cz + dz); }
  if (ok && (!best || s > best.s)) best = { cx, cz, s };
}
const tx = best.cx, tz = best.cz;
let Tt = 0;
for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) Tt = Math.max(Tt, top[tx + dx][tz + dz]);
for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) top[tx + dx][tz + dz] = Tt;

const SPIRE = 12;                       // the spire rises above the tower roof
const H = Tt + SPIRE + 2;
const V = new Voxels([W, H, D]);
const set = (x, y, z, block, state) => V.set(x, y, z, block, state);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the outward faces a voxel at height y shows: outside the footprint, or above a lower neighbour's roof
const faces = (x, z, y) => DIRS.filter(([dx, dz]) => { const nx = x + dx, nz = z + dz; return !inside(nx, nz) || top[nx][nz] <= y; });

const ENTRY = { x: 22, z: 0 };          // the door on the z = 0 face, centred in the bay the lidar shows open at the front
const isTower = (x, z) => Math.abs(x - tx) <= 2 && Math.abs(z - tz) <= 2;

function facade(x, y, z, fd) {
  if (fd.length >= 2) return ["stone_bricks"];                                  // corners: stone pilasters
  const [dx, dz] = fd[0];
  const xFace = dx !== 0;
  const u = xFace ? z : x;                                                        // position along the face
  const row = y % 4;                                                              // 0 string course, 1-2 glass, 3 head
  if (z === ENTRY.z && x >= 21 && x <= 23 && y >= 5 && y <= 7) {                  // entrance: stone portal, oak door
    if (x === 22 && y <= 6) return ["dark_oak_door", { facing: "north", half: y === 5 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
    return ["stone_bricks"];
  }
  if (row === 0) return ["smooth_stone"];                                         // storey string course
  if (u % 5 === 0) return ["stone_bricks"];                                       // buttress pilasters on every bay line
  if (u % 5 === 4) return ["white_concrete"];
  if (row === 3) return ["stone_bricks"];                                         // window head
  const lit = (Math.floor(u / 5) + Math.floor(y / 4)) % 3 === 0;                  // warm glass in some windows
  const pane = lit ? "yellow_stained_glass_pane" : "light_blue_stained_glass_pane";
  const conn = xFace ? { north: "true", south: "true", east: "false", west: "false" }
                     : { east: "true", west: "true", north: "false", south: "false" };
  return [pane, { ...conn, waterlogged: "false" }, lit ? [dx, dz] : null];
}

// Podium: solid from y 0 to the storey line under the first floor (lowest ground to the entrance floor)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  for (let y = 0; y < 4; y++) set(x, y, z, "stone_bricks");
}

const lamps = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const t = top[x][z];
  for (let y = 4; y < t; y++) {
    const fd = faces(x, z, y);
    if (y === t - 1) { set(x, y, z, fd.length ? "smooth_stone" : "deepslate_tiles"); continue; }   // cornice / slate roof deck
    if (fd.length === 0) { if (y % 4 === 0) set(x, y, z, "stone_bricks"); continue; }           // interior: air, floor slab per storey
    const [block, state, lamp] = facade(x, y, z, fd);
    set(x, y, z, block, state);
    if (lamp) lamps.push([x - lamp[0], y, z - lamp[1]]);                                         // glowstone behind the lit glass
  }
  if (faces(x, z, t - 1).length) set(x, t, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // parapet
}

// Glowstone behind the lit panes, only where the space is open (interior air)
for (const [x, y, z] of lamps) if (inside(x, z) && top[x][z] > y && faces(x, z, y).length === 0) set(x, y, z, "glowstone");

// Belfry: the tower's middle opening on each face, two rows high, with stone heads above
for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
  const x = tx + dx, z = tz + dz;
  const edge = Math.abs(dx) === 2 || Math.abs(dz) === 2;
  if (!edge || (Math.abs(dx) === 2 && Math.abs(dz) === 2)) continue;
  const centred = Math.abs(dx) === 2 ? dz === 0 : dx === 0;
  if (!centred) continue;
  set(x, Tt - 7, z, "air"); set(x, Tt - 6, z, "air");
  set(x, Tt - 5, z, "stone_bricks");
}

// The spire: pyramid of deepslate tiles over the tower's roof, narrowing to a needle, a lightning-rod cross on top
for (let dy = 0; dy < SPIRE; dy++) {
  const w = dy < 6 ? Math.max(0, 2 - Math.floor(dy / 2)) : 0;
  for (let dx = -w; dx <= w; dx++) for (let dz = -w; dz <= w; dz++) set(tx + dx, Tt + dy, tz + dz, "deepslate_tiles");
}
set(tx, Tt + SPIRE, tz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const summary = V.save(`${HERE}/way_326706189.nbt`);
console.log(JSON.stringify({ footprint: cells.length, tower: { cx: tx, cz: tz, top: Tt }, height: H, ...summary }));
