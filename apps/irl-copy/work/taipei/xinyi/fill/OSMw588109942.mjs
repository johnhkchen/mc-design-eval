import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1970s-80s Taipei shophouse-office: 8 storeys of 5 blocks (roof at y 40),
// cream-white tiled concrete walls, light-grey storey bands, dark ground-floor shopfront,
// aluminium-framed glass bays, a rooftop plant box and a short mast.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109942";
const W = 5, H = 52, D = 25;
const ROOF = 40;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(ROOF - 1, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const DOOR_X = 0, DOOR_Z = 12;

for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gr = ground.get(key);
  const edge = isEdge(x, z);
  // Along-facade index: z on the long (x-edge) faces, x on the short (z-edge) faces.
  const along = (x === 0 || x === W - 1) ? z : x;
  const pier = along % 4 === 0;

  // Foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!edge) {
    // Interior: floor slabs at each storey line, air elsewhere (no interiors).
    put(x, gr, z, "stone_bricks");
    for (let y = gr + 1; y < ROOF; y++) {
      if (y % 5 === 0) put(x, y, z, "light_gray_concrete");
    }
    put(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  // Facade (shell) column.
  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) { put(x, y, z, "smooth_quartz"); continue; }      // cornice
    if (y === gr) { put(x, y, z, "polished_andesite"); continue; }    // plinth
    if (y < 5) {
      // Ground-floor shopfront.
      if (y === 4) { put(x, y, z, "dark_oak_planks"); continue; }     // fascia
      put(x, y, z, pier ? "gray_concrete" : "glass");                 // frames / glazing
      continue;
    }
    // Upper storeys.
    const m = y % 5;
    if (m === 0) put(x, y, z, "light_gray_concrete");                  // storey line
    else if (m === 1 || m === 4) put(x, y, z, "white_concrete");       // sill / lintel
    else put(x, y, z, pier ? "white_concrete" : "glass");              // piers / glazing
  }

  // Parapet above the roof on the edge.
  put(x, ROOF + 1, z, "white_concrete");
}

// Entrance on the street (x = 0) facade: door with a lintel above, if the ground allows.
{
  const gr = ground.get(`${DOOR_X},${DOOR_Z}`);
  if (gr !== undefined && gr + 2 <= 4) {
    const lower = { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" };
    const upper = { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" };
    put(DOOR_X, gr + 1, DOOR_Z, "oak_door", lower);
    put(DOOR_X, gr + 2, DOOR_Z, "oak_door", upper);
    put(DOOR_X, gr + 3, DOOR_Z, "white_concrete");                     // transom over door
  }
}

// Warm light two blocks behind some street-facing windows (interior air gap kept).
for (let k = 0; k < 8; k++) {
  const y = 5 * k + 2;
  if (y >= ROOF) continue;
  for (let z = 3; z < D - 1; z += 6) {
    if (!has(2, z)) continue;
    const gr = ground.get(`2,${z}`);
    if (y <= gr) continue;
    put(2, y, z, k % 2 === 0 ? "glowstone" : "shroomlight");
  }
}

// Rooftop plant box and mast.
for (let x = 1; x <= 3; x++) {
  for (let z = 8; z <= 11; z++) {
    if (!has(x, z)) continue;
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
  }
}
if (has(2, 12)) {
  for (let y = ROOF + 1; y <= ROOF + 6; y++) {
    put(2, y, 12, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
