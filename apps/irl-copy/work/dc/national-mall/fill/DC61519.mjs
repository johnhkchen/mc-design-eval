// DC61519: 1625 14th St NW, Logan Circle. A vacant red-brick commercial block of the early 1900s: a shopfront
// on the street face (z = 0, the north side), a two-storey wing with a three-storey core at the back, stone plinth,
// limestone storey bands and a smooth cornice. Shell only: a 1-block wall ring with an air gap behind the glass and a
// floor slab per storey; the core's upper walls step up from the wing roofs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC61519.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const W = 13, D = 8, H = 21;

const roof = new Map(), ground = new Map();
for (const [x, z, g, r] of cells) { roof.set(`${x},${z}`, r); ground.set(`${x},${z}`, g); }
const inFp = (x, z) => roof.has(`${x},${z}`);
const R = (x, z) => roof.get(`${x},${z}`) ?? 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// The faces of a cell that look out at y: a neighbour outside the footprint, or one whose roof is below y
function exposed(x, z, y) {
  return DIRS.filter(([dx, dz]) => { const nx = x + dx, nz = z + dz; return !inFp(nx, nz) || R(nx, nz) <= y; });
}

// Frontage: the street face is z = 0 (north). Storeys: windows at y 1-2, 4-5, 7-8; limestone bands at y 3 and 6;
// stone plinth at y 0; smooth cornice on the top course of each tier (y = roof - 1).
function shellBlock(x, z, y, r, ex) {
  const corner = ex.some(([dx]) => dx) && ex.some(([, dz]) => dz);
  if (y === 0) return { b: "stone_bricks" };
  if (y === r - 1) return { b: "smooth_stone" };
  if (y === 3 || y === 6) return { b: "calcite" };
  if (corner) return { b: "bricks" };
  const [dx] = ex[0];
  const shopfront = ex[0][1] === -1 && y <= 2;
  const run = dx ? z : x, max = dx ? D - 1 : W - 1;
  if (run % 3 === 0 || run === max) return { b: shopfront ? "dark_oak_planks" : "bricks" };   // piers
  return { b: "glass_pane", s: paneState(dx) };
}

// A pane in a wall whose normal runs along x joins its neighbours north and south; one along z joins east and west
function paneState(dx) {
  return dx
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
}

// Inside the shell: a floor slab per storey (y 3 and 6), the roof deck on top, and air between
function interiorBlock(y, r) {
  if (y === 0) return { b: "spruce_planks" };
  if (y === r - 1) return { b: "smooth_stone" };
  if (y === 3 || y === 6) return { b: "spruce_planks" };
  return null;
}

const v = new Voxels([W, H, D]);
const put = (x, y, z, { b, s }) => v.set(x, y, z, b, s);

for (const [x, z, g, r] of cells) {
  for (let y = 0; y < g; y++) put(x, y, z, { b: "stone" });                  // foundation under the lowest ground
  for (let y = g; y < r; y++) {
    const ex = exposed(x, z, y);
    const blk = ex.length ? shellBlock(x, z, y, r, ex) : interiorBlock(y, r);
    if (blk) put(x, y, z, blk);
  }
}

// Shopfront: boarded windows (vacant), a recessed-looking door on the street face, and a dark lintel over it
for (const x of [4, 8]) for (const y of [1, 2]) put(x, y, 0, { b: "oak_planks" });
for (const y of [1, 2]) {
  const half = y === 1 ? "lower" : "upper";
  put(1, y, 0, { b: "dark_oak_door", s: { facing: "north", half, hinge: "left", open: "false", powered: "false" } });
}
for (const x of [0, 1, 2]) put(x, 3, 0, { b: "dark_oak_planks" });

// Warm light behind the glass: lanterns on the shop floor, a glowstone and shroomlights on the storey floors
const lit = [
  [2, 1, 1, "lantern", { hanging: "false", waterlogged: "false" }],
  [10, 1, 1, "lantern", { hanging: "false", waterlogged: "false" }],
  [7, 2, 1, "glowstone"],
  [4, 5, 1, "shroomlight"],
  [8, 5, 1, "shroomlight"],
];
for (const [x, y, z, b, s] of lit) if (inFp(x, z) && v.get(x, y, z) === null) put(x, y, z, { b, s });

// Roof: HVAC units on the wing and the core, one brick stack on the core
for (const [x, z] of [[3, 2], [8, 2], [11, 4]]) if (inFp(x, z) && R(x, z) === 7) put(x, 7, z, { b: "iron_block" });
for (const [x, z] of [[5, 6], [8, 6]]) if (inFp(x, z) && R(x, z) === 9) put(x, 9, z, { b: "iron_block" });
if (inFp(7, 6) && R(7, 6) === 9) { put(7, 9, 6, { b: "bricks" }); put(7, 10, 6, { b: "bricks" }); put(7, 11, 6, { b: "stone_brick_slab", s: { type: "bottom", waterlogged: "false" } }); }

const out = v.save(`${DIR}/DC61519.nbt`);
console.log(`DC61519.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
