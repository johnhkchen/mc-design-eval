import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s Taipei shophouse-style commercial block: stone plinth,
// white-concrete walls with light-grey string courses, a glazed shopfront
// at street level, two upper storeys of windows with concrete piers,
// a cornice and parapet, and a small rooftop plant enclosure.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541455325";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const isIn = (x, z) => G.has(key(x, z));

const minG = Math.min(...cells.map((c) => c[2]));
const maxG = Math.max(...cells.map((c) => c[2]));
// Roof deck level: about 11 blocks above the lowest ground (lidar), and never
// below the highest ground plus a few blocks so the body always stands.
const R = Math.max(minG + 10, maxG + 6);

// Exterior faces of a footprint cell: [dx, dz] pointing outward.
function outFaces(x, z) {
  const f = [];
  if (!isIn(x + 1, z)) f.push([1, 0]);
  if (!isIn(x - 1, z)) f.push([-1, 0]);
  if (!isIn(x, z + 1)) f.push([0, 1]);
  if (!isIn(x, z - 1)) f.push([0, -1]);
  return f;
}
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// Pick the ground-floor entrance: a single-face wall cell on the south-facing
// (+z) side nearest the middle of that run, else any single-face wall cell.
const single = cells.filter(([x, z]) => outFaces(x, z).length === 1);
const southPool = single.filter(([x, z]) => outFaces(x, z)[0][1] === 1);
const pool = southPool.length ? southPool : single;
const meanX = pool.reduce((a, c) => a + c[0], 0) / pool.length;
const doorCell = pool.reduce((best, c) =>
  Math.abs(c[0] - meanX) < Math.abs(best[0] - meanX) ? c : best
);
const DOOR_KEY = key(doorCell[0], doorCell[1]);

for (const [x, z, g0] of cells) {
  const faces = outFaces(x, z);
  const wall = faces.length > 0;
  const corner = faces.length > 1;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");

  for (let y = g0; y < R; y++) {
    const rel = y - minG;
    const s = Math.floor(rel / 5);   // storey index on the common grid
    const h = rel % 5;               // height within storey

    // Ground course of this column.
    if (y === g0) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Storey line: plinth at street level, string course above.
    if (h === 0) {
      if (wall && s === 0) g.set(x, y, z, "stone_bricks");
      else if (wall) g.set(x, y, z, "light_gray_concrete");
      else g.set(x, y, z, "light_gray_concrete"); // floor slab
      continue;
    }

    // Interior: air gap, lights are placed from the facade below.
    if (!wall) continue;

    // Lintel / fascia band.
    if (h === 4) {
      g.set(x, y, z, s === 0 ? "gray_concrete" : "light_gray_concrete");
      continue;
    }

    // Facade rows h = 1..3.
    const [dx, dz] = faces[0];
    const idx = dx !== 0 ? z : x;
    const pier = corner || idx % 3 === 0;

    if (s === 0) {
      // Shopfront, with one entrance door.
      if (key(x, z) === DOOR_KEY && !corner) {
        const facing = FACING[`${dx},${dz}`];
        if (h === 1) {
          g.set(x, y, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (h === 2) {
          g.set(x, y, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        g.set(x, y, z, "glass"); // transom
        continue;
      }
      g.set(x, y, z, pier ? "stone_bricks" : "glass");
      continue;
    }

    // Upper storeys: glazed bays between concrete piers.
    if (pier) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, "light_blue_stained_glass");
      // Warm light behind some windows, in the air gap just inside the glass.
      if (h === 2 && idx % 6 === 1) {
        const ix = x - dx, iz = z - dz;
        if (isIn(ix, iz) && outFaces(ix, iz).length === 0) {
          g.set(ix, y, iz, "glowstone");
        }
      }
    }
  }

  // Roof deck and cornice.
  if (g0 < R) {
    g.set(x, R, z, wall ? "light_gray_concrete" : "gray_concrete");
  }
  if (wall) {
    g.set(x, R + 1, z, "white_concrete"); // parapet
  }
}

// Rooftop plant enclosure near the middle of the roof, if it fits the footprint.
const plant = [];
for (let x = 3; x <= 4; x++) for (let z = 10; z <= 11; z++) {
  if (isIn(x, z) && outFaces(x, z).length === 0) plant.push([x, z]);
}
if (plant.length === 4) {
  for (const [x, z] of plant) {
    g.set(x, R + 1, z, "smooth_stone");
    g.set(x, R + 2, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
