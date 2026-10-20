import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109970";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 33, D = 24;
const g = new Voxels([W, H, D]);

// Era: late-1990s/2000s Xinyi mid-rise commercial-residential block.
// Four storeys of 5 blocks, cream tiled concrete, grey mullions, blue-grey glass,
// shopfront at grade, parapet cornice and roof plant.
const ROOF = 21;
const PARA = 22;
const PARA_TOP = 23;
const FLOOR_ROWS = new Set([1, 6, 11, 16, 21]);
const WALL = "white_concrete";
const MULL = "light_gray_concrete";
const GLASS = "light_blue_stained_glass";
const SHOP = "glass";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const PLANT = "stone_bricks";
const LAMP = "glowstone";

const k = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(k(x, z), Math.round(gr));
const has = (x, z) => ground.has(k(x, z));

const FACES = [
  { name: "north", dx: 0, dz: -1, along: (x) => x },
  { name: "south", dx: 0, dz: 1, along: (x) => x },
  { name: "west", dx: -1, dz: 0, along: (x, z) => z },
  { name: "east", dx: 1, dz: 0, along: (x, z) => z },
];

function faceOf(x, z) {
  for (const f of FACES) if (!has(x + f.dx, z + f.dz)) return f;
  return null;
}

// Entrance: south-facing exterior cell nearest x = 6.
let doorCell = null;
for (const [x, z] of cells) {
  const f = faceOf(x, z);
  if (f && f.name === "south") {
    if (!doorCell || Math.abs(x - 6) < Math.abs(doorCell[0] - 6)) doorCell = [x, z];
  }
}
const doorKey = doorCell ? k(doorCell[0], doorCell[1]) : null;

// Pass 1: foundations, storeys, floor slabs, facades.
const lampSpots = [];
for (const [x, z] of cells) {
  const gy = ground.get(k(x, z));
  const face = faceOf(x, z);

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y <= gy; y++) g.set(x, y, z, FOUND);

  // Building body from just above ground up to the roof deck.
  for (let y = gy + 1; y <= ROOF; y++) {
    if (FLOOR_ROWS.has(y)) {
      if (face) {
        if (y === 1) g.set(x, y, z, BASE);
        else g.set(x, y, z, MULL);
      } else {
        g.set(x, y, z, FLOOR);
      }
      continue;
    }
    if (!face) continue; // interior air gap behind the shell

    const a = face.along(x, z);
    if (y <= 5) {
      // Ground-floor shopfront with entrance.
      const doorY = Math.max(2, gy + 1);
      const isDoor =
        k(x, z) === doorKey && doorY + 1 <= 5 && (y === doorY || y === doorY + 1);
      if (isDoor) {
        g.set(x, y, z, "iron_door", {
          facing: "south",
          half: y === doorY ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (a % 3 === 0) {
        g.set(x, y, z, MULL);
      } else {
        g.set(x, y, z, SHOP);
      }
      if (!isDoor && a % 6 === 1 && y === 3) lampSpots.push([x, y, z, face]);
    } else {
      // Upper floors: tiled pier columns with glass bays.
      if (a % 3 === 0) g.set(x, y, z, WALL);
      else g.set(x, y, z, GLASS);
      if (a % 6 === 4 && (y === 8 || y === 13 || y === 18)) lampSpots.push([x, y, z, face]);
    }
  }

  // Parapet and cornice on the exterior ring.
  if (face) {
    g.set(x, PARA, z, WALL);
    g.set(x, PARA_TOP, z, MULL);
  }
}

// Roof plant: a small block of equipment near the middle of the deck.
for (const [x, z] of cells) {
  if (faceOf(x, z)) continue;
  if (x >= 5 && x <= 7 && z >= 9 && z <= 14) {
    g.set(x, PARA, z, PLANT);
    if (x === 6 && z >= 10 && z <= 13) g.set(x, PARA_TOP, z, PLANT);
  }
}

// Warm light behind some glass: glowstone on the interior side of the bay.
for (const [x, y, z, face] of lampSpots) {
  const ix = x - face.dx;
  const iz = z - face.dz;
  if (!has(ix, iz)) continue;
  if (faceOf(ix, iz) && faceOf(ix, iz) !== face) continue;
  if (y === ROOF) continue;
  g.set(ix, y, iz, LAMP);
}

g.save(`${DIR}/${ID}.nbt`);
