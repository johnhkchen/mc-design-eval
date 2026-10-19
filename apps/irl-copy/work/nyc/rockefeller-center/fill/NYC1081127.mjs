// 21 West 53rd Street, 1963 office block (Public Facilities & Institutions). Footprint 37 x 27 (x across the front,
// low z = north). Massing read from the lidar roof as clean tiers: a 24-block (8-storey) street base in limestone-
// coloured concrete that wraps the west and south sides, an 18-block (6-storey) wing at the north-west, a 12-block
// (4-storey) low wing along the south street, and a 33-block (11-storey) slab tower on the east half. The tower
// steps in at the top: its outer two-block ring stops at 30 and its core rises to 33, so the roof reads as a setback.
// Facades are a 3-block storey rhythm: a light spandrel course, then two blocks of blue-glass panes between dark
// mullions, with a shopfront at ground level (dark kickplate, panes) and a recessed lobby with a dark bronze-look
// door on the south face. Panes sit at the face with air behind them (no interiors), and some panes show warm light
// from glowstone and shroomlight set just behind. Each storey stands on the one below, and every block of the massing
// sits on the ground or the tier below. Footprint cells with no lidar roof are a one-block paved plinth (no floating).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1081127.cells.json`, "utf8"));
const X = 37, Y = 40, Z = 27;

const lidarAt = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && lidarAt.has(`${x},${z}`);
const lidar = (x, z) => (inFoot(x, z) ? lidarAt.get(`${x},${z}`).roof : 0);

// Clean tiers from the lidar: the tower region (lidar 29+) is set apart; the rest snaps to the nearest storey line.
const isTower = (x, z) => inFoot(x, z) && lidar(x, z) >= 29;
const tallCore = (x, z) => { for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (!isTower(x + dx, z + dz)) return false; return true; };
const tierOf = (x, z) => {
  const r = lidar(x, z);
  if (r >= 29) return tallCore(x, z) ? 33 : 30;   // tower core 33, outer two-block ring stepped down to 30
  if (r >= 20) return 24;                          // street base, 8 storeys
  if (r >= 15) return 18;                          // north-west wing, 6 storeys
  if (r >= 9) return 12;                           // south low wing, 4 storeys
  if (r >= 3) return 3;                            // one-storey pavilion
  return 1;                                        // open paved plinth
};

const topArr = Array.from({ length: Z }, (_, z) => Array.from({ length: X }, (_, x) => (inFoot(x, z) ? tierOf(x, z) : 0)));
const top = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? 0 : topArr[z][x]);
const inMass = (x, y, z) => y < top(x, z);

const STONE = "white_concrete", SPANDREL = "light_gray_concrete", MULLION = "gray_concrete";
const PANE = "light_blue_stained_glass_pane", KICK = "polished_blackstone", CAP = "smooth_stone";
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // N, S, W, E: [dx, dz] points out of the building
const lit = (x, y, z) => (x * 5 + y * 7 + z * 3) % 13 === 0;
const shroom = (x, y, z) => (x * 3 + y * 5 + z * 7) % 41 === 0;

const g = new Voxels([X, Y, Z]);

// Massing: solid from y 0 up to each cell's tier (foundation included), capped with stone at the top course.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const h = top(x, z);
  for (let y = 0; y < h; y++) g.set(x, y, z, y === h - 1 ? CAP : STONE);
}

// Facades: every mass cell with a face to air gets the storey pattern; corners and mullion columns stay solid.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const h = top(x, z);
  for (let y = 0; y < h - 1; y++) {
    const out = DIRS.filter(([dx, dz]) => !inMass(x + dx, y, z + dz));
    if (out.length === 0) continue;
    if (y === 0) { g.set(x, y, z, KICK); continue; }
    if (y % 3 === 0) { g.set(x, y, z, SPANDREL); continue; }
    const [dx, dz] = out[0];
    const u = dz !== 0 ? x : z;   // position along the face
    if (out.length > 1 || u % 3 === 0) { g.set(x, y, z, MULLION); continue; }
    const axisX = dz !== 0;       // a pane on a face along x joins east and west
    g.set(x, y, z, PANE, axisX
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    const bx = x - dx, bz = z - dz;   // air behind the glass, warm light in some windows
    if (!inMass(bx, y, bz)) continue;
    if (lit(x, y, z)) g.set(bx, y, bz, "glowstone");
    else if (shroom(x, y, z)) g.set(bx, y, bz, "shroomlight");
    else g.set(bx, y, bz, "air");
  }
}

// South street entrance: a recessed two-leaf dark bronze-look door in a stone surround, lobby air behind it.
for (let y = 0; y <= 2; y++) { g.set(14, y, 26, KICK); g.set(17, y, 26, KICK); }
for (const x of [15, 16]) g.set(x, 2, 26, KICK);
const doorState = (hinge, half) => ({ facing: "north", half, hinge, open: "false", powered: "false" });
g.set(15, 0, 26, "dark_oak_door", doorState("left", "lower"));
g.set(15, 1, 26, "dark_oak_door", doorState("left", "upper"));
g.set(16, 0, 26, "dark_oak_door", doorState("right", "lower"));
g.set(16, 1, 26, "dark_oak_door", doorState("right", "upper"));
for (const x of [15, 16]) for (const y of [0, 1]) g.set(x, y, 25, "air");

// Roof equipment: a plant house on the tower's core, and a moss-carpet garden on the street base's roof.
for (let y = 33; y <= 34; y++) for (let z = 11; z <= 14; z++) for (let x = 23; x <= 27; x++) g.set(x, y, z, SPANDREL);
for (let z = 11; z <= 14; z++) for (let x = 23; x <= 27; x++) g.set(x, 35, z, CAP);
for (let z = 3; z <= 6; z++) for (let x = 4; x <= 10; x++) if (top(x, z) === 24) g.set(x, 24, z, "moss_carpet");

const out = `${DIR}/NYC1081127.nbt`;
const { blocks, palette } = g.save(out);
console.log(`wrote ${out}: ${blocks} blocks, ${palette} palette entries`);
