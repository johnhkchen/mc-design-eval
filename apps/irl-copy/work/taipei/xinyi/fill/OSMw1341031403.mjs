import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1341031403";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 46, H = 15, D = 3;
const g = new Voxels([W, H, D]);

const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Low-rise one-storey mid-century shophouse frontage on Xinyi-style street:
// polished granite plinth, shopfront glass with dark mullions, white concrete
// frieze, smooth quartz cornice, grey concrete flat roof with parapet piers.
for (const [xRaw, zRaw, grRaw] of cells) {
  const x = Math.round(xRaw), z = Math.round(zRaw), gr = Math.round(grRaw);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const isEnd = x === 0 || x === W - 1;
  const isDoor = z === 0 && x === 23;

  if (isEnd) {
    // solid end walls close the shell
    for (let y = gr; y <= gr + 2; y++)
      for (let zz = 0; zz < D; zz++) put(x, y, zz, "white_concrete");
  }

  if (z === 0) {
    // street facade
    if (isDoor) {
      put(x, gr, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else if (!isEnd) {
      put(x, gr, z, "polished_granite");                       // base course
      if (x % 4 === 0) put(x, gr + 1, z, "dark_oak_planks");   // mullion frames
      else put(x, gr + 1, z, "glass_pane");                    // shopfront glazing
    }
    if (!isEnd) put(x, gr + 2, z, "white_concrete");           // frieze / transom
    put(x, gr + 3, z, "smooth_quartz");                        // cornice
    if (x % 8 === 0 && gr + 4 < H && !isEnd) put(x, gr + 4, z, "smooth_quartz"); // parapet piers
  } else if (z === 1) {
    // air gap behind the glazing, warm lights in some bays
    if (!isEnd && x % 5 === 2 && !isDoor) put(x, gr + 1, z, "shroomlight");
    put(x, gr + 3, z, "gray_concrete");                        // roof
  } else {
    // back wall and roof
    for (let y = gr; y <= gr + 2; y++) put(x, y, z, "white_concrete");
    put(x, gr + 3, z, "gray_concrete");
  }
}

g.save(`${dir}/${id}.nbt`);
