import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE101-0001-27F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 67, D = 31, H = 143;
const g = new Voxels([W, H, D]);

// Massing: podium (full footprint) to y20, shaft set back 2 blocks to y90,
// upper tier set back to y131 (roof), penthouse 131..136, rod to 140.
const PODIUM = 20;
const SETBACK = 90;
const TOP = 131;
const PENT_TOP = 136;
const ROD_Y = 137;

const foot = new Map();
for (const [x, z, gr] of cells) foot.set(`${x},${z}`, gr);
const has = (x, z) => foot.has(`${x},${z}`);

function inTier(x, z, y) {
  if (!has(x, z)) return false;
  if (y < PODIUM) return true;
  if (y < SETBACK) return x >= 2 && x <= 64 && z >= 2 && z <= 28;
  if (y < TOP) return x >= 6 && x <= 60 && z >= 6 && z <= 24;
  return false;
}

// Deterministic pseudo-random for sparse warm lights.
function hash(a, b, c) {
  const h = Math.imul(a, 73856093) ^ Math.imul(b, 19349663) ^ Math.imul(c, 83492791);
  return (h >>> 0) % 97;
}

// Exterior faces of an edge cell at height y. u = coordinate running along the wall.
function edgeInfo(x, z, y) {
  const f = [];
  if (!inTier(x - 1, z, y)) f.push({ ix: 1, iz: 0, u: z });
  if (!inTier(x + 1, z, y)) f.push({ ix: -1, iz: 0, u: z });
  if (!inTier(x, z - 1, y)) f.push({ ix: 0, iz: 1, u: x });
  if (!inTier(x, z + 1, y)) f.push({ ix: 0, iz: -1, u: x });
  return f;
}

// Podium shopfront, relative to this cell's ground gr.
function shopfront(x, z, y, gr, f) {
  const r = y - gr;
  if (r === 0) return f.length ? ["polished_granite"] : ["light_gray_concrete"];
  if (r === 4) return ["light_gray_concrete"];
  if (z === D - 1) {
    // Main entrance on the south face: door centred at x 32, lit flanks at x 31 and 33.
    if (x === 32 && (r === 1 || r === 2)) {
      return [
        "dark_oak_door",
        {
          facing: "south",
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        },
      ];
    }
    if ((x === 31 || x === 33) && r === 1) return ["glowstone"];
  }
  if (f.length > 1 || f[0].u % 3 === 0) return ["white_concrete"];
  if (r === 2 && hash(x, y, z) % 9 === 0) {
    const face = f[0];
    g.set(x + face.ix, y, z + face.iz, "glowstone");
  }
  return ["light_blue_stained_glass"];
}

function tierBlock(x, z, y, gr) {
  const rel = y % 5;
  const f = edgeInfo(x, z, y);

  if (!f.length) {
    // Interior: floor slabs per storey and under each setback, air gap otherwise.
    if (y === PODIUM - 1 || y === SETBACK - 1) return ["light_gray_concrete"];
    if (rel === 0 || y === gr) return ["light_gray_concrete"];
    if (rel === 2 && hash(x, y, z) % 19 === 0) return ["glowstone"];
    return null;
  }

  if (y < PODIUM && y < gr + 5) return shopfront(x, z, y, gr, f);

  if (rel === 0) return ["white_concrete"];        // storey line
  if (rel === 4) return ["light_gray_concrete"];   // head band / cornice course

  const face = f[0];
  if (f.length > 1 || face.u % 4 === 0) return ["white_concrete"]; // piers and corners

  // Window: glass in rel 1..3, with occasional warm light placed behind it.
  if (rel === 2 && hash(face.u, y, z + x) % 9 === 0) {
    g.set(x + face.ix, y, z + face.iz, "glowstone");
  }
  return ["light_blue_stained_glass"];
}

function penthouse(x, z, y) {
  if (x < 16 || x > 50 || z < 11 || z > 19) return null;
  if (y === TOP) return ["light_gray_concrete"];
  if (y === PENT_TOP) return ["smooth_quartz"];
  if (y > TOP && y < PENT_TOP) {
    const onEdge = x === 16 || x === 50 || z === 11 || z === 19;
    if (!onEdge) return null;
    const u = x === 16 || x === 50 ? z : x;
    return u % 4 === 0 ? ["white_concrete"] : ["light_blue_stained_glass"];
  }
  return null;
}

function blockAt(x, z, y, gr) {
  if (y === SETBACK && !inTier(x, z, y)) return ["light_gray_concrete"]; // tower setback terrace
  if (y === PODIUM && !inTier(x, z, y)) return ["light_gray_concrete"];  // podium ledge
  if (y >= TOP && y <= PENT_TOP) return penthouse(x, z, y);
  if (y >= gr && inTier(x, z, y)) return tierBlock(x, z, y, gr);
  return null;
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROD_Y; y++) {
    const b = blockAt(x, z, y, gr);
    if (!b) continue;
    if (b[1]) g.set(x, y, z, b[0], b[1]);
    else g.set(x, y, z, b[0]);
  }
}

// Lightning rod on the penthouse roof.
if (has(33, 15)) {
  g.set(33, ROD_Y, 15, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
