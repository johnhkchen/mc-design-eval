import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772098849";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Two storeys of 5 blocks, parapet to y=10 (roof surface at 11), plant on top.
const BASE = "stone_bricks";
const FRAME = "white_concrete";
const PIER = "smooth_quartz";
const GLASS = "cyan_stained_glass";
const FLOOR = "smooth_stone";
const ROOF = "light_gray_concrete";
const RTU = "gray_concrete";

const k = (x, z) => `${x},${z}`;
const S = new Set();
const GR = new Map();
for (const [x, z, gr] of cells) {
  S.add(k(x, z));
  GR.set(k(x, z), Math.max(0, Math.round(gr)));
}
const inS = (x, z) => S.has(k(x, z));

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]];
const outsOf = (x, z) => DIRS.filter(([dx, dz]) => !inS(x + dx, z + dz));

const isPerim = (x, z) => outsOf(x, z).length > 0;

// Pick the door cell: a non-corner perimeter cell on the south (+z) face nearest the middle.
let doorCell = null;
for (const [x, z] of [...S].map((s) => s.split(",").map(Number))) {
  const outs = outsOf(x, z);
  if (outs.length !== 1) continue;
  const [dx, dz] = outs[0];
  if (dx !== 0 || dz !== 1) continue;
  if (!doorCell || Math.abs(x - 8) < Math.abs(doorCell[0] - 8)) doorCell = [x, z];
}

// Main shell
for (const key of S) {
  const [x, z] = key.split(",").map(Number);
  const ground = GR.get(key);

  // Foundation up to the cell's own ground
  for (let y = 0; y < ground; y++) put(x, y, z, BASE);

  const outs = outsOf(x, z);
  if (outs.length === 0) {
    // Interior: floor slabs only, air between
    put(x, ground, z, FLOOR);
    put(x, 5, z, FLOOR);
    put(x, 10, z, ROOF);
    continue;
  }

  const corner = outs.length > 1;
  const [dx, dz] = outs[0];
  const u = dz !== 0 ? x : z; // position along the face
  const pier = corner || u % 3 === 0;

  for (let y = ground; y <= 10; y++) {
    let id;
    if (y === 0) id = BASE;
    else if (y === 4 || y === 5 || y === 10) id = FRAME;
    else if (y === 9) id = PIER;
    else id = pier ? PIER : GLASS; // storey windows 1..3 and 6..8
    put(x, y, z, id);
  }

  // Warm lights behind some glass, in the air gap of the interior cell
  const ix = x - dx, iz = z - dz;
  if (!corner && inS(ix, iz) && !isPerim(ix, iz)) {
    if (u % 6 === 1) put(ix, 2, iz, "glowstone");
    if (u % 6 === 4) put(ix, 7, iz, "glowstone");
  }
}

// Entrance on the south face
if (doorCell) {
  const [x, z] = doorCell;
  const ground = GR.get(k(x, z));
  put(x, ground, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, ground + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Roof plant: a small mechanical box and a lightning rod on the centre
for (let x = 6; x <= 10; x++) {
  for (let z = 6; z <= 10; z++) {
    if (inS(x, z) && !isPerim(x, z)) put(x, 11, z, RTU);
  }
}
if (inS(8, 8) && !isPerim(8, 8)) {
  put(8, 12, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
