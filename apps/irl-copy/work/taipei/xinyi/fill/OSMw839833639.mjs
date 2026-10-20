import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833639";
const W = 17, H = 23, D = 24;

// Footprint: [x, z, ground] per cell.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of raw) ground.set(`${x},${z}`, Math.round(gr));

const grounds = [...ground.values()];
const L = Math.min(...grounds);                 // lowest ground under the building
const R = Math.min(L + 11, H - 3);              // roof deck top, about 11 above lowest ground
// Parapet rises over R and R+1, coping slab at R+2.

const FACES = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const FACE_NAME = { W: "west", E: "east", N: "north", S: "south" };

// Exterior faces per footprint cell.
const faceMap = new Map();
const faceCount = { W: 0, E: 0, N: 0, S: 0 };
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const f = [];
  for (const k of ["W", "E", "N", "S"]) {
    const [dx, dz] = FACES[k];
    if (!ground.has(`${x + dx},${z + dz}`)) f.push(k);
  }
  for (const k of f) faceCount[k]++;
  faceMap.set(key, f);
}

// Street (front) face: the west face when present, else the longest exposed face.
const front = faceCount.W > 0
  ? "W"
  : Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];

// Entrance: the front-face cell closest to the middle of that face.
const frontCells = [];
for (const [key, f] of faceMap) {
  if (!f.includes(front)) continue;
  const [x, z] = key.split(",").map(Number);
  frontCells.push({ key, x, z, t: (front === "W" || front === "E") ? z : x });
}
let doorKey = null;
const canopyKeys = new Set();
if (frontCells.length) {
  const mean = frontCells.reduce((s, c) => s + c.t, 0) / frontCells.length;
  let best = frontCells[0];
  for (const c of frontCells) if (Math.abs(c.t - mean) < Math.abs(best.t - mean)) best = c;
  doorKey = best.key;
  canopyKeys.add(best.key);
  const along = (front === "W" || front === "E") ? [[0, -1], [0, 1]] : [[-1, 0], [1, 0]];
  for (const [dx, dz] of along) {
    const k = `${best.x + dx},${best.z + dz}`;
    if (ground.has(k) && (faceMap.get(k) || []).includes(front)) canopyKeys.add(k);
  }
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, name, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

// 1. Foundation to ground, solid core above it.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");
  for (let y = gr + 1; y <= R; y++) put(x, y, z, "light_gray_concrete");
}

// 2. Facade ring.
function buildRing(x, y, z, gr, faces) {
  const key = `${x},${z}`;
  const f = faces.includes(front) ? front : faces[0];
  const [dx, dz] = FACES[f];
  const ix = x - dx, iz = z - dz;              // inward cell behind the facade
  const t = (f === "W" || f === "E") ? z : x;
  const isDoor = key === doorKey;
  const pier = !isDoor && (faces.length > 1 || t % 3 === 0);
  const rel = y - L;
  const dBot = Math.max(L + 1, gr + 1);
  const gi = ground.get(`${ix},${iz}`);
  const inwardOpen = gi !== undefined && y > gi;

  // Entrance door.
  if (isDoor && (y === dBot || y === dBot + 1)) {
    put(x, y, z, "dark_oak_door", {
      facing: FACE_NAME[f],
      half: y === dBot ? "lower" : "upper",
      hinge: "left",
      open: "false",
      powered: "false",
    });
    if (inwardOpen) put(ix, y, iz, "air");
    return;
  }
  // Entrance canopy line.
  if (canopyKeys.has(key) && y === dBot + 2) {
    put(x, y, z, "red_terracotta_slab", { type: "bottom" });
    return;
  }
  // Base course.
  if (rel === 1) { put(x, y, z, "stone_bricks"); return; }
  // Parapet.
  if (y >= R) { put(x, y, z, "white_concrete"); return; }
  // Storey lines and cornice.
  if (rel === 5 || rel === 10) { put(x, y, z, "smooth_quartz"); return; }
  if (rel === 6) { put(x, y, z, "white_concrete"); return; }

  const windowRow = (rel >= 2 && rel <= 4) || (rel >= 7 && rel <= 9);
  if (!windowRow || pier) { put(x, y, z, "white_concrete"); return; }

  // Glazing with an air gap behind (or a warm lamp in some windows).
  const shop = rel <= 4;
  const name = shop ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane";
  const along = (f === "W" || f === "E")
    ? { north: "true", south: "true", east: "false", west: "false" }
    : { north: "false", south: "false", east: "true", west: "true" };
  put(x, y, z, name, along);
  const lit = (rel === 3 || rel === 8) && ((x * 5 + z * 3 + (rel > 5 ? 1 : 0)) % 4 === 0);
  if (inwardOpen) put(ix, y, iz, lit ? "glowstone" : "air");
}

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = faceMap.get(key) || [];
  if (!faces.length) continue;
  for (let y = gr + 1; y <= R + 1; y++) buildRing(x, y, z, gr, faces);
  put(x, R + 2, z, "smooth_quartz_slab", { type: "bottom" });
}

// 3. Rooftop water tank on the interior of the roof.
const isInterior = (x0, z0) => {
  for (let x = x0 - 1; x <= x0 + 3; x++) {
    for (let z = z0 - 1; z <= z0 + 3; z++) {
      const k = `${x},${z}`;
      if (!ground.has(k) || (faceMap.get(k) || []).length) return false;
    }
  }
  return true;
};
const cx = grounds.length ? [...ground.keys()].reduce((s, k) => s + Number(k.split(",")[0]), 0) / ground.size : 0;
const cz = [...ground.keys()].reduce((s, k) => s + Number(k.split(",")[1]), 0) / ground.size;
let tank = null;
for (let x0 = 0; x0 < W; x0++) {
  for (let z0 = 0; z0 < D; z0++) {
    if (!isInterior(x0, z0)) continue;
    const score = Math.abs(x0 + 1 - cx) + Math.abs(z0 + 1 - cz);
    if (!tank || score < tank.score) tank = { x0, z0, score };
  }
}
if (tank) {
  for (let x = tank.x0; x < tank.x0 + 3; x++) {
    for (let z = tank.z0; z < tank.z0 + 3; z++) {
      put(x, R + 1, z, "iron_block");
      put(x, R + 2, z, "iron_block");
    }
  }
}

// 4. Lightning rod on a corner of the roof when there is room.
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if ((faceMap.get(key) || []).length === 0 && !(tank && x >= tank.x0 && x < tank.x0 + 3 && z >= tank.z0 && z < tank.z0 + 3)) {
    put(x, R + 1, z, "lightning_rod");
    break;
  }
}

g.save(`${DIR}/${ID}.nbt`);
