import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541865190";

// Footprint cells: [x, z, ground]
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = (Array.isArray(raw) ? raw : raw.cells).map((c) =>
  Array.isArray(c) ? { x: c[0], z: c[1], g: c[2] } : c
);

const W = 8, H = 23, D = 15;
const minG = Math.min(...list.map((c) => c.g));

// Storey and roof levels, relative to lowest ground (y 0)
const STRING = 5;   // second-floor slab / string course
const CORN = 10;    // cornice course
const ROOF = 11;    // roof slab top course
const PARAPET = 12; // parapet row above roof

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const c of list) {
  cellMap.set(key(c.x, c.z), Math.min(c.g - minG, CORN));
}
const has = (x, z) => cellMap.has(key(x, z));
const gnd = (x, z) => cellMap.get(key(x, z));
const frontZ = Math.min(...list.map((c) => c.z));

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

for (const c of list) {
  const x = c.x, z = c.z;
  const gr = gnd(x, z);

  const exN = !has(x, z - 1);
  const exS = !has(x, z + 1);
  const exW = !has(x - 1, z);
  const exE = !has(x + 1, z);
  const zFace = exN || exS;
  const xFace = exW || exE;
  const perimeter = zFace || xFace;
  const corner = zFace && xFace;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / base course
  if (perimeter) put(x, gr, z, "light_gray_concrete");
  else put(x, gr, z, "smooth_stone");

  // Second-floor slab / string course
  if (STRING >= gr) {
    if (perimeter) put(x, STRING, z, "smooth_quartz");
    else put(x, STRING, z, "smooth_stone");
  }

  // Roof slab
  put(x, ROOF, z, "smooth_stone");

  // Parapet and corner lanterns
  if (perimeter) {
    put(x, PARAPET, z, "white_concrete");
    if (corner) put(x, PARAPET + 1, z, "lantern", { hanging: "false" });
  }

  // Walls
  if (perimeter) {
    for (let y = gr + 1; y <= CORN; y++) {
      if (y === STRING) { put(x, y, z, "smooth_quartz"); continue; }
      if (y === CORN) { put(x, y, z, "smooth_quartz"); continue; }

      // Entrance: double door on the front (min-z) face, centred
      if (exN && z === frontZ && (x === 3 || x === 4) && (y === gr + 1 || y === gr + 2)) {
        const half = y === gr + 1 ? "lower" : "upper";
        const hinge = x === 3 ? "left" : "right";
        put(x, y, z, "oak_door", {
          facing: "north", half, hinge, open: "false", powered: "false",
        });
        continue;
      }

      const windowRow = (y > gr && y <= 3) || (y >= 6 && y <= 9);
      let isWindow = false;
      if (windowRow && !corner) {
        if (zFace) isWindow = x % 2 === 1;
        else if (xFace) isWindow = z % 2 === 1;
      }

      if (isWindow) {
        if (zFace) {
          put(x, y, z, "light_blue_stained_glass_pane", {
            north: "false", south: "false", east: "true", west: "true", waterlogged: "false",
          });
        } else {
          put(x, y, z, "light_blue_stained_glass_pane", {
            north: "true", south: "true", east: "false", west: "false", waterlogged: "false",
          });
        }
      } else {
        put(x, y, z, "white_concrete");
      }
    }
  }
}

// Interior: floor lamps and rooftop plant room
for (const c of list) {
  const x = c.x, z = c.z;
  const gr = gnd(x, z);
  const interior = !(!has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z));
  if (!interior) continue;

  if ((x + z) % 4 === 1 && gr + 1 < STRING) put(x, gr + 1, z, "glowstone");
  if ((x + z) % 4 === 3 && STRING + 1 < CORN) put(x, STRING + 1, z, "glowstone");
}

// Rooftop plant room (2x2 block housing on the roof)
for (let x = 2; x <= 3; x++) {
  for (let z = 4; z <= 5; z++) {
    if (!has(x, z)) continue;
    put(x, PARAPET, z, "light_gray_concrete");
    put(x, PARAPET + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
