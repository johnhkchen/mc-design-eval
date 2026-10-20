import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541376811";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 17;
const vox = new Voxels([W, H, D]);

// Absolute levels (y 0 = lowest ground under the footprint)
const SLAB_1 = 5;      // floor line between storeys
const SLAB_2 = 10;     // top of second storey
const ROOF = 11;       // roof deck
const PARAPET_TOP = 13;
const TANK_TOP = 15;

const G = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.min(10, Math.round(gr)));
  G.set(`${x},${z}`, ground);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => G.has(`${x},${z}`);
const groundAt = (x, z) => G.get(`${x},${z}`);
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);
const faceLen = maxX - minX + 1;

function put(x, y, z, id, st) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (st) vox.set(x, y, z, id, st);
  else vox.set(x, y, z, id);
}

// Which outward faces are open for a footprint cell
function openFaces(x, z) {
  const m = [];
  if (!has(x, z - 1)) m.push("N");
  if (!has(x, z + 1)) m.push("S");
  if (!has(x - 1, z)) m.push("W");
  if (!has(x + 1, z)) m.push("E");
  return m;
}

// Door sits on the south face if it has one, otherwise the first open face
const southOpen = cells.some(([x, z]) => !has(x, z + 1));
const doorFace = southOpen ? "S" : null;
const doorU = Math.floor(cx);

for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const gr = groundAt(x, z);

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // Cell floor slab at its own ground level
  put(x, gr, z, "light_gray_concrete");
  // Storey lines and roof deck (stand on the course below)
  if (SLAB_1 > gr) put(x, SLAB_1, z, "light_gray_concrete");
  if (SLAB_2 > gr) put(x, SLAB_2, z, "light_gray_concrete");
  put(x, ROOF, z, "smooth_stone");

  const miss = openFaces(x, z);
  if (miss.length === 0) continue; // interior: air gap, no interior fitout

  const isCorner = miss.length >= 2;
  const face = isCorner ? null : miss[0];
  const onNS = face === "N" || face === "S";
  const u = onNS ? x : z;
  const umin = onNS ? minX : minZ;
  const rel = u - umin;

  // Walls between floor line and top slab
  for (let y = gr + 1; y <= SLAB_2; y++) {
    if (y === SLAB_1 || y === SLAB_2) continue;
    const hi = y <= 4 ? 4 : 9;      // spandrel row at top of each storey
    if (y > hi) continue;
    if (isCorner) { put(x, y, z, "white_concrete"); continue; }

    const isWindowCol = rel > 0 && rel < faceLen - 1 && rel % 3 === 1;
    const isDoor = face === doorFace && u === doorU && (y === gr + 1 || y === gr + 2) && gr + 2 <= 4;

    if (isDoor) {
      const st = {
        facing: "south",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
      put(x, y, z, "dark_oak_door", st);
      continue;
    }
    if (y === hi) {
      put(x, y, z, isWindowCol ? "light_gray_concrete" : "white_concrete");
      continue;
    }
    if (isWindowCol) {
      const st = onNS
        ? { east: "true", west: "true", north: "false", south: "false" }
        : { north: "true", south: "true", east: "false", west: "false" };
      put(x, y, z, "glass_pane", st);
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // Parapet with stone cap
  put(x, 12, z, "white_concrete");
  put(x, PARAPET_TOP, z, "smooth_stone");

  // Warm light inside the window bays (air gap behind the glass)
  if (!isCorner && rel > 0 && rel < faceLen - 1 && rel % 3 === 1) {
    let ix = x, iz = z;
    if (face === "N") iz = z + 1;
    if (face === "S") iz = z - 1;
    if (face === "W") ix = x + 1;
    if (face === "E") ix = x - 1;
    if (has(ix, iz)) {
      if (rel % 6 === 1) put(ix, 7, iz, "glowstone");   // upper storey warm light
      else if (gr + 2 <= 3) put(ix, 2, iz, "shroomlight"); // ground shopfront light
    }
  }
}

// Rooftop water tank on the centre of the roof (cylinder approximated as 3x3)
for (let dx = -1; dx <= 1; dx++) {
  for (let dz = -1; dz <= 1; dz++) {
    const tx = cx + dx, tz = cz + dz;
    if (!has(tx, tz)) continue;
    for (let y = ROOF + 1; y <= TANK_TOP - 1; y++) put(tx, y, tz, "light_gray_concrete");
    put(tx, TANK_TOP, tz, "smooth_stone");
  }
}

vox.save(`${DIR}/${ID}.nbt`);
