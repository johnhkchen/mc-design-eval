import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020152";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 2-storey 1980s Taipei commercial block: white concrete walls, stone-brick plinth,
// shopfront glazing at street level, framed upper windows, parapet and rooftop plant.
const W = 11, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const FLOOR1 = 5;      // storey line (absolute y)
const ROOF = 11;       // roof slab / top of walls
const PARAPET = 12;    // parapet course

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));

// Outward face of a perimeter cell (north = -z, south = +z, west = -x, east = +x)
function faceOf(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}
const inward = {
  north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0],
};

const isPerimeter = (x, z) => faceOf(x, z) !== null;

// Along-wall index: x for north/south faces, z for east/west faces
const along = (face, x, z) => (face === "north" || face === "south" ? x : z);

// Pick the door on the street (north, min-z) face, middle of that run
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
const northRun = cells
  .filter(([x, z]) => z === minZ)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = northRun[Math.floor(northRun.length / 2)];
const doorZ = minZ;

// 1. Foundations, ground slabs and interior floors
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, "smooth_stone");                 // ground-floor slab
  if (gr < FLOOR1) g.set(x, FLOOR1, z, "smooth_stone"); // upper floor slab
}

// 2. Perimeter walls, shopfronts, upper windows, parapet
for (const [x, z, gr] of cells) {
  const face = faceOf(x, z);
  if (!face) continue;
  const t = along(face, x, z);
  const [ix, iz] = inward[face];
  const inCell = has(x + ix, z + iz);

  // plinth course at ground
  g.set(x, gr, z, "stone_bricks");

  // ground storey: shopfront glazing with stone pillars
  for (let y = gr + 1; y < FLOOR1; y++) {
    if (t % 3 === 0) {
      g.set(x, y, z, "stone_bricks");
    } else {
      g.set(x, y, z, "glass_pane", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
    }
  }

  // storey band
  if (FLOOR1 > gr) g.set(x, FLOOR1, z, "smooth_stone");

  // upper storey: window bays on a 3-cell rhythm, solid piers between
  for (let y = FLOOR1 + 1; y <= 9; y++) {
    if (t % 3 === 1) {
      if (y === FLOOR1 + 1 || y === 9) {
        g.set(x, y, z, "stone_bricks");                // window frame head and sill
      } else {
        g.set(x, y, z, "glass_pane", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
      }
    } else {
      g.set(x, y, z, "white_concrete");
    }
  }

  // cornice and wall top
  g.set(x, 10, z, "white_concrete");
  g.set(x, ROOF, z, "smooth_stone");

  // parapet
  g.set(x, PARAPET, z, "smooth_stone");

  // warm light behind selected upper windows
  if (t % 3 === 1 && t % 6 === 1 && inCell) {
    g.set(x + ix, 7, z + iz, "glowstone");
  }
  // warm light behind some shopfront bays
  if (t % 3 !== 0 && t % 6 === 2 && inCell && gr + 2 < FLOOR1) {
    g.set(x + ix, gr + 2, z + iz, "glowstone");
  }
}

// 3. Entrance on the street face: double-height door under a small dark canopy
for (const dx of [-1, 0, 1]) {
  const xx = doorX + dx;
  if (!has(xx, doorZ)) continue;
  const gr = gOf(xx, doorZ);
  g.set(xx, gr + 3, doorZ, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}
if (has(doorX, doorZ)) {
  const gr = gOf(doorX, doorZ);
  g.set(doorX, gr + 1, doorZ, "oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(doorX, gr + 2, doorZ, "oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// 4. Roof: concrete deck over the interior, rooftop AC plant
for (const [x, z] of cells) {
  if (!isPerimeter(x, z)) {
    g.set(x, ROOF, z, "light_gray_concrete");
    if (x % 4 === 2 && z % 5 === 2) {
      g.set(x, ROOF + 1, z, "iron_block");           // AC condenser unit
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
