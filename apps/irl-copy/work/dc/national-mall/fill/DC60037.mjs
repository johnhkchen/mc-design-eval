import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// M St NW, vacant, abutting: a 1910s-20s masonry office block (red brick on a stone base, limestone belts and
// cornice), four storeys on the street with a central pavilion and a set-back fifth storey over the core.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC60037.cells.json`, "utf8"));

const W = 23, D = 17, H = 22;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;

// Lidar roof heights snapped to the massing: 18 = the set-back core and north pavilion (raw 18),
// 15 = the four-storey street wall (raw 15, and the raw 17 edge column that reads as noise),
// 2-3 = the one-storey rear annex (raw 2-3, and the raw 15 speck at its east end).
function snapRoof(z, raw) {
  if (raw >= 18) return 18;
  if (z >= 14) return raw <= 2 ? 2 : 3;
  return 15;
}
const top = new Map(), gnd = new Map();
for (const [x, z, gr, roof] of cells) { top.set(key(x, z), snapRoof(z, roof)); gnd.set(key(x, z), gr); }
const R = (x, z) => top.get(key(x, z));       // undefined outside the footprint

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const isEnvelope = (x, z, Rc) => Object.values(DIRS).some(([dx, dz]) => R(x + dx, z + dz) !== Rc);

// Storey lines: belts at 3, 7, 11 (and 15 over the core); windows in 4-5, 8-9, 12-13, 16 (core); floors on the same lines.
const BELTS = new Set([3, 7, 11]);
const BANDS = new Set([4, 5, 8, 9, 12, 13, 16]);
const FLOORS = [0, 3, 7, 11, 15];

// Where a wall cell at height y is open to the outside: a street (N/S) face, or a face that stands above a lower neighbour
// (the core's sides above the street wall). Returns the run coordinate u along the face and its orientation.
function exposure(x, z, y, Rc) {
  const n = R(x, z - 1), s = R(x, z + 1), w = R(x - 1, z), e = R(x + 1, z);
  const street = n === undefined ? "N" : s === undefined ? "S" : null;
  if (street === "N" && (y === 1 || y === 2 || BANDS.has(y))) return { u: x, along: "x", street };
  if (street === "S" && BANDS.has(y)) return { u: x, along: "x", street };
  if (BANDS.has(y)) {
    for (const [nb, u, along] of [[w, z, "z"], [e, z, "z"], [n, x, "x"], [s, x, "x"]])
      if (nb !== undefined && nb < Rc && y >= nb) return { u, along, street: null };
  }
  return null;
}

function wallBlock(x, z, y, Rc) {
  // ground: a stone base; belts and the cornice are limestone
  if (y === 0) return ["stone_bricks"];
  if (y === Rc - 1 || BELTS.has(y) || (Rc === 18 && y === 15)) return ["calcite"];
  // the core's wall where it leaves the street roof: a limestone coping at the roof line, not a brick patch in the deck
  if (Rc === 18 && y === 14 && Object.values(DIRS).some(([dx, dz]) => R(x + dx, z + dz) === 15)) return ["calcite"];
  const ex = exposure(x, z, y, Rc);
  if (ex) {
    if (ex.u % 3 === 0) return ["stone_bricks"];                      // mullion / pier between glass bays
    const pane = ex.along === "x"
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    return ["light_gray_stained_glass_pane", pane];
  }
  return ["bricks"];
}

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const Rc = R(x, z);
  const env = isEnvelope(x, z, Rc);
  for (let y = 0; y < Rc; y++) {
    if (env) {
      const [block, state] = wallBlock(x, z, y, Rc);
      g.set(x, y, z, block, state);
    } else if (y === Rc - 1 || (FLOORS.includes(y) && y <= Rc - 2)) {
      g.set(x, y, z, "smooth_stone");                                  // floor slab per storey, flat roof deck on top
    }
  }
}

// Central entrance on the street front: a pair of doors in the pavilion, stone piers, a dark canopy and hanging lanterns.
const door = (y, hinge) => ({ facing: "north", half: y === 1 ? "lower" : "upper", hinge, open: "false", powered: "false" });
for (let x = 9; x <= 13; x++) {
  g.set(x, 3, 0, "dark_oak_slab", { type: "top", waterlogged: "false" });   // canopy over the doorway
}
g.set(11, 1, 0, "dark_oak_door", door(1, "left"));
g.set(11, 2, 0, "dark_oak_door", door(2, "left"));
g.set(12, 1, 0, "dark_oak_door", door(1, "right"));
g.set(12, 2, 0, "dark_oak_door", door(2, "right"));
for (const x of [10, 13]) g.set(x, 1, 0, "stone_bricks");
g.set(9, 1, 0, "stone_bricks");
g.set(9, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });
g.set(13, 2, 0, "lantern", { hanging: "true", waterlogged: "false" });
g.set(11, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });   // lobby lamp, just inside the door

// Warm lamps standing on the storey floors behind some street windows.
for (const [x, y] of [[2, 4], [14, 4], [20, 4], [5, 8], [17, 8]]) g.set(x, y, 1, "lantern", { hanging: "false", waterlogged: "false" });

// Roof equipment: a plant box on the street wall's roof, a penthouse on the core.
for (let x = 5; x <= 7; x++) for (let z = 2; z <= 3; z++) for (const y of [15, 16]) g.set(x, y, z, "light_gray_concrete");
for (let x = 7; x <= 9; x++) for (let z = 6; z <= 7; z++) for (const y of [18, 19]) g.set(x, y, z, "gray_concrete");

g.save(`${DIR}/DC60037.nbt`);
console.log("DC60037.nbt written:", g.count(), "blocks");
