import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE95-0010-13F";
const W = 26, H = 76, D = 30;

// 2006 Xinyi office/residential tower: 8-storey glass-and-granite podium,
// 5-storey setback crown to a roof at y=64 (lidar), mechanical penthouse, spire.
const PODIUM_TOP = 40;   // podium roof slab (8 storeys of 5 blocks)
const ROOF = 64;         // crown roof slab (13 storeys in total)
const STOREY = 5;
const SETBACK = 3;       // crown inset from the footprint edge
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const FACE = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.round(gr));
}

const inF = (x, z) => ground.has(`${x},${z}`);
const eroded = (pred, n) => (x, z) => {
  if (!pred(x, z)) return false;
  for (let dx = -n; dx <= n; dx++)
    for (let dz = -n; dz <= n; dz++)
      if (!pred(x + dx, z + dz)) return false;
  return true;
};
const inE = eroded(inF, SETBACK);   // crown footprint
const inE2 = eroded(inE, 2);        // penthouse footprint

const blocks = new Map();
const glassAt = [];
const put = (x, y, z, id, props) => blocks.set(`${x},${y},${z}`, { id, props });

// Facade block for a perimeter wall cell; `out` is the outward normal.
function facade(x, y, z, out, tier, g) {
  const [, oz] = out;
  const pos = oz !== 0 ? x : z;           // coordinate running along the face
  if (tier === "podium" && y < g + 5) {
    if (y === g) return "stone_bricks";     // base course
    if (y === g + 4) return "smooth_quartz"; // shopfront cornice
    return pos % 3 === 0 ? "white_concrete" : "glass";
  }
  const r = y % STOREY;
  if (r === 0) return "white_concrete";     // storey line / spandrel
  if (r === 4) return "light_gray_concrete"; // sill band
  if (pos % 3 === 0) return "white_concrete"; // mullion
  return tier === "podium" ? "light_blue_stained_glass" : "cyan_stained_glass";
}

function placeWall(x, y, z, outs, tier, g) {
  const id = facade(x, y, z, outs[0], tier, g);
  put(x, y, z, id);
  if (id.includes("glass")) glassAt.push({ x, y, z, ox: outs[0][0], oz: outs[0][1] });
}

// Podium: cells outside the crown footprint.
function podiumCell(x, z, g) {
  const outs = DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
  const perim = outs.length > 0;
  for (let y = g; y <= PODIUM_TOP; y++) {
    if (y === PODIUM_TOP) { put(x, y, z, "smooth_quartz"); continue; }
    if (perim) placeWall(x, y, z, outs, "podium", g);
    else if (y === g || y % STOREY === 0) put(x, y, z, "smooth_stone");
  }
  if (perim && g <= PODIUM_TOP + 1) put(x, PODIUM_TOP + 1, z, "white_concrete"); // parapet
}

// Crown: cells inside the setback footprint (also stand on the podium).
function crownCell(x, z, g) {
  const outs = DIRS.filter(([dx, dz]) => !inE(x + dx, z + dz));
  const perim = outs.length > 0;
  for (let y = g; y <= ROOF; y++) {
    if (y < PODIUM_TOP) {                    // podium interior floors (air gap)
      if (y === g || y % STOREY === 0) put(x, y, z, "smooth_stone");
      continue;
    }
    if (y === PODIUM_TOP) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === ROOF) { put(x, y, z, "smooth_stone"); continue; }
    if (perim) placeWall(x, y, z, outs, "crown", g);
    else if (y % STOREY === 0) put(x, y, z, "smooth_stone");
  }
  if (perim) {
    if (outs.length >= 2) put(x, ROOF + 1, z, "sea_lantern"); // corner lights
    else put(x, ROOF + 1, z, "white_concrete");              // parapet
  }
}

for (const [k, g] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");  // foundation
  if (inE(x, z)) crownCell(x, z, g);
  else podiumCell(x, z, g);
}

// Mechanical penthouse on the crown roof.
const pent = [];
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!inE2(x, z)) continue;
  pent.push([x, z]);
  const outs = DIRS.filter(([dx, dz]) => !inE2(x + dx, z + dz));
  for (let y = ROOF + 1; y <= ROOF + 5; y++) {
    if (outs.length) {
      const pos = outs[0][1] !== 0 ? x : z;
      const louver = y >= 66 && y <= 68 && pos % 2 === 0;
      put(x, y, z, louver ? "iron_bars" : "light_gray_concrete");
    }
  }
  put(x, ROOF + 6, z, "smooth_stone"); // penthouse roof at y=70
}

// Spire: lightning rod on the penthouse cell nearest the footprint centroid.
if (pent.length) {
  const cx = (W - 1) / 2, cz = (D - 1) / 2;
  const [sx, sz] = pent.reduce((best, c) =>
    Math.hypot(c[0] - cx, c[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz) ? c : best);
  for (let y = 71; y <= 74; y++)
    put(sx, y, sz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// Entrance on the north face (else south, west, east), canopy and doors.
const lowerPerim = [];
for (const [k, g] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (inE(x, z)) continue;
  const outs = DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));
  if (outs.length) lowerPerim.push({ x, z, g, outs });
}
let entry = null, entryDir = null;
for (const d of DIRS) {
  const cands = lowerPerim.filter(c => c.outs[0][0] === d[0] && c.outs[0][1] === d[1]);
  if (!cands.length) continue;
  const along = c => (d[1] !== 0 ? c.x : c.z);
  const centre = d[1] !== 0 ? (W - 1) / 2 : (D - 1) / 2;
  entry = cands.reduce((a, b) => Math.abs(along(b) - centre) < Math.abs(along(a) - centre) ? b : a);
  entryDir = d;
  break;
}
if (entry) {
  const along = c => (entryDir[1] !== 0 ? c.x : c.z);
  for (const c of lowerPerim) {
    if (c.g === entry.g && c.outs[0][0] === entryDir[0] && c.outs[0][1] === entryDir[1]
        && Math.abs(along(c) - along(entry)) <= 1) {
      put(c.x, c.g + 3, c.z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); // canopy
    }
  }
  const facing = FACE[`${entryDir[0]},${entryDir[1]}`];
  const base = { facing, hinge: "left", open: "false", powered: "false" };
  put(entry.x, entry.g, entry.z, "dark_oak_door", { ...base, half: "lower" });
  put(entry.x, entry.g + 1, entry.z, "dark_oak_door", { ...base, half: "upper" });
}

// Warm lights behind some windows (air gap just inside the glass).
for (const { x, y, z, ox, oz } of glassAt) {
  if ((x * 5 + z * 7 + y) % 9 !== 0) continue;
  const ix = x - ox, iz = z - oz;
  if (!inF(ix, iz) || blocks.has(`${ix},${y},${iz}`)) continue;
  put(ix, y, iz, "glowstone");
}

// Write the structure.
const out = new Voxels([W, H, D]);
for (const [k, { id, props }] of blocks) {
  const [x, y, z] = k.split(",").map(Number);
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) continue;
  if (props) out.set(x, y, z, id, props);
  else out.set(x, y, z, id);
}
out.save(`${DIR}/${ID}.nbt`);
