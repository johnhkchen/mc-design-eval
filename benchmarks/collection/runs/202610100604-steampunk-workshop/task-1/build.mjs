// Steampunk inventor's workshop. Front faces NORTH (-z). Body x1..15, z2..13; proud layers x0/x16, z0..1 (front), z14 (back).
// DESIGN x runs toward the viewer's LEFT when facing the north front; real x = 16 - design x, so the chimney / pipe side
// (design x small) lands on the viewer's left (east), as in the concept. The wrappers flip east/west facings for us.
import { Grid, B, roof, shell, surround, signboard } from "../../../../../minecraft-design/tools/src/build.mjs";

const g = new Grid([17, 14, 15]);
const MX = (x) => 16 - x;
const FLIP = { east: "west", west: "east", left: "right", right: "left", inner_left: "inner_right", inner_right: "inner_left", outer_left: "outer_right", outer_right: "outer_left" };
const mstate = (s) => { if (!s) return s; const o = { ...s }; for (const k of ["facing", "hinge", "shape"]) if (o[k] in FLIP) o[k] = FLIP[o[k]]; if (o.east !== undefined || o.west !== undefined) { const e = o.east; o.east = o.west; o.west = e; } return o; };
const set = (x, y, z, b, s, n) => g.set(MX(x), y, z, b, mstate(s), n);
const put = (x, y, z, pair) => g.set(MX(x), y, z, pair[0], mstate(pair[1]), pair[2]);
const fill = (a, b, blk, st) => { for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++) for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++) for (let z = Math.min(a[2], b[2]); z <= Math.max(a[2], b[2]); z++) set(x, y, z, blk, st); };
const PANE_X = { east: "true", west: "true" }, PANE_Z = { north: "true", south: "true" };

// ---- palette: brick field / grey stone base + pilasters / copper accents / dark oak timber ----
const BR = "bricks", ST = "stone_bricks", CU = "cut_copper", XCU = "exposed_cut_copper", CB = "copper_block", XC = "exposed_copper";
const WT = 8, X0 = 1, X1 = 15, Z0 = 2, Z1 = 13, ZP = 1;   // wall top, body x range, front/back wall planes, front proud layer

// ---- 1. form: floor slab, brick shell, copper sawtooth roof (glazed faces east = viewer's left) ----
fill([0, 0, 0], [16, 0, 14], ST);
shell(g, [X0, 1, Z0], [X1, WT, Z1], BR, { floor: false, ceiling: false });
roof(g, [[X0, Z0, X1, Z1]], "workshop", {
  y: WT + 1, glaze: "east", overhang: 0, contrast: false,
  why: "concept: orange copper sawtooth sheds with glazed vertical faces, flush on red brick",
  material: { mix: [["cut_copper", 30], ["exposed_cut_copper", 25], ["weathered_cut_copper", 30], ["oxidized_cut_copper", 15]], eave: "exposed_cut_copper", ridge: "cut_copper", verge: "cut_copper" },
});
// false-front pediment (x4..12, to y12, stone coping) so the gear window sits on a flat brick field
for (let x = 4; x <= 12; x++) { for (let y = WT + 1; y <= 12; y++) set(x, y, Z0, BR); put(x, 13, Z0, B.slab("stone_brick", "bottom")); }

// ---- 2. plinth: grey stone, 2 courses, all sides ----
for (let x = X0; x <= X1; x++) for (const z of [Z0, Z1]) fill([x, 1, z], [x, 2, z], ST);
for (let z = Z0; z <= Z1; z++) for (const x of [X0, X1]) fill([x, 1, z], [x, 2, z], ST);

// ---- 3. riveted copper corner piers (L-shaped) and side mid piers ----
const rivet = (y) => (y === 4 || y === 7 ? "chiseled_copper" : XCU);
function corner(x, z, dx, dz) {
  for (let y = 1; y <= WT; y++) for (const [ox, oz] of [[0, 0], [dx, 0], [0, dz]]) set(x + ox, y, z + oz, y <= 2 ? ST : rivet(y));
  for (const [ox, oz] of [[0, 0], [dx, 0], [0, dz]]) put(x + ox, WT + 1, z + oz, B.slab("cut_copper", "bottom"));
}
// design coords: x1 = chimney-side wall (real east), x15 = other side
corner(1, Z0, -1, -1); corner(15, Z0, 1, -1); corner(1, Z1, -1, 1); corner(15, Z1, 1, 1);
for (const x of [0, 16]) for (let y = 3; y <= WT; y++) set(x, y, 7, rivet(y));

// ---- 4. north facade ----
for (const x of [4, 12]) {                      // tall stone pilasters with rod finials, banners
  for (let y = 1; y <= 12; y++) { set(x, y, ZP, y <= 2 ? "chiseled_stone_bricks" : ST); set(x, y, Z0, ST); }
  set(x, 13, ZP, "lightning_rod", { facing: "up" });
}
put(4, 7, 0, B.banner("orange", [["circle", "gray"], ["border", "black"]], { facing: "north" }));
put(12, 7, 0, B.banner("orange", [["circle", "gray"], ["border", "black"]], { facing: "north" }));
for (const x of [5, 11]) for (let y = 1; y <= 4; y++) set(x, y, ZP, y <= 2 ? "chiseled_stone_bricks" : ST);
// loading gate x6..10, y1..3 in the wall plane, dark oak frame, two real doors
fill([6, 1, Z0], [10, 3, Z0], "spruce_planks");
for (const x of [6, 8, 10]) fill([x, 1, Z0], [x, 3, Z0], "stripped_dark_oak_log", { axis: "y" });
fill([6, 3, Z0], [10, 3, Z0], "stripped_dark_oak_log", { axis: "x" });
put(7, 1, Z0, B.door("spruce", "north", "lower", "left")); put(7, 2, Z0, B.door("spruce", "north", "upper", "left"));
put(9, 1, Z0, B.door("spruce", "north", "lower", "right")); put(9, 2, Z0, B.door("spruce", "north", "upper", "right"));
// lintel beam y4 (wall plane), name board on it, crane boom projecting from x10 with chain + crate
fill([5, 4, Z0], [11, 4, Z0], "dark_oak_log", { axis: "x" });
signboard(g, "COG WORKS", { at: [MX(7), 4, Z0], face: "north", mode: "wall", width: 3, height: 1, wood: "spruce" });
fill([10, 4, ZP], [10, 4, 0], "dark_oak_log", { axis: "z" });
put(10, 3, ZP, B.stairs("dark_oak", "south", "top"));
put(10, 3, 0, B.chain("y")); put(10, 2, 0, B.chain("y"));
set(10, 1, 0, "barrel", { facing: "up", open: "false" });
put(6, 3, ZP, B.lantern(false)); // post lantern replaced below
set(6, 3, ZP, "air");
put(6, 3, ZP, B.stairs("dark_oak", "east", "top")); put(6, 2, ZP, B.lantern(true));
// gear window (7x7 octagon ring in copper, glass disc inside, stone halo behind) centred (8, 8)
const GX = 8, GY = 8;
const GEAR = ["..CCC..", ".CGGGC.", "CGGGGGC", "CGGGGGC", "CGGGGGC", ".CGGGC.", "..CCC.."];
for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
  const ch = GEAR[r][c], x = GX - 3 + c, y = GY + 3 - r;
  if (ch === "C") { set(x, y, ZP, CU); set(x, y, Z0, CB); }
  if (ch === "G") set(x, y, Z0, "cyan_stained_glass");
}
for (const [dx, dy] of [[3, 3], [-3, 3], [3, -3], [-3, -3]]) set(GX + dx, GY + dy, ZP, "chiseled_copper");   // cog teeth
set(GX, GY + 4, ZP, CU);
for (let d = -2; d <= 2; d++) { set(GX + d, GY, ZP, "iron_bars"); set(GX, GY + d, ZP, "iron_bars"); }   // spokes over the glass
set(GX, GY, ZP, CB);
for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {   // grey halo behind the gear
  const d = Math.hypot(dx, dy), x = GX + dx, y = GY + dy;
  if (d > 3.6 && d <= 4.6 && y >= 5 && x > 4 && x < 12) set(x, y, Z0, ST);
}
// tall arched windows (design x13..14) with stone surround
fill([13, 3, Z0], [14, 7, Z0], "glass_pane", PANE_X);
surround(g, { at: [MX(13), 3, Z0], face: "north", width: 2, height: 5, preset: "classical", trim: ST });
// chimney-side bay: side door, riser pipe + valves
put(2, 1, Z0, B.door("spruce", "north", "lower", "left")); put(2, 2, Z0, B.door("spruce", "north", "upper", "left"));
put(2, 3, ZP, B.stairs("stone_brick", "south", "top"));
for (let y = 1; y <= WT; y++) set(3, y, ZP, CB);
for (const y of [3, 6]) set(3, y, 0, XC);
for (const y of [4, 5, 6, 7]) set(2, y, ZP, CB);
set(2, 5, 0, "grindstone", { face: "wall", facing: "north" });
set(3, 4, 0, "grindstone", { face: "wall", facing: "north" });
// base props, design-east of the front: crates, barrels, copper boiler tube
fill([13, 1, ZP], [14, 2, ZP], CB); set(13, 1, ZP, XC); set(14, 2, ZP, XC);
set(13, 1, 0, "barrel", { facing: "up", open: "false" }); set(14, 1, 0, "barrel", { facing: "up", open: "false" });
set(14, 2, 0, "chest", { facing: "north", type: "single", waterlogged: "false" });

// ---- 5. chimney side (design x0..2 = real east): stacks, pipe runs, valves ----
fill([0, 1, 3], [2, 13, 5], BR);
for (let y = 1; y <= 2; y++) fill([0, y, 3], [2, y, 5], ST);
for (const y of [5, 8, 11]) fill([0, y, 3], [2, y, 5], CU);
fill([0, 13, 3], [2, 13, 5], "blackstone_slab", { type: "bottom" });
set(1, 13, 4, "campfire", { facing: "north", lit: "true" });
fill([0, 1, 8], [1, 12, 9], BR); fill([0, 1, 8], [1, 2, 9], ST);
for (const y of [6, 10]) fill([0, y, 8], [1, y, 9], CU);
fill([0, 12, 8], [1, 12, 9], "blackstone_slab", { type: "bottom" });
fill([0, 1, 12], [0, 11, 12], BR); fill([0, 1, 12], [0, 2, 12], ST); set(0, 8, 12, CU); put(0, 11, 12, B.slab("blackstone", "bottom"));
for (const z of [6, 7, 10, 11]) set(0, 4, z, CB);
for (const z of [6, 10]) set(0, 4, z, XC);
for (let y = 5; y <= 9; y++) set(0, y, 11, y === 7 ? XC : CB);
set(0, 4, 11, XC);
set(0, 6, 7, "grindstone", { face: "wall", facing: "east" }); set(0, 3, 10, "grindstone", { face: "wall", facing: "east" });
set(0, 5, 6, "lightning_rod", { facing: "up" });

// ---- 6. other long side (design x15 wall, real west): tall windows, boiler tube along the base, crates ----
for (const z of [3, 10]) {
  fill([15, 3, z], [15, 7, z + 1], "glass_pane", PANE_Z);
  surround(g, { at: [MX(15), 3, z], face: "west", width: 2, height: 5, preset: "classical", trim: ST });
}
fill([16, 1, 8], [16, 2, 12], CB);
for (const z of [8, 10, 12]) fill([16, 1, z], [16, 2, z], XC);
set(16, 3, 9, "grindstone", { face: "wall", facing: "east" });
set(16, 1, 4, "barrel", { facing: "up", open: "false" }); set(16, 1, 5, "barrel", { facing: "up", open: "false" }); set(16, 2, 4, "barrel", { facing: "up", open: "false" });

// ---- 7. back wall (plane z13, proud z14): pilasters, windows, door, pipe run, vent ----
for (const x of [5, 11]) for (let y = 1; y <= WT; y++) set(x, y, 14, y <= 2 ? "chiseled_stone_bricks" : ST);
for (const x of [2, 13]) {                       // two tall 2-wide windows, symmetric about x8
  fill([x, 3, Z1], [x + 1, 7, Z1], "glass_pane", PANE_Z);
  surround(g, { at: [MX(x), 3, Z1], face: "south", width: 2, height: 5, preset: "classical", trim: ST });
}
fill([8, 1, Z1], [8, 3, Z1], "spruce_planks");
fill([7, 1, Z1], [9, 3, Z1], "spruce_planks");
for (const x of [7, 9]) fill([x, 1, Z1], [x, 3, Z1], "stripped_dark_oak_log", { axis: "y" });
put(8, 1, Z1, B.door("dark_oak", "south", "lower", "left")); put(8, 2, Z1, B.door("dark_oak", "south", "upper", "left"));
fill([6, 4, 14], [10, 4, 14], "dark_oak_log", { axis: "x" });
for (let x = 6; x <= 10; x++) set(x, 6, 14, CB);                  // horizontal pipe with flanges and a drop to the door
for (const x of [6, 8, 10]) set(x, 6, 14, XC);
for (let y = 6; y <= 8; y++) set(6, y, 14, y === 7 ? XC : CB);
set(8, 7, 14, "grindstone", { face: "wall", facing: "south" });
put(7, 3, 14, B.lantern(false)); set(7, 3, 14, "air");
put(7, 3, 14, B.lantern(true)); put(9, 3, 14, B.lantern(true));
set(6, 1, 14, "barrel", { facing: "up", open: "false" }); set(10, 1, 14, "barrel", { facing: "up", open: "false" }); set(10, 2, 14, "barrel", { facing: "up", open: "false" });

export { g };
g.save("build.nbt");
console.log(JSON.stringify({ saved: "build.nbt", refused: g.refused ?? null }));
