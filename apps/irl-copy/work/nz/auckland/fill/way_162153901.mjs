// Way 162153901, Auckland: a 1980s concrete-frame office block with tinted glazing on a stepped plinth.
// Footprint from the cells file (x 0..47, z 0..36). Each cell's roof is the lidar height above y 0, median-smoothed and
// quantized to a 4-block storey grid, so every tier stands on the solid deck below it. Each cell is solid from y 0 to its
// ground (foundation), then an envelope of exterior walls with floor slabs every 4 blocks, roof decks, parapets, and air
// behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162153901.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..47, z 0..36

const W = 48, D = 37, H = 51;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// --- per-cell tables -----------------------------------------------------------------------------------------------
const G = Array.from({ length: W }, () => new Array(D).fill(null));    // ground (foundation top)
const RAW = Array.from({ length: W }, () => new Array(D).fill(null));  // lidar roof height above y 0
for (const [x, z, g, r] of cells) { G[x][z] = g; RAW[x][z] = r; }

const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] !== null;

// lidar noise: median of the 3x3 footprint neighbourhood, then clean tiers on the 4-block storey grid
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
function tierOf(r) {
  if (r <= 12) return 12;   // lower wing and core
  if (r <= 15) return 16;   // 4-storey wing
  if (r <= 19) return 20;
  if (r <= 23) return 24;
  if (r <= 27) return 28;
  if (r <= 34) return 32;   // shoulder around the tower
  return 36;                // tower, parapet to 38 (lidar 38)
}
const R = Array.from({ length: W }, () => new Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inF(x, z)) continue;
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) vals.push(RAW[x + dx][z + dz]);
  R[x][z] = tierOf(median(vals));
}

// a cell is solid at y when it is footprint and y is under its roof tier
const solidAt = (x, z, y) => inF(x, z) && y < R[x][z];
// the horizontal faces of a cell at height y that look onto air
const exposedDirs = (x, z, y) => DIRS.filter(([dx, dz]) => !solidAt(x + dx, z + dz, y));
const groundLo = (x, z) => (G[x][z] >= 4 ? 4 : 0);   // the ground storey's first block row

// --- volume --------------------------------------------------------------------------------------------------------
const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const DOOR_FRONT = { facing: "south", open: "false", powered: "false" };

// Materials
const PLINTH = "stone_bricks", BASE = "polished_andesite", SHOP_GLASS = "glass", FASCIA = "smooth_quartz";
const STOREY = "smooth_quartz", PIER = "white_concrete", SPANDREL = "light_gray_concrete", DECK = "light_gray_concrete";
const INNER_SLAB = "white_concrete";

// Pass 1: envelope, slabs, decks, foundations
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inF(x, z)) continue;
  const top = R[x][z], gr = G[x][z], lo = groundLo(x, z);
  for (let y = 0; y < top; y++) {
    if (y < gr) { put(x, y, z, PLINTH); continue; }                // foundation: nothing floats on a slope
    const ex = exposedDirs(x, z, y);
    const ground = y >= lo && y < lo + 4;
    const k = y % 4;
    if (y === top - 1) { put(x, y, z, DECK); continue; }           // roof deck
    if (k === 0) {                                                  // floor slab on every storey
      if (!ex.length) put(x, y, z, INNER_SLAB);
      else put(x, y, z, ground ? BASE : STOREY);
      continue;
    }
    if (!ex.length) continue;                                       // interior air, behind the glass
    const corner = ex.length >= 2;
    const alongZ = ex.some(([dx]) => dx !== 0);                      // an x-facing wall runs along z
    const bay = alongZ ? z : x;
    const pier = corner || bay % 3 === 0;
    if (ground) {
      if (k === 3) put(x, y, z, FASCIA);
      else put(x, y, z, pier ? BASE : SHOP_GLASS);
    } else {
      if (k === 3) put(x, y, z, SPANDREL);
      else if (pier) put(x, y, z, PIER);
      else {
        const h = (x * 73856093) ^ (z * 19349663) ^ (y * 83492791);
        put(x, y, z, (h >>> 0) % 7 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");
      }
    }
  }
}

// Pass 2: parapets on exposed roof edges, and lights behind some panes
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inF(x, z)) continue;
  const top = R[x][z];
  // parapet on roof edges that look onto air at the tier's top
  if (exposedDirs(x, z, top).length) {
    put(x, top, z, PIER);
    put(x, top + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
  // warm lanterns standing on the floor slab, one bay in six or so, set just inside the glass
  for (let y = 1; y < top - 1; y++) {
    if (y % 4 !== 1 || y < groundLo(x, z)) continue;
    if (exposedDirs(x, z, y).length) continue;
    const behind = DIRS.some(([dx, dz]) => exposedDirs(x + dx, z + dz, y).length > 0 && solidAt(x + dx, z + dz, y));
    if (!behind) continue;
    if ((x * 31 + z * 17 + y * 7) % 6 === 0) put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 3: the entrance, centred on the south face (x 24-25), a double glass-and-oak door under a lintel
for (const x of [24, 25]) {
  const z = 36;
  if (!inF(x, z)) continue;
  const hinge = x === 24 ? "left" : "right";
  put(x, 4, z, "oak_door", { ...DOOR_FRONT, half: "lower", hinge });
  put(x, 5, z, "oak_door", { ...DOOR_FRONT, half: "upper", hinge });
  put(x, 6, z, STOREY);   // lintel over the door
}

// Pass 4: roof equipment. Air-conditioning plant on the terraces, a plant room on the tower
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inF(x, z)) continue;
  const top = R[x][z];
  if (top === 36 || exposedDirs(x, z, top).length) continue;
  const ring = DIRS.concat([[1, 1], [-1, -1], [1, -1], [-1, 1]]);
  if (!ring.every(([dx, dz]) => inF(x + dx, z + dz) && R[x + dx][z + dz] >= top)) continue;
  if ((x * 5 + z * 11) % 13 === 0) put(x, top, z, "iron_block");
}

// the plant room: the tower's top, 5 x 3 cells with a one-cell margin, walls to y 37, a solid cap
{
  const T = (x, z) => inF(x, z) && R[x][z] === 36;
  let best = null;
  for (let x0 = 0; x0 < W; x0++) for (let z0 = 0; z0 < D; z0++) {
    let ok = true;
    for (let x = x0 - 1; x <= x0 + 5 && ok; x++) for (let z = z0 - 1; z <= z0 + 3 && ok; z++) if (!T(x, z)) ok = false;
    if (!ok) continue;
    const d = Math.abs(x0 + 2.5 - 24) + Math.abs(z0 + 1 - 5);   // nearest the tower's middle
    if (!best || d < best.d) best = { x0, z0, d };
  }
  if (best) {
    const { x0, z0 } = best;
    for (let x = x0; x <= x0 + 4; x++) for (let z = z0; z <= z0 + 2; z++) {
      const edge = x === x0 || x === x0 + 4 || z === z0 || z === z0 + 2;
      if (edge) { put(x, 36, z, PIER); put(x, 37, z, DECK); }
      else put(x, 37, z, FASCIA);
    }
  }
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162153901.nbt");
console.log(`way_162153901: ${info.blocks} blocks, ${info.palette} palette entries`);
