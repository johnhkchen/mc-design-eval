// Connect Apartments, Auckland (way 147112324): a 1980s-style residential tower. Footprint 43 x 42 (940 cells, irregular),
// lidar roof 70-76 blocks above its lowest ground, the north-east wing 14 (ground 0-5). Lidar roof heights are snapped to
// a 4-block storey grid: 16 for the 14 wing (a four-storey shopfront wing on the north-east), 72 for the 51-74 body (a
// seventeen-storey slab; its outer ring steps back one storey to a terrace on 68), 76 for the 75-76 shaft. The 36-41 edge
// noise joins the wing. Foundation is solid stone from y 0 to each cell's ground. Facade: a 4-block storey rhythm (light-grey
// bands at each floor edge and window head), cream piers every third bay, blue tinted glass between them, a stone base
// course, balcony rails on alternate storeys in the middle bays, a dark-oak entrance with a canopy on the north face, warm
// glowstone and shroomlight behind some panes. Interiors are air with a floor slab per storey. Roof: coping on the edges,
// plant boxes on the slab, a small plant room and a mast on the shaft.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147112324.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147112324.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 43, D = 42, TOP = 89;
const G = Array.from({ length: W }, () => Array(D).fill(-1));    // ground (foundation height), -1 = not footprint
for (const [x, z, g] of cells) G[x][z] = g;
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// roof tiers on the storey grid, at least one storey above each cell's own ground
const snap = (r) => (r >= 75 ? 76 : r >= 42 ? 72 : 16);
const T = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z, g, r] of cells) T[x][z] = Math.max(snap(r), 4 * Math.ceil((g + 4) / 4));

const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const outerEdge = (x, z) => Object.values(DIRS).some(([dx, dz]) => !inside(x + dx, z + dz));
// the slab's outer ring steps back one storey: a terrace on 68 around the 72 storeys
const topOf = (x, z) => (T[x][z] === 72 && outerEdge(x, z) ? 68 : T[x][z]);
const solid = (x, y, z) => inside(x, z) && y < topOf(x, z);
// faces of a cell exposed at height y: the neighbour there is outside the footprint or stands lower
const exposed = (x, z, y) => Object.keys(DIRS).filter((k) => !solid(x + DIRS[k][0], y, z + DIRS[k][1]));
// coping on any roof cell with a lower neighbour or open air beside it
const roofEdge = (x, z) => Object.values(DIRS).some(([dx, dz]) => !inside(x + dx, z + dz) || topOf(x + dx, z + dz) < topOf(x, z));

// the main entrance: the north run of the wing's ground storey (26, 1)
const DOOR = "26,1";

const g = new Voxels([W, TOP, D]);
const bayOf = (x, z, faces) => (faces.includes("N") || faces.includes("S") ? x : z);
const glassFor = (faces) => (faces.includes("N") || faces.includes("S")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// the facade block of an exposed wall cell at height y
function facade(x, z, y, faces, gr) {
  const corner = faces.length >= 2;
  const bay = bayOf(x, z, faces);
  const pier = corner || bay % 3 === 0;
  if (y === gr) return { block: "stone_bricks" };                                          // base course
  if (y < gr + 4) {                                                                       // ground storey: shopfront glass
    if (y === gr + 3) return { block: "light_gray_concrete" };
    return pier ? { block: "smooth_quartz" } : { block: "light_blue_stained_glass" };
  }
  if (y % 4 === 0 || y % 4 === 3) return { block: "light_gray_concrete" };                 // floor edge and window head
  if (pier) return { block: "smooth_quartz" };
  if (y % 4 === 1 && T[x][z] === 72 && bay % 3 === 1 && ((y >> 2) & 1) === 0) {           // balcony rail, alternate storeys
    return { block: "iron_bars", state: glassFor(faces) };
  }
  return { block: "light_blue_stained_glass" };
}

// a 2 x 2 plant box standing on the slab's roof, clear of the coping
function plantBox(x0, z0) {
  const cs = [[x0, z0], [x0 + 1, z0], [x0, z0 + 1], [x0 + 1, z0 + 1]];
  if (!cs.every(([x, z]) => inside(x, z) && topOf(x, z) === 72 && !roofEdge(x, z))) return;
  for (const [x, z] of cs) for (let y = 72; y <= 73; y++) g.set(x, y, z, "light_gray_concrete");
}

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = topOf(x, z), key = `${x},${z}`;
  // foundation: solid from y 0 up to this cell's ground, so nothing floats on a slope
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  for (let y = gr; y < top; y++) {
    const faces = exposed(x, z, y);
    if (key === DOOR && faces.includes("N") && (y === gr + 1 || y === gr + 2)) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (key === DOOR && y === gr + 3) { g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (faces.length === 0) {
      // interior: air, with a floor slab per storey and on the ground floor
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const w = facade(x, z, y, faces, gr);
    g.set(x, y, z, w.block, w.state);
  }
  // roof deck on the top layer (the top layer on a wall is its cornice), and a coping on the roof edge
  g.set(x, top - 1, z, "smooth_stone");
  if (roofEdge(x, z)) g.set(x, top, z, "smooth_quartz");
}

// the lobby lantern stands on the entrance hall's floor, inside the door
g.set(26, G[26][1] + 1, 2, "lantern", { hanging: "false", waterlogged: "false" });

// warm light behind some panes: a glowing block in the air just inside a lit window (shroomlight every fifth lit one)
let lit = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = topOf(x, z);
  for (let y = gr + 5; y < top - 2; y++) {
    if (y % 4 !== 2) continue;
    const faces = exposed(x, z, y);
    if (faces.length !== 1) continue;
    const bay = bayOf(x, z, faces);
    if (bay % 3 === 0 || (x * 7 + z * 3 + y) % 4 !== 0) continue;
    const [dx, dz] = DIRS[faces[0]];
    const ix = x - dx, iz = z - dz;
    if (!inside(ix, iz) || g.get(ix, y, iz)) continue;
    g.set(ix, y, iz, lit++ % 5 === 4 ? "shroomlight" : "glowstone");
  }
}

// roof plant: boxes on the slab roof, a grid of them clear of the coping
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (x % 8 === 3 && z % 8 === 3) plantBox(x, z);
}

// the plant room on the shaft: a 3 x 3 box with a stone roof, and a mast above it
for (let x = 15; x <= 17; x++) for (let z = 20; z <= 22; z++) {
  if (topOf(x, z) !== 76) continue;
  const edge = x === 15 || x === 17 || z === 20 || z === 22;
  if (edge) for (let y = 76; y <= 77; y++) g.set(x, y, z, "light_gray_concrete");
  g.set(x, 78, z, "stone_bricks");
}
g.set(16, 79, 21, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
g.set(16, 80, 21, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
g.set(16, 81, 21, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const stats = g.save(OUT);
console.log(`way_147112324: ${stats.blocks} blocks, ${stats.palette} palette entries`);
