import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1785 Massachusetts Ave NW, McCormick Apartments: a red brick apartment block of the early 20th century on a stone base,
// with a taller core tower over a podium and a low wing at the south-west corner. The lidar roof record reads as three
// tiers: the core at 13 (inside x 6..11, z 6..10), the podium at 11, the wing at 9; the single-cell lidar spikes fall to the podium.
// Storeys are 2-block modules: a glass row between calcite string courses, the ground floor a shopfront with a central door.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC57042.cells.json`, "utf8")); // [x, z, ground, roof] per footprint cell

const X = 14, Y = 25, Z = 19;
const g = new Voxels([X, Y, Z]);

const roof = new Map(cells.map(([x, z, ground, r]) => [`${x},${z}`, { ground, r }]));
const CORE = { x0: 6, x1: 11, z0: 6, z1: 10 };
const DOOR_X = 7; // the street face is z = 0, the door sits in its middle

// the tier top of a footprint cell (0 outside it): 13 for the core, 9 for the wing, 11 for the podium
function topOf(x, z) {
  const c = roof.get(`${x},${z}`);
  if (!c) return 0;
  if (x >= CORE.x0 && x <= CORE.x1 && z >= CORE.z0 && z <= CORE.z1 && c.r >= 12) return 13;
  return c.r <= 9 ? 9 : 11;
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the outward sides a cell at height y is exposed on: no neighbour there, or a neighbour that stops below y
function outward(x, z, y) {
  return DIRS.filter(([dx, dz]) => {
    const n = topOf(x + dx, z + dz);
    return n === 0 || n <= y;
  });
}

// the storey rhythm: solid string courses at 3, 5, 7, 9, 10 (the podium roof deck), glass rows at 2, 4, 6, 8, 11
const SLAB = new Set([3, 5, 7, 9, 10]);
const door = (y) => ({ id: "dark_oak_door", state: { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } });

// what a footprint cell holds at height y, or null for air
function cellAt(x, z, y) {
  const top = topOf(x, z);
  if (!top || y >= top) return null;
  const out = outward(x, z, y);
  const edge = out.length > 0;
  if (y === 0) return { id: edge ? "stone_bricks" : "stone" };          // plinth on the lowest ground
  if (y === top - 1) return { id: edge ? "calcite" : "smooth_stone" };  // cornice ring and roof deck
  if (SLAB.has(y)) return { id: edge ? "stone_bricks" : "stone" };     // storey string course and floor slab
  if (!edge) return null;                                              // air: the gap behind the glass
  if (out.length > 1) return { id: "calcite" };                        // quoined corners

  const [dx, dz] = out[0];
  const front = dz === -1 && z === 0;
  if (front && y <= 2 && Math.abs(x - DOOR_X) <= 1) {                  // entrance: two doors between calcite pilasters
    if (x === DOOR_X) return door(y);
    return { id: "calcite" };
  }
  if (y === 1) return { id: "stone_bricks" };                          // base course

  const alongX = dz !== 0;                                             // a north or south face: its panes join east-west
  const i = alongX ? x : z;
  if (i % 3 === 0) return { id: y === 2 ? "calcite" : "bricks" };      // piers
  if (y === 2) return { id: "glass" };                                 // shopfront glass
  const join = alongX
    ? { east: "true", west: "true", north: "false", south: "false" }
    : { north: "true", south: "true", east: "false", west: "false" };
  return { id: "glass_pane", state: join, lit: (i + y) % 4 === 0 ? { dx, dz } : null };
}

let lit = 0;
for (const [x, z] of cells) {
  for (let y = 0; y < 14; y++) {
    const b = cellAt(x, z, y);
    if (!b) continue;
    g.set(x, y, z, b.id, b.state);
    if (b.lit) {
      // a warm window: glowstone in the air gap just inside the glass
      const ix = x - b.lit.dx, iz = z - b.lit.dz;
      if (topOf(ix, iz) > y) { g.set(ix, y, iz, "glowstone"); lit++; }
    }
  }
}

// the tower's roof: lanterns on the four corners of the deck
for (const [x, z] of [[6, 6], [11, 6], [6, 10], [9, 10]]) g.set(x, 13, z, "lantern", { hanging: "false" });

// a lantern in the entrance hall, hung from the string course over the door
g.set(DOOR_X, 2, 1, "lantern", { hanging: "true" });

// rooftop plant on the podium: a 2 x 2 penthouse of light concrete with an iron grille on top
for (const [x, z] of [[3, 12], [4, 12], [3, 13], [4, 13]]) {
  g.set(x, 11, z, "light_gray_concrete");
  g.set(x, 12, z, "iron_bars", { north: "false", south: "false", east: "false", west: "false" });
}

const { blocks, palette } = g.save(`${DIR}/DC57042.nbt`);
console.log(`DC57042: ${blocks} blocks, ${palette} palette entries, ${lit} lit windows`);
