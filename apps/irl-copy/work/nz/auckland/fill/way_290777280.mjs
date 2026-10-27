// Urba, Auckland (way 290777280): a 51 x 57 block footprint (about 42 x 47 m) of a 1980s concrete-frame commercial block,
// ten storeys (40 blocks, 4-block storey grid) over a lower wing and a courtyard podium. Lidar roof heights are
// median-smoothed and snapped to the storey grid (38-41 -> 40, 36-37 -> 36, the low wings 8, 12); a cell whose lidar roof
// is at or below its own ground (the courtyard) gets one storey of podium above that ground, so nothing sits in a pit.
// The facade is a 4-block storey rhythm: white floor lines, light-grey spandrels, white piers every third block over
// tinted grey glass, a polished-andesite base course with a glazed shopfront at street level, a dark-oak entrance on the
// north face under a lintel. Roof: smooth stone membrane, white parapet on the outside ring, two plant boxes on the
// tower top. Glowstone sits behind some panes; interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_290777280.cells.json", "utf8"));
const W = 51, D = 57, TOP = 54;
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

// median-smoothed roof, then snapped to the 4-block storey grid; at least one storey above the cell's own ground
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));
const tierCount = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const snapped = 4 * Math.round(median(x, z) / 4);
  const oneStorey = 4 * Math.ceil((G[x][z] + 4) / 4);
  H[x][z] = Math.max(snapped, oneStorey);
  tierCount[H[x][z]] = (tierCount[H[x][z]] || 0) + 1;
}
const topH = Math.max(...H.flat());

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour that stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || H[nx][nz] <= y;
});

// the entrance: on the north run, the lowest street-level cell near the middle of the run. A seven-cell bay: two door
// cells in the middle, glazed shopfront either side with a shroomlight at each end, a lintel over the whole bay
const northEdge = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z - 1) && G[x][z] <= 2 && H[x][z] >= 8) northEdge.push([x, z]);
const mid = northEdge.length ? northEdge[northEdge.length >> 1] : null;
const entrance = new Map();   // "x,z" -> offset from the middle of the bay
if (mid) for (const [x, z] of northEdge) if (Math.abs(x - mid[0]) <= 3 && z === mid[1]) entrance.set(`${x},${z}`, x - mid[0]);

const g = new Voxels([W, TOP, D]);
const PANE = (dirs) => (dirs.includes("N") || dirs.includes("S"))
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glowAt = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], d = dist[x][z];
  // foundation: solid from y 0 up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // roof membrane on the top of the cell, white parapet on the outside ring
  g.set(x, top, z, "smooth_stone");
  if (d === 1) g.set(x, top + 1, z, "white_concrete");

  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {
      // interior: air, with a floor slab per storey (and the ground floor)
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const bay = entrance.get(`${x},${z}`);
    if (bay !== undefined) {
      const door = bay === 0 || bay === 1;
      if (y === gr && door) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === gr + 1 && door) { g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === gr + 2) { g.set(x, y, z, "polished_andesite"); continue; }   // lintel over the bay
      if (y === gr + 1 && (bay === -3 || bay === 4)) { g.set(x, y, z, "shroomlight"); continue; }   // warm light at each end
      if (y === gr + 1) { g.set(x, y, z, "gray_stained_glass_pane", PANE(ex)); continue; }   // shopfront glass
    }
    if (y === gr) { g.set(x, y, z, "polished_andesite"); continue; }        // base course
    if (y % 4 === 0) { g.set(x, y, z, "white_concrete"); continue; }        // floor line
    // a corner pier only on the outside ring; elsewhere the piers keep their three-block rhythm
    const corner = dist[x][z] === 1 && (ex.includes("N") || ex.includes("S")) && (ex.includes("W") || ex.includes("E"));
    const face = ex.includes("N") || ex.includes("S") ? ex.find(k => k === "N" || k === "S") : ex[0];
    const u = face === "N" || face === "S" ? x : z;
    if (y % 4 === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }   // spandrel
    if (corner || u % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }   // pier
    // glazing: tinted grey panes in the bays between the piers, a dark band against the pale frame
    g.set(x, y, z, "gray_stained_glass_pane", PANE(ex));
    if ((x * 31 + z * 17 + y * 7) % 9 === 0) glowAt.push([x - DIRS[face][0], y, z - DIRS[face][1]]);
  }
}

// warm light behind some panes: an interior air cell next to the glass, standing on the floor slab
for (const [x, y, z] of glowAt) if (inside(x, z) && exposed(x, z, y).length === 0 && y % 4 !== 0) g.set(x, y, z, "glowstone");

// roof plant: 3 x 3 boxes of plant and a lift core on the tower top (every cell at the top height, away from the parapet)
const onTop = (x, z) => H[x][z] === topH && dist[x][z] >= 4;
const boxes = [];
for (let x = 1; x < W - 2; x++) for (let z = 1; z < D - 2; z++) {
  let ok = true;
  for (let dx = 0; dx < 3 && ok; dx++) for (let dz = 0; dz < 3 && ok; dz++) if (!onTop(x + dx, z + dz)) ok = false;
  if (ok) boxes.push([x, z, dist[x + 1][z + 1]]);
}
boxes.sort((a, b) => b[2] - a[2]);
const placed = [];
for (const [x, z] of boxes) {
  if (placed.length >= 2) break;
  if (placed.some(([px, pz]) => Math.abs(px - x) < 4 && Math.abs(pz - z) < 4)) continue;
  placed.push([x, z]);
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) {
    const edge = dx === 0 || dz === 0 || dx === 2 || dz === 2;
    for (let y = topH + 1; y <= topH + 2; y++) if (edge) g.set(x + dx, y, z + dz, "light_gray_concrete");
    g.set(x + dx, topH + 3, z + dz, "white_concrete");   // cap
  }
}

const counts = {}; g.forEachCell((i, v) => { counts[v] = (counts[v] || 0) + 1; });
const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_290777280.nbt");
console.log(JSON.stringify({ tiers: tierCount, topH, entrance: [...entrance], plant: placed, glow: glowAt.length, ...stats }));
