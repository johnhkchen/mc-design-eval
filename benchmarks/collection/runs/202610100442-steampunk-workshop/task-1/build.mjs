// Steampunk workshop — 17 x 14 x 15 (x east, y up, z south; front = north).
// Wall planes: x=1/15, z=1/13 ; x=0/16, z=0/14 are the proud layer (pilasters, pipes, cog, crane).
import { Grid, B, roof, cylinder, surround, plaque, signboard, fixture, planter, bunting } from "../../../../../minecraft-design/tools/src/build.mjs";
const OUT = new URL("./build.nbt", import.meta.url).pathname;
const g = new Grid([17, 14, 15]);
const W = 17, D = 15;
const BR = "bricks", ST = "stone_bricks", CU = "cut_copper", CUX = "exposed_cut_copper", CH = "chiseled_copper", CB = "copper_block";
const set = (x, y, z, b, s) => g.set(x, y, z, b, s);
const fill = (a, b, blk, s) => g.fill(a, b, blk, s);
const stair = (x, y, z, mat, facing, half = "bottom") => g.set(x, y, z, ...B.stairs(mat, facing, half));
const slab = (x, y, z, mat, type = "bottom") => g.set(x, y, z, ...B.slab(mat, type));

// ---- 1. FORM: plinth + brick shell, sawtooth roof ------------------------------------------------------------
fill([1, 0, 1], [15, 0, 13], "spruce_planks");
for (let y = 1; y <= 7; y++) for (let x = 1; x <= 15; x++) for (let z = 1; z <= 13; z++)
  if (x === 1 || x === 15 || z === 1 || z === 13) set(x, y, z, y <= 2 ? ST : BR);

const TEETH = [[1, 1, 5, 13], [6, 1, 10, 13], [11, 1, 15, 13]];
for (const r of TEETH)
  roof(g, [r], "shed", { y: 8, low: "east", pitch: "half", overhang: 0, material: "weathered_cut_copper", grow: false, eave: "plain", contrast: false });

// front facade: a stepped parapet that follows the sawtooth and climbs to the gear window
const P = { 1: 10, 2: 10, 3: 10, 4: 10, 5: 12, 6: 12, 7: 12, 8: 12, 9: 12, 10: 12, 11: 12, 12: 11, 13: 11, 14: 10, 15: 10 };
for (let x = 1; x <= 15; x++) {
  for (let y = 8; y <= P[x]; y++) set(x, y, 1, BR);
  slab(x, P[x] + 1, 1, "stone_brick");
}
// glazed steps of the sawtooth (skylights facing west)
for (const sx of [6, 11]) for (let y = 8; y <= 12; y++) for (let z = 2; z <= 12; z++) {
  const b = g.blockAt(sx, y, z);
  if (b.includes("bricks") || b.includes("copper")) { if (y >= 8) set(sx, y, z, "cyan_stained_glass"); }
}
// ---- 2. STRUCTURE: copper piers with chiseled joints, rivets ---------------------------------------------------
function pier(x, y0, y1, z = 1) {
  for (let y = y0; y <= y1; y++) set(x, y, z, y % 4 === 0 ? ST : CU);
}
for (const x of [1, 5, 11, 15]) pier(x, 3, P[x] - 1);
for (const x of [1, 5, 11, 15]) fill([x, 1, 1], [x, 2, 1], ST);
// rivets on the front piers
for (const x of [1, 5, 11, 15]) for (let y = 3; y <= P[x] - 1; y += 2) if (y % 4 !== 0) set(x, y, 0, "stone_button", { face: "wall", facing: "north", powered: "false" });
// string course (copper band) across the facade at the eave
for (let x = 1; x <= 15; x++) if (![1, 5, 11, 15].includes(x)) set(x, 7, 1, CUX);
// side + back piers
for (const z of [1, 7, 13]) for (const x of [1, 15]) for (let y = 3; y <= 7; y++) set(x, y, z, y % 4 === 0 ? ST : CU);
for (const x of [1, 6, 10, 15]) for (let y = 3; y <= 7; y++) set(x, y, 13, y % 4 === 0 ? CH : CU);

// ---- 3. OPENINGS -------------------------------------------------------------------------------------------------
// loading door: 5-wide dark-oak double doors (x6..10), centre post x8
fill([6, 1, 1], [10, 3, 1], "dark_oak_planks");
set(8, 1, 1, "stripped_dark_oak_log", { axis: "y" }); set(8, 2, 1, "stripped_dark_oak_log", { axis: "y" }); set(8, 3, 1, "stripped_dark_oak_log", { axis: "y" });
for (const [x, hinge] of [[6, "left"], [7, "right"], [9, "left"], [10, "right"]]) {
  set(x, 1, 1, ...B.door("dark_oak", "north", "lower", hinge)); set(x, 2, 1, ...B.door("dark_oak", "north", "upper", hinge));
}
for (const x of [6, 7, 9, 10]) set(x, 3, 1, "iron_bars");
// lintel beam + brackets over the gate (z0 proud)
fill([5, 4, 1], [11, 4, 1], ST);
for (let x = 5; x <= 11; x++) set(x, 4, 0, "stripped_dark_oak_log", { axis: "x" });
stair(5, 3, 0, "dark_oak", "south", "top"); stair(11, 3, 0, "dark_oak", "south", "top");
// crane: rail on the beam, hoist chain + hanging crate
for (let x = 6; x <= 10; x++) set(x, 5, 0, ...B.trapdoor("dark_oak", "south", "bottom", false));
fill([6, 5, 0], [10, 5, 0], "dark_oak_slab");
set(8, 3, 0, "copper_chain", { axis: "y", waterlogged: "false" }); set(8, 2, 0, "copper_chain", { axis: "y", waterlogged: "false" });
set(8, 1, 0, "barrel", { facing: "up", open: "false" });

// gear window: glass disc (z1) + mullions; copper cog ring proud (z0)
const GX = 8, GY = 8;
for (let dx = -4; dx <= 4; dx++) for (let dy = -4; dy <= 4; dy++) if (Math.hypot(dx, dy) <= 4.4 && GY + dy >= 5) set(GX + dx, GY + dy, 1, "stone_bricks");
for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) {
  const d = Math.hypot(dx, dy), x = GX + dx, y = GY + dy;
  if (d <= 2.3) {
    set(x, y, 1, dx === 0 || dy === 0 ? "iron_bars" : "cyan_stained_glass");
  } else if (d <= 3.2) {
    set(x, y, 1, CU); set(x, y, 0, d <= 2.9 ? CU : CUX);
  }
}
// teeth: 8 cogs around the ring
for (const [dx, dy] of [[4, 0], [-4, 0], [0, 4], [3, 2], [2, 3], [-3, 2], [-2, 3], [3, -2], [-3, -2]]) set(GX + dx, GY + dy, 0, CU);
set(GX, GY, 0, CH);

// tall windows front-right (design x12..13): panes now, surround brush after the mirror
for (let y = 2; y <= 6; y++) for (let x = 12; x <= 13; x++) set(x, y, 1, "glass_pane");
// small door left (x3) with canopy
set(3, 1, 1, "air"); set(3, 2, 1, "air");
set(3, 1, 0, "stone_brick_slab", { type: "bottom" });
for (let x = 2; x <= 4; x++) slab(x, 3, 0, "stone_brick", "top");

// ---- 4. PIPES + VALVES (front-left, proud of the wall at z0) ---------------------------------------------------------
for (let y = 4; y <= 9; y++) set(2, y, 0, y === 5 || y === 8 ? CH : CB);         // vertical run, flanges at y5/y8
set(2, 6, 0, "grindstone", { face: "wall", facing: "north" });                 // valve wheel in line
for (let x = 3; x <= 4; x++) set(x, 9, 0, x === 3 ? CH : CB);                  // across the top ...
for (let y = 6; y <= 9; y++) set(4, y, 0, y === 7 ? CH : CB);                  // ... and down again
set(4, 6, 0, "copper_bulb", { lit: "false", powered: "false" });               // pressure gauge
set(3, 7, 0, "grindstone", { face: "wall", facing: "north" });
fill([2, 10, 0], [2, 10, 0], CH);
// thin lightning-rod pipes on the east side
for (let z = 2; z <= 12; z++) set(16, 7, z, "lightning_rod", { facing: z % 2 ? "south" : "north", powered: "false", waterlogged: "false" });

// ---- 5. CHIMNEYS --------------------------------------------------------------------------------------------------
cylinder(g, { base: [1, 1, 5], radius: 1, height: 12, shape: "square", block: BR, bands: [{ every: 4, offset: 3, block: CU }] });
fill([0, 13, 4], [2, 13, 6], "polished_blackstone_bricks");
for (let z = 8; z <= 9; z++) for (let x = 3; x <= 4; x++) for (let y = 1; y <= 12; y++) set(x, y, z, y === 10 ? CU : BR);
fill([3, 13, 8], [4, 13, 9], "polished_blackstone_bricks");
fill([13, 1, 10], [13, 12, 10], BR);
set(13, 13, 10, "polished_blackstone_bricks");

// ---- mirror: the design was drawn chimneys-west; the street sees chimneys on the LEFT (east), as in the concept ----
const FLIP = { east: "west", west: "east" };
const SHAPE = { inner_left: "inner_right", inner_right: "inner_left", outer_left: "outer_right", outer_right: "outer_left" };
const HINGE = { left: "right", right: "left" };
function mirrorGrid(src) {
  const out = new Grid(src.size, { dataVersion: src.dataVersion });
  for (const c of src) {
    const st = c.state ? { ...c.state } : undefined;
    if (st) {
      if (st.facing && FLIP[st.facing]) st.facing = FLIP[st.facing];
      if (st.shape && SHAPE[st.shape]) st.shape = SHAPE[st.shape];
      if (st.hinge) st.hinge = HINGE[st.hinge];
      if ("east" in st && "west" in st) { const e = st.east; st.east = st.west; st.west = e; }
    }
    out.set(src.size[0] - 1 - c.pos[0], c.pos[1], c.pos[2], c.block, st, c.nbt);
  }
  return out;
}
const h = mirrorGrid(g);
// ---- 6. POST-MIRROR (final coordinates): windows, craft brushes, props ----------------------------------------------
const hset = (x, y, z, b, s, n) => h.set(x, y, z, b, s, n);
const win = (face, plane, a0, a1, y0, y1) => {              // carve panes in a wall plane; a0..a1 along the wall
  for (let a = a0; a <= a1; a++) for (let y = y0; y <= y1; y++) {
    if (face === "west" || face === "east") hset(plane, y, a, "glass_pane"); else hset(a, y, plane, "glass_pane");
  }
};
win("west", 1, 3, 5, 3, 6); win("west", 1, 9, 11, 3, 6);
win("east", 15, 9, 11, 3, 6);
win("south", 13, 3, 4, 3, 6); win("south", 13, 12, 13, 3, 6);
// back service door (x8)
hset(8, 1, 13, "air"); hset(8, 2, 13, "air");
for (let y = 3; y <= 4; y++) hset(8, y, 13, "glass_pane");
for (const x of [7, 9]) for (let y = 3; y <= 4; y++) hset(x, y, 13, "glass_pane");
// openings get surrounds
const SR = [
  { at: [4, 2, 1], face: "north", width: 2, height: 5 },
  { at: [1, 3, 3], face: "west", width: 3, height: 4 }, { at: [1, 3, 9], face: "west", width: 3, height: 4 },
  { at: [15, 3, 11], face: "east", width: 3, height: 4 },
  { at: [4, 3, 13], face: "south", width: 2, height: 4 }, { at: [13, 3, 13], face: "south", width: 2, height: 4 },
];
const notes = [];
for (const o of SR) notes.push(surround(h, { ...o, preset: o.face === "north" ? "classical" : "plain", trim: "stone_bricks" }).notes);
console.error(JSON.stringify(notes));
// lanterns under the crane beam, guild banners on the gate piers
for (const x of [6, 10]) hset(x, 3, 0, "copper_lantern", { hanging: "true", waterlogged: "false" });
for (const x of [5, 11]) hset(x, 6, 0, ...B.banner("orange", [["circle", "black"], ["border", "black"], ["bricks", "gray"]], { facing: "north" }));
// name: wall signs over the small door (final x12..13)
hset(12, 4, 0, ...B.sign("dark_oak", ["AETHER", "WORKS", "& CO.", "est. 1887"], { facing: "north", color: "white" }));
hset(13, 4, 0, ...B.sign("dark_oak", ["INVENTORS", "ENGINEERS", "BY APPOINT-", "MENT"], { facing: "north", color: "white" }));
// barrels and crates in front, right of the gate
for (const [x, y] of [[2, 1], [3, 1], [4, 1], [3, 2]]) hset(x, y, 0, "barrel", { facing: "up", open: "false" });
// interior props (so it is a workshop, not a shell)
hset(3, 1, 11, "anvil", { facing: "east" }); hset(5, 1, 11, "blast_furnace", { facing: "south", lit: "false" });
hset(12, 1, 11, "crafting_table"); hset(13, 1, 11, "smithing_table"); hset(10, 1, 11, "grindstone", { face: "floor", facing: "south" });
for (const [x, z] of [[3, 3], [13, 3]]) { hset(x, 1, z, "barrel", { facing: "up", open: "false" }); }
for (const x of [4, 12]) { hset(x, 1, 8, "dark_oak_fence"); hset(x, 2, 8, "copper_lantern", { hanging: "false", waterlogged: "false" }); }
// weathering: lived-in brick, light
// ridge finials (lightning rods) on the high edge of each tooth
for (const x of [5, 10, 15]) for (const z of [3, 11]) {
  let y = 13; while (y > 0 && h.isAir(x, y, z)) y--;
  if (y > 6 && y < 13) hset(x, y + 1, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}
const gm = h;
gm.save(OUT);
console.log(JSON.stringify({ saved: OUT }));
