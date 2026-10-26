// DC71619: a two-storey Federal-style civic block (red brick, limestone trim) with a central pavilion.
// Lidar tiers: the flanks (x 0..1, 4..5) top out at 5 blocks, the central pair of columns (x 2..3) at 6; the
// pavilion's one roof-5 cell is smoothed into its tier. Solid brick mass with window pockets: each glass pane has
// one air cell behind it (no rooms), and the storey lines are solid floor/band courses, so nothing hangs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC71619.cells.json", "utf8"));
const g = new Voxels([6, 18, 6]);

const pavilion = (x) => x === 2 || x === 3;
const tierH = (x) => (pavilion(x) ? 6 : 5);
const ring = (x, z) => x === 0 || x === 5 || z === 0 || z === 5;
const corner = (x, z) => (x === 0 || x === 5) && (z === 0 || z === 5);

// 1. the massing: plinth, brick walls, a limestone storey band at y 3, a limestone cornice on the ring at the top
for (const [x, z, ground] of cells) {
  const H = tierH(x);
  for (let y = ground; y < H; y++) {
    let b;
    if (y === 0) b = "stone_bricks";                                     // plinth / ground floor slab
    else if (y === 3) b = ring(x, z) ? "smooth_quartz" : "bricks";      // storey band / first-floor slab
    else if (y === H - 1) b = ring(x, z) ? "smooth_quartz" : "smooth_stone"; // cornice / roof deck
    else b = ring(x, z) && corner(x, z) ? "smooth_quartz" : "bricks";  // quoins at the corners
    g.set(x, y, z, b);
  }
}

// 2. window pockets: glass in the ring face, one air cell behind it (no rooms)
const pane = (x, y, z, face) => g.set(x, y, z, "glass_pane",
  face === "x" ? { east: "false", north: "true", south: "true", west: "false", waterlogged: "false" }
               : { east: "true", north: "false", south: "false", west: "true", waterlogged: "false" });
const hollow = (x, y, z) => g.set(x, y, z, "air");

// (no pockets at z 1 on the flanks: the door hall must not open through the building to the far side)
for (const y of [1, 2]) {
  for (let z = 2; z <= 4; z++) { pane(0, y, z, "x"); hollow(1, y, z); pane(5, y, z, "x"); hollow(4, y, z); }
  for (const x of [1, 2, 3, 4]) { pane(x, y, 5, "z"); hollow(x, y, 4); }
}
// the pavilion's upper storey: one row of windows under the cornice
for (const x of [2, 3]) {
  pane(x, 4, 0, "z"); hollow(x, 4, 1);
  pane(x, 4, 5, "z"); hollow(x, 4, 4);
}

// 3. the entrance: a double door in the pavilion's front, into a small air hall
for (const [x, hinge] of [[2, "left"], [3, "right"]]) {
  for (const [half, y] of [["lower", 1], ["upper", 2]]) {
    g.set(x, y, 0, "dark_oak_door", { facing: "north", half, hinge, open: "false", powered: "false" });
  }
  hollow(x, 1, 1); hollow(x, 2, 1);
}

// 4. warm light behind some panes (lanterns in the window pockets; the air gap stays round them)
g.set(1, 1, 2, "lantern", { hanging: "false", waterlogged: "false" });
g.set(4, 2, 3, "lantern", { hanging: "true", waterlogged: "false" });
g.set(2, 4, 1, "lantern", { hanging: "true", waterlogged: "false" });
g.set(3, 4, 4, "lantern", { hanging: "true", waterlogged: "false" });

// 5. roof equipment: two brick chimney stacks on the flanks
g.set(0, 5, 2, "bricks");
g.set(5, 5, 3, "bricks");

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC71619.nbt");
console.log(out);
