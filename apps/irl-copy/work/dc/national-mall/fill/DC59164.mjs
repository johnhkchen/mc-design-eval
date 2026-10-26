// DC59164: 2024 P St NW, a Store-Misc commercial block on the Dupont Circle side of the grid.
// Read from the record: a two-storey red-brick commercial front (a shopfront on the street, one storey of
// windows above a stone floor band and a stone cornice), with the eastern and rear bays one step taller
// (the lidar's 7-block roof cells) as a stepped parapet, and plant on the flat roof.
// Front = z 0 (the long street face), rear = z 2, the missing cell (4,2) is a rear yard notch.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59164.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..6, z 0..2

const g = new Voxels([7, 19, 3]);

const BRICK = "bricks", QUOIN = "stone_bricks", BASE = "polished_granite", BAND = "calcite", ROOF = "stone";
const GLASS = "glass", FRAME = "dark_oak_planks", SLAB = "stone_brick_slab";
const LANTERN = { hanging: "false", waterlogged: "false" };
const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };

// the air behind glass and the entrance (a one-cell gap, floor slab above and below), no interiors
const air = new Set();
for (const x of [1, 3, 5]) { air.add(`${x},1,1`); air.add(`${x},2,1`); }   // ground-floor glazing and door hall
for (const x of [1, 3, 5]) air.add(`${x},4,1`);                            // upper windows (front and rear share this gap)

// the lidar: a cell's roof height is its top face; blocks run from y 0 up to roof-1, and a roof-7 bay gets a cap slab at 7
for (const [x, z, ground, roof] of cells) {
  for (let y = ground; y < roof; y++) {
    let b = BRICK, st = null;
    if (y === 0) b = BASE;
    else if ((x === 0 || x === 6) && z !== 1 && y !== 5) b = QUOIN;   // corner quoins on the street and rear corners
    else if (y === 3) b = BAND;                             // floor band, the storey line
    else if (y === 5) {                                     // the cornice (front) or parapet/roof edge (rear)
      if (z === 0) { b = x % 2 ? SLAB : QUOIN; st = x % 2 ? { type: "bottom", waterlogged: "false" } : null; }
      else if (z === 2 || x === 0 || x === 6) b = BRICK;    // rear parapet and side walls
      else b = ROOF;
    }
    else if (z === 0 && (y === 1 || y === 2)) {             // shopfront
      if (x === 1 || x === 5) b = GLASS;
      else if (x === 2 || x === 4) b = FRAME;
      else if (x === 3) { b = "dark_oak_door"; st = { ...DOOR, half: y === 1 ? "lower" : "upper" }; }
    }
    else if (z === 0 && y === 4 && (x === 1 || x === 3 || x === 5)) b = GLASS;   // upper windows
    else if (z === 2 && y === 4 && (x === 1 || x === 3 || x === 5)) b = GLASS;   // rear windows, same air gap
    if (z === 2 && (y === 1 || y === 2) && (x === 1 || x === 3 || x === 5)) b = "smooth_quartz";   // the back of the shop's air gap reads as a lit room, not brick
    if (z === 1 && air.has(`${x},${y},1`)) continue;       // behind the glass
    g.set(x, y, z, b, st ?? undefined);
  }
  if (roof > 6) g.set(x, roof, z, SLAB, { type: "bottom", waterlogged: "false" });   // the stepped parapet's cap
}

// warm light in the windows (lanterns standing on the floor slab or the base, behind the glass)
g.set(1, 1, 1, "lantern", LANTERN);
g.set(1, 4, 1, "lantern", LANTERN);
g.set(5, 4, 1, "lantern", LANTERN);

// roof plant on the flat roof
g.set(2, 6, 1, "light_gray_concrete");
g.set(4, 6, 1, "light_gray_concrete");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59164.nbt");
