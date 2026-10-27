// Yoobee / The College of Law, Auckland (way 243875786): a 1990s-2000s concrete-frame education and office block on the
// CBD's edge, thirteen storeys (about 52 blocks, 43 m) over a dark basalt plinth, with a 56-block core and a rim
// parapet to the 58 the lidar reads. Lidar roof heights are 5x5 median-smoothed, then snapped to the 4-block storey grid,
// so the 52 mass reads as one flat tier, the 56 core stands up at the north-east, and the south and west wings step down
// to 20-48. Each storey is four blocks: a dark spandrel, two rows of tinted glass panes between white piers, and a white
// string course. The glass is set in a one-block air gap (a slab at each storey's floor and soffit), the core is solid,
// and the lit rooms carry glowstone behind the glass. The ground floor has a basalt base course, a shopfront band and a
// dark-oak entrance with a lantern inside on the lowest street face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_243875786.cells.json", "utf8"));
const W = 30, D = 42, H = 70, TOP_MAX = 56;
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const G = grid(-1), R = grid(0);                                  // ground (foundation top), lidar roof height
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// distance in cells from the outside of the footprint: 0 = the facade ring, 1 = the air gap, 2+ = the solid core
const dist = grid(-1), queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const edge = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
  if (edge) { dist[x][z] = 0; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && dist[nx][nz] < 0) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// lidar roof: 5x5 median over the footprint, then the storey grid (multiples of 4, capped at the 56 core)
const S = grid(0), T = grid(0), rim = grid(false);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); S[x][z] = v[v.length >> 1];
}
const B = grid(0);                                                // the first storey's floor: the ground rounded up to the grid
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  B[x][z] = Math.ceil(G[x][z] / 4) * 4;
  T[x][z] = Math.min(TOP_MAX, Math.max(B[x][z] + 8, Math.round(S[x][z] / 4) * 4));
  rim[x][z] = S[x][z] >= 57;                                      // the north-east rim parapet up to 58
}
// the ring and the air gap take the roof of the core they front (a breadth-first walk out from the core through the
// gap), so no gap cell is roofed above or below its neighbour core: a roof step is a ledge, never an open notch
{
  const seen = grid(false), q = [];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && dist[x][z] === 2) {
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      if (inside(nx, nz) && dist[nx][nz] < 2 && !seen[nx][nz]) { seen[nx][nz] = true; T[nx][nz] = T[x][z]; q.push([nx, nz]); }
    }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      if (inside(nx, nz) && dist[nx][nz] < 2 && !seen[nx][nz]) { seen[nx][nz] = true; T[nx][nz] = T[x][z]; q.push([nx, nz]); }
    }
  }
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) T[x][z] = Math.max(T[x][z], B[x][z] + 8);
}

// the entrance: the face with the lowest mean ground, its two middle cells on the ring
const faces = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faceCells = (f) => {
  const [dx, dz] = faces[f], out = [];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++)
    if (inside(x, z) && dist[x][z] === 0 && !inside(x + dx, z + dz)) out.push([x, z]);
  return out;
};
const meanG = (cs) => cs.reduce((a, [x, z]) => a + G[x][z], 0) / Math.max(1, cs.length);
const entFace = Object.keys(faces).filter((f) => faceCells(f).length > 6).sort((a, b) => meanG(faceCells(a)) - meanG(faceCells(b)))[0];
const entrance = new Set();
{
  const cs = faceCells(entFace).sort((a, b) => (entFace === "N" || entFace === "S" ? a[0] - b[0] : a[1] - b[1]));
  const mid = Math.floor(cs.length / 2);
  for (const c of cs.slice(mid - 1, mid + 1)) entrance.add(c.join(","));
}
const entOut = { N: "north", S: "south", W: "west", E: "east" };
const entInward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const g = new Voxels([W, H, D]);
const glassPanes = [];                                            // placed after the facade, so each pane knows its neighbours
const facade = new Map();                                         // "x,y,z" -> block name, for the ring only

// the ring's face position u (along the wall) and whether the cell is a corner or a pier
const missing = (x, z) => !inside(x, z);
const isCorner = (x, z) => (missing(x - 1, z) || missing(x + 1, z)) && (missing(x, z - 1) || missing(x, z + 1));
const uOf = (x, z) => (missing(x, z - 1) || missing(x, z + 1) ? x : z);

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const d = dist[x][z], b = B[x][z], t = T[x][z], gr = G[x][z];

  // foundation and the base up to the first floor (solid from y 0, so nothing floats on the slope)
  for (let y = 0; y < b; y++) g.set(x, y, z, "polished_andesite");

  for (let y = b; y < t; y++) {
    const k = Math.floor((y - b) / 4), o = (y - b) % 4;
    if (d >= 2) { g.set(x, y, z, "light_gray_concrete"); continue; }          // the structural core
    if (d === 1) {                                                          // the air gap: a slab at floor and soffit
      if (o === 0 || o === 3) g.set(x, y, z, "light_gray_concrete");
      else if (o === 1 && ((uOf(x, z) + 3 * k) % 5 === 1)) g.set(x, y, z, "glowstone");   // lit room behind the glass
      continue;
    }
    // the facade ring
    const u = uOf(x, z);
    const pier = isCorner(x, z) || u % 3 === 0;
    let name;
    if (k === 0 && entrance.has(`${x},${z}`)) {
      if (o === 0 || o === 1) name = null;                                  // the door, set below
      else if (o === 2) name = "cyan_stained_glass_pane";
      else name = "polished_andesite";
    } else if (k === 0) {
      name = o === 0 ? "polished_andesite" : o === 3 ? "polished_andesite" : pier ? "white_concrete" : "cyan_stained_glass_pane";
    } else {
      name = o === 0 ? "gray_concrete" : o === 3 ? "white_concrete" : pier ? "white_concrete" : "cyan_stained_glass_pane";
    }
    if (name === null) {
      const f = entOut[entFace];
      g.set(x, y, z, "dark_oak_door", { facing: f, half: o === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      facade.set(`${x},${y},${z}`, "dark_oak_door");
      continue;
    }
    g.set(x, y, z, name);
    facade.set(`${x},${y},${z}`, name);
    if (name === "cyan_stained_glass_pane") glassPanes.push([x, y, z]);
  }

  // the roof: a membrane over the air gap and core, parapets on the ring (two blocks on the rim)
  if (d >= 1) g.set(x, t, z, "gray_concrete");
  if (d === 0) {
    g.set(x, t, z, "white_concrete");
    facade.set(`${x},${t},${z}`, "white_concrete");
    if (rim[x][z]) { g.set(x, t + 1, z, "white_concrete"); facade.set(`${x},${t + 1},${z}`, "white_concrete"); }
  }
}

// the lantern inside each entrance door, and the door's upper half and transom are already set
for (const key of entrance) {
  const [x, z] = key.split(",").map(Number);
  const [ix, iz] = entInward[entFace];
  if (dist[x + ix]?.[z + iz] === 1) g.set(x + ix, B[x][z] + 1, z + iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// the glass panes connect to their ring neighbours at the same height (a pane meets a pier, a band or another pane)
for (const [x, y, z] of glassPanes) {
  const at = (nx, nz) => facade.get(`${nx},${y},${nz}`);
  const join = (nx, nz) => { const n = at(nx, nz); return n !== undefined && n !== "dark_oak_door" ? "true" : "false"; };
  g.set(x, y, z, "cyan_stained_glass_pane", { north: join(x, z - 1), south: join(x, z + 1), east: join(x + 1, z), west: join(x - 1, z) });
}

// roof plant on the core: two-block boxes with a white cap, in a block of the 52-56 tiers
for (let x = 11; x <= 18; x++) for (let z = 16; z <= 25; z++) {
  if (!inside(x, z) || dist[x][z] < 4 || T[x][z] < 52) continue;
  const t = T[x][z];
  g.set(x, t + 1, z, "light_gray_concrete");
  g.set(x, t + 2, z, "light_gray_concrete");
  g.set(x, t + 3, z, "white_concrete");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_243875786.nbt");
console.log({ entFace, storeys: "52-56 tiers", blocks: g.count(), palette: g.palette.length });
