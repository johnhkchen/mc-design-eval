// 1150 12th St NW: a 1920s Classical Revival brick apartment block, 5 storeys on a stone plinth, with a
// 2-block-set-back penthouse pavilion over the middle of the plan. Storey rows: y0 plinth, y1-2 ground storey
// (shopfront + door), then window rows at odd y and calcite floor/sill belts at even y, the cornice at y10.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC67175.cells.json`, "utf8"));   // [x, z, ground, roof]

// Lidar roofs are noisy (11, 12, 13): smooth them into two tiers, the body at 11 and the penthouse at 13.
const TOP = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof >= 13 ? 13 : 11]));
const top = (x, z) => TOP.get(`${x},${z}`) ?? 0;
const present = (x, z, y) => y < top(x, z);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exteriorDirs = (x, y, z) => DIRS.filter(([dx, dz]) => !present(x + dx, z + dz, y));

const ENTRY_X = 8;   // the door sits on the long north face (z = 1), where the shop-front bays are

const g = new Voxels([11, 25, 7]);

for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  for (let y = 0; y < top(x, z); y++) {
    // plinth: solid from y 0, so nothing floats on the slope
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }

    const ext = exteriorDirs(x, y, z);
    if (ext.length === 0) {
      // interior: a floor slab per storey (even rows), air behind the glass (odd rows)
      if (y % 2 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // entrance: two-high door on the north face, with a stone hood over it in the window row above
    if (x === ENTRY_X && z === 1 && y <= 2) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (x === ENTRY_X && z === 1 && y === 3) {
      g.set(x, y, z, "stone_brick_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });
      continue;
    }

    // belt courses: calcite sills, floor lines and the cornice (even rows)
    if (y % 2 === 0) { g.set(x, y, z, "calcite"); continue; }

    // window rows (odd): calcite quoins at the corners, brick piers every third cell, glass bays between
    const [dx, dz] = ext[0];
    const corner = ext.some(([ax]) => ax) && ext.some(([, az]) => az);
    if (corner) { g.set(x, y, z, "calcite"); continue; }
    const along = dz ? x : z;   // position along this wall
    if (along % 3 === 0) { g.set(x, y, z, "bricks"); continue; }

    const alongX = dz !== 0;   // a wall running east-west: the pane joins its neighbours east and west
    g.set(x, y, z, "glass_pane", {
      east: alongX ? "true" : "false", west: alongX ? "true" : "false",
      north: alongX ? "false" : "true", south: alongX ? "false" : "true", waterlogged: "false",
    });

    // a warm light in some bays, standing on the floor slab just inside the glass
    const ix = x - dx, iz = z - dz;
    if (present(ix, iz, y) && exteriorDirs(ix, y, iz).length === 0 && (x * 5 + z * 3 + y) % 7 === 0) {
      if ((x + z + y) % 2 === 0) g.set(ix, y, iz, "glowstone");
      else g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// roof equipment: a plant box on the body roof, and a brick flue with a calcite cap
for (const [x, z] of [[7, 2], [8, 2], [7, 3], [8, 3]]) g.set(x, 11, z, "stone_bricks");
g.set(9, 11, 2, "bricks"); g.set(9, 12, 2, "bricks"); g.set(9, 13, 2, "calcite");

const out = g.save(`${DIR}/DC67175.nbt`);
console.log(JSON.stringify(out));
