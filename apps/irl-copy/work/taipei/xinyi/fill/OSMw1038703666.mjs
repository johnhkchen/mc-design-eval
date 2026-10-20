import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1038703666.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1038703666.nbt";

const W = 19, H = 23, D = 17;
const ROOF_Y = 11;      // roof slab level, about 11 blocks above lowest ground
const PARAPET_Y = 12;   // parapet course on the roof edge
const FLOOR_Y = [5, 10]; // storey lines (2 storeys of 5 blocks)

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(gr, ROOF_Y - 2)));
}
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);

const stairsSlab = (id, type) => ({ type, waterlogged: "false" });

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Which outer faces does this cell sit on?
  const faces = [];
  if (!has(x, z - 1)) faces.push("north");
  if (!has(x, z + 1)) faces.push("south");
  if (!has(x - 1, z)) faces.push("west");
  if (!has(x + 1, z)) faces.push("east");
  const edge = faces.length > 0;
  const corner = faces.length >= 2;
  // Column index along the face, for window rhythm
  const along = faces.includes("north") || faces.includes("south") ? x : z;
  const isWindowCol = along % 2 === 1 && !corner;

  // Entrance: centre of the south face at ground floor
  const isEntrance = faces.includes("south") && z === D - 1 && x === 9;

  for (let y = gr; y <= ROOF_Y; y++) {
    if (y === ROOF_Y) {
      // Roof slab over every cell
      if (edge) g.set(x, y, z, "stone_brick_slab", stairsSlab(), { type: "bottom", waterlogged: "false" });
      else g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    if (!edge) {
      // Interior: floor slabs only, no interiors (air elsewhere)
      if (FLOOR_Y.includes(y)) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Facade cells
    if (y === gr) {
      g.set(x, y, z, "polished_granite");
      continue;
    }
    if (FLOOR_Y.includes(y)) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }
    if (corner) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    const storeyWindowRow =
      (y >= gr + 1 && y <= 4) || (y >= 6 && y <= 9);

    if (isEntrance) {
      if (y === gr + 1) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
        });
      } else if (y === gr + 2) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
        });
      } else if (y === gr + 3 || y === gr + 4) {
        g.set(x, y, z, "glass_pane");
      } else if (y <= 4 || y >= 6) {
        g.set(x, y, z, "white_concrete");
      }
      continue;
    }

    if (storeyWindowRow && isWindowCol) {
      // Sparse warm-lit windows, the rest plain glass
      const lit = (x * 7 + z * 3 + y) % 9 === 0;
      g.set(x, y, z, lit ? "orange_stained_glass_pane" : "glass_pane");
    } else {
      g.set(x, y, z, "white_concrete");
    }
  }

  // Parapet on the roof edge
  if (edge) g.set(x, PARAPET_Y, z, "white_concrete");

  // Roof plant room in the core
  const core = !edge && x >= 6 && x <= 12 && z >= 5 && z <= 11;
  if (core) {
    g.set(x, 12, z, "light_gray_concrete");
    g.set(x, 13, z, "white_concrete");
    g.set(x, 14, z, "stone_brick_slab", stairsSlab(), { type: "bottom", waterlogged: "false" });
  }
}

// Lightning rod on the plant room cap, centre of the roof
if (has(9, 8)) g.set(9, 15, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(OUT);
