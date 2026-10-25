import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR301499457.cells.json`, "utf8"));

const SX = 10, SH = 17, SZ = 5;
const g = new Voxels([SX, SH, SZ]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= SX || z < 0 || z >= SZ || y < 0 || y >= SH) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Index footprint cells
const cellMap = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  cellMap.set(`${x},${z}`, { gr: Math.round(gr), rf: Math.round(rf) });
}

for (const [key, { gr, rf }] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const gg = gr;
  // Flat roof follows the lidar height; at least 5 blocks so the window band,
  // lintel and cornice all fit above the ground floor.
  const R = Math.min(Math.max(rf, gg + 5), 14);

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");

  const isPerimeter = x === 0 || x === 9 || z === 0 || z === 4;
  const isFront = z === 0 || z === 4;
  const isCorner = (x === 0 || x === 9) && isFront;

  if (isPerimeter) {
    // Walls, base course, cornice, roof membrane, parapet slab
    for (let y = gg; y <= R - 2; y++) {
      if (y === gg) put(x, y, z, "stone_bricks");
      else if (isCorner) put(x, y, z, "dark_oak_log", { axis: "y" });
      else put(x, y, z, "smooth_quartz");
    }
    put(x, R - 1, z, "stone_bricks");           // cornice course
    put(x, R, z, "deepslate_tiles");            // roof membrane (slate)
    put(x, R + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // parapet

    // Street (z=0) and rear (z=4) facade articulation
    if (isFront && x >= 1 && x <= 8) {
      for (let y = gg + 1; y <= gg + 2; y++) {
        if (x === 2 || x === 3 || x === 6 || x === 7) {
          put(x, y, z, "glass_pane", {
            east: "true", west: "true", north: "false", south: "false", waterlogged: "false",
          });
        } else if (x === 4 && z === 0) {
          put(x, y, z, "dark_oak_door", {
            facing: "south",
            half: y === gg + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (x === 1 || x === 8) {
          put(x, y, z, "dark_oak_log", { axis: "y" }); // timber window pillars
        } else {
          put(x, y, z, "smooth_quartz");
        }
      }
      // Lintel band with a hanging lantern over the entrance
      if (x === 4 && z === 0) {
        put(x, gg + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else {
        put(x, gg + 3, z, "dark_oak_planks");
      }
    }
  } else {
    // Interior cells: hollow room, ground floor slab, ceiling, roof membrane
    put(x, gg, z, "smooth_stone");
    put(x, R - 1, z, "smooth_stone");
    put(x, R, z, "deepslate_tiles");

    // Warm lights behind the glass
    if (x === 2 && z === 1) put(x, gg + 1, z, "glowstone");
    if (x === 6 && z === 3) put(x, gg + 1, z, "glowstone");
  }
}

g.save(`${DIR}/FR301499457.nbt`);
