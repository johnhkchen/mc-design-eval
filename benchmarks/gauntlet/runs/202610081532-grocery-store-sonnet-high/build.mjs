// Round 1 generator — neighbourhood grocery. Spec coords (x 0-13, z 0-13, front z=0, y0 ground) are
// offset into the grid so the sidewalk, awnings (2 deep) and cornice overhang fit.
import { Grid, B, face } from "../../../../../minecraft-design/tools/src/build.mjs";

const OX = 2, OZ = 3;
const g = new Grid([18, 15, 18]);
const OUT = process.argv[2] ?? "round-1.nbt";
const R2 = process.argv[3] === "2";   // round-2 fixes

const S = (x, y, z, b, st) => g.set(x + OX, y, z + OZ, b, st);
const F = (a, b, blk, st) => g.fill([a[0] + OX, a[1], a[2] + OZ], [b[0] + OX, b[1], b[2] + OZ], blk, st);
const flip = (st) => st && st.facing ? { ...st, facing: face.mirrorX(st.facing) } : st;
// symmetric pair across the x=6.5 axis
const M = (x, y, z, b, st) => { S(x, y, z, b, st); S(13 - x, y, z, b, flip(st)); };
const MF = (a, b, blk, st) => { F(a, b, blk, st); F([13 - b[0], a[1], a[2]], [13 - a[0], b[1], b[2]], blk, flip(st)); };

const BR = "bricks", QZ = "quartz_block", SQ = "smooth_quartz", DP = "dark_oak_planks";
const SL = "stripped_dark_oak_log";
const paneEW = { east: "true", west: "true", north: "false", south: "false" };
const air = (a, b) => F(a, b, "air");

// ---- plinth / sidewalk (stone bricks with andesite flecks), interior floor ---------------------------------
for (let x = -1; x <= 14; x++) for (let z = -2; z <= 13; z++)
  S(x, 0, z, (x * 7 + z * 13) % 9 === 0 ? "andesite" : "stone_bricks");

// ---- shell: solid brick box, then carve ---------------------------------------------------------------------
F([0, 1, 0], [13, 9, 13], BR);
air([1, 1, 0], [12, 4, 12]);                 // ground floor interior + front
F([1, 0, 2], [12, 0, 12], "spruce_planks");  // interior floor
F([5, 0, 0], [8, 0, 1], "spruce_planks");    // entrance floor
F([1, 5, 1], [12, 5, 12], DP);               // upper floor deck
air([1, 6, 2], [12, 9, 12]);                 // upper storey interior (front wall stays 2 thick)
F([1, 10, 1], [12, 10, 12], R2 ? "stone_bricks" : DP);   // roof deck

// ---- ground floor: shopfront ---------------------------------------------------------------------------------
M(0, 1, 0, SL, { axis: "y" }); for (let y = 1; y <= 4; y++) M(0, y, 0, SL, { axis: "y" });  // corner piers
for (let y = 1; y <= 3; y++) M(4, y, 0, SL, { axis: "y" });                                   // entrance flanking posts
// display windows (recessed to z1): bulkhead y1, glass y2-3, header y4
for (const x of [1, 2, 3, 4]) {
  M(x, 1, 1, DP);
  for (const y of [2, 3]) M(x, y, 1, "light_blue_stained_glass_pane", paneEW);
  M(x, 4, 1, DP);
}
for (const x of [1, 2, 3]) M(x, 4, 0, DP);       // frieze beam over the window, under the awning
M(1, 2, 1, "dark_oak_log", { axis: "y" }); M(1, 3, 1, "dark_oak_log", { axis: "y" });  // frame posts
// entrance (recess to z2)
F([5, 4, 1], [8, 4, 1], DP);                      // recess ceiling
for (const y of [1, 2, 3, 4]) { M(5, y, 2, DP); }
for (const y of [3, 4]) for (const x of [6, 7]) S(x, y, 2, "light_blue_stained_glass_pane", paneEW);
S(6, 1, 2, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "true" });
S(6, 2, 2, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "true" });
S(7, 1, 2, "dark_oak_door", { facing: "north", half: "lower", hinge: "right", open: "true" });
S(7, 2, 2, "dark_oak_door", { facing: "north", half: "upper", hinge: "right", open: "true" });
// sign x4-9 y4-5 at z0 (green field, yellow lettering)
for (let x = 4; x <= 9; x++) for (const y of [4, 5]) {
  const letter = (x + y) % 2 === 0 && x > 4 && x < 9;
  S(x, y, 0, letter ? "yellow_terracotta" : "moss_block");
}
// lanterns hung under the frieze
M(3, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
// interior: barrel counter + bookshelves
F([5, 1, 5], [8, 1, 5], "barrel", { facing: "up", open: "false" });
F([4, 1, 12], [9, 2, 12], "bookshelf");
F([2, 1, 12], [3, 1, 12], "barrel", { facing: "up", open: "false" });

// ---- awnings: red/white stripes, 2 deep, stepping up toward the wall -----------------------------------------
for (let x = 0; x <= 4; x++) {
  const w = x % 2 === 0 ? "red_wool" : "white_wool";
  M(x, 4, -1, w); M(x, R2 ? 4 : 3, -2, w);
}

// ---- belt course y5, projecting 1; stepped pediment over the entrance ---------------------------------------
for (const x of [0, 1, 2, 3]) { M(x, 5, 0, SQ); M(x, 5, -1, QZ); }
M(4, 5, -1, "quartz_stairs", { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" });
for (let x = 5; x <= 8; x++) { S(x, 6, 0, SQ); }

// ---- upper storey: windows, shutters, lintels, flower boxes --------------------------------------------------
function upperBay(x0) {                       // x0 = left window cell; window 2 wide
  for (const x of [x0, x0 + 1]) {
    for (const y of [7, 8]) { S(x, y, 0, "air"); S(x, y, 1, "gray_stained_glass_pane", paneEW); }
    S(x, 9, 0, QZ);
    S(x, 9, -1, "quartz_slab", { type: "bottom", waterlogged: "false" });
  }
  for (const y of [7, 8]) {
    S(x0 - 1, y, 0, "dark_oak_trapdoor", { facing: "north", half: "bottom", open: "true", powered: "false", waterlogged: "false" });
    S(x0 + 2, y, 0, "dark_oak_trapdoor", { facing: "north", half: "bottom", open: "true", powered: "false", waterlogged: "false" });
  }
  S(x0 - 1, 9, -1, "quartz_stairs", { facing: "east", half: "bottom", shape: "straight", waterlogged: "false" });
  S(x0 + 2, 9, -1, "quartz_stairs", { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" });
}
upperBay(2); upperBay(6); upperBay(10);
const flowers = ["red_tulip", "allium", "azure_bluet", "dandelion", "cornflower", "poppy"];
let fi = 0;
for (const x of [1, 2, 3, 5, 6, 7, 8, 10, 11, 12]) {
  S(x, 6, -1, "composter", { level: "0" });
  S(x, 7, -1, flowers[fi++ % flowers.length]);
}

// ---- cornice y10 (overhang 1 front + sides), parapet y11, pediment -----------------------------------------
const WL = R2 ? DP : QZ;   // r2: dark-oak frieze band between the white stair course and the parapet
for (let x = 0; x <= 13; x++) { S(x, 10, 0, WL); S(x, 10, 13, WL); }
for (let z = 0; z <= 13; z++) { S(0, 10, z, WL); S(13, 10, z, WL); }
const ST = (f) => ["quartz_stairs", { facing: f, half: "top", shape: "straight", waterlogged: "false" }];
for (let x = 0; x <= 13; x++) S(x, 10, -1, ...ST("south"));
for (let z = 0; z <= 13; z++) { S(-1, 10, z, ...ST("east")); S(14, 10, z, ...ST("west")); }
S(-1, 10, -1, QZ); S(14, 10, -1, QZ);
const slab = ["quartz_slab", { type: "bottom", waterlogged: "false" }];
for (let x = -1; x <= 14; x++) S(x, 11, -1, ...slab);
for (let z = 0; z <= 13; z++) { S(-1, 11, z, ...slab); S(14, 11, z, ...slab); }
// parapet: dark-oak infill, quartz piers
for (let x = 0; x <= 13; x++) { S(x, 11, 0, DP); S(x, 11, 13, DP); }
for (let z = 0; z <= 13; z++) { S(0, 11, z, DP); S(13, 11, z, DP); }
for (const [x, z] of [[0, 0], [4, 0], [9, 0], [13, 0], [0, 13], [13, 13], [0, 6], [13, 6], [4, 13], [9, 13]])
  for (const y of [11, 12]) S(x, y, z, QZ);
for (const x of [5, 8]) for (const y of [11, 12]) S(x, y, 0, QZ);
for (const x of [6, 7]) { S(x, 11, 0, BR); S(x, 12, 0, BR); }
for (let x = 4; x <= 9; x++) S(x, 13, 0, QZ);
if (R2) { // white coping on the parapet infill
  const cop = ["quartz_slab", { type: "bottom", waterlogged: "false" }];
  for (let x = 1; x <= 12; x++) { if (![4, 5, 6, 7, 8, 9].includes(x)) { S(x, 12, 0, ...cop); S(x, 12, 13, ...cop); } }
  for (let z = 1; z <= 12; z++) if (z !== 6) { S(0, 12, z, ...cop); S(13, 12, z, ...cop); }
}

// ---- chimney (spec: east wall; r2 mirrors to the viewer's-right side seen in the concept), side-wall details ----
const CX = R2 ? -1 : 14, WX = R2 ? 0 : 13, OUTF = R2 ? "west" : "east";
for (let y = 1; y <= 12; y++) for (const z of [3, 4]) S(CX, y, z, BR);
for (const z of [3, 4]) S(CX, 13, z, "cobblestone");
for (let y = 3; y <= 7; y++) for (const z of [4, 5]) S(WX, y, z, (y + z) % 2 ? "cobblestone" : "andesite");
for (const z of [7, 9, 11]) for (const y of [3, 7]) {
  S(WX, y, z, "dark_oak_trapdoor", { facing: OUTF, half: "bottom", open: "true", powered: "false", waterlogged: "false" });
}

// ---- sidewalk props (z-1..-2) -------------------------------------------------------------------------------
const crate = (x, y, z) => S(x, y, z, "composter", { level: "0" });
S(1, 1, -1, "melon"); S(1, 2, -1, "melon"); S(2, 1, -1, "melon");
crate(1, 1, -2); crate(2, 1, -2);
S(3, 1, -1, "barrel", { facing: "up", open: "false" }); S(3, 1, -2, "flower_pot");
S(4, 1, -2, "barrel", { facing: "up", open: "false" }); S(3, 2, -1, "flower_pot");
S(9, 1, -1, "hay_block", { axis: "y" }); S(10, 1, -1, "hay_block", { axis: "y" });
S(10, 1, -2, "pumpkin"); S(9, 1, -2, "pumpkin"); S(11, 1, -1, "pumpkin");
S(11, 1, -2, "barrel", { facing: "up", open: "false" }); S(12, 1, -1, "barrel", { facing: "up", open: "false" });
S(12, 1, -2, "flower_pot"); S(12, 2, -1, "flower_pot");
// kerb: bottom slabs on the outer sidewalk edge where nothing stands
const busy = new Set(); for (const c of g.cells.values()) if (c.pos[1] === 1) busy.add(`${c.pos[0]},${c.pos[2]}`);
const kerb = (x, z) => { if (!busy.has(`${x + OX},${z + OZ}`)) S(x, 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); };
for (let x = -1; x <= 14; x++) kerb(x, -2);
for (let z = -2; z <= 13; z++) { kerb(-1, z); kerb(14, z); }

g.save(OUT);
console.log(JSON.stringify({ saved: OUT }));
