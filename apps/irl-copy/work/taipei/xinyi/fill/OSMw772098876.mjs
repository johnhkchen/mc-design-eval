import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw772098876";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// 17 x 21 footprint, roof about 11 blocks above the lowest ground: a two-storey
// commercial block with a ground-floor shopfront, concrete frame, storey lines,
// a parapet and roof plant. Reads as a late-20th-century Taipei street block.
const W = 17, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  G.set(key(x, z), Math.max(0, Math.min(H - 12, Math.round(gr))));
}
const has = (x, z) => G.has(key(x, z));

function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

function put(x, y, z, b, p) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

// Entrance: the north face cell nearest the middle of the north frontage.
let minX = Infinity, maxX = -Infinity;
for (const [k] of G) {
  const [x, z] = k.split(",").map(Number);
  if (!has(x, z - 1)) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
}
const midX = (minX + maxX) / 2;
let doorX = null;
for (let x = minX; x <= maxX; x++) {
  const cand = [...G.keys()].some(k => k === key(x, 0)) ? x : null;
  if (cand !== null && (doorX === null || Math.abs(x - midX) < Math.abs(doorX - midX))) doorX = x;
}

const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const f = faces(x, z);

  // Foundation fill up to the ground under this cell.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: ground floor, storey line, roof deck.
  put(x, gr, z, "light_gray_concrete");
  put(x, gr + 5, z, "light_gray_concrete");
  put(x, gr + 10, z, "light_gray_concrete");

  if (f.length === 0) {
    // Interior: roof plant on the deck, otherwise air.
    if ((x * 5 + z * 7) % 13 === 0) {
      put(x, gr + 11, z, "white_concrete");
      put(x, gr + 12, z, "light_gray_concrete");
    }
    if (x === Math.round(W / 2) && z === Math.round(D / 2)) {
      put(x, gr + 11, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
    continue;
  }

  // Parapet cap on the perimeter.
  put(x, gr + 11, z, "stone_bricks");

  if (f.length >= 2) {
    // Corner pier: solid concrete column.
    for (const y of [1, 2, 3, 4, 6, 7, 8, 9]) put(x, gr + y, z, "white_concrete");
    continue;
  }

  // Single-face wall cell.
  const face = f[0];
  const c = (face === "N" || face === "S") ? x : z;
  const isWin = c % 3 === 1;
  const isDoor = face === "N" && x === doorX;
  const [ix, iz] = inward[face];
  const innerOK = !has(x, z) ? false : faces(x + ix, z + iz).length === 0 && has(x + ix, z + iz);

  // Ground floor: shopfront glass, door at the entrance.
  if (isDoor) {
    put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  } else {
    if (isWin) {
      put(x, gr + 1, z, "glass");
      put(x, gr + 2, z, "glass");
    } else {
      put(x, gr + 1, z, "white_concrete");
      put(x, gr + 2, z, "white_concrete");
    }
    put(x, gr + 3, z, "white_concrete");
  }
  put(x, gr + 4, z, "white_concrete");

  // Storey-two spandrels and windows.
  put(x, gr + 6, z, "smooth_stone");
  put(x, gr + 9, z, "smooth_stone");
  if (isWin) {
    put(x, gr + 7, z, "glass");
    put(x, gr + 8, z, "glass");
  } else {
    put(x, gr + 7, z, "white_concrete");
    put(x, gr + 8, z, "white_concrete");
  }

  // Warm light standing on the floor just behind selected windows.
  if (isWin && innerOK && c % 6 === 1) {
    put(x + ix, gr + 1, z + iz, "glowstone");
  }
  if (isWin && innerOK && c % 6 === 4) {
    put(x + ix, gr + 6, z + iz, "shroomlight");
  }
}

g.save(`${dir}/${id}.nbt`);
