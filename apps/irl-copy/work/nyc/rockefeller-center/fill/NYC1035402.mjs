// 563 5th Avenue (NYC1035402): 1991 commercial-office tower on a granite base. The lidar roof sets a stepped massing
// (a 36-block wing, a 48-block wing, a 102-block west shoulder and a 108-block tower core with a penthouse). Each cell
// rises from its ground; the facade is one block thick with an air gap behind it, a floor slab every 3 blocks, a
// granite base course and shopfront, spandrels between grey-blue glass bays on piers, a granite parapet, and warm
// glowstone behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1035402.cells.json`, "utf8"));

const X = 49, Z = 31, Y = 120;
// Lidar roof heights snap to storey-multiple tiers (3 blocks a storey): flat tiers, not noise.
const TIERS = [0, 3, 6, 9, 12, 36, 48, 72, 102, 108];
const tierOf = (r) => TIERS.reduce((best, t) => (Math.abs(t - r) < Math.abs(best - r) ? t : best));

const H = Array.from({ length: X }, () => new Array(Z).fill(0));   // roof tier per cell (0 = open ground)
const G = Array.from({ length: X }, () => new Array(Z).fill(0));   // ground per cell
const inFoot = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && G[x][z] !== undefined && FOOT[x][z];
const FOOT = Array.from({ length: X }, () => new Array(Z).fill(false));
for (const [x, z, gr, r] of cells) { FOOT[x][z] = true; H[x][z] = tierOf(r); G[x][z] = gr; }

// Lidar holes: an open cell ringed by building on three or more sides takes the median of its neighbours.
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!FOOT[x][z] || H[x][z]) continue;
  const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => (inFoot(x + dx, z + dz) ? H[x + dx][z + dz] : 0)).filter((v) => v > 0).sort((a, b) => a - b);
  if (nb.length >= 3) H[x][z] = nb[nb.length >> 1];
}

const h = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? 0 : H[x][z]);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// Faces this voxel shows to air: a neighbour whose tier stops below this height.
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => h(x + dx, z + dz) <= y);

const v = new Voxels([X, Y, Z]);

// Facade for a non-top voxel on an outward face. `along` is the coordinate running along that face.
function facade(y, along) {
  if (y === 0) return ["polished_granite"];                                  // base course
  if (y % 3 === 0) return ["light_gray_concrete"];                           // storey spandrel
  const shop = y < 3;
  if (along % 3 === 0) return [shop ? "polished_granite" : "light_gray_concrete"];   // piers
  if (shop) return ["light_blue_stained_glass"];                              // shopfront glass
  const storey = Math.floor(y / 3);
  return [(along + storey) % 5 === 0 ? "gray_stained_glass" : "cyan_stained_glass"];  // bays
}

const lamps = [];
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!FOOT[x][z]) continue;
  for (let y = 0; y < G[x][z]; y++) v.set(x, y, z, "stone");                 // foundation down to the lowest ground
  const top = H[x][z];
  for (let y = 0; y < top; y++) {
    const ex = exposed(x, z, y);
    if (y === top - 1) { v.set(x, y, z, ex.length ? "polished_granite" : "smooth_stone"); continue; }   // parapet / roof
    if (ex.length) {
      const [dx, dz] = ex[0];
      const [block] = facade(y, dx ? z : x);
      v.set(x, y, z, block);
      // Some glass panes get a glowstone one cell in, in the air gap behind them.
      if (block.endsWith("glass") && y % 3 !== 0 && (x * 7 + y * 3 + z * 5) % 11 === 0) lamps.push([x - dx, y, z - dz]);
    } else if (y % 3 === 0) {
      v.set(x, y, z, "smooth_stone");                                        // floor slab; the rest is air
    }
  }
}
for (const [x, y, z] of lamps) {
  if (inFoot(x, z) && H[x][z] > y && exposed(x, z, y).length === 0) v.set(x, y, z, "glowstone");
}

// Entrance on the south face (z 30): a recessed lobby with a double door and lanterns under the storey-one slab.
v.set(25, 0, 30, "polished_granite");
const door = (x, half, hinge) => ({ facing: "south", half, hinge, open: "false", powered: "false" });
for (const x of [26, 27]) {
  const hinge = x === 26 ? "left" : "right";
  v.set(x, 0, 30, "dark_oak_door", door(x, "lower", hinge));
  v.set(x, 1, 30, "dark_oak_door", door(x, "upper", hinge));
}
for (const x of [26, 29]) v.set(x, 2, 29, "lantern", { hanging: "true", waterlogged: "false" });

// Penthouse on the 108 tower core, with a glazed band and a granite cap.
for (let x = 19; x <= 27; x++) for (let z = 5; z <= 10; z++) {
  if (H[x][z] !== 108) continue;
  const edge = x === 19 || x === 27 || z === 5 || z === 10;
  v.set(x, 108, z, "light_gray_concrete");
  if (edge) v.set(x, 109, z, "gray_stained_glass");
  v.set(x, 110, z, "polished_granite");
}

// Mechanical plant on the 48 wing.
for (let x = 20; x <= 23; x++) for (let z = 20; z <= 22; z++) {
  if (H[x][z] !== 48) continue;
  v.set(x, 48, z, "light_gray_concrete");
  v.set(x, 49, z, "light_gray_concrete");
  v.set(x, 50, z, "polished_granite");
}

const info = v.save(`${dir}/NYC1035402.nbt`);
console.log(JSON.stringify(info));
