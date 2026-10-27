// Language Studies International: a 1980s concrete-frame office block on the Mt Eden / CBD edge. Lidar gives a
// main roof near 44, a stepped crown to 48, and low wings at the edges. The street is the low west face (ground 0-1),
// where the entrance and the shopfront band sit. Basalt plinth, precast quartz piers, tinted glazing, grey spandrels.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162652012.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162652012.nbt";

const FLOOR = 4;                                   // storey height in blocks (about 3.3 m)
const DIR = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const OPP = { W: "E", E: "W", N: "S", S: "N" };
const DOOR = { x: 1, z: 6 };                       // the entrance on the west (street) face

const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof]

// Lidar roof -> one clean flat top. The crown (46-48) is one 48 tier; the main roof (36-45) is one 44 tier, which
// smooths the parapet noise; low wings snap to a storey line and stand at least 8 blocks above their own ground.
function snapTop(ground, roof) {
  if (roof >= 46) return 48;
  if (roof >= 36) return 44;
  return Math.max(ground + 8, FLOOR * Math.round(roof / FLOOR));
}

const key = (x, z) => `${x},${z}`;
const TOP = new Map(), GROUND = new Map();
for (const [x, z, g, r] of cells) { TOP.set(key(x, z), snapTop(g, r)); GROUND.set(key(x, z), g); }
const topAt = (x, z) => TOP.get(key(x, z)) ?? 0;
const groundAt = (x, z) => GROUND.get(key(x, z)) ?? 0;
const solidAt = (x, y, z) => y >= 0 && y < topAt(x, z);
// the sides of a cell with no solid neighbour beside it at this height: the facade faces
const exposed = (x, y, z) => Object.keys(DIR).filter((d) => !solidAt(x + DIR[d][0], y, z + DIR[d][1]));
const isColumn = (x, z) => x % 4 === 0 && z % 4 === 0;

// a glazed bay: rows 1 and 2 of each storey, between precast piers (one every third cell, and at each corner).
// The street face's first storey is a shopfront with no piers.
function isGlass(x, y, z, ext) {
  const r = y % FLOOR;
  if (r !== 1 && r !== 2) return false;
  if (ext.length > 1) return false;
  const shopfront = ext.includes("W") && y < groundAt(x, z) + FLOOR;
  const along = ext.includes("W") || ext.includes("E") ? z : x;
  return shopfront || along % 3 !== 0;
}

// a standing lantern on the floor, one row in from some glazed bays, so the windows glow at dusk
function lanternBehind(x, y, z) {
  for (const d of Object.keys(DIR)) {
    const nx = x + DIR[d][0], nz = z + DIR[d][1];
    if (!solidAt(nx, y, nz)) continue;
    const ext = exposed(nx, y, nz);
    if (ext.includes(OPP[d]) && isGlass(nx, y, nz, ext) && (nx * 5 + nz * 3) % 7 === 0) return true;
  }
  return false;
}

function blockAt(x, y, z) {
  const G = groundAt(x, z), T = topAt(x, z);
  if (y >= T) return null;
  if (y < G) return ["stone_bricks"];                                   // foundation under the lidar ground
  const bay = y === G + 1 || y === G + 2;
  if (bay && x === DOOR.x && z === DOOR.z) {                            // the entrance door
    return ["dark_oak_door", { facing: "east", half: y === G + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (bay && x === DOOR.x && Math.abs(z - DOOR.z) === 1) return ["quartz_pillar", { axis: "y" }];   // portal jambs
  const ext = exposed(x, y, z);
  if (y === T - 1) return ext.length ? ["smooth_stone"] : ["gray_concrete"];   // parapet cap and roof membrane
  if (!ext.length) {                                                    // inside: a floor plate per storey, frame columns, lanterns
    if (y % FLOOR === 0) return ["smooth_stone"];
    if (isColumn(x, z)) return ["quartz_pillar", { axis: "y" }];
    if (y % FLOOR === 1 && lanternBehind(x, y, z)) return ["lantern", { hanging: "false", waterlogged: "false" }];
    return null;
  }
  if (y === G) return ["polished_blackstone_bricks"];                   // base course
  if (y % FLOOR === 0) return ["smooth_stone"];                         // storey line
  if (y % FLOOR === 3) return ["gray_concrete"];                        // spandrel under each window band
  return isGlass(x, y, z, ext) ? ["light_blue_stained_glass_pane"] : ["quartz_block"];
}

const g = new Voxels([29, 61, 21]);
const panes = [];
for (let z = 0; z < 21; z++) for (let x = 0; x < 29; x++) {
  if (!topAt(x, z)) continue;
  for (let y = 0; y < topAt(x, z); y++) {
    const b = blockAt(x, y, z);
    if (!b) continue;
    g.set(x, y, z, b[0], b[1]);
    if (b[0] === "light_blue_stained_glass_pane") panes.push([x, y, z]);
  }
}

// roof plant on the main roof and a lift overrun on the crown: boxes stand on the roof membrane
function box(x0, x1, z0, z1, y0, y1, top, block) {
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    if (topAt(x, z) !== top) continue;
    for (let y = y0; y <= y1; y++) g.set(x, y, z, block);
  }
}
box(14, 16, 14, 15, 44, 45, 44, "light_gray_concrete");
box(14, 15, 5, 6, 48, 50, 48, "light_gray_concrete");

// a pane joins the solid blocks and panes beside it, so each band reads as one continuous glazing
for (const [x, y, z] of panes) {
  const st = { waterlogged: "false" };
  for (const d of Object.keys(DIR)) {
    const b = g.get(x + DIR[d][0], y, z + DIR[d][1]);
    const joins = b !== null && b.block !== "minecraft:lantern";
    st[{ W: "west", E: "east", N: "north", S: "south" }[d]] = joins ? "true" : "false";
  }
  g.set(x, y, z, "light_blue_stained_glass_pane", st);
}

const { blocks, palette } = g.save(OUT);
console.log(`way_162652012: ${blocks} blocks, palette ${palette}, ${panes.length} glass panes -> ${OUT}`);
