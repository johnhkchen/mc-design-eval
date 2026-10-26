import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 19th-century brick rowhouse block with stone plinth, white marble quoins and string courses, glass panes in
// the street-facing walls, a stepped roof (6 -> 3 blocks, north tip to south end) and a brick chimney.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC76117.cells.json", "utf8"));

const ROOF = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const has = (x, z) => ROOF.has(`${x},${z}`);
// which sides of a footprint cell face outside the footprint: W = -x, E = +x, N = -z, S = +z
const exposed = (x, z) => ({ W: !has(x - 1, z), E: !has(x + 1, z), N: !has(x, z - 1), S: !has(x, z + 1) });
const exposedSides = (x, z) => Object.keys(exposed(x, z)).filter((d) => exposed(x, z)[d]);

// the street-facing walls: west wall windows on odd z, east wall windows on even z (staggered), none on the north stub
const WINDOW_ON = { W: (z) => z % 2 === 1, E: (z) => z % 2 === 0 };
const WINDOW_ROWS = [1, 3];           // storey rows: ground floor and first floor
const STRING_ROWS = [2];              // one marble string course between the storeys (brick reads as the wall)

// the window face of a single-sided wall cell, or null
function windowSide(x, z) {
  const sides = exposedSides(x, z);
  if (sides.length !== 1) return null;
  const side = sides[0];
  return WINDOW_ON[side] && WINDOW_ON[side](side === "W" || side === "E" ? z : x) ? side : null;
}

const g = new Voxels([3, 18, 10]);

// 1. the massing: each cell is solid from its ground up to its lidar roof height, skinned by role
for (const [x, z, ground, roof] of cells) {
  const sides = exposedSides(x, z);
  const exterior = sides.length > 0;
  const corner = sides.length >= 2;
  const win = windowSide(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  for (let y = ground; y < roof; y++) {
    let block;
    if (y === 0) block = "stone_bricks";                                              // plinth course
    else if (y === roof - 1) block = corner ? "smooth_quartz" : "stone_bricks";       // quoined cap / dark roof membrane
    else if (!exterior) block = "bricks";                                             // solid interior: floor slabs
    else if (corner || STRING_ROWS.includes(y)) block = "smooth_quartz";              // quoins, string courses
    else if (win && WINDOW_ROWS.includes(y)) block = "glass_pane";                    // window rows
    else block = "bricks";
    g.set(x, y, z, block);
  }
}

// 2. the entrance: a dark oak door in the west wall at z 3, with a marble lintel over it
g.set(0, 1, 3, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(0, 2, 3, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(0, 3, 3, "smooth_quartz");

// 3. air behind each window (no interiors but the gap), where the cell behind is interior and not a wall face;
//    warm light in some of those gaps
const panes = [];
for (let z = 0; z < 10; z++) for (let x = 0; x < 3; x++) {
  if (!has(x, z)) continue;
  for (const y of WINDOW_ROWS) {
    const cell = g.get(x, y, z);
    if (!cell || cell.block !== "minecraft:glass_pane") continue;
    panes.push([x, y, z]);
    const side = windowSide(x, z);
    const ix = side === "W" ? x + 1 : x - 1;
    if (!has(ix, z) || exposedSides(ix, z).length) continue;   // a wall face behind would open a hole
    g.set(ix, y, z, "air");
  }
}

const LIGHTS = [[1, 1, 5, "glowstone"], [1, 3, 4, "shroomlight"], [1, 1, 2, "glowstone"]];
for (const [x, y, z, block] of LIGHTS) g.set(x, y, z, block);

// 4. glass pane connections: arms run along the wall plane (north/south) to any block beside them
for (const [x, y, z] of panes) {
  const solid = (X, Z) => g.get(X, y, Z) !== null;
  g.set(x, y, z, "glass_pane", {
    north: String(solid(x, z - 1)),
    south: String(solid(x, z + 1)),
    east: "false",
    west: "false",
    waterlogged: "false",
  });
}

// 5. a brick chimney on the north tip with a stone cap
g.set(1, 6, 1, "bricks");
g.set(1, 7, 1, "bricks");
g.set(1, 8, 1, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC76117.nbt");
console.log(`DC76117: ${g.count()} blocks, ${g.palette.length - 1} distinct states, ${panes.length} window panes`);
