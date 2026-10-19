// 45 West 45th Street, 1923 commercial and office building: an 18-storey brick office tower on a two-storey limestone
// base, its massing stepped in terraces that rise toward the south. The lidar roof reads 4-8 on the street row (z 0-1),
// 22-28 and 34-40 on the next two, 46-53 after that, a flat 53-55 over most of the footprint and 44-50 on the south
// edge. Those rows are read in bands of two to three, since a one-cell step is a stair, not a terrace. Limestone bands
// every storey (3 blocks), brick piers, blue-glass windows one block out from a solid core with an air gap behind each
// pane (a floor slab per storey, no interiors). The street front has a recessed entrance with a bronze door, a hanging
// lantern and the limestone band as a canopy. A one-storey limestone shop wing sits on the NE corner, a 3-block penthouse
// crown on the tower's centre and two windowless mechanical boxes on the roof. Some windows glow: glowstone behind
// the shop glass and in the tower, with shroomlights for a warmer few. All ground is at y 0, so nothing needs a foundation.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034243.cells.json`, "utf8"));
const X = 22, Y = 67, Z = 27;

// Roof height (blocks above y 0) by band of rows, [z0, z1, roof]: the lidar's median per band, snapped to storeys.
const TIERS = [[0, 1, 6], [2, 3, 24], [4, 5, 36], [6, 7, 51], [8, 24, 54], [25, 26, 48]];
const H = Array.from({ length: X }, () => Array(Z).fill(0));
for (const [z0, z1, h] of TIERS) for (let z = z0; z <= z1; z++) for (let x = 0; x < X; x++) H[x][z] = h;
for (let z = 0; z <= 1; z++) for (let x = 20; x < X; x++) H[x][z] = 3;             // NE one-storey shop wing (lidar 0-2)
for (let z = 9; z <= 17; z++) for (let x = 7; x <= 14; x++) H[x][z] = 57;         // penthouse crown over the tower centre
const MECH = [[2, 4, 11, 13], [17, 19, 19, 21]];                                   // [x0, x1, z0, z1] roof boxes, no windows
const mech = new Set();
for (const [x0, x1, z0, z1] of MECH) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) { H[x][z] = 57; mech.add(`${x},${z}`); }

// Only footprint cells carry massing (all 594 cells of the 22 x 27 box are in the footprint).
const foot = new Set(cells.map(([x, z]) => `${x},${z}`));
const at = (x, z) => (foot.has(`${x},${z}`) ? H[x][z] : 0);
const solid = (x, y, z) => y < at(x, z);

// A solid cell's exposed sides: the horizontal neighbours that are lower or outside the footprint.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faces = (x, y, z) => Object.keys(DIRS).filter((k) => !solid(x + DIRS[k][0], y, z + DIRS[k][1]));
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const g = new Voxels([X, Y, Z]);

// Pass 1: the solid core (brick, roof cover on the top) so every storey stands on the one below.
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) for (let y = 0; y < at(x, z); y++) {
  g.set(x, y, z, y === at(x, z) - 1 && !faces(x, y, z).length ? "smooth_stone" : "bricks");
}

// Pass 2: the facade. Corners and the roof edge are limestone; each storey has a limestone band at its base (y % 3 = 0);
// the street-level and upper storeys have brick or limestone piers every third block; the rest are glass, one block
// out, with an air pocket behind (the core's floor slab is the solid row under each window band).
const pockets = [];
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) for (let y = 0; y < at(x, z); y++) {
  const f = faces(x, y, z), top = y === at(x, z) - 1;
  if (!f.length && !top) continue;
  if (top && !f.length) continue;
  if (top || f.length > 1) { g.set(x, y, z, "calcite"); continue; }        // cornice and quoins
  if (mech.has(`${x},${z}`)) { g.set(x, y, z, "bricks"); continue; }
  const side = f[0], podium = y < 6;
  const u = side === "N" || side === "S" ? x : z;
  if (y % 3 === 0) { g.set(x, y, z, "calcite"); continue; }                // storey band
  if (u % 3 === 0) { g.set(x, y, z, podium ? "calcite" : "bricks"); continue; }  // pier
  g.set(x, y, z, podium ? "glass" : "light_blue_stained_glass");
  const [dx, dz] = DIRS[side];
  const px = x - dx, pz = z - dz;                                       // one block in, behind the glass
  const h = hash(x, y, z) % 8;                                          // shop glass: every other pane lit; tower: one in eight
  const lamp = podium ? (h % 2 === 0 ? "glowstone" : null) : h === 0 ? "glowstone" : h === 4 ? "shroomlight" : null;
  pockets.push([px, y, pz, lamp]);
}
for (const [px, y, pz, lamp] of pockets) g.set(px, y, pz, lamp ?? "air");

// The recessed entrance on the street front: a 3-wide bay (x 9-11) two storeys high, set one block in, with a bronze
// door at its back, limestone returns either side, and a hanging lantern under the band that canopies it.
for (const x of [9, 10, 11]) for (const y of [1, 2]) g.set(x, y, 0, "air");
for (const y of [1, 2]) { g.set(9, y, 1, "calcite"); g.set(11, y, 1, "calcite"); }
g.set(10, 1, 1, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(10, 2, 1, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(10, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });

const { blocks, palette } = g.save(`${DIR}/NYC1034243.nbt`);
console.log(`NYC1034243.nbt: ${blocks} blocks, ${palette} palette entries, size ${X} x ${Y} x ${Z}`);
