// Way 326664541, Mt Eden / Eden Terrace: a two-storey plastered commercial block of the 1920s-30s, the kind that
// lines Mt Eden and Dominion roads. Cream plaster walls, a dark stone string course and cornice, a grey tar roof behind
// a parapet, a timber-framed shopfront with a striped awning and a recessed door on its north (z = 0) front. The
// lidar's rear cells sit one block lower, so they read as a single-tier wing. Interior: a floor slab per storey, air
// between, and warm lights in some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326664541.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell
const g = new Voxels([8, 22, 14]);

const F = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => F.has(`${x},${z}`);

// the sides of a footprint cell that face outside the footprint (N = z-1, S = z+1, W = x-1, E = x+1)
const DIR = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.keys(DIR).filter((f) => !inF(x + DIR[f][0], z + DIR[f][1]));
// a cell one step inside the wall on face f
const inside = (x, z, f) => [x - DIR[f][0], z - DIR[f][1]];

// the front is the north side (z = 0): a shopfront with its door at x = 5 and glass at x = 4 and 6
const isFront = (x, z, ex) => ex.includes("N") && z === 0;
// window bays: on the front, glass at x 4 and 6; elsewhere two glass bays then a pier along the face (corners stay piers)
const isWindow = (x, z, face) => {
  if (face === "N" && z === 0) return x === 4 || x === 6;
  return (face === "N" || face === "S" ? x : z) % 3 !== 0;
};
// glass pane connecting along the wall it sits in
const pane = (face) => ({
  north: face === "W" || face === "E" ? "true" : "false",
  south: face === "W" || face === "E" ? "true" : "false",
  east: face === "N" || face === "S" ? "true" : "false",
  west: face === "N" || face === "S" ? "true" : "false",
});

const PLINTH = "polished_andesite", STRING = "smooth_stone", WALL = "smooth_quartz", FRAME = "dark_oak_planks";
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const lanternState = { hanging: "false", waterlogged: "false" };
const slabState = { type: "bottom", waterlogged: "false" };

const lights = [];   // [x, y, z, block, state] placed after the walls, inside the glass

for (const [x, z, ground, roof] of cells) {
  // foundation: solid from y 0 up to the cell's ground (zero on this lot, so nothing is added)
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  // roof tier: the deck is the top wall course (roof - 1), the parapet stands on it at roof, the coping at roof + 1
  const D = roof - 1;
  const ex = exposed(x, z);

  // interior cell: floor slabs at y 0 and y 4, the roof deck, air between
  if (ex.length === 0) {
    g.set(x, 0, z, "stone_bricks");
    g.set(x, 4, z, "spruce_planks");
    g.set(x, D, z, "gray_concrete");
    continue;
  }

  const face = ex.length === 1 ? ex[0] : null;   // a corner (two outside faces) is always a pier
  const win = face !== null && isWindow(x, z, face);
  const front = isFront(x, z, ex);
  const door = front && x === 5;

  for (let y = 0; y < D; y++) {
    if (door && (y === 1 || y === 2)) { g.set(x, y, z, "dark_oak_door", doorState(y === 1 ? "lower" : "upper")); continue; }
    let b = WALL, st;
    if (y === 0) b = PLINTH;
    if (y === 4) b = STRING;
    if (win && (y === 1 || y === 2 || y === 5 || y === 6)) { b = "glass_pane"; st = pane(face); }
    if (win && (y === 0 || y === 3 || y === 4 || y === 7)) b = FRAME;   // sills and heads: dark timber frames
    if (front && y === 3) b = x % 2 ? "red_concrete" : "white_concrete";   // the striped shopfront awning
    g.set(x, y, z, b, st);
  }

  // cornice on the top wall course, parapet and coping above the roof deck
  g.set(x, D, z, STRING);
  g.set(x, roof, z, WALL);
  g.set(x, roof + 1, z, "smooth_stone_slab", slabState);

  // warm light behind some glass: upper bays on the sides, and lanterns in the shop
  if (win) {
    const [ix, iz] = inside(x, z, face);
    if (inF(ix, iz) && exposed(ix, iz).length === 0) {
      if (front) lights.push([ix, 1, iz, "lantern", lanternState]);
      else if ((x + z) % 4 === 0) lights.push([ix, 5, iz, "glowstone"]);
    }
  }
}

for (const [x, y, z, b, st] of lights) g.set(x, y, z, b, st);

// roof plant on two interior cells of the main block: AC units on the deck
g.set(4, 9, 4, "iron_block");
g.set(5, 9, 2, "iron_block");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326664541.nbt";
console.log(g.save(out));
