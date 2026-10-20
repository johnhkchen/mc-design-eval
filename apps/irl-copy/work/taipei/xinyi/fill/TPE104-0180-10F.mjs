import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE104-0180-10F";
const W = 19, H = 62, D = 25;
const TOP = 50;          // main roof slab level
const SB_Y = 30;         // setback terrace level on the back-right corner
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gnd] of cells) ground.set(`${x},${z}`, gnd);
const has = (x, z) => ground.has(`${x},${z}`);

// Upper tower steps back from the back-right corner above SB_Y
const inSB = (x, z) => x >= 14 && z >= 17;
const present = (x, z, y) => has(x, z) && !(y >= SB_Y && inSB(x, z));
const edgeAt = (x, z, y) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !present(x + dx, z + dz, y));

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Facade block for a perimeter cell at height offset r above its ground.
function facade(x, z, r, front) {
  const s = Math.floor(r / STOREY);
  const along = (x === 0 || x === W - 1) ? z : x;
  if (r === 0) return ["smooth_stone"];                 // base course

  // Entrance bay on the front (z = 0) face, x 7..11
  if (s === 0 && front && x >= 7 && x <= 11 && r <= 4) {
    if (x === 7 || x === 11) return ["smooth_quartz"];  // pilasters
    if (r === 4) return ["smooth_quartz"];              // lintel
    if (x === 9 && r === 1)
      return ["dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (x === 9 && r === 2)
      return ["dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }];
    return ["light_blue_stained_glass"];                // glazing and transom
  }

  if (r % STOREY === 0) return ["white_concrete"];      // storey line / spandrel

  if (s === 0) {
    if (along % 3 === 0) return ["dark_oak_planks"];    // shopfront frames
    return ["light_blue_stained_glass"];
  }

  if (along % 3 === 0) return ["smooth_quartz"];        // mullions
  if (along % 6 === 1 && r % STOREY === 2 && (s * 5 + along) % 7 === 0) return ["glowstone"];
  return ["light_blue_stained_glass"];
}

for (const [x, z, gnd] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gnd; y++) put(x, y, z, "stone_bricks");

  const T = inSB(x, z) ? SB_Y : TOP;   // this column's roof level
  if (gnd >= T) continue;

  put(x, gnd, z, "smooth_quartz");     // ground floor slab

  for (let y = gnd; y < T; y++) {
    const r = y - gnd;
    if (!edgeAt(x, z, y)) {
      if (r > 0 && r % STOREY === 0) put(x, y, z, "smooth_quartz");
      continue;
    }
    const [block, props] = facade(x, z, r, z === 0);
    put(x, y, z, block, props);
  }

  // Roof: cornice and parapet on edges, plain roof slab inside
  if (edgeAt(x, z, T)) {
    put(x, T, z, "smooth_quartz");
    put(x, T + 1, z, "white_concrete");
  } else {
    put(x, T, z, "gray_concrete");
  }
}

// Roof plant penthouse on the main roof, footprint cells only
const PX0 = 6, PX1 = 12, PZ0 = 9, PZ1 = 15;
const PY0 = TOP + 1, PY1 = TOP + 4;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!has(x, z)) continue;
    const edgeP = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    for (let y = PY0; y <= PY1; y++) {
      if (y === PY1) put(x, y, z, "gray_concrete");
      else if (edgeP) put(x, y, z, "light_gray_concrete");
    }
  }
}

// Short antenna on the penthouse
if (has(9, 12)) {
  for (let y = PY1 + 1; y <= PY1 + 3; y++) put(9, y, 12, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
