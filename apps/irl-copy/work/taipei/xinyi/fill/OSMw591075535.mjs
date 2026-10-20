import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075535";
const W = 23, H = 16, D = 13;
const ROOF = 4;        // roof deck sits on the 4-block wall line above lowest ground (lidar record)
const PARAPET = 1;     // one-block parapet above the roof deck

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const at = new Map();
for (const [x, z, gr] of cells) at.set(`${x},${z}`, gr);
const inside = (x, z) => at.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Single-storey 1980s-style commercial block: quartz-tile walls, storefront glass
// on the street (south, +z) face, dark-oak lintel band, parapet and a roof with plant.
function facadeBlock(face, x, z, y, k, roofY) {
  const top = roofY - 1;
  if (k === 0) return ["polished_andesite"];                 // base course
  if (y === top) return ["dark_oak_planks"];                 // lintel / canopy band
  if (face === "S") {
    if (x === 11 && k === 1)
      return ["dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (x === 11 && k === 2)
      return ["dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }];
    if (x % 4 === 0 || x === 22) return ["smooth_quartz"];   // piers
    return ["glass"];
  }
  const along = (face === "N" || face === "S") ? x : z;
  return along % 3 === 1 ? ["glass"] : ["smooth_quartz"];
}

for (const [x, z, gr] of cells) {
  const roofY = Math.max(ROOF, gr);

  // foundation under the cell, up to its own ground
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  const ring = !inside(x, z + 1) || !inside(x, z - 1) || !inside(x + 1, z) || !inside(x - 1, z);
  const face = !inside(x, z + 1) ? "S" : !inside(x, z - 1) ? "N" : !inside(x + 1, z) ? "E" : "W";

  for (let y = gr; y < roofY; y++) {
    const k = y - gr;
    if (ring) {
      const [id, p] = facadeBlock(face, x, z, y, k, roofY);
      set(x, y, z, id, p);
    } else if (k === 0) {
      set(x, y, z, "smooth_quartz");                         // interior floor slab
    }
  }

  // roof deck over every footprint cell
  set(x, roofY, z, "smooth_stone");

  // parapet on the perimeter
  if (ring) set(x, roofY + PARAPET, z, "smooth_quartz");

  // warm light behind a glass pane on the street face
  if (face === "S" && ring && x % 4 === 2 && gr + 1 < roofY && inside(x, z - 1)) {
    set(x, gr + 1, z - 1, "glowstone");
  }
}

// hanging lantern in the entrance bay, visible through the door glass
{
  const gr = at.get("11,12");
  const roofY = Math.max(ROOF, gr ?? ROOF);
  if (gr !== undefined && inside(11, 11) && roofY - 1 > gr) {
    set(11, roofY - 1, 11, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// roof plant boxes and a stair-core bulkhead, only on footprint cells
function box(x0, x1, y0, y1, z0, z1, id) {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) {
      if (!inside(x, z)) return;
    }
  for (let x = x0; x <= x1; x++)
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++) set(x, y, z, id);
}

{
  // use the roof height of the highest footprint ground for equipment levels
  let roofY = ROOF;
  for (const [, , gr] of cells) roofY = Math.max(roofY, gr);
  box(4, 5, roofY + 1, roofY + 1, 3, 4, "light_gray_concrete");   // AC units
  box(17, 18, roofY + 1, roofY + 1, 7, 8, "light_gray_concrete");
  box(14, 15, roofY + 1, roofY + 2, 3, 5, "smooth_quartz");       // stair core bulkhead
}

g.save(`${DIR}/${ID}.nbt`);
