// A two-storey brick commercial block with a shopfront, cream string courses and a parapet (Auckland, c.1920s-30s).
// Footprint 9 x 10 from the cells file; roof at y 9 from the lidar. Storeys: shopfront y 0-3, upper y 4-7, cornice y 8, parapet y 9.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572155.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell
const g = new Voxels([9, 22, 10]);

const foot = new Set(cells.map(([x, z]) => `${x},${z}`));
const inF = (x, z) => foot.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposed = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !inF(x + dx, z + dz)).map(([k]) => k);

// the layout is written for the lidar roof here (9 above y0 on every cell); the storey lines below assume it
const ROOF = 9;
if (cells.some(([, , , roof]) => roof !== ROOF)) throw new Error("roof heights differ from the storey layout");

// the front door: the tip cell on the north side
const DOOR = [3, 0];

// a pier at each corner and every third column along a facade, glass between
const isPier = (x, z, ex) => ex.length >= 2 || (ex.includes("north") || ex.includes("south") ? x : z) % 3 === 0;

// windows are full glass, not panes: a pane with no built neighbour reads as a hole from the street
for (const [x, z, ground] of cells) {
  const ex = exposed(x, z), perim = ex.length > 0;
  // foundation below the lowest ground, nothing floats
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  // ground floor: plinth, shopfront, fascia
  g.set(x, 0, z, perim ? "polished_andesite" : "stone_bricks");
  if (perim) {
    if (x === DOOR[0] && z === DOOR[1]) {
      g.set(x, 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else if (isPier(x, z, ex)) {
      g.set(x, 1, z, "bricks"); g.set(x, 2, z, "bricks");
    } else {
      g.set(x, 1, z, "glass"); g.set(x, 2, z, "glass");
    }
    g.set(x, 3, z, "dark_oak_planks");
  } else if ((x + z) % 3 === 0) {
    g.set(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });   // warm light under the ceiling
  }
  // floor slab, string course
  g.set(x, 4, z, perim ? "smooth_quartz" : "smooth_stone");
  // upper floor: brick with glass, cream lintel
  if (perim) {
    for (const y of [5, 6]) {
      if (isPier(x, z, ex)) g.set(x, y, z, "bricks");
      else g.set(x, y, z, "glass");
    }
    g.set(x, 7, z, "smooth_quartz");
    g.set(x, 8, z, "chiseled_stone_bricks");   // cornice
    g.set(x, 9, z, "bricks");                  // parapet
  } else {
    if ((x + z) % 3 === 1) g.set(x, 7, z, "lantern", { hanging: "true", waterlogged: "false" });
    g.set(x, 8, z, "smooth_stone");            // roof deck
  }
}

// roof plant on the deck: two iron units over the interior, away from the parapet
for (const [x, z] of [[3, 4], [4, 4], [5, 5]]) if (inF(x, z) && exposed(x, z).length === 0) g.set(x, 9, z, "iron_block");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572155.nbt";
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
