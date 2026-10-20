import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded 2-storey commercial block, 21 x 21 footprint, roof at 11 blocks.
// Era read: 1980s-90s Taipei low-rise commercial. Stone base, white wall with
// smooth quartz piers, glazed ground-storey shopfront, a central entrance on the
// south face, a parapet, and roof plant on a light-gray deck.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833627";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const TOP = 10;      // top of second storey / roof deck
const PARAPET = 11;  // parapet course on the roof edge
const BAND = 5;      // storey line between the two floors

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isRing = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

for (const [x, z, gr0] of cells) {
  // Keep the storeys below the roof deck.
  const gr = Math.max(0, Math.min(gr0, TOP - 1));

  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const north = !has(x, z - 1);
  const south = !has(x, z + 1);
  const ring = west || east || north || south;
  const corner = (west || east) && (north || south);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  // Ground floor slab at the cell's ground level.
  g.set(x, gr, z, ring ? "stone_bricks" : "light_gray_concrete");

  if (!ring) {
    // Interior floors and roof deck; air is left between them (no interiors).
    if (BAND > gr) g.set(x, BAND, z, "light_gray_concrete");
    if (TOP > gr) g.set(x, TOP, z, "gray_concrete");
    continue;
  }

  // Exterior ring: facade from just above the floor to the parapet.
  // u runs along the face: z on west/east faces, x on north/south faces.
  const u = (west || east) ? z : x;
  const pier = corner || u % 4 === 0;

  for (let y = gr + 1; y <= PARAPET; y++) {
    let id;
    if (y === PARAPET) id = "stone_bricks";
    else if (y === TOP) id = "smooth_quartz";
    else if (y === BAND) id = "smooth_quartz";
    else if (y <= 4) id = pier ? "smooth_quartz" : "glass";        // shopfront
    else id = pier ? "white_concrete" : "glass_pane";              // upper windows
    g.set(x, y, z, id);
  }

  // Central entrance on the south face: double-height door in the shopfront.
  if (south && !corner && u === 10 && gr <= 2) {
    const doorProps = { facing: "south", hinge: "left", open: "false", powered: "false" };
    g.set(x, gr + 1, z, "dark_oak_door", { ...doorProps, half: "lower" });
    g.set(x, gr + 2, z, "dark_oak_door", { ...doorProps, half: "upper" });
  }

  // Warm light behind selected upper windows (shroomlight in the room behind).
  if (!pier && u % 8 === 2 && gr < 7) {
    let nx = x, nz = z;
    if (west) nx = x + 1;
    else if (east) nx = x - 1;
    else if (north) nz = z + 1;
    else if (south) nz = z - 1;
    if (has(nx, nz) && !isRing(nx, nz)) g.set(nx, 7, nz, "shroomlight");
  }
}

// Roof plant: an HVAC plinth in the middle of the roof and a small stair/lift overrun.
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  if (isRing(x, z)) continue;
  if (x >= 6 && x <= 8 && z >= 6 && z <= 8) {
    g.set(x, PARAPET, z, "iron_block");
  }
  if (x >= 14 && x <= 15 && z >= 14 && z <= 15) {
    for (let y = PARAPET; y <= 12; y++) g.set(x, y, z, "white_concrete");
    g.set(x, 13, z, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);
