// 425 Madison Avenue, 1927 commercial and office building: a Jazz Age setback tower on a granite-and-limestone base.
// Footprint 23 x 20 (x across the blocks, low z = north = the cross-street frontage, low x = the Madison Avenue side).
// Massing read from the lidar roof: a 10-block (three storey) wing along the avenue and round the south-west corner,
// a 50-block wing along the north street, a 60-block main body, a 63-block mechanical penthouse on the body, and a
// 71-block tower on the east side with a 66-block setback ring around its core. The open light court (lidar 0) at
// x 2-5 is left open to the sky and paved at y 0. Every column is solid from y 0 to its roof, so each tier stands on
// the one below. Walls are a solid limestone mass with glass panes in the outer skin and one air block behind each
// pane (no interiors); a granite plinth, a shopfront storey, storey bands every 3 blocks, granite coping, a small
// gilded pinnacle on the tower top, and warm glowstone behind some panes. The door is on the avenue at z 8-9.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035443.cells.json`, "utf8"));
const X = 23, Y = 83, Z = 20;

const lidar = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, roof]));
const footprint = (x, z) => lidar.has(`${x},${z}`);

// Roof height (exclusive top, block y 0 .. top-1) of each column; 0 = open ground (court or notch).
const top = (x, z) => {
  if (x === 0 || (x === 1 && (z <= 1 || z >= 18)) || (x === 2 && z === 19)) return 10;   // Madison wing, 3 storeys
  if (x < 5 || x > 22) return 0;
  if (x === 5) return z <= 1 ? 50 : 0;
  if (z <= 1) return x === 21 && z === 0 ? 0 : 50;                                         // north street wing
  if (x >= 8 && x <= 10 && z >= 4 && z <= 6) return 63;                                    // mechanical penthouse
  if (x >= 13 && x <= 21 && z >= 8 && z <= 18) return x === 13 || x === 21 || z === 8 || z === 18 ? 66 : 71;
  return 60;                                                                               // main body
};
const T = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? 0 : top(x, z));
const solid = (x, y, z) => y < T(x, z);

const FACES = [[-1, 0], [1, 0], [0, -1], [0, 1]];   // outward normals: W (Madison), E, N (street), S
const lit = (x, y, z) => (x * 7 + y * 5 + z * 3) % 11 === 0;   // sparse, deterministic warm windows

const v = new Voxels([X, Y, Z]);
const windows = [];

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const H = T(x, z);
  if (!H) { if (footprint(x, z)) v.set(x, 0, z, "stone_bricks"); continue; }   // open court paving
  for (let y = 0; y < H; y++) {
    if (y === 0) { v.set(x, y, z, "polished_granite"); continue; }              // plinth
    const exp = FACES.filter(([dx, dz]) => T(x + dx, z + dz) <= y);
    if (y === H - 1) {                                                          // roof: coping on the edge, stone inside
      if (x >= 16 && x <= 18 && z >= 12 && z <= 14 && H === 71) v.set(x, y, z, "gold_block");
      else v.set(x, y, z, exp.length ? "polished_granite" : "stone_bricks");
      continue;
    }
    if (!exp.length) { v.set(x, y, z, "calcite"); continue; }                  // solid limestone core
    const pier = exp.some(([dx, dz]) => ((dx !== 0 ? z : x) % 3 === 0));
    if (y % 3 === 0) { v.set(x, y, z, "smooth_stone"); continue; }             // storey band
    if (pier) { v.set(x, y, z, y < 3 ? "polished_granite" : "polished_diorite"); continue; }
    const [dx, dz] = exp[0];
    v.set(x, y, z, "light_blue_stained_glass_pane", dx !== 0
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
    windows.push({ x, y, z, dx, dz });
  }
}

// One air block behind each pane (no interiors), or a glowstone lamp behind the lit ones.
for (const { x, y, z, dx, dz } of windows) {
  const ix = x - dx, iz = z - dz;
  if (!solid(ix, y, iz)) continue;
  if (lit(x, y, z)) v.set(ix, y, iz, "glowstone"); else v.set(ix, y, iz, "air");
}

// Madison Avenue entrance: a pair of bronze-grey doors between granite jambs under a granite hood.
for (const z of [8, 9]) {
  v.set(0, 1, z, "iron_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  v.set(0, 2, z, "iron_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
}
for (let z = 7; z <= 10; z++) v.set(0, 3, z, "polished_granite");

const stats = v.save(`${DIR}/NYC1035443.nbt`);

// Check against the lidar: every lidar-built cell is built, and the only open footprint cells are the court and notch.
let mismatch = [];
for (const [x, z, , r] of cells) {
  const built = T(x, z) > 0;
  if (built !== (r > 0)) mismatch.push(`${x},${z} lidar ${r} built ${built}`);
}
console.log(`saved NYC1035443.nbt: ${stats.blocks} blocks, ${stats.palette} palette entries`);
console.log(`tops: max ${Math.max(...cells.map(([x, z]) => T(x, z)))}, lidar-vs-build differences: ${mismatch.length}`);
if (mismatch.length) console.log(mismatch.slice(0, 20).join("\n"));
