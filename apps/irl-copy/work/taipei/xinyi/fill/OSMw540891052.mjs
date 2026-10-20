import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540891052";
const W = 18, H = 23, D = 12;

// Record: 18 x 12 footprint, roof ~11 above lowest ground.
// Read as a two-storey, ~5 block per storey, flat-roofed Xinyi-area
// commercial block of the 1970s-80s: white rendered walls, stone plinth,
// a stone belt course at the upper floor line, glazed bays, shopfront at
// street level on the north (z=0) face, and a parapet with a small
// roof plant room.
//   y = ground (per cell) .. 4   ground storey (shopfront)
//   y = 5                        floor line (belt course)
//   y = 6 .. 8                   upper storey (glazed bays)
//   y = 9                        roof deck / cornice band
//   y = 10                       parapet (roof top at 11 blocks)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward faces. "north" (z minimum) is the street front.
const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];
const isBoundary = (x, z) => DIRS.some((d) => !has(x + d.dx, z + d.dz));

// Front (north) face cells, used to place the entrance.
const frontXs = cells
  .filter(([x, z]) => has(x, z - 1) === false)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorT = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;

const GLASS = "light_blue_stained_glass";
const WALL = "white_concrete";
const PIER = "light_gray_concrete";
const PLINTH = "stone_bricks";
const BELT = "smooth_stone";

// Pass 1: foundations, floors, walls, roof deck, parapet.
for (const [x, z, rawG] of cells) {
  const G = Math.min(Math.max(rawG, 0), 8);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < G; y++) put(x, y, z, PLINTH);

  if (!isBoundary(x, z)) {
    // Interior: ground floor slab, upper floor slab, roof deck. Air between.
    put(x, G, z, BELT);
    put(x, 5, z, BELT);
    put(x, 9, z, "gray_concrete");
  } else {
    // Perimeter: plinth, walls, belt course, cornice, parapet.
    put(x, G, z, PLINTH);
    for (let y = G + 1; y <= 8; y++) put(x, y, z, WALL);
    put(x, 5, z, BELT);
    put(x, 9, z, BELT);
    put(x, 10, z, WALL);
  }
}

// Roof plant room, set back in the middle of the roof.
for (let x = 7; x <= 10; x++)
  for (let z = 4; z <= 7; z++)
    if (has(x, z) && !isBoundary(x, z)) put(x, 10, z, PIER);

// Pass 2: openings on exposed faces, shopfront, entrance, warm lights.
for (const [x, z, rawG] of cells) {
  if (!isBoundary(x, z)) continue;
  const G = Math.min(Math.max(rawG, 0), 8);

  for (const d of DIRS) {
    if (has(x + d.dx, z + d.dz)) continue; // not an exposed face
    const isFront = d.name === "north";
    const t = d.dz !== 0 ? x : z; // position along the face
    const bay = t % 3 === 1;
    const inX = x - d.dx;
    const inZ = z - d.dz;
    const inward = has(inX, inZ) && !isBoundary(inX, inZ);

    // Upper storey glazing.
    for (let y = 6; y <= 8; y++) {
      if (bay) put(x, y, z, GLASS);
      else put(x, y, z, WALL);
    }
    if (bay && inward && t % 6 === 1) put(inX, 7, inZ, "shroomlight");

    // Ground storey.
    if (isFront) {
      for (let y = G + 1; y <= 3; y++) {
        if (t === doorT) continue; // entrance set below
        if (t % 3 === 0) put(x, y, z, PIER);
        else put(x, y, z, GLASS);
      }
      put(x, 4, z, "gray_concrete"); // fascia
      if (inward && t % 4 === 2) put(inX, G + 2, inZ, "glowstone");
    } else {
      for (let y = G + 1; y <= 3; y++) {
        if (bay) put(x, y, z, GLASS);
        else put(x, y, z, WALL);
      }
      put(x, 4, z, WALL);
      if (bay && inward && t % 6 === 1) put(inX, G + 2, inZ, "glowstone");
    }

    // Entrance on the street face.
    if (isFront && t === doorT) {
      const doorProps = (half) => ({
        facing: "north",
        half,
        hinge: "left",
        open: "false",
        powered: "false",
      });
      put(x, G, z, "dark_oak_door", doorProps("lower"));
      put(x, G + 1, z, "dark_oak_door", doorProps("upper"));
      put(x, G + 2, z, PIER);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
