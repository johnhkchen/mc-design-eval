import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542017377";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 23, D = 8;
const g = new Voxels([W, H, D]);

const minG = Math.min(...cells.map(c => c[2]));
const minX = Math.min(...cells.map(c => c[0]));
const maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));
const midX = Math.floor((minX + maxX) / 2);

const key = (x, z) => `${x},${z}`;
const footprint = new Set(cells.map(c => key(c[0], c[1])));
const inside = (x, z) => footprint.has(key(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Two-storey 1980s Xinyi-era commercial block: quartz-tile walls, red terracotta
// lintel band, glazed shopfront, glazed upper storey with warm stained-glass
// panes, quartz parapet and a small roof plant box.
for (const [x, z, ground] of cells) {
  const gr = ground - minG;

  // Foundation up to the cell's ground, then the plinth course.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "polished_granite");

  // Roof deck over every cell.
  put(x, gr + 10, z, "smooth_quartz");

  const edge = !inside(x - 1, z) || !inside(x + 1, z) ||
               !inside(x, z - 1) || !inside(x, z + 1);

  if (!edge) {
    // Interior: floor slabs for each storey, air between.
    put(x, gr + 5, z, "smooth_quartz");

    // Roof plant box near the middle of the roof.
    if (x >= minX + 4 && x <= minX + 6 && z >= minZ + 2 && z <= minZ + 3) {
      put(x, gr + 11, z, "gray_concrete");
    }
    continue;
  }

  // Edge cell: full facade.
  const u = x + z; // position along whichever face this cell sits on
  const pier = u % 3 === 0;

  // Storey line between floors.
  put(x, gr + 5, z, "chiseled_quartz_block");

  // Ground floor shopfront: kickplate, glazing, red terracotta lintel.
  put(x, gr + 1, z, "polished_andesite");
  for (const y of [gr + 2, gr + 3]) {
    put(x, y, z, pier ? "quartz_pillar" : "light_blue_stained_glass");
  }
  put(x, gr + 4, z, "red_terracotta");

  // Upper storey: sill, glazing with warm panes, lintel.
  put(x, gr + 6, z, "smooth_quartz");
  for (const y of [gr + 7, gr + 8]) {
    if (pier) put(x, y, z, "quartz_pillar");
    else if ((u + y) % 4 === 0) put(x, y, z, "yellow_stained_glass");
    else put(x, y, z, "light_blue_stained_glass");
  }
  put(x, gr + 9, z, "smooth_quartz");

  // Parapet cornice on the roof edge.
  put(x, gr + 11, z, "quartz_slab", { type: "bottom", waterlogged: "false" });

  // Entrance on the street face: dark oak door under a hanging lantern.
  const onFront = z === minZ;
  if (onFront && x === midX) {
    put(x, gr + 1, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false"
    });
    put(x, gr + 2, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false"
    });
    put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
