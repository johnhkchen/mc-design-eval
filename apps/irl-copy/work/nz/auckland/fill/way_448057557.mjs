// A 1920s Auckland shop-and-office block (Stripped Classical, cement-rendered over brick): a tall three-storey
// street front on the two rows nearest the street (roof 14), a one-storey wing behind it (roof 5), and a small stair
// core on the wing's back row (roof 8). Ground floor is a timber shopfront under a dark fascia; the upper storeys
// are sash-style glass bays between cream pilasters, with string courses, a chiselled cornice and a parapet.
// Glass is backed by an air cell, so a warm light sits behind some panes; the floor and roof are solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_448057557.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 13, Z = 6, Y = 27;

// lidar roof heights by cell, then smoothed: a 3-cell median along each row takes out single-cell spikes (the 7 and
// the 6 in the wing row), and the result snaps to three flat tiers: 14 (front), 8 (stair core), 5 (wing)
const raw = Array.from({ length: Z }, () => new Array(X).fill(0));
for (const [x, z, , roof] of cells) raw[z][x] = roof;
const med3 = (a, b, c) => [a, b, c].sort((p, q) => p - q)[1];
const tier = (r) => (r >= 11 ? 14 : r >= 7 ? 8 : 5);
const R = raw.map((row) => row.map((r, x) => tier(med3(row[Math.max(0, x - 1)], r, row[Math.min(X - 1, x + 1)]))));

const PIER = [0, 4, 8, 12];          // cream pilasters, quartz pillars
const BAYS = [1, 3, 5, 7, 9, 11];    // glazed cells in the bays
const MULL = [2, 6, 10];             // dark timber mullions
const WIN_ROWS = [1, 2, 5, 6, 9, 10];// shopfront (1-2) and storeys 2 and 3 (5-6, 9-10)
const BAND_ROWS = [4, 8, 12];        // string courses / floor lines and the cornice

// air cells behind the glass (the carved interior), keyed "x,y,z"
const air = new Set();
for (const y of WIN_ROWS) {
  for (const x of BAYS) air.add(`${x},${y},1`);                  // street front, behind the bay glass
  for (const x of [1, 3, 9, 11]) air.add(`${x},${y},4`);         // wing back, behind the rear glass
  for (const z of [3, 4]) air.add(`1,${y},${z}`), air.add(`11,${y},${z}`); // wing sides, behind the side glass
}

const g = new Voxels([X, Y, Z]);
const carvedKey = (x, y, z) => `${x},${y},${z}`;

// the block for a solid cell (outside the air set), from its role
function solidBlock(x, y, z, r) {
  if (y === 0) return ["polished_andesite"];                     // base course
  if (y === r - 1) {                                             // the roof of each tier
    if (r === 14) return ["smooth_quartz"];                      // parapet
    if (r === 5 && z === 5) return ["smooth_quartz"];            // rear coping
    return ["stone"];                                            // flat roof membrane
  }
  if (r === 14) {                                                // the street front
    if (z === 0 && y === 3) return PIER.includes(x) ? ["quartz_pillar", { axis: "y" }] : ["dark_oak_planks"];  // fascia
    if (PIER.includes(x)) return ["quartz_pillar", { axis: "y" }];
    if (z === 0 && WIN_ROWS.includes(y)) {
      if (x === 1 && y <= 2) return null;                        // the shop door, set below
      if (BAYS.includes(x)) return ["glass_pane"];
      if (MULL.includes(x)) return ["dark_oak_planks"];
    }
    if (BAND_ROWS.includes(y)) return ["chiseled_quartz_block"];
  }
  if (r === 5 && z >= 3 && z <= 5 && (x === 0 || x === 12) && y <= 2) return ["glass_pane"]; // wing side glass
  if (r === 5 && z === 5 && y <= 2) {                            // wing rear: glass bays and timber mullions
    if (BAYS.includes(x) && [1, 3, 9, 11].includes(x)) return ["glass_pane"];
    if (x === 2 || x === 10) return ["dark_oak_planks"];
  }
  return ["smooth_quartz"];
}

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const r = R[z][x];
  for (let y = 0; y < r; y++) {
    if (air.has(carvedKey(x, y, z))) continue;
    const b = solidBlock(x, y, z, r);
    if (b) g.set(x, y, z, b[0], b[1]);
  }
}

// shopfront door (two halves), facing the street (north)
g.set(1, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(1, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// rooftop plant on the wing: two air-conditioning units on the membrane
g.set(2, 5, 3, "iron_block"); g.set(3, 5, 3, "iron_block");

// warm light behind some panes (in the air cells)
g.set(5, 6, 1, "glowstone");
g.set(9, 10, 1, "glowstone");
g.set(1, 6, 1, "shroomlight");
g.set(9, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });
g.set(3, 1, 4, "lantern", { hanging: "false", waterlogged: "false" });
g.set(9, 1, 4, "glowstone");

const out = `${DIR}/way_448057557.nbt`;
const res = g.save(out);
console.log(`wrote ${out}: ${res.blocks} blocks, ${res.palette} palette entries`);
