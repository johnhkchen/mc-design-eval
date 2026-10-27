// Q City Apartments, Auckland (way 162814875): a 2000s glass-and-concrete apartment tower on a shopfront base. Lidar roofs
// are median-smoothed and snapped to the 4-block storey grid (49-50 -> 48, 16-17 -> 16, 36-38 -> 36), then the tower
// steps in as it rises: the outer ring stops at 36, the next at 44, the core runs to 48 with plant boxes and a 2-block
// parapet line. The outline's north edge is the lowest ground (0), so the lobby sits there under a lintel hood. Floors are
// on the absolute 4-block grid; the ground course is polished granite on stone-brick foundations down to each cell's ground.
// Facades: concrete piers at corners, white storey bands, pale spandrels, glass ribbons with dark mullions, glowstone in
// some windows. Interiors are air with a floor slab per storey; the roof is the ceiling.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162814875.cells.json", "utf8"));
const W = 41, D = 42, TOP = 63;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance (1 on the outline), BFS through the footprint
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

// median of the 3x3 lidar roof, then the storey grid
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
// the first storey line at or above the ground course (a 4-block grid, so a shopfront of 1-4 blocks sits on the ground)
const floorBase = (gr) => 4 * Math.ceil((gr + 1) / 4);
const H = Array.from({ length: W }, () => Array(D).fill(0));   // roof top surface, y
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const d = dist[x][z];
  let t = Math.floor(median(x, z) / 4) * 4;
  if (d === 1) t = Math.min(t, 36);          // outer ring: the first setback
  else if (d === 2) t = Math.min(t, 44);     // next ring: the second setback
  // a sliver of footprint two or fewer cells across is lidar noise, not a tower: it stays a podium
  const nbrs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => inside(x + dx, z + dz)).length;
  if (nbrs <= 1) t = Math.min(t, 16);
  H[x][z] = Math.max(t, floorBase(G[x][z]) + 4);
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour whose roof is at or below y
const exposed = (x, z, y) => Object.keys(DIRS).filter((k) => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});
const PANE = (dir) => (dir === "N" || dir === "S")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const along = (dir, x, z) => (dir === "N" || dir === "S" ? x : z);   // a facade cell's position along its wall

// the lobby: the north edge's lowest run, near its middle, one door with a lintel hood over three cells
const northEdge = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z - 1) && G[x][z] <= 2 && H[x][z] >= floorBase(G[x][z]) + 8) northEdge.push([x, z]);
const mid = northEdge.length ? northEdge[northEdge.length >> 1] : null;
const door = mid ? `${mid[0]},${mid[1]}` : null;
const hood = new Set();
if (mid) for (const [x, z] of northEdge) if (Math.abs(x - mid[0]) <= 1 && z === mid[1]) hood.add(`${x},${z}`);

const g = new Voxels([W, TOP, D]);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], d = dist[x][z], fb = floorBase(gr);
  // foundation: solid from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // roof membrane on the top of each cell; a parapet on the outer ring; roof plant on the core
  g.set(x, top, z, "smooth_stone");
  if (d === 1) g.set(x, top + 1, z, "white_concrete");
  if (d >= 3 && top === 48 && x >= 22 && x <= 28 && z >= 20 && z <= 26) {   // one plant room on the crown
    g.set(x, top + 1, z, "light_gray_concrete");
    g.set(x, top + 2, z, "light_gray_concrete");
  }

  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab at the ground and at each storey line
      if (y === gr || (y >= fb && (y - fb) % 4 === 0)) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (ex.length >= 2) { g.set(x, y, z, "light_gray_concrete"); continue; }   // corner pier
    const dir = ex[0], m = along(dir, x, z);

    if (door === `${x},${z}` && (y === gr || y === gr + 1)) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (hood.has(`${x},${z}`) && y === fb - 1) { g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (y === gr) { g.set(x, y, z, "polished_granite"); continue; }           // ground course

    if (y < fb) {                                                             // shopfront
      if (y === fb - 1) g.set(x, y, z, "black_concrete");                    // fascia
      else if (m % 3 === 0) g.set(x, y, z, "black_concrete");               // shopfront mullions
      else g.set(x, y, z, "glass_pane", PANE(dir));
      continue;
    }

    const row = (y - fb) % 4;                                                 // upper storeys: 4-block storey
    if (row === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }       // pale spandrel
    if (row === 3) { g.set(x, y, z, "white_concrete"); continue; }            // storey band
    if (m % 3 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }    // pier between the panes
    g.set(x, y, z, "light_blue_stained_glass_pane", PANE(dir));
    // warm light in some windows: glowstone in the air behind the glass
    const [dx, dz] = DIRS[dir], ix = x - dx, iz = z - dz;
    if (inside(ix, iz) && exposed(ix, iz, y).length === 0 && (x * 5 + z * 3 + y) % 11 === 0) g.set(ix, y, iz, "glowstone");
  }
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162814875.nbt");
console.log(`Q City Apartments: ${stats.blocks} blocks, ${stats.palette} palette entries, door ${door}, hood ${hood.size}`);
