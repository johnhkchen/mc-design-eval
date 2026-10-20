import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw441377767";
const W = 98, H = 23, D = 48;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));

// Lowest ground under the footprint sets the datum; roof sits ~11 blocks above it.
const L = Math.min(...cells.map((c) => c[2]));
const ROOF = L + 10;          // top block index of roof deck / cornice
const SEC2 = L + 5;           // storey line between the two storeys

const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const DIRS = [
  [1, 0, "x"], [-1, 0, "x"], [0, 1, "z"], [0, -1, "z"],
];

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Outward neighbours mark the facade edges.
  const out = DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz));

  if (out.length === 0) {
    // Interior: floor slab per storey, roof deck, air elsewhere (no interiors).
    put(x, SEC2, z, "light_gray_concrete");
    put(x, ROOF, z, "light_gray_concrete");
    // Rooftop plant boxes on a sparse grid.
    if ((x * 7 + z * 11) % 37 === 0 && x > 3 && z > 3 && x < W - 4 && z < D - 4) {
      put(x, ROOF + 1, z, "light_gray_concrete");
      put(x, ROOF + 2, z, "light_gray_concrete");
      put(x, ROOF + 3 <= H - 1 ? ROOF + 3 : ROOF + 2, z, "iron_block");
    }
    continue;
  }

  // Facade edge.
  const [ox, oz] = out[0];
  const wallAlongX = out.some(([, , a]) => a === "z");   // north/south wall runs along x
  const pane = wallAlongX ? PANE_X : PANE_Z;
  const pos = wallAlongX ? x : z;
  const ix = -ox, iz = -oz;                              // inward direction
  // Main entrance: centre of the south (+z) facade, shopfront glazed open.
  const isEntrance = oz === 1 && x >= 44 && x <= 53;

  for (let y = gr; y <= ROOF; y++) {
    if (y === gr) {
      // Base course.
      put(x, y, z, "stone_bricks");
    } else if (y <= L + 3) {
      // Ground-floor shopfront.
      if (isEntrance) {
        put(x, y, z, "glass");
      } else if (pos % 4 === 0) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane", pane);
      }
      // Warm light behind the shopfront glass.
      if (y === L + 2 && !isEntrance && pos % 8 === 2 && inside(x + ix, z + iz)) {
        put(x + ix, y, z + iz, "shroomlight");
      }
    } else if (y === L + 4) {
      // Lintel over the shopfront.
      put(x, y, z, "light_gray_concrete");
    } else if (y === SEC2) {
      // Floor line between storeys.
      put(x, y, z, "light_gray_concrete");
    } else if (y <= L + 8) {
      // Upper storey window grid with mullions.
      if (pos % 3 === 0) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane", pane);
      }
      // Glowstone behind some upper windows.
      if (y === L + 7 && (pos * 5) % 9 === 4 && inside(x + ix, z + iz)) {
        put(x + ix, y, z + iz, "glowstone");
      }
    } else if (y === L + 9) {
      // Cornice underside.
      put(x, y, z, "light_gray_concrete");
    } else if (y === ROOF) {
      // Parapet cap.
      put(x, y, z, "smooth_stone");
    }
  }

  // Interior floor slabs / roof deck are added by the interior branch;
  // edge cells also need the roof deck and floor line behind the glass.
  put(x, SEC2, z, "light_gray_concrete");
  put(x, ROOF, z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
