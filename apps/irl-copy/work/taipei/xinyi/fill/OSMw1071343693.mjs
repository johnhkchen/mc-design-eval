import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343693";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 197, H = 23, D = 95;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Storeys: 5 blocks each, two storeys where the lidar roof height allows
  let n = Math.round((11 - gr) / 5);
  n = Math.max(1, Math.min(2, n));
  if (gr + 5 * n + 1 > H - 1) n = 1;
  const top = gr + 5 * n;
  if (top + 2 > H - 1) continue;

  const west = !has(x - 1, z), east = !has(x + 1, z);
  const north = !has(x, z - 1), south = !has(x, z + 1);
  const edge = west || east || north || south;
  const facadeX = west || east;
  const u = facadeX ? z : x;

  // Inward neighbour, used for glowing lamps behind the glass
  const ix = east ? x - 1 : (west ? x + 1 : x);
  const iz = south ? z - 1 : (north ? z + 1 : z);
  const inward = has(ix, iz) && !(ix === x && iz === z);

  for (let s = 0; s < n; s++) {
    const yb = gr + 5 * s;

    // Floor slab / storey line
    if (edge) {
      put(x, yb, z, s === 0 ? "smooth_stone" : "red_terracotta");
    } else {
      put(x, yb, z, "light_gray_concrete");
    }
    if (!edge) continue;

    // Facade band
    const isEntrance = s === 0 && north && x >= 96 && x <= 100;
    for (let y = yb + 1; y <= yb + 3; y++) {
      if (u % 4 === 0) {
        put(x, y, z, "white_concrete");
      } else if (s === 0) {
        put(x, y, z, "glass");
      } else {
        put(x, y, z, "glass_pane");
      }
    }
    // Spandrel above each storey's windows
    put(x, yb + 4, z, "light_gray_concrete");

    // Entrance door on the north face
    if (isEntrance && u % 4 !== 0) {
      put(x, yb + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, yb + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    }

    // Warm light behind some windows
    if (inward && (u + s) % 8 === 1) {
      put(ix, yb + 2, iz, "glowstone");
    }
  }

  // Roof slab, cornice and parapet
  put(x, top, z, edge ? "smooth_stone" : "light_gray_concrete");
  if (edge) put(x, top + 1, z, "white_concrete");

  // Roof plant units on interior roof
  if (!edge && x % 30 === 15 && z % 20 === 10) {
    put(x, top + 1, z, "stone_bricks");
    put(x, top + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
