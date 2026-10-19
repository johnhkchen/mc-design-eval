// 74 West 47th Street, 1930: a Midtown commercial and office block on a 6 x 19 lot. Four storeys on the north half and
// three on the south wing, with a 19-block tower wall running up the east edge (the lidar's tall strip at x = 5). The
// street front is the north (z = 0) face: a granite base, a shopfront of glass on black pilasters, and a door under a
// hanging lantern. The rest of the envelope is brick between sandstone storey lines, with a stepped cap and a crowned
// tower with gilt accents. Some rooms are lit behind the glass, and rooftop plant sits on the north roof and the wing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034350.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const BRICK = "bricks", BASE = "polished_granite", BAND = "smooth_sandstone", TRIM = "polished_blackstone";
const FLOOR = "smooth_stone", STONE = "stone_bricks", GOLD = "gold_block", PLANT = "polished_andesite";
const GLASS = "glass_pane", DOOR = "dark_oak_door", LANTERN = "lantern";

const BANDS = new Set([4, 7, 10, 13, 16]);   // storey lines: sandstone spandrels on the envelope, floor slabs inside
const SLABS = [4, 7, 10];                    // interior floors (the cap of each tier is its roof deck)
const WINDOW_ROWS = new Set([2, 3, 5, 6, 8, 9, 11, 12, 14, 15]);

// The lidar roof is noisy (6 to 19 within a face); it is smoothed into three tiers. The tower is the x = 5 strip, z 1..16,
// which the lidar reads at 19 along its whole length. North of z = 8 is the four-storey body (lidar 13 to 15), and the
// south wing is three storeys (lidar 10 to 13). The no-return notch at (1, 18) is a light well and stays open.
const TOWER = (x, z) => x === 5 && z >= 1 && z <= 16;
const topOf = (x, z) => (TOWER(x, z) ? 19 : z <= 8 ? 14 : 12);

const glassState = (z) => (z === 0 || z === 18
  ? { east: "true", north: "false", south: "false", west: "true", waterlogged: "false" }     // panes run along x on a z face
  : { east: "false", north: "true", south: "true", west: "false", waterlogged: "false" });   // and along z on an x face
const pier = (x, z) => (z === 0 || z === 18 ? x === 0 || x === 3 || x === 5 : z % 3 === 0);  // corners, and one pier per bay

// The north (street) face at ground storey: granite bulkhead, shop glass, black pilasters, and the entrance at x = 3.
function shopfront(x, y) {
  if (x === 2 || x === 4) return [TRIM];
  if (x === 3) {
    if (y === 1) return [DOOR, { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (y === 2) return [DOOR, { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
    return [LANTERN, { hanging: "true", waterlogged: "false" }];                              // hangs off the band at y = 4
  }
  return y === 1 ? [BASE] : [GLASS, glassState(0)];
}

function envelope(x, z, y, T) {
  if (z === 0 && x >= 1 && x <= 4 && y >= 1 && y <= 3) return shopfront(x, y);
  if (y <= 1) return [BASE];                                                                // granite base course
  if (y === T - 1) return TOWER(x, z) && z % 4 === 0 ? [GOLD] : [BAND];                     // cap, gilt on the tower crown
  if (TOWER(x, z) && y === 17) return [STONE];                                              // tower frieze
  if (BANDS.has(y)) return [BAND];
  if (!WINDOW_ROWS.has(y) || pier(x, z)) return [BRICK];
  return [GLASS, glassState(z)];
}

const g = new Voxels([6, 20, 19]);
for (const [x, z, ground, roof] of cells) {
  for (let y = 0; y < ground; y++) g.set(x, y, z, BASE);                                    // foundation to the lowest ground
  if (roof <= ground) continue;                                                             // open light well
  const T = topOf(x, z);
  const shell = x === 0 || x === 5 || z === 0 || z === 18;
  for (let y = ground; y < T; y++) {
    if (shell) {
      const [name, state] = envelope(x, z, y, T);
      g.set(x, y, z, name, state);
    } else if (z === 8) {                                                                   // the cross wall between the two halves
      g.set(x, y, z, y <= 1 ? BASE : y === T - 1 || BANDS.has(y) ? BAND : BRICK);
    } else if (SLABS.includes(y) || y === T - 1) g.set(x, y, z, FLOOR);                     // floor slabs; air between
  }
}
g.set(5, 19, 8, GOLD);                                                                      // the crown's pinnacle

// Rooftop: a penthouse on the north roof, a brick flue, and an HVAC housing on the wing roof.
for (const x of [1, 2]) for (const z of [3, 4, 5]) for (const y of [14, 15]) g.set(x, y, z, PLANT);
for (const y of [14, 15, 16]) g.set(4, y, 5, BRICK);
for (const x of [3, 4]) for (const z of [10, 11]) g.set(x, 12, z, FLOOR);

// Warm light behind some windows: glowstone in the west bays, shroomlight in the east bays, on the storey floors.
for (const [x, y, z] of [[1, 5, 2], [1, 5, 5], [1, 5, 13], [1, 5, 16], [1, 8, 4], [1, 8, 11], [1, 8, 14]]) g.set(x, y, z, "glowstone");
for (const [x, y, z] of [[4, 8, 4], [4, 8, 10], [4, 8, 16], [4, 11, 2], [4, 11, 5]]) g.set(x, y, z, "shroomlight");

const out = g.save(`${DIR}/NYC1034350.nbt`);
console.log(JSON.stringify(out));
