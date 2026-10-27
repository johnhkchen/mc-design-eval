// Radio New Zealand House, Auckland: a 1970s-80s concrete-framed mid-rise. The lidar roof gives three flat tiers on one
// floor datum (y 5, storeys of 4): a 1-storey annex (roof 9), a 4-storey wing (roof 21) and a 5-storey tower (roof 25)
// with plant rooms to 27. Basalt plinth (the volcanic stone of the isthmus) and a stepped base course, light concrete
// piers, smooth stone spandrels, light-blue glass panes in 2-wide bays, a recessed entrance and glowstone behind some glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260054042.cells.json", "utf8"));

const W = 43, D = 46, H = 40;
const g = new Voxels([W, H, D]);
const DATUM = 5, FLOORS = [5, 9, 13, 17, 21];
const BASE = "polished_basalt", PIER = "light_gray_concrete", SPANDREL = "smooth_stone", STONE = "stone";
const GLASS = "light_blue_stained_glass_pane", LIGHT = "glowstone";

// per footprint cell: ground, raw roof; -1 outside the footprint
const gnd = new Int32Array(W * D).fill(-1), roof = new Int32Array(W * D).fill(-1);
for (const [x, z, gr, r] of cells) { gnd[z * W + x] = gr; roof[z * W + x] = r; }
const inFP = (x, z) => x >= 0 && z >= 0 && x < W && z < D && gnd[z * W + x] >= 0;

// Tiers from the lidar: a 3x3 median of the roof smooths the noise, then it is classed into the three flat tiers.
const tier = new Int32Array(W * D).fill(0);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFP(x, z)) continue;
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFP(x + dx, z + dz)) v.push(roof[(z + dz) * W + x + dx]);
  v.sort((a, b) => a - b);
  const m = v[v.length >> 1];
  tier[z * W + x] = m < 12 ? 9 : m < 23 ? 21 : 25;
}
const T = (x, z) => tier[z * W + x];
// plant rooms only as a cluster: a lone 2-high pillar on the roof reads as a stray block
const hot = (x, z) => T(x, z) === 25 && roof[z * W + x] >= 26;
const plant = (x, z) => {
  if (!hot(x, z)) return false;
  let n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if ((dx || dz) && inFP(x + dx, z + dz) && hot(x + dx, z + dz)) n++;
  return n >= 3;
};

// Facade exposure: a side is a wall where the cell has no footprint neighbour, or its neighbour is lower and the row is
// above that neighbour's roof (so the tall storeys close off their own edge over the lower tier).
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
function exposed(x, y, z) {
  const out = [];
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const nx = x + dx, nz = z + dz;
    if (!inFP(nx, nz)) { out.push(d); continue; }
    const nt = T(nx, nz);
    if (nt < T(x, z) && y >= nt) out.push(d);
  }
  return out;
}

// Which storey row (rel 0 spandrel floor, 1-2 window band, 3 head/ceiling) and whether the bay is a pier.
const storeyOf = (y) => { let F = FLOORS[0]; for (const f of FLOORS) if (y >= f) F = f; return F; };
function facadeAxis(ex) {
  const ns = ex.includes("N") || ex.includes("S"), ew = ex.includes("W") || ex.includes("E");
  return ns && ew ? "corner" : ns ? "x" : "z";
}

// Entrance: the outward face with the most ground-level exposure; a window bay near the middle of that face.
const faceCount = { N: 0, S: 0, W: 0, E: 0 };
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inFP(x, z)) for (const d of exposed(x, DATUM, z)) faceCount[d]++;
const entranceFace = Object.entries(faceCount).sort((a, b) => b[1] - a[1])[0][0];
const faceCells = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inFP(x, z) && exposed(x, DATUM, z).length && exposed(x, DATUM, z).includes(entranceFace) && T(x, z) >= 21) faceCells.push([x, z]);
faceCells.sort((a, b) => (entranceFace === "N" || entranceFace === "S" ? a[0] - b[0] : a[1] - b[1]));
let entrance = null;
if (faceCells.length) {
  const mid = faceCells[faceCells.length >> 1];
  entrance = faceCells.find(([x, z]) => (entranceFace === "N" || entranceFace === "S" ? x : z) % 3 !== 0 && Math.abs(x - mid[0]) + Math.abs(z - mid[1]) < 40) ?? mid;
}
const isEntrance = (x, z) => entrance && entrance[0] === x && entrance[1] === z;

// The one block a cell carries at row y (null = air). Pure, so the glow pass can ask the same question.
function blockAt(x, y, z) {
  const gr = gnd[z * W + x], tr = T(x, z);
  if (y < gr) return [STONE];                                       // foundation, out of sight
  if (y < DATUM) return [BASE];                                     // plinth: the downhill side's extra storey
  if (y >= tr) return plant(x, z) && y <= 26 ? [PIER] : null;       // plant room sits on the top tier
  const F = storeyOf(y), rel = y - F, top = F + 3 === tr - 1;
  const ex = exposed(x, y, z);
  if (rel === 0 || rel === 3) {
    if (rel === 3 && top && !ex.length) return [STONE];             // the roof
    if (!ex.length) return [STONE];                                 // interior slab / ceiling
  }
  if (!ex.length) return null;                                      // air gap behind the glass
  const axis = facadeAxis(ex), idx = axis === "x" ? x : z;
  const pier = axis === "corner" || idx % 3 === 0;
  if (rel === 3 && top) return [SPANDREL];                          // cornice
  if (y === DATUM) return [BASE];                                   // base course
  if (isEntrance(x, z)) {
    if (y === DATUM + 1) return ["dark_oak_door", { facing: ex.includes("N") ? "north" : ex.includes("S") ? "south" : ex.includes("W") ? "west" : "east", half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (y === DATUM + 2) return ["dark_oak_door", { facing: ex.includes("N") ? "north" : ex.includes("S") ? "south" : ex.includes("W") ? "west" : "east", half: "upper", hinge: "left", open: "false", powered: "false" }];
    if (rel === 2 && F === DATUM) return [SPANDREL];                 // canopy over the door
  }
  if (pier) return [PIER];
  if (rel === 0 || rel === 3) return [SPANDREL];
  // a window bay: panes connect to the neighbours along the face (see the second pass)
  return [GLASS];
}

// Pass 1: the massing and the articulation.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFP(x, z)) continue;
  const top = Math.max(gnd[z * W + x], T(x, z) + (plant(x, z) ? 2 : 0));
  for (let y = 0; y < top; y++) {
    const b = blockAt(x, y, z);
    if (!b) continue;
    if (b[0] === GLASS) {                                           // pane states come from the neighbours
      g.set(x, y, z, GLASS, { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
    } else g.set(x, y, z, b[0], b[1]);
  }
}

// Pass 2: panes connect to the solid or glass beside them along the face; the window bays get warm light behind the glass.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFP(x, z)) continue;
  const tr = T(x, z);
  for (let y = gnd[z * W + x]; y < tr; y++) {
    const b = blockAt(x, y, z);
    if (!b || b[0] !== GLASS) continue;
    const link = (nx, nz) => { const nb = inFP(nx, nz) ? blockAt(nx, y, nz) : null; return !!nb; };
    const ex = exposed(x, y, z), axis = facadeAxis(ex);
    const along = axis === "x" ? [["W", "E"]] : [["N", "S"]];
    const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
    for (const [a, c] of along) {
      const [adx, adz] = DIRS[a], [cdx, cdz] = DIRS[c];
      st[a === "W" ? "west" : "north"] = link(x + adx, z + adz) ? "true" : "false";
      st[c === "E" ? "east" : "south"] = link(x + cdx, z + cdz) ? "true" : "false";
    }
    g.set(x, y, z, GLASS, st);
    // warm light behind every 5th upper window bay, on the room side
    const F = storeyOf(y);
    if (y === F + 1 && (x * 31 + z * 17 + F * 7) % 5 === 0 && ex.length) {
      const inward = { N: "S", S: "N", W: "E", E: "W" }[ex[0]], [idx, idz] = DIRS[inward];
      if (inFP(x + idx, z + idz) && !blockAt(x + idx, y, z + idz)) g.set(x + idx, y, z + idz, LIGHT);
    }
  }
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_260054042.nbt");
console.log(JSON.stringify({ entranceFace, entrance, ...info }));
