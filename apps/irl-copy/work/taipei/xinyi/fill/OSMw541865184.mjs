import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1980s-90s Xinyi commercial block: two storeys of cream tiled facade on a
// stone base, black-glass shopfronts at street level with a red awning over the
// entrance, light-blue glazing above, a polished-stone cornice and a roof with
// plant boxes. Roof top sits at absolute y 11 (TOP 10 is the last solid layer).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541865184";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 29, H = 23, D = 13;
const TOP = 10;   // last solid layer of the parapet/roof
const F1 = 5;     // storey line between ground floor and first upper floor

const g = new Voxels([W, H, D]);
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(x + "," + z, gr);
}
const has = (x, z) => ground.has(x + "," + z);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Which outward face a perimeter cell shows (north = z 0 side, the street front).
function faceOf(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  return "east";
}

// Returns [id, props?] for a facade voxel at height y.
function facadeBlock(face, x, y, z, gr) {
  const alongNS = face === "north" || face === "south";
  const L = alongNS ? W : D;
  const u = alongNS ? x : z;
  const bay = u % 3;
  const pilaster = bay === 0 || u === L - 1;
  const front = face === "north";

  if (y === TOP) return ["polished_andesite"];           // cornice / parapet
  if (y === F1 || y === 9) return ["polished_andesite"]; // storey lines

  if (y < F1) {
    if (y === gr) return ["polished_andesite"];           // base course
    if (y === 4) {                                         // transom band
      if (front && u >= 13 && u <= 15) return ["red_concrete"]; // entrance awning
      return ["polished_andesite"];
    }
    if (front && u === 14 && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      return ["dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" }];
    }
    if (front && (u === 10 || u === 19) && y === 3) {
      return ["lantern", { hanging: "true" }];
    }
    if (pilaster) return ["polished_andesite"];
    return ["black_stained_glass"];                        // shopfront glazing
  }

  // upper floor, y 6..8
  if (pilaster) return ["polished_andesite"];
  return ["light_blue_stained_glass"];
}

const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };
const glowSpots = [];

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "stone_bricks");

  if (gr >= TOP) continue; // nothing above ground at roof height

  const perim = !(has(x, z - 1) && has(x, z + 1) && has(x - 1, z) && has(x + 1, z));
  const face = perim ? faceOf(x, z) : null;

  for (let y = Math.max(gr, 0); y <= TOP; y++) {
    if (y === TOP) {
      put(x, y, z, perim ? "polished_andesite" : "light_gray_concrete");
      continue;
    }
    if (perim) {
      const [id, props] = facadeBlock(face, x, y, z, gr);
      put(x, y, z, id, props);
    } else if (y === F1) {
      put(x, y, z, "smooth_quartz");   // floor slab, no interior fitout
    }
    // otherwise air: no interiors
  }

  if (perim && face) {
    const alongNS = face === "north" || face === "south";
    const u = alongNS ? x : z;
    if (u % 3 === 1 || u % 3 === 2) glowSpots.push({ x, z, face, u });
  }
}

// Warm light behind some upper windows: glowstone in the interior cell just inside the glass.
for (const { x, z, face, u } of glowSpots) {
  if ((u + (x + z) * 3) % 4 !== 0) continue;
  const [dx, dz] = INWARD[face];
  const ix = x + dx, iz = z + dz;
  const interior =
    has(ix, iz) && has(ix, iz - 1) && has(ix, iz + 1) && has(ix - 1, iz) && has(ix + 1, iz);
  if (!interior) continue;
  put(ix, 7, iz, "glowstone");
}

// Roof plant: AC condenser boxes and one water tank on interior roof cells.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (gr > TOP) continue;
  const interior =
    has(x, z - 1) && has(x, z + 1) && has(x - 1, z) && has(x + 1, z) &&
    has(x, z - 2) && has(x, z + 2) && has(x - 2, z) && has(x + 2, z);
  if (!interior) continue;
  if ((x + z) % 9 === 0 && x > 2 && x < W - 3) {
    put(x, TOP + 1, z, "iron_block");
  }
  if (x === 14 && z === 6) {
    for (let y = TOP + 1; y <= TOP + 3; y++) put(x, y, z, "white_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
