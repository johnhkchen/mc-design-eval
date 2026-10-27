// The Elliott Hotel, Auckland CBD (way 23906935): a 1980s concrete-frame city hotel. A stone plinth and a glazed
// shopfront at street level, then a white concrete frame with blue glazing in storey bands, a lower wing and a
// slender tower that climbs to the lidar roof (about 71 blocks above the lowest ground). Every storey is a slab
// that rests on the one below; the interior is air behind the glass, with a column grid for the floors to sit on.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_23906935.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 68, L = 51, H = 83;
const D = 11;   // datum: the first floor line; storey bands sit on 11 + 4k so the tops land on 11 + 4n (71 = 15 storeys)
const vox = new Voxels([W, H, L]);

const info = new Map();
for (const [x, z, gr, r] of cells) info.set(`${x},${z}`, { g: gr, r });
const inFp = (x, z) => info.has(`${x},${z}`);
const cellAt = (x, z) => info.get(`${x},${z}`);

// Lidar roof, median over the 3x3 footprint neighbourhood, then quantised to whole storeys above the datum.
function median3(x, z) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = cellAt(x + dx, z + dz); if (c) vals.push(c.r); }
  vals.sort((a, b) => a - b);
  return vals[Math.floor(vals.length / 2)];
}
const topOf = new Map();
for (const key of info.keys()) {
  const [x, z] = key.split(",").map(Number);
  const n = Math.max(0, Math.round((median3(x, z) - D) / 4));
  topOf.set(key, D + 4 * n);   // Q: walls run from the cell's ground up to Q - 1; Q is the cornice row
}
// Lidar spikes: a raised tier that is only a few cells across is noise, not a tower. Each connected run of cells at or
// above a level that is smaller than MIN_TIER drops to the highest tier beside it.
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const MIN_TIER = 16;
for (const t of [...new Set(topOf.values())].sort((a, b) => b - a)) {
  const seen = new Set();
  for (const start of [...topOf.keys()]) {
    if (seen.has(start) || topOf.get(start) < t) continue;
    const comp = [], stack = [start];
    seen.add(start);
    while (stack.length) {
      const k = stack.pop(); comp.push(k);
      const [x, z] = k.split(",").map(Number);
      for (const [dx, dz] of DIRS) {
        const nk = `${x + dx},${z + dz}`;
        if (topOf.has(nk) && !seen.has(nk) && topOf.get(nk) >= t) { seen.add(nk); stack.push(nk); }
      }
    }
    if (comp.length >= MIN_TIER) continue;
    for (const k of comp) {
      const [x, z] = k.split(",").map(Number);
      let below = D;
      for (const [dx, dz] of DIRS) {
        const nk = `${x + dx},${z + dz}`;
        if (topOf.has(nk) && topOf.get(nk) < t) below = Math.max(below, topOf.get(nk));
      }
      topOf.set(k, below);
    }
    console.log(`spike: ${comp.length} cells at ${t} demoted`);
  }
}
const Q = (x, z) => topOf.get(`${x},${z}`);
const QMAX = Math.max(...topOf.values());

// Which outward faces a footprint cell has: outside the footprint, or next to a lower tier (a setback's exposed face).
function exposure(x, z) {
  const q = Q(x, z), out = [];
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inFp(nx, nz) || Q(nx, nz) < q) out.push([dx, dz]);
  }
  return out;
}
const isPerim = (x, z) => exposure(x, z).length > 0;
// interior cells whose 8 neighbours are all interior: where a structural column can stand clear of the glass
const deepInterior = (x, z) => {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!inFp(x + dx, z + dz) || isPerim(x + dx, z + dz)) return false;
  }
  return true;
};

// The entrance: the street-side (+z) face nearest the middle, on the lowest ground.
let entrance = null;
for (const key of info.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (inFp(x, z + 1) || x < 28 || x > 40) continue;
  const score = cellAt(x, z).g * 10 + Math.abs(x - 34);
  if (!entrance || score < entrance.score) entrance = { x, z, score, g: cellAt(x, z).g };
}

const GLASS = "light_blue_stained_glass", FRAME = "white_concrete", SLAB = "light_gray_concrete";
const FOUND = "stone_bricks", PLINTH = "polished_andesite", CORNICE = "stone_brick_slab";

function facade(x, z, y, gr, ex) {
  if (y === gr) return PLINTH;                       // base course
  if (y < D - 2) {                                   // ground storey: shopfront glazing, frame piers
    return piers(x, z, ex) ? FRAME : GLASS;
  }
  if (y === D - 2) return FRAME;                     // ground-storey fascia
  if (y === D - 1) return SLAB;                      // string course under the first floor
  const r = (y - D) % 4;
  if (r === 0) return SLAB;                          // storey line
  if (r === 3) return FRAME;                         // spandrel
  return piers(x, z, ex) ? FRAME : GLASS;            // window rows
}
// Frame piers every third bay along each exposed face.
function piers(x, z, ex) {
  return ex.some(([dx]) => dx !== 0 && z % 3 === 0) || ex.some(([, dz]) => dz !== 0 && x % 3 === 0);
}

// --- Pass 1: foundation, facade, interior floors, columns, glow behind glass
for (const [x, z, gr] of cells) {
  const q = Q(x, z), ex = exposure(x, z), perim = ex.length > 0;
  for (let y = 0; y < gr; y++) vox.set(x, y, z, FOUND);       // solid from y 0 up to the ground
  if (perim) {
    for (let y = gr; y < q; y++) vox.set(x, y, z, facade(x, z, y, gr, ex));
    vox.set(x, q, z, CORNICE, { type: "bottom", waterlogged: "false" });
    continue;
  }
  // interior: the ground floor slab, a slab at each storey line, and the roof deck; air between
  const column = x % 6 === 3 && z % 6 === 3 && deepInterior(x, z);
  for (let y = gr; y < q; y++) {
    const floor = y === gr || y === q - 1 || (y >= D && (y - D) % 4 === 0);
    if (floor || column) vox.set(x, y, z, column ? FRAME : SLAB);
  }
}

// --- Pass 2: warm light just inside some window bays (glowstone on the storey slab, never floating)
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const q = Q(x, z), ex = exposure(x, z);
  const [ox, oz] = ex[0];                              // outward direction of the first exposed face
  const ix = x - ox, iz = z - oz;
  if (!inFp(ix, iz) || isPerim(ix, iz)) continue;
  if (ix % 6 === 3 && iz % 6 === 3) continue;          // not on a column
  for (let y = D + 1; y < q - 1; y += 4) {             // window row 1 of each storey, sits on the slab below
    if (facade(x, z, y, gr, ex) !== GLASS) continue;
    if ((x * 7 + z * 3 + y) % 7 !== 0) continue;
    vox.set(ix, y, iz, "glowstone");
  }
}

// --- Pass 3: entrance (oak doors on the street face, a lintel canopy over them)
if (entrance) {
  const { x: ex0, z: ez0, g: eg } = entrance;
  vox.set(ex0, eg + 1, ez0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  vox.set(ex0, eg + 2, ez0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (let x = ex0 - 2; x <= ex0 + 2; x++) if (inFp(x, ez0) && isPerim(x, ez0)) vox.set(x, eg + 3, ez0, SLAB);
  vox.set(ex0 + 1, eg + 1, ez0, "light_blue_stained_glass");
}

// --- Pass 4: roof: a plant room and lift overrun on the tower top, HVAC pods on the lower roofs
const top = cells.filter(([x, z]) => Q(x, z) === QMAX && !isPerim(x, z));
if (top.length) {
  const cx = Math.round(top.reduce((s, [x]) => s + x, 0) / top.length);
  const cz = Math.round(top.reduce((s, [, z]) => s + z, 0) / top.length);
  for (const [x, z] of top) {
    if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 2) for (let y = QMAX; y < QMAX + 3; y++) vox.set(x, y, z, SLAB);
    else if (x % 5 === 0 && z % 5 === 0) vox.set(x, QMAX, z, "iron_block");
  }
}
for (const [x, z] of cells) {
  if (Q(x, z) === QMAX || isPerim(x, z)) continue;
  if (x % 12 === 4 && z % 12 === 4) vox.set(x, Q(x, z), z, "iron_block");
}

const out = `${DIR}/way_23906935.nbt`;
const res = vox.save(out);
console.log(`saved ${out}: ${res.blocks} blocks, ${res.palette} palette entries; tops ${[...new Set(topOf.values())].sort((a, b) => a - b).join(",")}`);
