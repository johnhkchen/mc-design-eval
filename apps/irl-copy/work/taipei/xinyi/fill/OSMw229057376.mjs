import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Fiscal Information Agency, Ministry of Finance (Xinyi, Taipei).
// Reading: a late-1980s/1990s government office. A 3-storey granite-and-quartz
// podium follows the full footprint; the tower above is set back by 4 cells
// on every side that faces the street, and rises to a roof at y = 59.
// Entrance: recessed glass door on the lowest-z face, with a lintel.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const W = 58, H = 71, D = 74;
const PODIUM_TOP = 15;   // podium roof surface (slab at y = 15)
const TOWER_TOP = 58;    // parapet top, roof at y = 59

const cells = JSON.parse(readFileSync(`${DIR}/OSMw229057376.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const has = (x, z) => G.has(key(x, z));
const gnd = (x, z) => G.get(key(x, z));

// Depth = Manhattan distance inward from the nearest exposed edge (edge = 1).
const dep = new Map();
const q = [];
for (const [x, z] of cells) {
  if (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1)) {
    dep.set(key(x, z), 1);
    q.push([x, z]);
  }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i];
  const d = dep.get(key(x, z));
  for (const [nx, nz] of [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]) {
    if (has(nx, nz) && !dep.has(key(nx, nz))) {
      dep.set(key(nx, nz), d + 1);
      q.push([nx, nz]);
    }
  }
}
const dpt = (x, z) => dep.get(key(x, z)) || 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

let minZ = Infinity;
for (const [x, z] of cells) if (dpt(x, z) === 1) minZ = Math.min(minZ, z);

const DOOR_X0 = 27, DOOR_X1 = 30;

// Facade material for a given height; piers and windows alternate per storey.
function facadeId(y, pier) {
  if (y >= 56) return y === TOWER_TOP ? "quartz_block" : "smooth_quartz";
  if (y % 5 >= 1 && y % 5 <= 3) return pier ? "quartz_block" : "light_blue_stained_glass";
  if (y < 5) return "polished_granite";
  if (y % 5 === 0) return "light_gray_concrete";
  return "smooth_quartz";
}

// Exposed-face bookkeeping for a facade cell of a given depth.
function faceInfo(x, z, facadeDepth) {
  const exX = dpt(x - 1, z) < facadeDepth || dpt(x + 1, z) < facadeDepth;
  const exZ = dpt(x, z - 1) < facadeDepth || dpt(x, z + 1) < facadeDepth;
  const corner = exX && exZ;
  const along = corner ? null : (exX ? z : x);
  const pier = corner ? true : along % 4 === 0;
  return { exX, exZ, corner, along, pier };
}

// Warm light in the interior cell directly behind a window.
function glowBehind(x, z, y, innerDepth, info) {
  if (info.corner || info.pier || info.along % 8 !== 2 || y % 5 !== 2) return;
  for (const [nx, nz] of [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]) {
    if (has(nx, nz) && dpt(nx, nz) === innerDepth && y >= gnd(nx, nz)) {
      // Only the face that is actually exposed looks into this neighbour.
      const exposedHere = (info.exX && (nx !== x)) || (info.exZ && (nz !== z));
      if (exposedHere) put(nx, y, nz, "glowstone");
      return;
    }
  }
}

for (const [x, z, gy] of cells) {
  const d = dpt(x, z);

  // Foundation: solid from 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "polished_andesite");

  if (d === 1) {
    // Podium facade, full ground to podium roof.
    const info = faceInfo(x, z, 1);
    const recess = z === minZ && x >= DOOR_X0 && x <= DOOR_X1;
    for (let y = gy; y < PODIUM_TOP; y++) {
      if (recess && y >= 1 && y <= 4) continue;   // entrance recess opening
      put(x, y, z, facadeId(y, info.pier));
      glowBehind(x, z, y, 2, info);
    }
    // Parapet around the podium roof.
    if (PODIUM_TOP >= gy) {
      put(x, PODIUM_TOP, z, "smooth_quartz");
      put(x, PODIUM_TOP + 1, z, "quartz_block");
    }
  } else {
    // Interior storeys: floor slabs at 5, 10 and the podium roof / tower floor at 15.
    for (const y of [5, 10, PODIUM_TOP]) {
      if (d >= 2 && y >= gy) put(x, y, z, "light_gray_concrete");
    }
    // Tower interior floors.
    if (d >= 5) {
      for (let k = 4; k <= 11; k++) {
        const y = 5 * k;
        if (y >= gy) put(x, y, z, "light_gray_concrete");
      }
    }
    // Tower facade: the cells on the setback edge.
    if (d === 4) {
      const info = faceInfo(x, z, 4);
      for (let y = Math.max(gy, PODIUM_TOP); y <= TOWER_TOP; y++) {
        put(x, y, z, facadeId(y, info.pier));
        glowBehind(x, z, y, 5, info);
      }
    }
  }
}

// Entrance: granite lintel across the recess, quartz jambs, glass door set back.
for (let x = DOOR_X0; x <= DOOR_X1; x++) {
  if (has(x, minZ) && 4 >= gnd(x, minZ)) put(x, 4, minZ, "polished_granite");
  if (has(x, minZ + 1)) {
    for (let y = 1; y <= 3; y++) {
      if (y >= gnd(x, minZ + 1)) put(x, y, minZ + 1, "glass");
    }
  }
}
for (const x of [DOOR_X0 - 1, DOOR_X1 + 1]) {
  if (!has(x, minZ)) continue;
  for (let y = 1; y <= 3; y++) {
    if (y >= gnd(x, minZ)) put(x, y, minZ, "quartz_block");
  }
}

// Roof plant screen: a ring of glass and quartz on the tower roof, centred.
const PX0 = 14, PX1 = 43, PZ0 = 14, PZ1 = 59;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!has(x, z) || dpt(x, z) < 5) continue;
    const gy = gnd(x, z);
    const ring = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    if (!ring) continue;
    if (56 >= gy) put(x, 56, z, "light_blue_stained_glass");
    if (57 >= gy) put(x, 57, z, "smooth_quartz");
    if (TOWER_TOP >= gy) put(x, TOWER_TOP, z, "quartz_block");
  }
}

g.save(`${DIR}/OSMw229057376.nbt`);
