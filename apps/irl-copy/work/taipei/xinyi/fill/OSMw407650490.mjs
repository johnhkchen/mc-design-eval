import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407650490";
const W = 67, H = 86, D = 23;

// Late-1990s Taipei commercial office block: a 14-storey light-grey concrete frame with
// blue-tinted glazing, a setback at 55, a roof at 74 and a small plant penthouse.
const T1 = 55;   // lower tier roof (full footprint)
const T2 = 74;   // upper tier roof (building top)
const PH_BASE = 75;
const PH_TOP = 80;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const c of raw) {
  const [x, z, gy] = c;
  ground.set(`${x},${z}`, Math.max(0, Math.round(gy) || 0));
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const has = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const inner = (x, z) => x >= 4 && x <= 62 && z >= 3 && z <= 19;
const inPH = (x, z) => x >= 14 && x <= 52 && z >= 7 && z <= 15;
const exists = (x, z, y) => has(x, z) && (y <= T1 || inner(x, z));
const band = (y) => Math.floor(y / 5) * 5;

function isPerim(x, z, y) {
  return !(exists(x - 1, z, y) && exists(x + 1, z, y) && exists(x, z - 1, y) && exists(x, z + 1, y));
}

// Main massing: foundation, floors, facade, roofs
for (const [key, gc] of ground) {
  const [x, z] = key.split(",").map(Number);

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  const top = inner(x, z) ? T2 : T1;

  for (let y = gc; y <= top; y++) {
    // main entrance on the south face, x 30..36, lowest three rows
    if (!exists(x, z + 1, y) && x >= 30 && x <= 36 && y >= gc && y <= gc + 2) {
      if (x === 33 && y <= gc + 1) {
        put(x, y, z, "iron_door", {
          facing: "south",
          half: y === gc ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      }
      continue;
    }

    if (y === top) { put(x, y, z, "light_gray_concrete"); continue; }
    if (y % 5 === 0) { put(x, y, z, "light_gray_concrete"); continue; }   // floor slab line
    if (!isPerim(x, z, y)) continue;                                       // interior: air gap

    const r = y % 5;
    if (y === gc) { put(x, y, z, "stone_bricks"); continue; }              // base course
    if (r === 4) { put(x, y, z, "white_concrete"); continue; }             // sill / spandrel

    // window rows r = 1..3
    const isGround = band(y) === band(gc);
    const xEnd = !exists(x - 1, z, y) || !exists(x + 1, z, y);
    const zEnd = !exists(x, z - 1, y) || !exists(x, z + 1, y);
    const mull = (zEnd && x % 3 === 0) || (xEnd && z % 3 === 0);

    if (mull) put(x, y, z, "white_concrete");
    else if (!isGround && r === 2 && x % 6 === 1) put(x, y, z, "glowstone");
    else if (isGround && r === 2 && x % 6 === 4) put(x, y, z, "glowstone");
    else put(x, y, z, isGround ? "glass" : "light_blue_stained_glass");
  }
}

// Entrance canopy over the south doors
for (let x = 30; x <= 36; x++) {
  for (const z of [21, 22]) {
    if (!has(x, z)) continue;
    put(x, G(x, z) + 3, z, "white_concrete");
  }
}

// Parapet on the outer edge of the lower-tier roof
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (inner(x, z)) continue;
  if (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1)) {
    put(x, T1 + 1, z, "white_concrete");
  }
}

// Parapet on the outer edge of the upper-tier roof (outside the penthouse)
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!inner(x, z) || inPH(x, z)) continue;
  if (!inner(x - 1, z) || !inner(x + 1, z) || !inner(x, z - 1) || !inner(x, z + 1)) {
    put(x, PH_BASE, z, "white_concrete");
  }
}

// Plant penthouse on the upper roof
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!inPH(x, z)) continue;
  const edge = !inPH(x - 1, z) || !inPH(x + 1, z) || !inPH(x, z - 1) || !inPH(x, z + 1);
  for (let y = PH_BASE; y <= PH_TOP; y++) {
    if (y === PH_BASE) put(x, y, z, "light_gray_concrete");
    else if (y === PH_BASE + 4) put(x, y, z, "white_concrete");
    else if (y === PH_TOP) put(x, y, z, "light_gray_concrete");
    else if (edge) put(x, y, z, "light_blue_stained_glass");
    // interior: air
  }
}

// Antenna mast
for (let y = PH_TOP + 1; y <= PH_TOP + 4; y++) put(33, y, 11, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
