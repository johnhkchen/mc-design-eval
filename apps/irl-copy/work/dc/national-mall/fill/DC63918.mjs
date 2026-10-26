import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1641 R St NW: a 1900s red-brick apartment block on a stone plinth, two storeys over a basement-height base,
// with a one-block-higher back wing where the lot falls away to the west.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC63918.cells.json", "utf8"));
const g = new Voxels([4, 19, 9]);

// Lidar roof, smoothed into flat tiers: the lone 7 at (2,3) is noise; the 7s at the back-west corner are the wing.
const foot = new Map();
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, roof: x === 2 && z === 3 ? 6 : roof });
const has = (x, z) => foot.has(`${x},${z}`);
const perimeter = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
// the side a perimeter cell faces: the first neighbour that is off the footprint (north = z-1, the street front)
const outward = (x, z) => (!has(x, z - 1) ? "north" : !has(x, z + 1) ? "south" : !has(x - 1, z) ? "west" : "east");

// Street front: z = 0 (north), entrance at (2,0). Back door at (2,8).
const doors = new Map([["2,0", "north"], ["2,8", "south"]]);
const frontWindows = new Set(["1,0", "3,0"]);             // glazed, sills below; no gap behind (the cell beside is the notch)
const gapWindows = new Map([                              // glazed, with an enclosed air gap behind: [x,z] -> interior [x,z]
  ["3,2", [2, 2]], ["3,4", [2, 4]], ["3,6", [2, 6]],       // east flank
  ["0,3", [1, 3]], ["0,7", [1, 7]],                        // west flank (the back wing)
  ["1,8", [1, 7]],                                         // back
]);
const windowCell = (x, z) => frontWindows.has(`${x},${z}`) || gapWindows.has(`${x},${z}`);
// painted white mullions between the flank windows, so the glazing reads as a grid rather than brick
const mullion = (x, z) => (x === 3 && z % 2 === 1) || (x === 0 && (z === 2 || z === 6));
// air gaps behind the glazed cells on storeys 2 and 4 (kept air: no blocks written there)
const carve = new Set();
for (const [, [ix, iz]] of gapWindows) for (const y of [2, 4]) carve.add(`${ix},${y},${iz}`);
// warm light behind some panes
const glow = new Set(["2,2,4", "1,4,3"]);
// roof plant on the main roof
const plant = "2,6,4";

for (const [key, { roof }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const top = roof - 1;
  const edge = perimeter(x, z);
  for (let y = 0; y <= top; y++) {
    if (carve.has(`${x},${y},${z}`)) { if (glow.has(`${x},${y},${z}`)) g.set(x, y, z, "glowstone"); continue; }
    const dk = doors.get(key);
    if (dk && (y === 1 || y === 2)) {
      const st = { facing: dk, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
      g.set(x, y, z, "dark_oak_door", st); continue;
    }
    if (y === top) {                                        // the cap: a bevelled cornice on the edge, a roof deck inside
      if (edge) g.set(x, y, z, "stone_brick_stairs", { facing: outward(x, z), half: "bottom", shape: "straight", waterlogged: "false" });
      else g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === 0) g.set(x, y, z, "stone_bricks");            // plinth / foundation fill
    else if (y === 1) g.set(x, y, z, frontWindows.has(`${x},${z}`) ? "white_concrete" : "stone_bricks");  // base course, sills
    else if (y === 3 || y === 5 && roof === 7) g.set(x, y, z, "smooth_stone");                            // storey lines
    else if (y === 2 || y === 4) g.set(x, y, z, windowCell(x, z) ? "glass_pane" : mullion(x, z) ? "white_concrete" : "bricks");  // storeys
    else g.set(x, y, z, "bricks");
  }
}
g.set(...plant.split(",").map(Number), "iron_block");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC63918.nbt");
