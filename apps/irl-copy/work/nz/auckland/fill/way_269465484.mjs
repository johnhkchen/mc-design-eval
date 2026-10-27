// Way 269465484: a 1930s brick commercial block on the Mt Eden side. The lidar roof is flat at 10 on 508 of 511 cells (the
// other three are single-cell noise, snapped to it), so the massing is one flat-roofed block over a sloping site: the storey
// lines follow each column's own ground, two storeys where the ground falls east and one tall storey where it rises west.
// Articulation: a plinth, quartz string courses, brick piers between glass windows with quartz heads, a striped shopfront
// on the north street wall with the entrance, a quartz cornice and brick parapet to 11, a plant room on the roof, and
// lanterns in some windows. Air behind every pane; a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269465484.cells.json`, "utf8"));
const g = new Voxels([34, 23, 23]);

const ROOF = 10;             // the flat roof tier, lidar height above y 0
const SLAB = ROOF - 1;       // roof slab row; the cornice sits on it at the outer walls
const MAT = {
  found: "stone_bricks", base: "polished_andesite", wall: "bricks", trim: "smooth_quartz", floor: "smooth_stone",
  roof: "smooth_stone", plant: "stone_bricks", plantCap: "stone_brick_slab", pane: "glass_pane", door: "dark_oak_door",
  lantern: "lantern", awnRed: "red_terracotta", awnWhite: "white_terracotta",
};
const NAME = { N: "north", S: "south", E: "east", W: "west" };
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const inside = (x, z) => ground.has(`${x},${z}`);
// the sides of a footprint cell that open to outside the footprint: its outer wall
const outsideSides = (x, z) => Object.keys(DIRS).filter((d) => !inside(x + DIRS[d][0], z + DIRS[d][1]));
// the wall a cell stands on: north or south walls run along x, east and west walls along z
const primaryFace = (x, z) => {
  const s = outsideSides(x, z);
  return s.find((d) => d === "N" || d === "S") ?? s[0];
};
// storey lines of a column: its slab at its own ground, a floor 4 up while two air rows stay under the roof slab, then the roof slab
const bandsOf = (gr) => {
  const slabs = [gr];
  if (gr + 4 <= SLAB - 3) slabs.push(gr + 4);
  return slabs.map((slab, i) => ({ slab, b0: slab + 1, b1: (i + 1 < slabs.length ? slabs[i + 1] : SLAB) - 1 }));
};

// the entrance: on the north (street) wall, at the middle of its run, with a ground band tall enough for a door and a head
const fitsDoor = ([x, z, gr]) => outsideSides(x, z).includes("N") && bandsOf(gr)[0].b1 - bandsOf(gr)[0].b0 >= 2;
const northCells = cells.filter(fitsDoor);
const midX = northCells.map((c) => c[0]).sort((a, b) => a - b)[Math.floor(northCells.length / 2)];
const [doorX, doorZ] = northCells.reduce((best, c) => {
  const db = Math.abs(best[0] - midX), dc = Math.abs(c[0] - midX);
  return dc < db || (dc === db && c[1] < best[1]) ? c : best;
});
const doorKey = `${doorX},${doorZ}`;

const P = new Map();   // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => P.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => P.get(`${x},${y},${z}`);

for (const [x, z, gr] of cells) {
  const sides = outsideSides(x, z), perim = sides.length > 0, street = sides.includes("N");
  const idx = primaryFace(x, z) === "N" || primaryFace(x, z) === "S" ? x : z;   // position along the wall
  const bands = bandsOf(gr);

  for (let y = 0; y < gr; y++) put(x, y, z, MAT.found);                     // foundation up to the cell's own ground
  bands.forEach(({ slab, b0, b1 }, bi) => {
    const shop = street && bi === 0;                                           // the north wall's ground storey is a shopfront
    const pier = shop ? idx % 4 === 0 : idx % 3 === 0;
    put(x, slab, z, !perim ? MAT.floor : bi === 0 ? MAT.base : MAT.trim);   // plinth course, then string courses
    if (!perim) return;
    for (let y = b0; y <= b1; y++) {
      if (y === b1) put(x, y, z, pier ? MAT.wall : shop ? (x % 2 ? MAT.awnRed : MAT.awnWhite) : MAT.trim);   // head or awning
      else if (pier) put(x, y, z, MAT.wall);
      else put(x, y, z, MAT.pane, null);                                      // panes get their connections below
    }
  });
  if (`${x},${z}` === doorKey) {
    const b0 = bands[0].b0, hinge = "left";
    put(x, b0, z, MAT.door, { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
    put(x, b0 + 1, z, MAT.door, { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  }

  put(x, SLAB, z, perim ? MAT.trim : MAT.roof);                               // roof slab, cornice at the edge
  if (perim) put(x, ROOF, z, idx % 3 === 0 ? MAT.trim : MAT.wall);           // brick parapet with quartz piers to 11
}

// warm lights: a lantern on the floor just inside some windows, in the air gap, so nothing touches the glass
for (const [x, z, gr] of cells) {
  if (!outsideSides(x, z).length) continue;
  const face = primaryFace(x, z), [dx, dz] = DIRS[face], bands = bandsOf(gr);
  const inward = [x - dx, z - dz];
  if (!inside(...inward)) continue;
  bands.forEach(({ b0 }, bi) => {
    if (at(x, b0, z)?.block !== MAT.pane || (x * 5 + z * 3 + bi) % 4 !== 0) return;
    if (JSON.stringify(bandsOf(ground.get(`${inward[0]},${inward[1]}`))) !== JSON.stringify(bands)) return;
    if (!at(inward[0], b0, inward[1])) put(inward[0], b0, inward[1], MAT.lantern, { hanging: "false", waterlogged: "false" });
  });
}

// the plant room on the roof: a 3 x 2 box of stone brick with a slab cap, set in from the parapet nearest the middle
const deep = (x, z) => [-1, 0, 1].every((a) => [-1, 0, 1].every((b) => inside(x + a, z + b)));
const boxAt = (x, z) => [0, 1, 2].every((a) => [0, 1].every((b) => deep(x - 1 + a, z + b)));
let box = null;
for (const [x, z] of cells) {
  if (boxAt(x, z) && (!box || Math.hypot(x - 22, z - 11) < Math.hypot(box[0] - 22, box[1] - 11))) box = [x, z];
}
if (box) {
  for (const a of [0, 1, 2]) for (const b of [0, 1]) {
    const X = box[0] - 1 + a, Z = box[1] + b;
    put(X, ROOF, Z, MAT.plant);
    put(X, ROOF + 1, Z, MAT.plantCap, { type: "bottom", waterlogged: "false" });
  }
}

// glass panes connect to the solid blocks beside them in the same course, as the wall they sit in
const nonConnecting = new Set([MAT.lantern, MAT.door]);
for (const [key, v] of P) {
  if (v.block !== MAT.pane) continue;
  const [x, y, z] = key.split(",").map(Number);
  const state = { waterlogged: "false" };
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const n = at(x + dx, y, z + dz);
    state[NAME[d]] = String(!!n && !nonConnecting.has(n.block));
  }
  v.state = state;
}

for (const [key, { block, state }] of P) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state ?? undefined);
}
const { blocks, palette } = g.save(`${DIR}/way_269465484.nbt`);
console.log(`way_269465484: ${blocks} blocks, palette ${palette}, door at ${doorKey}, plant room at ${box}`);
