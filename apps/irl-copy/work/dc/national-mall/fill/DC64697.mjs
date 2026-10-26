// DC64697: a narrow stone office block on the Mall's flank, stepped down from 4 storeys to a single-storey tail.
// Limestone-coloured walls (calcite), polished diorite piers and string courses, an andesite plinth, a smooth-stone
// cornice on every roof edge, a dark oak door on the north front, lit shopfronts and a few glowstone-lit rooms.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC64697.cells.json`, "utf8"));   // [x, z, ground, roof]

const BASE = "polished_andesite", WALL = "calcite", PIER = "polished_diorite", CORN = "smooth_stone";
const FLOOR = "smooth_stone", HVAC = "light_gray_concrete", GLASS = "light_blue_stained_glass_pane";
// panes on a wall running along z (the west and east faces) join their neighbours north and south; on the front they join east and west
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const byCell = new Map(cells.map(([x, z, gr, roof]) => [`${x},${z}`, { gr, roof }]));
const has = (x, z) => byCell.has(`${x},${z}`);

const g = new Voxels([3, 18, 10]);

for (const [x, z, gr, roof] of cells) {
  // the interior is the middle column between two walls, storeys 1-4 of the 6-block tier: air, with a floor slab at y3
  const interior = x === 1 && z >= 1 && z <= 4 && has(0, z) && has(2, z);
  for (let y = gr; y < roof; y++) {
    if (y === gr) { g.set(x, y, z, BASE); continue; }                       // plinth on the ground
    if (y === roof - 1) { g.set(x, y, z, CORN); continue; }                 // cornice / roof edge
    if (interior) {
      if (y === 3) g.set(x, y, z, FLOOR);                                    // floor slab per storey
      else if ((z === 1 && y === 2) || (z === 3 && y === 4)) g.set(x, y, z, "glowstone");   // rooms lit behind the glass
      continue;                                                              // otherwise air: no interiors
    }
    if (z === 0) {                                                           // north front: door on the centre bay
      if (y === 1 || y === 2) {
        if (x === 1) g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        else g.set(x, y, z, PIER);
      } else if (y === 3) g.set(x, y, z, PIER);
      else if (y === 4) { if (x === 1) g.set(x, y, z, GLASS, PANE_X); else g.set(x, y, z, PIER); }
      else g.set(x, y, z, WALL);
      continue;
    }
    // the west and east faces, run along z: piers on even bays, glass on odd bays, string course above the ground storey
    if (y === 3 && roof >= 5) g.set(x, y, z, PIER);
    else if (y === 4 && roof === 6) { if (z % 2) g.set(x, y, z, GLASS, PANE_Z); else g.set(x, y, z, PIER); }
    else if (y === 1 || y === 2) { if (z % 2) g.set(x, y, z, GLASS, PANE_Z); else g.set(x, y, z, PIER); }
    else g.set(x, y, z, WALL);
  }
}

// the door's upper half is already set in the loop; rooftop plant on the lower setback, and a lantern on the tail's roof
g.set(1, 4, 6, HVAC); g.set(1, 4, 7, HVAC);
g.set(1, 2, 9, "lantern", { hanging: "false", waterlogged: "false" });

const out = `${DIR}/DC64697.nbt`;
const r = g.save(out);
console.log(`wrote ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
