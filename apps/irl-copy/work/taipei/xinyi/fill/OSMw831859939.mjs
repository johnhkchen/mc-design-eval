import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831859939";
const W = 19, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(key(x, z), Math.round(gy));
const has = (x, z) => ground.has(key(x, z));
const B = Math.min(...ground.values());        // datum: lowest ground under footprint
const TOP = B + 11;                            // parapet top, ~11 blocks above lowest ground

// Perimeter: any footprint cell with a missing 4-neighbour
const isPerim = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// Only write above a cell's own ground (foundation handles everything at or below it)
function put(x, y, z, id, props) {
  const gy = ground.get(key(x, z));
  if (gy === undefined) return;
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (y <= gy || y > TOP) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Foundation: solid from y 0 up to each cell's ground
for (const [x, z, gy] of cells) {
  for (let y = 0; y <= Math.round(gy) && y < H; y++) g.set(x, y, z, "stone");
}

// Front = the street side (lowest z). Pick the front cell nearest the centre for the entrance.
const frontCells = cells
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => !has(x, z - 1));
const cxMean = frontCells.reduce((s, [x]) => s + x, 0) / Math.max(1, frontCells.length);
let door = null;
for (const [x, z] of frontCells) {
  if (!door || Math.abs(x - cxMean) < Math.abs(door[0] - cxMean)) door = [x, z];
}

const PANE_Z = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };

// Classify a perimeter cell's face and whether it is a pier (solid) or a window bay
function facade(x, z) {
  const zFace = !has(x, z - 1) || !has(x, z + 1);
  const xFace = !has(x - 1, z) || !has(x + 1, z);
  if (zFace) {
    const pier = !has(x - 1, z) || !has(x + 1, z) || x % 3 === 0;
    return { run: "z", pier, front: !has(x, z - 1) };
  }
  if (xFace) {
    const pier = !has(x, z - 1) || !has(x, z + 1) || z % 3 === 0;
    return { run: "x", pier, front: false };
  }
  return null;
}

// ---- Build each column ----
for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  const perim = isPerim(x, z);
  const fac = perim ? facade(x, z) : null;

  // Floor slabs at each storey line (interior and perimeter), roof deck
  put(x, B + 1, z, perim ? "stone_bricks" : "smooth_stone");
  put(x, B + 5, z, "smooth_stone");
  put(x, B + 10, z, perim ? "smooth_stone" : "light_gray_concrete");

  if (!perim) continue;

  const isDoor = door && door[0] === x && door[1] === z;
  const isWindow = fac && !fac.pier && !isDoor;
  const paneProps = fac && fac.run === "z" ? PANE_Z : PANE_X;

  // Ground storey: shopfront glass with door, fascia band
  if (isDoor) {
    put(x, B + 2, z, "dark_oak_door", { ...DOOR, half: "lower" });
    put(x, B + 3, z, "dark_oak_door", { ...DOOR, half: "upper" });
    put(x, B + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
  } else if (isWindow) {
    put(x, B + 2, z, "glass_pane", paneProps);
    put(x, B + 3, z, "glass_pane", paneProps);
    put(x, B + 4, z, "stone_bricks");
  } else {
    put(x, B + 2, z, "white_concrete");
    put(x, B + 3, z, "white_concrete");
    put(x, B + 4, z, "stone_bricks");
  }

  // Upper storey: spandrels top and bottom, glass bays between white piers
  put(x, B + 6, z, "white_concrete");
  put(x, B + 9, z, "white_concrete");
  if (isWindow) {
    put(x, B + 7, z, "glass_pane", paneProps);
    put(x, B + 8, z, "glass_pane", paneProps);
  } else {
    put(x, B + 7, z, "white_concrete");
    put(x, B + 8, z, "white_concrete");
  }

  // Parapet
  put(x, B + 11, z, "white_concrete");
}

// ---- Warm lights behind some front windows (interior cell one step in) ----
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (!has(x, z - 1) && has(x, z + 1) && !isPerim(x, z + 1)) {
    const fac = facade(x, z);
    if (!fac || fac.pier || (door && door[0] === x && door[1] === z)) continue;
    if (x % 6 === 1) {
      put(x, B + 7, z + 1, "glowstone");
    } else if (x % 6 === 4) {
      put(x, B + 2, z + 1, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// ---- Roof equipment: two condenser plant boxes on the roof deck ----
for (let x = 4; x <= 6; x++) for (let z = 4; z <= 5; z++) {
  if (has(x, z) && !isPerim(x, z)) put(x, B + 11, z, "gray_concrete");
}
for (let x = 12; x <= 13; x++) for (let z = 9; z <= 10; z++) {
  if (has(x, z) && !isPerim(x, z)) put(x, B + 11, z, "gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
