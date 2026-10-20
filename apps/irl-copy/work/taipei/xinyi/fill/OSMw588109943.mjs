import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109943";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 32, H = 86, D = 79;
const g = new Voxels([W, H, D]);

// Record: ~74 blocks to roof, 32 x 79 footprint, slab-type office/residential tower, c. 1990s-2000s Xinyi.
const ROOF = 74;                       // roof deck level (absolute)
const STOREY = 5;                      // storey height in blocks
const GLASS = "light_blue_stained_glass";
const FRAME = "white_concrete";
const PLINTH = "gray_concrete";
const FOUND = "stone_bricks";
const SLAB = "light_gray_concrete";
const ROOFDECK = "gray_concrete";
const DOOR = "dark_oak_door";
const GLOW = "glowstone";

const key = (x, z) => `${x},${z}`;
const inside = new Map();
for (const [x, z, gr] of cells) inside.set(key(x, z), gr);
const has = (x, z) => inside.has(key(x, z));

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const cx = Math.round((minX + maxX) / 2);
const entranceOK = has(cx, minZ);

// Penthouse (mechanical floor) rectangle, kept inside the walls.
const px0 = minX + 4, px1 = maxX - 4, pz0 = minZ + 10, pz1 = maxZ - 10;
const inPent = (x, z) => x >= px0 && x <= px1 && z >= pz0 && z <= pz1;

// Facade faces for a footprint cell.
function faces(x, z) {
  return {
    n: !has(x, z - 1),
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
}

const doorProps = (half) => ({
  facing: "north", half, hinge: "left", open: "false", powered: "false",
});

for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  const perim = f.n || f.s || f.w || f.e;
  const corner = (f.n || f.s) && (f.w || f.e);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  if (!perim) {
    // Interior: floor slabs per storey, air gap otherwise, roof deck at top.
    for (let y = gr; y < ROOF; y++) {
      if (y === gr || y % STOREY === 0) g.set(x, y, z, SLAB);
    }
    g.set(x, ROOF, z, ROOFDECK);
    continue;
  }

  // Facade: plinth, storey lines, mullions, glazing, entrance.
  const mull = corner || ((f.n || f.s) ? (x - minX) % 4 === 0 : (z - minZ) % 4 === 0);
  const inward = f.n ? [x, z + 1] : f.s ? [x, z - 1] : f.w ? [x + 1, z] : [x - 1, z];
  const inwardInside = has(inward[0], inward[1]) && !(faces(inward[0], inward[1]).n ||
    faces(inward[0], inward[1]).s || faces(inward[0], inward[1]).w || faces(inward[0], inward[1]).e);
  const isEntCol = entranceOK && f.n && x === cx;

  for (let y = gr; y < ROOF; y++) {
    if (y === gr) { g.set(x, y, z, PLINTH); continue; }

    if (isEntCol && (y === gr + 1 || y === gr + 2)) {
      g.set(x, y, z, DOOR, doorProps(y === gr + 1 ? "lower" : "upper"));
      continue;
    }
    if (isEntCol && y === gr + 3) { g.set(x, y, z, FRAME); continue; }

    if (y % STOREY === 0) { g.set(x, y, z, FRAME); continue; }   // spandrel / storey line

    if (mull) { g.set(x, y, z, FRAME); continue; }               // mullion

    g.set(x, y, z, GLASS);

    // Warm light behind some windows, placed in the air gap inside.
    if (inwardInside && (x * 3 + z * 7 + y) % 23 === 0) {
      g.set(inward[0], y, inward[1], GLOW);
    }
  }

  // Parapet and cornice above the roof line.
  g.set(x, ROOF, z, FRAME);
  g.set(x, ROOF + 1, z, FRAME);
}

// Mechanical penthouse with louvred walls, floor slab and cap.
for (const [x, z] of cells) {
  if (!inPent(x, z)) continue;
  const ring = x === px0 || x === px1 || z === pz0 || z === pz1;
  g.set(x, 75, z, SLAB);
  if (ring) {
    g.set(x, 76, z, (x + z) % 2 === 0 ? "iron_bars" : FRAME);
    g.set(x, 77, z, FRAME);
  }
  g.set(x, 78, z, SLAB);
}

// Antenna mast on the penthouse centre.
const pcx = Math.round((px0 + px1) / 2), pcz = Math.round((pz0 + pz1) / 2);
if (has(pcx, pcz)) {
  for (let y = 79; y <= 83; y++) {
    g.set(pcx, y, pcz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
