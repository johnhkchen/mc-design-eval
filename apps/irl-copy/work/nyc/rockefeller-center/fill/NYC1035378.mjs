// 10 East 45 Street (NYC Open Data BIN 1035378): a 1930 mixed residential and commercial block, six storeys on the
// street and its light-court wings, with a stepped setback where the lidar roof drops. Red brick walls on a granite
// plinth, cream stone spandrels and cornices, glass windows in brick piers, a shopfront with a door on the south
// (street) front. Storeys are 3 blocks: a slab row (stone band), then two window rows. Only footprint cells are built.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035378.cells.json`, "utf8"));
const X = 12, Z = 26, Y = 30;

// Lidar roof per cell, then a 3x3 median to take the noise out of the edges.
const roof = Array.from({ length: X }, () => Array(Z).fill(0));
for (const [x, z, , r] of cells) roof[x][z] = r;
const median = (x, z) => {
  const v = [];
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
    const i = x + a, j = z + b;
    if (i >= 0 && i < X && j >= 0 && j < Z) v.push(roof[i][j]);
  }
  v.sort((p, q) => p - q);
  return v[Math.floor(v.length / 2)];
};

// Clean tiers: exclusive top height. 1 = open ground / paving only; 7, 10, 13, 16, 18 = 2 to 6 storeys.
const tierOf = (s) => (s <= 2 ? 1 : s <= 7 ? 7 : s <= 10 ? 10 : s <= 14 ? 13 : s <= 16 ? 16 : 18);
const T = Array.from({ length: X }, (_, x) => Array.from({ length: Z }, (_, z) => tierOf(median(x, z))));
const top = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? 0 : T[x][z]);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// A built cell is a facade where a neighbour is lower (street, light court or setback): its outer skin is windowed.
const facade = (x, z) => T[x][z] > 1 && DIRS.some(([dx, dz]) => top(x + dx, z + dz) < T[x][z]);
const exposedZ = (x, z) => top(x, z - 1) < T[x][z] || top(x, z + 1) < T[x][z];   // runs along x
const exposedX = (x, z) => top(x - 1, z) < T[x][z] || top(x + 1, z) < T[x][z];   // runs along z

const g = new Voxels([X, Y, Z]);
const lanterns = [];
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const t = T[x][z];
  if (t === 1) { put(x, 0, z, "stone_bricks"); continue; }      // open ground: paving on the lowest ground
  const f = facade(x, z);
  const alongX = exposedZ(x, z);                                 // this cell's outer wall runs east-west
  const u = alongX ? x : z;
  const street = z === Z - 1 && alongX;                          // the 45th Street front (south end)
  for (let y = 0; y < t; y++) {
    if (y === 0) { put(x, y, z, f ? "polished_granite" : "stone"); continue; }    // plinth on the foundation
    if (y === t - 1) { put(x, y, z, f ? "smooth_quartz" : "smooth_stone"); continue; }  // cornice / roof
    if (y % 3 === 0) { put(x, y, z, f ? "smooth_quartz" : "stone_bricks"); continue; }  // storey slab, spandrel
    if (!f) continue;                                             // interior: air behind the glass
    const k = Math.floor(y / 3);
    const pier = u % 3 === 0 || u === 0 || u === (alongX ? X - 1 : Z - 1);   // piers every third bay and at the wall's ends
    if (street && k === 0 && x === 5) {                           // entrance door
      put(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (street && k === 0 && pier) { put(x, y, z, "black_concrete"); continue; }
    put(x, y, z, pier ? "bricks" : "glass_pane");
    // Warm light: a hanging lantern in the air behind some glass, hung from the slab above.
    if (!pier && y % 3 === 2 && (x * 2 + z * 3 + k) % 5 === 0) {
      const inward = DIRS.find(([dx, dz]) => top(x + dx, z + dz) >= t);
      if (inward) lanterns.push([x + inward[0], y, z + inward[1], t]);
    }
  }
  // Roof equipment: a few chimney stacks on the interior roofs of the tallest interior tiers.
  if (!f && t >= 16 && (x * 5 + z * 7) % 29 === 0) { put(x, t, z, "bricks"); put(x, t + 1, z, "bricks"); }
}

for (const [x, y, z, t] of lanterns) {
  if (x < 0 || z < 0 || x >= X || z >= Z || top(x, z) < t || y >= t - 1) continue;
  if (facade(x, z) || g.get(x, y, z)) continue;                  // keep the air gap clear of the facade
  put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Glass panes connect to the solid blocks in their plane, as they would if placed in game.
const solid = (x, y, z) => { const b = g.get(x, y, z); return !!b && b.block !== "minecraft:lantern" && !b.block.includes("door"); };
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) {
  const b = g.get(x, y, z);
  if (!b || b.block !== "minecraft:glass_pane") continue;
  const s = {
    north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)),
    east: String(solid(x + 1, y, z)), west: String(solid(x - 1, y, z)),
  };
  put(x, y, z, "glass_pane", s);
}

const { blocks, palette } = g.save(`${DIR}/NYC1035378.nbt`);
console.log(`NYC1035378.nbt: ${blocks} blocks, ${palette} palette entries, ${lanterns.length} lantern slots`);
