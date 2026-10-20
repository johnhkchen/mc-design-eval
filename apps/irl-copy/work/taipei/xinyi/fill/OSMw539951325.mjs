import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record is missing, so this is a generic 1980s-90s Taipei two-storey commercial shophouse:
// white tiled concrete facade, light-grey string courses, glass shopfront with a red awning
// on the street face, a flat roof with parapet and a small water tank.
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw539951325";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 23, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, st) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (st) g.set(x, y, z, b, st);
  else g.set(x, y, z, b);
};

const k = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(k(x, z), Math.round(gr));
const inF = (x, z) => ground.has(k(x, z));
const gAt = (x, z) => ground.get(k(x, z));

// Street (north) face cells: those with no footprint neighbour to the north.
const northXs = [];
for (const [x, z] of cells) if (!inF(x, z - 1)) northXs.push(x);
northXs.sort((a, b) => a - b);
const doorX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : Math.floor(W / 2);

const glassSt = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const doorSt = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const lanternSt = { hanging: "true", waterlogged: "false" };
const wallSt = { up: "true", north: "none", south: "none", east: "none", west: "none", waterlogged: "false" };
const slabBottom = { type: "bottom", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const g0 = Math.round(gr);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g0; y++) put(x, y, z, "stone");

  const N = !inF(x, z - 1), S = !inF(x, z + 1), W_ = !inF(x - 1, z), E = !inF(x + 1, z);
  const edge = N || S || W_ || E;
  // Column index along the wall for window rhythm.
  const idx = (N || S) ? x : z;
  const win = idx % 4 === 1 || idx % 4 === 2;

  if (!edge) {
    // Interior: floor slabs and roof deck, air between (no interiors).
    for (let y = g0; y <= 10; y++) {
      if (y === g0 || y === 5 || y === 10) {
        put(x, y, z, "smooth_stone");
      } else if (y === 4 && g0 < 4 && (x + 2 * z) % 6 === 0) {
        put(x, y, z, "lantern", lanternSt);
      } else if (y === 7 && g0 < 7 && (3 * x + z) % 7 === 0) {
        put(x, y, z, "glowstone");
      }
    }
    // Roof water tank on interior cells of the central roof.
    if (x >= 5 && x <= 7 && z >= 5 && z <= 7) {
      put(x, 11, z, "light_gray_concrete");
      put(x, 12, z, "light_gray_concrete");
      put(x, 13, z, "stone_brick_slab", slabBottom);
    }
    continue;
  }

  // Edge cells: facade bands.
  for (let y = g0; y <= 10; y++) {
    if (y === g0) {
      put(x, y, z, "stone_bricks");
    } else if (y <= 4) {
      if (N) {
        if (y === 4) {
          put(x, y, z, "red_concrete"); // shopfront awning
        } else if (x === doorX) {
          if (y === g0 + 1) put(x, y, z, "dark_oak_door", doorSt("lower"));
          else if (y === g0 + 2) put(x, y, z, "dark_oak_door", doorSt("upper"));
          else put(x, y, z, "glass_pane", glassSt);
        } else {
          put(x, y, z, "glass_pane", glassSt);
        }
      } else {
        put(x, y, z, win ? "glass_pane" : "white_concrete", win ? glassSt : undefined);
      }
    } else if (y === 5) {
      put(x, y, z, "light_gray_concrete");
    } else if (y >= 6 && y <= 8) {
      put(x, y, z, win ? "glass_pane" : "white_concrete", win ? glassSt : undefined);
    } else if (y === 9) {
      put(x, y, z, "white_concrete");
    } else if (y === 10) {
      put(x, y, z, "light_gray_concrete"); // cornice
    }
  }

  // Roof deck and parapet.
  put(x, 10, z, "light_gray_concrete");
  put(x, 11, z, "stone_brick_wall", wallSt);
}

// Warm lantern under the awning beside the entrance.
for (const [x, z] of cells) {
  if (!inF(x, z - 1) && Math.abs(x - doorX) === 2 && Math.round(gAt(x, z)) <= 2) {
    put(x, 3, z, "lantern", lanternSt);
  }
}

g.save(`${dir}/${id}.nbt`);
