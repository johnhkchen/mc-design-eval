// way 162091775: a 1920s three-storey brick shop-top block on a basalt plinth (the CBD's pre-war fabric), 14 blocks
// to its roof (lidar median), storeys on a 4-block pitch. Long west face is the shopfront street; the other faces are
// sash-style windows with white mullions. Walls are two cells thick: the outer cell is the face (window reveal, air in
// front of the glass), the inner cell carries the glass, and the rooms behind are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091775.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162091775.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof]
const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const inFp = (x, z) => ground.has(key(x, z));
const NB = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// one flat roof tier: the lidar's 13s are a one-block dip in the same deck, 11s and 12s are edge noise; the median is 14
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const TOP = roofs[roofs.length >> 1];

// depth in cells from the outside of the footprint: 1 = outer face, 2 = the glass layer, 3+ = rooms
const dist = new Map();
let frontier = [];
for (const [x, z] of cells) if (NB.some(([a, b]) => !inFp(x + a, z + b))) { dist.set(key(x, z), 1); frontier.push([x, z]); }
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [a, b] of NB) {
    if (inFp(x + a, z + b) && !dist.has(key(x + a, z + b))) { dist.set(key(x + a, z + b), d + 1); next.push([x + a, z + b]); }
  }
  frontier = next;
}
const D = (x, z) => dist.get(key(x, z)) ?? 0;

// each outer cell: its outward normal, its position u along the face, and whether it is a pier (every 4th cell).
// The footprint's stepped edges have cells open on two sides; those keep the normal of their first open side, since
// making them all piers turned the stepped flank into a solid dark mass with no windows.
const faces = [];
for (const [x, z] of cells) {
  if (D(x, z) !== 1) continue;
  const [nx, nz] = NB.find(([a, b]) => !inFp(x + a, z + b));
  const u = nx !== 0 ? z : x;
  faces.push({ x, z, nx, nz, u, pier: u % 4 === 0 });
}

// the owning outer cell of every layer behind a face: depth 1 is the face itself, depth 2 the glass layer
const layer = new Map();
for (const f of faces) for (let k = 0; k < 3; k++) {
  const x = f.x - k * f.nx, z = f.z - k * f.nz;
  if (inFp(x, z) && D(x, z) === k + 1 && !layer.has(key(x, z))) layer.set(key(x, z), f);
}

const SILL = { 1: 3, 2: 7, 3: null };
const GLASS = { 1: [4, 5], 2: [8, 9], 3: [11, 12] };
const storey = y => (y <= 5 ? 1 : y <= 9 ? 2 : 3);
const isShopFace = f => f.nx === -1 && f.nz === 0;   // the west face is the street with the shopfronts

// the entrance: a recessed doorway on the shopfront near u = 20, its door in the glass layer
const doorF = faces
  .filter(f => isShopFace(f) && !f.pier && inFp(f.x + 1, f.z) && D(f.x + 1, f.z) === 2)
  .sort((a, b) => Math.abs(a.u - 20) - Math.abs(b.u - 20))[0];
const doorOuter = key(doorF.x, doorF.z), doorGlass = key(doorF.x + 1, doorF.z);

// the wall at one cell of a face (k = depth 1 or 2) and height y: [block, state], or null for air
function wall(f, k, y) {
  if (!f) return ["bricks"];
  const s = storey(y);
  if (f.pier) return ["stone_bricks"];
  if (y === SILL[s]) return ["smooth_stone"];
  if (GLASS[s].includes(y)) {
    if (isShopFace(f) && s === 1) return k === 1 ? ["glass"] : null;   // open shop, glazed to the street
    if (k === 2) return ["glass"];
    return f.u % 4 === 2 ? ["white_concrete"] : null;                  // sash mullion on the outer face, reveals stay air
  }
  return ["bricks"];
}

const V = new Voxels([17, 27, 45]);
const facesNear = (x, z) => { for (const [a, b] of NB) { const o = faces.find(f => f.x === x + a && f.z === z + b); if (o) return o; } return undefined; };
const put = (x, y, z, block, state) => V.set(x, y, z, block, state);

for (const [x, z] of cells) {
  const d = D(x, z), k = key(x, z);
  // a glass-layer cell the face's own inward line misses (a notch) takes the face of the outer cell beside it
  const f = layer.get(k)?.f ?? (d === 2 ? facesNear(x, z) : undefined);
  for (let y = 0; y < TOP; y++) {
    if (y <= 2) put(x, y, z, d === 1 ? "polished_andesite" : "stone");       // basalt plinth; fills to the ground on the low side
    else if (y === 13) put(x, y, z, d === 1 ? "smooth_stone" : "stone");     // roof deck, with a cornice on the outer face
    else if (y === 6 || y === 10) put(x, y, z, d === 1 ? "stone_bricks" : "stone");   // storey bands and floor slabs
    else if (d <= 2) {
      if (k === doorOuter && (y === 3 || y === 4 || y === 5)) continue;     // the recess in front of the door
      if (k === doorGlass && (y === 3 || y === 4)) {
        put(x, y, z, "dark_oak_door", { facing: "east", half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (k === doorGlass && y === 5) { put(x, y, z, "lantern", { hanging: "true" }); continue; }
      const w = wall(f, d, y);
      if (w) put(x, y, z, w[0], w[1]);
    }
  }
}

// warm light in some bays: a standing lantern inside the shop, and glowstone behind the glass of some windows
for (const f of faces) {
  if (f.pier) continue;
  const [ix, iz] = [f.x - 2 * f.nx, f.z - 2 * f.nz];   // the room cell two in from the face
  if (!inFp(ix, iz) || D(ix, iz) !== 3) continue;
  if (isShopFace(f)) { if (f.u % 8 === 4) put(ix, 3, iz, "lantern"); continue; }
  for (const s of [1, 2, 3]) if ((f.x * 5 + f.z * 3 + s) % 4 === 0) put(ix, GLASS[s][0], iz, "glowstone");
}

// rooftop plant: two 3x3 plinths with a unit on each
for (const [cx, cz] of [[4, 15], [10, 30]]) {
  for (let x = cx; x < cx + 3; x++) for (let z = cz; z < cz + 3; z++) {
    if (!inFp(x, z) || D(x, z) < 3) continue;
    put(x, TOP, z, "stone_bricks");
  }
  if (inFp(cx + 1, cz + 1)) put(cx + 1, TOP + 1, cz + 1, "iron_block");
}

const stats = V.save(OUT);
console.log(`way_162091775: ${cells.length} footprint cells, roof ${TOP}, door at u=${doorF.u} (z ${doorF.z})`, stats);
