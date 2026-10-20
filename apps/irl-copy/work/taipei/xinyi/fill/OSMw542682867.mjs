import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682867";
const W = 15, H = 23, D = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const inside = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < W && y < H && z < D;
function put(x, y, z, id, props) {
  if (!inside(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}
const has = new Set(cells.map(([x, z]) => `${x},${z}`));

// Two-storey Taiwanese low-rise commercial block, c. 1980s:
// white tiled walls, stone base, red fascia over a glazed shopfront,
// blue-tinted upper windows, smooth-quartz coping, grey roof deck.
const WIN_X = [2, 3, 4, 6, 7, 8, 10, 11, 12];
const SHOP_MULLION = [1, 5, 9, 13];
const BACK_GROUND_WIN = [2, 3, 4, 10, 11, 12];

for (const [x, z, gr] of cells) {
  const outer = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const front = z === 0;
  const back = z === D - 1;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: ground floor, upper floor, roof deck / parapet
  put(x, gr, z, outer ? "polished_andesite" : "smooth_stone");
  put(x, gr + 5, z, outer ? "smooth_quartz" : "smooth_stone");
  put(x, gr + 10, z, outer ? "smooth_quartz" : "gray_concrete");

  if (outer) {
    // Ground storey, r = 1..4
    for (let r = 1; r <= 4; r++) {
      const y = gr + r;
      if (front) {
        if (r === 4) {
          // Red fascia / canopy band
          put(x, y, z, x === 0 || x === W - 1 ? "white_terracotta" : "red_concrete");
        } else if (x === 0 || x === W - 1) {
          put(x, y, z, "white_terracotta");
        } else if (x === 7) {
          if (r === 1) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
          else if (r === 2) put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
          else put(x, y, z, "glass");
        } else if (SHOP_MULLION.includes(x)) {
          put(x, y, z, "gray_concrete");
        } else {
          put(x, y, z, "glass");
        }
      } else if (back && r >= 2 && r <= 3 && BACK_GROUND_WIN.includes(x)) {
        put(x, y, z, "light_blue_stained_glass");
      } else {
        put(x, y, z, "white_terracotta");
      }
    }

    // Upper storey, r = 6..9
    for (let r = 6; r <= 9; r++) {
      const y = gr + r;
      const winCol = (front || back) && WIN_X.includes(x);
      if (winCol && r <= 8) {
        put(x, y, z, "light_blue_stained_glass");
      } else if (winCol && r === 9) {
        put(x, y, z, "gray_concrete"); // window head frame
      } else if ((x === 0 || x === W - 1) && z === 2 && r <= 8) {
        put(x, y, z, "light_blue_stained_glass");
      } else {
        put(x, y, z, "white_terracotta");
      }
    }
  } else {
    // Interior: air behind glass, with a few warm lights
    if (z === 1 && (x === 3 || x === 11)) put(x, gr + 2, z, "glowstone");
    if (z === 1 && x === 7) put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    if (z === 1 && (x === 3 || x === 7 || x === 11)) put(x, gr + 7, z, "shroomlight");

    // Roof equipment on the deck
    if (z === 2 && (x === 4 || x === 5 || x === 10 || x === 11)) put(x, gr + 11, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
