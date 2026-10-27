// Way 269465531, Newton / Eden Terrace (Auckland): a 1930s reinforced-concrete stripped-classical commercial block. Cream
// plastered concrete frame (quartz walls, smooth-quartz string course on every 4-block storey line, quartz spandrels),
// a stone-brick plinth on the slope, a 4-storey shoulder with a 5-storey crown in the centre that steps in from the edge,
// a low shop wing down the lower east side. Lidar roofs are median-smoothed and snapped to the 4-block storey grid.
// Glazed bays in the 2 middle rows of each storey (glass_pane, paned along the facade), a glass shopfront on the ground
// storey, a dark-oak entrance, lanterns in some windows, a plant box on the roof. Interiors are air with a floor slab
// per storey and a concrete column grid, so every slab stands on something.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465531.cells.json", "utf8"));
const W = 57, D = 56, H = 33;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));

const G = grid(-1);                                   // ground (foundation top) per cell, -1 = not footprint
const R = grid(0);                                    // lidar roof height above y 0
for (const [x, z, gr, r] of cells) { G[x][z] = gr; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// edge distance (1 on the outside ring), BFS through the footprint
const dist = grid(0);
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  if (DIRS.some(([dx, dz]) => !inside(x + dx, z + dz))) { dist[x][z] = 1; queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && !dist[nx][nz]) { dist[nx][nz] = dist[x][z] + 1; queue.push([nx, nz]); }
  }
}

// median-smoothed lidar roof, then snapped to 4-block storeys: at least one storey above the cell's ground, at most 5
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const T = grid(0);                                    // top of the solid massing (a storey line; the roof deck sits here)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const gr = G[x][z];
  let top = Math.min(20, Math.max(4 * Math.round(median(x, z) / 4), 4 * Math.ceil((gr + 4) / 4)));
  if (top >= 20 && dist[x][z] < 3) top = 16;          // the crown steps in from its edge: a tower on a shoulder
  T[x][z] = top;
}

const solidAt = (x, z, y) => inside(x, z) && y < T[x][z];
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !solidAt(x + dx, z + dz, y));
const shopTop = (gr) => 4 * (Math.floor(gr / 4) + 1);  // rows below this are the ground storey (shopfront)
const isColumn = (x, z) => x % 6 === 0 && z % 6 === 0;
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// the entrance: a single-face edge cell on the lowest ground, the tallest of those
let door = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const ex = exposed(x, z, G[x][z]);
  if (ex.length !== 1) continue;
  const key = G[x][z] * 100 - T[x][z];
  if (!door || key < door.key) door = { x, z, dir: ex[0], key, gr: G[x][z] };
}

const g = new Voxels([W, H, D]);
const windowState = ([dx]) => dx
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// the envelope row of an exposed cell: a base course, string courses on the storey lines, spandrels, and bays of
// piers (on the face's s % 4 in 0 and 3) and glazing (1 and 2); corners are piers
function facadeAt(x, z, y, gr, ex) {
  if (y === gr) return { block: "stone_bricks" };
  if (y % 4 === 0) return { block: "smooth_quartz" };
  if (y % 4 === 3 || ex.length !== 1) return { block: "quartz_block" };
  const [dx] = ex[0];
  const s = dx ? z : x;
  if (s % 4 === 0 || s % 4 === 3) return { block: "quartz_block" };
  if (y < shopTop(gr)) return { block: "glass" };
  return { block: "glass_pane", state: windowState(ex[0]) };
}

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const gr = G[x][z], top = T[x][z];
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");          // foundation on the slope
  for (let y = gr; y <= top; y++) {
    const ex = exposed(x, z, y);
    if (y === top) {                                                    // roof: cornice and parapet at the edge, deck inside
      if (ex.length) { g.set(x, y, z, "smooth_quartz"); g.set(x, y + 1, z, "quartz_block"); }
      else g.set(x, y, z, "light_gray_concrete");
      continue;
    }
    if (ex.length) {
      const f = facadeAt(x, z, y, gr, ex);
      g.set(x, y, z, f.block, f.state);
    } else {
      const floor = y === gr || y % 4 === 0;                             // a slab per storey, air between
      if (isColumn(x, z)) g.set(x, y, z, "quartz_pillar", { axis: "y" });
      else if (floor) g.set(x, y, z, "light_gray_concrete");
    }
  }
}

// entrance: a dark-oak door in the wall, a slab hood over it
if (door) {
  const { x, z, dir, gr } = door;
  const facing = FACING[dir.join(",")];
  g.set(x, gr, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 1, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// warm lights: a lantern on the floor inside some window bays (the floor slab below it is the storey's own)
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) {
  const gr = G[x][z], top = T[x][z];
  for (let y = gr + 1; y < top; y++) {
    if (y % 4 !== 1) continue;
    const ex = exposed(x, z, y);
    if (ex.length !== 1 || (x * 31 + z * 17 + y * 7) % 4 !== 0) continue;
    const [dx, dz] = ex[0];
    const ix = x - dx, iz = z - dz;
    if (!inside(ix, iz) || isColumn(ix, iz) || exposed(ix, iz, y).length || T[ix][iz] <= y) continue;
    g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// roof plant: a 5 x 5 stone-brick box on the crown's flat roof (the deepest all-20 patch), capped with a slab
const P = 2;
let plant = null;
for (let cx = P; cx < W - P; cx++) for (let cz = P; cz < D - P; cz++) {
  let ok = true, depth = 0;
  for (let x = cx - P; x <= cx + P && ok; x++) for (let z = cz - P; z <= cz + P; z++) {
    if (!inside(x, z) || T[x][z] !== 20) { ok = false; break; }
    depth += dist[x][z];
  }
  if (ok && (!plant || depth > plant.depth)) plant = { cx, cz, depth };
}
if (plant) {
  for (let x = plant.cx - P; x <= plant.cx + P; x++) for (let z = plant.cz - P; z <= plant.cz + P; z++) {
    for (let y = 21; y <= 23; y++) g.set(x, y, z, "stone_bricks");
    g.set(x, 24, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

const { blocks, palette } = { blocks: g.count(), palette: g.palette.length };
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465531.nbt");
console.log(`way_269465531: ${blocks} blocks, ${palette - 1} palette entries`);
