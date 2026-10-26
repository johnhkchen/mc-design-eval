import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 7 x 3 block brick shopfront-and-office block on the Mall: two storeys over a stone plinth, a stone belt
// course and cornice, a flat roof with a parapet. Lidar gives roofs of 6 blocks (7 at four cells, mean 6.1), so the
// roof is one flat tier at 6 and the parapet smooths the noise up to 7.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54698.cells.json", "utf8"));
const ROOF = Math.round(cells.reduce((s, c) => s + c[3], 0) / cells.length);   // 6: the roof surface tier
const PARAPET = ROOF;                                                          // parapet course sits on the cornice
const g = new Voxels([7, 19, 3]);

const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };
const LANTERN = { hanging: "false", waterlogged: "false" };
const HANG = { hanging: "true", waterlogged: "false" };

for (const [x, z, ground] of cells.map((c) => [c[0], c[1], c[2]])) {
  const front = z === 0, back = z === 2, end = x === 0 || x === 6;
  const perim = front || back || end;
  const odd = x % 2 === 1;   // window bays sit over the odd columns; the brick piers stand over the even ones
  const quoin = x === 0 || x === 6;   // limestone corner quoins up the street and back faces

  // plinth: a stone course from the ground up, under every cell
  for (let y = ground; y < 1; y++) g.set(x, y, z, "stone_bricks");

  // ground storey (y 1-2): shopfront glass and a timber stallboard on the street side, a door in the middle bay
  for (const y of [1, 2]) {
    if (!perim) continue;
    if (front) {
      if (x === 3) { g.set(x, y, z, "dark_oak_door", { ...DOOR, half: y === 1 ? "lower" : "upper" }); continue; }
      if (odd) { g.set(x, y, z, y === 1 ? "dark_oak_planks" : "glass"); continue; }
    }
    if (back && odd && y === 2) { g.set(x, y, z, "glass"); continue; }
    g.set(x, y, z, quoin && (front || back) ? "smooth_sandstone" : "bricks");
  }

  // belt course and first-floor slab
  g.set(x, 3, z, "stone_bricks");

  // upper storey (y 4): a window in each odd bay, brick piers between, brick ends
  if (perim) {
    g.set(x, 4, z, (front || back) && odd ? "glass" : quoin && (front || back) ? "smooth_sandstone" : "bricks");
  }

  // cornice course at the roof tier (solid on the walls, a flat roof deck inside)
  g.set(x, ROOF - 1, z, perim ? "stone_bricks" : "smooth_stone");

  // parapet over the walls, one block above the cornice
  if (perim) g.set(x, PARAPET, z, "stone_bricks");
}

// interior: air behind the glass, a floor slab per storey, warm lights behind the glass
g.set(1, 1, 1, "lantern", LANTERN);
g.set(5, 1, 1, "lantern", LANTERN);
g.set(1, 4, 1, "lantern", HANG);
g.set(5, 4, 1, "lantern", HANG);
g.set(3, 4, 1, "glowstone");

// roof plant: a small air-handling box on the flat roof
g.set(2, ROOF, 1, "chiseled_stone_bricks");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54698.nbt");
