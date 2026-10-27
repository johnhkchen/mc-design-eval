import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1930s brick shop-top on a diagonal street: two storeys over timber-fronted shops, cream render string courses
// and cornice, a flat parapet, and a taller corner block (the lidar's 7-block roof) with a plant room on top.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_434302533.cells.json", "utf8"));   // [x, z, ground, roof]

const g = new Voxels([8, 20, 15]);

// glass is a solid pane here: thin glass_pane reads as a hole at street distance
const FOUND = "stone_bricks", BRICK = "bricks", RENDER = "smooth_quartz", TIMBER = "dark_oak_planks", GLASS = "light_blue_stained_glass";
const LIGHT = "glowstone", PLANT = "stone_bricks", PLANT_CAP = "stone_brick_slab";

// Lidar roof heights snapped to three flat tiers (single storey, shop + mezzanine, two storeys): no noise steps.
const tierTop = (r) => (r <= 4 ? 4 : r <= 6 ? 6 : 7);

for (const [x, z, gr, roof] of cells) {
  const T = tierTop(roof);
  // foundation under the ground line, then a stone plinth on the ground row
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);
  g.set(x, gr, z, FOUND);

  // bays: even rows are glazed bays, odd rows are timber (ground) or brick (upper) piers
  const bay = z % 2 === 0;
  const shopRow = (y) => (bay ? GLASS : TIMBER);
  const upperRow = (y) => (bay ? (((x + z) % 4 === 0 && y === gr + 4) ? LIGHT : GLASS) : BRICK);

  for (let y = gr + 1; y < T; y++) {
    let b = null;
    if (T <= 4) {
      b = y === T - 1 ? RENDER : shopRow(y);                       // single shop storey under a render cornice
    } else if (y === T - 1) {
      b = RENDER;                                                  // cornice / parapet
    } else if (y === gr + 3) {
      b = RENDER;                                                  // storey line
    } else if (y <= gr + 2) {
      b = shopRow(y);                                              // ground shopfronts
    } else {
      b = upperRow(y);                                             // upper storey
    }
    g.set(x, y, z, b);
  }
}

// Entrance: the door cell on the west face of the mid-north shop, with its render canopy above
const door = cells.find(([x, z]) => x === 6 && z === 1);
if (door) {
  const [x, z, gr] = door;
  g.set(x, gr + 1, z, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Roof: a plant room on the corner block, and a brick chimney on the northern tall cell
for (const [x, z, gr, roof] of cells) {
  if (tierTop(roof) !== 7) continue;
  if ((x === 5 && (z === 4 || z === 5))) {
    g.set(x, 7, z, PLANT);
    g.set(x, 8, z, PLANT_CAP, { type: "bottom" });
  }
  if (x === 6 && z === 2) {
    g.set(x, 7, z, BRICK);
    g.set(x, 8, z, BRICK);
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_434302533.nbt");
