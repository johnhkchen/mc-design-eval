import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075529";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 12 x 20 footprint, roof at y 21, four storeys of 5 blocks, parapet to y 21, roof plant to y 24.
const W = 12, H = 33, D = 20;
const ROOF = 21;
const g = new Voxels([W, H, D]);

const FOUND = "stone_bricks";     // plinth / foundation course
const PIER = "smooth_quartz";      // pale cladding piers and corners
const SPAN = "white_concrete";     // storey lines, sills, parapet
const GLASS = "light_blue_stained_glass_pane";
const SLAB = "smooth_stone";       // interior floor slabs
const ROOFC = "gray_concrete";     // roof deck
const MECH = "light_gray_concrete";

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(20, Math.round(gr))));
}
const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Outward normal of a perimeter cell (first missing neighbour in N, S, W, E order).
const normalOf = (x, z) => {
  if (!has(x, z - 1)) return { nx: 0, nz: -1, facing: "north" };
  if (!has(x, z + 1)) return { nx: 0, nz: 1, facing: "south" };
  if (!has(x - 1, z)) return { nx: -1, nz: 0, facing: "west" };
  if (!has(x + 1, z)) return { nx: 1, nz: 0, facing: "east" };
  return null;
};

const isCorner = (x, z) => {
  const xMiss = !has(x - 1, z) || !has(x + 1, z);
  const zMiss = !has(x, z - 1) || !has(x, z + 1);
  return xMiss && zMiss;
};

// Pick entrance: median-x cell on the north (street) face, else any facade cell.
let entrance = null;
{
  const northCells = [];
  const anyCells = [];
  for (const [x, z] of ground.keys().toArray ? [] : []) {}
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (!isPerim(x, z) || isCorner(x, z)) continue;
    const n = normalOf(x, z);
    if (!n) continue;
    anyCells.push({ x, z, n });
    if (n.nz === -1) northCells.push({ x, z, n });
  }
  const pool = northCells.length ? northCells : anyCells;
  if (pool.length) {
    pool.sort((a, b) => a.x - b.x || a.z - b.z);
    entrance = pool[Math.floor(pool.length / 2)];
  }
}

// Main massing: foundation, body, floors, parapet, facade.
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const base = gnd(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= base; y++) put(x, y, z, FOUND);

  const perim = isPerim(x, z);
  const corner = perim && isCorner(x, z);
  const n = perim && !corner ? normalOf(x, z) : null;

  for (let y = base + 1; y <= ROOF; y++) {
    if (!perim) {
      if (y === ROOF) put(x, y, z, ROOFC);
      else if (y % 5 === 0) put(x, y, z, SLAB);
      continue;
    }

    if (y === ROOF) { put(x, y, z, SPAN); continue; }           // parapet cap
    if (corner) {
      put(x, y, z, y % 5 === 0 ? SPAN : PIER);                   // solid corner pier
      continue;
    }

    if (!n) { put(x, y, z, PIER); continue; }

    // Facade: along-wall coordinate decides bay position.
    const along = n.nz !== 0 ? x : z;
    const runsEW = n.nz !== 0; // wall runs east-west when its normal is along z

    if (y % 5 === 0 || y % 5 === 4) {
      put(x, y, z, SPAN);                                        // storey line / sill band
    } else if (along % 3 === 0) {
      put(x, y, z, PIER);                                        // pier between bays
    } else {
      put(x, y, z, GLASS, {
        north: runsEW ? "true" : "false",
        south: runsEW ? "true" : "false",
        east: runsEW ? "false" : "true",
        west: runsEW ? "false" : "true",
        waterlogged: "false",
      });
    }
  }
}

// Warm light: glowstone just behind some lit windows (inside the air gap).
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerim(x, z) || isCorner(x, z)) continue;
  const nrm = normalOf(x, z);
  if (!nrm) continue;
  const along = nrm.nz !== 0 ? x : z;
  const base = gnd(x, z);
  for (let y = base + 1; y < ROOF; y++) {
    if (y % 5 > 3 || y % 5 === 0) continue;
    if (along % 3 === 0) continue;
    if ((along + y) % 4 !== 0) continue;
    const ix = x - nrm.nx, iz = z - nrm.nz;
    if (!has(ix, iz) || isPerim(ix, iz)) continue;
    put(ix, y, iz, "glowstone");
  }
}

// Entrance: double-height door on the street face with a hanging lantern above.
if (entrance) {
  const { x: ex, z: ez, n: en } = entrance;
  const dg = gnd(ex, ez);
  const yl = dg + 1, yu = dg + 2;
  put(ex, yl, ez, "dark_oak_door", { facing: en.facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, yu, ez, "dark_oak_door", { facing: en.facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(ex, dg + 3, ez, "lantern", { hanging: "true", waterlogged: "false" });
}

// Roof plant: a service box on the roof with a lightning rod on top.
for (let x = 3; x <= 8; x++) {
  for (let z = 6; z <= 13; z++) {
    if (!has(x, z) || isPerim(x, z)) continue;
    put(x, ROOF + 1, z, MECH);
    put(x, ROOF + 2, z, MECH);
  }
}
if (has(5, 10) && !isPerim(5, 10)) {
  put(5, ROOF + 3, 10, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
