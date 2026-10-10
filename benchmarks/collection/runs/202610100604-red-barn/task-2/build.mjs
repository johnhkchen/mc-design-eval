// Red gambrel farm barn. Front (gable end) faces NORTH (-z). Grid 15 x 14 x 21.
// Body x2..12 (11 wide), z3..19 (17 deep); y0 floor, y1 stone foundation, red walls y2..4, eave y4; roof preset `barn`.
// z0..2 is the farmyard (grass, gravel path, fence, hay, barrels). The roof overhang fills x0..14.
import { Grid, B, roof, surround, fixture, planter } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const g = new Grid([15, 14, 21]);
const OUT = process.env.OUT ?? "build.nbt";
const put = (x, y, z, ...p) => g.set(x, y, z, ...p);
const fill = (a, b, blk, s) => g.fill(a, b, blk, s);
const air = (x, y, z) => put(x, y, z, "air");

const WALL = "red_terracotta", WHITE = "smooth_quartz", TIMBER = "dark_oak", LEAF = "mangrove_planks";
const X0 = 2, X1 = 12, Z0 = 3, Z1 = 19, WT = +(process.env.WT ?? 4), CX = 7;
const hay = (x, y, z, axis = "x") => put(x, y, z, "hay_block", { axis });
const logB = (x, y, z, axis) => put(x, y, z, ...B.log(TIMBER, axis));

// ---- ground, floor, foundation, walls ----
fill([0, 0, 0], [14, 0, 20], "grass_block");
fill([X0, 0, Z0], [X1, 0, Z1], "stone_bricks");
const FOUND = ["stone_bricks", "cobblestone", "stone_bricks", "mossy_cobblestone", "andesite", "stone_bricks", "cobblestone"];
for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) {
  if (!(x === X0 || x === X1 || z === Z0 || z === Z1)) continue;
  put(x, 1, z, FOUND[(x * 5 + z * 3) % FOUND.length]);
  for (let y = 2; y <= WT; y++) put(x, y, z, WALL);
}
for (const x of [X0, X1]) for (const z of [Z0, Z1]) for (let y = 2; y <= WT; y++) put(x, y, z, WHITE);   // white corner boards
for (const x of [X0, X1]) for (let z = Z0 + 1; z < Z1; z++) put(x, WT, z, WHITE);                       // white eave board, long sides

// ---- roof: the barn preset (gambrel along z), cupola built by hand below ----
const rr = roof(g, [[X0, Z0, X1, Z1]], "barn", { y: WT + 1, tower: null, dormers: { face: ["east", "west"], count: 2, style: "gable", window: "gray_stained_glass_pane" }, gable: WALL, material: "slate", ...(process.env.MH ? { maxHeight: +process.env.MH } : {}) });
console.log("roof", JSON.stringify({ top: rr.top, shift: rr.shift, notes: rr.notes, refused: rr.refused }));

// ---- sliding double doors + loft door, on a gable end. dir -1 = front (north), +1 = back (south) ----
function gableEnd(zw, dir, front) {
  const zi = zw - dir;                                                 // interior side
  const lo = 3, hi = 11, h = 4, mid = CX;                               // opening x3..11, 4 tall: two 4x4 leaves round a timber post
  for (let x = lo; x <= hi; x++) for (let y = 1; y <= h; y++) { air(x, y, zw); put(x, y, zi, x === mid ? TIMBER + "_planks" : LEAF); }
  for (let x = lo - 1; x <= hi + 1; x++) put(x, h + 1, zw, WHITE);      // white header
  for (const x0 of [lo, mid + 1]) for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++)   // white X brace on each leaf, in the recess plane
    if (i === j || i + j === 3) put(x0 + i, 1 + j, zi, WHITE);
  // loft door: opening in the red gable, open shutters, hay behind (jambs stay red, header white)
  const ly = 7;
  for (let y = ly; y <= ly + 1; y++) for (const x of [CX - 1, CX, CX + 1]) air(x, y, zw);
  for (const x of [CX - 1, CX, CX + 1]) put(x, ly + 2, zw, WHITE);
  for (let y = ly; y <= ly + 1; y++) { put(CX - 1, y, zw, ...B.trapdoor("pale_oak", "east", "bottom", true)); put(CX + 1, y, zw, ...B.trapdoor("pale_oak", "west", "bottom", true)); }
  for (let x = CX - 1; x <= CX + 1; x++) { hay(x, ly, zi, "z"); hay(x, ly, zi - dir, "z"); }
  if (front) {
    for (let x = 2; x <= 12; x++) logB(x, 6, zw + dir, "x");            // sliding-door track beam, proud
    for (const x of [3, 11]) put(x, 5, zw + dir, ...B.lantern(true));   // lanterns hung from the track
    for (const z of [zw, zw + dir, zw + 2 * dir]) logB(CX, 9, z, "z");   // hoist beam out from the gable peak
    for (const y of [8, 7]) put(CX, y, zw + 2 * dir, ...B.chain("y"));
    hay(CX, 6, zw + 2 * dir, "z");                                       // the hoisted bale
  }
}
gableEnd(Z0, -1, true);
gableEnd(Z1, +1, false);

// ---- cupola on the ridge (y10 base ring, y11 louvres, y12 cap, y13 vane) ----
const CZ = Math.round((Z0 + Z1) / 2);
for (let x = CX - 1; x <= CX + 1; x++) for (let z = CZ - 1; z <= CZ + 1; z++) {
  const corner = x !== CX && z !== CZ, centre = x === CX && z === CZ;
  put(x, 10, z, centre ? "air" : corner ? WHITE : WALL);
  if (!centre) put(x, 11, z, corner ? WHITE : "air");
  put(x, 12, z, centre ? "deepslate_tiles" : corner ? "deepslate_tile_slab" : "deepslate_tile_stairs");
}
put(CX, 11, CZ - 1, ...B.trapdoor("spruce", "north", "bottom", true)); put(CX, 11, CZ + 1, ...B.trapdoor("spruce", "south", "bottom", true));
put(CX - 1, 11, CZ, ...B.trapdoor("spruce", "west", "bottom", true)); put(CX + 1, 11, CZ, ...B.trapdoor("spruce", "east", "bottom", true));
for (const [x, z, f] of [[CX, CZ - 1, "south"], [CX, CZ + 1, "north"], [CX - 1, CZ, "east"], [CX + 1, CZ, "west"]]) put(x, 12, z, ...B.stairs("deepslate_tile", f, "bottom"));
put(CX, 13, CZ, "iron_bars");
for (const [dx, dz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) put(CX + dx, 13, CZ + dz, "iron_bars");   // vane cross

// ---- side walls: framed 2x2 windows, a man-door on the east ----
const wins = [[6, 7], [15, 16]];
for (const z of [wins[0][0], wins[1][0]]) for (const side of ["west", "east"]) {
  const x = side === "west" ? X0 : X1, zl = side === "west" ? z : z + 1;      // bottom-left as seen from outside
  for (const dz of [0, 1]) for (const y of [2, 3]) { put(x, y, z + dz, "gray_stained_glass_pane"); put(side === "west" ? x + 1 : x - 1, y, z + dz, "dark_oak_planks"); }
  surround(g, { at: [x, 2, zl], face: side, width: 2, height: 2, preset: "timber", trim: "dark_oak_log", reveal: false, box: false });
}
{ // east man-door at z11
  const x = X1, z = 11;
  air(x, 1, z); air(x, 2, z); air(x, 3, z);
  put(x, 1, z, ...B.door("spruce", "east", "lower")); put(x, 2, z, ...B.door("spruce", "east", "upper"));
  for (const dz of [-1, 1]) for (let y = 1; y <= 3; y++) put(x, y, z + dz, WHITE);
  put(x, 3, z, WHITE);
  put(x + 1, 1, z, "stone_slab", { type: "bottom" }); put(x + 1, 0, z, "stone_bricks");
  fixture(g, { at: [x, 2, z + 2], face: "east", mount: "bracket", bracket: "dark_oak_planks" });
}

// ---- yard: gravel path, fence with a gap at the doors, hay bales, barrels, tufts ----
fill([4, 0, 0], [10, 0, 2], "gravel");
for (let x = 0; x <= 14; x++) if (x <= 3 || x >= 11) put(x, 1, 0, ...B.fence("oak"));
for (let z = 1; z <= 12; z++) { put(0, 1, z, ...B.fence("oak")); put(14, 1, z, ...B.fence("oak")); }
hay(1, 1, 1, "x"); hay(2, 1, 1, "x"); hay(1, 2, 1, "z"); hay(1, 1, 2, "x"); hay(2, 1, 2, "x");
hay(12, 1, 1, "x"); hay(13, 1, 1, "x"); hay(13, 2, 1, "x"); hay(12, 1, 2, "z"); hay(13, 1, 2, "x");
for (const [x, z] of [[3, 1], [11, 1], [13, 4], [1, 5]]) put(x, 1, z, "barrel", { facing: "up", open: "false" });
for (const [x, z] of [[1, 3], [3, 2], [12, 0], [11, 2], [2, 0], [13, 8], [1, 9], [1, 14], [13, 16]]) if (g.blockAt(x, 1, z) === "minecraft:air") put(x, 1, z, "short_grass");
hay(13, 1, 18, "x"); hay(13, 1, 19, "x"); hay(13, 2, 19, "z"); hay(1, 1, 18, "z");

g.save(OUT);
console.log(JSON.stringify({ saved: OUT, size: g.size, refused: g.refused }));
