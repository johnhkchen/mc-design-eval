import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038703670";
const W = 53, H = 23, D = 50;
const ROOF = 11;      // parapet top, from lidar record (~11 above lowest ground)
const BAND_LO = 5;    // storey line between floors
const BAND_HI = 9;    // head band under parapet
const DECK = 10;      // roof deck level

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => x + "," + z;

// Ground per footprint column, clamped so the body always has room under the roof.
const G = new Map();
for (const [x, z, gr] of cells) {
  const k = key(x, z);
  if (!G.has(k)) G.set(k, Math.min(ROOF - 2, Math.max(0, Math.round(gr))));
}

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);

const has = (x, z) => G.has(key(x, z));
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
};

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Facade block for one exterior face of an edge cell at height y.
function facade(face, x, z, y, gy, corner) {
  const ns = face === "north" || face === "south";
  const u = ns ? x : z;
  const doorBay = !corner && gy <= 3 && (ns ? x === cx : z === cz);
  const outward = face;

  if (doorBay && y === gy) return ["dark_oak_door", { facing: outward, half: "lower", hinge: "left", open: "false", powered: "false" }];
  if (doorBay && y === gy + 1) return ["dark_oak_door", { facing: outward, half: "upper", hinge: "left", open: "false", powered: "false" }];
  if (y === BAND_LO || y === BAND_HI) return ["light_gray_concrete"];
  if (doorBay && y <= 4) return ["white_concrete"];
  if (y === gy) return ["stone_bricks"];
  if (corner || u % 4 === 0) return ["white_concrete"];

  const inGround = y >= gy + 1 && y <= 4;
  const inUpper = y >= 6 && y <= 8;
  if (inGround || inUpper) {
    if (y === 7 && ((u * 5 + (ns ? 0 : 7)) % 9 === 0)) return ["glowstone"];
    return ["light_blue_stained_glass"];
  }
  return ["white_concrete"];
}

for (const [k, gy] of G) {
  const [x, z] = k.split(",").map(Number);
  const fs = faces(x, z);
  const edge = fs.length > 0;
  const corner = fs.length > 1;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone");

  if (edge) {
    // Facade walls, one-thick, so interiors behind glass stay air.
    for (const f of fs) {
      for (let y = gy; y <= BAND_HI; y++) {
        const [id, props] = facade(f, x, z, y, gy, corner);
        put(x, y, z, id, props);
      }
    }
    // Parapet ring to roof level.
    put(x, DECK, z, "smooth_stone");
    put(x, ROOF, z, "smooth_stone");
  } else {
    // Interior: storey floor slab, roof deck. No walls.
    if (gy <= BAND_LO) put(x, BAND_LO, z, "smooth_stone");
    put(x, DECK, z, "light_gray_concrete");

    // Roof plant: a grid of low boxes, plus a central mast.
    if ((x % 9) >= 3 && (x % 9) <= 5 && (z % 9) >= 3 && (z % 9) <= 5) {
      put(x, ROOF, z, "light_gray_concrete");
    }
    if (x === cx && z === cz) put(x, ROOF, z, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
