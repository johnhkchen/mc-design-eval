// 詮州商業大樓 (Xuanzhou Commercial Building), Xinyi, Taipei.
// Reading of the lidar record: roof about 59 blocks (≈42 m) above lowest ground, so roughly
// 11 storeys of 5 blocks plus a parapet. Taipei commercial blocks of the 1980s to early 1990s
// typically have a two-storey commercial base with a shopfront and signboard, a plain
// white-tiled tower with aluminium-framed windows, a stepped setback, a parapet, and rooftop
// plant boxes. Materials: white concrete as tile-clad wall, light-grey mullions, quartz storey
// bands, blue-tinted glass panes, red signboards with gold accents, and a rooftop mechanical box.

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw309237296.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw309237296.nbt";

const W = 26, H = 71, D = 56;
const TOP = 59;          // parapet cap top, blocks above lowest ground
const SETBACK = 40;      // absolute y where the upper tier steps back
const SETBACK_X = 4;     // upper tier keeps x >= 4; west strip becomes a terrace

const g = new Voxels([W, H, D]);

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, y] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(30, y)));
}

const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const inT2 = (x, z) => has(x, z) && x >= SETBACK_X;

// Which sides of a cell face outside the given set.
function faces(x, z, inSet) {
  return {
    E: !inSet(x + 1, z),
    W: !inSet(x - 1, z),
    S: !inSet(x, z + 1),
    N: !inSet(x, z - 1),
  };
}
const isEdge = f => f.E || f.W || f.S || f.N;

function shopfront(x, z, r, f) {
  // Street (north) face: recessed-looking entrance bay, door at x=13 with stone surround.
  if (f.N && (x === 12 || x === 14) && r <= 2) return ["stone_bricks"];
  if (f.N && x === 13 && r <= 2) {
    return ["dark_oak_door", {
      facing: "south",
      half: r === 1 ? "lower" : "upper",
      hinge: "left",
      open: "false",
      powered: "false",
    }];
  }
  // Stone base course above the glass.
  if (r === 3) return ["stone_bricks"];
  const idx = (f.N || f.S) ? x : z;
  if (idx % 4 === 0) return ["white_concrete"];
  return ["glass"];
}

function windowBlock(x, z, f) {
  const alongX = f.N || f.S;   // wall runs east-west
  const alongZ = f.E || f.W;   // wall runs north-south
  const idx = alongX ? x : z;
  if ((alongX && alongZ) || idx % 3 === 0) return ["light_gray_concrete"]; // corners and mullions
  return ["light_blue_stained_glass_pane", {
    north: String(alongZ),
    south: String(alongZ),
    east: String(alongX),
    west: String(alongX),
    waterlogged: "false",
  }];
}

// Returns [id] or [id, props] for the block at (x, y, z), or null for air.
function blockAt(x, z, y) {
  const gr = gnd(x, z);
  const t2 = x >= SETBACK_X;

  // Foundation under the cell, then the ground-floor slab at its own ground level.
  if (y < gr) return ["stone_bricks"];
  if (y === gr) return ["smooth_stone"];

  // Setback slab at absolute SETBACK across the whole footprint.
  if (y === SETBACK) return ["smooth_quartz"];

  // West strip above the setback: a roof terrace with planters and a low edge.
  if (y > SETBACK && !t2) {
    if (y === SETBACK + 1) {
      const f = faces(x, z, has);
      return isEdge(f) ? ["white_concrete"] : ["moss_block"];
    }
    return null;
  }

  // Roof cap over the upper tier.
  if (y === TOP) return ["smooth_quartz"];

  // Upper-tier floor slabs at 45, 50, 55.
  if (y > SETBACK && (y - SETBACK) % 5 === 0) return ["smooth_quartz"];

  // Lower-tier floor slabs at each storey above the cell's ground.
  if (y < SETBACK && y > gr && (y - gr) % 5 === 0) return ["smooth_quartz"];

  // Facade: only edge cells of the current tier are walls.
  const lower = y < SETBACK;
  const f = lower ? faces(x, z, has) : faces(x, z, inT2);
  if (!isEdge(f)) return null;

  // Parapet.
  if (y >= 56 && y < TOP) return ["white_concrete"];

  const r = lower ? y - gr : y - SETBACK;

  // Commercial base: shopfront on the ground storey.
  if (lower && r <= 4) return shopfront(x, z, r, f);

  // Spandrel band under each storey line.
  if (r % 5 === 4) return ["white_concrete"];

  // Second commercial floor: red signboard on the street face.
  if (lower && f.N && r >= 6 && r <= 7 && x >= 3 && x <= 22) {
    return x % 5 === 0 ? ["gold_block"] : ["red_concrete"];
  }

  // Window band.
  return windowBlock(x, z, f);
}

// Main shell pass.
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y <= TOP; y++) {
    const b = blockAt(x, z, y);
    if (!b) continue;
    if (b[1]) g.set(x, y, z, b[0], b[1]);
    else g.set(x, y, z, b[0]);
  }
}

// Warm lights placed one block inside the glass on single-face wall cells.
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  const f = faces(x, z, has);
  const missing = [f.E, f.W, f.S, f.N].filter(Boolean).length;
  if (missing !== 1) continue;
  const dx = f.E ? -1 : f.W ? 1 : 0;
  const dz = f.S ? -1 : f.N ? 1 : 0;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz)) continue;
  const alongX = f.N || f.S;
  const idx = alongX ? x : z;
  const gr = gnd(x, z);

  // Shopfront glowstone behind the glass.
  if (idx % 6 === 3) {
    const y = gr + 2;
    if (y < SETBACK && y <= TOP) g.set(ix, y, iz, "glowstone");
  }

  // Warm light inside the entrance, behind the door.
  if (f.N && x === 13 && gr + 2 < SETBACK) {
    g.set(ix, gr + 2, iz, "glowstone");
  }

  // Upper-storey shroomlights in the middle of some window bays.
  for (let y = gr + 6; y <= TOP; y++) {
    const lower = y < SETBACK;
    const r = lower ? y - gr : y - SETBACK;
    if (r % 5 !== 2) continue;
    if (idx % 9 !== 4) continue;
    if (lower && y >= SETBACK) continue;
    g.set(ix, y, iz, "shroomlight");
  }
}

// Rooftop mechanical penthouse on the upper tier.
for (let x = 9; x <= 18; x++) {
  for (let z = 18; z <= 36; z++) {
    if (!inT2(x, z)) continue;
    const edge = x === 9 || x === 18 || z === 18 || z === 36;
    for (let y = 60; y <= 62; y++) {
      g.set(x, y, z, edge ? "white_concrete" : "light_gray_concrete");
    }
    g.set(x, 63, z, "light_gray_concrete");
  }
}

// Lightning-rod mast on the penthouse roof.
if (has(13, 27)) {
  g.set(13, 64, 27, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  g.set(13, 65, 27, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(OUT);
