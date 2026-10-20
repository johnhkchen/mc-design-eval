import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE92-0236-18F-3";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 23 x 20; y 0 is the lowest ground. Roof top sits at y = 88.
const W = 23, H = 100, D = 20;
const ROOF = 88;          // first empty block above the roof
const PODIUM_TOP = 15;    // podium roof slab layer
const CORE_CX = 11, CORE_CZ = 9;

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, Math.round(gy));
const key = (x, z) => `${x},${z}`;
const inFp = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z)) ?? 0;

// true when every cell within radius r satisfies pred
function allIn(x, z, r, pred) {
  for (let dx = -r; dx <= r; dx++)
    for (let dz = -r; dz <= r; dz++)
      if (!pred(x + dx, z + dz)) return false;
  return true;
}

const inTower = (x, z) => inFp(x, z) && allIn(x, z, 2, inFp);
const facadePod = (x, z) => inFp(x, z) && !allIn(x, z, 1, inFp);
const facadeTower = (x, z) => inTower(x, z) && !allIn(x, z, 1, inTower);
const isCore = (x, z) => Math.abs(x - CORE_CX) <= 2 && Math.abs(z - CORE_CZ) <= 2;
const mech = (x, z) => inTower(x, z) && allIn(x, z, 3, inTower);
const mechRing = (x, z) => mech(x, z) && !allIn(x, z, 1, mech);

// corner test: exposed on one perpendicular pair of sides in both axes
const isCornerPod = (x, z) =>
  (!inFp(x - 1, z) || !inFp(x + 1, z)) && (!inFp(x, z - 1) || !inFp(x, z + 1));
const isCornerTower = (x, z) =>
  (!inTower(x - 1, z) || !inTower(x + 1, z)) && (!inTower(x, z - 1) || !inTower(x, z + 1));

// tower bounds for inward-facing light placement
let minTX = Infinity, maxTX = -Infinity, minTZ = Infinity, maxTZ = -Infinity;
for (const [x, z] of cells) {
  if (inTower(x, z)) {
    minTX = Math.min(minTX, x); maxTX = Math.max(maxTX, x);
    minTZ = Math.min(minTZ, z); maxTZ = Math.max(maxTZ, z);
  }
}

// inner neighbour of a facade cell, toward the building interior
function inward(x, z) {
  let ix = x, iz = z;
  if (x === minTX) ix = x + 1; else if (x === maxTX) ix = x - 1;
  else if (z === minTZ) iz = z + 1; else if (z === maxTZ) iz = z - 1;
  return [ix, iz];
}

const WIN_FRAME = "white_concrete";
const WIN_GLASS = "cyan_stained_glass";
const SPANDREL = "light_gray_concrete";
const PILASTER = "quartz_block";

// entrance bay: three cells wide on the north face (z = 0), door in the middle
const inEntranceBay = (x, z) => z === 0 && x >= 10 && x <= 12;

// returns {id, props?} or null for a block at (x,y,z)
function blockAt(x, y, z) {
  const gy = gAt(x, z);
  if (!inFp(x, z)) return null;
  const slab = y % 5 === 0;
  const frame = x % 3 === 0 || z % 3 === 0;

  // ---- podium (y < 15) ----
  if (y < PODIUM_TOP) {
    if (facadePod(x, z)) {
      if (inEntranceBay(x, z)) {
        if (x === 11) {
          if (y === gy) return { id: "dark_oak_door", props: { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" } };
          if (y === gy + 1) return { id: "dark_oak_door", props: { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" } };
        } else if (y === gy || y === gy + 1) {
          return { id: "glass" };
        }
        if (y === gy + 2) return { id: "stone_brick_slab", props: { type: "bottom", waterlogged: "false" } };
        if (y === gy + 3) return { id: "stone_bricks" };
      }
      if (y === gy) return { id: "stone_bricks" };                       // base course
      if (isCornerPod(x, z)) return { id: PILASTER };                    // full-height corner pilaster
      if (y < gy + 4) {                                                   // shopfront
        if (frame) return { id: "stone_bricks" };
        return { id: "glass" };
      }
      if (slab) return { id: WIN_FRAME };
      if (frame) return { id: WIN_FRAME };
      return { id: "light_blue_stained_glass" };
    }
    if (slab) return { id: SPANDREL };                                    // interior floor slab
    if (isCore(x, z)) return { id: SPANDREL };
    return null;
  }

  // ---- podium roof ring, outside tower (y >= 15) ----
  if (!inTower(x, z)) {
    if (y === PODIUM_TOP) return { id: SPANDREL };
    if (y === PODIUM_TOP + 1) {
      if (facadePod(x, z)) return { id: "stone_brick_wall" };
      return { id: "moss_carpet" };
    }
    return null;
  }

  // ---- tower (inset 2 cells) ----
  if (y === PODIUM_TOP) return { id: facadeTower(x, z) ? WIN_FRAME : SPANDREL };

  if (y >= ROOF - 2) {                       // roof level
    if (mech(x, z)) return mechRing(x, z) ? { id: "stone_brick_wall" } : { id: "glowstone" };
    if (facadeTower(x, z)) return { id: "stone_brick_wall" };
    return null;
  }

  if (facadeTower(x, z)) {
    if (isCornerTower(x, z)) return { id: PILASTER };                     // corner pilasters
    if (slab) return { id: WIN_FRAME };
    if (frame) return { id: WIN_FRAME };
    if (y % 5 === 4) return { id: SPANDREL };
    const band = y % 5;
    if (band >= 1 && band <= 3) return { id: WIN_GLASS };
    return { id: SPANDREL };
  }

  if (slab) return { id: SPANDREL };
  if (isCore(x, z)) return { id: SPANDREL };
  return null;
}

// interior lights, placed in the air gap just behind selected tower windows
function lightAt(x, y, z) {
  if (!facadeTower(x, z)) return null;
  if (isCornerTower(x, z)) return null;
  const band = y % 5;
  if (band < 1 || band > 3) return null;
  if (x % 3 === 0 || z % 3 === 0) return null;
  if (((x * 7 + y * 3 + z * 5) % 23) !== 0) return null;
  const [ix, iz] = inward(x, z);
  if (!inTower(ix, iz) || facadeTower(ix, iz)) return null;
  return { x: ix, z: iz, y };
}

const g = new Voxels([W, H, D]);

function put(x, y, z, b) {
  if (!b) return;
  if (b.props) g.set(x, y, z, b.id, b.props);
  else g.set(x, y, z, b.id);
}

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!inFp(x, z)) continue;
    const gy = gAt(x, z);
    // foundation from y 0 up to the cell's ground
    for (let y = 0; y < gy && y < H; y++) g.set(x, y, z, "stone");
    for (let y = gy; y < ROOF && y < H; y++) put(x, y, z, blockAt(x, y, z));
  }
}

// second pass: warm lights in the air gap behind tower windows
for (const [x, z] of cells) {
  if (!inTower(x, z)) continue;
  for (let y = PODIUM_TOP + 1; y < ROOF - 2; y++) {
    const p = lightAt(x, y, z);
    if (p) g.set(p.x, p.y, p.z, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
