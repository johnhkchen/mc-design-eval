import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020154";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 8;
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Front (street) face is the north side (z = 0). Door sits at the median north-face column.
const northXs = cells.filter(([x, z]) => !has(x, z - 1)).map(([x]) => x).sort((a, b) => a - b);
const doorX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : -1;

const WALL = "white_terracotta";
const TRIM = "brown_terracotta";
const BASE = "stone_bricks";
const FLOOR = "smooth_stone";
const ROOF = "light_gray_concrete";

for (const [x, z, gr] of cells) {
  const gy = gr;
  if (gy + 11 > H - 1) continue;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const N = !has(x, z - 1);
  const S = !has(x, z + 1);
  const Wf = !has(x - 1, z);
  const E = !has(x + 1, z);
  const faceCount = [N, S, Wf, E].filter(Boolean).length;
  const perim = faceCount > 0;

  if (!perim) {
    // Interior: floor slabs per storey, air between (no interiors)
    put(x, gy, z, FLOOR);
    put(x, gy + 5, z, FLOOR);
    put(x, gy + 10, z, ROOF);
    // Roof plant on a few interior cells
    if (x % 6 === 3 && z === 3) {
      put(x, gy + 11, z, ROOF);
      put(x, gy + 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
    continue;
  }

  const corner = faceCount >= 2;
  // Along-wall coordinate and pane axis
  const frontFace = N || S;
  const along = frontFace ? x : z;
  const paneProps = frontFace
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Base course
  put(x, gy, z, BASE);

  // Ground floor: shopfront with pillars and glazing
  for (let y = gy + 1; y <= gy + 4; y++) {
    if (y === gy + 4) {
      put(x, y, z, TRIM); // lintel band
      continue;
    }
    if (corner || along % 4 === 0) {
      put(x, y, z, WALL);
    } else {
      put(x, y, z, "glass_pane", paneProps);
    }
  }

  // Storey line
  put(x, gy + 5, z, TRIM);

  // Upper floor windows
  for (let y = gy + 6; y <= gy + 9; y++) {
    if (!corner && along % 3 !== 0) {
      put(x, y, z, "glass_pane", paneProps);
    } else {
      put(x, y, z, WALL);
    }
  }

  // Cornice and parapet
  put(x, gy + 10, z, TRIM);
  put(x, gy + 11, z, WALL);

  // Entrance door on the street face
  if (N && x === doorX) {
    put(x, gy, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gy + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Warm light behind some upper-floor windows
  if (!corner && along % 6 === 1) {
    let dx = 0, dz = 0;
    if (N) dz = 1;
    else if (S) dz = -1;
    else if (Wf) dx = 1;
    else if (E) dx = -1;
    if (has(x + dx, z + dz)) put(x + dx, gy + 7, z + dz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
