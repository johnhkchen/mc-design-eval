// 59 East 54th Street, 1923 commercial and office building: an eleven-storey brick block of the years before the 1916
// setback law's towers took over Midtown. A polished-granite base and a granite kickplate, a brick shaft in storeys of
// three blocks (limestone string course on each storey line), and a corbelled limestone cornice on every tier. The
// lidar reads as three flat tiers: a 28-block north wing on 54th Street, a 31-block south wing and shoulder, and a
// 34-block central tower set back a block from the shoulder, with a small mechanical bulkhead on top. Entrance is a
// double iron door on the 54th Street front (z 0, the north face) under a striped awning band. Glass panes sit one
// block out from the brick with an air gap behind each, sealed by brick and the storey lines (no interiors); a few
// panes have glowstone behind them. Footprint is 18 x 22, y 0 the lowest ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035749.cells.json`, "utf8"));
const X = 18, Y = 46, Z = 22;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const groundAt = (x, z) => cell.get(`${x},${z}`).ground;

// Roof tiers (block heights above y 0), flattened from the lidar's noisy 27-34: the north wing at 28, the south wing
// and the shoulder round the tower at 31, the tower at 34 (its lidar is 34 across the middle).
const roofAt = (x, z) => {
  if (!inFoot(x, z)) return 0;
  if (x >= 6 && x <= 11 && z >= 5 && z <= 12) return 34;
  if (z >= 13 || (x >= 5 && x <= 12 && z >= 4)) return 31;
  return 28;
};

// Outward faces: N = low z = the 54th Street front, S = rear, W/E = the side walls. [dx, dz] points out of the building.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACE_ORDER = ["N", "S", "W", "E"];
const open = (x, y, z) => !inFoot(x, z) || roofAt(x, z) <= y;
const exposedOn = (x, y, z, d) => { const [dx, dz] = DIRS[d]; return open(x + dx, y, z + dz); };

// An air pocket one block behind a glass face is a recess, not an opening, when all four of its neighbours are built at
// that height and the cell above is built too. Otherwise the pane stays with brick behind it.
const sealed = (x, y, z) =>
  FACE_ORDER.every((d) => { const [dx, dz] = DIRS[d]; return inFoot(x + dx, z + dz) && roofAt(x + dx, z + dz) > y; }) &&
  roofAt(x, z) > y + 1;

const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // a pane on a face along x
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // a pane on a face along z
const ENTRANCE = [7, 8];                                                                                // double door, piers at 6 and 9
const litPane = (u, y) => (u * 5 + y * 7) % 11 === 0;                                                   // sparse, deterministic warm windows

// What the outer block of one face is at height y. Storey lines at y = 1, 4, 7, ... (kickplate, then string courses);
// windows in the two rows between; piers every third block along the face; corbel and cornice at the top of each tier.
const faceRole = (x, y, z, d, T) => {
  const u = d === "N" || d === "S" ? x : z;
  if (d === "N" && ENTRANCE.includes(u) && (y === 1 || y === 2)) return { door: true, lower: y === 1, hinge: u === ENTRANCE[0] ? "left" : "right" };
  if (y <= 1) return { block: "polished_granite" };
  if (y >= T - 2) return { block: y === T - 1 ? "smooth_stone" : "calcite" };
  if ((y - 1) % 3 === 0) return { block: "calcite" };
  if (u % 3 === 0) return { block: y <= 3 ? "polished_granite" : "bricks" };   // granite piers frame the shopfront
  return { pane: true, state: d === "N" || d === "S" ? PANE_NS : PANE_EW };
};

const g = new Voxels([X, Y, Z]);
const cols = [...cell.keys()].map((k) => k.split(",").map(Number));

// 1. Solid mass: granite foundation below each cell's ground, brick to the roof, a tar roof cover on every top.
for (const [x, z] of cols) {
  const ground = groundAt(x, z), T = roofAt(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "polished_granite");
  for (let y = ground; y < T; y++) g.set(x, y, z, "bricks");
  g.set(x, T - 1, z, "gray_concrete");
}

// 2. Faces. The first open side (north, south, west, east) decides what that outer block is. Panes and door bays are
// collected and their air pockets cut last, so no face overwrites them.
const pockets = [];
for (const [x, z] of cols) {
  const ground = groundAt(x, z), T = roofAt(x, z);
  for (let y = ground; y < T; y++) {
    const d = FACE_ORDER.find((f) => exposedOn(x, y, z, f));
    if (!d) continue;
    const r = faceRole(x, y, z, d, T);
    if (r.door) {
      g.set(x, y, z, "iron_door", { facing: "north", half: r.lower ? "lower" : "upper", hinge: r.hinge, open: "false", powered: "false" });
      pockets.push({ x, y, z, d, glow: false });
    } else if (r.pane) {
      g.set(x, y, z, "glass_pane", r.state);
      pockets.push({ x, y, z, d, glow: litPane(d === "N" || d === "S" ? x : z, y) });
    } else {
      g.set(x, y, z, r.block);
    }
  }
}

// 3. Air behind the glass: a sealed one-block recess, with glowstone in some of them. The entrance pockets stay open
// to the lobby recess behind the doors, which is sealed the same way.
for (const { x, y, z, d, glow } of pockets) {
  const [dx, dz] = DIRS[d], ix = x - dx, iz = z - dz;
  if (!sealed(ix, y, iz)) continue;
  g.set(ix, y, iz, "air");
  if (glow) g.set(ix, y, iz, "glowstone");
}

// 4. Entrance awning: a striped band over the double door, flush with the 54th Street front at storey line y 4.
[6, 7, 8, 9].forEach((u, i) => g.set(u, 4, 0, i % 2 === 0 ? "red_concrete" : "white_concrete"));

// 5. Roof equipment: a mechanical bulkhead on the tower (2 blocks of brick, a limestone cap) and an HVAC box on the
// north wing, each standing on the roof cover below.
for (let x = 8; x <= 9; x++) for (let z = 7; z <= 9; z++) {
  g.set(x, 34, z, "bricks"); g.set(x, 35, z, "bricks"); g.set(x, 36, z, "calcite");
}
for (let x = 2; x <= 3; x++) for (let z = 1; z <= 2; z++) {
  g.set(x, 28, z, "light_gray_concrete"); g.set(x, 29, z, "light_gray_concrete");
}

const stats = g.save(`${DIR}/NYC1035749.nbt`);
console.log(`NYC1035749.nbt: ${stats.blocks} blocks, ${stats.palette} palette entries, ${X} x ${Y} x ${Z}`);
