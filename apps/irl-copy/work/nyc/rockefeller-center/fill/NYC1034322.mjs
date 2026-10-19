// 39 West 46th Street, 1920: a five-bay-deep brick mixed-use block. Two storeys at the north end, three behind it,
// then a five-storey street-front main block that steps to six storeys at the south end. Storefronts at street level
// on both long faces, residential doors in the piers, calcite string courses and sills, a cornice with dentils,
// a penthouse bulkhead on the roof. Built only on the footprint; y 0 is the lowest ground under it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1034322.cells.json`, "utf8"));

// The lidar roof is noisy cell to cell (a 16 spike at z 10, 8s beside 10s); the clean tiers are the row bands.
const tier = (z) => (z <= 2 ? 6 : z <= 10 ? 9 : z <= 16 ? 16 : 18);

const FOUND = "stone_bricks", PLINTH = "polished_granite", WALL = "bricks", TRIM = "calcite";
const FLOOR = "stone", GLASS = "glass_pane", CANOPY = "black_concrete", DOOR = "oak_door";
const xPane = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };  // in the x = 0 / 4 plane
const zPane = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };  // in the z = 0 / 25 plane
const lantern = { hanging: "true", waterlogged: "false" };

// Entrances: cell -> the way the door faces (outward), on the pier column so the two-tall door sits in the wall.
const DOORS = { "0,13": "west", "4,4": "east", "2,25": "south" };

const isXSide = (x) => x === 0 || x === 4;
const isWindowX = (z) => z > 0 && z < 25 && z % 3 !== 1;      // 2-wide bays, 1-block brick piers at z % 3 == 1
const isWindowEnd = (x) => x >= 1 && x <= 3;                  // the two ends have three bays

function facade(x, z, y, T, s, o) {
  if (y === T - 1) return [TRIM];                                // coping
  if (y === T - 2 && o !== 1) return [z % 2 === 0 ? TRIM : WALL]; // dentils under the cornice
  const door = DOORS[`${x},${z}`];
  if (door && s === 0 && (o === 1 || o === 2)) {
    return [DOOR, { facing: door, half: o === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (o === 0) return [s === 0 ? PLINTH : TRIM];                 // plinth, then string courses and sills
  const xs = isXSide(x);
  const win = xs ? isWindowX(z) : isWindowEnd(x);
  const shop = s === 0 && xs;                                    // street-level shopfront
  if (!win) return [shop ? TRIM : WALL];
  if (o === 1 || shop) return [GLASS, xs ? xPane : zPane];
  return [TRIM];                                                 // lintel over an upper window
}

function interior(x, z, y, T, s, o) {
  if (y === T - 1) return [FLOOR];                               // roof membrane
  if (o === 0) return [FLOOR];                                   // floor slab per storey
  if (o === 2 && s === 0 && (x === 1 || x === 3) && z % 3 === 0 && z >= 3 && z <= 24) return ["lantern", lantern];
  if (o === 1 && s >= 1 && x === 2 && isWindowX(z) && (z + s) % 4 === 0) return ["glowstone"];  // lit room behind glass
  return null;
}

const g = new Voxels([5, 30, 26]);

for (const [x, z, G] of cells) {
  const T = tier(z);
  const edge = x === 0 || x === 4 || z === 0 || z === 25;
  for (let y = 0; y < G; y++) g.set(x, y, z, FOUND);            // foundation down to the ground
  for (let y = G; y < T; y++) {
    const k = y - G, s = Math.floor(k / 3), o = k % 3;
    // Canopies over the two street doors, on the storey line (one block deep, with a light under each).
    const canopy = y === G + 3 && ((z >= 12 && z <= 14 && (x === 0 || x === 1)) || (z >= 3 && z <= 5 && (x === 3 || x === 4)));
    if (canopy) { g.set(x, y, z, CANOPY); continue; }
    if (edge) {
      const [b, st] = facade(x, z, y, T, s, o);
      g.set(x, y, z, b, st);
    } else {
      const r = interior(x, z, y, T, s, o);
      if (r) g.set(x, y, z, r[0], r[1]);
    }
  }
}

// Roof bulkhead: a brick penthouse on the south main block, with a calcite cap.
for (let x = 1; x <= 3; x++) for (let z = 19; z <= 21; z++) {
  g.set(x, 18, z, WALL);
  g.set(x, 19, z, TRIM);
}

const out = `${dir}/NYC1034322.nbt`;
const stats = g.save(out);
console.log(JSON.stringify({ out, ...stats }));
