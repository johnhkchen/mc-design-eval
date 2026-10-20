import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1340969570";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 25, H = 19, D = 3;
const g = new Voxels([W, H, D]);

function put(x, y, z, id, p) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

function door(x, y, z, half) {
  put(x, y, z, "oak_door", {
    facing: "north", half, hinge: "left", open: "false", powered: "false",
  });
}

for (const [x, z, b] of cells) {
  // Foundation below the ground floor, then the plinth at the ground level.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");
  put(x, b, z, "smooth_stone");

  const edgeX = x === 0 || x === W - 1;
  const front = z === 0;
  const back = z === D - 1;

  if (!front && !back && !edgeX) {
    // Interior: air gap behind the glass, roof deck at the top of the storey.
    put(x, b + 6, z, "smooth_stone");
    if (z === 1 && x % 8 === 2) put(x, b + 4, z, "shroomlight");
    if (z === 1 && (x === 6 || x === 18)) put(x, b + 7, z, "light_gray_concrete");
    continue;
  }

  // Perimeter wall: one storey of five blocks (b+1 .. b+5).
  for (let k = 1; k <= 5; k++) {
    const y = b + k;
    let id = "white_concrete";

    if (front) {
      if (k === 1 || k === 2) {
        if (x === 12) {
          door(x, y, z, k === 1 ? "lower" : "upper");
          continue;
        }
        id = x % 4 === 0 ? "polished_andesite" : "glass";
      } else if (k === 3) {
        id = "red_concrete"; // awning band
      } else if (k === 4) {
        id = x % 4 === 0 ? "white_concrete" : "glass";
      } else {
        id = "light_gray_concrete"; // spandrel
      }
    } else if (back) {
      if (k >= 2 && k <= 4 && x % 4 !== 0) id = "glass";
    } else if (edgeX) {
      if (k >= 2 && k <= 4 && z === 1) id = "glass";
      else if (k === 5) id = "light_gray_concrete";
    }

    put(x, y, z, id);
  }

  // Cornice, then parapet to the roof top at b+7.
  put(x, b + 6, z, "light_gray_concrete");
  put(x, b + 7, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
