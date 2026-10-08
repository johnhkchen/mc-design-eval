// Art Deco dance hall. usage: node build.mjs 1|2   (round 2 = fixes found by comparing round-1 renders to concept)
import { Grid, tile, mirrorX, carve, B } from "../../../../../minecraft-design/tools/src/build.mjs";
const ROUND = Number(process.argv[2] || 1);
const OFF = 3;                                   // spec z0 (front plane) = grid z3, so marquee z-3..-1 fits
const g = new Grid([22, 16, 23]);
const Z = (z) => z + OFF;
const set = (x, y, z, b, s) => g.set(x, y, Z(z), b, s);
const fill = (a, b, blk, s) => g.fill([a[0], a[1], Z(a[2])], [b[0], b[1], Z(b[2])], blk, s);
const air = (a, b) => carve(g, [a[0], a[1], Z(a[2])], [b[0], b[1], Z(b[2])]);
const sym = (paint) => mirrorX(g, 10.5, (s) => paint((x, y, z, b, st) => s(x, y, Z(z), b, st)));

const SAND = "cut_sandstone", CHI = "chiseled_sandstone", SMOOTH = "smooth_sandstone";
const WHITE = "white_concrete", NAVY = "blue_concrete", BLACK = "black_concrete", GOLD = "gold_block";
const GL = { y: "yellow_stained_glass", o: "orange_stained_glass", l: "light_blue_stained_glass", b: "blue_stained_glass" };

// ---- 1. form ------------------------------------------------------------------------------------------------
fill([0, 0, 0], [21, 8, 3], WHITE);                         // front block
fill([0, 0, -1], [1, 8, 3], SAND); fill([20, 0, -1], [21, 8, 3], SAND);   // end piers, 1 proud
fill([6, 9, 0], [15, 11, 3], WHITE);                         // tower slab
fill([7, 12, 0], [14, 12, 3], SAND);                         // pylon cap
const TIERS = ROUND >= 2 ? [[4, 8, 8], [9, 13, 6], [14, 19, 5]] : [[4, 8, 8], [9, 13, 7], [14, 19, 6]];   // [z0, z1, top y]
for (const [a, b, top] of TIERS) fill([1, 0, a], [20, top, b], WHITE);
// interior
air([2, 1, 2], [19, 6, 3]);
for (const [a, b, top] of TIERS) air([2, 1, a], [19, top - 1, b - (b === 19 ? 1 : 0)]);
air([2, 8, 1], [5, 8, 3]); air([16, 8, 1], [19, 8, 3]);      // wing decks drop to y7 behind the parapet
// plinth
fill([0, 0, -1], [21, 0, 19], BLACK);
for (const x of [2, 3, 4, 5, 16, 17, 18, 19]) set(x, 0, 0, NAVY);

// ---- 2. rear terraces + side walls -------------------------------------------------------------------------
for (const [a, b, top] of TIERS) {
  fill([1, top, a], [20, top, b], SMOOTH);                   // deck
  fill([1, top, a], [20, top, a], SAND);                     // front lip
  for (let z = a; z <= b; z++) { set(1, top, z, SAND); set(20, top, z, SAND); }
  fill([2, top, b], [19, top, b], SAND);                     // back lip
  fill([2, top - 1, b], [19, top - 1, b], NAVY);             // navy band under the lip
}
fill([2, 5, 19], [19, 5, 19], SAND);
if (ROUND < 2) for (let x = 2; x <= 19; x++) set(x, 6, 19, WHITE);   // r1 stray strip above the rear lip
sym((s) => {
  for (const z of [4, 9, 14, 18]) for (let dz = 0; dz < 2; dz++) for (let y = 0; y <= 7; y++) {   // pilasters
    const top = TIERS[z >= 14 ? 2 : z >= 9 ? 1 : 0][2];
    if (y <= top) s(0, y, z + dz, y === 3 ? CHI : SAND);
  }
  const sy = ROUND >= 2 ? [3, 4] : [4, 5];
  for (const z of [7, 12, 16]) for (const y of sy) s(1, y, z, GL.l);                           // slits
  for (const [a, b, top] of TIERS) for (let z = a; z <= b; z++) if (ROUND >= 2) s(1, top - 1, z, NAVY);
  if (ROUND < 2) for (let z = 5; z <= 13; z++) s(1, 7, z, NAVY);   // cornice line
});

// ---- 3. front: wings -----------------------------------------------------------------------------------------
sym((s) => {
  // end piers: chiseled panels on the proud face, stepped cap
  for (const x of [0, 1]) for (let y = 2; y <= 5; y++) s(x, y, -1, CHI);
  s(0, 8, -1, SAND); s(0, 8, 0, SAND); s(1, 8, -1, "cut_sandstone_slab", { type: "bottom", waterlogged: "false" });
  // side bay (x3-4): glass recessed, black lower window, frame, rosette, zig-zag
  for (const x of [3, 4]) {
    s(x, 3, 0, "minecraft:air"); s(x, 4, 0, "minecraft:air"); s(x, 5, 0, "minecraft:air"); s(x, 6, 0, "minecraft:air");
    s(x, 1, 0, "minecraft:air"); s(x, 2, 0, "minecraft:air");
    s(x, 3, 1, GL.y); s(x, 4, 1, GL.o); s(x, 5, 1, GL.l); s(x, 6, 1, GL.b);
    s(x, 1, 1, "black_stained_glass"); s(x, 2, 1, "black_stained_glass");
    s(x, 7, 0, GOLD);
    s(x, 7, 1, SAND);
  }
  s(2, 1, 0, BLACK); s(2, 2, 0, BLACK); s(5, 1, 0, BLACK); s(5, 2, 0, BLACK);
  s(2, 7, 0, CHI); s(5, 7, 0, CHI);
  // zig-zag crest y8 (outer black -> inner navy), band y7 edge
  s(2, 8, 0, BLACK); s(3, 8, 0, NAVY); s(4, 8, 0, NAVY); s(5, 8, 0, BLACK);
  s(2, 7, -1, BLACK); s(5, 7, -1, NAVY);
});

// ---- 4. front: central bay -------------------------------------------------------------------------------------
sym((s) => {
  fill_s(s, 6, 6, -1, 0, 11, NAVY);                          // navy fin x6 to y11
  fill_s(s, 7, 7, -1, 0, 12, SAND);                          // sand fin x7 to y12
  function fill_s(s, x0, x1, z0, z1, top, blk) { for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = 1; y <= top; y++) s(x, y, z, blk); }
  s(8, 12, 0, SAND);
});
// window x9-12 y7-10 recessed, checker + mullion
for (let x = 9; x <= 12; x++) for (let y = 7; y <= 10; y++) {
  set(x, y, 0, "minecraft:air");
  const chk = ((x - 9 >> 1) + (y - 7 >> 1)) % 2;
  const c = y >= 9 ? (chk ? GL.l : GL.y) : (chk ? GL.o : GL.b);
  const mull = (x === 10 || x === 11) && (y === 8 || y === 9);
  set(x, y, 1, mull ? SAND : c);
}
// sunburst
for (let x = 9; x <= 12; x++) set(x, 11, 0, GOLD);
set(10, 12, 0, GOLD); set(11, 12, 0, GOLD);
set(9, 12, 0, SAND); set(12, 12, 0, SAND);
// spire arch
for (const x of [9, 12]) for (let y = 13; y <= 15; y++) for (let z = 0; z <= 1; z++) set(x, y, z, SAND);
for (const x of [10, 11]) for (let y = 13; y <= 14; y++) for (let z = 0; z <= 1; z++) set(x, y, z, "yellow_stained_glass");
for (const x of [10, 11]) for (let z = 0; z <= 1; z++) set(x, 15, z, "cut_sandstone_slab", { type: "bottom", waterlogged: "false" });

// ---- 5. entrance + marquee ---------------------------------------------------------------------------------
for (let x = 9; x <= 12; x++) for (let y = 1; y <= 3; y++) { set(x, y, 0, "minecraft:air"); }
for (let x = 9; x <= 12; x++) { set(x, 3, 0, CHI); set(x, 3, 1, CHI); set(x, 0, 0, BLACK); }
set(9, 1, 1, ...B.door("dark_oak", "north", "lower", "right")); set(9, 2, 1, ...B.door("dark_oak", "north", "upper", "right"));
set(10, 1, 1, ...B.door("dark_oak", "north", "lower", "left")); set(10, 2, 1, ...B.door("dark_oak", "north", "upper", "left"));
set(11, 1, 1, ...B.door("dark_oak", "north", "lower", "right")); set(11, 2, 1, ...B.door("dark_oak", "north", "upper", "right"));
set(12, 1, 1, ...B.door("dark_oak", "north", "lower", "left")); set(12, 2, 1, ...B.door("dark_oak", "north", "upper", "left"));
for (const x of [8, 13]) for (let y = 1; y <= 3; y++) for (const z of [-1, 0]) set(x, y, z, ...B.log("stripped_birch", "y"));
// marquee body
fill([6, 4, -3], [15, 5, -1], WHITE);
for (let x = 6; x <= 15; x++) for (let z = -2; z <= -1; z++) set(x, 4, z, "smooth_quartz");   // soffit
const TC = (i) => (i % 2 ? "orange_terracotta" : "terracotta");
for (let y = 4; y <= 5; y++) { set(6, y, -3, TC(y)); set(15, y, -3, TC(y + 1)); }
for (let z = -2; z <= -1; z++) for (let y = 4; y <= 5; y++) { set(6, y, z, TC(y + z)); set(15, y, z, TC(y + z)); }
for (const x of [7, 8, 13, 14]) set(x, 4, -3, ROUND >= 2 ? WHITE : TC(x));
for (const x of [7, 8, 13, 14]) set(x, 5, -3, "smooth_quartz");
set(7, 5, -3, "sea_lantern"); set(14, 5, -3, "sea_lantern");
set(9, 5, -3, "glowstone"); set(10, 5, -3, "prismarine"); set(11, 5, -3, "prismarine"); set(12, 5, -3, "glowstone");
set(9, 4, -3, "orange_terracotta"); set(10, 4, -3, "warped_planks"); set(11, 4, -3, "warped_planks"); set(12, 4, -3, "orange_terracotta");
// gold crown: base 8 wide, top 4 wide
fill([7, 6, -3], [14, 6, -1], GOLD);
fill([9, 7, -2], [12, 7, -1], GOLD);

g.save(`round-${ROUND}.nbt`);
console.log("saved round", ROUND);
