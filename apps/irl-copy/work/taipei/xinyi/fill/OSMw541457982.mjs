import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw541457982: 22 x 17 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey mid-century commercial block in reinforced concrete:
// cream-white wall, quartz storey lines, shopfront glazing at street level,
// punched windows above, a pier-and-corner rhythm, a cornice, and a small
// roof penthouse. Foundations are stone brick down to each cell's ground.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541457982.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541457982.nbt";

const W = 22, H = 23, D = 17;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const FP = new Map();
for (const [x, z, gr] of cells) FP.set(`${x},${z}`, gr);
const inFP = (x, z) => FP.has(`${x},${z}`);
const groundOf = (x, z) => FP.get(`${x},${z}`);

let lowest = Infinity;
for (const gr of FP.values()) lowest = Math.min(lowest, gr);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Perimeter: footprint cell with at least one missing 4-neighbour.
const isPerim = (x, z) => inFP(x, z) && DIRS.some(([dx, dz]) => !inFP(x + dx, z + dz));

// Corner: missing neighbours on both axes.
const isCorner = (x, z) => {
  const mx = !inFP(x + 1, z) || !inFP(x - 1, z);
  const mz = !inFP(x, z + 1) || !inFP(x, z - 1);
  return mx && mz && isPerim(x, z);
};

// Window cell: perimeter, not corner, and not a pier (piers every third cell).
const isWin = (x, z) => isPerim(x, z) && !isCorner(x, z) && ((x + z) % 3 !== 0);

// Front (street) face: the minimum-z perimeter row; door sits near its middle.
let minZ = Infinity;
for (const k of FP.keys()) minZ = Math.min(minZ, Number(k.split(",")[1]));
const frontXs = [...FP.keys()]
  .map(k => k.split(",").map(Number))
  .filter(([, z]) => z === minZ)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : 11;
const DOOR = `${doorX},${minZ}`;

// Safe setter that clips to the volume.
const S = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneProps = (x, z) => {
  const c = (dx, dz) => (isWin(x + dx, z + dz) ? "true" : "false");
  return {
    north: c(0, -1),
    south: c(0, 1),
    east: c(1, 0),
    west: c(-1, 0),
    waterlogged: "false",
  };
};

// Penthouse rectangle (interior of footprint), placed on each column's roof level.
const PH = { x0: 5, x1: 15, z0: 4, z1: 11 };

for (const [x, z, gr] of cells) {
  const T = Math.max(lowest + 11, gr + 10); // roof top (exclusive)

  // Foundation fill from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  if (isPerim(x, z)) {
    // Base course.
    S(x, gr, z, "polished_andesite");

    // Wall body up to the cornice.
    for (let y = gr + 1; y <= T - 2; y++) S(x, y, z, "white_concrete");

    // Storey lines and cornice.
    for (const y of [gr + 4, gr + 5, gr + 9]) S(x, y, z, "smooth_quartz");
    S(x, T - 1, z, "smooth_quartz");

    // Corner piers as quartz pillars.
    if (isCorner(x, z)) {
      for (let y = gr + 1; y <= T - 2; y++) S(x, y, z, "quartz_pillar", { axis: "y" });
    }

    // Shopfront glazing at street level, upper-floor punched windows.
    if (isWin(x, z)) {
      const p = paneProps(x, z);
      for (let y = gr + 1; y <= gr + 3; y++) S(x, y, z, "glass_pane", p);
      for (let y = gr + 6; y <= gr + 8; y++) S(x, y, z, "glass_pane", p);

      // Warm light just inside some upper windows (glowstone behind glass).
      if ((x * 3 + z) % 4 === 0) {
        for (const [dx, dz] of DIRS) {
          const nx = x + dx, nz = z + dz;
          if (inFP(nx, nz) && !isPerim(nx, nz)) {
            S(nx, gr + 7, nz, "glowstone");
            break;
          }
        }
      } else if ((x * 3 + z) % 4 === 2) {
        // Shroomlight behind a ground-floor pane.
        for (const [dx, dz] of DIRS) {
          const nx = x + dx, nz = z + dz;
          if (inFP(nx, nz) && !isPerim(nx, nz)) {
            S(nx, gr + 2, nz, "shroomlight");
            break;
          }
        }
      }
    }

    // Street entrance: double door with a hanging lantern above.
    if (`${x},${z}` === DOOR) {
      const dp = { facing: "north", hinge: "left", open: "false", powered: "false" };
      S(x, gr + 1, z, "dark_oak_door", { ...dp, half: "lower" });
      S(x, gr + 2, z, "dark_oak_door", { ...dp, half: "upper" });
      S(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  } else if (inFP(x, z)) {
    // Interior: floor slabs per storey and a roof deck; air elsewhere (no interiors).
    S(x, gr, z, "smooth_stone");
    S(x, gr + 5, z, "smooth_quartz");
    S(x, T - 1, z, "light_gray_concrete");
  }

  // Roof penthouse on interior cells of the rectangle.
  if (inFP(x, z) && !isPerim(x, z) &&
      x >= PH.x0 && x <= PH.x1 && z >= PH.z0 && z <= PH.z1) {
    const rim = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    if (rim) {
      S(x, T, z, "white_concrete");
      S(x, T + 1, z, "white_concrete");
    }
    S(x, T + 2, z, "smooth_quartz");
  }
}

g.save(OUT);
