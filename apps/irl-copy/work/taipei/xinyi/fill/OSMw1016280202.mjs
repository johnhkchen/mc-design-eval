import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi office block, c. 1990s-2000s: five storeys of 5 blocks on a
// shopfront ground storey, white-concrete piers and spandrels, light-blue glass
// bands, grey fascia and cornice, a plant room and a short mast on the roof.
// Roof (parapet top) at y 26, lowest ground at y 0.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280202";
const W = 11, H = 38, D = 16;
const ROOF = 26;      // parapet top
const CORNICE = 25;   // roof deck / cornice line

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(gr, ROOF - 5)));
}
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Facade block for a perimeter cell at height y.
function facade(x, z, y, gr) {
  const missX = !has(x - 1, z) || !has(x + 1, z);
  const missZ = !has(x, z - 1) || !has(x, z + 1);
  const corner = missX && missZ;
  const idx = missZ ? x : z;          // position along the face
  const pier = corner || idx % 3 === 0;
  const front = missZ && !has(x, z - 1); // north face (z = 0 side)

  if (y === ROOF) return ["white_concrete"];          // parapet
  if (y === CORNICE) return ["gray_concrete"];        // cornice
  if (y === gr) return ["stone_bricks"];              // plinth / base course

  if (y < 5) {                                        // ground storey (shopfront)
    if (y === 4) return ["gray_concrete"];            // fascia
    if (pier) return ["gray_concrete"];
    if (front && x === 5 && gr <= 1 && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      return ["dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" }];
    }
    return ["light_blue_stained_glass"];
  }

  const r = y % 5;
  if (r === 0) return ["white_concrete"];             // storey line
  if (r === 4) return ["light_gray_concrete"];        // sill / spandrel
  if (pier) return ["white_concrete"];                // pier
  return ["light_blue_stained_glass"];                // window
}

for (const [x, z, gr] of cells) {
  const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (edge) {
    // Perimeter: solid facade from ground to parapet.
    for (let y = gr; y <= ROOF; y++) {
      const [id, props] = facade(x, z, y, gr);
      put(x, y, z, id, props);
    }
  } else {
    // Interior: no walls, only floor slabs per storey, an air gap, and roof.
    put(x, gr, z, "smooth_stone");
    for (let s = 1; s <= 5; s++) {
      const fy = 5 * s;
      if (fy >= gr) put(x, fy, z, "smooth_stone");
    }
    // Warm lights just behind the front, side and rear glazing.
    if (x === 1 || x === 9 || z === 1 || z === 14) {
      for (let s = 1; s <= 4; s++) {
        if ((x + z + s) % 3 === 0 && 5 * s + 2 > gr) {
          put(x, 5 * s + 2, z, "glowstone");
        }
      }
    }
    // Roof plant room, set back from the facade.
    if (x >= 3 && x <= 7 && z >= 4 && z <= 11) {
      put(x, 26, z, "light_gray_concrete");
      put(x, 27, z, "light_gray_concrete");
      put(x, 28, z, "smooth_stone");
    }
    // Short mast on the plant room.
    if (x === 5 && z === 8) {
      for (let y = 29; y <= 33; y++) {
        put(x, y, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
