// Wesley, John, A.M.E. Zion Church (1615 14th St NW): a late-19th-century red brick church with a stone-trimmed
// gable front, a side aisle, and a square tower over the south-west bay, on a stone base. Massing follows the lidar
// roof heights, smoothed into clean tiers: the nave is a north-south gable (ridge at x 3-4, eave 4, ridge 7), the aisle
// a lower gable (ridge at x 10, eave 4, ridge 6), and the tower a podium at 10 with a core at 12.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC55999.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC55999.nbt";

const X = 13, Y = 24, Z = 16;
const key = (x, y, z) => `${x},${y},${z}`;
const cellKey = (x, z) => `${x},${z}`;
const footprint = new Map(cells.map(([x, z, g]) => [cellKey(x, z), g]));  // cell -> ground level
const inFP = (x, z) => footprint.has(cellKey(x, z));
const groundAt = (x, z) => footprint.get(cellKey(x, z));

// Smoothed roof surfaces (height above y 0), from the lidar record
const NAVE = [4, 5, 6, 7, 7, 6, 5, 4];          // x 0..7: nave gable, ridge along z
const AISLE = [4, 5, 6, 5, 4];                  // x 8..12: side aisle gable, ridge along z
const inTower = (x, z) => x >= 1 && x <= 6 && z >= 8 && z <= 13;
const inCore = (x, z) => x >= 2 && x <= 5 && z >= 9 && z <= 12;
const top = (x, z) => {
  if (inTower(x, z)) return inCore(x, z) ? 12 : 10;
  return x <= 7 ? NAVE[x] : AISLE[x - 8];
};
const pitched = (x, z) => inFP(x, z) && !inTower(x, z) && top(x, z) <= 7;
const solid = (x, y, z) => inFP(x, z) && y >= 0 && y < top(x, z);

const DIR = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };   // N is the z = 0 front
const exposedFaces = (x, y, z) => Object.keys(DIR).filter((f) => !solid(x + DIR[f][0], y, z + DIR[f][1]));
const isEW = (f) => f === "W" || f === "E";
const WINDOW_ROWS = new Set([2, 6, 10]);
const STRING_ROWS = new Set([3, 7]);

const paneState = (f) => (isEW(f)
  ? { east: "false", north: "true", south: "true", waterlogged: "false", west: "false" }
  : { east: "true", north: "false", south: "false", waterlogged: "false", west: "true" });

// Front (z = 0) features: a double door in the gable bay, lanterns either side, a rose window above
const special = new Map();
const air = new Set();                          // the porch and lantern pockets, kept open
for (const x of [3, 4]) for (const y of [1, 2]) {
  special.set(key(x, y, 0), { kind: "door", x, y });
  air.add(key(x, y, 1));
}
for (const x of [2, 5]) {
  special.set(key(x, 2, 0), { block: "lantern", state: { hanging: "true", waterlogged: "false" } });
  air.add(key(x, 2, 1));
}
for (const x of [3, 4]) {
  special.set(key(x, 4, 0), { block: "glass_pane", state: paneState("N") });
  air.add(key(x, 4, 1));
}

// A window is a glass pane on an exposed wall cell in a window row, every other cell along the face; its pocket
// (the cell behind it) is air, or glowstone on some windows
const windowFace = (x, y, z) => {
  if (!WINDOW_ROWS.has(y) || y >= top(x, z) - 1 || special.has(key(x, y, z))) return null;
  const fs = exposedFaces(x, y, z);
  if (!fs.length) return null;
  if (fs.some(isEW) && fs.some((f) => !isEW(f))) return null;   // corners stay quoins
  const f = fs[0];
  return (isEW(f) ? z : x) % 2 === 1 ? f : null;
};
const pocket = new Map();                       // key -> "air" | "glowstone"
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFP(x, z)) continue;
  for (let y = 0; y < top(x, z) - 1; y++) {
    const f = windowFace(x, y, z);
    if (!f) continue;
    const [dx, dz] = DIR[f];
    const px = x - dx, pz = z - dz;
    if (!inFP(px, pz) || !solid(px, y, pz)) continue;
    pocket.set(key(px, y, pz), (x + 3 * y + 5 * z) % 5 === 0 ? "glowstone" : "air");
  }
}

const roofBlock = (x, z) => {
  const t = top(x, z), y = t - 1;
  if (pitched(x, z)) {
    // one-block steps up the slope: a stair whose low side faces the lower neighbour, full blocks at the ridge
    const lowW = inFP(x - 1, z) && top(x - 1, z) < t;
    const lowE = inFP(x + 1, z) && top(x + 1, z) < t;
    if (lowW !== lowE) return { block: "deepslate_tile_stairs", state: { facing: lowW ? "west" : "east", half: "bottom", shape: "straight", waterlogged: "false" } };
  }
  const edge = Object.keys(DIR).some((f) => !solid(x + DIR[f][0], y, z + DIR[f][1]));
  return { block: edge ? "smooth_stone" : "deepslate_tiles" };
};

const V = new Voxels([X, Y, Z]);
const stats = { cells: 0, windows: 0, pockets: 0 };
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFP(x, z)) continue;
  const t = top(x, z), g = groundAt(x, z);
  for (let y = 0; y < t; y++) {
    const k = key(x, y, z);
    if (y === t - 1) { const b = roofBlock(x, z); V.set(x, y, z, b.block, b.state); stats.cells++; continue; }
    if (air.has(k)) continue;
    if (pocket.has(k)) {
      if (pocket.get(k) === "glowstone") { V.set(x, y, z, "glowstone"); stats.pockets++; }
      continue;
    }
    const sp = special.get(k);
    if (sp?.kind === "door") {
      const hinge = sp.x === 3 ? "left" : "right";
      const st = (half) => ({ facing: "north", half, hinge, open: "false", powered: "false" });
      V.set(x, y, z, "dark_oak_door", st(y === 1 ? "lower" : "upper"));
      continue;
    }
    if (sp) { V.set(x, y, z, sp.block, sp.state); continue; }
    if (y < g) { V.set(x, y, z, "stone"); continue; }                 // foundation
    if (y === g) { V.set(x, y, z, "stone_bricks"); continue; }        // base course
    const f = windowFace(x, y, z);
    if (f) { V.set(x, y, z, "glass_pane", paneState(f)); stats.windows++; continue; }
    const fs = exposedFaces(x, y, z);
    if (fs.length && fs.some(isEW) && fs.some((q) => !isEW(q))) { V.set(x, y, z, "stone_bricks"); continue; }   // quoins
    if (fs.length && STRING_ROWS.has(y)) { V.set(x, y, z, "smooth_stone"); continue; }
    V.set(x, y, z, "bricks");
  }
}

// Roof equipment: a brick flue on the aisle ridge, capped
V.set(10, 6, 4, "bricks"); V.set(10, 7, 4, "bricks");
V.set(10, 8, 4, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

const res = V.save(OUT);
console.log(JSON.stringify({ ...stats, ...res }));
