import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1340248604.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1340248604.nbt";

const W = 29, H = 24, D = 7;

// Materials: cream quartz walls, granite base and string courses,
// glass shopfronts and windows with quartz pilasters, green glazed tile cap
const WALL = "quartz_block";
const BASE = "polished_granite";
const BAND = "smooth_quartz";
const PILL = "quartz_pillar";
const GLASS = "glass_pane";
const CAP = "green_glazed_terracotta";
const FLOOR = "smooth_stone";
const ROOFDECK = "smooth_stone";
const DOOR = "dark_oak_door";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(x + "," + z, gr);
const has = (x, z) => ground.has(x + "," + z);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Entrance: centre of the south (+z) facade
const southB = [];
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!has(x, z + 1)) southB.push(x);
}
southB.sort((a, b) => a - b);
const doorB = southB.length ? southB[Math.floor(southB.length / 2)] : -1;

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = {
    N: !has(x, z - 1),
    S: !has(x, z + 1),
    W: !has(x - 1, z),
    E: !has(x + 1, z),
  };
  const ext = faces.N || faces.S || faces.W || faces.E;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  // Storey floor slabs (ground, first floor, roof deck)
  put(x, gr, z, FLOOR);
  put(x, gr + 5, z, FLOOR);
  put(x, gr + 11, z, ROOFDECK);

  if (!ext) {
    // Interior: air between slabs, a few lanterns on the roof
    if (x % 5 === 2 && z === 3) put(x, gr + 12, z, "lantern");
    continue;
  }

  // Exterior facade
  const onNS = faces.N || faces.S;
  const face = faces.N ? "N" : faces.S ? "S" : faces.W ? "W" : "E";
  const b = onNS ? x : z;
  const isDoor = faces.S && x === doorB;

  for (let r = 0; r <= 11; r++) {
    const y = gr + r;
    let id = WALL;
    if (r === 0) id = BASE;
    else if (r <= 3) id = b % 3 === 0 ? PILL : GLASS;
    else if (r === 4) id = BAND;
    else if (r === 5) id = BASE;
    else if (r === 6) id = WALL;
    else if (r === 7 || r === 8) id = b % 3 === 0 ? PILL : GLASS;
    else if (r === 9) id = WALL;
    else if (r === 10) id = BASE;
    else if (r === 11) id = CAP;

    if (isDoor && (r === 1 || r === 2)) {
      const half = r === 1 ? "lower" : "upper";
      put(x, y, z, DOOR, {
        facing: "south",
        half,
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isDoor && r === 3) id = WALL;

    put(x, y, z, id);
  }

  // Warm light: glowstone in the air gap behind upper-storey windows
  if (b % 6 === 2) {
    let ix = x, iz = z;
    if (face === "N") iz = z + 1;
    else if (face === "S") iz = z - 1;
    else if (face === "W") ix = x + 1;
    else ix = x - 1;
    if (has(ix, iz)) put(ix, gr + 7, iz, "glowstone");
  }
}

g.save(OUT);
