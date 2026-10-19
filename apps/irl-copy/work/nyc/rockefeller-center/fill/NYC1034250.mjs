// 7 West 45th Street, 1913 commercial and office building: a 17-storey Renaissance-Revival office block of red brick and
// white terracotta on a polished-granite base. Footprint 12 x 24 (x across the front, low z = north = the 45th Street
// frontage). Lidar roof is read as three flat tiers, not cell by cell: the street front at 56 blocks, the middle at 58,
// the rear at 61 (the rear's north face shows as a clad step above the middle roof). Each storey is 3 blocks: a white
// terracotta spandrel and two rows of glass panes between brick-and-terracotta piers, with a cornice and capping slab.
// Ground floor: granite plinth, a shopfront of glass and dark-oak mullions, a dark-oak entrance door under a dark awning
// band, and a rear service door. Glass sits in the outer skin with one block of air behind it; the core is solid, so
// nothing is hollow and every block stands on the one below. Warm glowstone and lanterns sit behind some panes.
// Roof: a water tower on the rear tier and a brick penthouse beside it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034250.cells.json`, "utf8"));
const X = 12, Z = 24, Y = 72;

const has = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFoot = (x, z) => has.has(`${x},${z}`);

// Three flat roof tiers, in blocks above y 0 (the lidar's 55-61 with its noise smoothed out).
const topOf = (x, z) => (z <= 4 ? 56 : z <= 15 ? 58 : 61);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// A face is exposed at height y when the cell beside it is outside the footprint or has a lower roof there.
const exposures = (x, z, y) => {
  if (y >= topOf(x, z)) return [];
  const out = [];
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const nx = x + dx, nz = z + dz;
    const nTop = inFoot(nx, nz) ? topOf(nx, nz) : 0;
    if (y >= nTop) out.push(d);
  }
  return out;
};

// Storeys: 3 blocks each, the first starting at y 5 above the granite-and-terracotta ground floor (y 0-4).
const kmax = (T) => Math.floor((T - 11) / 3);                      // last storey's index for a roof of T blocks
const storeyRow = (T, y) => {
  if (y < 5 || y > 5 + 3 * kmax(T) + 2) return null;               // attic or cornice above the storeys
  return { k: Math.floor((y - 5) / 3), rel: (y - 5) % 3 };         // rel 0 = spandrel, 1-2 = glass rows
};
const PIERS = [0, 3, 6, 9, 11];
const WIN = [1, 2, 4, 5, 7, 8, 10];
const isWin = (x) => WIN.includes(x);
const lit = (x, k) => (x * 5 + k * 3) % 7 === 2;                   // about one window in seven, deterministic

const PANE = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const SLAB_TOP = { type: "top", waterlogged: "false" };
const DOOR = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
const IRON_DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

// Outer skin for the street (north, z 0) and rear (south, z 23) faces: base, shopfront, storeys, cornice.
const faceBlock = (x, y, z, rear) => {
  const T = topOf(x, z);
  if (y === T - 1) return ["stone_brick_slab", SLAB_TOP];
  if (y >= T - 3 && y <= T - 2) return ["white_terracotta"];
  if (y === 0) return ["polished_granite"];
  if (y <= 3) {
    if (x === 0 || x === 11) return ["polished_granite"];
    if (!rear) {
      if (x === 5) return y <= 2 ? ["dark_oak_door", DOOR(y === 1 ? "lower" : "upper")] : ["glass_pane", PANE];
      if (x === 3 || x === 6 || x === 9) return ["dark_oak_planks"];
      return y === 1 ? ["polished_granite"] : ["glass"];            // kickplate, then shop glass
    }
    if (x === 5) return y <= 2 ? ["iron_door", IRON_DOOR(y === 1 ? "lower" : "upper")] : ["bricks"];
    if ((x === 2 || x === 3 || x === 8 || x === 9) && y >= 2) return ["glass_pane", PANE];
    return ["bricks"];
  }
  if (y === 4) return !rear && x >= 4 && x <= 6 ? ["dark_oak_slab", SLAB_TOP] : ["white_terracotta"];   // awning band
  const s = storeyRow(T, y);
  if (!s) return ["bricks"];                                          // attic above the last storey
  if (s.rel === 0) return ["white_terracotta"];
  return isWin(x) ? ["glass_pane", PANE] : ["white_terracotta"];      // piers
};

// Side walls and the stepped faces of the tiers: brick with a terracotta cornice, string courses and a plinth.
const plainBlock = (x, y, z) => {
  const T = topOf(x, z);
  if (y === T - 1) return ["stone_brick_slab", SLAB_TOP];
  if (y >= T - 3 && y <= T - 2) return ["white_terracotta"];
  if (y === 0) return ["polished_granite"];
  if (y === 4) return ["white_terracotta"];
  const s = storeyRow(T, y);
  if (s && s.rel === 0) return ["white_terracotta"];
  return ["bricks"];
};

// Glass is in the outer skin; the block behind it (and the shop's interior) is air, so glass has a gap behind.
const airBehind = (x, y, z) => {
  const T = topOf(x, z);
  if ((z === 1 || z === 22) && y >= 1 && y <= 3 && x >= 1 && x <= 10) return true;
  const s = storeyRow(T, y);
  return (z === 1 || z === 22) && !!s && s.rel >= 1 && isWin(x);
};

const g = new Voxels([X, Y, Z]);

// 1. The shell and core. Exposed faces get the facade, everything else is solid core, with a gravel-free tar deck on
// each tier's top. Cells that are behind glass are air.
for (const [x, z] of cells) {
  const T = topOf(x, z);
  for (let y = 0; y < T; y++) {
    const E = exposures(x, z, y);
    if (E.length) {
      const front = z === 0 && E.includes("N");
      const rear = z === 23 && E.includes("S");
      const [b, st] = front || rear ? faceBlock(x, y, z, rear) : plainBlock(x, y, z);
      g.set(x, y, z, b, st);
    } else if (y === T - 1) g.set(x, y, z, "gray_concrete");
    else if (!airBehind(x, y, z)) g.set(x, y, z, "stone");
  }
}

// 2. Warm lights: glowstone on the spandrel below a lit pane, lanterns hung from the ceiling of the ground floor.
for (const [x, z] of cells) {
  if (z !== 1 && z !== 22) continue;
  const T = topOf(x, z);
  for (let y = 5; y <= 5 + 3 * kmax(T) + 2; y++) {
    const s = storeyRow(T, y);
    if (s && s.rel === 1 && isWin(x) && lit(x, s.k)) g.set(x, y, z, "glowstone");
  }
}
const LANTERN = { hanging: "true", waterlogged: "false" };
for (const x of [2, 5, 8]) g.set(x, 3, 1, "lantern", LANTERN);
for (const x of [2, 8]) g.set(x, 3, 22, "lantern", LANTERN);

// 3. Roof equipment on the rear tier (deck at y 60): a wooden water tower on a braced oak stand, and a brick penthouse.
// The stand is solid under the tank (corner posts as oak logs, the rest oak planks), so nothing hangs.
for (let x = 3; x <= 6; x++) for (let z = 18; z <= 21; z++) for (let y = 61; y <= 63; y++) {
  const corner = (x === 3 || x === 6) && (z === 18 || z === 21);
  g.set(x, y, z, corner ? "oak_log" : "oak_planks", corner ? { axis: "y" } : undefined);
}
for (let y = 64; y <= 67; y++) for (let x = 3; x <= 6; x++) for (let z = 18; z <= 21; z++) g.set(x, y, z, "spruce_planks");
for (let x = 3; x <= 6; x++) for (let z = 18; z <= 21; z++) g.set(x, 68, z, "dark_oak_planks");
for (let x = 4; x <= 5; x++) for (let z = 19; z <= 20; z++) g.set(x, 69, z, "dark_oak_planks");
for (let x = 7; x <= 9; x++) for (let z = 17; z <= 20; z++) {
  for (let y = 61; y <= 63; y++) g.set(x, y, z, "bricks");
  g.set(x, 64, z, "gray_concrete");
}

g.save(`${DIR}/NYC1034250.nbt`);
