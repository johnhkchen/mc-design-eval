// Mercure Auckland Queen Street (way 162652866): an eleven-storey hotel block of the 1980s, the decade's Auckland mix: white
// precast piers and floor bands, light-grey spandrels, blue-tinted glazing in the bays, a stone plinth and a shopfront
// ground storey. The lidar roof (24 to 45 blocks above the lowest ground) is median-smoothed and snapped to the 4-block
// storey grid: wings at 24, the middle at 28 to 36, the tower core at 44. Each cell stands on a stone foundation to its
// ground, so the downhill side shows extra storeys. Floor slabs run across every footprint cell at each storey line, so
// the setbacks carry their own floors and nothing hangs. Interiors are air. A dark-oak entrance on the north face, glowstone
// behind some panes, a lift and plant core on the tower's top tier, and a cornice and parapet on the outer ring.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162652866.cells.json`, "utf8"));
const W = 38, D = 48, MAXY = 58;
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under each cell, -1 = not footprint
const R = Array.from({ length: W }, () => Array(D).fill(0));    // lidar roof height above y 0
for (const [x, z, gr, r] of cells) { G[x][z] = gr; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const ring = (x, z) => Object.values(DIRS).some(([dx, dz]) => !inside(x + dx, z + dz));

// median-smoothed roof, snapped to the storey grid (a multiple of 4): wings 24, middle 28-36, tower core 40-44
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const H = Array.from({ length: W }, () => Array(D).fill(0));   // roof slab y of each cell
const tiers = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const snapped = 4 * Math.round(median(x, z) / 4);
  const top = Math.max(snapped, G[x][z] + 8);                  // at least two storeys above its own ground
  H[x][z] = top;
  tiers[top] = (tiers[top] || 0) + 1;
}
// the tower core is a one-cell column in the lidar: give it a shoulder, the cells beside it step up to the middle tier
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && H[x][z] >= 40) {
  for (const [dx, dz] of Object.values(DIRS)) if (inside(x + dx, z + dz) && H[x + dx][z + dz] < 36) H[x + dx][z + dz] = 36;
}
const maxH = Math.max(...H.flat());

// faces of a cell that are open to the air at height y: off the footprint, or beside a neighbour whose roof is below y
const exposed = (x, z, y) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k], nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || y > H[nx][nz];
});
// a floor slab across every footprint cell at each storey line above the ground and below the roof
const floorLine = (y, gr, top) => y % 4 === 0 && y > gr && y < top;

// the entrance: on the north face, at the street (lowest) ground, near the middle of that run
const northRun = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && !inside(x, z - 1)) northRun.push([x, z]);
const minG = Math.min(...northRun.map(([x, z]) => G[x][z]));
const street = northRun.filter(([x, z]) => G[x][z] <= minG + 1).sort((a, b) => a[0] - b[0]);
const mid = street.length ? street[street.length >> 1] : null;
const entrance = new Set();
if (mid) for (const [x, z] of street) if (Math.abs(x - mid[0]) <= 1 && z === mid[1]) entrance.add(`${x},${z}`);
const entranceRun = mid ? new Set(street.filter(([x, z]) => Math.abs(x - mid[0]) <= 2 && z === mid[1]).map(([x, z]) => `${x},${z}`)) : new Set();

const PANE = (ex) => (ex.includes("N") || ex.includes("S"))
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const g = new Voxels([W, MAXY, D]);
const glowAt = [];

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], top = H[x][z], outer = ring(x, z);
  // foundation: solid from y 0 up to the ground under the cell
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // roof: the cornice and parapet on the outer ring, a membrane terrace elsewhere
  if (outer) { g.set(x, top, z, "smooth_quartz"); g.set(x, top + 1, z, "white_concrete"); }
  else g.set(x, top, z, "smooth_stone");

  for (let y = gr; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {                                     // interior: air, with the floor slab per storey
      if (floorLine(y, gr, top)) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const onNS = ex.includes("N") || ex.includes("S");
    const face = onNS ? (ex.includes("N") ? "N" : "S") : ex[0];
    const u = onNS ? x : z;                                    // position along the face: piers every 4 blocks
    const key = `${x},${z}`;
    if (entrance.has(key) && (y === gr || y === gr + 1)) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === gr ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (entranceRun.has(key) && y === gr + 2) { g.set(x, y, z, "dark_oak_planks"); continue; }   // the entrance head
    if (y === gr) { g.set(x, y, z, "polished_andesite"); continue; }                             // base course
    if (floorLine(y, gr, top)) { g.set(x, y, z, "white_concrete"); continue; }                  // floor band
    const firstFloor = [gr + 1, gr + 2, gr + 3, gr + 4].find(v => v % 4 === 0) ?? gr + 4;     // the storey line above the ground
    const groundStorey = y < firstFloor;
    const pier = u % 4 === 0 || (ex.includes("N") || ex.includes("S")) && (ex.includes("E") || ex.includes("W"));
    if (groundStorey) {                                        // shopfront: stone piers, glazing between
      if (pier) g.set(x, y, z, "stone_bricks");
      else g.set(x, y, z, "light_blue_stained_glass_pane", PANE(ex));
      continue;
    }
    if (pier) { g.set(x, y, z, "white_concrete"); continue; }
    if (y % 4 === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }                        // spandrel under each window
    g.set(x, y, z, "light_blue_stained_glass_pane", PANE(ex));
    if ((x * 31 + z * 17 + y * 7) % 9 === 0) glowAt.push([x - DIRS[face][0], y, z - DIRS[face][1]]);
  }
}

// warm light behind some panes: an interior air cell next to the glass, between two floor lines
for (const [x, y, z] of glowAt) if (inside(x, z) && y > G[x][z] && y % 4 !== 0 && exposed(x, z, y).length === 0) g.set(x, y, z, "glowstone");

// roof plant: a lift and plant box on the tower's top tier, set in from the parapet, with a white cap
const plant = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z) && H[x][z] === maxH && !ring(x, z)) plant.push([x, z]);
for (const [x, z] of plant) {
  for (let y = maxH + 1; y <= maxH + 2; y++) g.set(x, y, z, "light_gray_concrete");
  g.set(x, maxH + 3, z, "white_concrete");
}

const stats = g.save(`${DIR}/way_162652866.nbt`);
console.log(JSON.stringify({ tiers, maxH, entrance: [...entrance], plant: plant.length, glow: glowAt.length, ...stats }));
