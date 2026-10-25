import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499616";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 59, H = 22, D = 67;
const g = new Voxels([W, H, D]);

const CX = 29;          // ridge line along z through the middle of the 59-block width

const STONE = "stone_bricks";
const RENDER = "calcite";
const ROOF = "deepslate_tile_stairs";
const RIDGE = "deepslate_tiles";
const FLOOR = "smooth_stone";
const CEIL = "spruce_planks";
const FRAME = "stone_brick_slab";
const CAP = "deepslate_tiles";

const cellMap = new Map();
for (const [x, z, gr, roof] of cells) cellMap.set(`${x},${z}`, { x, z, gr, roof });
const has = (x, z) => cellMap.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Per-cell massing: walls to eave, pitched centre roof (1:2) rising to ridge, lower aisle wings
function profile(gr, roof) {
  const ridge = Math.min(H - 3, Math.max(roof, gr + 9));
  const eave = Math.max(gr + 5, ridge - 5);
  return { ridge, eave };
}

for (const { x, z, gr, roof } of cellMap.values()) {
  const { ridge, eave } = profile(gr, roof);
  const d = Math.abs(x - CX);
  // pitch 1:2 from the ridge down to the eaves, flat wings beyond
  const top = Math.max(eave, ridge - Math.ceil(d / 2));

  // Foundation: solid from y 0 up to ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, STONE);
  g.set(x, gr, z, FLOOR);

  const edge = isEdge(x, z);

  if (edge) {
    // Walls: rubble base course, then render above, with a cornice band at the eave
    for (let y = gr + 1; y < eave; y++) {
      g.set(x, y, z, y === gr + 1 ? STONE : RENDER);
    }
    g.set(x, eave - 1, z, FRAME);
  } else {
    // Tie beam ceiling across the interior; air between
    g.set(x, eave - 1, z, CEIL);
  }

  // Solid deck beneath every roof block so nothing floats
  for (let y = eave; y < top; y++) g.set(x, y, z, CEIL);

  // Roof surface
  if (top === eave) {
    // Flat aisle wing roof: full cap block sitting on the walls
    g.set(x, top, z, CAP);
  } else if (x === CX) {
    g.set(x, top, z, RIDGE);
  } else if (x < CX) {
    g.set(x, top, z, ROOF, { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" });
  } else {
    g.set(x, top, z, ROOF, { facing: "east", half: "bottom", shape: "straight", waterlogged: "false" });
  }
}

// Openings, glazing, lanterns, entrances
for (const { x, z, gr, roof } of cellMap.values()) {
  if (!isEdge(x, z)) continue;
  const { eave } = profile(gr, roof);

  // Long sides: window grids every 4 blocks along z, lit behind glass in some bays
  const longSide = (!has(x - 1, z) || !has(x + 1, z)) && z > 2 && z < D - 3;
  if (longSide && z % 4 === 2) {
    const inward = !has(x - 1, z) ? 1 : -1;
    for (let y = gr + 2; y <= gr + 3 && y < eave - 1; y++) g.set(x, y, z, "glass_pane");
    g.set(x, gr + 1, z, FRAME);
    g.set(x, gr + 4, z, FRAME);
    if (z % 8 === 2 && has(x + inward, z)) g.set(x + inward, gr + 2, z, "shroomlight");
  }

  // Gable ends: central cart opening with lintel, small windows either side
  const gable = z === 0 || z === D - 1 || !has(x, z - 1) || !has(x, z + 1);
  if (gable && (z === 0 || z === D - 1)) {
    const ad = Math.abs(x - CX);
    if (ad <= 3) {
      for (let y = gr + 1; y <= gr + 4 && y < eave - 1; y++) g.set(x, y, z, "air");
      g.set(x, gr + 5, z, FRAME);
      if (ad === 3) { g.set(x, gr + 1, z, "stripped_oak_log"); }
    } else if (ad >= 7 && ad <= 9 && eave - gr > 4) {
      g.set(x, gr + 2, z, "glass_pane");
      g.set(x, gr + 3, z, "glass_pane");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
