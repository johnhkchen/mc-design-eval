import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538618845";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Footprint lookup: ground height per cell
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Exterior face of an edge cell (north = -z, south = +z, west = -x, east = +x)
function edgeFace(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}

// Mean x of north-facing cells -> entrance column on the street (Xinyi-facing) frontage
let sumX = 0, nN = 0;
for (const [x, z] of cells) {
  if (edgeFace(x, z) === "north") { sumX += x; nN++; }
}
const entranceX = nN ? Math.round(sumX / nN) : Math.floor(W / 2);

const GLASS_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone");

  const face = edgeFace(x, z);

  if (!face) {
    // Interior: floor slabs per storey and a flat roof slab, no walls
    put(x, gr + 1, z, "smooth_stone");
    put(x, gr + 6, z, "smooth_stone");
    put(x, gr + 11, z, "gray_concrete");
    // Roof plant boxes on a regular grid
    if (x % 5 === 2 && z % 5 === 2) {
      put(x, gr + 12, z, "light_gray_concrete");
      put(x, gr + 13, z, "light_gray_concrete");
    }
    // Warm light inside, visible from the air through the roof of the lower storeys
    if ((x * 3 + z * 5) % 9 === 0) {
      put(x, gr + 4, z, "glowstone");
      put(x, gr + 9, z, "glowstone");
    }
    continue;
  }

  // Edge cell: facade
  const alongNS = face === "north" || face === "south";
  const bay = alongNS ? x : z;
  const corner = alongNS
    ? (!has(x - 1, z) || !has(x + 1, z))
    : (!has(x, z - 1) || !has(x, z + 1));
  const pillar = corner || bay % 3 === 0;
  const glassProps = alongNS ? GLASS_NS : GLASS_EW;

  // Base course
  put(x, gr + 1, z, "polished_granite");

  // Ground storey: shopfront (rows gr+2..gr+3), upper ground windows (gr+4..gr+5)
  // Upper storey windows (gr+7..gr+10). Spandrel lines at gr+6.
  const windowRows = [gr + 2, gr + 3, gr + 4, gr + 5, gr + 7, gr + 8, gr + 9, gr + 10];
  for (const y of windowRows) {
    if (pillar) put(x, y, z, "white_concrete");
    else put(x, y, z, "glass_pane", glassProps);
  }

  // Storey line
  put(x, gr + 6, z, "white_concrete");

  // Cornice
  put(x, gr + 11, z, "smooth_stone");

  // Entrance on the north frontage: door in the middle cell, lintel above
  if (face === "north" && x === entranceX) {
    put(x, gr + 2, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 4, z, "polished_granite");
    put(x, gr + 5, z, "polished_granite");
  }

  // Warm light behind some glass: place a glowstone in the interior cell just inside
  if (!pillar && (x + z) % 4 === 0) {
    const inward = {
      north: [x, z + 1],
      south: [x, z - 1],
      west: [x + 1, z],
      east: [x - 1, z],
    }[face];
    const [ix, iz] = inward;
    if (has(ix, iz) && !edgeFace(ix, iz)) {
      put(ix, gr + 4, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
