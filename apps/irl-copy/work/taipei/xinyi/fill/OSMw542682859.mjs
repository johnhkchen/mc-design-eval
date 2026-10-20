import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682859";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 29 x 15, height canvas 23. Two-storey mid-century commercial block.
// Storey 1: y ground..4 (shopfront), belt course y=5, storey 2: y 6..9, cornice/roof at y=10 (roof top at 11).
const W = 29, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const ROOF_TOP = 10;      // highest solid layer of the roof slab / cornice
const BELT = 5;           // storey line / floor 2 slab
const WALL = "white_concrete";
const BELT_ID = "smooth_quartz";
const GLASS = "light_blue_stained_glass";
const FOUND = "stone_bricks";

const ground = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const G = (x, z) => ground.get(key(x, z));

const xs = cells.map(c => c[0]);
const zs = cells.map(c => c[1]);
const xMin = Math.min(...xs), xMax = Math.max(...xs);
const zMin = Math.min(...zs), zMax = Math.max(...zs);
const xMid = Math.floor((xMin + xMax) / 2);

for (const [x, z, gr] of cells) {
  const outs = {
    W: !has(x - 1, z),
    E: !has(x + 1, z),
    N: !has(x, z - 1),
    S: !has(x, z + 1),
  };
  const outList = Object.keys(outs).filter(k => outs[k]);
  const nOut = outList.length;
  const edge = nOut > 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  if (gr > ROOF_TOP) continue; // safety: ground above roof line

  if (!edge) {
    // Interior: floor slabs only, air between (no hollow-room fill).
    for (let y = gr; y <= ROOF_TOP; y++) {
      if (y === gr || y === BELT || y === ROOF_TOP) g.set(x, y, z, WALL);
    }
    // Rooftop plant: a few small condenser boxes on the roof.
    if (x % 6 === 3 && z % 5 === 2) {
      g.set(x, ROOF_TOP + 1, z, "light_gray_concrete");
      g.set(x, ROOF_TOP + 2, z, "iron_block");
    }
    continue;
  }

  // Edge (facade) cell: solid wall with belt course and cornice.
  for (let y = gr; y <= ROOF_TOP; y++) g.set(x, y, z, WALL);
  g.set(x, BELT, z, BELT_ID);
  g.set(x, ROOF_TOP, z, BELT_ID);

  if (nOut !== 1) continue; // corners and piers stay solid

  const face = outList[0];
  const idx = (face === "W" || face === "E") ? (z - zMin) : (x - xMin);

  // Front entrance on the north face (z = zMin), centred.
  if (face === "N" && x === xMid && gr + 1 <= BELT - 1) {
    g.set(x, gr, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    // Glazed transom above the door.
    for (let y = gr + 2; y <= BELT - 1; y++) g.set(x, y, z, GLASS);
    continue;
  }

  // Window bays: two glass cells, then a concrete pier.
  if (idx % 3 === 2) continue;

  // Ground floor shopfront glazing.
  for (let y = gr + 1; y <= BELT - 1; y++) {
    g.set(x, y, z, GLASS);
  }
  // Upper floor windows.
  for (let y = BELT + 1; y <= ROOF_TOP - 1; y++) {
    g.set(x, y, z, GLASS);
  }

  // Warm lights behind a few windows (shroomlight / glowstone).
  if ((idx * 5 + x + z) % 11 === 4 && gr + 2 <= BELT - 1) {
    g.set(x, gr + 2, z, "glowstone");
  }
  if ((idx * 3 + x * 2 + z) % 9 === 1) {
    g.set(x, BELT + 2, z, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
