import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE111-0361-12F: 2022 mixed-use mid-rise in Xinyi, 2 storeys of 5 blocks
// over a 1-block parapet, roof about 11 blocks above the lowest ground.
// Glazed retail and office block: white concrete piers, two-bay light-blue
// glass bands, stone cornice, plinth, foundation and a canopied entrance.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE111-0361-12F";
const W = 49, H = 23, D = 36;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const c of cells) {
  const [x, z, gr] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cellMap.set(key(x, z), gr);
}
const has = (x, z) => cellMap.has(key(x, z));
const isEdge = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) vox.set(x, y, z, block, props);
  else vox.set(x, y, z, block);
}

// Pass 1: foundations, floors, roof caps, warm lights (per cell, at its own ground)
for (const [k, gr] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const b = gr;
  const edge = isEdge(x, z);

  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");   // foundation

  put(x, b, z, "smooth_stone");        // ground floor slab
  put(x, b + 5, z, "smooth_quartz");   // upper floor slab

  if (!edge) put(x, b + 9, z, "smooth_stone");   // roof cap over interior

  if (!edge) {
    if ((x * 7 + z * 3) % 11 === 0) put(x, b + 2, z, "glowstone");
    if ((x * 5 + z * 9) % 13 === 0) put(x, b + 7, z, "shroomlight");
  }
}

// Pass 2: perimeter facades. Glass bays two blocks wide, piers one block wide.
const winRows = (b) => [b + 1, b + 2, b + 3, b + 6, b + 7, b + 8];
for (const [k, gr] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  const b = gr;
  const ex = !has(x + 1, z) || !has(x - 1, z);
  const ez = !has(x, z + 1) || !has(x, z - 1);
  const corner = ex && ez;
  const along = ex ? z : x;
  const isBay = !corner && (along % 4 === 1 || along % 4 === 2);
  const rows = winRows(b);

  for (let y = b + 1; y <= b + 10; y++) {
    if (y === b + 4) {
      put(x, y, z, "light_gray_concrete");          // storey line
    } else if (y === b + 5) {
      put(x, y, z, "smooth_quartz");                // floor slab edge
    } else if (y === b + 9) {
      put(x, y, z, "stone_bricks");                 // cornice
    } else if (y === b + 10) {
      put(x, y, z, "stone_bricks");                 // parapet
    } else if (rows.includes(y) && isBay) {
      put(x, y, z, "light_blue_stained_glass");     // glazing bay
    } else {
      put(x, y, z, "white_concrete");               // piers and spandrels
    }
  }
}

// Pass 3: entrance on the north (low-z) face, nearest the middle
let doorCell = null;
let best = Infinity;
for (const [k, gr] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  if (has(x, z - 1)) continue;
  const ex = !has(x + 1, z) || !has(x - 1, z);
  const ez = !has(x, z + 1) || !has(x, z - 1);
  if (ex && ez) continue;
  const d = Math.abs(x - W / 2);
  if (d < best) { best = d; doorCell = { x, z, b: gr }; }
}
if (doorCell) {
  const { x, z, b } = doorCell;
  // Shopfront glazing either side of the door
  for (const dx of [-2, -1, 1, 2]) {
    const xx = x + dx;
    if (has(xx, z) && has(xx, z - 1) === false) {
      for (let y = b + 1; y <= b + 3; y++) put(xx, y, z, "light_blue_stained_glass");
    }
  }
  put(x, b + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, b + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, b + 3, z, "light_gray_concrete");       // transom wall above the door

  // Canopy over the entrance, carried on the cells either side of the door
  for (let dx = -2; dx <= 2; dx++) {
    const xx = x + dx;
    if (has(xx, z)) put(xx, b + 4, z, "stone_bricks");
  }
  // Lanterns under the canopy edges, warm at dusk
  put(x - 1, b + 3, z, "lantern", { hanging: "false", waterlogged: "false" });
  put(x + 1, b + 3, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// Pass 4: roof plant on the interior roof, one block tall
for (const [k, gr] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  if (isEdge(x, z)) continue;
  if (x < 18 || x > 30 || z < 12 || z > 22) continue;
  if (x % 4 === 0) continue;
  put(x, gr + 10, z, "light_gray_concrete");
}

vox.save(`${DIR}/${ID}.nbt`);
