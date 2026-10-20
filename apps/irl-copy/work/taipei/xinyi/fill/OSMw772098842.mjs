import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772098842";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 20 x 24 footprint, 23 blocks tall. Two storeys of 5 blocks, roof about 11 above the lowest ground.
const W = 20, H = 23, D = 24;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inF = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);

// bounds-safe setter
function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// street-facing entrance: the footprint cell on the lowest-z edge nearest the middle
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
const mid = (W - 1) / 2;
let doorX = null;
for (const [x, z] of cells) {
  if (z !== minZ || !isEdge(x, z)) continue;
  if (doorX === null || Math.abs(x - mid) < Math.abs(doorX - mid)) doorX = x;
}
const doorKey = doorX === null ? null : key(doorX, minZ);

// neighbour test for glass pane connections
const connect = (x, z, dx, dz) => (inF(x + dx, z + dz) ? "true" : "false");

for (const [x, z, gy0] of cells) {
  const gy = Math.round(gy0);
  const edge = isEdge(x, z);

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  // ground floor slab, storey slab, roof deck
  put(x, gy, z, "light_gray_concrete");
  put(x, gy + 5, z, "light_gray_concrete");
  put(x, gy + 10, z, "light_gray_concrete");

  if (!edge) {
    // interior: air, with a few warm lanterns standing on the slabs
    if ((x * 3 + z * 5) % 13 === 0) put(x, gy + 1, z, "lantern", { hanging: "false" });
    if ((x * 5 + z * 7) % 17 === 3) put(x, gy + 6, z, "lantern", { hanging: "false" });

    // roof plant: small rooftop units and a water tank
    if (x % 6 === 3 && z % 6 === 3) {
      put(x, gy + 11, z, "iron_block");
      put(x, gy + 12, z, "light_gray_concrete");
    } else if (x % 6 === 0 && z % 6 === 0) {
      put(x, gy + 11, z, "light_gray_concrete");
    }
    continue;
  }

  // facade faces
  const onZFace = !inF(x, z - 1) || !inF(x, z + 1);
  const onXFace = !inF(x - 1, z) || !inF(x + 1, z);
  const pillar =
    (onZFace && x % 3 === 0) || (onXFace && z % 3 === 0) || (onZFace && onXFace);

  // base wall
  for (let y = gy + 1; y <= gy + 9; y++) put(x, y, z, "white_concrete");

  // ground floor: plinth, shopfront glass, lintel
  put(x, gy + 1, z, "stone_bricks");
  for (const y of [gy + 2, gy + 3]) {
    if (pillar) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane", {
      north: connect(x, z, 0, -1),
      south: connect(x, z, 0, 1),
      east: connect(x, z, 1, 0),
      west: connect(x, z, -1, 0),
      waterlogged: "false",
    });
  }
  put(x, gy + 4, z, "smooth_quartz");

  // upper storey: spandrel, window band, sill
  put(x, gy + 6, z, "white_concrete");
  for (const y of [gy + 7, gy + 8]) {
    if (pillar) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane", {
      north: connect(x, z, 0, -1),
      south: connect(x, z, 0, 1),
      east: connect(x, z, 1, 0),
      west: connect(x, z, -1, 0),
      waterlogged: "false",
    });
  }
  put(x, gy + 9, z, "smooth_quartz");

  // cornice and parapet
  put(x, gy + 10, z, "smooth_quartz");
  put(x, gy + 11, z, "smooth_quartz");

  // warm light behind some upper windows
  if (!pillar && (x + 2 * z) % 9 === 4) put(x, gy + 7, z, "shroomlight");
}

// entrance: double-height door under a hanging lantern
if (doorKey !== null) {
  const gy = Math.round(ground.get(doorKey));
  const x = doorX, z = minZ;
  put(x, gy + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gy + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gy + 3, z, "lantern", { hanging: "true" });
}

g.save(`${DIR}/${ID}.nbt`);
