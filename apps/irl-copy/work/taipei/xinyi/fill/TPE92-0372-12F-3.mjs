import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/TPE92-0372-12F-3.cells.json`, "utf8"));

// 2003 Xinyi mid-rise office block: granite-faced base, white tiled frame with
// corner piers, continuous blue-tinted glazing bands, quartz storey lines and
// cornice, a shopfront with a recessed entrance, flat roof with penthouse and mast.
// Roof deck at y 68 (69 high from lowest ground).
const W = 5, H = 81, D = 6;
const g = new Voxels([W, H, D]);

const S = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isRing = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const exposedCount = (x, z) =>
  (!has(x - 1, z) ? 1 : 0) + (!has(x + 1, z) ? 1 : 0) + (!has(x, z - 1) ? 1 : 0) + (!has(x, z + 1) ? 1 : 0);
const isCorner = (x, z) => exposedCount(x, z) >= 2;

function outward(x, z) {
  if (!has(x, z + 1)) return "south";
  if (!has(x, z - 1)) return "north";
  if (!has(x + 1, z)) return "east";
  if (!has(x - 1, z)) return "west";
  return null;
}

// Entrance: a south-facing ring cell that is not a corner, else any ring cell.
let doorCell = null;
for (const [x, z] of cells) {
  if (isRing(x, z) && !isCorner(x, z) && outward(x, z) === "south") { doorCell = [x, z]; break; }
}
if (!doorCell) {
  for (const [x, z] of cells) {
    if (isRing(x, z) && !isCorner(x, z)) { doorCell = [x, z]; break; }
  }
}
if (!doorCell) {
  for (const [x, z] of cells) if (isRing(x, z)) { doorCell = [x, z]; break; }
}

const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
let mast = cells[0];
for (const c of cells) {
  const d = (c[0] - cx) ** 2 + (c[1] - cz) ** 2;
  const dm = (mast[0] - cx) ** 2 + (mast[1] - cz) ** 2;
  if (d < dm) mast = c;
}

const ROOF_Y = 68;
const TOP_LIMIT = 65;

for (const [x, z, gr] of cells) {
  const R = isRing(x, z);
  const corner = R && isCorner(x, z);
  const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  // Polished granite base course.
  S(x, gr, z, "polished_granite");

  // Ground floor: shopfront glazing with white piers at corners.
  if (R) {
    for (let y = gr + 1; y <= gr + 4; y++) {
      if (isDoor && y <= gr + 2) continue;
      if (corner) {
        S(x, y, z, "white_concrete");
      } else if (y === gr + 1 && ((x * 2 + z) % 6 === 0)) {
        S(x, y, z, "glowstone"); // sparse warm shop light
      } else {
        S(x, y, z, "light_blue_stained_glass_pane");
      }
    }
    // Quartz fascia over the shopfront.
    S(x, gr + 5, z, "smooth_quartz");
  }

  // Entrance: door with white flanking piers, lintel above.
  if (isDoor) {
    const facing = outward(x, z) || "south";
    S(x, gr + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    S(x, gr + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    S(x, gr + 3, z, "white_concrete");
    S(x, gr + 4, z, "white_concrete");
  }

  // Storeys of 5 blocks above the shopfront: slab, glazing band, quartz spandrel.
  let lastTop = gr + 5;
  let k = 0;
  for (let B = gr + 6; B + 4 <= TOP_LIMIT; B += 5, k++) {
    S(x, B, z, "white_concrete");
    if (R) {
      for (let dy = 1; dy <= 3; dy++) {
        const y = B + dy;
        if (corner) {
          S(x, y, z, "white_concrete"); // corner pier
        } else if (dy === 2 && ((k + x * 2 + z * 3) % 7 === 0)) {
          S(x, y, z, "glowstone"); // occasional lit office
        } else {
          S(x, y, z, "light_blue_stained_glass_pane");
        }
      }
      S(x, B + 4, z, "smooth_quartz"); // storey line
    }
    lastTop = B + 4;
  }

  // Fill exposed wall between last storey and parapet (no gaps).
  if (R) {
    for (let y = lastTop + 1; y <= ROOF_Y - 3; y++) S(x, y, z, "white_concrete");
  }

  // Roof structure, solid below the deck.
  for (let y = 66; y <= 67; y++) S(x, y, z, "light_gray_concrete");
  if (R) {
    S(x, 66, z, "white_concrete");
    S(x, 67, z, "white_concrete");
    S(x, ROOF_Y, z, "smooth_quartz"); // cornice cap
  } else {
    S(x, ROOF_Y, z, "light_gray_concrete");
  }
}

// Penthouse on the roof deck, centred.
for (const [x, z] of cells) {
  if (Math.abs(x - cx) <= 1.2 && Math.abs(z - cz) <= 1.2) {
    for (let y = 69; y <= 71; y++) S(x, y, z, "light_gray_concrete");
    S(x, 72, z, "smooth_quartz");
  }
}

// Mast on the central cell.
for (let y = 69; y <= 79; y++) {
  S(mast[0], y, mast[1], "lightning_rod", { facing: "up", powered: "false" });
}

g.save(`${DIR}/TPE92-0372-12F-3.nbt`);
