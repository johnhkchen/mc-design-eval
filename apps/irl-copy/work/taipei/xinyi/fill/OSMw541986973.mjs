import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541986973";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: 10 x 23 footprint, roof ~11 blocks above lowest ground.
// Reads as a two-storey 1970s-80s Taipei street-front commercial block:
// shopfront storey, awning, floor line, upper storey with glass bays,
// stone cornice and a flat roof with a few rooftop units.
const W = 10, H = 23, D = 23;

const minG = Math.min(...cells.map((c) => c[2]));
const minX = Math.min(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr - minG);
const inside = (x, z) => G.has(key(x, z));
const gnd = (x, z) => G.get(key(x, z));

const DIRS = { east: [1, 0], west: [-1, 0], south: [0, 1], north: [0, -1] };
const outward = (x, z) =>
  Object.keys(DIRS).filter((d) => {
    const [dx, dz] = DIRS[d];
    return !inside(x + dx, z + dz);
  });

// Street front is the west face (x = 0 side of the footprint).
const FRONT = "west";
const frontZs = cells.filter((c) => c[0] === minX).map((c) => c[1]).sort((a, b) => a - b);
const doorZ = frontZs.length ? frontZs[Math.floor(frontZs.length / 2)] : null;

const g = new Voxels([W, H, D]);

const WALL = "white_concrete";
const GLASS = "light_blue_stained_glass";
const SHOP = "cyan_stained_glass";
const PILLAR_GROUND = "gray_concrete";
const FOUND = "stone_bricks";
const STRING = "smooth_stone";
const ROOF = "gray_concrete";

// Material for an outward wall block on a given face, at height y.
function faceMat(face, x, z, y, g0) {
  const i = face === "west" || face === "east" ? z - minZ : x - minX;
  if (y === g0) return FOUND; // base course
  if (y <= 3) {
    // shopfront storey
    if (face === FRONT) return i % 3 === 0 ? PILLAR_GROUND : SHOP;
    return i % 3 === 0 ? WALL : SHOP;
  }
  if (y === 4) return face === FRONT ? "red_terracotta" : WALL; // awning band
  if (y === 5) return STRING; // floor line
  if (y >= 6 && y <= 8) return i % 3 === 0 ? WALL : GLASS; // upper window bays
  if (y === 9) return WALL; // lintel band
  if (y === 10) return STRING; // cornice / parapet
  return WALL;
}

// Pass 1: foundations, floors, walls, windows, entrance, roof.
for (const [x, z] of cells) {
  const g0 = gnd(x, z);

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < g0; y++) g.set(x, y, z, FOUND);

  const outs = outward(x, z);

  if (outs.length === 0) {
    // Interior: floor slab at ground, floor line at storey 2, roof deck.
    if (g0 < H) g.set(x, g0, z, STRING);
    if (g0 <= 5) g.set(x, 5, z, STRING);
    if (g0 <= 10) g.set(x, 10, z, ROOF);
    continue;
  }

  const face = outs.includes(FRONT) ? FRONT : outs[0];

  for (let y = g0; y <= 10; y++) {
    // Entrance door on the middle of the street front.
    if (face === FRONT && x === minX && z === doorZ && y === g0) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "west", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (face === FRONT && x === minX && z === doorZ && y === g0 + 1 && g0 + 1 <= 3) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "west", half: "upper", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    const m = faceMat(face, x, z, y, g0);
    g.set(x, y, z, m);
  }

  // Roof deck continues under the parapet on edge cells too.
  if (g0 <= 10) g.set(x, 10, z, STRING);
}

// Pass 2: warm light just inside some upper-storey windows.
for (const [x, z] of cells) {
  const outs = outward(x, z);
  if (outs.length === 0) continue;
  const face = outs.includes(FRONT) ? FRONT : outs[0];
  const i = face === "west" || face === "east" ? z - minZ : x - minX;
  if (i % 3 === 0 || i % 6 !== 1) continue;
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz;
  if (!inside(ix, iz) || outward(ix, iz).length !== 0) continue;
  if (gnd(ix, iz) > 6) continue;
  g.set(ix, 6, iz, "glowstone");
}

// Pass 3: rooftop units on some interior roof cells.
for (const [x, z] of cells) {
  if (outward(x, z).length !== 0) continue;
  if (gnd(x, z) > 10) continue;
  if ((x * 3 + z * 5) % 11 === 0) g.set(x, 11, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
