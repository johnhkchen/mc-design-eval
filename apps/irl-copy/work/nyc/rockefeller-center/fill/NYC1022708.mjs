// NYC1022708: American Management Association, 135 West 50th Street (1963). A glass-and-spandrel
// office tower: granite plinth, 3-block storeys (spandrel + two window rows), aluminium mullions,
// a recessed lobby on the street face, roof tiers read from the lidar, parapets and a penthouse.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022708.cells.json`, "utf8"));

const TOP = 68;                                   // tallest roof cap; caps sit on storey lines (2 + 3k)
const key = (x, z) => `${x},${z}`;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(key(x, z), { x, z, g, r });
const at = (x, z) => fp.get(key(x, z));
const inFp = (x, z) => fp.has(key(x, z));

// Each cell's roof cap: lidar roof, median-smoothed over the 3x3, snapped to the four tiers.
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const tierCap = (r) => (r < 35 ? 26 : r < 52 ? 44 : r < 65 ? 59 : TOP);
for (const c of fp.values()) {
  if (c.r <= 3) { c.cap = 2; continue; }          // no roof in the lidar: a plinth deck
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at(c.x + dx, c.z + dz); if (n) v.push(n.r); }
  c.cap = tierCap(median(v));
}

// Distance from each tier's edge (1 = edge): decides parapets, plant and the penthouse position.
const dist = new Map();
const queue = [];
for (const c of fp.values()) {
  if (NB.some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.cap !== c.cap; })) { dist.set(key(c.x, c.z), 1); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of NB) {
    const n = at(c.x + dx, c.z + dz);
    if (n && n.cap === c.cap && !dist.has(key(n.x, n.z))) { dist.set(key(n.x, n.z), d + 1); queue.push(n); }
  }
}
const dOf = (x, z) => dist.get(key(x, z)) ?? 0;

// A cell is exposed at height y when its column reaches y; a facade is an exposed cell with an
// unexposed neighbour (off the footprint or under a lower tier), so setbacks get their own walls.
const exposed = (x, z, y) => { const c = at(x, z); return !!c && c.cap >= y; };
const edgeAt = (x, z, y) => NB.some(([dx, dz]) => !exposed(x + dx, z + dz, y));
const facade = (x, z, y) => exposed(x, z, y) && edgeAt(x, z, y);
const outward = (x, z, y) => NB.find(([dx, dz]) => !exposed(x + dx, z + dz, y));

// Lobby on the street (south, high-z) face, centred on the median x of that face.
const zMax = Math.max(...[...fp.values()].map((c) => c.z));
const faceXs = [...fp.values()].filter((c) => c.z === zMax).map((c) => c.x).sort((a, b) => a - b);
const xc = faceXs[faceXs.length >> 1];
const zs = Math.max(...[...fp.values()].filter((c) => c.x === xc).map((c) => c.z));
const inRecess = (x, z) => Math.abs(x - xc) <= 4 && (z === zs || z === zs - 1) && inFp(x, z);

// Tallest tier: penthouse centred on the deep interior of the tower.
const deep = [...fp.values()].filter((c) => c.cap === TOP && dOf(c.x, c.z) >= 6);
const cx = Math.round(deep.reduce((s, c) => s + c.x, 0) / deep.length);
const cz = Math.round(deep.reduce((s, c) => s + c.z, 0) / deep.length);
const penthouse = (x, z) => dOf(x, z) >= 3 && Math.abs(x - cx) <= 6 && Math.abs(z - cz) <= 4;

function recess(x, z, y) {
  const outer = z === zs;
  if (y === 5) return ["black_concrete"];                       // canopy: underside of the storey-1 floor line
  if (outer && (x === xc || x === xc + 1) && y <= 3)
    return ["iron_door", { facing: "south", half: y === 2 ? "lower" : "upper", hinge: x === xc ? "left" : "right", open: "false", powered: "false" }];
  if (y === 2) return outer ? ["polished_granite"] : null;      // threshold; air behind it
  return outer ? ["gray_stained_glass"] : null;                 // lobby glazing, air behind
}

function aboveCap(c, x, y, z) {
  if (y === c.cap + 1 && edgeAt(x, z, c.cap)) return ["light_gray_concrete"];   // coping
  if (c.cap === TOP && penthouse(x, z)) {
    if (y <= c.cap + 2) return ["light_gray_concrete"];                         // 69-70
    if (y === c.cap + 3) return ["stone"];                                      // 71 roof
    if (x === cx && z === cz && y <= c.cap + 6) return ["lightning_rod"];      // 72-74
    return null;
  }
  // roof plant: iron boxes in a loose grid, two high, kept off the parapet
  if (c.cap > 2 && dOf(x, z) >= 3 && x % 10 >= 4 && x % 10 <= 6 && z % 8 >= 3 && z % 8 <= 4 && y <= c.cap + 2) return ["iron_block"];
  return null;
}

// Behind a glass bay, one cell in from the facade: a hanging lantern from the floor above, on some bays.
function lanternHere(x, z, y, b) {
  return NB.some(([dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    if (!facade(nx, nz, y)) return false;
    const [ox, oz] = outward(nx, nz, y);
    if (ox !== -dx || oz !== -dz) return false;                 // the glass must face this cell
    const along = oz !== 0 ? nx : nz;
    return along % (b === 2 ? 4 : 3) !== 0 && (nx * 7 + nz * 5 + b) % 5 === 0;
  });
}

function blockAt(x, y, z) {
  const c = at(x, z);
  if (!c) return null;
  if (y < c.g) return ["stone"];                                // foundation down to the ground
  if (y < 2) return ["polished_granite"];                       // base course
  if (inRecess(x, z) && c.cap >= 5 && y <= 5) return recess(x, z, y);
  if (y > c.cap) return aboveCap(c, x, y, z);

  const b = 2 + 3 * Math.floor((y - 2) / 3);                    // storey floor line
  const o = y - b;                                              // 0 spandrel/floor, 1-2 glass
  const fac = facade(x, z, y);
  if (o === 0) {
    if (fac) return [b === 2 ? "polished_granite" : "light_gray_concrete"];
    return [y === c.cap ? "stone" : "light_gray_concrete"];   // roof membrane / floor slab
  }
  if (fac) {
    const [, dz] = outward(x, z, y);
    const along = dz !== 0 ? x : z;
    if (along % (b === 2 ? 4 : 3) === 0) return ["iron_block"];   // aluminium mullion
    return [b === 2 ? "cyan_stained_glass" : "gray_stained_glass"];
  }
  // inside the shell: an air gap behind the glass, floor slabs, a structural column grid
  if (o === 2 && lanternHere(x, z, y, b)) return ["lantern", { hanging: "true" }];
  if (x % 8 === 4 && z % 8 === 4 && !NB.some(([dx, dz]) => facade(x + dx, z + dz, y))) return ["iron_block"];
  return null;
}

const vox = new Voxels([65, 82, 55]);
let n = 0;
for (const c of fp.values()) {
  for (let y = 0; y <= 75; y++) {
    const b = blockAt(c.x, y, c.z);
    if (b) { vox.set(c.x, y, c.z, b[0], b[1]); n++; }
  }
}
vox.save(`${DIR}/NYC1022708.nbt`);
console.log(`cells ${fp.size}, blocks ${n}, palette ${vox.palette.length}, lobby x=${xc} z=${zs}, penthouse centre (${cx},${cz})`);
