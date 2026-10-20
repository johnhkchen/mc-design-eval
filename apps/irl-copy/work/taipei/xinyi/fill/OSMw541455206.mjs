import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541455206.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541455206.nbt";

const W = 16, H = 23, D = 18;
const TOP = 11;      // roof deck layer (about 11 blocks above lowest ground)
const FLOOR = 5;     // second-storey floor slab
const FOUND = "stone_bricks";
const BASE = "polished_granite";
const WALL = "smooth_quartz";
const BAND = "white_concrete";
const GLASS = "light_blue_stained_glass";
const ROOF = "gray_concrete";
const PARAPET = "white_concrete";
const FLOORMAT = "light_gray_concrete";
const COL = "smooth_quartz";
const EQUIP = "stone_bricks";

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const gr = new Map();
for (const [x, z, gnd] of raw) gr.set(key(x, z), Math.round(gnd));
const minG = Math.min(...gr.values());
for (const k of gr.keys()) gr.set(k, gr.get(k) - minG);

const has = (x, z) => gr.has(key(x, z));
const faceList = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};
const FACE_NUM = { N: 0, S: 1, W: 2, E: 3 };
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Street (north) entrance: footprint cell on the north edge nearest the middle
const frontXs = [];
for (const k of gr.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!has(x, z - 1)) frontXs.push(x);
}
const midT = (Math.min(...frontXs) + Math.max(...frontXs)) / 2;
const doorX = frontXs.reduce((a, b) => (Math.abs(b - midT) < Math.abs(a - midT) ? b : a));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

for (const [k, G] of gr) {
  const [x, z] = k.split(",").map(Number);

  // foundation up to this cell's ground
  for (let y = 0; y < G; y++) put(x, y, z, FOUND);

  const faces = faceList(x, z);

  if (faces.length === 0) {
    // interior: ground-floor air, second-floor slab, roof deck
    if (G <= FLOOR) put(x, FLOOR, z, FLOORMAT);
    put(x, TOP, z, ROOF);
    if (G <= 4 && x % 4 === 2 && z % 4 === 2) {
      for (let y = G; y < FLOOR; y++) put(x, y, z, COL);
    }
    if (x % 6 === 3 && z % 6 === 3) {
      put(x, TOP + 1, z, EQUIP);
      put(x, TOP + 2, z, EQUIP);
    }
    continue;
  }

  // perimeter cell
  const face = faces[0];
  const corner = faces.length > 1;
  const idx = face === "N" || face === "S" ? x : z;
  const pier = corner || idx % 3 === 0;
  const isDoor = face === "N" && x === doorX;
  const [dx, dz] = INWARD[face];
  const inwardOpen = has(x + dx, z + dz) && faceList(x + dx, z + dz).length === 0;
  const glow = !pier && inwardOpen && ((idx + FACE_NUM[face]) % 5 === 0);

  for (let y = G; y <= TOP; y++) {
    if (y === G) { put(x, y, z, BASE); continue; }
    if (y === 4 || y === FLOOR || y === 10 || y === TOP) { put(x, y, z, BAND); continue; }
    if (y < 4) {
      // ground floor shopfront
      if (isDoor && (y === G + 1 || y === G + 2)) {
        const half = y === G + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (pier) { put(x, y, z, WALL); continue; }
      if (face === "N" && y === 3 && Math.abs(idx - doorX) === 2) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      put(x, y, z, GLASS);
      continue;
    }
    if (y < 10) {
      // upper storey window grid
      if (pier) { put(x, y, z, WALL); continue; }
      if (glow && y === 7) {
        put(x, y, z, GLASS);
        put(x + dx, 7, z + dz, "glowstone");
        continue;
      }
      put(x, y, z, GLASS);
    }
  }

  // parapet on the perimeter
  put(x, TOP + 1, z, PARAPET);
}

g.save(OUT);
