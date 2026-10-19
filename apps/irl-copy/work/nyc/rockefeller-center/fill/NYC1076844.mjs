// 1538 Broadway, a 1989 commercial and office tower in the Midtown curtain-wall manner of its decade: a granite base
// with a clear shopfront, then blue glass in light-grey spandrels with iron mullions, set on a stepped massing. Lidar read
// as clean tiers: a 160-block tower spine down the west (x 0-9 from z 17, x 0-8 to z 49) with a mechanical penthouse and
// lightning rods on its roof; a 120-block shoulder across the north (z 6-16) and along the east (x 10-17, z 17-27), so the
// spine steps down to it; a 20-block low wing on the north (z 0-5) with the lobby; a 17-block annex at the south-east
// corner (x 6-8, z 50-52); and an open paved court at the south-west, where the lidar sees no roof. Each column is solid
// from y 0 to its ground (foundation) and on to its roof, so every tier stands on the one below. Glass sits one block out
// from the core with an air gap behind it, and the floor slab is the spandrel row. Glowstone sits behind some panes. No
// interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1076844.cells.json`, "utf8"));
const X = 18, Y = 172, Z = 55;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const lidar = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);
const groundAt = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).ground : 0);

// Tiers, flattened from the lidar. The spine's lidar holes (z 48, x 3-4) are filled; the open court is not built.
const inSpine = (x, z) => (z >= 17 && z <= 27 && x <= 9) || (z >= 28 && z <= 49 && x <= 8);
const roofAt = (x, z) => {
  if (!inFoot(x, z)) return 0;
  if (lidar(x, z) <= 1 && !inSpine(x, z)) return 0;
  if (inSpine(x, z)) return 160;
  if (z <= 5) return 20;
  if (z >= 50) return 17;
  return 120;
};

// Outward faces: N = low z (the lobby front), S = rear, W/E = the side walls. [dx, dz] points out of the building.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const TINT = "light_blue_stained_glass_pane";
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows

// A cell is open at height y when it is outside the footprint, unbuilt, or its roof is at or below y.
const open = (x, y, z) => roofAt(x, z) <= y;
const faceOf = (x, y, z) => Object.keys(DIRS).find((d) => open(x + DIRS[d][0], y, z + DIRS[d][1])) ?? null;
// A roof edge: a neighbour whose roof is lower than this cell's top, or none at all.
const edgeAt = (x, z, top) => [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => roofAt(x + dx, z + dz) < top);

const cols = [...cell.keys()].map((k) => k.split(",").map(Number));
const g = new Voxels([X, Y, Z]);
const pane = (x, y, z, d, block = TINT) => g.set(x, y, z, block, DIRS[d][0] === 0 ? NS : EW);

// 1. Solid mass: foundation from y 0 up to each cell's ground, the core to the roof, and a roof membrane on each top.
// Open court cells are paved on their ground.
for (const [x, z] of cols) {
  const G = groundAt(x, z), T = roofAt(x, z);
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone");
  if (!T) { g.set(x, G, z, "smooth_stone"); continue; }
  for (let y = G; y < T; y++) g.set(x, y, z, y === T - 1 ? "gray_concrete" : "light_gray_concrete");
}

// 2. Faces. Ground floor: a granite base at y 0, then a clear shopfront with granite piers every third column. Above it,
// a light-grey spandrel at every storey line (y multiple of 3, the floor slab), blue glass between, and iron mullions on
// every third column. The top row is a granite cornice. Glass with air behind it: the core cell inward of each window
// is cleared (not a face), so the pane sits in a recess, and a few recesses hold glowstone.
const recesses = [];
for (const [x, z] of cols) {
  const T = roofAt(x, z), G = groundAt(x, z);
  if (!T) continue;
  for (let y = G; y < T; y++) {
    const d = faceOf(x, y, z);
    if (!d) continue;
    const [dx, dz] = DIRS[d];
    const u = dx === 0 ? x : z;                       // position along the face
    const ix = x - dx, iz = z - dz;                   // one block in, behind the face
    if (y === T - 1 || y === 0) { g.set(x, y, z, "polished_granite"); continue; }
    if (y < 3) {
      if (u % 3 === 0) { g.set(x, y, z, "polished_granite"); continue; }
      pane(x, y, z, d, "glass_pane");
    } else if (y % 3 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }
    else if (u % 3 === 0) { g.set(x, y, z, "iron_block"); continue; }
    else pane(x, y, z, d);
    if (inFoot(ix, iz) && roofAt(ix, iz) > y && !faceOf(ix, y, iz)) recesses.push([ix, y, iz, lit(u, y, d === "N" ? 1 : d === "S" ? 2 : 3)]);
  }
}
for (const [x, y, z, warm] of recesses) g.set(x, y, z, warm ? "glowstone" : "air");

// 3. Lobby on the north wing (x 7-8, low z): a double iron door between granite piers, a black canopy over it, and two
// hanging lanterns. The canopy stands on the floor slab above the doors and on the solid core behind, so it does not float.
g.set(7, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(7, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(8, 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "right", open: "false", powered: "false" });
g.set(8, 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "right", open: "false", powered: "false" });
for (const x of [7, 8]) for (const y of [1, 2]) g.set(x, y, 1, "air");
for (let x = 6; x <= 9; x++) { g.set(x, 4, 0, "black_concrete"); g.set(x, 4, 1, "black_concrete"); }
for (const x of [7, 8]) g.set(x, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });

// 4. Parapets: a granite slab on each edge of a roof, standing on the cornice below it.
for (const [x, z] of cols) {
  const T = roofAt(x, z);
  if (T && edgeAt(x, z, T)) g.set(x, T, z, "polished_granite_slab", { type: "bottom", waterlogged: "false" });
}

// 5. Roof: a mechanical penthouse on the spine (x 2-6, z 22-44, up to y 163) with a band of glass louvre at y 161-162
// on its outer faces, lanterns at its corners, and two lightning rods rising from its roof. A plant pair stands on the
// shoulder's roof, to the north-east.
const PH = { x0: 2, x1: 6, z0: 22, z1: 44, y0: 160, y1: 163 };
for (let x = PH.x0; x <= PH.x1; x++) for (let z = PH.z0; z <= PH.z1; z++) for (let y = PH.y0; y <= PH.y1; y++) {
  g.set(x, y, z, y === PH.y1 ? "gray_concrete" : "light_gray_concrete");
}
for (let z = PH.z0 + 1; z < PH.z1; z++) for (const y of [161, 162]) {
  for (const x of [PH.x0, PH.x1]) pane(x, y, z, x === PH.x0 ? "W" : "E", (z - PH.z0) % 4 === 0 ? "iron_block" : TINT);
}
for (let x = PH.x0 + 1; x < PH.x1; x++) for (const y of [161, 162]) {
  for (const z of [PH.z0, PH.z1]) pane(x, y, z, z === PH.z0 ? "N" : "S", (x - PH.x0) % 4 === 0 ? "iron_block" : TINT);
}
for (const [x, z] of [[PH.x0, PH.z0], [PH.x1, PH.z0], [PH.x0, PH.z1], [PH.x1, PH.z1]]) g.set(x, PH.y1 + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
for (let y = PH.y1 + 1; y <= 167; y++) g.set(4, y, 33, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
for (let x = 12; x <= 13; x++) for (let z = 9; z <= 10; z++) for (const y of [120, 121]) g.set(x, y, z, "light_gray_concrete");
for (let x = 12; x <= 13; x++) for (let z = 9; z <= 10; z++) g.set(x, 121, z, "gray_concrete");

// Check: every block that is not hung, glazed or a door has something under it or beside it (a floor slab over a
// window recess is carried by the core behind it), so nothing hangs in the air.
let floating = 0;
const solid = (x, y, z) => !!g.get(x, y, z);
for (let y = 1; y < Y; y++) for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const b = g.get(x, y, z); if (!b || solid(x, y - 1, z)) continue;
  if (/glass|lantern|lightning|iron_door/.test(b.block)) continue;
  if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => solid(x + dx, y, z + dz))) continue;
  floating++;
}
const stats = g.save(`${DIR}/NYC1076844.nbt`);
console.log(JSON.stringify({ cells: cols.length, roofMax: Math.max(...cols.map(([x, z]) => roofAt(x, z))), floating, ...stats }));
