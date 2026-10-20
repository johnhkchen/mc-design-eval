import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 寶徠花園廣場 (Baolai Garden Plaza), Taipei, built 2004.
// Reading: a 27-storey (about 135 blocks) glass residential/office tower on a
// four-storey light-stone podium, with two setbacks, a pale-concrete crown,
// and a small penthouse with a spire. Roof at y 150, lidar says about 150 above lowest ground.
// Materials: blue-green tinted glass, white concrete spandrels, quartz mullions,
// polished granite podium base, light grey concrete podium mass.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE93-0334-27F";
const W = 54, H = 162, D = 47;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gy] of cells) {
  ground.set(key(x, z), gy);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const inFP = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z)) ?? 0;
const cx = Math.floor((minX + maxX) / 2);
const cz = Math.floor((minZ + maxZ) / 2);

// Setback zones: footprint eroded by k cells within its bounding box.
const inset = (k) => (x, z) =>
  inFP(x, z) && x >= minX + k && x <= maxX - k && z >= minZ + k && z <= maxZ - k;
const inB = inset(3);   // tower shaft, y 20..89
const inC = inset(7);   // upper tower, y 90..150
const inD = inset(11);  // penthouse, y 151..156

// A cell is exterior to set S if any 4-neighbour is outside S.
const isExt = (S) => (x, z) =>
  S(x, z) && (!S(x + 1, z) || !S(x - 1, z) || !S(x, z + 1) || !S(x, z - 1));
const extFP = isExt(inFP);
const extB = isExt(inB);
const extC = isExt(inC);
const extD = isExt(inD);

// Entrance: a two-deep, six-wide hall on the front (lowest-z) edge of the podium.
const isEntrance = (x, z) =>
  inFP(x, z) && Math.abs(x - cx) <= 3 && z >= minZ && z <= minZ + 1;

// Deterministic sparse "lit room" selection.
const litNear = (x, y, z, S, ext) => {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (S(nx, nz) && ext(nx, nz) && (nx + nz) % 3 !== 0 && (nx * 31 + nz * 17 + y * 7) % 11 === 0) {
      return true;
    }
  }
  return false;
};

// Shared storey-grid facade for tower zones (y%5: 0 and 4 are spandrels, 1-3 glass, every 3rd column a mullion).
function towerCell(x, y, z, S, ext, glass) {
  const r = y % 5, t = x + z;
  if (ext(x, z)) {
    if (r === 0 || r === 4) return "white_concrete";
    if (t % 3 === 0) return "smooth_quartz";
    return glass;
  }
  // Interior: floor slab per storey, air gap otherwise.
  if (r === 0) return "smooth_quartz";
  if (r === 2 && litNear(x, y, z, S, ext)) {
    return (x * 13 + y * 5 + z * 29) % 2 === 0 ? "glowstone" : "shroomlight";
  }
  return null;
}

function block(x, y, z) {
  if (!inFP(x, z)) return null;
  const g0 = gnd(x, z);

  // Foundation from y 0 up to the cell's own ground.
  if (y < g0) return "stone_bricks";

  // Podium: four storeys over the whole footprint, solid mass behind the facade.
  if (y <= 19) {
    // Entrance hall: open doorway, quartz lintel, warm alcove at the back wall.
    if (isEntrance(x, z)) {
      if (y === 3) return "smooth_quartz";
      if (y <= 2) return null;
    }
    if (z === minZ + 2 && Math.abs(x - cx) <= 1 && y <= 2 && y >= 1) {
      return "shroomlight";
    }
    if (!extFP(x, z)) return "light_gray_concrete";
    const r = y % 5, t = x + z;
    if (r === 0) return "polished_granite";     // base course / storey line
    if (r === 4) return "smooth_quartz";        // storey line
    if (t % 3 === 0) return "white_concrete";   // shopfront mullion
    return "light_blue_stained_glass";          // shopfront glazing
  }

  // Shaft (tier B) and terrace setback.
  if (y <= 89) {
    if (inB(x, z)) {
      if (y >= 85 && !inC(x, z)) return "light_gray_concrete"; // terrace top
      return towerCell(x, y, z, inB, extB, "cyan_stained_glass");
    }
    return null;
  }

  // Upper tower (tier C) with parapet and roof.
  if (y <= 150) {
    if (inC(x, z)) {
      if (y >= 146 && extC(x, z)) return "smooth_quartz"; // parapet
      if (y === 150) return "smooth_quartz";              // roof
      return towerCell(x, y, z, inC, extC, "light_blue_stained_glass");
    }
    return null;
  }

  // Penthouse on the roof.
  if (y <= 156 && inD(x, z)) {
    if (y === 156) return "smooth_quartz";
    if (y >= 152 && y <= 154 && extD(x, z)) {
      return (x + z) % 2 === 0 ? "light_blue_stained_glass" : "white_concrete";
    }
    return "white_concrete";
  }

  // Spire on the centre of the penthouse.
  if (x === cx && z === cz && inD(x, z)) {
    if (y >= 157 && y <= 159) return "iron_bars";
    if (y >= 160 && y <= 161) return "lightning_rod";
  }

  return null;
}

const g = new Voxels([W, H, D]);
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    for (let y = 0; y < H; y++) {
      const id = block(x, y, z);
      if (id) g.set(x, y, z, id);
    }
  }
}
g.save(`${DIR}/${ID}.nbt`);
