import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE103-0268-12F-2";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 4 x 7, 12 storeys of 5 blocks, roof deck at y 59, parapet at 60,
// plant penthouse to 62, mast to 68 (inside the 71-high volume).
const W = 4, H = 71, D = 7;
const ROOF = 59;
const STOREY = 5;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Ground map (y 0 = lowest ground under the footprint).
const ground = new Map();
let minG = Infinity;
for (const [x, z, gy] of cells) {
  ground.set(`${x},${z}`, gy);
  if (gy < minG) minG = gy;
}
if (!Number.isFinite(minG)) minG = 0;
const inFp = (x, z) => ground.has(`${x},${z}`);
const gyOf = (x, z) => ground.get(`${x},${z}`) - minG;

// A cell is on the shell if any of its four neighbours is outside the footprint.
const isRing = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

// Glazing pane connection state depending on which way the facade runs.
const paneRunsZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneRunsX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const doorProps = (half) => ({
  facing: "north",
  half,
  hinge: "left",
  open: "false",
  powered: "false",
});

// Pass 1: foundations, shell, floor slabs, roof, penthouse.
for (const [x, z] of cells) {
  const gy = gyOf(x, z);
  const ring = isRing(x, z);
  const exX = !inFp(x - 1, z) || !inFp(x + 1, z);
  const exZ = !inFp(x, z - 1) || !inFp(x, z + 1);
  const corner = exX && exZ;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  if (!ring) {
    // Interior: floor slabs per storey and roof deck, air elsewhere (air gap behind glass).
    for (let y = gy; y <= ROOF; y++) {
      if (y === gy || (y % STOREY === 0 && y > gy && y < ROOF)) {
        put(x, y, z, "smooth_stone");
      } else if (y === ROOF) {
        put(x, y, z, "smooth_stone");
      }
    }
    // Plant penthouse on the inner cells: 60..61 walls, 62 roof.
    for (let y = ROOF + 1; y <= ROOF + 2; y++) put(x, y, z, "light_gray_concrete");
    put(x, ROOF + 3, z, "smooth_stone");
    continue;
  }

  // Shell cells, bottom to top.
  for (let y = gy; y <= ROOF; y++) {
    if (y === ROOF) {
      put(x, y, z, "white_concrete"); // cornice
    } else if (y === gy) {
      put(x, y, z, "polished_diorite"); // base course
    } else if (y % STOREY === 0) {
      put(x, y, z, "white_concrete"); // spandrel / storey line
    } else if (y % STOREY === 4) {
      put(x, y, z, "light_gray_concrete"); // header band
    } else {
      // Window band (y % 5 in 1..3).
      if (corner) {
        put(x, y, z, "white_concrete"); // corner column
        continue;
      }
      const index = exX ? z : x;
      const isMullion = index === 3;
      if (isMullion) {
        put(x, y, z, "light_gray_concrete");
        continue;
      }
      const onEntranceFace = !inFp(x, z - 1);
      const isDoorCell = onEntranceFace && x === 1 && (y - gy === 1 || y - gy === 2);
      if (isDoorCell) {
        put(x, y, z, "dark_oak_door", doorProps(y - gy === 1 ? "lower" : "upper"));
        continue;
      }
      const runs = exX ? paneRunsZ : paneRunsX;
      const storeyBand = y < STOREY; // shopfront at street level
      put(x, y, z, storeyBand ? "gray_stained_glass_pane" : "cyan_stained_glass_pane", runs);
    }
  }

  // Parapet above roof deck.
  put(x, ROOF + 1, z, "white_concrete");
}

// Mast on the central inner cell, rising from the penthouse roof.
let mastCell = null;
for (const [x, z] of cells) {
  if (isRing(x, z)) continue;
  if (x === 1 && z === 3) mastCell = [x, z];
}
if (!mastCell) {
  for (const [x, z] of cells) {
    if (!isRing(x, z)) { mastCell = [x, z]; break; }
  }
}

if (mastCell) {
  const [mx, mz] = mastCell;
  for (let y = ROOF + 4; y <= ROOF + 9; y++) {
    put(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

// Pass 2: entrance lobby lamp, warm lights behind glazing.
for (const [x, z] of cells) {
  if (x === 1 && z === 1 && !isRing(1, 1)) {
    const gy = gyOf(1, 1);
    put(1, gy + 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

for (const [x, z] of cells) {
  if (!isRing(x, z)) continue;
  const gy = gyOf(x, z);
  const exX = !inFp(x - 1, z) || !inFp(x + 1, z);
  const exZ = !inFp(x, z - 1) || !inFp(x, z + 1);
  if (exX && exZ) continue;
  const index = exX ? z : x;
  if (index === 3) continue;

  // Find an interior neighbour to hold a lamp behind the glass.
  const neighbours = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]];
  let inner = null;
  for (const [nx, nz] of neighbours) {
    if (inFp(nx, nz) && !isRing(nx, nz)) { inner = [nx, nz]; break; }
  }
  if (!inner) continue;

  for (let k = 0; k < 12; k++) {
    const y = STOREY * k + 2;
    if (y <= gy || y >= ROOF) continue;
    if (y - gy === 1 || y - gy === 2) continue; // keep entrance clear
    if (((k + x + z) % 3) !== 0) continue;
    put(inner[0], y, inner[1], "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
