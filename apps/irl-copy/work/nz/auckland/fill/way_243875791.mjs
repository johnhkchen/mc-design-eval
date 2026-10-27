// Auckland CBD, seen from Maungawhau: a 1980s office tower on a stepped podium, 16 storeys, white precast frame,
// blue-green tinted glazing in ribbons, a granite base and a dark-oak entrance. The lidar roof (7x7 median) steps into
// three tiers: a 10-storey podium (roof 40), a shaft (60) and a crown (64). Storey lines sit at multiples of 4 from y 0,
// each column is solid from y 0 to the first storey line above its ground, so every floor and tier stands on solid.
// Interiors are air behind the glass, one floor slab per storey.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_243875791.cells.json", "utf8"));
const W = 53, D = 57, H = 76;

// footprint, lidar ground and roof per cell
const ground = Array.from({ length: W }, () => Array(D).fill(-1));
const roof = Array.from({ length: W }, () => Array(D).fill(-1));
for (const [x, z, gr, r] of cells) { ground[x][z] = gr; roof[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[x][z] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// tiers from the smoothed roof: podium 40, shaft 60, crown 64 (all storey lines); base = the first storey line above ground
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const TOP = Array.from({ length: W }, () => Array(D).fill(0));
const BASE = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z, gr] of cells) {
  const v = [];
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) if (inside(x + dx, z + dz)) v.push(roof[x + dx][z + dz]);
  const rs = median(v);
  let top = rs < 50 ? 40 : rs < 62 ? 60 : 64;
  BASE[x][z] = 4 * (Math.floor(gr / 4) + 1);
  if (top < BASE[x][z] + 4) top = BASE[x][z] + 4;                   // at least two storeys stand above the base
  TOP[x][z] = top;
}

// the sides of a cell at height y that are open to air: outside the footprint, or over a neighbour that ends below y
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || TOP[x + dx][z + dz] <= y);

const g = new Voxels([W, H, D]);
const PANE = "cyan_stained_glass_pane", FRAME = "white_concrete", SPAN = "gray_concrete";
const glass = new Set();

for (const [x, z, gr] of cells) {
  const T = TOP[x][z], B = BASE[x][z];
  for (let y = 0; y <= T; y++) {
    const ex = exposed(x, z, y);
    if (y < gr) { g.set(x, y, z, "stone"); continue; }             // foundation down to the lidar ground
    if (y < B) {                                                   // the base: granite, a smooth ledge at its top
      g.set(x, y, z, ex.length ? (y === B - 1 ? "smooth_stone" : "polished_granite") : "stone");
      continue;
    }
    if (y === T) { if (ex.length) g.set(x, y, z, FRAME); continue; }    // parapet on the roof's edge
    if (y === T - 1) { g.set(x, y, z, ex.length ? "smooth_stone" : "gray_concrete"); continue; }   // roof cover, cornice
    if (y % 4 === 0) { g.set(x, y, z, ex.length ? FRAME : "light_gray_concrete"); continue; }     // floor slab / string course
    if (!ex.length) continue;                                      // interior: air behind the glass
    if (ex.length >= 2) { g.set(x, y, z, FRAME); continue; }       // corner pillar
    const [dx, dz] = ex[0];
    const along = dz !== 0 ? x : z;                                // the wall runs along x or z
    if (along % 3 === 0) { g.set(x, y, z, FRAME); continue; }      // mullion every third cell
    if (y % 4 === 3) { g.set(x, y, z, SPAN); continue; }           // spandrel below each slab
    g.set(x, y, z, PANE, { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
    glass.add(`${x},${y},${z}`);
  }
}

// warm light behind some panes: a glowstone or a standing lantern on the floor, inside the glass
for (const [x, z, gr] of cells) {
  for (let y = 1; y < TOP[x][z]; y += 4) {
    if (!glass.has(`${x},${y},${z}`)) continue;
    const [dx, dz] = exposed(x, z, y)[0] ?? [0, 0];
    const ix = x - dx, iz = z - dz;
    if (!inside(ix, iz) || exposed(ix, iz, y).length || y < BASE[ix][iz] || y >= TOP[ix][iz] - 1) continue;
    if ((x * 5 + z * 11 + y) % 7 !== 0) continue;
    if ((x + z) % 2 === 0) g.set(ix, y, iz, "glowstone");
    else g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// entrance: a double dark-oak door in the granite base on the north face, with a stone canopy over the bay
for (const [x, hinge] of [[12, "left"], [13, "right"]]) {
  g.set(x, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  for (let cx = 11; cx <= 14; cx++) g.set(cx, 4, 0, "smooth_stone");
}

// roof: a podium terrace with planters and plant, and a plant pod on the crown
for (const [x, z] of cells) {
  const T = TOP[x][z];
  if (exposed(x, z, T).length || exposed(x, z, T - 1).length) continue;
  if (T === 40 && x % 6 === 2 && z % 6 === 2) { g.set(x, 40, z, "light_gray_concrete"); g.set(x, 41, z, "oak_leaves", { distance: "1", persistent: "true", waterlogged: "false" }); }
  else if (T === 40 && x % 9 === 6 && z % 9 === 6) g.set(x, 40, z, "iron_block");
  else if (T === 64 && x % 8 === 4 && z % 8 === 4) { g.set(x, 64, z, "light_gray_concrete"); g.set(x, 65, z, "light_gray_concrete"); }
}

// panes join their neighbours: a glass, frame, or solid side is a connection (air and lanterns are not)
const joins = /pane|concrete|stone|granite|glowstone|leaves|iron_block/;
const STATE = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
for (const key of glass) {
  const [x, y, z] = key.split(",").map(Number);
  const state = { waterlogged: "false" };
  for (const [name, [dx, dz]] of Object.entries(STATE)) {
    const nb = g.get(x + dx, y, z + dz);
    state[name] = nb && joins.test(nb.block) && !/lantern/.test(nb.block) ? "true" : "false";
  }
  g.set(x, y, z, PANE, state);
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_243875791.nbt");
console.log(`way_243875791: ${stats.blocks} blocks, ${stats.palette} palette, ${glass.size} panes`);
