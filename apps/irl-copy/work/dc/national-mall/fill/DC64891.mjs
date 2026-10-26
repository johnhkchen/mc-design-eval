import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC64891: 602 Emmanuel Ct NW, a 1920s red-brick walk-up in Adams Morgan-style
// rowhouse grain. Stone plinth, brick walls, a 6x6 block footprint with a
// two-storey wing (lidar roof 3) and a three-storey central pavilion (roof 4)
// on the side walls. Solid core per storey with an air gap behind the lower
// windows, warm glowstone behind some of the top windows.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC64891.cells.json`, "utf8"));

const N = 6;
const roofAt = new Map();
for (const [x, z, , roof] of cells) roofAt.set(`${x},${z}`, roof);
const R = (x, z) => roofAt.get(`${x},${z}`);

// Lidar roof is smoothed into flat tiers: 3 for the wings, 4 for the pavilion.
const tier = (x, z) => (R(x, z) >= 4 ? 4 : 3);

const ring = (x, z) => x === 0 || x === N - 1 || z === 0 || z === N - 1;
const corner = (x, z) => (x === 0 || x === N - 1) && (z === 0 || z === N - 1);
const DOOR = [2, 0];

// Which ring cells carry glass on a given storey. Front and back faces: pier at 4
// (front) and 2, 4 (back); side faces: windows on odd z, piers on even z.
function isWindow(x, z) {
  if (!ring(x, z) || corner(x, z)) return false;
  if (z === 0) return x !== DOOR[0] && x !== 4;
  if (z === N - 1) return x !== 2 && x !== 4;
  return z % 2 === 1; // x = 0 or N-1
}
const isDoor = (x, z) => z === 0 && x === DOOR[0];

// Block map keyed by "x,y,z" so pane connections can look at neighbours.
const M = new Map();
const put = (x, y, z, block, state) => M.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => M.get(`${x},${y},${z}`);

const lit = new Set(); // interior cells behind a window that get a warm light
for (let z = 0; z < N; z++)
  for (let x = 0; x < N; x++) {
    const T = tier(x, z);
    if (!R(x, z)) continue;
    if (ring(x, z)) {
      // plinth course
      put(x, 0, z, "stone_bricks");
      for (let y = 1; y < T; y++) {
        if (corner(x, z)) put(x, y, z, "stone_bricks");
        else if (isDoor(x, z)) {
          if (y === 1) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
          else if (y === 2) put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
          else put(x, y, z, "bricks");
        } else if (isWindow(x, z)) put(x, y, z, "glass_pane");
        else put(x, y, z, "bricks"); // red brick wall between the window bays
      }
      // cornice / parapet cap on top of the wall
      put(x, T, z, corner(x, z) ? "stone_bricks" : "stone_brick_slab", corner(x, z) ? undefined : { type: "bottom", waterlogged: "false" });
    } else {
      // interior: solid storey floors and core
      for (let y = 0; y < T; y++) put(x, y, z, "smooth_stone");
    }
  }

// Air gap behind lower windows; top-storey windows get a light or a blank wall behind them.
let k = 0;
for (let z = 0; z < N; z++)
  for (let x = 0; x < N; x++) {
    if (!ring(x, z) || !isWindow(x, z)) continue;
    const T = tier(x, z);
    // the interior cell directly behind this window
    const ix = x === 0 ? 1 : x === N - 1 ? N - 2 : x;
    const iz = z === 0 ? 1 : z === N - 1 ? N - 2 : z;
    for (let y = 1; y < T; y++) {
      if (y === T - 1) {
        k++;
        if (k % 2 === 1) lit.add(`${ix},${y},${iz}`);
      } else if (y === 1 && k % 5 === 0) {
        lit.add(`${ix},${y},${iz}`); // one warm ground-floor window
      } else M.delete(`${ix},${y},${iz}`); // the air gap behind glass
    }
  }
for (const key of lit) {
  const [x, y, z] = key.split(",").map(Number);
  put(x, y, z, "glowstone");
}

// Roof equipment: a brick flue with a slab cap on the wing roof, and a lightning rod on the pavilion's deck.
put(4, 3, 1, "bricks");
put(4, 4, 1, "bricks");
put(4, 5, 1, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
put(2, 4, 2, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// Glass panes connect to any non-air neighbour on the same storey (and to outside-footprint: no).
const SIDE = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const g = new Voxels([N, 6, N]);
for (const [key, v] of M) {
  const [x, y, z] = key.split(",").map(Number);
  let state = v.state;
  if (v.block === "glass_pane") {
    state = { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" };
    for (const [dir, [dx, dz]] of Object.entries(SIDE)) {
      const n = at(x + dx, y, z + dz);
      if (n) state[dir] = "true";
    }
  }
  g.set(x, y, z, v.block, state);
}

g.save(`${DIR}/DC64891.nbt`);
