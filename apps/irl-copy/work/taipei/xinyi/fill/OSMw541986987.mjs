import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541986987";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 10 x 22; roof about 11 blocks above lowest ground.
// Read as a two-storey, flat-roofed concrete-and-glass commercial block
// (1980s-90s Taipei shophouse-style): stone base, shopfront below a dark
// fascia, two window storeys with light concrete spandrels, a parapet and roof plant.
const W = 10, H = 23, D = 22;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

const minX = Math.min(...cells.map(c => c[0]));
const maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));
const maxZ = Math.max(...cells.map(c => c[1]));
const maxG = Math.max(...cells.map(c => c[2]));

// Global storey plan: roof deck R, upper floor F (5 blocks below roof)
const R = Math.max(10, maxG + 10);
const F = R - 5;

const FACES = {
  W: [-1, 0, [1, 0]],
  E: [1, 0, [-1, 0]],
  N: [0, -1, [0, 1]],
  S: [0, 1, [0, -1]],
};

function faceOf(x, z) {
  for (const f of ["W", "E", "N", "S"]) {
    const [dx, dz] = FACES[f];
    if (!ground.has(key(x + dx, z + dz))) return f;
  }
  return null;
}

// Entrance: middle of the south (z = maxZ) facade
let doorCell = null;
const southCells = cells.filter(c => c[1] === maxZ).sort((a, b) => a[0] - b[0]);
if (southCells.length) {
  const mid = minX + Math.floor(W / 2);
  doorCell = southCells.find(c => c[0] === mid) || southCells[Math.floor(southCells.length / 2)];
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Floor slabs: ground floor, upper floor, roof deck
  g.set(x, gr, z, "stone");
  g.set(x, F, z, "stone");
  g.set(x, R, z, "stone");

  const face = faceOf(x, z);
  if (!face) continue; // interior of footprint: air gap, no walls

  const [, , inward] = FACES[face];
  const a = (face === "W" || face === "E") ? (z - minZ) : (x - minX);
  const pier = a % 3 === 0;

  // Wall body
  for (let y = gr + 1; y <= R - 1; y++) {
    if (y === F) continue;
    g.set(x, y, z, "white_concrete");
  }

  // Storey line at upper floor level
  g.set(x, F, z, "light_gray_concrete");

  // Ground storey: stone base, shopfront glazing with piers, dark fascia
  g.set(x, gr + 1, z, "stone_bricks");
  for (let y = gr + 2; y <= F - 2; y++) {
    g.set(x, y, z, pier ? "light_gray_concrete" : "glass_pane");
  }
  g.set(x, F - 1, z, "dark_oak_planks");

  // Upper storey: sill, glazed panes between piers, head band
  g.set(x, F + 1, z, "light_gray_concrete");
  for (let y = F + 2; y <= R - 2; y++) {
    g.set(x, y, z, pier ? "light_gray_concrete" : "glass_pane");
  }
  g.set(x, R - 1, z, "light_gray_concrete");

  // Parapet with cap
  g.set(x, R + 1, z, "light_gray_concrete");

  // Warm light behind some glass (air gap cell just inside the facade)
  if (!pier && a % 6 === 1) {
    const ix = x + inward[0], iz = z + inward[1];
    if (ground.has(key(ix, iz)) && !faceOf(ix, iz)) {
      g.set(ix, gr + 2, iz, "glowstone");
      g.set(ix, F + 2, iz, "glowstone");
    }
  }
}

// Entrance door on the south facade, with stone surround
if (doorCell) {
  const [dx, dz, dg] = doorCell;
  const yd = dg + 1;
  g.set(dx, yd, dz, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, yd + 1, dz, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lintel over the door in the fascia course
  g.set(dx, F - 1, dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Roof plant: a few small AC enclosures on the roof deck, inside the parapet
for (const [x, z] of cells) {
  if (faceOf(x, z)) continue;
  if ((x - minX) % 4 === 2 && (z - minZ) % 6 === 3) {
    g.set(x, R + 1, z, "light_gray_concrete");
    g.set(x, R + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
