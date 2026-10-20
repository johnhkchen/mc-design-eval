import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-area shophouse, c. 1980s: two storeys over a shop frontage at
// street level, cream rendered walls, terrazzo-style base, stone-brick cornice,
// light blue glazing and a parapet with a rooftop water tank.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397510";
const W = 42, H = 23, D = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

const isDoor = (x) => x % 12 === 3;          // entrances on the shop frontage
const isShopPillar = (x) => x % 6 === 0;     // ground-floor pilasters
const isUpperPillar = (x) => x % 3 === 0;    // upper-floor mullions

// Is (x, y) a glazed opening on the front (z = 0) face? Used for air gaps behind glass.
function isWindow(x, gr, y) {
  if (y >= gr + 1 && y <= gr + 4) {
    return !isShopPillar(x) && y <= gr + 3; // shop glass, transom row stays wall
  }
  if (y >= gr + 6 && y <= gr + 9) {
    return !isUpperPillar(x);
  }
  return false;
}

const doorProps = (half) => ({
  facing: "north", half, hinge: "left", open: "false", powered: "false",
});

for (const [x, z, gr] of cells) {
  const front = z === 0;
  const back = z === D - 1;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Base course on the frontage, plain stone elsewhere.
  put(x, gr, z, front ? "polished_andesite" : "stone_bricks");

  // Floor slabs: one above the ground floor, and the roof deck.
  put(x, gr + 5, z, "smooth_quartz");
  put(x, gr + 10, z, front ? "stone_bricks" : "smooth_quartz"); // cornice / roof

  // Storey bodies, z = 1..4 solid behind the frontage except air gaps behind glass.
  for (const [y0, y1] of [[gr + 1, gr + 4], [gr + 6, gr + 9]]) {
    for (let y = y0; y <= y1; y++) {
      if (front) {
        const gfRow = y <= gr + 4;
        if (gfRow) {
          if (isShopPillar(x)) {
            put(x, y, z, "stone_bricks");
          } else if (isDoor(x) && y <= gr + 2) {
            put(x, y, z, "oak_door", doorProps(y === gr + 1 ? "lower" : "upper"));
          } else if (isDoor(x)) {
            put(x, y, z, y === gr + 3 ? "light_blue_stained_glass" : "white_concrete");
          } else if (y <= gr + 3) {
            put(x, y, z, "light_blue_stained_glass");
          } else {
            put(x, y, z, "white_concrete");
          }
        } else {
          if (isUpperPillar(x)) put(x, y, z, "white_concrete");
          else put(x, y, z, "light_blue_stained_glass");
        }
      }
      // Behind the frontage: air gap at windows / doors on z = 1, solid otherwise.
      for (let zz = 1; zz < D; zz++) {
        if (zz === 1 && front === false && zz === 1 && isWindow(x, gr, y)) continue;
        if (zz === 1 && isWindow(x, gr, y) && z === 0) continue;
        if (zz === 1 && z === 0) {
          if (isWindow(x, gr, y) || (isDoor(x) && y <= gr + 2)) continue;
        }
        put(x, y, zz, "white_concrete");
      }
    }
  }

  // Parapet on the long faces.
  if (front || back) put(x, gr + 11, z, "stone_bricks");
}

// Warm lights: lanterns hung in the air gap above each entrance.
for (const [x, z, gr] of cells) {
  if (z === 0 && isDoor(x)) {
    put(x, gr + 4, 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Shroomlights behind some upper-floor windows.
for (const [x, z, gr] of cells) {
  if (z === 0 && !isUpperPillar(x) && x % 9 === 4) {
    put(x, gr + 7, 1, "shroomlight");
  }
}

// Rooftop water tank and antenna on the roof.
for (const [x, z, gr] of cells) {
  if (x >= 36 && x <= 38 && (z === 2 || z === 3)) {
    put(x, gr + 11, z, "white_concrete");
    put(x, gr + 12, z, "smooth_stone");
  }
  if (x === 40 && z === 2) {
    put(x, gr + 11, z, "lightning_rod", { facing: "up", powered: "false" });
    put(x, gr + 12, z, "lightning_rod", { facing: "up", powered: "false" });
  }
}

vox.save(`${DIR}/${ID}.nbt`);
