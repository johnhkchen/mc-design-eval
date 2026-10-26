import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A two-storey red-brick commercial block on a stone plinth, with a stone cornice on the street (z 0) face and a
// dark flat roof behind. Roof heights step down to the east (x 6-7) into lower wings, as the lidar has them.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC56994.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..7, z 0..2

const g = new Voxels([8, 16, 3]);

const PLINTH = "polished_andesite", BRICK = "bricks", STONE = "smooth_stone", ROOF = "deepslate_tiles";
const WIN = "glass_pane", FLOOR = "smooth_stone_slab", LAMP = "lantern", GLOW = "glowstone";
const frontPane = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const sidePane = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

for (const [x, z, ground, roof] of cells) {
  for (let y = ground; y < roof; y++) {
    const top = y === roof - 1;
    // the plinth: a stone course from the lowest ground up to the first storey
    if (y === 0) { g.set(x, y, z, PLINTH); continue; }
    // the cap: cornice on the street face, flat roof behind it; two glazed skylights in the main roof
    if (top) {
      if (z === 0) g.set(x, y, z, STONE);
      else if (z === 1 && roof === 4 && (x === 2 || x === 4)) g.set(x, y, z, "glass");
      else g.set(x, y, z, ROOF);
      continue;
    }
    // storey layers
    if (z === 0) {
      if (x === 0 || x === 6) g.set(x, y, z, STONE);                       // corner quoins
      else if (x === 1 || x === 5) g.set(x, y, z, WIN, frontPane);         // window bays
      else if (x === 3) g.set(x, y, z, "dark_oak_door", door(y === 1 ? "lower" : "upper"));   // entrance
      else if (y === 1) g.set(x, y, z, LAMP, { hanging: "false", waterlogged: "false" });  // lamps beside the door
      else g.set(x, y, z, BRICK);
    } else if (z === 1) {
      if (x === 0) g.set(x, y, z, WIN, sidePane);                           // west end window
      else if (y === 2 && x === 3) g.set(x, y, z, LAMP, { hanging: "true", waterlogged: "false" });
      else if (y === 2 && x >= 1 && x <= 5) g.set(x, y, z, FLOOR, { type: "bottom", waterlogged: "false" });   // upper floor slab
      else if (y === 1 && (x === 1 || x === 5)) g.set(x, y, z, GLOW);       // glowstone behind the windows
    } else {
      if (x === 7) g.set(x, y, z, WIN, sidePane);                           // east end window
      else if (x % 2 === 1) g.set(x, y, z, WIN, sidePane);                  // rear windows
      else g.set(x, y, z, BRICK);
    }
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC56994.nbt";
const r = g.save(out);
console.log(JSON.stringify({ file: out, ...r }));
