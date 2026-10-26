import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 4 x 8 brick shop-pavilion on the Mall's north side: a one-storey red-brick ground floor (the lidar roof reads 1 block)
// with white marble trim, a shopfront on the z = 0 street face, and a three-block stone-capped tower bay at the west corner
// (the lidar's 3). Storeys are one block, so each block is a storey: the wing's top course is its roof deck, its brick
// perimeter reads as a parapet from the air, and the tower's three courses are plinth, glazed storey, and cornice.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC67205.cells.json`, "utf8")); // [x, z, ground, roof] per footprint cell

const X = 4, D = 8, Y = 15;
const g = new Voxels([X, Y, D]);

// glass panes join along their wall: east-west on a z face, north-south on an x face
const pane = (onZ) => (onZ ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" } : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// the block for one cell at height y, on the cell's exterior face (corners take the x-face, which is the storefront's side)
function block(x, y, z, top) {
  const onNorth = z === 0, onSouth = z === D - 1, onWest = x === 0, onEast = x === X - 1;
  const edge = onNorth || onSouth || onWest || onEast;
  if (!edge) return top ? { id: "stone_bricks" } : null;      // roof deck over the interior, nothing behind the glass
  if (x === 0 && z >= 5 && y > 0) {                          // the tower bay on the west face: stone cornice and lit window band
    if (y === 2) return { id: "smooth_quartz" };
    return z === 6 ? { id: "shroomlight" } : { id: "glass_pane", state: pane(false) };
  }
  if (x === 0 && z >= 5 && y === 0) return { id: "stone_bricks" }; // tower plinth
  if (onNorth) {                                             // street face: shopfront, pilasters, and the entrance
    if (x === 0 || x === X - 1) return { id: "smooth_quartz" };
    if (x === 2) return { id: "dark_oak_planks" };           // the door leaf in a wood-faced recess
    return { id: "glass_pane", state: pane(true) };
  }
  if (onSouth) {                                             // rear face: a glazed bay between pilasters
    if (x === 0 || x === X - 1) return { id: "smooth_quartz" };
    if (x === 1) return { id: "smooth_quartz" };
    return { id: "glass_pane", state: pane(true) };
  }
  if (onWest) {                                              // west face of the wing: pilasters at the corners, one window
    if (z === 0 || z === 4) return { id: "smooth_quartz" };
    return z === 2 ? { id: "glass_pane", state: pane(false) } : { id: "bricks" };
  }
  if (onEast) {                                              // east face: pilasters, two windows, one lit with a shroomlight
    if (z === 0 || z === D - 1 || z === 5) return { id: "smooth_quartz" };
    if (z === 3) return { id: "shroomlight" };
    return z === 2 || z === 6 ? { id: "glass_pane", state: pane(false) } : { id: "bricks" };
  }
  return { id: "bricks" };
}

// Heights per cell: the lidar roof, each cell solid from y 0 up to its roof (ground is 0 under the whole footprint)
for (const [x, z, ground, roof] of cells) {
  for (let y = ground; y < roof; y++) {
    const b = block(x, y, z, y === roof - 1);
    if (b) g.set(x, y, z, b.id, b.state);
  }
}

const res = g.save(`${DIR}/DC67205.nbt`);
console.log(JSON.stringify(res));
