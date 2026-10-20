import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE95-0532-9F";
const W = 138, H = 57, D = 93;
const TOP = 45;          // roof level above lowest ground (lidar)
const STOREY = 5;        // blocks per storey

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const xsAll = cells.map((c) => c[0]);
const zsAll = cells.map((c) => c[1]);
const minZ = Math.min(...zsAll);

// Entrance: centre of the north (min-z) edge
const northXs = cells.filter((c) => c[1] === minZ).map((c) => c[0]).sort((a, b) => a - b);
const entX = northXs[Math.floor(northXs.length / 2)];

// Cell is on the outer ring if any 4-neighbour is outside the footprint
function edgeInfo(x, z) {
  const xMissing = !has(x - 1, z) || !has(x + 1, z);
  const zMissing = !has(x, z - 1) || !has(x, z + 1);
  return { xMissing, zMissing, edge: xMissing || zMissing };
}

// Facade row material for a perimeter column at height y
function facadeBlock(x, z, y, gr, corner) {
  if (y === gr) return "stone_bricks";                      // base course
  if (y % STOREY === 0) return "light_gray_concrete";       // storey line / spandrel
  if (corner) return "white_concrete";                      // articulated corner column

  const r = y % STOREY;
  const isGroundStorey = y < STOREY;

  if (isGroundStorey) {
    if (y === STOREY - 1) return "white_concrete";          // shopfront lintel
    return "cyan_stained_glass";                            // shopfront glazing
  }
  if (r === 1 || r === 4) return "white_concrete";          // sill and header
  return null; // window rows r=2,3 handled by caller
}

// Index along the face (for mullion rhythm)
function faceIndex(x, z, info) {
  return info.xMissing ? z : x;
}

// 1. Foundations, floor slabs and roof on every footprint cell
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");
  for (let y = STOREY; y < TOP; y += STOREY) {
    if (y >= gr) g.set(x, y, z, "light_gray_concrete");
  }
  if (TOP >= gr) g.set(x, TOP, z, "light_gray_concrete");    // roof deck
}

// 2. Facade, parapet and lit windows on perimeter cells
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const info = edgeInfo(x, z);
  if (!info.edge) continue;
  const corner = info.xMissing && info.zMissing;
  const idx = faceIndex(x, z, info);

  for (let y = gr; y < TOP; y++) {
    const fixed = facadeBlock(x, z, y, gr, corner);
    if (fixed) {
      g.set(x, y, z, fixed);
      continue;
    }
    // window rows (r = 2, 3) above the ground storey
    const r = y % STOREY;
    if (idx % 3 === 0) {
      g.set(x, y, z, "white_concrete");                     // mullion
    } else {
      // roughly one window in eleven shows warm light
      const lit = ((idx * 7 + y * 3 + x + z) % 11) === 0;
      g.set(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
    }
  }

  // Parapet with a cornice course
  g.set(x, TOP, z, "light_gray_concrete");
  g.set(x, TOP + 1, z, "white_concrete");
}

// 3. Ground-floor entrance on the north face: opening, door, canopy, lit lobby
for (const [x, z, gr0] of cells) {
  if (z !== minZ || Math.abs(x - entX) > 2) continue;
  const gr = Math.round(gr0);
  for (let y = gr + 1; y <= gr + 2; y++) g.set(x, y, z, "glass");
  // canopy over the entrance, sitting on the building's own cells just inside
  for (const dz of [1, 2]) {
    if (has(x, z + dz)) g.set(x, gr + 3, z + dz, "gray_concrete");
  }
  if (has(x, z + 2)) g.set(x, gr + 1, z + 2, "glowstone");  // lobby light
}
{
  const gr = Math.round(gnd(entX, minZ) ?? 0);
  if (has(entX, minZ)) {
    g.set(entX, gr + 1, minZ, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }
      ? "dark_oak_door" : "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(entX, gr + 2, minZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// 4. Rooftop plant: a central penthouse with louvred walls, and a lightning rod
const pxMin = 45, pxMax = 92, pzMin = 30, pzMax = 62;
for (const [x, z, gr0] of cells) {
  if (x < pxMin || x > pxMax || z < pzMin || z > pzMax) continue;
  const inner = x > pxMin && x < pxMax && z > pzMin && z < pzMax;
  for (let y = TOP + 1; y <= TOP + 4; y++) {
    if (inner) g.set(x, y, z, "gray_concrete");
    else g.set(x, y, z, (x + z + y) % 2 ? "iron_bars" : "gray_concrete");
  }
  g.set(x, TOP + 5, z, "light_gray_concrete");
}

// Antenna on the penthouse centre
const cx = Math.round((pxMin + pxMax) / 2), cz = Math.round((pzMin + pzMax) / 2);
if (has(cx, cz)) {
  for (let y = TOP + 6; y <= TOP + 11; y++) {
    g.set(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
