import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540888721.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540888721.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 16, H = 23, D = 14;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);

// Storey heights (absolute), roof slab at 10, parapet at 11
const BAND = 5;      // storey line
const ROOF = 10;     // top of second storey slab
const PARAPET = 11;  // parapet course on perimeter, roof plant above

// Facade description per perimeter cell
function edgeInfo(x, z) {
  const missX = [];
  const missZ = [];
  if (!has(x + 1, z)) missX.push(+1);
  if (!has(x - 1, z)) missX.push(-1);
  if (!has(x, z + 1)) missZ.push(+1);
  if (!has(x, z - 1)) missZ.push(-1);
  return { missX, missZ, edge: missX.length > 0 || missZ.length > 0 };
}

// 1. Foundations: solid from y 0 up to each cell's ground
for (const [x, z, gy] of cells) {
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Floor slabs (ground floor, storey line, roof) across the whole footprint
for (const [x, z, gy] of cells) {
  g.set(x, gy, z, "light_gray_concrete");
  if (BAND > gy) g.set(x, BAND, z, "light_gray_concrete");
  g.set(x, ROOF, z, "smooth_stone");
}

// 3. Perimeter shell and facade articulation
const DOOR_X = 8;
let doorCell = null;
{
  // Door on the south face (missing z+1), nearest the middle
  let best = Infinity;
  for (const [x, z] of cells.map(c => [c[0], c[1]])) {
    const info = edgeInfo(x, z);
    if (info.missZ.includes(+1) && !info.missX.length) {
      const d = Math.abs(x - DOOR_X);
      if (d < best) { best = d; doorCell = [x, z]; }
    }
  }
}

for (const [x, z, gy] of cells) {
  const info = edgeInfo(x, z);
  if (!info.edge) continue;

  const corner = info.missX.length > 0 && info.missZ.length > 0;
  // along-face index and inward direction
  let along = 0;
  let inward = null;
  if (info.missZ.length && !info.missX.length) {
    along = x;
    inward = [0, -info.missZ[0]];
  } else if (info.missX.length && !info.missZ.length) {
    along = z;
    inward = [-info.missX[0], 0];
  } else {
    along = 0;
    inward = [-(info.missX[0] ?? 0), -(info.missZ[0] ?? 0)];
  }
  const frame = corner || along % 3 === 0;

  for (let y = gy; y <= 9; y++) {
    let id = "white_concrete";
    let props;
    if (y === gy) {
      id = "polished_andesite";                       // base course
    } else if (y <= gy + 3) {
      // shopfront ground storey
      id = frame ? "white_concrete" : "light_blue_stained_glass";
      if (y === gy + 3 && !frame) id = "light_blue_stained_glass";
    } else if (y === gy + 4) {
      id = "smooth_quartz";                           // shop lintel
    } else if (y === BAND) {
      id = "smooth_quartz";                           // storey line
    } else if (y >= 6 && y <= 8) {
      id = frame ? "white_concrete" : "light_blue_stained_glass";
    } else if (y === 9) {
      id = "smooth_quartz";                           // cornice
    }
    g.set(x, y, z, id, props);
  }

  // Ground-floor door on the chosen cell
  if (doorCell && x === doorCell[0] && z === doorCell[1]) {
    g.set(x, gy + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false" });
    g.set(x, gy + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false" });
    g.set(x, gy + 3, z, "light_blue_stained_glass");
  }

  // Parapet course
  g.set(x, PARAPET, z, "white_concrete");

  // Warm light behind some upper-storey windows
  if (!frame && along % 6 === 1 && inward) {
    const ix = x + inward[0], iz = z + inward[1];
    if (has(ix, iz)) {
      const ii = edgeInfo(ix, iz);
      if (!ii.edge) g.set(ix, 7, iz, "glowstone");
    }
  }
}

// 4. Roof plant on interior cells: AC plant, water tank, mast
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const info = edgeInfo(x, z);
  if (info.edge) continue;
  if (x % 5 === 2 && z % 4 === 1) {
    g.set(x, 11, z, "stone_bricks");
    g.set(x, 12, z, "stone_bricks");
  } else if (x % 4 === 0 && z % 3 === 0) {
    g.set(x, 11, z, "light_gray_concrete");
  }
}
if (has(8, 7)) {
  for (let y = 11; y <= 14; y++) g.set(8, y, 7, "iron_bars");
}

g.save(OUT);
