// DC64569: 1219 11th St NW, a Penn Quarter commercial block (c.1900). Brick on a granite plinth, a shopfront with
// a recessed entrance at the street end, three storeys of windows, a flat roof with one raised crown and a roof unit.
// Massing follows the lidar roof: 7 blocks everywhere, the 8-block crown only where the lidar holds 8 on the centre
// columns (x 4..5); the lone 8 readings at (2,2) and (2,3) are noise and are smoothed into the 7 roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC64569.cells.json`, "utf8"));   // [x, z, ground, roof]

const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => foot.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
// the faces of a footprint cell that look out of the footprint (the envelope), e.g. ["N", "E"]
const faces = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));
const perim = (x, z) => faces(x, z).length > 0;

// the street front is the north edge where the footprint reaches z 0 (x 8..11); x 0..7 at z 0 is a light court
const street = (x, z) => z === 0 && faces(x, z).includes("N") && x >= 8;
// a window bay on a long face: N/S faces read in bays of 3 with a pier every third column, E/W faces take two windows
const bay = (x, z, fs) => (fs.includes("N") || fs.includes("S")) ? x % 3 !== 0 : (fs.includes("E") || fs.includes("W")) ? (z === 2 || z === 3) : false;
const panes = (fs) => (fs.includes("N") || fs.includes("S"))
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const g = new Voxels([12, 20, 6]);

for (const [x, z, ground, roof] of cells) {
  const fs = faces(x, z), edge = fs.length > 0;
  const crown = roof >= 8 && (x === 4 || x === 5);
  // foundation under the cell (nothing here: every cell's ground is 0)
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  // y0: plinth on the envelope, floor slab inside
  g.set(x, 0, z, edge ? "polished_granite" : "stone_bricks");

  // y1..3: ground floor
  if (street(x, z)) {
    if (x === 8 || x === 11) for (let y = 1; y <= 3; y++) g.set(x, y, z, "stone_bricks");
    else if (x === 9) {
      // entrance: a door on the street, a hanging lantern over it, the fascia above
      g.set(x, 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    } else {
      // shop window: glass to the lintel, dark oak fascia above
      g.set(x, 1, z, "glass_pane", panes(fs)); g.set(x, 2, z, "glass_pane", panes(fs));
      g.set(x, 3, z, "dark_oak_planks");
    }
  } else if (edge) {
    for (let y = 1; y <= 3; y++) {
      const win = bay(x, z, fs) && y <= 2;
      if (win) g.set(x, y, z, "glass_pane", panes(fs));
      else g.set(x, y, z, "bricks");
    }
  }

  // y4: floor slab across the whole footprint (the belt course on the envelope)
  g.set(x, 4, z, "smooth_stone");

  // y5: upper storey
  if (edge) {
    if (bay(x, z, fs)) g.set(x, 5, z, "glass_pane", panes(fs));
    else g.set(x, 5, z, "bricks");
  }

  // y6: cornice on the envelope (dentils alternate), flat roof inside
  if (edge) g.set(x, 6, z, x % 2 === 0 ? "chiseled_stone_bricks" : "stone_bricks");
  else g.set(x, 6, z, "stone");

  // y7: the crown on the centre columns, a coping slab on the rest of the envelope
  if (crown) g.set(x, 7, z, "stone_bricks");
  else if (edge) g.set(x, 7, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// roof unit: a 2 x 2 iron plant box on the roof, behind the crown
for (const [x, z] of [[8, 2], [9, 2], [8, 3], [9, 3]]) g.set(x, 7, z, "iron_block");

// warm light: glowstone and shroomlight behind upper glass, one glowstone behind the shop glass (all in the air gap)
g.set(2, 5, 2, "glowstone");
g.set(9, 5, 4, "shroomlight");
g.set(10, 1, 1, "glowstone");

const out = `${DIR}/DC64569.nbt`;
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
