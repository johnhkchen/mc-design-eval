// Club Tower, Auckland (way 147110864): a 1980s-style corporate office block, a 17-storey podium-and-shaft tower with
// a crown plant room. Footprint 35 x 56, lidar roof 66-78 blocks above its lowest ground (5-6 on the east annex). Lidar
// roof heights are median-smoothed and snapped to a 4-block storey grid: 68 for the 66-69 podium, 72 for the 70-73 shoulders,
// 76 for the 75-76 shaft, 79 for the 77-78 crown; the 5-6 east annex is a two-storey wing and a 17-19 wing is four storeys.
// Foundation is solid stone from y 0 to each cell's ground. Facade: a 4-block storey rhythm (white concrete floor band at
// each storey line, cyan glass panes between light-grey concrete piers every third bay, corners as piers), a polished
// andesite base course and a shopfront glass zone on the ground storey, a dark-oak entrance with a stone canopy on the
// north face, warm glowstone and shroomlight behind some panes. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147110864.cells.json", "utf8"));
const W = 35, D = 56, TOP = 91;
const G = Array.from({ length: W }, () => Array(D).fill(-1));    // ground (foundation height), -1 = not footprint
for (const [x, z, g] of cells) G[x][z] = g;
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// roof tiers on the storey grid: the lidar's crown (77-78) is one tier at 79, the rest snap to 4-block storeys,
// and no cell is shorter than two storeys above its own ground (the 5-6 annex becomes a single wing of 8)
const snap = (r) => (r >= 77 ? 79 : Math.max(8, 4 * Math.round(r / 4)));
const T = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z, g, r] of cells) T[x][z] = Math.max(snap(r), 4 * Math.ceil((g + 4) / 4));

const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const nb = (x, z, k) => [x + DIRS[k][0], z + DIRS[k][1]];
// faces of a cell exposed at height y: outside the footprint, or beside a neighbour whose roof stops below y
const exposed = (x, z, y) => Object.keys(DIRS).filter((k) => {
  const [nx, nz] = nb(x, z, k);
  return !inside(nx, nz) || T[nx][nz] <= y;
});
// roof edge: the parapet sits on any roof cell with a lower neighbour or open air beside it
const roofEdge = (x, z) => Object.keys(DIRS).some((k) => {
  const [nx, nz] = nb(x, z, k);
  return !inside(nx, nz) || T[nx][nz] < T[x][z];
});

// the main entrance: the north run of the ground storey, middle of the widest flat stretch (x 13-15, z 2)
const ENTRANCE = new Set(["13,2", "14,2", "15,2"]);

const g = new Voxels([W, TOP, D]);
const glassFor = (faces) => (faces.includes("N") || faces.includes("S")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// the facade block of an exposed wall cell at height y (ground storey, storey bands, glass bays, piers)
function wall(x, z, y, faces, gr) {
  const corner = faces.length >= 2;
  const bay = faces.includes("N") || faces.includes("S") ? x : z;
  if (y === gr) return { block: "polished_andesite" };                                   // base course
  if (y < gr + 4) {
    if (y === gr + 3) return { block: "white_concrete" };                              // ground-storey lintel
    if (corner || bay % 3 === 0) return { block: "light_gray_concrete" };
    return { block: "cyan_stained_glass_pane", state: glassFor(faces) };             // shopfront
  }
  if (y % 4 === 0) return { block: "white_concrete" };                                  // storey floor band
  if (corner || bay % 3 === 0) return { block: "light_gray_concrete" };                // piers
  return { block: "cyan_stained_glass_pane", state: glassFor(faces) };
}

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = T[x][z];
  // foundation: solid from y 0 up to this cell's ground, so nothing floats on a slope
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  for (let y = gr; y < top - 1; y++) {
    const key = `${x},${z}`;
    const faces = exposed(x, z, y);
    if (ENTRANCE.has(key) && (y === gr + 1 || y === gr + 2) && faces.includes("N")) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (ENTRANCE.has(key) && y === gr + 3) { g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (faces.length === 0) {
      // interior: air, with a floor slab per storey and on the ground floor
      if (y === gr || y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const w = wall(x, z, y, faces, gr);
    g.set(x, y, z, w.block, w.state);
  }
  // roof deck on the cell's top layer (a cornice on the walls), and a parapet on the roof edge
  g.set(x, top - 1, z, "smooth_stone");
  if (roofEdge(x, z)) g.set(x, top, z, "white_concrete");
}

// the lanterns hang under the entrance canopy, either side of the door
g.set(13, G[13][2] + 2, 2, "lantern", { hanging: "true", waterlogged: "false" });
g.set(15, G[15][2] + 2, 2, "lantern", { hanging: "true", waterlogged: "false" });

// warm light behind some panes: a glowing block in the air just inside a lit bay (shroomlight every fifth lit bay)
let lit = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = T[x][z];
  for (let y = gr + 5; y < top - 2; y++) {
    if (y % 4 !== 2) continue;
    const faces = exposed(x, z, y);
    if (!faces.length || faces.length > 1) continue;
    const bay = faces[0] === "N" || faces[0] === "S" ? x : z;
    if (bay % 3 === 0 || (x * 7 + z * 3 + y) % 4 !== 0) continue;
    const [ix, iz] = nb(x, z, { N: "S", S: "N", E: "W", W: "E" }[faces[0]]);
    if (!inside(ix, iz) || g.get(ix, y, iz)) continue;
    g.set(ix, y, iz, lit++ % 5 === 4 ? "shroomlight" : "glowstone");
  }
}

// the plant room on the crown: a 4 x 3 box with a lit band and a stone cap, standing on the 78 roof deck
for (let x = 15; x <= 18; x++) for (let z = 28; z <= 30; z++) {
  if (T[x][z] !== 79) continue;
  for (let y = 79; y <= 81; y++) {
    const edge = x === 15 || x === 18 || z === 28 || z === 30;
    if (!edge) continue;
    g.set(x, y, z, y === 80 ? "cyan_stained_glass_pane" : "light_gray_concrete",
      y === 80 ? glassFor(x === 15 || x === 18 ? ["E"] : ["N"]) : undefined);
  }
  g.set(x, 82, z, "stone_bricks");
}

// roof plant on the podium: a few chilled-water units standing on the 68 deck, clear of the parapet
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || T[x][z] !== 68 || roofEdge(x, z)) continue;
  if (x % 6 === 3 && z % 6 === 2) g.set(x, 68, z, "light_gray_concrete");
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147110864.nbt");
console.log(`way_147110864: ${stats.blocks} blocks, ${stats.palette} palette entries`);
