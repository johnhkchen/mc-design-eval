import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1153980396.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1153980396.nbt";

const W = 16, H = 23, D = 28;
const g = new Voxels([W, H, D]);

const cells = JSON.parse(readFileSync(CELLS, "utf8"));

// footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, Number(gy) || 0);

const inFp = (x, z) => ground.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// perimeter: some side neighbour is outside the footprint
const isPerim = (x, z) => DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz));

// corner: outside neighbours on both axes
const isCorner = (x, z) => {
  const xOut = !inFp(x + 1, z) || !inFp(x - 1, z);
  const zOut = !inFp(x, z + 1) || !inFp(x, z - 1);
  return xOut && zOut;
};

// inward neighbour (first footprint neighbour), for placing light behind glass
const inward = (x, z) => {
  for (const [dx, dz] of DIRS) if (inFp(x + dx, z + dz)) return [x + dx, z + dz];
  return null;
};

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const GLASS = "glass_pane";
const WALL = "white_concrete";
const BAND = "light_gray_concrete";
const BASE = "stone_bricks";
const FLOOR = "polished_andesite";
const SIGN = "smooth_stone";

// Pass 1: foundations, floor slabs, roof deck, parapet, shell
for (const [x, z, gy] of cells) {
  // foundation: solid from y0 up to the cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, BASE);

  // ground floor slab and second floor slab
  put(x, gy, z, FLOOR);
  put(x, gy + 5, z, BAND);

  // roof deck
  put(x, gy + 9, z, BAND);

  if (!isPerim(x, z)) continue;

  const corner = isCorner(x, z);
  const pier = corner || (x + z) % 4 === 0;
  const doorCell = z === D - 1 && (x === 7 || x === 8);

  // ground storey: gy+1 .. gy+4
  if (doorCell) {
    put(x, gy + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gy + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gy + 3, z, GLASS);
    put(x, gy + 4, z, SIGN);
  } else if (pier) {
    for (let y = gy + 1; y <= gy + 4; y++) put(x, y, z, WALL);
  } else {
    for (let y = gy + 1; y <= gy + 3; y++) put(x, y, z, GLASS);
    put(x, gy + 4, z, SIGN);
  }

  // second storey: gy+6 .. gy+8
  for (let y = gy + 6; y <= gy + 8; y++) {
    put(x, y, z, pier ? WALL : GLASS);
  }
  if (!pier) put(x, gy + 6, z, BAND); // sill course under the window

  // parapet with stone cap
  put(x, gy + 10, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

// Pass 2: warm lights behind selected windows (inside the air gap)
for (const [x, z, gy] of cells) {
  if (!isPerim(x, z) || isCorner(x, z)) continue;
  if ((x + z) % 4 === 0) continue;
  const ins = inward(x, z);
  if (!ins) continue;
  const [ix, iz] = ins;
  if (isPerim(ix, iz)) continue;

  if ((x + z) % 8 === 5) {
    put(ix, gy + 7, iz, "glowstone");
  }
  if ((x + z) % 8 === 1 && z !== D - 1) {
    put(ix, gy + 2, iz, "glowstone");
  }
}

// Pass 3: roof plant on the upper roof, centred on the footprint
for (const [x, z, gy] of cells) {
  if (x >= 5 && x <= 9 && z >= 10 && z <= 14) {
    put(x, gy + 10, z, "gray_concrete");
    if (x >= 6 && x <= 8 && z >= 11 && z <= 13) {
      put(x, gy + 11, z, BAND);
    }
  }
}

g.save(OUT);
