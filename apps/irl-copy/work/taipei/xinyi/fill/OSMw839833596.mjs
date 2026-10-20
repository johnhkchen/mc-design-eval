import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833596";
const W = 12, H = 23, D = 19;

// Footprint: [x, z, ground] per cell. Lowest ground becomes y 0.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
let minG = Infinity;
for (const [, , gr] of cells) minG = Math.min(minG, gr);
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr - minG));

const inFoot = (x, z) => ground.has(`${x},${z}`);
let minZ = Infinity;
for (const [x, z] of cells) minZ = Math.min(minZ, z);

// Storey plan (relative to each cell's ground g):
//  g        base course (perimeter) / floor slab (interior)
//  g+1..g+3 shopfront glass, piers, entrance door under a lintel
//  g+4      storey line
//  g+5..g+9 upper storey: spandrels, glass windows (g+6..g+8), storey line at g+9
//  g+10     cornice / roof deck
//  g+11     parapet (perimeter), roof plant (interior)

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Which outer face a perimeter cell belongs to (N = z-1 side, the street front).
function faceOf(x, z) {
  if (!inFoot(x, z - 1)) return "N";
  if (!inFoot(x, z + 1)) return "S";
  if (!inFoot(x - 1, z)) return "W";
  if (!inFoot(x + 1, z)) return "E";
  return null;
}

const pane = (alongX) => ({
  north: alongX ? "false" : "true",
  south: alongX ? "false" : "true",
  east: alongX ? "true" : "false",
  west: alongX ? "true" : "false",
  waterlogged: "false",
});

const doorProps = (half) => ({
  facing: "south",
  half,
  hinge: "left",
  open: "false",
  powered: "false",
  waterlogged: "false",
});

for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const g0 = ground.get(key);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");

  const face = faceOf(x, z);

  if (!face) {
    // Interior: floor slabs per storey and a roof deck; air between.
    put(x, g0, z, "smooth_stone");
    put(x, g0 + 5, z, "smooth_stone");
    put(x, g0 + 10, z, "smooth_quartz");
    // Roof plant: two air-conditioning blocks on the deck.
    if (x >= 3 && x <= 4 && z >= 7 && z <= 8) put(x, g0 + 11, z, "light_gray_concrete");
    continue;
  }

  // Perimeter: a facade on the outer face.
  const alongX = face === "N" || face === "S";
  const idx = alongX ? x : z;
  const span = alongX ? W : D;
  const pier = idx % 3 === 0 || idx === span - 1;
  const isDoor = face === "N" && z === minZ && idx === 4;

  // Base course.
  put(x, g0, z, "stone_bricks");

  // Shopfront storey.
  if (isDoor) {
    put(x, g0 + 1, z, "oak_door", doorProps("lower"));
    put(x, g0 + 2, z, "oak_door", doorProps("upper"));
    put(x, g0 + 3, z, "smooth_quartz");
  } else {
    for (let y = g0 + 1; y <= g0 + 3; y++) {
      if (pier) put(x, y, z, "polished_andesite");
      else put(x, y, z, "glass_pane", pane(alongX));
    }
  }

  // Storey line.
  put(x, g0 + 4, z, "smooth_quartz");

  // Upper storey: spandrel, windows, spandrel.
  put(x, g0 + 5, z, pier ? "polished_andesite" : "white_terracotta");
  for (let y = g0 + 6; y <= g0 + 8; y++) {
    if (pier) put(x, y, z, "polished_andesite");
    else put(x, y, z, "glass_pane", pane(alongX));
  }
  put(x, g0 + 9, z, "smooth_quartz");

  // Cornice and parapet.
  put(x, g0 + 10, z, "smooth_quartz");
  put(x, g0 + 11, z, "white_terracotta");

  // Warm light behind selected upper windows (one block inside the air gap).
  if (!pier && !isDoor && idx % 6 === 2) {
    const dx = face === "W" ? 1 : face === "E" ? -1 : 0;
    const dz = face === "N" ? 1 : face === "S" ? -1 : 0;
    const ix = x + dx, iz = z + dz;
    if (inFoot(ix, iz) && faceOf(ix, iz) === null) {
      put(ix, g0 + 7, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
