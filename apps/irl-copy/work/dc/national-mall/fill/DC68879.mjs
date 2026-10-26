// 1713 7th St NW, Shaw: a three-storey brick apartment block over a shopfront ground floor, c. 1910s walk-up.
// Footprint from the cells file (16 x 12); the lidar roof gives a flat roof at 7 blocks, pavilion corners at 8,
// and a low lightwell notch on the east edge. Hollow shell: 1-block walls, floor slabs at y 0/2/4 and a roof slab at 6,
// air between them (the storeys), so every glass pane has air behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC68879.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC68879.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const X = 16, Y = 20, Z = 12;
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, roof });
const inF = (x, z) => foot.has(`${x},${z}`);

// Top block of each column. A roof value r occupies y 0..r-1; lidar 6 inside a 7 roof is noise, so it smooths to 7.
const topOf = (x, z) => { let r = foot.get(`${x},${z}`).roof; if (r === 6) r = 7; return r - 1; };

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter((k) => !inF(x + DIRS[k][0], z + DIRS[k][1]));
const interior = (x, z) => inF(x, z) && exposed(x, z).length === 0;

// The street front is the long north face (z = 0). Its door sits on the mid-frontage bay.
const DOOR = [8, 0];
const B = new Map();                       // "x,y,z" -> { block, state, face? }
const put = (x, y, z, block, state, extra) => B.set(`${x},${y},${z}`, { block, state, ...extra });

for (const [x, z, ground] of cells) {
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");        // foundation (none here: ground is 0)
  const T = topOf(x, z), ex = exposed(x, z);

  if (ex.length === 0) {                                                  // interior: floor slabs + roof, air between
    for (const y of [0, 2, 4]) if (y <= T) put(x, y, z, "smooth_stone");
    if (6 <= T) put(x, 6, z, "stone");
    continue;
  }

  for (let y = 0; y <= T; y++) {
    if (y === T || y % 2 === 0) { put(x, y, z, "stone_bricks"); continue }   // plinth, storey belts, cornice, parapet cap
    // odd rows 1, 3, 5: the storey glass rows
    if (ex.length >= 2) { put(x, y, z, "bricks"); continue }                 // corner piers
    const face = ex[0];
    const [dx, dz] = DIRS[face];
    const bx = x - dx, bz = z - dz;
    if (!interior(bx, bz)) { put(x, y, z, "bricks"); continue }              // thin wall: no room behind, no window
    const u = face === "N" || face === "S" ? x : z;
    if (u % 3 === 0) { put(x, y, z, y === 1 && face === "N" ? "dark_oak_planks" : "bricks"); continue }
    if (x === DOOR[0] && z === DOOR[1]) {                                    // entrance: door at y 0-1
      put(x, y, z, "dark_oak_door", { facing: "north", half: y === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === 1 && face === "N") put(x, y, z, "glass");                     // shopfront glass, dark piers
    else put(x, y, z, "glass_pane", null, { face });
    // a warm light in some windows: a glowstone just inside the glass, on the storey's floor
    if ((u + y) % 4 === 0) put(bx, y, bz, "glowstone");
  }
}

// Rooftop plant: a 2 x 2 air-handling unit on the flat roof of the interior (y 7 sits on the roof slab at 6).
for (const [x, z] of [[10, 9], [11, 9], [10, 10], [11, 10]]) put(x, 7, z, "light_gray_concrete");

// Panes join their neighbours along the wall, as a run of glass does: east/west for a N/S face, north/south for E/W.
const WALL = new Set(["bricks", "stone_bricks", "dark_oak_planks", "glass", "glass_pane", "glowstone", "stone", "smooth_stone"]);
const solidAt = (x, y, z) => { const b = B.get(`${x},${y},${z}`); return b && WALL.has(b.block) ? b : null; };
const paneOK = (x, y, z) => { const b = B.get(`${x},${y},${z}`); return b && (b.block === "glass_pane" || WALL.has(b.block)); };
for (const [key, b] of B) {
  if (b.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const ew = b.face === "N" || b.face === "S";
  const [lo, hi] = ew ? [[x - 1, y, z], [x + 1, y, z]] : [[x, y, z - 1], [x, y, z + 1]];
  const [p, q] = ew ? ["west", "east"] : ["north", "south"];
  b.state = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  b.state[p] = paneOK(...lo) ? "true" : "false";
  b.state[q] = paneOK(...hi) ? "true" : "false";
}

const g = new Voxels([X, Y, Z]);
for (const [key, b] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, b.block, b.state);
}
const r = g.save(OUT);
console.log(`saved ${OUT}: ${r.blocks} blocks, ${r.palette} palette entries`);
