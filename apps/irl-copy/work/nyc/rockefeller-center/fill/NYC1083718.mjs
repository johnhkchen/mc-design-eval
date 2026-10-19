// 701 Seventh Avenue, 1909: a Renaissance Revival commercial loft. Red brick on the upper floors, pale stone string
// courses and a stone cap, a granite base and a glazed shopfront on the street. The lidar roof is smoothed into flat
// tiers of 3-block storeys (6, 9 or 12 high); each column stands on the ground and every tier sits on the one below.
// Cells: [x, z, ground, roof]. x 0 is the street (front) face, x 1 the rear. Window bays are 3 blocks along z: a brick
// pier, then two panes. Front panes sit in front of an air gap, so lanterns and glowstone light the room behind them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1083718.cells.json`, "utf8"));
const X = 2, Z = 28, Y = 24;
const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const roofAt = (x, z) => cell.get(`${x},${z}`)?.roof ?? 0;

// Lidar roof -> storey tier. Lidar 0 (no return) takes its neighbours' mean; then a median of three along z
// removes single-cell bumps so each tier runs as a flat strip.
const tierOf = (h) => (h >= 11 ? 12 : h >= 8 ? 9 : 6);
const median3 = (a, b, c) => [a, b, c].sort((p, q) => p - q)[1];
const tier = [[], []];
for (let x = 0; x < X; x++) {
  const raw = [];
  for (let z = 0; z < Z; z++) {
    const r = roofAt(x, z) || (roofAt(x, z - 1) + roofAt(x, z + 1)) / 2;
    raw.push(tierOf(r));
  }
  tier[x] = raw.map((t, z) => (z === 0 || z === Z - 1 ? t : median3(raw[z - 1], t, raw[z + 1])));
}

const PANE = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const DOOR = { facing: "west", hinge: "left", open: "false", powered: "false" };

// The block (name, state?) at height y in a cell of tier T, or null for air.
function blockAt(x, y, z, T) {
  const front = x === 0, pier = z % 3 === 0;
  if (y === T - 1) return ["smooth_stone"];                       // cornice cap
  if (y === 0) return [front ? "polished_granite" : "stone_bricks"];  // base course
  if (y % 3 === 0) return ["smooth_stone"];                        // floor string course (the sill below each window)
  const k = Math.floor(y / 3);                                     // storey: rows 3k+1 and 3k+2 are the window band
  if (k === 0) {                                                   // shopfront
    if (!front) return ["stone_bricks"];
    if (pier) return ["polished_granite"];
    if (z === 14) return ["dark_oak_door", { ...DOOR, half: y === 1 ? "lower" : "upper" }];
    return ["glass"];
  }
  if (front) return pier ? ["bricks"] : ["glass_pane", PANE];
  if (pier) return ["bricks"];
  // Rear window recess: air, with a warm light on the floor for some windows (lit rooms show through the glass).
  if (y === 3 * k + 1) {
    const s = (z + k) % 5;
    if (s === 1) return ["lantern", { hanging: "false", waterlogged: "false" }];
    if (s === 3) return ["glowstone"];
  }
  return null;
}

const g = new Voxels([X, Y, Z]);
let filled = 0;
for (const [key, { ground, roof }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const T = tier[x][z];
  for (let y = 0; y < ground; y++) { g.set(x, y, z, "stone_bricks"); filled++; }   // foundation (none here: ground is 0)
  for (let y = 0; y < T; y++) {
    const b = blockAt(x, y, z, T);
    if (!b) continue;
    g.set(x, y, z, b[0], b[1]); filled++;
  }
}

// Roof equipment, standing on the cap: two rooftop units on the 9-tier roof.
for (let x = 0; x < X; x++) for (const z of [17, 18]) if (tier[x][z] === 9) g.set(x, 9, z, "iron_block");

const out = `${dir}/NYC1083718.nbt`;
const { blocks, palette } = g.save(out);
console.log(JSON.stringify({ out, blocks, palette, cells: cell.size, filled, tierFront: tier[0].join(""), tierBack: tier[1].join("") }));
