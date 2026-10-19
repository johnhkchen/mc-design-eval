// The Embassy Theatre, Broadway, 1925 (NYC interior landmark): a theatre lobby with a marquee canopy on the street side,
// under an office tower of buff limestone with Art Deco setbacks. Footprint 13 x 28 (x = frontage, z = depth, low z =
// north = the street). Lidar roofs, flattened into tiers: the tower core on x 0-7, z 1-25 (lidar 52-54, stepped back
// to 22, 40, 48 and 54); a 2-storey theatre front (8) on x 8-12, z 1-5; a foyer (9) on z 6; a 7-storey office wing (22)
// on z 7-15 with a penthouse; an 8-storey block (24) on z 16-19; a 5-storey base (16) on z 24-27; and 40-high shoulders
// at x 8 (z 20-23) and the south end (z 26-27) where the lidar reads taller.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022661.cells.json`, "utf8"));
const X = 13, Z = 28, Y = 58;

const footprint = new Set(cells.map(([x, z]) => `${x},${z}`));
if (footprint.size !== X * Z) throw new Error(`footprint has ${footprint.size} cells, want ${X * Z}`);

// Massing: each tier is a rectangle (inclusive x0..x1, z0..z1) standing to a height. A column is solid from 0 up to its
// height, so every tier stands on the one below. Overlapping tiers take the higher one.
const hgt = Array.from({ length: Z }, () => Array(X).fill(0));
const H = (x, z) => (x >= 0 && x < X && z >= 0 && z < Z ? hgt[z][x] : 0);
const lift = (x0, x1, z0, z1, top) => { for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) hgt[z][x] = Math.max(hgt[z][x], top); };

lift(0, 7, 1, 25, 22);      // base: the tower's lower storeys and the theatre roof plateau
lift(2, 6, 1, 24, 40);      // tower shaft, set back from the base
lift(1, 1, 2, 24, 40);
lift(0, 0, 6, 24, 40);
lift(2, 5, 4, 21, 48);      // setback
lift(2, 5, 6, 19, 54);      // crown tier, to the lidar's 54
lift(3, 4, 9, 16, 56);      // small crown above the lidar
lift(0, 7, 26, 27, 40);     // south shoulder (lidar 40-46)
lift(8, 8, 20, 23, 40);     // east shoulder (lidar 50-53, one column wide)
lift(8, 12, 1, 5, 8);       // theatre front
lift(8, 12, 6, 6, 9);       // foyer
lift(8, 12, 7, 15, 22);     // office wing
lift(10, 11, 9, 11, 25);    // penthouse on the wing roof
lift(8, 12, 16, 19, 24);    // 8-storey block
lift(9, 12, 20, 23, 22);
lift(8, 12, 24, 27, 16);    // south base
for (let x = 0; x < X; x++) hgt[0][x] = 0;                         // street front: open ground
for (const [x, z] of [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [1, 1]]) hgt[z][x] = 0;   // north-west lot corner: open

// Outward normal of each side. A face is exposed where the neighbour in that direction is lower than the cell.
const SIDE = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] };
const exposed = (x, y, z) => Object.keys(SIDE).filter((d) => H(x + SIDE[d][0], z + SIDE[d][1]) <= y);
const paneState = (d) => (d === "E" || d === "W"
  ? { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" }
  : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });

const g = new Voxels([X, Y, Z]);
const cavities = [];   // [x, y, z, block] behind each pane: air, or a warm glowstone; set after the walls

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const h = H(x, z);
  if (!h) { g.set(x, 0, z, "smooth_stone"); continue; }             // open ground: paving only
  for (let y = 0; y < h; y++) {
    const faces = exposed(x, y, z);
    if (!faces.length) { g.set(x, y, z, y === h - 1 ? "stone" : "calcite"); continue; }   // mass and roof surface
    let block = "smooth_quartz", state;
    if (y === 0) block = "polished_granite";                         // base course
    else if (y >= h - 2 || y % 3 === 0 || faces.length > 1) block = "smooth_quartz";   // cornice, storey lines, corners
    else {                                                           // window rows between the storey lines
      const d = faces[0];
      const [dx, dz] = SIDE[d];
      const u = d === "E" || d === "W" ? z : x;                      // position along the face
      const along = d === "E" || d === "W" ? [[x, z - 1], [x, z + 1]] : [[x - 1, z], [x + 1, z]];
      const sideOK = along.every(([ax, az]) => ax >= 0 && ax < X && az >= 0 && az < Z && exposed(ax, y, az).includes(d));
      const [ix, iz] = [x - dx, z - dz];                             // the room behind the pane
      const room = ix >= 0 && ix < X && iz >= 0 && iz < Z && H(ix, iz) > y && !exposed(ix, y, iz).length;
      if (u % 3 !== 0 && sideOK && room) {
        block = "glass_pane"; state = paneState(d);
        cavities.push([ix, y, iz, (x * 7 + y * 5 + z * 3) % 11 === 0 ? "glowstone" : "air"]);
      } else block = u % 3 === 0 ? "smooth_quartz" : "calcite";      // mullion or spandrel
    }
    g.set(x, y, z, block, state);
  }
}
for (const [x, y, z, b] of cavities) g.set(x, y, z, b);

// Theatre front (z 1, x 8-12): a glass lobby on the street, a door at x 10, the walls behind it left as air.
for (let x = 8; x <= 12; x++) for (const y of [1, 2]) {
  if (x === 10) continue;
  g.set(x, y, 1, "glass_pane", paneState("N")); g.set(x, y, 2, "air");
}
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
g.set(10, 1, 1, "iron_door", door("lower")); g.set(10, 2, 1, "iron_door", door("upper"));
g.set(10, 1, 2, "air"); g.set(10, 2, 2, "air");

// Marquee canopy on two posts at the street edge: a gold soffit over the entrance, lanterns hung beneath it.
for (let x = 8; x <= 12; x++) g.set(x, 3, 0, x >= 9 && x <= 11 ? "gold_block" : "smooth_quartz");
for (const x of [8, 12]) for (const y of [0, 1, 2]) g.set(x, y, 0, "smooth_quartz");
for (const x of [9, 11]) g.set(x, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });

// A warm lantern on top of the crown.
for (const [x, z] of [[3, 12], [4, 12], [3, 13], [4, 13]]) g.set(x, 56, z, "sea_lantern");

const { blocks, palette } = g.save(`${DIR}/NYC1022661.nbt`);
console.log(`NYC1022661: ${blocks} blocks, ${palette} palette entries, tower top ${Math.max(...hgt.flat())}`);
