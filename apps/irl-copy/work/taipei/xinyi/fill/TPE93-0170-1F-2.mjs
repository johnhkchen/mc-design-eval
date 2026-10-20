import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE93-0170-1F-2";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 81, D = 7;
const g = new Voxels([W, H, D]);

// 2004 Xinyi mid-rise: tinted glass between white concrete mullions and light-grey
// fins, quartz corner columns, smooth stone storey lines every 5 blocks,
// stone base and plinth, mechanical penthouse with a mast on top.
const ROOF = 69;                       // roof slab top sits at y = 69
const GLASS = "light_blue_stained_glass";
const WALL = "white_concrete";
const FIN = "light_gray_concrete";
const CORNER = "quartz_pillar";
const LINE = "smooth_stone";
const BASE = "stone_bricks";
const FOUND = "stone_bricks";
const ROOFC = "smooth_stone";
const PENT = "light_gray_concrete";
const GLOW = "glowstone";

const key = (x, z) => `${x},${z}`;
const have = new Set(cells.map(([x, z]) => key(x, z)));
const groundAt = new Map(cells.map(([x, z, gz]) => [key(x, z), Math.round(gz)]));

const isEdge = (x, z) => x === 0 || x === 6 || z === 0 || z === 6;
const isCorner = (x, z) => (x === 0 || x === 6) && (z === 0 || z === 6);
// Position along the face: 0..6 across the 7-wide elevation.
const along = (x, z) => ((x === 0 || x === 6) ? z : x);
// Fins at along = 1 and 5 (and the corners are their own columns); mullion at 3.
const isFin = (x, z) => { const a = along(x, z); return a === 1 || a === 5; };
const isMullion = (x, z) => along(x, z) === 3;

// Body, foundations, storey lines, windows, floor slabs and roof per cell.
for (const [x, z, gzRaw] of cells) {
  const gz = Math.round(gzRaw);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gz; y++) g.set(x, y, z, FOUND);

  if (gz >= ROOF) continue;
  const edge = isEdge(x, z);

  for (let y = gz; y < ROOF; y++) {
    const r = y % 5;
    let id = null;
    if (edge) {
      if (y === gz) id = BASE;                                   // base course
      else if (r === 0) id = LINE;                               // storey line
      else if (isCorner(x, z)) id = CORNER;                      // corner columns
      else if (isFin(x, z)) id = FIN;                            // full-height fins
      else if (isMullion(x, z)) id = WALL;                       // mullion
      else if (r === 4) id = WALL;                               // spandrel
      else id = GLASS;                                           // recessed glazing
    } else {
      if (y === gz || r === 0) id = LINE;                        // floor slab, air elsewhere
    }
    if (id) g.set(x, y, z, id);
  }

  // Roof slab over the footprint and a parapet ring on the edge.
  g.set(x, ROOF, z, ROOFC);
  if (edge) {
    g.set(x, ROOF + 1, z, WALL);
    g.set(x, ROOF + 2, z, WALL);
  }
}

// Lit interior cells behind the glass, a few per storey.
for (const [x, z] of cells) {
  if (isEdge(x, z)) continue;
  const side = (x === 1 && z === 3) || (x === 5 && z === 3) || (x === 3 && z === 1) || (x === 3 && z === 5);
  if (!side) continue;
  const gz = groundAt.get(key(x, z));
  for (let y = gz + 1; y < ROOF; y++) {
    if (y % 5 !== 2) continue;
    const k = Math.floor(y / 5);
    if ((k + x + z) % 3 === 0) g.set(x, y, z, GLOW);
  }
}

// Mechanical penthouse on the centre 3x3 with a lightning-rod mast.
for (const [x, z] of cells) {
  if (x >= 2 && x <= 4 && z >= 2 && z <= 4) {
    for (let y = ROOF + 1; y <= ROOF + 3; y++) g.set(x, y, z, PENT);
  }
}
if (have.has(key(3, 3))) {
  for (let y = ROOF + 4; y <= ROOF + 7; y++) {
    g.set(3, y, 3, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

// Entrance on the south (z = 6) face at x = 3: stone plinth and jambs, door, canopy.
if (have.has(key(3, 6))) {
  const g0 = groundAt.get(key(3, 6));
  for (const x of [2, 4]) {
    if (have.has(key(x, 6))) {
      g.set(x, g0, 6, BASE);
      g.set(x, g0 + 1, 6, BASE);
      g.set(x, g0 + 2, 6, BASE);
    }
  }
  g.set(3, g0, 6, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(3, g0 + 1, 6, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const x of [2, 3, 4]) {
    if (have.has(key(x, 6))) {
      g.set(x, g0 + 3, 6, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
