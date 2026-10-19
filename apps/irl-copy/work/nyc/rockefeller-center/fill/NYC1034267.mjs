// 55 West 45th Street, 1920: a seven-storey Midtown loft-office on a 6 x 27 midblock lot. Brick walls with limestone belt
// courses at every storey line, a granite base course and a limestone cornice, calcite corner piers, a shopfront with a
// recessed dark-canopied entrance on the 45th Street face (z 26), glass-and-stone-mullion window bays, a two-storey rear
// wing at the north end (z 0), a firewall parapet on the east party wall, and a stair bulkhead and water tank on the roof.
// The side walls are party walls with a few light-court windows, as on a midblock lot.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034267.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const X = 6, Z = 27, Y = 36;
const MAIN = 21, WING = 7, PARAPET = 24;   // roof levels in blocks above y 0: main block (7 storeys), rear wing, firewall
const STREET_Z = 26;                       // 45th Street is the z = 26 face (the 6-wide end); the lot runs north to z 0
const LIGHT_COURT = new Set([6, 7, 14, 15, 22, 23]);   // light-court windows on both party walls, in pairs, below the roof line
const PANE = ["glass_pane"];

// The lidar roof reads 20 to 24 across the main block with single-cell dropouts (1, 3, 4), so the main block takes one
// level. The north end (z 0..1, and z 2 east of x 3) is the two-storey rear wing; the east edge reads 24 along its whole
// length, a firewall parapet on the party wall.
const topOf = (x, z) => {
  if (z <= 1 || (z === 2 && x >= 4)) return WING;
  if (x === 5) return PARAPET;
  return MAIN;
};
const footprint = new Map();
for (const [x, z, ground] of cells) footprint.set(`${x},${z}`, { ground, top: topOf(x, z) });

const faceOf = (x, z) => {
  if (z === STREET_Z) return "street";
  if (z === 0) return "rear";
  if (x === 0 || x === 5) return "side";
  return null;   // interior: floor slabs only, air behind the glass
};

const door = (y) => ["dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];

// The block for a perimeter cell at height y on its face; t is the cell's roof level.
function skin(x, y, z, t, face) {
  const corner = (x === 0 || x === 5) && (z === 0 || z === STREET_Z);
  if (y === 0) return ["polished_granite"];                                  // base course
  if (y === t - 1) return ["smooth_sandstone"];                              // limestone cornice
  if (corner) return ["calcite"];                                            // corner piers
  if (y % 3 === 0) return ["smooth_sandstone"];                              // belt course at each storey line
  if (face === "side") return LIGHT_COURT.has(z) && y <= MAIN - 2 ? PANE : ["bricks"];   // the firewall's parapet stays blank
  if (y % 3 !== 0) {                                                         // window rows between the belts
    if (face === "street" && y < 3 && x === 2) return door(y);              // entrance, between the shopfront glass
    return x === 3 && y >= 3 ? ["smooth_sandstone"] : PANE;                  // stone mullion above the shopfront
  }
  return ["bricks"];
}

const P = new Map();   // "x,y,z" -> { block, state }
const put = (x, y, z, [block, state]) => P.set(`${x},${y},${z}`, { block, state });
const solid = (x, y, z, block, state) => put(x, y, z, [block, state]);

for (const [key, { ground, top: t }] of footprint) {
  const [x, z] = key.split(",").map(Number);
  const face = faceOf(x, z);
  for (let y = 0; y < ground; y++) solid(x, y, z, "smooth_stone");          // foundation: solid from y 0 up to the ground
  for (let y = 0; y < t; y++) {
    if (face) put(x, y, z, skin(x, y, z, t, face));
    else if (y % 3 === 0) solid(x, y, z, "smooth_stone");                    // floor slab per storey
  }
  if (face) {                                                                // parapet and coping on the roof edge
    solid(x, t, z, "bricks");
    solid(x, t + 1, z, "smooth_sandstone_slab", { type: "bottom" });
  } else solid(x, t, z, "smooth_stone");                                     // roof deck
}

// Canopy over the entrance: dark stone, two cells deep, above the door and its shopfront glass.
for (let x = 1; x <= 3; x++) for (const z of [STREET_Z - 1, STREET_Z]) solid(x, 3, z, "black_concrete");

// Glass panes connect to their neighbours along the face they sit in, not to the air behind them.
for (const [key, c] of P) {
  if (c.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const near = (dx, dz) => { const n = P.get(`${x + dx},${y},${z + dz}`); return !!n && n.block !== "dark_oak_door"; };
  const alongX = z === 0 || z === STREET_Z;
  c.state = alongX
    ? { north: "false", south: "false", east: String(near(1, 0)), west: String(near(-1, 0)), waterlogged: "false" }
    : { north: String(near(0, -1)), south: String(near(0, 1)), east: "false", west: "false", waterlogged: "false" };
}

// Warm light in some windows, set in the air gap behind the glass (on the floor slab).
const lit = (x, y, z) => P.get(`${x},${y},${z}`)?.block === "glass_pane";
if (lit(1, 1, STREET_Z)) solid(1, 1, STREET_Z - 1, "glowstone");
for (let s = 1; s <= 6; s++) {
  const y = 3 * s + 1, x = s % 2 ? 2 : 4;
  if (!lit(x, y, STREET_Z)) continue;
  solid(x, y, STREET_Z - 1, s % 2 ? "glowstone" : "shroomlight");
}

// Roof equipment on the main roof: a stair bulkhead (brick, stone cap) and a spruce water tank on the deck.
for (let x = 1; x <= 2; x++) for (let z = 9; z <= 11; z++) {
  for (let y = 22; y <= 24; y++) solid(x, y, z, "bricks");
  solid(x, 25, z, "stone_brick_slab", { type: "bottom" });
}
for (let x = 3; x <= 4; x++) for (let z = 15; z <= 16; z++) {
  for (let y = 22; y <= 25; y++) solid(x, y, z, "spruce_planks");
  solid(x, 26, z, "dark_oak_slab", { type: "bottom" });
}

const g = new Voxels([X, Y, Z]);
for (const [key, { block, state }] of P) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/NYC1034267.nbt`);
console.log(`NYC1034267.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
