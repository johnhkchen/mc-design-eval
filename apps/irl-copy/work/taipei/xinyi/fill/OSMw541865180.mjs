import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541865180.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541865180.nbt";

// Record: 23 x 18 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey (about 5 blocks per storey) Taiwanese commercial block of the
// 1990s: cream tiled walls, a dark shopfront storey, a terracotta band, a quartz cornice
// and a parapet. Roof sits at absolute y = 11 (top of parapet), so it reads flat from the air.

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 23, H = 23, D = 18;
const g = new Voxels([W, H, D]);

const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => ground.has(`${x},${z}`);
const inBox = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => {
  if (!inBox(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const ROOF_Y = 11;      // top of parapet / roof units start here
const DECK_Y = 10;      // roof deck and cornice band
const FLOOR2_Y = 5;     // storey 1 / storey 2 division
const LINTEL_Y = 4;     // shopfront head

const facingName = { N: "north", S: "south", E: "east", W: "west" };
const entranceX = Math.floor((minX + maxX) / 2);

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Outward faces: a neighbour missing from the footprint means an exterior face.
  const dirs = [];
  if (!has(x, z - 1)) dirs.push("N");
  if (!has(x, z + 1)) dirs.push("S");
  if (!has(x - 1, z)) dirs.push("W");
  if (!has(x + 1, z)) dirs.push("E");

  // Interior: floor slab at storey line and roof deck (no interior fitout).
  if (dirs.length === 0) {
    put(x, FLOOR2_Y, z, "smooth_stone");
    put(x, DECK_Y, z, "light_gray_concrete");
    // Roof plant: small AC units and a couple of taller housings on the deck.
    if (((x - minX) % 5 === 2) && ((z - minZ) % 4 === 1)) put(x, ROOF_Y, z, "gray_concrete");
    if (x === entranceX && ((z - minZ) % 6 === 3)) {
      put(x, ROOF_Y, z, "light_gray_concrete");
    }
    continue;
  }

  // Exterior cells.
  const corner = dirs.length > 1;
  const dir = dirs[0];
  const u = (dir === "N" || dir === "S") ? x - minX : z - minZ;
  const pier = corner || (u % 3 !== 1);
  const isEntrance = !corner && dir === "S" && x === entranceX;
  const isWindowCol = !pier;

  // Interior cell directly behind this face (for warm lights).
  const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[dir];
  const ix = x + (corner ? 0 : inward[0]);
  const iz = z + (corner ? 0 : inward[1]);
  const behindInside = !corner && has(ix, iz);

  for (let y = gr; y <= DECK_Y; y++) {
    if (y === gr) {
      put(x, y, z, "polished_diorite");                       // base course
    } else if (y <= 3) {
      if (isEntrance && (y === gr + 1 || y === gr + 2)) {
        // Door handled below.
      } else if (pier) {
        put(x, y, z, "white_concrete");                        // shopfront piers
      } else {
        put(x, y, z, "gray_stained_glass");                    // shopfront glazing
      }
    } else if (y === LINTEL_Y) {
      if (isEntrance) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      else put(x, y, z, "smooth_quartz");                      // shopfront lintel
    } else if (y === FLOOR2_Y) {
      put(x, y, z, "brown_terracotta");                        // storey band
    } else if (y === 6) {
      put(x, y, z, pier ? "white_concrete" : "smooth_quartz"); // window sill / pier
    } else if (y >= 7 && y <= 9) {
      if (pier) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass");              // upper windows
        if (y === 8 && behindInside && (u % 6 === 1)) {
          put(ix, y, iz, "shroomlight");                       // warm light behind glass
        }
      }
    } else if (y === DECK_Y) {
      put(x, y, z, "smooth_quartz");                           // cornice
    }
  }

  // Parapet on every exterior cell, capping the roof at y = 11.
  put(x, ROOF_Y, z, "white_concrete");

  // Entrance door on the south (street) face, two blocks tall.
  if (isEntrance) {
    const f = facingName[dir];
    const lo = gr + 1, hi = gr + 2;
    put(x, lo, z, "dark_oak_door", { facing: f, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, hi, z, "dark_oak_door", { facing: f, half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

g.save(OUT);
