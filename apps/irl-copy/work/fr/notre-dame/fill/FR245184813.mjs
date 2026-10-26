// FR245184813: a Haussmann-era commercial block (c. 1860) on the Île de la Cité's quai, built on the lidar footprint.
// Three flat tiers from the lidar (its noise smoothed away): a north pavilion to 19 (a deepslate mansard over a cornice,
// with a 2x2 lantern turret to 23, the record's "about 23"), a two-storey body to 12, and a one-storey shopfront wing to 6.
// Storey lines sit on absolute heights (string courses at 5, 10, 15), so the tiers line up across the footprint.
// Walls are the shell (any face open to air or to a lower tier); the rest is air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184813.cells.json`, "utf8"));

const X = 6, H = 35, Z = 19;
const FLOORS = new Set([5, 10, 15]);                 // storey lines: string courses on the shell, slabs inside
const FP = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));   // "x,z" -> ground (blocks under the cell's y 0 datum)
const fp = (x, z) => FP.has(`${x},${z}`);
const ground = (x, z) => FP.get(`${x},${z}`);
const roof = (x, z) => (z <= 3 ? 19 : x >= 2 ? 12 : 6);          // smoothed lidar tiers
const solid = (x, y, z) => fp(x, z) && y < roof(x, z);
const DIRS = [["E", 1, 0], ["W", -1, 0], ["N", 0, -1], ["S", 0, 1]];

// The open face of a shell cell: an outside face first, else the side that drops to a lower tier.
function faceOf(x, y, z) {
  const open = DIRS.filter(([, dx, dz]) => !solid(x + dx, y, z + dz));
  return open.find(([, dx, dz]) => !fp(x + dx, z + dz)) ?? open[0] ?? null;
}

const DOOR_AT = { E: (x, z) => x === 5 && z === 10, N: (x, z) => z === 0 && x === 2 };
const DOOR_FACING = { E: "east", N: "north" };

function facade(x, z, face) {
  const ew = face === "E" || face === "W";
  const u = ew ? z : x;
  const pier = ew ? u % 3 === 0 : u === 0 || u === 5;   // E/W: a pier every 3rd block; N/S: the corners only
  return { ew, pier, u };
}

// What one cell holds at height y: [block, state] for a solid, null for air.
function cell(x, y, z) {
  const gr = ground(x, z), R = roof(x, z);
  if (y < gr) return ["cobblestone"];                 // foundation under a cell that sits on a slope
  if (y === R - 1) return [z <= 3 ? "deepslate_bricks" : "deepslate_tiles"];   // roof cover
  if (y === 0) return ["stone_bricks"];               // base course (and the floor under the interior)
  const face = faceOf(x, y, z);
  if (face) {
    const [f] = face;
    if (y <= 2 && DOOR_AT[f]?.(x, z)) {               // a two-block door in the shopfront
      return ["dark_oak_door", { facing: DOOR_FACING[f], half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
    }
    const { ew, pier, u } = facade(x, z, f);
    const inCanopy = (f === "E" && z >= 9 && z <= 11) || (f === "N" && x >= 1 && x <= 3);
    if (y === 4) return [inCanopy ? "red_concrete" : "dark_oak_planks"];   // shopfront lintel; red awning over the entrance bay
    if (FLOORS.has(y)) return ["smooth_quartz"];        // string courses
    if (y < 4) return [pier ? "dark_oak_planks" : "glass"];                // shopfront: framed piers, clear glass
    if (y === 16) return ["deepslate_tiles"];           // mansard
    if (y === 17) return [pier ? "deepslate_tiles" : "light_blue_stained_glass"];   // dormer lights in the mansard
    return [pier ? "calcite" : "light_blue_stained_glass"];                          // Haussmann piers and windows
  }
  if (FLOORS.has(y)) return ["smooth_quartz"];         // floor slab per storey (interior)
  // warm light hung from each storey's ceiling behind the east windows (every third bay)
  if ((y === 9 || y === 14) && x === 4 && z % 3 === 2) return ["lantern", { hanging: "true", waterlogged: "false" }];
  return null;
}

const g = new Voxels([X, H, Z]);
for (const [key, gr] of FP) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < roof(x, z); y++) {
    const b = cell(x, y, z);
    if (b) g.set(x, y, z, b[0], b[1]);
  }
}

// The lantern tower on the pavilion's cap: 2x2 over the cap's middle, to 23.
for (const x of [2, 3]) for (const z of [1, 2]) for (let y = 19; y <= 22; y++) {
  g.set(x, y, z, y === 22 ? "oxidized_copper" : y === 20 ? "light_blue_stained_glass" : "calcite");
}

// Two chimney stacks on the body's roof terrace.
for (const [x, z] of [[3, 8], [4, 14]]) for (const y of [12, 13]) g.set(x, y, z, "bricks");

g.save(`${DIR}/FR245184813.nbt`);
