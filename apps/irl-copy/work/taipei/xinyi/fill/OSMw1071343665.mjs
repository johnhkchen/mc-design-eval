import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343665.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343665.nbt";

const W = 13, H = 23, D = 12;

// Two-storey post-war commercial block: tiled white concrete walls, stone base
// and cornice, shopfront glazing on the ground storey, a ribbon of windows above,
// a flat roof with a small plant box, and a few lit windows for dusk.
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));

const has = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

const minG = Math.min(...ground.values());
const ROOF = minG + 11; // flat roof level, about 11 blocks above the lowest ground

const inPlant = (x, z) => x >= 4 && x <= 7 && z >= 4 && z <= 7;

function glassProps(x, z) {
  const ex = (has(x - 1, z) && isEdge(x - 1, z)) || (has(x + 1, z) && isEdge(x + 1, z));
  const nz = (has(x, z - 1) && isEdge(x, z - 1)) || (has(x, z + 1) && isEdge(x, z + 1));
  return {
    east: ex ? "true" : "false",
    west: ex ? "true" : "false",
    north: nz ? "true" : "false",
    south: nz ? "true" : "false",
    waterlogged: "false",
  };
}

// n = storey index (1 ground, 2 upper); b = height above minG
function storey(x, z, b, n) {
  const bay = (x + z) % 3;
  const lit = (x * 3 + z) % 7 === 2;
  if (n === 1 && b === 4) return { id: "smooth_stone" };        // lintel
  if (n === 2 && b === 9) return { id: "smooth_stone" };        // lintel
  if (bay === 0) return { id: "gray_concrete" };                 // mullion
  if (n === 1 && b === 1) return { id: "glass_pane", props: glassProps(x, z) }; // shopfront glazing
  if ((n === 1 && b === 2 && lit) || (n === 2 && b === 7 && lit)) return { id: "glowstone" };
  return { id: "glass_pane", props: glassProps(x, z) };
}

function pick(x, z, y) {
  const gr = ground.get(key(x, z));
  const edge = isEdge(x, z);
  if (y < gr) return { id: "stone_bricks" };                    // foundation
  if (y > ROOF) return null;
  if (y === ROOF) {
    if (edge) return { id: "smooth_stone_slab", props: { type: "bottom", waterlogged: "false" } }; // parapet cap
    if (inPlant(x, z)) return { id: "light_gray_concrete" };    // plant box
    return null;
  }
  if (y === ROOF - 1 + 1 - 1 + 0 && false) return null;
  const b = y - minG;
  if (b === 0) return { id: edge ? "stone_bricks" : "smooth_stone" };   // base course / floor
  if (b === 5) return { id: "smooth_stone" };                            // storey line / floor slab
  if (b === 10) return { id: edge ? "smooth_stone" : "gray_concrete" };  // cornice / roof membrane
  if (!edge) return null;
  if (b >= 1 && b <= 4) return storey(x, z, b, 1);
  if (b >= 6 && b <= 9) return storey(x, z, b, 2);
  return null;
}

// Main pass
for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  const top = Math.min(H - 1, ROOF + 1);
  for (let y = 0; y <= top; y++) {
    const blk = pick(x, z, y);
    if (!blk) continue;
    if (blk.props) g.set(x, y, z, blk.id, blk.props);
    else g.set(x, y, z, blk.id);
  }
}

// Entrance on the north (min z) face, nearest the middle of the frontage
const frontCells = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => isEdge(x, z) && !has(x, z - 1));
if (frontCells.length) {
  const meanX = frontCells.reduce((s, [x]) => s + x, 0) / frontCells.length;
  const [dx, dz] = frontCells.reduce((best, c) =>
    Math.abs(c[0] - meanX) < Math.abs(best[0] - meanX) ? c : best);
  const gr = ground.get(key(dx, dz));
  const lower = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
  const upper = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
  if (minG + 1 >= gr && minG + 1 < H) g.set(dx, minG + 1, dz, "dark_oak_door", lower);
  if (minG + 2 >= gr && minG + 2 < H) g.set(dx, minG + 2, dz, "dark_oak_door", upper);
}

g.save(OUT);
