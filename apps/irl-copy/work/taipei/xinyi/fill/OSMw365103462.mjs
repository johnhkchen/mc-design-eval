import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw365103462";
const W = 27, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => ground.has(key(x, z));
const doorX = Math.round((minX + maxX) / 2);
const cx = (minX + maxX) / 2;
const cz = (minZ + maxZ) / 2;

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward faces of a cell (side with no footprint neighbour)
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  // Base course, storey slabs, roof deck (all footprint cells)
  put(x, gr, z, "polished_andesite");
  put(x, gr + 4, z, "light_gray_concrete");
  put(x, gr + 9, z, "light_gray_concrete");

  const fs = faces(x, z);
  const edge = fs.length > 0;

  if (edge) {
    const face = fs[0];
    const along = (face === "N" || face === "S") ? x : z;
    const corner = fs.length >= 2;
    const pier = corner || along % 3 === 0;
    const isDoor = face === "N" && x === doorX;

    // Ground storey: shopfront with piers, entrance on the north face
    if (isDoor) {
      put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "white_concrete");
    } else if (pier) {
      put(x, gr + 1, z, "white_concrete");
      put(x, gr + 2, z, "white_concrete");
      put(x, gr + 3, z, "white_concrete");
    } else {
      put(x, gr + 1, z, "stone_bricks");
      put(x, gr + 2, z, "glass");
      put(x, gr + 3, z, "glass");
    }

    // Storey line between floors
    put(x, gr + 4, z, "light_gray_concrete");

    // Upper storey: piers, or windows with sill and lintel
    if (pier) {
      for (let y = gr + 5; y <= gr + 8; y++) put(x, y, z, "white_concrete");
    } else {
      put(x, gr + 5, z, "stone_bricks");        // sill
      put(x, gr + 6, z, "glass");
      put(x, gr + 7, z, "glass");
      put(x, gr + 8, z, "white_concrete");      // lintel
    }

    // Cornice and parapet
    put(x, gr + 9, z, "light_gray_concrete");
    put(x, gr + 10, z, "white_concrete");
  } else {
    // Interior: sparse warm lights behind the glass
    if ((x * 5 + z * 3) % 9 === 0) put(x, gr + 1, z, "glowstone");
    if ((x * 7 + z * 2) % 11 === 0) put(x, gr + 5, z, "shroomlight");
  }

  // Roof: one clean central penthouse plus a few sparse plant units
  if (!edge) {
    const inPent = Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 3;
    if (inPent) {
      put(x, gr + 10, z, "light_gray_concrete");
      if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) {
        put(x, gr + 11, z, "light_gray_concrete");
      }
    } else if ((x * 7 + z * 11) % 17 === 0) {
      put(x, gr + 10, z, "smooth_stone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
