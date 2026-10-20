import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw441377768";
const W = 105, H = 23, D = 73;
const ROOF = 11;      // roof slab top, 11 blocks above lowest ground
const PARAPET = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const ground = (x, z) => G.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isPerim = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
// street frontage = smallest-z row; entrance sits at its middle
const streetXs = cells.filter(([, z]) => z === minZ).map(([x]) => x);
const streetCx = streetXs.reduce((a, b) => a + b, 0) / streetXs.length;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pass 1: foundation, perimeter walls, floor slabs, roof slab
for (const [x, z, gr] of cells) {
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");
  const perim = isPerim(x, z);
  for (let y = gr + 1; y < ROOF; y++) {
    if (perim) put(x, y, z, "smooth_quartz");
  }
  if (gr < 5) put(x, 5, z, "light_gray_concrete");   // storey floor line
  put(x, ROOF, z, "smooth_stone");                   // roof slab
}

// Pass 2: facade articulation on perimeter cells
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const entr = z === minZ && Math.abs(x - streetCx) <= 2;

  // base course
  if (!entr && gr + 1 <= 3) put(x, gr + 1, z, "polished_granite");

  if (entr) {
    // double door with lintel above
    put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "light_gray_concrete");
  } else {
    // shopfront glazing with stone piers
    for (let y = gr + 2; y <= 3; y++) {
      const glazed = (x + z) % 4 !== 0;
      put(x, y, z, glazed ? "light_blue_stained_glass" : "smooth_quartz");
    }
  }

  // belt course above shopfront
  if (4 > gr) put(x, 4, z, "light_gray_concrete");

  // upper storey window grid
  for (let y = 6; y <= 9; y++) {
    if (y <= gr) continue;
    const glazed = (x + z) % 3 !== 0;
    put(x, y, z, glazed ? "light_blue_stained_glass" : "smooth_quartz");
  }

  // belt course and parapet
  if (10 > gr) put(x, 10, z, "light_gray_concrete");
  put(x, PARAPET, z, "stone_brick_slab", { type: "bottom" });
}

// Pass 3: warm lights set just behind some upper-storey windows
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  if ((x * 31 + z * 17) % 11 !== 0) continue;
  if (gr >= 7) continue;
  // find an interior neighbour (inside footprint, not perimeter) to sit behind the glass
  const inward = DIRS
    .map(([dx, dz]) => [x + dx, z + dz])
    .filter(([nx, nz]) => has(nx, nz) && !isPerim(nx, nz) && ground(nx, nz) < 7);
  if (inward.length === 0) continue;
  const [ix, iz] = inward[0];
  put(ix, 7, iz, "glowstone");
}

// Pass 4: rooftop plant core and vents
for (const [x, z] of cells) {
  const core = x >= minX + 14 && x <= maxX - 14 && z >= minZ + 12 && z <= maxZ - 12;
  if (!core) continue;
  put(x, PARAPET, z, "light_gray_concrete");
  put(x, PARAPET + 1, z, "light_gray_concrete");
  if (x % 6 === 0 && z % 6 === 0) put(x, PARAPET + 2, z, "iron_bars");
}

g.save(`${DIR}/${ID}.nbt`);
