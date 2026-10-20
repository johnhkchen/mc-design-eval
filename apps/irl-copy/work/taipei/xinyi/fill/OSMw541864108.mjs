import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Lidar roof ~11 blocks above lowest ground.
// Read as a 2-storey 1970s-80s Taipei commercial block: white tiled/concrete
// frame, shopfront ground floor with red fascia, glazed upper storey, parapet roof
// with rooftop plant. Two storeys of 5 blocks plus a 1-block parapet = 11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541864108";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 23, D = 14;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(key(x, z), gr);
const has = (x, z) => groundOf.has(key(x, z));
const exterior = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props === undefined) g.set(x, y, z, id);
  else g.set(x, y, z, id, props);
}

// Glass pane connections follow the wall direction.
function paneProps(x, z) {
  const xWall = !has(x, z - 1) || !has(x, z + 1); // wall runs along x
  const zWall = !has(x - 1, z) || !has(x + 1, z); // wall runs along z
  return {
    north: zWall ? "true" : "false",
    south: zWall ? "true" : "false",
    east: xWall ? "true" : "false",
    west: xWall ? "true" : "false",
    waterlogged: "false",
  };
}

// Pillars on the 4-block bay grid and at corners.
function isPillar(x, z) {
  const corner = (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
  return x % 4 === 0 || z % 4 === 0 || corner;
}

// Entrance on the z-minimum street wall, centred, kept off pillar columns.
const frontCells = cells
  .filter(([x, z]) => !has(x, z - 1))
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
let doorX = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : -1;
if (doorX >= 0 && doorX % 4 === 0) doorX += 1;
const doorZ = 0;

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(gr0, 10));
  const ext = exterior(x, z);

  // Foundation up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!ext) {
    // Interior: floor slabs only, air between, rooftop plant on the deck.
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");

    // Warm lights just behind the glazing, on the floor, in some bays.
    const nearExt = exterior(x - 1, z) || exterior(x + 1, z) || exterior(x, z - 1) || exterior(x, z + 1);
    if (nearExt && (x * 3 + z * 5) % 7 === 0) {
      put(x, gr + 1, z, "glowstone");
    }
    if (nearExt && (x * 5 + z * 3) % 9 === 4) {
      put(x, gr + 6, z, "glowstone");
    }

    // Rooftop air-conditioning plant, two blocks tall, on the roof deck.
    if (x % 6 === 3 && z % 4 === 2) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "light_gray_concrete");
    }
    continue;
  }

  // Exterior facade, storey by storey.
  const pillar = isPillar(x, z);
  const glassP = paneProps(x, z);

  // Base course.
  put(x, gr, z, "polished_andesite");

  // Ground storey (shopfront): glazing with pillars, red fascia.
  for (let rel = 1; rel <= 3; rel++) {
    if (pillar) put(x, gr + rel, z, "white_concrete");
    else put(x, gr + rel, z, "glass_pane", glassP);
  }
  put(x, gr + 4, z, pillar ? "white_concrete" : "red_concrete");

  // Storey line.
  put(x, gr + 5, z, "smooth_stone");

  // Upper storey: glazed bays with pillars.
  for (let rel = 6; rel <= 8; rel++) {
    if (pillar) put(x, gr + rel, z, "white_concrete");
    else put(x, gr + rel, z, "glass_pane", glassP);
  }

  // Cornice and parapet.
  put(x, gr + 9, z, "smooth_stone");
  put(x, gr + 10, z, "white_concrete");
}

// Entrance: oak door in the street wall, two blocks tall, with a lantern beside it.
if (doorX >= 0 && has(doorX, doorZ)) {
  put(doorX, groundOf.get(key(doorX, doorZ)) + 1, doorZ, "oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(doorX, groundOf.get(key(doorX, doorZ)) + 2, doorZ, "oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Lanterns flank the door, sitting on the base course line.
  for (const dx of [-1, 1]) {
    if (has(doorX + dx, doorZ) && !isPillar(doorX + dx, doorZ)) {
      put(doorX + dx, groundOf.get(key(doorX + dx, doorZ)) + 1, doorZ, "lantern", {
        hanging: "false", waterlogged: "false",
      });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
