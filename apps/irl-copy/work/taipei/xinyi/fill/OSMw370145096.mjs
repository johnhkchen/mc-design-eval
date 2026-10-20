import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw370145096";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 55, H = 81, D = 56;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground height of that cell
const GR = new Map();
for (const [x, z, gr] of cells) GR.set(`${x},${z}`, gr);
const foot = (x, z) => GR.has(`${x},${z}`);
const gr = (x, z) => GR.get(`${x},${z}`);

// Massing
const ROOF = 69;          // tower roof slab level
const PODIUM_ROOF = 9;    // podium roof slab level
const SET = 39;           // upper setback level (a storey line: 9 + 5*6)
const TZ_X = [9, 45], TZ_Z = [9, 46];       // lower tier
const TZ2_X = [13, 41], TZ2_Z = [13, 42];   // upper tier
const PENT_X = [14, 40], PENT_Z = [14, 41];

const inBox = (x, z, X, Z) => x >= X[0] && x <= X[1] && z >= Z[0] && z <= Z[1];
const tz = (x, z) => inBox(x, z, TZ_X, TZ_Z);
const tz2 = (x, z) => inBox(x, z, TZ2_X, TZ2_Z);
const isTower = (x, z) => foot(x, z) && tz(x, z);
const inTier = (x, z, y) => foot(x, z) && (y >= SET ? tz2(x, z) : tz(x, z));
const tierWall = (x, z, y) =>
  inTier(x, z, y) && (!inTier(x + 1, z, y) || !inTier(x - 1, z, y) || !inTier(x, z + 1, y) || !inTier(x, z - 1, y));
const t1Edge = (x, z) =>
  isTower(x, z) && (!isTower(x + 1, z) || !isTower(x - 1, z) || !isTower(x, z + 1) || !isTower(x, z - 1));
const edge = (x, z) => !foot(x + 1, z) || !foot(x - 1, z) || !foot(x, z + 1) || !foot(x, z - 1);
const inPent = (x, z) => foot(x, z) && inBox(x, z, PENT_X, PENT_Z);
const pentEdge = (x, z) => inPent(x, z) && (!inPent(x + 1, z) || !inPent(x - 1, z) || !inPent(x, z + 1) || !inPent(x, z - 1));
const nearTierWall = (x, z, y) =>
  tierWall(x + 1, z, y) || tierWall(x - 1, z, y) || tierWall(x, z + 1, y) || tierWall(x, z - 1, y);

// Street-side entrance on the lowest-z edge
const minZ = Math.min(...cells.map((c) => c[1]));
const zEdge = cells.filter((c) => c[1] === minZ);
let doorX = Math.round(zEdge.reduce((a, c) => a + c[0], 0) / zEdge.length);
if (!foot(doorX, minZ)) doorX = zEdge[Math.floor(zEdge.length / 2)][0];
const isDoorCol = (x, z) => z === minZ && x === doorX;

function blockFor(x, z, y) {
  if (!foot(x, z)) return null;
  const ground = gr(x, z);
  if (y < ground) return ["stone_bricks"];

  const tc = isTower(x, z);
  const e = edge(x, z);

  // ---- Podium branch: below y=9, and all non-tower cells ----
  if (y < PODIUM_ROOF || !tc) {
    if (y === ground) return [e ? "polished_granite" : "smooth_stone"];
    if (y === PODIUM_ROOF) return ["smooth_stone"];
    if (y === PODIUM_ROOF + 1) return (e && !tc) ? ["light_gray_concrete"] : null;
    if (y > PODIUM_ROOF) return null;
    if (y === 5) return ["smooth_stone"];
    if (!e) return null;

    if (y < 5) {
      if (isDoorCol(x, z) && (y === ground + 1 || y === ground + 2)) {
        return ["dark_oak_door", {
          facing: "north",
          half: y === ground + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        }];
      }
      if (isDoorCol(x, z) && y >= ground + 3) return ["polished_andesite"];
      return (x + z) % 3 === 0 ? ["polished_andesite"] : ["light_blue_stained_glass"];
    }
    return (x + z) % 3 === 0 ? ["light_gray_concrete"] : ["light_blue_stained_glass"];
  }

  // ---- Tower branch (tower cells, y >= 9) ----
  // Lower-tier cells outside the upper tier: terrace over the setback
  if (y >= SET && !tz2(x, z)) {
    if (y === SET) return ["smooth_stone"];
    if (y === SET + 1 && t1Edge(x, z)) return ["light_gray_concrete"];
    return null;
  }

  const tw = tierWall(x, z, y);
  const F = PODIUM_ROOF + 5 * Math.floor((y - PODIUM_ROOF) / 5);

  if (y >= ROOF + 1) {
    if (y <= ROOF + 2 && tw) return ["light_gray_concrete"]; // parapet
    if (inPent(x, z)) {
      if (y === 74) return ["smooth_stone"];
      if (pentEdge(x, z)) {
        if (y === 70 || y === 73) return ["light_gray_concrete"];
        return (x + z) % 3 === 0 ? ["light_gray_concrete"] : ["cyan_stained_glass"];
      }
    }
    return null;
  }

  if (y === F) return [tw ? "light_gray_concrete" : "smooth_stone"];

  if (tw) {
    return (x + z) % 3 === 0 ? ["light_gray_concrete"] : ["cyan_stained_glass"];
  }
  if (y === F + 2 && nearTierWall(x, z, y) && (x * 31 + z * 17 + F) % 5 === 0) {
    return ["shroomlight"];
  }
  return null;
}

// Build
for (const [x, z] of cells) {
  for (let y = 0; y < H; y++) {
    const r = blockFor(x, z, y);
    if (!r) continue;
    if (r[1]) g.set(x, y, z, r[0], r[1]);
    else g.set(x, y, z, r[0]);
  }
}

// Lanterns flanking the entrance, standing on the ground floor inside the lobby
for (const dx of [-2, 2]) {
  const lx = doorX + dx, lz = minZ + 1;
  if (foot(lx, lz) && !edge(lx, lz)) {
    const ground = gr(lx, lz);
    g.set(lx, ground + 1, lz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
