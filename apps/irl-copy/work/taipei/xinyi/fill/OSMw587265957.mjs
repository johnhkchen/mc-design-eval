import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Footprint 62 x 16. Roof ~21 blocks above lowest ground.
// Read as a 4-storey 1990s-2000s Xinyi commercial/office block: pale white
// concrete frame, light-blue glass bays, quartz cornice, shopfront ground floor
// with two entrances, and a small rooftop plant pair. Storeys are 5 blocks.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265957";
const W = 62, H = 33, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const L = Math.min(...cells.map((c) => c[2]));  // lowest ground
const R = L + 20;                               // roof slab (4 storeys of 5)
const PARAPET = R + 1;                          // single parapet course
const DOOR_X = [10, 50];                        // entrances on front faces

if (PARAPET + 2 >= H) throw new Error("building exceeds voxel height");

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const glassProps = (east, west, north, south) => ({
  east: east ? "true" : "false",
  west: west ? "true" : "false",
  north: north ? "true" : "false",
  south: south ? "true" : "false",
  waterlogged: "false",
});

const doorProps = (facing, half) => ({
  facing,
  half,
  hinge: "left",
  open: "false",
  powered: "false",
});

for (const [x, z, gr] of cells) {
  const front = !has(x, z - 1) || !has(x, z + 1);   // faces along x (z-ends)
  const endF = !has(x - 1, z) || !has(x + 1, z);    // faces along z (x-ends)
  const perim = front || endF;
  const corner = front && endF;
  const frontFacing = z === 0 ? "south" : "north";  // door swings into building

  // Foundation: solid from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Storeys, cornice, parapet, floor decks.
  for (let y = gr; y <= PARAPET; y++) {
    const rel = y - L;

    // Roof level.
    if (y === PARAPET) {
      if (perim) put(x, y, z, "white_concrete");
      continue;
    }
    if (y === R) {
      put(x, y, z, perim ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }

    // Floor deck at ground of each cell and at every storey line.
    const isDeck = y === gr || rel % 5 === 0;

    // Entrances on front faces, cut through the ground storey.
    if (perim && front && !corner && DOOR_X.includes(x) && y - gr <= 1 && y - gr >= 0) {
      put(x, y, z, "oak_door", doorProps(frontFacing, y - gr === 0 ? "lower" : "upper"));
      continue;
    }

    if (isDeck) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Interior: air behind the glass, with warm lamps just inside the front.
    if (!perim) {
      if (z === 1 && rel % 5 === 2 && x % 6 === 0 && x > 1 && x < W - 2) {
        put(x, y, z, "glowstone");
      }
      continue;
    }

    // Perimeter.
    if (corner) {
      put(x, y, z, "white_concrete");
      continue;
    }
    if (rel % 5 === 4) {                 // spandrel below each slab line
      put(x, y, z, "white_concrete");
      continue;
    }
    const pos = front ? x : z;
    if (pos % 3 === 0) {                 // mullions
      put(x, y, z, "white_concrete");
      continue;
    }
    const east = front ? (x + 1) % 3 !== 0 && x + 1 <= W - 2 : false;
    const west = front ? (x - 1) % 3 !== 0 && x - 1 >= 1 : false;
    const north = endF ? (z - 1) % 3 !== 0 && z - 1 >= 1 : false;
    const south = endF ? (z + 1) % 3 !== 0 && z + 1 <= D - 2 : false;
    put(x, y, z, "light_blue_stained_glass_pane", glassProps(east, west, north, south));
  }
}

// Rooftop plant: two light-grey equipment boxes with a mesh screen.
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const inPlant = (x >= 8 && x <= 14 && z >= 4 && z <= 11) || (x >= 42 && x <= 48 && z >= 4 && z <= 11);
  if (!inPlant) continue;
  const edge = x === 8 || x === 14 || x === 42 || x === 48 || z === 4 || z === 11;
  for (let y = R + 1; y <= R + 2; y++) {
    put(x, y, z, edge ? "light_gray_concrete" : "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
