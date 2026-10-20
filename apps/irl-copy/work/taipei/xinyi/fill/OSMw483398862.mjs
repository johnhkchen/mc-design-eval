import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw483398862";
const W = 41, H = 86, D = 29;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint lookup: key "x,z" -> ground height of that cell
const gnd = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  gnd.set(`${x},${z}`, gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const inFp = (x, z) => gnd.has(`${x},${z}`);
const G = (x, z) => gnd.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const cx = Math.floor((minX + maxX) / 2);
const cz = Math.floor((minZ + maxZ) / 2);

// Massing: a 15-storey glazed tower on a plain two-storey base, stepped back
// twice. Outer ring ends at y 60, the middle tier at y 74, the penthouse at y 76.
function inset(x, z) {
  return Math.min(x - minX, maxX - x, z - minZ, maxZ - z);
}
function topOf(x, z) {
  const k = inset(x, z);
  if (k >= 8) return 76;
  if (k >= 4) return 74;
  return 60;
}

// A cell is wall when a neighbour is outside the footprint or stands lower.
function isShell(x, z, y) {
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inFp(nx, nz)) return true;
    if (topOf(nx, nz) <= y) return true;
  }
  return false;
}

const isMullion = (x, z) => (x + z) % 3 === 0;
const isFront = (x, z) => !inFp(x, z + 1);
const isEntrance = (x, z) => isFront(x, z) && Math.abs(x - cx) <= 1;

function doorProps(half) {
  return { facing: "south", half, hinge: "left", open: "false", powered: "false" };
}

function facade(x, z, y, gr, t) {
  if (y >= t - 2) return ["smooth_quartz"];                 // cornice / parapet
  if (y === gr) return ["polished_granite"];                // base course
  if (y < gr + 5) {                                         // commercial ground storey
    if (y === gr + 4) return ["white_concrete"];            // fascia band
    if (isEntrance(x, z)) {
      if (y === gr + 1) return ["dark_oak_door", doorProps("lower")];
      if (y === gr + 2) return ["dark_oak_door", doorProps("upper")];
      if (y === gr + 3) return ["smooth_quartz"];           // door lintel
    }
    return isMullion(x, z) ? ["light_gray_concrete"] : ["glass"];
  }
  if (y === 10) return ["smooth_stone"];                    // podium cap belt
  const r = y % 5;
  if (r === 0 || r === 4) return ["white_concrete"];        // storey spandrels
  if (isMullion(x, z)) return ["light_gray_concrete"];      // aluminium mullions
  const s = Math.floor(y / 5);
  return [s % 4 === 2 ? "cyan_stained_glass" : "light_blue_stained_glass"];
}

// Warm light sits in the interior cell directly behind some window panes.
function litBehind(x, z, y) {
  const r = y % 5;
  if (r < 1 || r > 3) return false;
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inFp(nx, nz)) continue;
    if (y < G(nx, nz) || y >= topOf(nx, nz)) continue;
    if (!isShell(nx, nz, y)) continue;
    if (isMullion(nx, nz)) continue;
    if (y < 10 && y >= G(nx, nz) + 5) { /* podium windows also lit */ }
    if ((nx * 7 + nz * 13 + Math.floor(y / 5) * 3) % 11 === 0) return true;
  }
  return false;
}

function cellBlock(x, z, y) {
  const gr = G(x, z), t = topOf(x, z);
  if (y < gr) return ["stone"];                             // foundation
  if (y >= t) return null;
  if (isShell(x, z, y)) return facade(x, z, y, gr, t);
  if (y === t - 1) return ["smooth_stone"];                 // roof / terrace surface
  if (y === gr || (y > gr && y % 5 === 0)) return ["light_gray_concrete"]; // floor slab
  if (litBehind(x, z, y)) return ["glowstone"];
  return null;                                              // air gap
}

const vox = new Voxels([W, H, D]);

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const t = topOf(x, z);
  const k = inset(x, z);

  for (let y = 0; y < H; y++) {
    // Mast on the penthouse centre with a red aviation light
    if (x === cx && z === cz) {
      if (y >= 76 && y <= 83) {
        vox.set(x, y, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
        continue;
      }
      if (y === 84) {
        vox.set(x, y, z, "redstone_lamp", { lit: "true" });
        continue;
      }
    }
    // Rooftop air-conditioning plant on the outer terrace
    if (t === 60 && (k === 1 || k === 2) && y >= 60 && y <= 61 && (x * 3 + z * 5) % 9 === 0) {
      vox.set(x, y, z, "light_gray_concrete");
      continue;
    }
    const b = cellBlock(x, z, y);
    if (!b) continue;
    if (b[1]) vox.set(x, y, z, b[0], b[1]);
    else vox.set(x, y, z, b[0]);
  }
}

// Standing lantern in the lobby behind the entrance
{
  const lx = cx, lz = maxZ - 1;
  const gr = G(lx, lz);
  if (inFp(lx, lz)) {
    vox.set(lx, gr + 1, lz, "lantern", { hanging: "false" });
  }
}

vox.save(`${DIR}/${ID}.nbt`);
