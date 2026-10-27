// The International, Auckland (way 147112323): a late-1980s reinforced-concrete office tower on a stepped base. Footprint
// 71 x 63, lidar roof 73-77 blocks above its lowest ground over the bulk of the plan (about 16 storeys above the 9-block
// ground), a 16-18 block-high east wing and 4-8 block low wings to the west and north. Lidar roof heights are snapped to
// the 4-block storey grid (absolute lines, so the storeys line up across the slope), from a 3 x 3 median of the lidar so
// single-cell spikes and noise go: 76 for the 73-75 shaft, 78 for the 76-77 crown plant room, 4 * round(r / 4) below 73;
// no cell is shorter than the first storey line above its own ground.
// Foundation is solid stone from y 0 to each cell's ground. Facade: a polished andesite base course, a three-block
// shopfront zone on the ground storey (light blue glass, light-grey piers), then light-grey concrete piers every third bay
// with tinted light-blue glazing between, a white concrete spandrel at every storey line, a polished andesite cornice,
// a stone-brick entrance with a canopy on the north face, and glowstone or shroomlight behind some panes. The shaft's
// walls above the podium are the same facade. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147112323.cells.json", "utf8"));
const W = 71, D = 63, TOP = 90;
const G = Array.from({ length: W }, () => Array(D).fill(-1));     // ground (foundation top), -1 = not footprint
for (const [x, z, g] of cells) G[x][z] = g;
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// the first storey line above a ground height (storey lines are absolute multiples of 4)
const bandAbove = (g) => 4 * Math.ceil((g + 1) / 4);
// a cell's roof, snapped to a storey line: the crown plant room, the 76 shaft, then 4-block tiers
const tierOf = (g, r) => Math.max(r >= 76 ? 78 : r >= 73 ? 76 : 4 * Math.round(r / 4), bandAbove(g));
const R = Array.from({ length: W }, () => Array(D).fill(0));     // the lidar's roof, median-smoothed over the 3 x 3 cells
for (const [x, z, , r] of cells) R[x][z] = r;
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  return v.sort((a, b) => a - b)[v.length >> 1];
};
const T = Array.from({ length: W }, () => Array(D).fill(0));    // roof: cells y < T are built
for (const [x, z, g] of cells) T[x][z] = tierOf(g, median(x, z));

const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const OPP = { N: "S", S: "N", E: "W", W: "E" };
const nb = (x, z, k) => [x + DIRS[k][0], z + DIRS[k][1]];
// the faces of a cell exposed at height y: to open air beyond the footprint (outward), or beside a lower neighbour (a setback
// tier or the podium's roof, where the tower's shaft stands clear of it and is still the building's facade)
const faceList = (x, z, y) => Object.keys(DIRS).filter((k) => {
  const [nx, nz] = nb(x, z, k);
  return !inside(nx, nz) || y >= T[nx][nz];
});
const outward = (x, z, faces) => faces.filter((k) => !inside(...nb(x, z, k)));
const roofEdge = (x, z) => faceList(x, z, T[x][z] - 1).length > 0;

// the tinted glazing: the glass pane connects along the wall it sits in
const glassFor = (faces) => (faces.includes("N") || faces.includes("S")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// the entrance: three cells of the north face with a stone-brick door in the middle, on the lowest street-side ground
const ENTRANCE = new Set(["43,0", "44,0", "45,0"]);

const g = new Voxels([W, TOP, D]);

// the facade block of an exposed cell at height y, given its faces and its ground g0 and roof top
function skin(x, z, y, faces, g0, top) {
  const out = outward(x, z, faces);
  if (y === g0) return { block: "polished_andesite" };                                // base course
  if (y === top - 1) return { block: out.length ? "polished_andesite" : "smooth_stone" };  // cornice / roof deck
  const band = bandAbove(g0);
  const bay = out.includes("N") || out.includes("S") ? x : z;
  const corner = out.length >= 2;
  if (y < band) {                                                                      // ground storey: shopfront
    if (corner || bay % 3 === 0) return { block: "light_gray_concrete" };
    return { block: "light_blue_stained_glass_pane", state: glassFor(out) };
  }
  if (y % 4 === 0) return { block: "white_concrete" };                                  // storey spandrel
  if (top === 78 && y >= 76) return { block: "iron_bars" };                            // plant room louvres
  if (corner || bay % 3 === 0) return { block: "light_gray_concrete" };               // piers
  return { block: "light_blue_stained_glass_pane", state: glassFor(out) };
}

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const g0 = G[x][z], top = T[x][z];
  // foundation: solid from y 0 up to this cell's ground, so nothing floats on a slope
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");
  for (let y = g0; y < top; y++) {
    const key = `${x},${z}`;
    const faces = faceList(x, z, y);
    if (y === top - 1 && !faces.length) { g.set(x, y, z, "smooth_stone"); continue; }    // roof deck
    if (ENTRANCE.has(key) && faces.includes("N")) {
      if (y === g0 + 1 || y === g0 + 2) {
        const hit = key === "44,0";
        if (hit) g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === g0 + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        else g.set(x, y, z, "light_blue_stained_glass_pane", glassFor(["N"]));
        continue;
      }
      if (y === g0 + 3) { g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }   // canopy
    }
    if (!faces.length) {
      // interior: air, with a floor slab on each storey line above the ground
      if (y > g0 && y % 4 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const w = skin(x, z, y, faces, g0, top);
    g.set(x, y, z, w.block, w.state);
  }
}

// the roof edge: a parapet on the top deck of cells beside a lower tier or open air
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z) || !roofEdge(x, z)) continue;
  g.set(x, T[x][z] - 1, z, "polished_andesite");
}

// the canopy's lantern hangs in the lobby, under the middle of the three entrance cells
g.set(44, G[44][0] + 3, 1, "lantern", { hanging: "true", waterlogged: "false" });

// warm light behind some panes: a glowing block in the air just inside a lit bay (shroomlight every fifth lit bay)
let lit = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const g0 = G[x][z], top = T[x][z];
  for (let y = bandAbove(g0) + 1; y < top - 2; y++) {
    if (y % 4 === 0) continue;
    const faces = faceList(x, z, y);
    const out = outward(x, z, faces);
    if (out.length !== 1 || faces.length !== 1) continue;
    const bay = out[0] === "N" || out[0] === "S" ? x : z;
    if (bay % 3 === 0 || (x * 7 + z * 3 + y) % 5 !== 0) continue;
    const [ix, iz] = nb(x, z, OPP[out[0]]);
    if (!inside(ix, iz) || y < G[ix][iz] || faceList(ix, iz, y).length || g.get(ix, y, iz)) continue;
    g.set(ix, y, iz, lit++ % 5 === 4 ? "shroomlight" : "glowstone");
  }
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147112323.nbt");
console.log(`way_147112323: ${stats.blocks} blocks, ${stats.palette} palette entries`);
