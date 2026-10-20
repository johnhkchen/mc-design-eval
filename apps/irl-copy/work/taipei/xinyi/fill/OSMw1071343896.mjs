import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343896.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343896.nbt";

const W = 43, H = 23, D = 135;
const ROOF_Y = 11;      // roof slab, about 11 blocks above lowest ground
const CORNICE_Y = 11;
const PARAPET_Y = 12;
const SPANDREL_ROWS = [4, 5, 10];   // storey lintel, storey floor line, parapet band
const WINDOW_ROWS = [1, 2, 3, 6, 7, 8, 9];

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gc] of cells) ground.set(`${x},${z}`, gc);
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Facade and body per cell
for (const [x, z, gc0] of cells) {
  const gc = Math.max(0, gc0);

  // Foundation: solid from y0 up to the cell's own ground
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  const missing = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  const isEdge = missing.length > 0;

  if (isEdge) {
    // Facing: prefer the south end (z = 0) for the entrance, else the side that is open
    const southEnd = missing.some(([dx, dz]) => dx === 0 && dz === -1);
    const onEndWall = missing.some(([dx, dz]) => dx === 0);
    const k = onEndWall ? x : z;   // position along the wall
    const side = missing[0];
    const inward = [-side[0], -side[1]];
    const inX = x + inward[0], inZ = z + inward[1];
    const hasInterior = has(inX, inZ);

    const inEntrance = southEnd && k >= 19 && k <= 23;

    for (let y = gc; y <= 10; y++) {
      let block = "white_concrete";

      if (y === gc) {
        block = "polished_granite";                  // base course
      } else if (SPANDREL_ROWS.includes(y)) {
        block = "light_gray_concrete";              // storey lines and parapet band
      } else if (WINDOW_ROWS.includes(y)) {
        const isMullion = k % 3 === 0;
        if (inEntrance && y <= gc + 2) {
          block = "glass";                           // entrance doors
        } else if (isMullion) {
          block = "white_concrete";
        } else if (y <= 3) {
          block = "light_blue_stained_glass";        // shopfront glass
        } else {
          block = "light_blue_stained_glass";
        }
      }

      if (y === gc + 0 && inEntrance) block = "polished_granite";
      g.set(x, y, z, block);

      // Warm light behind some upper-storey glass
      if (y === 7 && !inEntrance && k % 12 === 4 && hasInterior) {
        g.set(inX, y, inZ, "shroomlight");
      }
    }

    // Clear entrance opening interior floor: lantern on the floor behind the door
    if (inEntrance && k === 21 && hasInterior && gc <= 10) {
      g.set(inX, gc, inZ, "lantern");
    }
  }

  // Storey-two floor slab on interior cells where ground is below it
  if (!isEdge && gc <= 5) g.set(x, 5, z, "smooth_stone");

  // Roof slab (cornice at the edge)
  g.set(x, ROOF_Y, z, isEdge ? "polished_andesite" : "smooth_stone");

  // Parapet ring on the edge
  if (isEdge) g.set(x, PARAPET_Y, z, "light_gray_concrete");
}

// Rooftop plant enclosure on the roof, standing on the roof slab
for (const [x, z] of cells) {
  if (x >= 10 && x <= 32 && z >= 40 && z <= 62) {
    const ring = x === 10 || x === 32 || z === 40 || z === 62;
    if (ring) {
      g.set(x, 12, z, "light_gray_concrete");
      g.set(x, 13, z, "iron_bars");
    }
  }
}

g.save(OUT);
