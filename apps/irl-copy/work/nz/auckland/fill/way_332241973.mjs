// Way 332241973: a 1970s Auckland mixed-use block. Brick shopfront base and a stone plinth, white-concrete upper
// storeys with glazed bays, a 2-storey podium carrying an 11-block core (the lidar's tallest mass), and lower wings
// stepping down. Built from the cells: solid foundation 0..2, walls from the storey datum to each column's top, a
// hollow interior with floor slabs at y 6, a cornice cap on every tier, a parapet on every exposed edge.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_332241973.cells.json`, "utf8"));
const W = 31, H = 24, D = 26;

// [x, z, ground, roof] per footprint cell
const fp = Array.from({ length: W }, () => Array(D).fill(null));
for (const [x, z, g, r] of cells) fp[x][z] = { g, r };
const inFP = (x, z) => x >= 0 && z >= 0 && x < W && z < D && fp[x][z] !== null;
const NB = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // -z, +z, -x, +x faces
const FACE_NAME = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };

// The tower: lidar roof 11. Cells within one step of anything lower form a 6-high podium; the rest is the core.
const isT = (x, z) => inFP(x, z) && fp[x][z].r >= 11;
const dist = Array.from({ length: W }, () => Array(D).fill(0));
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!isT(x, z)) continue;
  dist[x][z] = NB.some(([dx, dz]) => !isT(x + dx, z + dz)) ? 1 : 999;
  if (dist[x][z] === 1) queue.push([x, z]);
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of NB) {
    const a = x + dx, b = z + dz;
    if (isT(a, b) && dist[a][b] > dist[x][z] + 1) { dist[a][b] = dist[x][z] + 1; queue.push([a, b]); }
  }
}

// Top surface of each column, in blocks above y 0: podium 6, core 11, lower wings the lidar roof capped at 6.
const top = (x, z) => {
  if (!inFP(x, z)) return 0;
  if (isT(x, z)) return dist[x][z] === 1 ? 6 : 11;
  return Math.min(fp[x][z].r, 6);
};
// the outward faces a wall at height y has: a neighbour outside the footprint, or one with no block at y
const facesAt = (x, z, y) => NB.filter(([dx, dz]) => !inFP(x + dx, z + dz) || top(x + dx, z + dz) <= y);
// a parapet course sits on the top of a column that has a lower neighbour (or none)
const edgeAt = (x, z, t) => NB.some(([dx, dz]) => !inFP(x + dx, z + dz) || top(x + dx, z + dz) < t);

const B = {
  plinth: "stone_bricks", string: "smooth_stone", cap: "smooth_stone", parapet: "smooth_stone",
  stall: "polished_andesite", piers: "bricks", glass: "light_blue_stained_glass",
  spandrel: "light_gray_concrete", upper: "quartz_block", roof: "light_gray_concrete",
};

// block grid: null = air, or { block, state }
const grid = Array.from({ length: W }, () => Array.from({ length: H }, () => Array(D).fill(null)));
const put = (x, y, z, block, state) => { grid[x][y][z] = { block, state }; };

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFP(x, z)) continue;
  const t = top(x, z);
  for (let y = 0; y <= t; y++) {
    if (y === t) { if (edgeAt(x, z, t)) put(x, y, z, B.parapet); continue; }
    if (y === t - 1) { put(x, y, z, B.cap); continue; }                // cornice and roof slab on every tier
    if (y <= 1) { put(x, y, z, B.plinth); continue; }                  // foundation and base course
    if (y === 2) { put(x, y, z, B.string); continue; }
    if (y === 6) { put(x, y, z, B.string); continue; }                 // storey-line floor slab (and string course)
    const faces = facesAt(x, z, y);
    if (!faces.length) continue;                                       // hollow interior: air behind the glass
    const f = faces[0];
    const along = f[0] === 0 ? x : z;                                  // a pier every third bay along the face
    const pier = along % 3 === 0;
    if (y <= 5) put(x, y, z, pier ? B.piers : y === 3 ? B.stall : B.glass);   // ground storey: stallboard, glazing
    else if (y === 7) put(x, y, z, B.spandrel);
    else put(x, y, z, pier ? B.upper : B.glass);                      // upper storey: glazing between piers
  }
}

// entrance: the first street-facing glazed bay on a wing of 6 or more: a door in the ground storey, a canopy above
let door = null;
for (let x = 0; x < W && !door; x++) for (let z = 0; z < D && !door; z++) {
  if (!inFP(x, z) || top(x, z) < 6 || (x % 3 === 0 && z % 3 === 0)) continue;
  const f = facesAt(x, z, 4)[0];
  if (f && top(x, z) === 6 && grid[x][4][z]?.block === B.glass) door = { x, z, f };
}
if (door) {
  const { x, z, f } = door, facing = FACE_NAME[`${f[0]},${f[1]}`];
  const along = f[0] === 0 ? [1, 0] : [0, 1];
  put(x, 3, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, 4, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const s of [-1, 0, 1]) {
    const a = x + along[0] * s, b = z + along[1] * s;
    if (inFP(a, b) && top(a, b) === 6 && facesAt(a, b, 5).some((q) => q[0] === f[0] && q[1] === f[1]))
      put(a, 5, b, "oak_stairs", { facing, half: "top", shape: "straight", waterlogged: "false" });
  }
}

// warm light: lanterns hang under the storey slab behind some ground glass, glowstone sits behind upper glass
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFP(x, z) || top(x, z) < 7) continue;
  for (const y of [5, 8, 9]) {
    const cur = grid[x][y][z];
    if (!cur || cur.block !== B.glass) continue;
    const f = facesAt(x, z, y)[0];
    if (!f) continue;
    const ix = x - f[0], iz = z - f[1];                                // the cell just inside the glass
    if (!inFP(ix, iz) || top(ix, iz) <= y || grid[ix][y][iz]) continue;
    if (y === 5 && hash(x, y, z) % 6 === 0 && top(ix, iz) >= 7) put(ix, y, iz, "lantern", { hanging: "true", waterlogged: "false" });
    if (y !== 5 && hash(x, y, z) % 5 === 0) put(ix, y, iz, "glowstone");
  }
}

// roof: a lift bulkhead and two plant units on the core, one plant unit on a mid-wing roof
const core = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (isT(x, z) && dist[x][z] >= 3) core.push([x, z]);
const cx = core.reduce((s, [x]) => s + x, 0) / core.length, cz = core.reduce((s, [, z]) => s + z, 0) / core.length;
const taken = new Set();
const fits = (x0, z0, n, minDist) => {
  for (let x = x0; x < x0 + n; x++) for (let z = z0; z < z0 + n; z++)
    if (!isT(x, z) || dist[x][z] < minDist || taken.has(`${x},${z}`)) return false;
  return true;
};
const place = (n, minDist, pred) => {
  const cands = [];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (fits(x, z, n, minDist)) cands.push([x, z]);
  cands.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz));
  const pick = cands.find(([x, z]) => pred(x, z));
  if (pick) for (let x = pick[0]; x < pick[0] + n; x++) for (let z = pick[1]; z < pick[1] + n; z++) taken.add(`${x},${z}`);
  return pick ?? null;
};
const lift = place(3, 3, () => true);
if (lift) for (let x = lift[0]; x < lift[0] + 3; x++) for (let z = lift[1]; z < lift[1] + 3; z++) {
  for (let y = 11; y <= 13; y++) put(x, y, z, B.upper);
  put(x, 14, z, B.roof);
}
for (let u = 0; u < 2; u++) {
  const p = place(2, 3, () => true);
  if (p) for (let x = p[0]; x < p[0] + 2; x++) for (let z = p[1]; z < p[1] + 2; z++) put(x, 11, z, B.roof);
}
{
  // mid-wing plant unit: a 2x2 of lower-roof cells at top 6, away from the edges
  let done = false;
  for (let x = 0; x < W - 1 && !done; x++) for (let z = 0; z < D - 1 && !done; z++) {
    const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => inFP(x + dx, z + dz) && !isT(x + dx, z + dz) && top(x + dx, z + dz) === 6 && facesAt(x + dx, z + dz, 6).length === 0);
    if (!ok) continue;
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) put(x + dx, 6, z + dz, B.roof);
    done = true;
  }
}

// write the volume
const g = new Voxels([W, H, D]);
let placed = 0, top_y = 0;
for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) for (let z = 0; z < D; z++) {
  const b = grid[x][y][z]; if (!b) continue;
  g.set(x, y, z, b.block, b.state); placed++; top_y = Math.max(top_y, y);
}
const out = `${DIR}/way_332241973.nbt`;
const stat = g.save(out);
console.log(JSON.stringify({ out, placed, highestY: top_y, palette: stat.palette, door: door ? { x: door.x, z: door.z } : null, lift: !!lift }));
