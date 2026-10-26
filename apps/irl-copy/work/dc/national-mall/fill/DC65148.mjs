// DC65148: 1001 O St NW, a brick residential flats block (c.1910s Edwardian walk-up, flat roof, stone coping).
// Three-to-five storeys at ~1 block a storey: the lidar roof heights are the massing (front 6, sides 5, rear 3-4).
// Shell = brick piers with glass panes between; the core is air behind the glass with a floor slab at storey lines.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC65148.cells.json", "utf8"));

const built = new Map();                       // "x,z" -> { g, r }; roof 0 = open court, not built
for (const [x, z, g, r] of cells) built.set(`${x},${z}`, { g, r });
const has = (x, z) => (built.get(`${x},${z}`)?.r ?? 0) > 0;

const g = new Voxels([3, 18, 8]);

const GLASS_SIDE = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane running along z, on the x faces
const GLASS_END = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // pane running along x, on the z faces
const pane = (x, y, z, face) => g.set(x, y, z, "glass_pane", face === "side" ? GLASS_SIDE : GLASS_END);

for (const [x, z, , r] of cells) {
  if (r <= 0) continue;
  const sideOpen = !has(x - 1, z) || !has(x + 1, z);      // exposed on an x face
  const endOpen = !has(x, z - 1) || !has(x, z + 1);       // exposed on a z face
  const shell = sideOpen || endOpen;
  const face = sideOpen ? "side" : "end";

  for (let y = 0; y < r; y++) {
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }                // base course / ground floor slab
    if (y === r - 1) {                                                         // stone coping on the shell, roof deck inside
      if (shell) g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });   // thin coping, not a stone band
      else g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (!shell) {                                                              // core: a floor slab per storey, air between
      if (y === 2 || y === 4) g.set(x, y, z, "smooth_stone");
      continue;
    }
    // shell middle rows: window grid, piers every other bay (x faces), glass centred on end faces
    const bay = face === "side" ? z % 2 === 1 : x === 1;
    if (bay) pane(x, y, z, face); else g.set(x, y, z, "bricks");
  }

}

// warm light behind some first-floor windows: a lantern on the core floor, inside the glass
for (const z of [1, 5]) if (has(1, z)) g.set(1, 1, z, "lantern", { hanging: "false", waterlogged: "false" });

// entrance: dark oak door in the nose, two blocks high, on the front (north) face
g.set(1, 0, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(1, 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// flat-roof chimney stack on the rear-side roof, standing on the coping
g.set(0, 4, 5, "bricks");
g.set(0, 5, 5, "bricks");

// the court is open to the sky at grade: paved floor, nothing built above it
g.set(1, 0, 3, "smooth_stone");
g.set(2, 0, 3, "smooth_stone");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC65148.nbt");
