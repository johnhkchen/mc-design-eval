import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record is blank, so this is a generic Xinyi-style 1980s-90s commercial block:
// two storeys of 5 blocks, white concrete piers with blue-tinted glazing, granite
// shopfront with a central entrance, stone-brick cornice and parapet, flat roof
// with plant housing. Roof top sits about 11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542681365";
const W = 20, H = 23, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gy] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(9, Math.round(gy))));
}
const has = (x, z) => ground.has(key(x, z));

const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const missingOf = (x, z) =>
  Object.keys(DIRS).filter((d) => {
    const [dx, dz] = DIRS[d];
    return !has(x + dx, z + dz);
  });
const isPerim = (x, z) => missingOf(x, z).length > 0;

const doorFacing = "south";

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const gr = ground.get(key(x, z));

  // Foundation: solid below the local ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab between storeys (interior; perimeter is overwritten by spandrel below).
  if (gr <= 5) put(x, 5, z, "smooth_stone");

  // Roof slab over the whole footprint at y=10.
  const missing = missingOf(x, z);
  const perim = missing.length > 0;
  const corner = missing.length >= 2;
  put(x, 10, z, perim ? "stone_bricks" : "smooth_stone");

  if (!perim) {
    // Plant housing on the roof, centred on the footprint.
    if (x >= 7 && x <= 12 && z >= 6 && z <= 10) {
      put(x, 11, z, "light_gray_concrete");
      put(x, 12, z, "light_gray_concrete");
    }
    if (x === 9 && z === 8) put(x, 13, z, "lightning_rod");
    continue;
  }

  // Perimeter wall.
  const outward = corner ? null : missing[0];
  const a = outward === "n" || outward === "s" ? x : z;
  const pier = corner || a % 3 === 0;
  const entrance = outward === "n" && x === 10 && !corner;

  for (let y = gr; y <= 11; y++) {
    if (y === 11) {
      put(x, y, z, "stone_bricks"); // parapet
    } else if (y === 10) {
      put(x, y, z, "stone_bricks"); // cornice / roof edge
    } else if (y === 9 || y === 5) {
      put(x, y, z, "smooth_quartz"); // storey lines
    } else if (y < 5) {
      // Ground storey: granite shopfront with glazing and piers.
      if (entrance) {
        if (y === gr) {
          put(x, y, z, "dark_oak_door", {
            facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false",
          });
        } else if (y === gr + 1) {
          put(x, y, z, "dark_oak_door", {
            facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false",
          });
        } else {
          put(x, y, z, "polished_granite"); // lintel
        }
      } else if (y === gr) {
        put(x, y, z, "polished_granite"); // base course
      } else if (pier) {
        put(x, y, z, "polished_granite");
      } else {
        put(x, y, z, "glass");
      }
    } else {
      // Upper storey (y 6..8): white concrete piers, blue-tinted glazing.
      if (pier) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    }
  }

  // Warm light behind some upper windows (glowstone inside the air gap).
  if (!pier && y7Lit(a)) {
    const [ox, oz] = DIRS[outward];
    const ix = x - ox, iz = z - oz;
    if (has(ix, iz) && !isPerim(ix, iz)) put(ix, 7, iz, "glowstone");
  }
}

function y7Lit(a) {
  return a % 6 === 4;
}

g.save(`${DIR}/${ID}.nbt`);
