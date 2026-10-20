import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unknown record, so this is a generic early-2000s Xinyi mid-rise: a 4-storey
// white-tile and grey-concrete commercial block with a ground-floor shopfront,
// a stone plinth, storey lines every 5 blocks, a parapet at y 21, and a plant
// box on the roof. Footprint 18 x 69 cells, roof about 21 blocks above the
// lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109955";
const W = 18, H = 33, D = 69;
const PARAPET_Y = 21;   // parapet course (top of roof)
const TOP_SLAB_Y = 20;  // top storey line under the roof deck
const DECK_Y = 21;      // roof deck, interior cells

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const out = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.max(0, Math.round(gr)));
const has = (x, z) => ground.has(key(x, z));

// Outward faces of a footprint cell: cells with a missing neighbour.
function outwardFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

// Pick the main entrance: a south-facing edge cell near the middle of the width.
let doorCell = null;
for (const [x, z] of cells) {
  if (outwardFaces(x, z).includes("S") && x === Math.floor(W / 2)) { doorCell = key(x, z); break; }
}
if (!doorCell) {
  for (const [x, z] of cells) {
    if (outwardFaces(x, z).includes("S")) { doorCell = key(x, z); break; }
  }
}

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const g0 = Math.max(0, Math.round(gr));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g0; y++) out.set(x, y, z, "stone");

  const faces = outwardFaces(x, z);
  const edge = faces.length > 0;

  if (!edge) {
    // Interior: air gap, with a floor slab at each storey line and at the ground.
    for (let y = g0; y <= TOP_SLAB_Y; y++) {
      if (y % 5 === 0 || y === g0) out.set(x, y, z, "smooth_stone");
    }
    // Roof deck on the top slab.
    if (DECK_Y > g0) out.set(x, DECK_Y, z, "stone");
    // Rooftop plant box in the middle of the roof.
    if (DECK_Y > g0 && x >= 5 && x <= 12 && z >= 25 && z <= 43) {
      out.set(x, 22, z, "light_gray_concrete");
      out.set(x, 23, z, "light_gray_concrete");
      out.set(x, 24, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
    continue;
  }

  // Facade (edge) cell.
  const corner = faces.length >= 2;
  const alongNS = faces[0] === "N" || faces[0] === "S";
  const along = alongNS ? x : z;
  const isDoor = doorCell === key(x, z);

  for (let y = g0; y <= TOP_SLAB_Y; y++) {
    if (y === g0) {
      out.set(x, y, z, "polished_andesite");           // base course
    } else if (y % 5 === 0) {
      out.set(x, y, z, "smooth_stone");                // storey line
    } else if (y % 5 === 4) {
      out.set(x, y, z, "white_concrete");              // spandrel
    } else if (corner) {
      out.set(x, y, z, "light_gray_concrete");         // corner column
    } else if (along % 3 === 0) {
      out.set(x, y, z, "light_gray_concrete");         // mullion pier
    } else {
      const ground = y < 5;
      if (!ground && y % 5 === 2 && (along + y) % 4 === 0) {
        out.set(x, y, z, "glowstone");                 // lit office window
      } else {
        const pane = ground ? "glass_pane" : "light_blue_stained_glass_pane";
        out.set(x, y, z, pane, alongNS ? { ...PANE_NS } : { ...PANE_EW });
      }
    }
  }

  // Entrance door with a lintel above it.
  if (isDoor && g0 + 2 <= TOP_SLAB_Y) {
    out.set(x, g0, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    out.set(x, g0 + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    out.set(x, g0 + 2, z, "stone_bricks");
  }

  // Interior floor slab behind the facade at storey lines (air gap behind the glass).
  // Only the air cells just inside the shell get slabs so nothing hangs.
  // (Interior cells are handled above.)

  // Parapet and roof edge.
  if (g0 <= PARAPET_Y) {
    out.set(x, PARAPET_Y, z, corner ? "stone_bricks" : "stone_bricks");
  }
}

out.save(`${DIR}/${ID}.nbt`);
