import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 21 x 11 footprint, roof ~11 blocks above lowest ground.
// Read as a 1990s-2000s Taipei mid-rise commercial block: two storeys of
// about 5 blocks each, shopfronts at street level, tiled and concrete facades,
// tinted glass bands, a stone cornice and a parapet with rooftop plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538617866";
const W = 21, H = 23, D = 11;
const STOREY = 5;        // blocks per storey
const ROOF_REL = 11;     // roof height above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...cells.map(c => c[2]));
const R = Math.min(H - 2, minG + ROOF_REL);   // top occupied row of parapet

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward face of an exterior cell (priority: north, south, west, east)
const faceOf = (x, z) => {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
};
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Pier columns: corners, and every third bay
const isPier = (face, x, z) => {
  if (face === "north" || face === "south") return x === 0 || x === W - 1 || x % 3 === 0;
  return z === 0 || z === D - 1 || z % 3 === 0;
};

const isEntrance = (face, x, z) => face === "south" && x === 10 && z === D - 1;

for (const [x, z, gr] of cells) {
  // 1. Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_andesite");

  const face = faceOf(x, z);
  const exterior = face !== null;

  // 2. Body from its own ground up to the roof line
  for (let y = gr; y <= R; y++) {
    const b = y - minG;   // level relative to lowest ground

    if (!exterior) {
        // Interior: floor and roof slabs only, air elsewhere
      if (b === 0 || b === STOREY || b === 2 * STOREY) {
        put(x, y, z, "light_gray_concrete");
      }
      continue;
    }

    // Exterior: parapet, cornice, floor lines
    if (b === 2 * STOREY + 1) {            // parapet course
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (b === 2 * STOREY) {                // cornice
      put(x, y, z, "smooth_stone");
      continue;
    }
    if (b === STOREY) {                    // storey line
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (b === 0) {                         // base course
      put(x, y, z, "polished_granite");
      continue;
    }

    const pier = isPier(face, x, z);
    const u = face === "north" || face === "south" ? x : z;

    if (b < STOREY) {
      // Ground storey: shopfront with entrance
      if (isEntrance(face, x, z)) {
        if (b === 1) put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (b === 2) put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        else if (b === 3) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        else if (b === 4) put(x, y, z, "white_concrete");
        continue;
      }
      if (b === 4) { put(x, y, z, "white_concrete"); continue; }   // lintel
      if (pier) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "glass");
      continue;
    }

    // Upper storey: window grid with piers
    if (b >= STOREY + 1 && b <= 2 * STOREY - 1) {
      if (pier) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "light_blue_stained_glass");
      // warm light behind some windows, on the inner cell
      if (b === STOREY + 2 && (u % 2 === 0)) {
        const [dx, dz] = INWARD[face];
        if (has(x + dx, z + dz)) put(x + dx, y, z + dz, "glowstone");
      }
      continue;
    }
  }
}

// Rooftop plant: small mechanical box and a lightning rod
const plant = [[6, 3], [7, 3], [6, 4], [7, 4]];
for (const [x, z] of plant) {
  if (has(x, z) && faceOf(x, z) === null) {
    put(x, R + 1, z, "white_concrete");
    put(x, R + 2, z, "light_gray_concrete");
  }
}
if (has(15, 5) && faceOf(15, 5) === null) {
  put(15, R + 1, 5, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
