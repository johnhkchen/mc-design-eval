// DC68016: a Beaux-Arts federal office in pale limestone (smooth quartz), c. 1910-1930, the kind that lines the Federal
// Triangle and the Mall. Lidar roofs: 7 blocks on a core (the north-west tower), 6 on the wings, 5 on the south wing.
// The lidar noise is smoothed into three flat tiers; every column stands on the ground (y 0) and each storey sits on the
// one below. Ground storey: rusticated base course + glass band + door; then string courses at y 2 and y 4, a glass band
// in each storey, quartz corner pilasters and a capped parapet. Interiors are only floor slabs and air gaps, with a few
// glowstone lights set in the air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC68016.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const g = new Voxels([6, 19, 7]);

// Smoothed tier per cell: the north-west core keeps its 7, the rest of the lidar's 5-6 splits into 6 (north) and 5 (south wing).
const tier = (R, z) => (R >= 7 ? 7 : z >= 5 ? 5 : 6);
const inFoot = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => inFoot.has(`${x},${z}`);
const exterior = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const alongX = (x, z) => !has(x, z - 1) || !has(x, z + 1);      // a north/south face: its glass runs east-west
const corner = (x, z) => (x === 0 || x === 5) && (z === 0 || z === 3 || z === 6);

const LIMESTONE = "smooth_quartz", TRIM = "quartz_pillar", BASE = "stone_bricks", FLOOR = "smooth_stone";
const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, ground, roof] of cells) {
  const top = tier(roof, z) - 1;                 // index of the cell's top layer (the parapet/roof deck)
  for (let y = 0; y < ground; y++) g.set(x, y, z, BASE);      // foundation under any lower ground (none here: ground is 0)
  const ext = exterior(x, z);
  for (let y = ground; y <= top; y++) {
    if (!ext) {                                  // interior: floor slabs, a deck on top, air between
      if (y === top) g.set(x, y, z, FLOOR);
      else if (y % 2 === 0) g.set(x, y, z, FLOOR);
      continue;
    }
    if (y === top) g.set(x, y, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });   // capped parapet
    else if (y === 0) g.set(x, y, z, BASE);                                                         // rusticated base
    else if (y % 2 === 0) g.set(x, y, z, LIMESTONE);                                                // storey string course
    else if (corner(x, z)) g.set(x, y, z, TRIM, { axis: "y" });                                     // pilaster at the corners
    else g.set(x, y, z, "glass_pane", alongX(x, z) ? PANE_X : PANE_Z);                              // window band
  }
}

// Entrance: a pair of doors in the middle of the north (z = 0) front, in the ground-storey bay.
g.set(2, 0, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(2, 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// Warm light behind the glass: hanging lanterns in the air gap, under each storey's floor slab.
for (const [x, y, z] of [[1, 1, 1], [3, 1, 1], [2, 3, 1], [4, 3, 1], [1, 3, 2]]) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });

// Roof equipment on the south-west wing: two air-handling boxes on the 6-high roof, set back from the parapet.
g.set(2, 6, 4, "light_gray_concrete");
g.set(3, 6, 4, "light_gray_concrete");

const out = `${DIR}/DC68016.nbt`;
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
