import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey 1980s Xinyi commercial block: stone-base shopfront,
// cream quartz frame, tinted glass window grid, parapet roof with a plant box.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540298918";
const W = 12, H = 23, D = 17;

const ROOF_Y = 11;   // roof slab, ~11 blocks above lowest ground
const FLOOR_Y = 6;   // second-floor deck / ground-floor ceiling
const LINE_Y = 5;    // storey line
const PARAPET_Y = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));

const inS = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const isPerim = (x, z) =>
  inS(x, z) && !(inS(x + 1, z) && inS(x - 1, z) && inS(x, z + 1) && inS(x, z - 1));
const outward = (x, z) =>
  !inS(x, z - 1) ? "north" : !inS(x, z + 1) ? "south" : !inS(x + 1, z) ? "east" : "west";
const bay = (x, z) => (x + z) % 3 === 0; // pilaster bays

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y <= G(x, z); y++) put(x, y, z, "stone_bricks");
}

// 2. Facade on perimeter cells.
const pane = (x, z, y) => {
  const c = (nx, nz) => (isPerim(nx, nz) && y > G(nx, nz) ? "true" : "false");
  return { north: c(x, z - 1), south: c(x, z + 1), east: c(x + 1, z), west: c(x - 1, z), waterlogged: "false" };
};

for (const [x, z, gr] of cells) {
  if (!isPerim(x, z) || gr >= ROOF_Y) continue;
  const isBay = bay(x, z);
  for (let y = gr + 1; y <= PARAPET_Y; y++) {
    if (y <= 4) {
      if (isBay) put(x, y, z, "polished_granite");
      else put(x, y, z, "cyan_stained_glass_pane", pane(x, z, y));
    } else if (y === LINE_Y) {
      put(x, y, z, "stone_bricks");
    } else if (y === FLOOR_Y) {
      put(x, y, z, "smooth_quartz");           // sill / deck line
    } else if (y <= 9) {
      if (isBay) put(x, y, z, "quartz_pillar");
      else put(x, y, z, "cyan_stained_glass_pane", pane(x, z, y));
    } else if (y === 10) {
      put(x, y, z, "smooth_quartz");           // header
    } else if (y === ROOF_Y) {
      put(x, y, z, "smooth_quartz");           // cornice
    } else if (y === PARAPET_Y) {
      if (isBay) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// 3. Entrance: pick a non-pilaster ground-floor perimeter cell, favouring the
//    middle of the street front (north side). Door, lintel above.
let door = null;
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z) || bay(x, z) || gr + 2 > 5 || gr + 1 > 4) continue;
  const out = outward(x, z);
  const score = Math.abs(x - 5.5) + (out === "north" ? 0 : 4) + gr * 0.5;
  if (!door || score < door.score) door = { x, z, gr, out, score };
}
if (door) {
  const { x, z, gr, out } = door;
  const base = { facing: out, hinge: "left", open: "false", powered: "false" };
  put(x, gr + 1, z, "dark_oak_door", { ...base, half: "lower" });
  put(x, gr + 2, z, "dark_oak_door", { ...base, half: "upper" });
  if (gr + 3 <= 4) put(x, gr + 3, z, "stone_bricks");
}

// 4. Interior: second-floor deck, solid core where ground rises above the deck,
//    roof surface, plant box on the roof, and a few warm lights.
for (const [x, z, gr] of cells) {
  if (isPerim(x, z) || gr >= ROOF_Y) continue;
  if (gr < FLOOR_Y) {
    put(x, FLOOR_Y, z, "smooth_quartz");
  } else {
    for (let y = gr + 1; y <= 10; y++) put(x, y, z, "smooth_quartz");
  }
  put(x, ROOF_Y, z, "gray_concrete");

  // roof plant box, centred
  if (x >= 4 && x <= 7 && z >= 6 && z <= 10) {
    put(x, 12, z, "light_gray_concrete");
    put(x, 13, z, "light_gray_concrete");
  }

  // warm light behind the second-floor glazing
  if (gr < 8 && (2 * x + 3 * z) % 7 === 1) put(x, 8, z, "glowstone");
  // warm light behind the shopfront
  if (gr < 2 && (x + 2 * z) % 5 === 0) put(x, 2, z, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
