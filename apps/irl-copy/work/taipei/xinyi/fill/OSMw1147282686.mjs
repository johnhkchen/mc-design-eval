import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1147282686";
const W = 18, D = 27, H = 38;
const ROOF_Y = 26;      // roof deck, about 26 blocks above lowest ground
const TOP_FLOOR_Y = 25; // ceiling of storey 5
const STOREY = 5;       // blocks per storey, five storeys

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`) ?? 0;

// Edge: a footprint cell with at least one open side.
const onNS = (x, z) => !has(x, z - 1) || !has(x, z + 1); // on north or south face
const onEW = (x, z) => !has(x - 1, z) || !has(x + 1, z); // on east or west face
const isEdge = (x, z) => onNS(x, z) || onEW(x, z);
const isCorner = (x, z) => onNS(x, z) && onEW(x, z);
// Position along the face: x on north/south faces, z on east/west faces.
const faceU = (x, z) => (onNS(x, z) ? x : z);

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const edge = isEdge(x, z);
  const corner = isCorner(x, z);
  const u = faceU(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");

  // Body from ground up to the top floor ceiling.
  for (let y = gr; y <= TOP_FLOOR_Y; y++) {
    const s = Math.floor(y / STOREY);
    const yy = y % STOREY;

    // Granite plinth on the ground-floor perimeter.
    if (y === gr && s === 0 && edge) {
      put(x, y, z, "polished_granite");
      continue;
    }

    if (!edge) {
      // Interior: floor slab per storey, air otherwise, some warm glowstone behind glass.
      if (yy === 0) {
        put(x, y, z, "light_gray_concrete");
      } else if (yy === 2 && (x + 2 * z + 3 * s) % 5 === 0) {
        put(x, y, z, "glowstone");
      }
      continue;
    }

    if (corner) {
      put(x, y, z, "white_concrete");
    } else if (yy === 0) {
      put(x, y, z, "white_concrete");            // spandrel / floor line
    } else if (yy === 4) {
      put(x, y, z, "light_gray_concrete");       // storey line
    } else if (u % 3 === 0) {
      put(x, y, z, "white_concrete");            // mullion
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", PANE); // window glass
    }
  }

  // Roof: cornice on the edge, roof deck inside.
  if (edge) {
    put(x, ROOF_Y, z, "smooth_stone");
    if (u % 2 === 0) put(x, ROOF_Y + 1, z, "white_concrete"); // parapet merlons
  } else {
    put(x, ROOF_Y, z, "light_gray_concrete");
  }
}

// Entrance on the z = 0 face: a single dark oak door, one block in from the centre.
const DOOR_X = 9;
if (has(DOOR_X, 0)) {
  const gr = gAt(DOOR_X, 0);
  put(DOOR_X, gr + 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(DOOR_X, gr + 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Rooftop core, centred on the roof, with a lightning-rod mast.
const CORE = { x0: 6, x1: 11, z0: 9, z1: 17 };
for (let x = CORE.x0; x <= CORE.x1; x++) {
  for (let z = CORE.z0; z <= CORE.z1; z++) {
    if (!has(x, z)) continue;
    const ring = x === CORE.x0 || x === CORE.x1 || z === CORE.z0 || z === CORE.z1;
    const corner = (x === CORE.x0 || x === CORE.x1) && (z === CORE.z0 || z === CORE.z1);
    if (!ring) {
      put(x, 31, z, "light_gray_concrete");
      continue;
    }
    put(x, 27, z, "white_concrete");
    put(x, 30, z, "white_concrete");
    for (const y of [28, 29]) {
      if (corner) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", PANE);
    }
    put(x, 31, z, "light_gray_concrete");
  }
}
if (has(8, 13)) {
  for (let y = 32; y <= 36; y++) put(8, y, 13, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
