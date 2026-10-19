// 42 West 48th Street, 1929 commercial and office building: a 16-storey Deco-era office block of pale terracotta
// and granite on a street wall of about ten storeys. Footprint 13 x 28 (x across the front, low z = north = the
// 48th Street frontage). Storeys are 3 blocks: base course on y 1, then each storey a granite storey line, a sill
// and a window row. The lidar roof is read as clean setbacks, not followed cell by cell: a 30-block street wall (27
// on the east), a 42/34 shoulder, the 50-block tower set back from the street, a 34 terrace and 23 and 6 rear wings.
// Party walls on the two sides stay blank below the 24-block roof of the rear wings. Glass sits in the window rows
// with a one-block air gap behind it and a solid floor slab in each storey (no interiors); some gaps hold glowstone.
// Ground floor: shopfront glass either side of an entrance (iron door, hanging lantern, granite band). The tower
// top has a parapet, a penthouse and four crown piers. 0 = nothing built.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034497.cells.json`, "utf8"));
const X = 13, Z = 28, Y = 56;

const inside = (x, z) => x >= 0 && x < X && z >= 0 && z < Z;

// Block tops (above y 0), smoothed from the lidar into clean tiers.
const top = (x, z) => {
  if (z <= 2) return x <= 5 ? 30 : 27;
  if (z <= 5) return x <= 5 ? 42 : 34;
  if (z <= 7) return x <= 5 ? 50 : 43;
  if (z <= 20) return 50;
  if (z === 21) return 48;
  if (z <= 23) return 34;
  if (z <= 25) return 23;
  return 6;
};

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// A pane on a face along x connects east and west; a pane on a face along z connects north and south.
const PANE = {
  N: { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" },
  S: { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" },
  W: { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" },
  E: { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" },
};
const lit = (x, y, z) => (x * 5 + y * 7 + z * 3) % 11 === 0;   // sparse, deterministic warm windows

// A neighbour is open at height y when it is outside the footprint or its top is at or below y.
const open = (x, y, z) => !inside(x, z) || top(x, z) <= y;
const exposed = (x, y, z) => Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return open(x + dx, y, z + dz); });

const g = new Voxels([X, Y, Z]);
const carve = [];   // the cell behind each pane, set after the solid mass so a later cell cannot fill it

// A window pane on face d of (x, y, z), with its air gap (or glowstone) one block in.
const pane = (x, y, z, d) => {
  const [dx, dz] = DIRS[d];
  g.set(x, y, z, "light_blue_stained_glass_pane", PANE[d]);
  carve.push([x - dx, y, z - dz, lit(x, y, z) ? "glowstone" : "air"]);
};

for (const [x, z, ground] of cells) {
  const T = top(x, z);
  for (let y = 0; y < T; y++) {
    if (y < ground) { g.set(x, y, z, "stone_bricks"); continue; }     // foundation
    const out = exposed(x, y, z);
    if (y === T - 1) { g.set(x, y, z, out.length ? "polished_granite" : "smooth_stone"); continue; }   // parapet or roof
    if (!out.length) { g.set(x, y, z, "stone"); continue; }             // solid core
    const d = out.includes("N") || out.includes("S") ? out.find((f) => f === "N" || f === "S") : out[0];
    const street = d === "N" || d === "S";
    const along = street ? x : z;     // position along the face: piers every third block
    if (y === 1) g.set(x, y, z, "polished_granite");                    // base course
    else if (y % 3 === 0) g.set(x, y, z, "polished_granite");           // storey line
    else if (y % 3 === 2 && (street || y >= 24) && along % 3 !== 0) pane(x, y, z, d);
    else g.set(x, y, z, "white_terracotta");                             // sill, pier, blank party wall
  }
}

// Entrance on the street front: iron door in the pier at x 6, a hanging lantern under the granite band.
g.set(6, 1, 0, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(6, 2, 0, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(6, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });

// Penthouse on the tower roof (x 4-8, z 10-16): three storeys of white terracotta with glass on the sides, granite cap.
for (let x = 4; x <= 8; x++) for (let z = 10; z <= 16; z++) for (let y = 50; y <= 52; y++) g.set(x, y, z, "white_terracotta");
for (let x = 4; x <= 8; x++) for (let z = 10; z <= 16; z++) {
  if (x === 4) { if (z % 3 !== 1) pane(x, 51, z, "W"); }
  else if (x === 8) { if (z % 3 !== 1) pane(x, 51, z, "E"); }
  else if (z === 10) { if (x % 3 !== 1) pane(x, 51, z, "N"); }
  else if (z === 16) { if (x % 3 !== 1) pane(x, 51, z, "S"); }
}
for (let x = 4; x <= 8; x++) for (let z = 10; z <= 16; z++) g.set(x, 53, z, "polished_granite");

// Four crown piers on the tower corners (2 x 2, 2 blocks over the parapet line), granite caps.
for (const [x0, z0] of [[0, 8], [0, 19], [11, 8], [11, 19]]) {
  for (let x = x0; x < x0 + 2; x++) for (let z = z0; z < z0 + 2; z++) {
    g.set(x, 50, z, "white_terracotta");
    g.set(x, 51, z, "white_terracotta");
    g.set(x, 52, z, "polished_granite");
  }
}

for (const [x, y, z, block] of carve) g.set(x, y, z, block);

g.save(`${DIR}/NYC1034497.nbt`);
