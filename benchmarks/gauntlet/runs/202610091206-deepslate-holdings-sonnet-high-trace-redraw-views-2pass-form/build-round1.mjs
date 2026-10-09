// Deepslate Holdings — pass 1: the FRONT FACE (north, −z). Body, roof and sides are plain placeholders.
// Coordinates: x east, y up, z south. The main wall plane is z = WALL_Z; relief d>0 projects toward −z.
// MIRROR TRAP: the tracing's column c (left→right as drawn) is world x = W−1−c.
import { Grid, B } from "../../../../../minecraft-design/tools/src/build.mjs";

const OUT = new URL("./round-1.nbt", import.meta.url).pathname;
const g = new Grid([36, 46, 25]);
const [W, H, DEPTH] = g.size;
const WALL_Z = 5;                       // main front wall plane (wall is 3 thick: z 5..7)
const X = (c) => W - 1 - c;             // tracing column -> world x

// ---- the tracing, classified (rows top y=45 -> ground y=0; col 0..35 left->right as drawn) -------------------------
// D deepslate wall · d polished trim · O/o oak · g/s glass · Q quartz · T cyan · G leaves · . nothing
const MAP = `....................................
....................................
.........................dDd.O......
.................D......ddDDDDd.....
.................o......DDDDDDD.....
................DDD......dDoDDdD....
....D..........DDODD.....dDoDDdQ....
....D.........DDDOODDd...dDoDDd.dD..
...dDDDDDDDDDDDODdDODDDDDDDDdDQQQDd.
...DDDDDDDDDDDODdDdDoDDDDDDDDOQQQdd.
...DDDDDDDDDODDDdodDDDODDDDDDOgggDO.
..dDDDDDDDDODDDDdddDDDDODDDDDOgggoDD
.DdDDDDDDOODDDDDdddDDDDDODDDDOgQgoDD
ddDDDDDDDDDDDDDDDDDDDDDDDDDDDDQggoDd
.DoDDDDDDOODDDDDDODDDDDDODDDDDQgsoo.
.DDDDDDDDDDDDDDDDDDDDDDDDDDDDOQQQo..
.doDdDDDdDODdDDdDODdDDdDODdDdOgggoO.
..OoDDDDDOODDDDDDODDDDDDODDDDOgggoDD
..OoDgggDOODgggDDODDggDDODggDOgQgoDD
..OoDgggDOODgggDDODDggDDODggDOQggooo
..OoDgggDOODgggDDODDggDDODggDOgggoo.
..OoDgggDOODgggDDODDggDDODggDOgggo..
..OoDOOODOODoOODDODDOODDODOODOgggo..
..OoDOOODOODOOODDODDOODDODOODOsQgoO.
..OoDDDDDOODDDDDDODDDDDDODDDDOQggoDD
..OoDgggDOODDggDDODDggDDODggDOgggDDD
..OoDgggDOODgggDDODDggDDODggDOgggooD
..OoDgggDOODgggDDODDggDDODggDOgggooQ
..OoDgggDOODgggDDODDggDDODggDOgQgoO.
..OoDgGGDOODdGGDDODDGGDDODGGDOQggo..
..ddDOOODddDOOODDdDDOODDdDOODOgggo..
.sDDDDDDDDDDDDDDDDDDDDDDDDDDDQgggoDD
.dddDdddDdQQQQQQQQQQQQQQQdddddgggoDD
.DDDDDDDDDQQQQQQQQQQQQQQQDDDDDgQgoDD
..DDdddddDQQQQQQQQQQQQQQQDdddQQsgodd
..ODDDDDDQsQddQdddddQdQQQQDDDQQggoo.
..ODDDggDQTQggQdgggoQgQQTQDgDQgggo..
..ODDDggDQTQggQggsgoQgQQTQDgDQgggoO.
..ODDDggDQTQdgQdgggoQgQQTQDgDQggQoDD
.sGDDDggDQoQggQoooooQgQQOQDgDQgQgoDD
.GGGDDGGGQQQGgQoDoDoQgQQQQDGDGQggDo.
.GGGDDGGGQGQGgQoooooQGQGGdGGGGgggoG.
.GGGGDDGGGGdQOQoDoDooQQGGDDDGGgggoGG
.doGGDDDOdddQQsddddddQdddOGDDdDDDdGG
dDDdddddODDDDdsssssssdDDDOdddDDDDDDd
DDDDDDDDODDDssssssssssDDDODDDDDDDDDD`.split("\n");
const kind = (c, y) => (c < 0 || c >= W || y < 0 || y > 45 ? "." : MAP[45 - y][c]);

// ---- palette ----------------------------------------------------------------------------------------------------
const hash = (a, b, c = 0) => { let h = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const wallBlock = (c, y) => { const r = hash(c, y); return r < 0.12 ? "cracked_deepslate_bricks" : r < 0.22 ? "polished_deepslate" : "deepslate_bricks"; };
const baseBlock = (c, y) => { const r = hash(c, y, 7); return r < 0.2 ? "mossy_stone_bricks" : r < 0.5 ? "cobbled_deepslate" : "stone_bricks"; };
const LOG = ["stripped_oak_log", { axis: "y" }];
const LEAVES = ["oak_leaves", { persistent: "true", distance: "1" }];

// place a block at tracing cell (c, y) with relief d: d>0 stands proud (z = WALL_Z-d .. WALL_Z), d<0 is recessed
// (the wall cells in front of the new surface are carved away: recess by exclusion).
function cell(c, y, d, block, state, { solid = true } = {}) {
  const x = X(c);
  if (d >= 0) {
    for (let z = WALL_Z - d; z <= WALL_Z; z++) if (z === WALL_Z - d || solid) g.set(x, y, z, block, state);
  } else {
    const zs = WALL_Z - d;               // recessed surface
    for (let z = WALL_Z; z < zs; z++) g.set(x, y, z, "minecraft:air");
    g.set(x, y, zs, block, state);
  }
}
const col = (c, y0, y1, d, block, state) => { for (let y = y0; y <= y1; y++) cell(c, y, d, block, state); };

// ---- window bays (tracing columns) -------------------------------------------------------------------------------
const BAYS = [[5, 7], [12, 14], [20, 22], [26, 27]];
const inBay = (c) => BAYS.some(([a, b]) => c >= a && c <= b);

// ---- placeholder body: plain deepslate box, flat roof (the second pass redesigns sides, back, roof) ---------------
function body() {
  const xa = X(35), xb = X(2);
  g.fill([0, 0, WALL_Z], [W - 1, 2, DEPTH - 1], "stone_bricks");                       // plinth
  g.fill([xa, 3, WALL_Z], [xb, 36, DEPTH - 1], "deepslate_bricks");                    // solid block ...
  g.fill([xa + 2, 3, WALL_Z + 3], [xb - 2, 35, DEPTH - 3], "minecraft:air");           // ... hollowed (3 thick front wall)
  g.fill([xa, 37, WALL_Z], [xb, 37, DEPTH - 1], "deepslate_tiles");                    // flat roof deck
}

// ---- THE FRONT --------------------------------------------------------------------------------------------------
function front() {
  const isPier = (c, y) => y >= 15 && y <= 31 && (c === 2 || c === 3 || c === 9 || c === 10 || c === 17 || c === 24 || c === 29 || c === 33);
  for (let y = 0; y <= 45; y++) for (let c = 0; c < W; c++) {
    const k = kind(c, y);
    if (k === ".") continue;
    const inPortico = c >= 9 && c <= 25 && y <= 13;
    const inShaft = c >= 29 && c <= 35 && y >= 3 && y <= 37;
    const inHead = c >= 24 && c <= 31 && y >= 37;
    if (inPortico || inShaft || inHead) continue;          // handled by their own functions
    if (y <= 2) { cell(c, y, 0, baseBlock(c, y)); continue; }
    if (c <= 1) { cell(c, y, 1, "polished_deepslate"); continue; }

    // oak: piers (vertical, +1), sills / mid-bands / rakes (planks)
    if (k === "O" || k === "o") {
      if (y >= 33 && c >= 9 && c <= 25) continue;                                   // pediment rakes: see pediment()
      else if (inBay(c)) cell(c, y, 1, "oak_planks");                              // sills and mid-bands
      else if (y === 41 || y === 42) cell(c, y, 0, "oak_planks");                  // spire
      else cell(c, y, 1, ...LOG);
      continue;
    }
    if (k === "G") { if (inBay(c) && y >= 15 && y <= 21) { cell(c, y, -2, "glass_pane"); g.set(X(c), y, WALL_Z + 1, ...LEAVES); } else cell(c, y, 2, ...LEAVES); continue; }
    if (k === "g" || k === "s") {
      if (inBay(c) || (y <= 10)) cell(c, y, -2, "glass_pane"); else cell(c, y, 0, wallBlock(c, y));
      continue;
    }
    cell(c, y, 0, wallBlock(c, y));
  }
  windowHeads();
  cornices();
  pediment();
  portico();
  shaft();
  head();
  trees();
}

// window bays: recessed head niche above each window and the lintel row between them
function windowHeads() {
  for (const [a, b] of BAYS) for (let c = a; c <= b; c++) {
    for (let y = 28; y <= 31; y++) cell(c, y, -1, "deepslate_bricks");
    cell(c, 21, -1, "deepslate_bricks");
    for (let y = 16; y <= 20; y++) cell(c, y, -2, "glass_pane");
    for (let y = 24; y <= 27; y++) cell(c, y, -2, "glass_pane");
    cell(c, 15, 1, "oak_planks"); cell(c, 22, 1, "oak_planks"); cell(c, 23, 1, "oak_planks");   // sill, mid-band
    if (a === 5 || a === 12 || a === 20) cell(c, 16, -1, ...LEAVES);                           // planter on the storey-2 sills
  }
  for (const c of [6, 7]) for (let y = 6; y <= 9; y++) cell(c, y, -2, "glass_pane");          // ground-floor windows
  for (let y = 5; y <= 9; y++) cell(27, y, -2, "glass_pane");
}

function cornices() {
  for (let c = 1; c <= 34; c++) {
    if (c >= 14 && c <= 20) continue;                                    // the gable interrupts the cornice
    cell(c, 36, 2, "polished_deepslate");                                // main cornice +2
    cell(c, 37, 1, "deepslate_tiles");                                   // eave course
    cell(c, 32, 1, "polished_deepslate");                                // string course below the frieze
  }
  for (const c of [2, 3, 9, 10, 17, 24, 29, 33]) { cell(c, 14, 2, "chiseled_deepslate"); for (let y = 32; y <= (c >= 9 && c <= 25 ? 32 : 35); y++) cell(c, y, 2, y === 32 ? "chiseled_deepslate" : "polished_deepslate"); }
  for (let c = 4; c <= 28; c++) if (!isPierCol(c)) for (let y = 34; y <= 35; y++) if (!(c >= 9 && c <= 25)) cell(c, y, -1, "deepslate_bricks");  // frieze recess
  for (let c = 1; c <= 29; c++) { if (c >= 9 && c <= 25) continue; cell(c, 13, 1, "polished_deepslate"); }
  for (let y = 38; y <= 39; y++) cell(4, y, 0, "deepslate_bricks");     // chimney stub
}
const isPierCol = (c) => [2, 3, 9, 10, 17, 24, 29, 33].includes(c);

// central pediment (x9..25 in the tracing): oak stepped rakes proud, tile field, slit window, spire
function pediment() {
  for (let y = 33; y <= 40; y++) for (let c = 11; c <= 23; c++) {
    const k = kind(c, y);
    if (k === "O" || k === "o") continue;
    if (k !== ".") cell(c, y, -1 + 0, "deepslate_tiles");
  }
  const RAKE = { 33: [9, 10], 34: [11, 12], 35: [12, 13], 36: [14, 15], 37: [15, 16], 38: [16, 17], 39: [17, 18] };
  for (const [y, cs] of Object.entries(RAKE)) for (const c of cs) { cell(c, +y, 1, "oak_planks"); cell(35 - c, +y, 1, "oak_planks"); }
  for (let y = 33; y <= 36; y++) { cell(16, y, 1, "polished_deepslate"); cell(18, y, 1, "polished_deepslate"); }
  for (let y = 34; y <= 35; y++) cell(17, y, -1, "oak_planks");           // slit
  // gable prism behind the front so the roof stands (placeholder: solid)
  for (let y = 37; y <= 41; y++) for (let c = 11; c <= 23; c++) {
    if (kind(c, y) === ".") continue;
    for (let z = WALL_Z + 1; z <= 16; z++) g.set(X(c), y, z, "deepslate_tiles");
  }
  for (let y = 41; y <= 42; y++) g.set(X(17), y, WALL_Z, "oak_planks");   // spire
}

function portico() {
  const stone = "smooth_stone", Q = "smooth_quartz", PILL = ["quartz_pillar", { axis: "y" }];
  for (let c = 9; c <= 25; c++) {                                          // podium, canopy
    for (let y = 0; y <= 2; y++) for (let z = 2; z <= 4; z++) g.set(X(c), y, z, y === 2 ? Q : stone);
    for (let z = 1; z <= 4; z++) { g.set(X(c), 10, z, Q); g.set(X(c), 13, z, Q); }
    for (let y = 11; y <= 12; y++) if (c >= 10 && c <= 24) for (let z = 3; z <= 4; z++) g.set(X(c), y, z, Q);   // sign band +2
  }
  for (let c = 12; c <= 21; c++) g.set(X(c), 0, 0, stone);                  // steps, 5 up from the street
  for (let c = 13; c <= 20; c++) { g.set(X(c), 0, 1, stone); g.set(X(c), 1, 1, stone); }
  for (const c of [9, 11, 14, 20, 23, 25]) for (let y = 3; y <= 9; y++) g.set(X(c), y, 2, ...PILL);   // columns +3
  for (const c of [10, 24]) for (let y = 6; y <= 9; y++) g.set(X(c), y, 2, "cyan_wool");             // banners
  // sidelights: recessed glazing
  for (const c of [12, 13, 21, 22]) for (let y = 3; y <= 9; y++) cell(c, y, -2, y <= 3 ? "smooth_quartz" : "glass_pane");
  for (const c of [10, 24, 15, 16, 17, 18, 19]) for (let y = 3; y <= 9; y++) cell(c, y, c === 10 || c === 24 ? 0 : -2, "smooth_quartz");  // placeholders overwritten below
  for (let y = 3; y <= 9; y++) { cell(10, y, 0, "smooth_quartz"); cell(24, y, 0, "smooth_quartz"); }
  // entrance: 5 wide, recessed 2; spruce frame, double doors, glass transom
  for (let y = 3; y <= 9; y++) for (const c of [15, 17, 19]) cell(c, y, -2, "spruce_planks");
  for (const c of [15, 16, 17, 18, 19]) cell(c, 6, -2, "spruce_planks");
  for (const c of [16, 18]) { const x = X(c), z = WALL_Z + 2; g.set(x, 3, z, ...B.door("spruce", "north", "lower", c === 16 ? "right" : "left")); g.set(x, 4, z, ...B.door("spruce", "north", "upper", c === 16 ? "right" : "left")); g.set(x, 5, z, "glass_pane"); }
  for (const c of [16, 17, 18]) for (let y = 7; y <= 9; y++) cell(c, y, -2, "glass_pane");
  for (const c of [8, 26]) col(c, 3, 5, 2, ...LOG);                       // lantern-post stumps
  for (let c = 9; c <= 25; c++) cell(c, 14, 0, "deepslate_bricks");
}

function shaft() {
  // glass stair shaft up the front-right corner (tracing cols 29..35): oak frames proud, glass recessed, quartz landings
  for (let y = 3; y <= 37; y++) {
    cell(29, y, 1, ...LOG); cell(33, y, 1, ...LOG);
    for (let c = 30; c <= 32; c++) {
      const k = kind(c, y);
      if (y >= 36) cell(c, y, 1, "smooth_quartz");
      else if (k === "Q" && y > 4) cell(c, y, -2, "smooth_quartz");
      else cell(c, y, -2, "glass_pane");
    }
    for (const c of [34, 35]) cell(c, y, 0, wallBlock(c, y));
  }
  for (const c of [29, 33, 34, 35]) cell(c, 37, 2, "polished_deepslate");
}

function head() {                                                         // elevator head: 7 wide, y37..42, rail on top
  for (let y = 37; y <= 42; y++) for (let c = 24; c <= 30; c++) for (let z = WALL_Z; z <= 12; z++) g.set(X(c), y, z, y === 42 ? "polished_deepslate" : "deepslate_bricks");
  for (let y = 38; y <= 41; y++) cell(27, y, -1, "oak_planks");           // slit
  for (const c of [24, 26, 28, 30]) g.set(X(c), 43, WALL_Z, "oak_planks");  // rail
}

function trees() {
  for (let y = 3; y <= 8; y++) for (let c = 0; c < W; c++) {
    if (c >= 9 && c <= 25) continue;
    if (kind(c, y) === "G" && c < 29) cell(c, y, 2, ...LEAVES);
  }
}

// glazing: back every pane with a pale lit-interior block, and connect panes to their neighbours
function glaze() {
  const panes = [...g.cells.values()].filter((c) => c.block === "minecraft:glass_pane");
  for (const { pos: [x, y, z] } of panes) {
    if (g.isAir(x, y, z + 1) && z + 1 < DEPTH) g.set(x, y, z + 1, x <= X(29) ? "light_gray_concrete" : "smooth_quartz");   // shaft backing differs so the quartz landings read
    const link = (dx, dz) => { const b = g.blockAt(x + dx, y, z + dz); return b === "minecraft:glass_pane" || !g.isAir(x + dx, y, z + dz); };
    g.set(x, y, z, "glass_pane", { east: link(1, 0), west: link(-1, 0), north: false, south: false });
  }
}

body();
front();
glaze();
g.save(OUT);
console.log(JSON.stringify({ saved: OUT }));
