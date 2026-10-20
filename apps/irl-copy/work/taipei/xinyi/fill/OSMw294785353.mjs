import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 春秋大廈: a 1990s Taipei mid-rise office block, about 13 storeys of 5 blocks,
// with a light-grey concrete frame, white piers, blue-tinted glazing, a
// polished-andesite base, a ground-floor shopfront with a framed entrance,
// a cornice and a rooftop mechanical penthouse with a short antenna.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw294785353";
const W = 75, H = 81, D = 58;
const ROOF = 69;          // roof cap layer (about 69 blocks above lowest ground)
const PH_BASE = 70;       // penthouse starts above the cap
const PH_TOP = 75;        // penthouse roof slab
const ANT_BASE = 76;      // antenna base

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => x + "," + z;

// Build cell records
const groundMap = new Map();
const list = [];
for (const row of raw) {
  const [x, z, gr] = Array.isArray(row) ? row : [row.x, row.z, row.ground];
  groundMap.set(key(x, z), gr);
  list.push({ x, z, g: gr });
}

// Distance from the outside (0 = outside, 1 = exterior ring, 2 = next ring, ...)
const dist = new Map();
const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]];
let frontier = [];
for (const c of list) {
  const edge = DIRS.some(([dx, dz]) => !groundMap.has(key(c.x + dx, c.z + dz)));
  if (edge) { dist.set(key(c.x, c.z), 1); frontier.push(c); }
}
while (frontier.length) {
  const next = [];
  for (const c of frontier) {
    const d = dist.get(key(c.x, c.z));
    for (const [dx, dz] of DIRS) {
      const nk = key(c.x + dx, c.z + dz);
      if (groundMap.has(nk) && !dist.has(nk)) {
        dist.set(nk, d + 1);
        next.push({ x: c.x + dx, z: c.z + dz, g: groundMap.get(nk) });
      }
    }
  }
  frontier = next;
}
const dAt = (x, z) => (groundMap.has(key(x, z)) ? dist.get(key(x, z)) : 0);

const dirName = (dx, dz) =>
  dx === 0 && dz === -1 ? "north" :
  dx === 0 && dz === 1 ? "south" :
  dx === 1 ? "east" : "west";

// Outward direction and along-wall coordinate per cell
for (const c of list) {
  c.d = dAt(c.x, c.z);
  c.dir = [0, 0];
  for (const [dx, dz] of DIRS) {
    if (dAt(c.x + dx, c.z + dz) === c.d - 1) { c.dir = [dx, dz]; break; }
  }
  c.a = c.dir[1] !== 0 ? c.x : c.z;
  c.door = false;
}

// Storey top of the ground storey containing a given ground level
const gF = (g) => Math.floor(g / 5) * 5 + 5;

// Entrance: on the z-min facade, near the middle of its run
let doorCell = null;
{
  for (const want of [[0, -1], [0, 1]]) {
    const side = list.filter(c => c.d === 1 && c.dir[0] === want[0] && c.dir[1] === want[1]);
    if (!side.length) continue;
    const xs = side.map(c => c.x);
    let a0 = Math.floor((Math.min(...xs) + Math.max(...xs)) / 2);
    if (a0 % 4 === 0) a0++;
    const cand = side.find(c => c.x === a0);
    if (cand) { doorCell = cand; break; }
  }
  if (doorCell && gF(doorCell.g) - doorCell.g >= 3) doorCell.door = true;
  else doorCell = null;
}

const vox = new Voxels([W, H, D]);

function facadeBlock(c, y) {
  if (y === c.g) return ["polished_andesite"];
  const inGround = y < gF(c.g);
  if (inGround && doorCell) {
    const sameSide = c.dir[0] === doorCell.dir[0] && c.dir[1] === doorCell.dir[1];
    const near = sameSide && Math.abs(c.a - doorCell.a) <= 1;
    if (near) {
      // Framed entrance: lintel over the door, white jambs beside it
      if (y === gF(c.g) - 1) return ["light_gray_concrete"];
    }
    if (c.door) {
      const doorProps = (half) => ({
        facing: dirName(c.dir[0], c.dir[1]),
        half, hinge: "left", open: "false", powered: "false",
      });
      if (y === c.g + 1) return ["dark_oak_door", doorProps("lower")];
      if (y === c.g + 2) return ["dark_oak_door", doorProps("upper")];
    }
    if (near && c.a !== doorCell.a) return ["white_concrete"];
  }
  if (inGround) {
    return c.a % 4 === 0 ? ["white_concrete"] : ["glass"];
  }
  const row = y % 5;
  if (row === 0 || row === 4) return ["light_gray_concrete"];
  if (c.a % 4 === 0) return ["white_concrete"];
  return ["light_blue_stained_glass"];
}

function blockFor(c, y) {
  if (y === ROOF) return c.d === 1 ? ["white_concrete"] : ["smooth_stone"];
  if (c.d === 1) return facadeBlock(c, y);
  if (c.d >= 3) return ["light_gray_concrete"];
  // d === 2: the air gap behind the glazing, with some warm lights
  const row = y % 5;
  const windowRow = row >= 1 && row <= 3 && c.a % 4 !== 0 && y > c.g;
  if (windowRow) {
    if (row === 2 && c.a % 8 === 6) return ["glowstone"];
    if (row === 2 && c.a % 8 === 2) return ["shroomlight"];
    return null; // air
  }
  return ["light_gray_concrete"];
}

// Main column build
for (const c of list) {
  for (let y = 0; y < c.g; y++) vox.set(c.x, y, c.z, "stone_bricks");
  for (let y = c.g; y <= ROOF; y++) {
    const b = blockFor(c, y);
    if (b) vox.set(c.x, y, c.z, b[0], b[1]);
  }
}

// Rooftop mechanical penthouse, centred, with a short antenna
{
  const minX = Math.min(...list.map(c => c.x)), maxX = Math.max(...list.map(c => c.x));
  const minZ = Math.min(...list.map(c => c.z)), maxZ = Math.max(...list.map(c => c.z));
  const bw = maxX - minX, bd = maxZ - minZ;
  const inBox = (c) =>
    c.d >= 3 &&
    c.x >= minX + bw * 0.3 && c.x <= maxX - bw * 0.3 &&
    c.z >= minZ + bd * 0.3 && c.z <= maxZ - bd * 0.3;
  const box = list.filter(inBox);
  for (const c of box) {
    for (let y = PH_BASE; y < PH_TOP; y++) vox.set(c.x, y, c.z, "light_gray_concrete");
    vox.set(c.x, PH_TOP, c.z, "smooth_stone");
  }
  if (box.length) {
    const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
    const ant = box.reduce((best, c) =>
      (Math.hypot(c.x - cx, c.z - cz) < Math.hypot(best.x - cx, best.z - cz) ? c : best));
    for (let y = ANT_BASE; y < ANT_BASE + 4 && y < H; y++) {
      vox.set(ant.x, y, ant.z, "lightning_rod");
    }
  }
}

vox.save(`${DIR}/${ID}.nbt`);
