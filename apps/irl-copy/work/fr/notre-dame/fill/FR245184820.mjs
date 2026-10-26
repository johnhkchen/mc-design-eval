// Tribunal de commerce de Paris (FR245184820): a limestone-faced commercial block on the Île de la Cité.
// Massing follows the lidar roof: a 5x5 median over the footprint, then quantised to 5-block storeys (setbacks, a
// courtyard well, a taller core). Each column stands on a plinth to its ground; the walls are a one-block skin
// (quartz piers, glass bays, string courses, lit windows) over an air gap per storey with a slab on every storey line,
// and a solid core. Slate roofs with a quartz parapet; a dark-wood entrance on the -z face.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184820.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..84, z 0..99
const X = 85, Y = 77, Z = 100;
const ROOF_MAX = 63, ROOF_MIN = 11;

// per-column record, keyed z * X + x
const col = new Array(X * Z).fill(null);
for (const [x, z, g, r] of cells) col[z * X + x] = { g, r, H: 0 };
const inFp = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && col[z * X + x] !== null;

// the roof: 5x5 median of the lidar roof, quantised to 5-block storeys (flat tiers, not noise)
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const c = col[z * X + x]; if (!c) continue;
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inFp(x + dx, z + dz)) vals.push(col[(z + dz) * X + x + dx].r);
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  c.H = Math.min(ROOF_MAX, Math.max(ROOF_MIN, Math.round(med / 5) * 5));
}

const id = (x, y, z) => (z * Y + y) * X + x;
const solid = new Uint8Array(X * Y * Z);      // foundation or body
const body = new Uint8Array(X * Y * Z);       // above the ground, below the roof
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const c = col[z * X + x]; if (!c) continue;
  for (let y = 0; y < c.H; y++) { solid[id(x, y, z)] = 1; if (y >= c.g) body[id(x, y, z)] = 1; }
}
const S = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z) ? 0 : solid[id(x, y, z)];
const NB = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

// exterior: a solid voxel with an open face; shell: a body voxel just inside one
const ext = new Uint8Array(X * Y * Z), shell = new Uint8Array(X * Y * Z);
for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) {
  if (!solid[id(x, y, z)]) continue;
  for (const [dx, dy, dz] of NB) if (!S(x + dx, y + dy, z + dz)) { ext[id(x, y, z)] = 1; break; }
}
for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) {
  const i = id(x, y, z); if (!body[i] || ext[i]) continue;
  for (const [dx, dy, dz] of NB) { const j = id(x + dx, y + dy, z + dz); if (x + dx >= 0 && y + dy >= 0 && z + dz >= 0 && x + dx < X && y + dy < Y && z + dz < Z && ext[j]) { shell[i] = 1; break; } }
}

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// the plinth, the walls, the roof and the air gap behind the glass
const isSlabRow = (y, c) => y === c.g || y % 5 === 0 || y === c.H - 2;
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const c = col[z * X + x]; if (!c) continue;
  for (let y = 0; y < c.g; y++) put(x, y, z, "stone_bricks");
  for (let y = c.g; y < c.H; y++) {
    const i = id(x, y, z);
    if (ext[i]) {
      const exX = !S(x - 1, y, z) ? -1 : !S(x + 1, y, z) ? 1 : 0;
      const exZ = !S(x, y, z - 1) ? -1 : !S(x, y, z + 1) ? 1 : 0;
      if (y === c.H - 1) { put(x, y, z, exX || exZ ? "smooth_quartz" : "deepslate_tiles"); continue; }   // parapet or slate
      if (!exX && !exZ) { put(x, y, z, "smooth_quartz"); continue; }
      if (exX && exZ) { put(x, y, z, "quartz_pillar"); continue; }                                       // corner pier
      if (y === c.g) { put(x, y, z, "stone_bricks"); continue; }                                          // base course
      const r = y % 5;
      if (r === 0 || r === 4) { put(x, y, z, "smooth_quartz"); continue; }                                 // string courses
      const u = exX ? z : x;
      put(x, y, z, u % 3 === 0 ? "quartz_pillar" : "glass");                                             // piers, glass bays
    } else if (shell[i]) {
      if (isSlabRow(y, c)) put(x, y, z, "smooth_quartz");                                                 // a floor per storey
      // else air: the gap behind the glass
    } else {
      put(x, y, z, "stone");                                                                              // solid core
    }
  }
}

// warm lights in some windows, in the air gap behind the glass
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const c = col[z * X + x]; if (!c) continue;
  for (let y = c.g; y < c.H; y++) {
    if (!ext[id(x, y, z)] || y % 5 === 0 || y % 5 === 4 || y === c.H - 1 || y === c.g) continue;
    const exX = !S(x - 1, y, z) ? -1 : !S(x + 1, y, z) ? 1 : 0;
    const exZ = !S(x, y, z - 1) ? -1 : !S(x, y, z + 1) ? 1 : 0;
    if (exX && exZ) continue;
    const u = exX ? z : x;
    if (u % 3 === 0) continue;
    const k = (u * 5 + y * 7 + (exX ? 3 : 0)) % 13;
    if (k !== 0 && k !== 6) continue;
    // the air gap is one block inward, opposite the open face
    const bx = exX ? x - exX : x, bz = exX ? z : z - exZ;
    if (!shell[id(bx, y, bz)] || isSlabRow(y, c)) continue;
    put(bx, y, bz, k === 0 ? "shroomlight" : "glowstone");
  }
}

// the entrance: a dark-wood door on the -z face, near the middle of the frontage
for (const xc of [42, 41, 43, 40, 44, 39, 45]) {
  let zf = -1;
  for (let z = 0; z < Z; z++) if (inFp(xc, z)) { zf = z; break; }
  if (zf < 0) continue;
  const c = col[zf * X + xc];
  if (c.H - c.g < 6) continue;
  put(xc, c.g, zf, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(xc, c.g + 1, zf, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // the hall behind the door is open to the foot of the stair
  g.set(xc, c.g, zf + 1, "air"); g.set(xc, c.g + 1, zf + 1, "air");
  g.set(xc, c.g + 2, zf + 1, "air");
  // a wall lamp either side, on the piers
  for (const dx of [-2, 2]) if (inFp(xc + dx, zf)) put(xc + dx, c.g + 2, zf, "shroomlight");
  break;
}

// roof plant on the slate: small iron boxes on a grid, standing on the roof
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const c = col[z * X + x]; if (!c) continue;
  if (x % 14 !== 7 || z % 14 !== 7) continue;
  if (c.H < 45) continue;
  if (!inFp(x + 1, z) || !inFp(x, z + 1) || !inFp(x + 1, z + 1)) continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const cc = col[(z + dz) * X + x + dx];
    if (cc.H !== c.H) continue;
    put(x + dx, c.H, z + dz, "iron_block");
  }
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184820.nbt");
console.log(JSON.stringify(out));
