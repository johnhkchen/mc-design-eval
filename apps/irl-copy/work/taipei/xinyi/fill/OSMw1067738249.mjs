import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738249";
const W = 34, H = 47, D = 19;

// Footprint cells: [x, z, ground]
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
let minG = Infinity;
for (const c of cells) {
  const [x, z, gr] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  G.set(`${x},${z}`, gr);
  if (gr < minG) minG = gr;
}
if (!G.size) throw new Error("no footprint cells");

// Storeys: 7 x 5 blocks anchored on the lowest ground. Roof slab at R.
const B = minG;
const R = B + 35;
const STOREYS = 7;

const vox = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
}
const has = (x, z) => G.has(`${x},${z}`);
const groundAt = (x, z) => G.get(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isDepth2 = (x, z) =>
  !isEdge(x, z) && (isEdge(x - 1, z) || isEdge(x + 1, z) || isEdge(x, z - 1) || isEdge(x, z + 1));

const CORE = { x0: 11, x1: 22, z0: 6, z1: 12 };
const inCore = (x, z) => x >= CORE.x0 && x <= CORE.x1 && z >= CORE.z0 && z <= CORE.z1;

const ENTRANCE_X = 16;
const ENTRANCE_Z = 0;

const paneAlong = (axisX) =>
  axisX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1. Foundations and building shell, cell by cell
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const depth2 = isDepth2(x, z);
  const corner =
    (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
  const axisX = !has(x, z - 1) || !has(x, z + 1); // facade runs along x
  const idx = axisX ? x : z;
  const mull = corner || idx % 3 === 0;

  const top = Math.min(R + 2, H - 1);
  for (let y = gr; y <= top; y++) {
    const s = (y - B) % 5;
    const k = Math.floor((y - B) / 5);

    // Roof slab
    if (y === R) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    // Parapet and cornice above roof
    if (y === R + 1 || y === R + 2) {
      if (edge) {
        if (y === R + 1) put(x, y, z, "smooth_quartz");
        else put(x, y, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
      }
      continue;
    }
    if (y > R) continue;

    if (edge) {
      // Entrance on the street face
      if (x === ENTRANCE_X && z === ENTRANCE_Z && has(x, z)) {
        if (y === gr) {
          put(x, y, z, "dark_oak_door", {
            facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
          });
          continue;
        }
        if (y === gr + 1) {
          put(x, y, z, "dark_oak_door", {
            facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
          });
          continue;
        }
      }
      if (y === gr && y !== B + s) {
        put(x, y, z, "polished_granite"); // base course at the street
        continue;
      }
      if (s === 0) {
        put(x, y, z, k === 0 ? "polished_granite" : "light_gray_concrete");
      } else if (s === 4) {
        put(x, y, z, "light_gray_concrete");
      } else if (k === 0) {
        // Shopfront: glass with dark mullions
        if (x === ENTRANCE_X && z === ENTRANCE_Z && (x === 15 || x === 17)) {
          put(x, y, z, "polished_granite");
        } else if (mull) {
          put(x, y, z, "polished_andesite");
        } else {
          put(x, y, z, "light_blue_stained_glass_pane", paneAlong(axisX));
        }
      } else {
        // Office windows with white pillars and bands
        if (mull) put(x, y, z, "white_concrete");
        else put(x, y, z, "light_blue_stained_glass_pane", paneAlong(axisX));
      }
      continue;
    }

    // Interior: floor slabs at each storey line and at the ground
    if (y === gr || s === 0) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (depth2) {
      // Air gap behind the glass, with warm light in some windows
      if (s === 2 && (x + z + k) % 4 === 0) put(x, y, z, "glowstone");
      continue;
    }

    // Depth 3 and deeper: central core, otherwise air
    if (inCore(x, z)) put(x, y, z, "light_gray_concrete");
  }
}

// 2. Rooftop plant room and antenna in the centre
const PH = { x0: 12, x1: 21, z0: 7, z1: 11 };
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!has(x, z)) continue;
    const ring = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    for (let y = R + 1; y <= R + 3; y++) {
      if (y > H - 1) break;
      if (ring) put(x, y, z, "gray_concrete");
    }
    if (R + 4 <= H - 1) put(x, R + 4, z, "smooth_stone");
  }
}
const ax = 16, az = 9;
if (has(ax, az)) {
  for (let y = R + 5; y <= R + 8 && y <= H - 1; y++) {
    put(ax, y, az, "lightning_rod", { facing: "up", powered: "false" });
  }
}

vox.save(`${DIR}/${ID}.nbt`);
