// Fiore on Hobson (way 260083815): a 12-storey mid-2000s office and apartment block on a podium. The roof is the
// lidar's: a 3x3 median smooths the noise, then each cell snaps to a tier (11 / 19 / 27 / 35 / 43 / 51 blocks, all on the
// storey lines 7 + 4k), so the massing steps down from a tower core through two setbacks to the one-storey edges.
// Facades: stone plinth, white concrete body, light-grey spandrels, glass panes between grey mullions, a shopfront
// on the ground floor, a door with a hood. Interiors are air, with a slab per storey and a roof slab per tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260083815.cells.json", "utf8"));
const W = 62, D = 47, H = 73, FLOOR0 = 7;
const idx = (x, z) => z * W + x;
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[idx(x, z)] !== null;

const G = new Array(W * D).fill(null), R = new Array(W * D).fill(null);
for (const [x, z, ground, roof] of cells) { G[idx(x, z)] = ground; R[idx(x, z)] = roof; }

// 3x3 median of the lidar roof over footprint neighbours: single-cell noise (edge zeros, stray spikes) goes
const Rs = new Array(W * D).fill(null);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) v.push(R[idx(x + dx, z + dz)]);
  v.sort((a, b) => a - b); Rs[idx(x, z)] = v[(v.length - 1) >> 1];
}

// roof height -> the storey line it stands on (7 + 4k): 11 storeys at the tower, then setbacks
const topOf = (r) => (r >= 49 ? 51 : r >= 39 ? 43 : r >= 27 ? 35 : r >= 19 ? 27 : r >= 11 ? 19 : 11);
// then the tiers themselves take a 3x3 median, so one-cell towers and notches become the tier around them
const T0 = new Array(W * D).fill(null), T = new Array(W * D).fill(null);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inF(x, z)) T0[idx(x, z)] = topOf(Rs[idx(x, z)]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) v.push(T0[idx(x + dx, z + dz)]);
  v.sort((a, b) => a - b); T[idx(x, z)] = v[(v.length - 1) >> 1];
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIRNAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
// envelope: an outside wall, or a step down to a lower tier; ring = touches the outside (gets a parapet)
const env = new Array(W * D).fill(false), ring = new Array(W * D).fill(false), normal = new Array(W * D).fill(null);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const i = idx(x, z), out = [], step = [];
  for (const [dx, dz] of DIRS) {
    if (!inF(x + dx, z + dz)) out.push([dx, dz]);
    else if (T[idx(x + dx, z + dz)] < T[i]) step.push([dx, dz]);
  }
  if (out.length || step.length) env[i] = true;
  ring[i] = out.length > 0;
  normal[i] = out[0] || step[0] || null;
}

// BFS distance inside the footprint from the envelope, for the roof plant's clearance from the edge
const dist = new Array(W * D).fill(-1), queue = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inF(x, z) && env[idx(x, z)]) { dist[idx(x, z)] = 0; queue.push([x, z]); }
for (let q = 0; q < queue.length; q++) {
  const [x, z] = queue[q];
  for (const [dx, dz] of DIRS) if (inF(x + dx, z + dz) && dist[idx(x + dx, z + dz)] < 0) {
    dist[idx(x + dx, z + dz)] = dist[idx(x, z)] + 1; queue.push([x + dx, z + dz]);
  }
}

const g = new Voxels([W, H, D]);
const panes = [];
const pane = (x, y, z) => { g.set(x, y, z, "light_blue_stained_glass_pane"); panes.push([x, y, z]); };

// facade material for a wall cell at height y; a = the coordinate running along its face (bays every 3)
function facade(y, a) {
  if (y < FLOOR0) return ["stone_bricks"];
  const r = (y - FLOOR0) % 4;
  if (r === 0) return y === FLOOR0 ? ["smooth_stone"] : ["light_gray_concrete"];   // base course / storey line
  if (r === 3) return y === FLOOR0 + 3 ? ["light_gray_concrete"] : ["white_concrete"]; // ground-floor canopy band / head
  if (a % 3 === 0) return ["gray_concrete"];                                       // mullion
  return null;                                                                     // glazing (pane) at r = 1, 2
}

// Entrance: the outside face with the most ring cells, its middle bay on the ground floor (not a mullion)
const faceCount = {};
for (let i = 0; i < W * D; i++) if (ring[i] && G[i] !== null) { const k = normal[i].join(","); faceCount[k] = (faceCount[k] || 0) + 1; }
const doorFace = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];
const [ndx, ndz] = doorFace.split(",").map(Number);
const alongOnFace = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z);
  if (ring[i] && normal[i] && normal[i].join(",") === doorFace) alongOnFace.push({ x, z, a: ndx !== 0 ? z : x });
}
alongOnFace.sort((p, q) => p.a - q.a);
let door = alongOnFace[alongOnFace.length >> 1];
if (door.a % 3 === 0) door = alongOnFace.find((p) => p.a % 3 !== 0 && Math.abs(p.a - door.a) <= 2) || door;
const doorCell = `${door.x},${door.z}`;

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const i = idx(x, z), gr = G[i], t = T[i];
  // foundation below the cell's ground, then the stone plinth up to the ground floor (the downhill side's extra storeys)
  for (let y = 0; y < FLOOR0; y++) g.set(x, y, z, y < gr ? "stone" : "stone_bricks");
  if (env[i]) {
    const [nx, nz] = normal[i] || [0, 0];
    const a = nx !== 0 ? z : x;
    for (let y = FLOOR0; y <= t; y++) {
      const m = facade(y, a);
      if (m) g.set(x, y, z, m[0]);
      else pane(x, y, z);
    }
    if (ring[i]) {
      g.set(x, t + 1, z, "white_concrete");                 // parapet
      g.set(x, t + 2, z, "light_gray_concrete");            // coping
    }
  } else {
    // interior: a floor slab per storey (and the roof slab at t), air between
    for (let y = FLOOR0; y <= t; y += 4) g.set(x, y, z, "light_gray_concrete");
  }
}

// entrance: door in the ground-floor base course, a hood over it, and the threshold at ground
{
  const [x, z] = doorCell.split(",").map(Number);
  const facing = DIRNAME[`${ndx},${ndz}`];
  g.set(x, FLOOR0, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, FLOOR0 + 1, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const p of alongOnFace) if (Math.abs(p.a - door.a) <= 1) {
    g.set(p.x, FLOOR0 + 2, p.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// warm lights: lanterns on the floor just inside some upper-floor windows (a window's inner cell is interior air)
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = idx(x, z);
  if (!ring[i] || !normal[i]) continue;
  const [nx, nz] = normal[i], a = nx !== 0 ? z : x;
  for (let k = 1; FLOOR0 + 4 * k + 1 <= T[i]; k++) {
    const y = FLOOR0 + 4 * k + 1;
    if (a % 3 === 0 || (k * 3 + a) % 7 !== 0) continue;
    const px = x - nx, pz = z - nz;
    if (!inF(px, pz) || env[idx(px, pz)] || T[idx(px, pz)] < FLOOR0 + 4 * k + 4) continue;
    g.set(px, y, pz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// roof plant: boxes on the tower's roof (tier 51), clear of the parapet, set around its middle
{
  const tower = [];
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inF(x, z) && T[idx(x, z)] === 51 && dist[idx(x, z)] >= 4) tower.push([x, z]);
  if (tower.length) {
    const cx = tower.reduce((s, p) => s + p[0], 0) / tower.length, cz = tower.reduce((s, p) => s + p[1], 0) / tower.length;
    for (const [x, z] of tower) {
      if (Math.abs(x - cx) > 6 || Math.abs(z - cz) > 4 || (x + z) % 5 === 0) continue;   // a plant room, with a gap every few cells for the louvres
      g.set(x, 52, z, "white_concrete");
      g.set(x, 53, z, (x + z) % 3 === 0 ? "iron_bars" : "light_gray_concrete");
    }
  }
}

// glass panes connect to their neighbours (panes and solid blocks), as the game would have them
for (const [x, y, z] of panes) {
  const solid = (dx, dz) => g.val(x + dx, y, z + dz) !== 0;
  g.set(x, y, z, "light_blue_stained_glass_pane", {
    north: String(solid(0, -1)), south: String(solid(0, 1)), east: String(solid(1, 0)), west: String(solid(-1, 0)),
  });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260083815.nbt";
const res = g.save(out);
console.log(`saved ${out}: ${res.blocks} blocks, ${res.palette} palette entries`);
