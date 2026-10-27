// Augusta House, Auckland (way 292861480): a 1980s concrete-frame office tower in the CBD, sixteen storeys over a
// basalt plinth. The lidar roof is three flat tiers (68, 72, 76: a 76 core, a 72 ring, a 68 wing), median-smoothed and
// snapped to the 4-block storey grid, so the massing steps back as it rises. Each cell is its own column down to the
// ground, so every tier stands on what is below. The facade is a 4-block storey rhythm (white band course, a grey
// spandrel, a tinted glass ribbon) with white concrete piers every third cell; the ground storey is a basalt plinth and
// shopfront with a dark-oak entrance. Some windows have glowstone one cell behind the glass; the interiors are air with
// a floor slab per storey. The roof carries a plant room and a lightning rod.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861480.cells.json", "utf8"));
const W = 40, D = 38, TOP = 89;
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

// median-smoothed lidar roof, then three flat tiers on the storey grid
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));   // roof block y of each column
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const m = median(x, z);
  H[x][z] = m >= 74 ? 76 : m >= 70 ? 72 : 68;
}

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const occupied = (x, z, y) => inside(x, z) && y <= H[x][z];
// faces of a cell at height y that look onto air: outside the footprint, or beside a column that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k];
  return !occupied(x + dx, z + dz, y);
});
const x0 = Math.min(...cells.map(c => c[0])), z0 = Math.min(...cells.map(c => c[1]));

// the entrance: the outside-ring cell on the lowest ground nearest the middle of the footprint's ground-level edge
const street = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && dist[x][z] === 1 && G[x][z] <= 1 && exposed(x, z, G[x][z]).length) street.push([x, z]);
const cx = street.reduce((s, c) => s + c[0], 0) / street.length, cz = street.reduce((s, c) => s + c[1], 0) / street.length;
street.sort((a, b) => (Math.hypot(a[0] - cx, a[1] - cz)) - (Math.hypot(b[0] - cx, b[1] - cz)));
const [ex, ez] = street[0];
const entrFace = exposed(ex, ez, G[ex][ez]).find(k => k === "S" || k === "N") ?? exposed(ex, ez, G[ex][ez])[0];

const g = new Voxels([W, TOP, D]);
const litPanes = [];   // windows with a warm light behind (one cell inside the glass)

// the glass for a wall face: a pane lying in the wall plane (N/S walls run east-west)
const pane = (faces) => (faces.includes("N") || faces.includes("S"))
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], d = dist[x][z];
  // foundation: solid from y 0 up to the ground under the cell
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // the storeys, column by column, each with a floor slab at its base (absolute storey lines every 4 blocks)
  const k0 = Math.floor(gr / 4);                                  // the ground storey
  for (let y = gr; y < top; y++) {
    const faces = exposed(x, z, y);
    if (faces.length === 0) {
      // interior: air, with a floor slab per storey; a warm light one cell behind some windows
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const k = Math.floor(y / 4), row = y % 4;
    const corner = faces.length >= 2;
    const pier = corner || (faces.some(f => f === "N" || f === "S") ? (x - x0) % 3 === 0 : (z - z0) % 3 === 0);
    if (k === k0 && y === gr) { g.set(x, y, z, "stone_bricks"); continue; }     // basalt plinth course
    if (k === k0 && (ex === x && ez === z) && (y === gr + 1 || y === gr + 2)) {  // the entrance: a dark-oak door
      if (y === gr + 1) g.set(x, y, z, "dark_oak_door", { facing: { N: "north", S: "south", E: "east", W: "west" }[entrFace], half: "lower", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, "dark_oak_door", { facing: { N: "north", S: "south", E: "east", W: "west" }[entrFace], half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (k === k0 && (ex === x && ez === z) && y === gr + 3) { g.set(x, y, z, "smooth_stone_slab", { type: "top", waterlogged: "false" }); continue; }  // canopy band over the door
    if (row === 0) { g.set(x, y, z, "white_concrete"); continue; }                // floor band course
    if (row === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }            // grey spandrel
    if (pier) { g.set(x, y, z, "white_concrete"); continue; }                     // concrete fin between the bays
    if (k === k0) { g.set(x, y, z, "light_blue_stained_glass_pane", pane(faces)); continue; }   // shopfront glass
    g.set(x, y, z, "light_blue_stained_glass_pane", pane(faces));                 // tinted curtain-wall glass
    if (d === 1 && !(corner)) {
      const inward = [x - DIRS[faces[0]][0], z - DIRS[faces[0]][1]];
      if (((x * 7 + z * 3 + k * 5) % 6) === 0 && inside(inward[0], inward[1])) litPanes.push([inward[0], y, inward[1], k]);
    }
  }
  // the roof covering on the top of the column; a parapet on the outside edge
  g.set(x, top, z, "smooth_stone");
  if (d === 1) g.set(x, top + 1, z, "white_concrete");
}

// warm lights behind the glass (interior air cells, one in from the window)
for (const [x, y, z] of litPanes) {
  if (y % 4 === 0 || y % 4 === 3) continue;
  g.set(x, y, z, "glowstone");
}

// roof equipment on the tower's core: a plant room with a cap, and a lightning rod on its centre
const core = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && H[x][z] === 76 && dist[x][z] >= 6) core.push([x, z]);
if (core.length) {
  const px = core.reduce((s, c) => s + c[0], 0) / core.length, pz = core.reduce((s, c) => s + c[1], 0) / core.length;
  // a rectangular plant room centred on the core, so it reads as one box rather than scattered blocks
  const plant = core.filter(([x, z]) => Math.abs(x - px) <= 4 && Math.abs(z - pz) <= 3);
  core.sort((a, b) => Math.hypot(a[0] - px, a[1] - pz) - Math.hypot(b[0] - px, b[1] - pz));
  for (const [x, z] of plant) {
    for (let y = 77; y <= 78; y++) g.set(x, y, z, "light_gray_concrete");
    g.set(x, 79, z, "smooth_stone");
  }
  const [rx, rz] = core[0];
  for (let y = 80; y <= 84; y++) g.set(rx, y, rz, "lightning_rod", { facing: "up", powered: "false" });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_292861480.nbt";
const r = g.save(out);
console.log("saved", out, r);
