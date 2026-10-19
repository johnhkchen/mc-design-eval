// DC60981: 101 G Street SW, a 1960s-era elevator apartment block in Southwest Washington, read from the lidar record. A
// flat-roofed brick slab on a stone plinth, 10 by 31 blocks, with two penthouse cores set back from the facades (lidar
// roof 13-14 over the middle of the plan, 12 elsewhere). Brick piers every third cell on every face, with glass bays
// between them and light-stone spandrels at each floor line; a dark-stone base course; one entrance on the west face
// under a stone hood; roof plant on the deck. Storeys are two blocks each (a window row and a floor slab), five in all,
// because the lidar's 12 blocks cannot take the real 3.3 m storey at 0.42 blocks per metre without fractions.
//
// Hollow, not furnished: the interior is air between the floor slabs, with a glowstone or shroomlight in some window
// rows behind the glass. Lidar noise is smoothed by a 3x3 median and the penthouse cores are kept two cells in from
// every facade, so the setbacks read as clean rectangles. Every block stands on the one below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC60981.cells.json`, "utf8"));
const W = 10, D = 31, H = 14;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const faces = (x, z) => FACES.filter(([, dx, dz]) => !inside(x + dx, z + dz));
const isFacade = (x, z) => inside(x, z) && faces(x, z).length > 0;

// Lidar roof, median of the 3x3 neighbourhood (kills single-cell noise).
const roofMedian = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
// A penthouse core: smoothed roof at 13 or more, and every cell within one step is inside and not on a facade.
const isCore = (x, z) => inside(x, z) && roofMedian(x, z) >= 13
  && [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => inside(x + dx, z + dz) && !isFacade(x + dx, z + dz)));

// Every placed block, keyed by position; panes get their connections after the whole volume is known.
const B = new Map();
const put = (x, y, z, block, state) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  B.set(`${x},${y},${z}`, { x, y, z, block, state });
};
const at = (x, y, z) => B.get(`${x},${y},${z}`);

for (const [x, z] of cells) {
  const fs = faces(x, z), fac = fs.length > 0;
  const core = isCore(x, z);
  const pier = fac && fs.some(([f]) => ((f === "N" || f === "S") ? x : z) % 3 === 0);   // piers every third cell, corners included

  put(x, 0, z, fac ? "stone_bricks" : "stone");                              // plinth course, the lowest block everywhere
  put(x, 11, z, "smooth_stone");                                             // cornice on the facades, roof deck inside
  for (let y = 1; y <= 10; y++) {
    if (fac) {
      if (pier) put(x, y, z, "bricks");
      else if (y % 2 === 0) put(x, y, z, "smooth_stone");                    // light spandrel at each floor line
      else put(x, y, z, "glass_pane");                                       // glazed bay in each window row
    } else if (y % 2 === 0) put(x, y, z, "smooth_stone");                    // floor slab; interior air elsewhere
  }
  if (core) {
    const ring = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !isCore(x + dx, z + dz));
    put(x, 12, z, ring ? "glass_pane" : "bricks");                           // glazed band round each penthouse
    put(x, 13, z, "smooth_stone");                                           // coping
  }
}

// Entrance on the west face, middle three cells: a door in a glazed lobby bay, a hood over it.
for (const z of [14, 15, 16]) {
  put(0, 3, z, "smooth_stone");                                              // hood, on the facade plane
  put(1, 3, z, "smooth_stone");                                              // and over the lobby inside
}
put(0, 1, 15, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
put(0, 2, 15, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });

// Warm light behind about one window in five, in the air gap just inside the glass.
for (const [x, z] of cells) {
  const fs = faces(x, z);
  if (fs.length === 0 || fs.some(([f]) => ((f === "N" || f === "S") ? x : z) % 3 === 0)) continue;
  const [, odx, odz] = fs[0];
  const ix = x - odx, iz = z - odz;
  for (let y = 1; y <= 9; y += 2) {
    if (x === 0 && z >= 14 && z <= 16) continue;                             // the entrance bay stays plain
    if ((x * 3 + z * 5 + y) % 5 === 0) put(ix, y, iz, (x + z) % 2 ? "glowstone" : "shroomlight");
  }
}

// Roof plant: two low boxes on the deck, clear of the penthouses.
for (const [x0, z0] of [[1, 20], [5, 27]]) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) put(x0 + dx, 12, z0 + dz, "light_gray_concrete");

// Glass panes connect to whatever is beside them on each side, as the game does.
for (const p of B.values()) {
  if (p.block !== "glass_pane") continue;
  const side = (dx, dz) => (at(p.x + dx, p.y, p.z + dz) ? "true" : "false");
  p.state = { east: side(1, 0), north: side(0, -1), south: side(0, 1), west: side(-1, 0), waterlogged: "false" };
}

const g = new Voxels([W, H, D]);
for (const p of B.values()) g.set(p.x, p.y, p.z, p.block, p.state);
const out = g.save(`${DIR}/DC60981.nbt`);
console.log(`DC60981.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
