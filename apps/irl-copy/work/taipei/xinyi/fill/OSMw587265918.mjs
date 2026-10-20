import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi commercial/residential block, c. 1990s-2000s:
// six storeys of 5 blocks, white tile spandrels, light-grey mullions,
// blue-glass curtain bands, dark-oak shopfront, plant penthouse on a light roof.
// Roof top sits 34 blocks above the lowest ground (penthouse top at y 33).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265918";
const W = 14, H = 46, D = 11;
const ROOF = 30;   // top of six storeys (6 x 5)
const PH_FLOOR = 31;
const PH_TOP = 33; // inclusive

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(H - 1, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`) ?? 0;

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// outward directions: N = -z, S = +z, W = -x, E = +x
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const outFaces = (x, z) =>
  Object.keys(DIRS).filter(f => !has(x + DIRS[f][0], z + DIRS[f][1]));

// entrance: middle of the south (front) run of footprint cells
const southXs = [];
for (let x = 0; x < W; x++) if (has(x, D - 1)) southXs.push(x);
const ex = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -1;
const exG = ex >= 0 ? gAt(ex, D - 1) : 0;

function facade(x, y, z, faces) {
  const s = Math.floor(y / 5);
  const o = y % 5;
  const face = faces[0];
  const i = (face === "N" || face === "S") ? x : z;
  const corner = faces.length > 1;
  const front = face === "S" && z === D - 1;

  // entrance door (two blocks) and canopy above it
  if (front && s === 0 && x === ex && (y === exG || y === exG + 1)) {
    return ["dark_oak_door", {
      facing: "south",
      half: y === exG ? "lower" : "upper",
      hinge: "left",
      open: "false",
      powered: "false",
    }];
  }
  if (front && s === 0 && ex >= 0 && Math.abs(x - ex) <= 2 && y === exG + 2) {
    return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }];
  }

  if (o === 0) return [s === 0 ? "stone_bricks" : "smooth_quartz"];   // storey line / base course
  if (o === 4) return ["white_concrete"];                              // spandrel

  const mullion = corner || i % 2 === 0;
  if (s === 0) return mullion ? ["dark_oak_planks"] : ["light_blue_stained_glass"];
  return mullion ? ["light_gray_concrete"] : ["light_blue_stained_glass"];
}

// main shell, per footprint cell
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = outFaces(x, z);
  if (faces.length) {
    // facade column from ground up to parapet
    for (let y = gr; y < ROOF; y++) {
      const [id, props] = facade(x, y, z, faces);
      put(x, y, z, id, props);

      // warm light in some windows, placed in the interior cell behind the glass
      const o = y % 5;
      const s = Math.floor(y / 5);
      const i = (faces[0] === "N" || faces[0] === "S") ? x : z;
      const corner = faces.length > 1;
      if (!corner && o === 2 && s >= 1 && i % 2 === 1 && (i + s) % 3 === 0) {
        const [dx, dz] = DIRS[faces[0]];
        const ix = x - dx, iz = z - dz;
        if (has(ix, iz) && outFaces(ix, iz).length === 0) {
          put(ix, y, iz, "lantern", { hanging: "false" });
        }
      }
    }
    // parapet and cap on the perimeter
    if (gr <= ROOF) {
      put(x, ROOF, z, "white_concrete");
      put(x, ROOF + 1, z, "smooth_quartz");
    }
  } else {
    // interior: floor slabs per storey, air between (no interiors)
    for (let y = gr; y < ROOF; y++) {
      if (y === gr || y % 5 === 0) put(x, y, z, "light_gray_concrete");
    }
    // roof slab
    if (gr <= ROOF) put(x, ROOF, z, "light_gray_concrete");
  }
}

// plant penthouse on the central footprint
for (let x = 4; x <= 9; x++) {
  for (let z = 3; z <= 7; z++) {
    if (!has(x, z)) continue;
    const gr = gAt(x, z);
    if (gr > PH_FLOOR) continue;
    const boundary = x === 4 || x === 9 || z === 3 || z === 7;
    const corner = (x === 4 || x === 9) && (z === 3 || z === 7);
    // plant floor
    put(x, PH_FLOOR, z, "light_gray_concrete");
    if (boundary) {
      put(x, PH_FLOOR + 1, z, corner ? "white_concrete" : "light_blue_stained_glass");
      put(x, PH_TOP, z, "smooth_quartz");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
