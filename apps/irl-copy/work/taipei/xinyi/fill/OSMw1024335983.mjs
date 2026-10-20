import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unnamed 2-storey commercial block, Xinyi. Concrete frame with a stone plinth,
// shopfront at ground, glazed upper storey, quartz cornice and parapet, rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1024335983";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 17;
const TOP = 11;      // parapet block (roof level)
const FLOOR1 = 5;    // storey line between ground and upper floor
const CORNICE = 10;  // cornice band under parapet

const g = new Voxels([W, H, D]);
const key = (x, z) => `${x},${z}`;

const G = new Map();
for (const [x, z, gr] of cells) {
  G.set(key(x, z), Math.max(0, Math.min(9, Math.round(gr))));
}
const inside = (x, z) => G.has(key(x, z));
const gOf = (x, z) => G.get(key(x, z));

function set(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward faces that are exposed (neighbour not in footprint)
const DIRS = {
  N: [0, -1],
  S: [0, 1],
  W: [-1, 0],
  E: [1, 0],
};
function exposedFaces(x, z) {
  const out = [];
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!inside(x + dx, z + dz)) out.push(name);
  }
  return out;
}
function isPerimeter(x, z) {
  return inside(x, z) && exposedFaces(x, z).length > 0;
}

// Front = the exposed south face (max z), door on the median x of that face
const frontXs = [];
for (const [k] of G) {
  const [x, z] = k.split(",").map(Number);
  if (isPerimeter(x, z) && exposedFaces(x, z).includes("S")) frontXs.push(x);
}
frontXs.sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;
const frontZ = Math.max(...[...G.keys()].map((k) => Number(k.split(",")[1])));

for (const [k, ground] of G) {
  const [x, z] = k.split(",").map(Number);
  const per = isPerimeter(x, z);

  // Foundation: solid from 0 up to this cell's ground
  for (let y = 0; y < ground; y++) set(x, y, z, "stone");

  if (!per) {
    // Interior cell: ground-floor slab, storey slab, roof deck; air between
    set(x, ground, z, "light_gray_concrete");
    if (FLOOR1 > ground) set(x, FLOOR1, z, "light_gray_concrete");
    if (TOP > ground) set(x, TOP, z, "gray_concrete");
    continue;
  }

  const faces = exposedFaces(x, z);

  // Base course, then wall column up to parapet
  set(x, ground, z, "stone_bricks");
  for (let y = ground + 1; y <= TOP; y++) set(x, y, z, "white_concrete");

  // Storey line and cornice bands
  if (FLOOR1 > ground) set(x, FLOOR1, z, "light_gray_concrete");
  if (CORNICE > ground) set(x, CORNICE, z, "smooth_quartz");
  set(x, TOP, z, "smooth_quartz"); // parapet cap

  // Corners and piers stay solid; single-face cells get glazing
  if (faces.length !== 1) continue;
  const face = faces[0];
  const i = (face === "N" || face === "S") ? x : z;
  const bay = i % 3 !=  0;
  const [nx, nz] = DIRS[face];

  // Entrance on the front face
  if (face === "S" && x === doorX && ground + 2 <= 3) {
    set(x, ground + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    set(x, ground + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    set(x, ground + 3, z, "black_concrete"); // lintel over door
    // Warm lantern just inside the entrance
    if (inside(x, z - 1) && gOf(x, z - 1) < 4 && !isPerimeter(x, z - 1)) {
      set(x, 4, z - 1, "lantern", { hanging: "true", waterlogged: "false" });
    }
    continue;
  }

  if (!bay) continue;

  // Shopfront glazing at ground storey, with black header
  for (let y = ground + 1; y <= 3; y++) set(x, y, z, "light_blue_stained_glass");
  if (ground + 1 <= 4) set(x, 4, z, "black_concrete");

  // Upper storey glazing
  for (let y = 6; y <= 9; y++) {
    if (y <= ground) continue;
    set(x, y, z, "light_blue_stained_glass");
  }

  // Warm light behind some upper windows
  if (i % 6 === 1 && inside(x - nx, z - nz) && !isPerimeter(x - nx, z - nz)) {
    const ig = gOf(x - nx, z - nz);
    if (ig < 7) set(x - nx, 7, z - nz, "glowstone");
  }
}

// Rooftop plant: a few AC boxes on interior roof cells
let n = 0;
for (const [k, ground] of G) {
  const [x, z] = k.split(",").map(Number);
  if (isPerimeter(x, z) || ground >= TOP) continue;
  if (x < 4 || x > W - 5 || z < 4 || z > D - 5) continue;
  if ((x * 3 + z * 5) % 11 === 0 && n < 5) {
    set(x, TOP + 1, z, "light_gray_concrete");
    set(x, TOP + 2, z, "iron_block");
    n++;
  }
}

g.save(`${DIR}/${ID}.nbt`);
