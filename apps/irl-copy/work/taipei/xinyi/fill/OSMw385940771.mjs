import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw385940771";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 36, H = 66, D = 43;
const ROOF = 53;
const PARAPET = 54;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);
const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;

function put(x, y, z, b, p) {
  if (!inB(x, y, z)) return;
  if (p === undefined) g.set(x, y, z, b);
  else g.set(x, y, z, b, p);
}

function missing(x, z) {
  return {
    w: !has(x - 1, z), e: !has(x + 1, z),
    n: !has(x, z - 1), s: !has(x, z + 1),
  };
}
function isEdge(x, z) {
  const m = missing(x, z);
  return m.w || m.e || m.n || m.s;
}
function isCorner(x, z) {
  const m = missing(x, z);
  return (m.w || m.e) && (m.n || m.s);
}

// Brighter rainbow storey lines (concrete reads cleanly from street and air)
const RAINBOW = [
  "red_concrete", "orange_concrete", "yellow_concrete",
  "lime_concrete", "light_blue_concrete", "blue_concrete", "purple_concrete",
];

const inBox = (x, z) => x >= 9 && x <= 26 && z >= 13 && z <= 29;
const isPentEdge = (x, z) =>
  !inBox(x - 1, z) || !inBox(x + 1, z) || !inBox(x, z - 1) || !inBox(x, z + 1) ||
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Entrance: on the max-z (south) edge, nearest the mean x
let sumX = 0, maxZ = -Infinity;
for (const [x, z] of cells) { sumX += x; if (z > maxZ) maxZ = z; }
const meanX = sumX / cells.length;
let doorCell = null, bestD = Infinity;
for (const [x, z] of cells) {
  if (z === maxZ && isEdge(x, z)) {
    const d = Math.abs(x - meanX);
    if (d < bestD) { bestD = d; doorCell = [x, z]; }
  }
}
const isDoor = (x, z) => doorCell && doorCell[0] === x && doorCell[1] === z;

let mast = null, bestM = Infinity;
for (const [x, z] of cells) {
  if (inBox(x, z)) {
    const d = Math.hypot(x - 17.5, z - 21);
    if (d < bestM) { bestM = d; mast = [x, z]; }
  }
}

// Pass 1: foundations, walls, floors, roof
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (isEdge(x, z)) {
    const corner = isCorner(x, z);
    for (let y = gr; y < ROOF; y++) {
      let b;
      if (y === gr) {
        b = "polished_andesite";
      } else if (y === PARAPET) {
        b = "smooth_quartz";
      } else if (y === PARAPET + 1) {
        b = "white_concrete";
      } else if (y % 5 === 0) {
        b = RAINBOW[((y / 5) - 1) % RAINBOW.length];
      } else if (y % 5 === 4) {
        b = "white_concrete";
      } else {
        if (corner || (x + 2 * z) % 3 === 0) {
          b = "light_gray_concrete";                 // brighter piers
        } else {
          b = y < 5 ? "cyan_stained_glass" : "light_blue_stained_glass";
        }
      }
      put(x, y, z, b);
    }
  } else {
    put(x, gr, z, "smooth_stone");
    for (let y = 5; y < ROOF; y += 5) {
      if (y > gr) put(x, y, z, "light_gray_concrete");
    }
  }

  put(x, ROOF, z, "light_gray_concrete");
}

// Pass 2: penthouse plant room
for (const [x, z] of cells) {
  if (!inBox(x, z)) continue;
  const perim = isPentEdge(x, z);
  for (let y = PARAPET; y <= 57; y++) {
    if (!perim) {
      put(x, y, z, "light_gray_concrete");
    } else if (y === PARAPET || y === 57) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, (x + 2 * z) % 3 === 0 ? "light_gray_concrete" : "light_blue_stained_glass");
    }
  }
  put(x, 58, z, "smooth_quartz");
}

// Pass 3: entrance surround, lintel, door, warm light behind
if (doorCell) {
  const [dx, dz] = doorCell;
  const dg = groundAt(dx, dz);

  // Quartz pilasters either side of the door, and a lintel across the top
  for (const px of [dx - 1, dx + 1]) {
    if (!has(px, dz) || !isEdge(px, dz)) continue;
    for (let y = dg; y <= dg + 3; y++) put(px, y, dz, "smooth_quartz");
  }
  for (const px of [dx - 1, dx, dx + 1]) {
    if (!has(px, dz) || !isEdge(px, dz)) continue;
    put(px, dg + 4, dz, "smooth_quartz");
  }

  // Warm light inside the entrance bay
  if (has(dx, dz - 1) && !isEdge(dx, dz - 1) && groundAt(dx, dz - 1) <= dg) {
    put(dx, dg + 1, dz - 1, "shroomlight");
  }

  put(dx, dg, dz, "oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(dx, dg + 1, dz, "oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// Warm lights behind some lower window rows
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z) || isDoor(x, z) || isCorner(x, z)) continue;
  if ((x + 2 * z) % 3 === 0) continue;
  if ((x + z) % 4 !== 0) continue;
  for (let y = gr + 1; y < PARAPET; y++) {
    if (y % 5 !== 1 || y > 52) continue;
    if (y - 1 < gr) continue;
    const nbs = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]];
    for (const [nx, nz] of nbs) {
      if (!has(nx, nz) || isEdge(nx, nz)) continue;
      if (groundAt(nx, nz) > y - 1) continue;
      put(nx, y, nz, "glowstone");
      break;
    }
  }
}

// Pass 4: aviation mast
if (mast) {
  const [mx, mz] = mast;
  for (let y = 59; y <= 63; y++) {
    put(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
  put(mx, 64, mz, "redstone_lamp", { lit: "true" });
}

g.save(`${DIR}/${ID}.nbt`);
