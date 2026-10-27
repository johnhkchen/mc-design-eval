// Way 154089923, Auckland CBD (68 x 52 blocks, lidar roof 157 blocks above its lowest ground): a 1990s glass-curtain office
// tower of 39 storeys on a basalt podium, with a five-storey shoulder and two- to four-storey wings. Lidar roof heights are
// median-smoothed and snapped to the 4-block storey grid. The tower steps back at its edge (a 4-storey ring, then a 3-storey
// one, to the 39th storey at its core) and carries plant boxes and an antenna; the podium roof is a green terrace. The shell
// is one block thick with air behind the glass and a floor slab per storey; a basalt base course, a smooth-stone fascia
// and a cornice; a lobby door on the south face under a canopy, and warm lights behind some panes. No interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089923.cells.json", "utf8"));
const W = 68, D = 52, TOP = 169;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground (foundation height), -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height
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

// median-smoothed roof, then tiers on the storey grid (H = top of the body, 0 = open to the sky)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const r = median(x, z), d = dist[x][z];
  if (r < 6) continue;                                            // a light court at ground level, paved below
  H[x][z] = r >= 100 ? (d >= 8 ? 156 : d >= 4 ? 144 : 128)       // the tower: 39 storeys, stepped back at the edge
    : Math.max(8, 4 * Math.round(r / 4));                         // podium (20), shoulder and wings (8-16)
}
// one pass of a 3 x 3 median over the podium and wing tiers: clean flat roofs, no lidar speckle standing up as stubs
const H1 = H.map(col => col.slice());
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (H[x][z] && H[x][z] < 100) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && H[nx][nz] && H[nx][nz] < 100) v.push(H[nx][nz]);
  }
  v.sort((a, b) => a - b); H1[x][z] = v[v.length >> 1];
}
for (let x = 0; x < W; x++) H[x] = H1[x];

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the body, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !(inside(nx, nz) && H[nx][nz] > y);
});

// the lobby: the lowest street-side (south) podium cell on the footprint's southern edge, middle of that run
let maxZ = -1;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && H[x][z] >= 20 && G[x][z] === 0 && exposed(x, z, 1).includes("S")) maxZ = Math.max(maxZ, z);
const southRun = [];
for (let x = 0; x < W; x++) if (maxZ >= 0 && inside(x, maxZ) && H[x][maxZ] >= 20 && G[x][maxZ] === 0 && exposed(x, maxZ, 1).includes("S")) southRun.push(x);
const door = southRun.length ? { x: southRun[southRun.length >> 1], z: maxZ } : null;

const g = new Voxels([W, TOP, D]);
const glow = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const gr = G[x][z], h = H[x][z];
  for (let y = 0; y < gr; y++) g.set(x, y, z, "deepslate_bricks");      // foundation: nothing floats on a slope
  if (!h) { g.set(x, gr, z, "smooth_stone"); continue; }                 // courtyard paving at the ground
  for (let y = gr; y < h; y++) {
    const ex = exposed(x, z, y), perim = ex.length > 0, ground = y < 4;
    let b;
    if (y === h - 1) b = perim ? "smooth_quartz" : "light_gray_concrete";      // cornice / roof deck
    else if (y === 0) b = "deepslate_bricks";                                  // basalt base course
    else if (y % 4 === 0) b = perim ? "smooth_quartz" : "light_gray_concrete"; // storey line / floor slab
    else if (!perim) continue;                                                 // air behind the glass
    else if (ground && y === 3) b = "smooth_quartz";                           // shopfront fascia
    else {
      const alongX = ex.includes("N") || ex.includes("S");                    // the facade's running axis
      const c = alongX ? x : z;
      if (c % 3 === 0) b = ground ? "polished_deepslate" : "smooth_quartz";  // mullion
      else b = ground ? "glass" : "light_blue_stained_glass";                 // pane
      if (b.endsWith("stained_glass") && (x * 5 + z * 3 + Math.floor(y / 4) * 7) % 9 === 0) {
        const [dx, dz] = DIRS[ex[0]], ix = x - dx, iz = z - dz;              // the room behind the pane
        glow.push([ix, y, iz, (x + z + y) % 3 === 0 ? "shroomlight" : "glowstone"]);
      }
    }
    if (door && x === door.x && z === door.z && (y === 1 || y === 2)) {
      b = "dark_oak_door";
      g.set(x, y, z, b, { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (door && z === door.z && Math.abs(x - door.x) <= 1 && y === 3 && perim) b = "black_concrete";  // canopy over the entrance
    g.set(x, y, z, b);
  }
}
for (const [x, y, z, b] of glow) if (inside(x, z) && H[x][z] > y && exposed(x, z, y).length === 0) g.set(x, y, z, b);
if (door) g.set(door.x, 1, door.z - 1, "lantern", { hanging: "false", waterlogged: "false" });

// roof: plant boxes on the tower's top, an antenna at its centre, a green terrace on the podium
const top = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && H[x][z] === 156) top.push([x, z]);
const cx = top.reduce((s, [x]) => s + x, 0) / top.length, cz = top.reduce((s, [, z]) => s + z, 0) / top.length;
for (const [x, z] of top) if (x % 8 === 4 && z % 8 === 4) for (let y = 156; y < 159; y++) g.set(x, y, z, "light_gray_concrete");
const mid = top.reduce((best, p) => (Math.hypot(p[0] - cx, p[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz) ? p : best));
for (let y = 156; y < 162; y++) g.set(mid[0], y, mid[1], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && H[x][z] === 20 && (x + z) % 4 === 0 && exposed(x, z, 20).length === 0)
  g.set(x, 20, z, "moss_carpet");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089923.nbt";
console.log(g.save(out));
