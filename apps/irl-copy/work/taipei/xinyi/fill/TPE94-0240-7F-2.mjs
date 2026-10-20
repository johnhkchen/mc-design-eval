import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE94-0240-7F-2: 2005 Xinyi office block, 21 x 28 footprint, 7 storeys of 5 blocks.
// Concrete frame, blue-tinted glazing, light-grey spandrels, shopfront base,
// double-width entrance under a canopy, parapet, and a central plant penthouse.
// Hollow shell: air behind the glass, one floor slab per storey.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0240-7F-2";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 21, H = 47, D = 28;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = [
  [1, 0, "east"],
  [-1, 0, "west"],
  [0, 1, "south"],
  [0, -1, "north"],
];

// First missing 4-neighbour = outward facing direction (null for interior cells).
function outward(x, z) {
  for (const [dx, dz, name] of DIRS) if (!has(x + dx, z + dz)) return [dx, dz, name];
  return null;
}

const TOP = 34;      // last body block (7 storeys x 5, y 0..34)
const ROOF = 35;     // roof slab level
const STOREY = 5;

const FRAME = "white_concrete";
const SPANDREL = "light_gray_concrete";
const GLASS = "light_blue_stained_glass";
const BASE = "stone_bricks";
const SLAB = "white_concrete";

// Two-cell-wide entrance: south/north face at x 10..11, east/west face at z 13..14.
function isEntranceCell(x, z, out) {
  if (!out) return false;
  return (out[1] !== 0 && (x === 10 || x === 11)) || (out[0] !== 0 && (z === 13 || z === 14));
}

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);

  const out = outward(x, z);
  const entrance = isEntranceCell(x, z, out);

  for (let y = gr; y <= TOP; y++) {
    const s = Math.floor(y / STOREY);
    const o = y % STOREY;

    // Floor slab per storey (and at the first body level), in every cell.
    if (y === gr || o === 0) {
      g.set(x, y, z, SLAB);
      continue;
    }
    if (!out) continue; // interior: air

    // Facade cells.
    if (s === 0) {
      if (y === gr) {
        g.set(x, y, z, BASE); // base course
        continue;
      }
      if (entrance) {
        if (y === gr + 1) {
          g.set(x, y, z, "oak_door", {
            facing: out[2],
            half: "lower",
            hinge: "left",
            open: "false",
            powered: "false",
          });
          continue;
        }
        if (y === gr + 2) {
          g.set(x, y, z, "oak_door", {
            facing: out[2],
            half: "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
          continue;
        }
        if (y === gr + 3) {
          // Canopy over the entrance, carried on the wall cells.
          g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
          continue;
        }
      }
      if (o === 4) {
        g.set(x, y, z, SPANDREL); // fascia
        continue;
      }
      // Shopfront glazing with frame pillars.
      g.set(x, y, z, x % 4 === 0 ? FRAME : GLASS);
      continue;
    }

    // Upper storeys.
    if (o === 4) {
      g.set(x, y, z, SPANDREL);
    } else {
      g.set(x, y, z, (x + z) % 3 === 0 ? FRAME : GLASS);
    }
  }

  // Roof slab, all cells.
  g.set(x, ROOF, z, SPANDREL);

  // Parapet on facade cells: cornice then wall.
  if (out) {
    g.set(x, ROOF + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    g.set(x, ROOF + 2, z, FRAME);
  }
}

// Warm lights just inside some upper-storey windows.
for (const [x, z, gr] of cells) {
  const out = outward(x, z);
  if (!out) continue;
  for (let y = gr; y <= TOP; y++) {
    const s = Math.floor(y / STOREY);
    const o = y % STOREY;
    if (s === 0 || o !== 2) continue;
    if ((x * 3 + z * 5 + s * 2) % 9 !== 0) continue;
    const ix = x - out[0];
    const iz = z - out[1];
    if (!has(ix, iz)) continue;
    g.set(ix, y, iz, (s + x) % 2 === 0 ? "glowstone" : "shroomlight");
  }
}

// Central plant penthouse on the roof, where the footprint allows.
const PX0 = 6, PX1 = 14, PZ0 = 9, PZ1 = 18;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!has(x, z)) continue;
    const edge = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    for (let y = ROOF + 1; y <= ROOF + 4; y++) {
      if (edge) g.set(x, y, z, SPANDREL);
    }
    g.set(x, ROOF + 5, z, FRAME); // penthouse roof
  }
}

// Mast on the penthouse.
const mx = 10, mz = 13;
if (has(mx, mz)) {
  for (let y = ROOF + 6; y <= ROOF + 9; y++) {
    g.set(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
