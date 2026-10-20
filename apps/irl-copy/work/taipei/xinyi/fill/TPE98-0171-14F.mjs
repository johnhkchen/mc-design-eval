import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const IN = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE98-0171-14F.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE98-0171-14F.nbt";

// 2009 Xinyi-district glass office block: 14 storeys of ~5 blocks, roof at 69.
// Glass curtain wall with white concrete mullions, stone base course, light grey
// floor bands, a two-storey-plus setback (tier) above y=65, parapets, a central
// penthouse and an aviation mast.
const W = 33, H = 81, D = 22;
const TOP = 69;          // roof slab level (relative to lowest ground)
const TIER_Y = 65;       // setback: ring cells stop here, inner tier continues to roof
const PH_CX = 16, PH_CZ = 10;

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const raw = JSON.parse(readFileSync(IN, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

let minG = Infinity;
for (const [, , gr] of list) minG = Math.min(minG, gr);

const ground = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of list) ground.set(key(x, z), gr - minG);
const has = (x, z) => ground.has(key(x, z));

// Tier = footprint cells whose 5x5 neighbourhood is entirely inside the footprint
// (a two-block setback from every edge above TIER_Y).
const isTier = (x, z) => {
  if (!has(x, z)) return false;
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++)
      if (!has(x + dx, z + dz)) return false;
  return true;
};

function hash(x, y, z) {
  return (x * 31 + y * 17 + z * 13) % 7;
}

// Faces: which sides of a cell are exposed, given a membership test.
function facesOf(x, z, member) {
  return {
    N: !member(x, z - 1),
    S: !member(x, z + 1),
    W: !member(x - 1, z),
    E: !member(x + 1, z),
  };
}

// Facade block for a perimeter cell at height y.
function wallBlock(x, y, z, gr, faces) {
  const nFaces = Object.values(faces).filter(Boolean).length;
  const corner = nFaces >= 2;
  if (y < gr + 3) return "stone_bricks";                 // base course
  if (y === TOP - 1) return "light_gray_concrete";       // cornice band
  if (y % 5 === 0) return "light_gray_concrete";         // storey floor band
  if (corner) return "white_concrete";                   // corner columns
  const idx = (faces.N || faces.S) ? x : z;
  if (idx % 3 === 0) return "white_concrete";            // mullions
  if (y % 5 === 2 && hash(x, y, z) === 0) return "glowstone"; // lit office behind glass
  return "light_blue_stained_glass";
}

// ---- main massing: every footprint cell ----
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);

  const fullFaces = facesOf(x, z, has);
  const fullPerim = Object.values(fullFaces).some(Boolean);
  const tier = isTier(x, z);
  const tierFaces = facesOf(x, z, isTier);
  const tierPerim = tier && Object.values(tierFaces).some(Boolean);

  // foundation: solid from 0 up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  // ground-level floor
  if (!fullPerim) put(x, gr, z, "light_gray_concrete");

  for (let y = gr; y < TOP; y++) {
    if (y < TIER_Y) {
      if (fullPerim) put(x, y, z, wallBlock(x, y, z, gr, fullFaces));
      else if (y === gr || y % 5 === 0) put(x, y, z, "light_gray_concrete");
    } else if (y === TIER_Y) {
      // the setback floor: slab for every footprint cell (roof of the ring, floor of the tier)
      put(x, y, z, "light_gray_concrete");
    } else {
      if (tier) {
        if (tierPerim) put(x, y, z, wallBlock(x, y, z, gr, tierFaces));
        // interior of the tier: air
      } else if (y === TIER_Y + 1) {
        // ring parapet, the stepped-back edge
        put(x, y, z, "white_concrete");
      }
    }
  }

  // roof slab over the tier (inner block) only
  if (tier && gr < TOP) {
    put(x, TOP, z, "light_gray_concrete");
    if (tierPerim) put(x, TOP + 1, z, "white_concrete");
  }
}

// ---- entrance on the north edge (lowest z), centred, three bays wide ----
{
  let minZ = Infinity;
  for (const k of ground.keys()) minZ = Math.min(minZ, Number(k.split(",")[1]));
  const xs = [];
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (z === minZ) xs.push(x);
  }
  xs.sort((a, b) => a - b);
  const mx = xs[Math.floor(xs.length / 2)];
  const gr = ground.get(key(mx, minZ));

  // lobby glazing flanking the door, two bays each side, lintel above the door
  for (const dx of [-2, -1, 1, 2]) {
    if (!has(mx + dx, minZ)) continue;
    const gg = ground.get(key(mx + dx, minZ));
    put(mx + dx, gg + 1, minZ, "light_blue_stained_glass");
    put(mx + dx, gg + 2, minZ, "light_blue_stained_glass");
  }
  put(mx, gr + 2, minZ, "light_gray_concrete");

  // double door (lower + upper half)
  put(mx, gr, minZ, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(mx, gr + 1, minZ, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

  // warm light inside the lobby
  if (has(mx, minZ + 1)) put(mx, gr + 1, minZ + 1, "glowstone");
}

// ---- central penthouse: rectangle inside the tier, y 70..74 ----
const inPH = (x, z) =>
  Math.abs(x - PH_CX) <= 8 && Math.abs(z - PH_CZ) <= 5 && isTier(x, z);
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!inPH(x, z)) continue;
    const edge = !inPH(x - 1, z) || !inPH(x + 1, z) || !inPH(x, z - 1) || !inPH(x, z + 1);
    if (edge) {
      put(x, TOP + 1, z, "light_gray_concrete");
      put(x, TOP + 2, z, "light_blue_stained_glass");
      put(x, TOP + 3, z, "light_blue_stained_glass");
      put(x, TOP + 4, z, "light_gray_concrete");
    }
    put(x, TOP + 5, z, "light_gray_concrete");
  }
}

// ---- aviation mast on the penthouse roof ----
for (let y = TOP + 6; y <= TOP + 9; y++) {
  put(PH_CX, y, PH_CZ, "lightning_rod", { facing: "up", powered: "false" });
}
put(PH_CX, TOP + 10, PH_CZ, "redstone_lamp");

g.save(OUT);
