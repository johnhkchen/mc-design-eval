// Summit On Symonds, Eden Terrace (way 162814974): a seven-storey concrete-frame apartment block of the 1990s-2000s,
// the kind that went up along Symonds Street on the ridge below Maungawhau. Lidar roof heights sit at 27-29 over the whole
// footprint, so they are smoothed to one flat roof at 28 (seven 4-block storeys) with a 1-block parapet on the edge. A
// stone plinth at the ground, white render piers between light-grey spandrel and head bands, pale-blue glazing in every
// storey, a lit window here and there (glowstone), a glazed lobby with an oak door on the z 0 (street) face, and a roof plant room
// on a 6 x 6 core. Interiors are air with a floor slab per storey; ground is 0 or 1 under the footprint, so the foundation
// is stone from y 0 up to each cell's ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162814974.cells.json", "utf8"));
const W = 35, D = 40, H = 42;
const ROOF = 28, PARAPET = 29, FLOORS = [4, 8, 12, 16, 20, 24];
const G = Array.from({ length: W }, () => Array(D).fill(-1));   // ground under each cell, -1 = not footprint
for (const [x, z, g] of cells) G[x][z] = g;
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// faces of a cell that look out of the footprint (no neighbour there)
const exposed = (x, z) => Object.keys(DIRS).filter(k => { const [dx, dz] = DIRS[k]; return !inside(x + dx, z + dz); });
const PANE = (ex) => (ex.includes("N") || ex.includes("S"))
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// the entrance sits on the z 0 run, the lowest ground on the footprint edge
const entranceX = 14;
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

const g = new Voxels([W, H, D]);
const glowCells = [];
const roofCells = [];

// the 6 x 6 plant core: the all-footprint square nearest the centroid
let cx = 0, cz = 0, n = 0;
for (const [x, z] of cells.map(c => [c[0], c[1]])) { cx += x; cz += z; n++; }
cx /= n; cz /= n;
let best = null;
for (let x0 = 0; x0 + 6 <= W; x0++) for (let z0 = 0; z0 + 6 <= D; z0++) {
  let all = true;
  for (let x = x0; x < x0 + 6 && all; x++) for (let z = z0; z < z0 + 6; z++) if (!inside(x, z)) { all = false; break; }
  if (!all) continue;
  const d = Math.hypot(x0 + 2.5 - cx, z0 + 2.5 - cz);
  if (!best || d < best.d) best = { x0, z0, d };
}
const plant = best;

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const gr = G[x][z], ex = exposed(x, z);
  const edge = ex.length > 0;

  // foundation: stone from y 0 to the ground, then the ground-floor slab at the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "smooth_stone");

  // storeys: a floor slab every 4 blocks, glazed walls between, air inside
  for (let y = gr + 1; y < ROOF; y++) {
    if (FLOORS.includes(y)) { g.set(x, y, z, "smooth_stone"); continue; }
    if (!edge) continue;                                    // interior: air behind the glass
    const row = y % 4;                                       // 1 spandrel, 2 glazing row, 3 head band
    let block = "light_gray_concrete", state;
    if (y === gr + 1 && y < 4) block = "stone_bricks";      // the plinth course at street level
    else if (row === 2) {
      const u = (ex.includes("N") || ex.includes("S")) ? x : z;
      if (u % 3 === 0) block = "white_concrete";             // render piers
      else { block = "light_blue_stained_glass_pane"; state = PANE(ex); }
    }
    // the lobby: glass at the ground floor on the street face, the door in the middle
    if (y <= 2 && z === 0 && (x === 13 || x === 15)) block = "glass";
    g.set(x, y, z, block, state);
  }
  // the roof: cornice on the edge, membrane inside, a parapet on the edge
  if (edge) { g.set(x, ROOF, z, "light_gray_concrete"); g.set(x, PARAPET, z, "white_concrete"); }
  else g.set(x, ROOF, z, "smooth_stone");
}

// warm windows: glowstone set in the glazing row of some panes (lit flats), chosen deterministically
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const ex = exposed(x, z);
  if (!ex.length) continue;
  const u = (ex.includes("N") || ex.includes("S")) ? x : z;
  for (let y = 5; y < ROOF; y++) {
    if (y % 4 !== 2 || u % 3 === 0) continue;
    if ((u * 5 + y * 3 + x * z) % 29 === 0) { g.set(x, y, z, "glowstone"); glowCells.push([x, y, z]); }
  }
}

// the lobby door on the street face (z 0), plus a lantern on the floor inside
g.set(entranceX, 1, 0, "oak_door", doorState("lower"));
g.set(entranceX, 2, 0, "oak_door", doorState("upper"));
g.set(entranceX, 3, 0, "light_gray_concrete");
g.set(entranceX, 1, 1, "lantern", { hanging: "false" });

// the plant room: walls to 31 with a glazed band, a lid at 32
const { x0, z0 } = plant;
for (let x = x0; x < x0 + 6; x++) for (let z = z0; z < z0 + 6; z++) {
  const edge = x === x0 || x === x0 + 5 || z === z0 || z === z0 + 5;
  if (!edge) { g.set(x, 32, z, "smooth_stone"); continue; }
  const onZ = z === z0 || z === z0 + 5;
  for (let y = PARAPET; y <= 31; y++) {
    if (y === 30 && (x - x0) % 2 === 1) { g.set(x, y, z, "light_blue_stained_glass_pane", onZ ? PANE(["N"]) : PANE(["W"])); }
    else g.set(x, y, z, "light_gray_concrete");
  }
  g.set(x, 32, z, "smooth_stone");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162814974.nbt";
const r = g.save(out);
console.log(JSON.stringify({ blocks: r.blocks, palette: r.palette, footprint: cells.length, plant, glow: glowCells.length }));
