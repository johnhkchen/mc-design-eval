// NYC1034504: 75 West 47th Street, 1928 mixed residential and commercial. A 5 x 21 mid-block lot: a shop front on
// 47th (the z=0 side, the lowest ground), four upper storeys of brick over stone, a parapet, and one-storey shop wings
// where the lidar reads ground-level roofs. A hollow shell with a floor slab per storey, so each window looks onto air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034504.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 5, Z = 21, H = 26;

const cell = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const at = (x, z) => cell.get(`${x},${z}`);
const inside = (x, z) => x >= 0 && x < X && z >= 0 && z < Z;

// Massing. Tall cells (lidar roof >= 6) take the median roof of their tall neighbours, snapped to a tier of 12, 13 or 14
// (the lidar's 1s and 0s inside the tall mass are dropouts or ground-level wings, not holes). Low cells are one-storey
// shop wings: ground, three storey-rows of shop, and a cap, so the top is ground + 4.
const TIERS = [12, 13, 14];
const T = Array.from({ length: X }, () => []);
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const c = at(x, z);
  if (c.r < 6) { T[x][z] = c.g + 4; continue; }
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!inside(x + dx, z + dz)) continue;
    const n = at(x + dx, z + dz); if (n.r >= 6) near.push(n.r);
  }
  near.sort((a, b) => a - b);
  const m = near[Math.floor(near.length / 2)];
  T[x][z] = TIERS.reduce((best, t) => (Math.abs(t - m) < Math.abs(best - m) ? t : best));
}

// Which sides of a voxel are open air: outside the lot, or above the neighbouring cell's top.
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const exposed = (x, z, y) => DIRS.filter(([, dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  return !inside(nx, nz) || y >= T[nx][nz];
}).map(([n]) => n);

// Warm windows on the street front, and the bays on each face (glass in the middle row of each storey).
const LIT = new Set(["1,1", "3,2", "2,3"]);          // x,storey on the N face: glowstone one block behind the pane
const sideBay = (z) => z % 4 === 1 || z % 4 === 2;    // x-facing faces
const rearBay = (x) => x >= 1 && x <= 3;              // S face

const v = new Voxels([X, H, Z]);

function facade(x, z, y, face, s, rr) {
  if (face === "N") {                                 // 47th Street front
    if (s === 0) {                                    // shop storey
      if (rr === 0) return x === 2 ? ["dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }] : ["stone_bricks"];
      if (rr === 1) {
        if (x === 2) return ["dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }];
        return x === 0 || x === 4 ? ["bricks"] : ["glass"];
      }
      return x === 0 || x === 4 ? ["bricks"] : ["dark_oak_planks"];
    }
    if (rr === 0) return ["calcite"];                 // storey line
    if (rr === 1) {
      if (x === 0 || x === 4) return ["bricks"];
      if (LIT.has(`${x},${s}`)) v.set(x, y, 1, "glowstone");   // lit room behind the pane
      return ["glass_pane"];
    }
    return ["bricks"];                                // lintel course
  }
  if (face === "S") {                                 // rear
    if (s === 0) return rr === 1 ? (rearBay(x) ? ["glass_pane"] : ["bricks"]) : rr === 0 ? ["stone_bricks"] : ["bricks"];
    if (rr === 0) return ["calcite"];
    if (rr === 1) return rearBay(x) ? ["glass_pane"] : ["bricks"];
    return ["bricks"];
  }
  // W and E party and side walls
  if (s === 0) return rr === 0 ? ["stone_bricks"] : rr === 1 ? (sideBay(z) ? ["glass_pane"] : ["bricks"]) : ["bricks"];
  if (rr === 0) return ["calcite"];
  if (rr === 1) return sideBay(z) ? ["glass_pane"] : ["bricks"];
  return ["bricks"];
}

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const { g } = at(x, z), t = T[x][z];
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone_bricks");          // foundation up to this cell's ground
  for (let y = g; y < t; y++) {
    const r = y - g, rr = r % 3, s = Math.floor(r / 3);
    const dirs = exposed(x, z, y);
    if (y === t - 1) { v.set(x, y, z, dirs.length ? "calcite" : "smooth_stone"); continue; }   // roof and coping
    if (dirs.length) {
      const face = dirs.includes("N") ? "N" : dirs.includes("S") ? "S" : dirs[0];
      const [block, state] = facade(x, z, y, face, s, rr);
      v.set(x, y, z, block, state);
      continue;
    }
    if (rr === 0) v.set(x, y, z, "smooth_stone");                       // floor slab per storey; interior air between
  }
}

// Mechanical bulkhead on the roof of the rear tier: two brick courses and a stone cap, set back from both fronts.
for (let x = 1; x <= 3; x++) for (let z = 16; z <= 18; z++) {
  const t = T[x][z]; if (t < 13) continue;
  v.set(x, t, z, "bricks"); v.set(x, t + 1, z, "bricks"); v.set(x, t + 2, z, "calcite");
}

const out = v.save(`${DIR}/NYC1034504.nbt`);
console.log(`NYC1034504.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
