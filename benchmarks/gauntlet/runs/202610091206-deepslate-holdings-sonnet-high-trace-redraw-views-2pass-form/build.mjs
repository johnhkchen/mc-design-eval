// Deepslate Holdings — pass 2: the FRONT FACE is unchanged from pass 1 (build-round1.mjs); this pass designs the SIDES, BACK and ROOF.
// Coordinates: x east, y up, z south. The main wall plane is z = WALL_Z; relief d>0 projects toward −z.
// MIRROR TRAP: the tracing's column c (left→right as drawn) is world x = W−1−c.
import { Grid, B } from "../../../../../minecraft-design/tools/src/build.mjs";

const OUT = new URL("./round-2.nbt", import.meta.url).pathname;
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

// ---- body: stepped mass. Zone A (z5..19) walls to y36 / deck y37; B (z20..22) to y33 / deck y34; C (z23..24) to y30 / deck y31 ----
const topOf = (z) => (z <= 19 ? 36 : z <= 22 ? 33 : 30);
function body() {
  g.fill([0, 0, WALL_Z], [W - 1, 2, DEPTH - 1], "stone_bricks");                       // plinth
  for (let z = WALL_Z; z < DEPTH; z++) g.fill([0, 3, z], [33, topOf(z), z], "deepslate_bricks");
  g.fill([2, 3, 8], [31, 35, 19], "minecraft:air");                                    // hollow (zone A only), front glass backs onto z=8
  g.fill([2, 3, 9], [3, 35, 19], "deepslate_bricks");                                  // thick side walls behind the shaft cavity row
  g.fill([30, 3, 9], [31, 35, 19], "deepslate_bricks");
  for (let z = WALL_Z; z < DEPTH; z++) g.fill([0, topOf(z) + 1, z], [33, topOf(z) + 1, z], "deepslate_tiles");   // roof deck
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

function head() {}                                                        // moved back: see rearHead()

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


// =====================================================================================================================
// PASS 2: roof, sides, back. Full blocks only (plus glass, panes, doors); no stairs/slabs/fences.
// =====================================================================================================================
const AIR = "minecraft:air", P = "polished_deepslate", TILES = "deepslate_tiles", Q = "smooth_quartz", GREY = "light_gray_concrete";
const put = (x, y, z, b, st) => g.set(x, y, z, b, st);
const fillBox = (x0, y0, z0, x1, y1, z1, b, st) => g.fill([x0, y0, z0], [x1, y1, z1], b, st);
const sidePane = (x, y, z, backX) => { put(x, y, z, "glass_pane", { north: true, south: true, east: false, west: false }); if (backX !== undefined) put(backX, y, z, GREY); };

// ---- ROOF -----------------------------------------------------------------------------------------------------
function roof() {
  // central gable (tracing c11..23 -> x24..12): the front tile profile extruded back, then hipped away over 4 courses
  const top = (c) => { let t = 36; for (let y = 37; y <= 40; y++) if (kind(c, y) !== ".") t = y; return t; };
  for (let c = 11; c <= 23; c++) for (let z = WALL_Z + 1; z <= 17; z++) {
    const k = Math.max(0, z - 13);
    if (c < 11 + k || c > 23 - k) continue;
    for (let y = 37; y <= top(c) - k; y++) put(X(c), y, z, TILES);
  }
  // left (+x) flank: low tile hip rising toward the gable, falling away to the rear
  for (let x = 25; x <= 32; x++) for (let z = 6; z <= 19; z++) {
    const h = Math.min(Math.floor((32 - x) / 3), Math.floor((19 - z) / 2));
    for (let y = 38; y <= 37 + h; y++) put(x, y, z, TILES);
  }
  for (let z = 6; z <= 7; z++) { put(31, 38, z, "deepslate_bricks"); put(31, 39, z, "deepslate_bricks"); }   // chimney stack runs back from the front stub
  rearHead();
  rearSteps();
}

// elevator head: 7x7 box at x5..11 (c24..30), z12..18, y37..42, set toward the back; rail posts on top
function rearHead() {
  const Z0 = 12, Z1 = 18;
  for (let y = 37; y <= 42; y++) for (let x = 5; x <= 11; x++) for (let z = Z0; z <= Z1; z++) put(x, y, z, y === 42 ? P : "deepslate_bricks");
  for (let y = 38; y <= 41; y++) { put(8, y, Z0, AIR); put(8, y, Z0 + 1, "oak_planks"); }          // front slit (recessed)
  for (let y = 38; y <= 41; y++) { put(5, y, 15, AIR); put(6, y, 15, "oak_planks"); put(11, y, 15, AIR); put(10, y, 15, "oak_planks"); }  // side slits
  for (const x of [5, 7, 9, 11]) { put(x, 43, Z0, "oak_planks"); put(x, 43, Z1, "oak_planks"); }
  for (const z of [14, 16]) { put(5, 43, z, "oak_planks"); put(11, 43, z, "oak_planks"); }
}

// rear steps: B (z20..22) and C (z23..24) drop the roofline; cornice courses, coping parapets
function rearSteps() {
  for (const [z0, z1, t] of [[20, 22, 33], [23, 24, 30]]) {
    for (let z = z0; z <= z1; z++) { put(1, t, z, P); put(1, t + 1, z, TILES); put(33, t, z, P); put(33, t + 1, z, TILES); }
    for (let z = z0; z <= z1; z++) { put(2, t + 2, z, P); put(32, t + 2, z, P); }      // coping on the side edges
  }
  for (let x = 2; x <= 32; x++) { put(x, 32, 24, P); put(x, 30, 24, P); }               // rear coping + rear cornice course
  for (let x = 3; x <= 31; x++) put(x, 35, 22, P);                                       // low coping where B meets the C riser
}

// ---- WEST (-x) wall: shaft, downpipe, oak piers, balconies, small windows -------------------------------------------
function sides() { west(); east(); }
function west() {
  for (let z = 6; z <= 24; z++) fillBox(0, 3, z, 1, topOf(z) + 1, z, AIR);              // wall plane becomes x=2; piers x=1, balconies x=0..1
  for (let z = 6; z <= 24; z++) { const t = topOf(z); put(1, t, z, P); put(1, t + 1, z, TILES); }   // cornice +1, eave course
  // glass shaft, 4 deep (z6..9): oak frames +2, glass +1, quartz landings
  for (let y = 3; y <= 36; y++) for (const z of [6, 9]) { put(1, y, z, ...LOG); if (y <= 35) put(0, y, z, ...LOG); }
  for (let y = 3; y <= 35; y++) for (const z of [7, 8]) { put(2, y, z, GREY); sidePane(1, y, z); }
  for (const y of [5, 13, 21, 27, 33]) for (const z of [7, 8]) put(1, y, z, Q);
  for (let z = 7; z <= 8; z++) put(1, 36, z, Q);
  for (let z = 6; z <= 9; z++) put(1, 37, z, P);
  // dark downpipe seam between shaft and first pier
  for (let y = 3; y <= 35; y++) put(1, y, 10, "black_concrete");
  // oak piers (+1) with polished caps, string courses
  const PZ = [11, 16, 21];
  for (const z of PZ) { for (let y = 3; y <= 31; y++) put(1, y, z, ...LOG); put(1, 32, z, P); }
  for (let z = 11; z <= 24; z++) if (!PZ.includes(z)) for (const y of [13, 21, 32]) if (!(z >= 17 && z <= 20 && y !== 32)) put(1, y, z, P);
  // small windows 2x2 at z13..14: recessed (glass at x=3), oak sill, lintel
  for (const y0 of [10, 18, 25]) {
    for (const z of [13, 14]) { for (let y = y0; y <= y0 + 1; y++) { put(2, y, z, AIR); sidePane(3, y, z, 4); } put(1, y0 - 1, z, "oak_planks"); }
    for (let z = 12; z <= 15; z++) put(2, y0 + 2, z, P);
  }
  // balconies: oak decks x0..1 at storey lines, spruce double doors with transom
  for (const yd of [13, 21, 28]) {
    for (let z = 17; z <= 20; z++) { put(1, yd, z, "oak_planks"); put(0, yd, z, "oak_planks"); }
    for (const [z, hinge] of [[18, "left"], [19, "right"]]) {
      put(2, yd + 1, z, AIR); put(2, yd + 2, z, AIR); put(2, yd + 3, z, AIR);
      put(3, yd + 1, z, ...B.door("spruce", "west", "lower", hinge)); put(3, yd + 2, z, ...B.door("spruce", "west", "upper", hinge));
      sidePane(3, yd + 3, z);
    }
    for (let z = 17; z <= 20; z++) put(2, yd + 4, z, P);
    for (const z of [17, 20]) { put(2, yd + 1, z, "oak_planks"); }
  }
  // small door near the rear
  for (let y = 3; y <= 5; y++) put(2, y, 23, AIR);
  put(3, 3, 23, ...B.door("spruce", "west", "lower", "left")); put(3, 4, 23, ...B.door("spruce", "west", "upper", "left")); put(3, 5, 23, "chiseled_deepslate");
  put(2, 6, 23, P);
}

// ---- EAST (+x) wall: plain deepslate, oak pier rhythm, sparse windows --------------------------------------------
function east() {
  // wall plane x=32, piers x=33 (inside the front's x=33 silhouette so the front elevation is untouched)
  for (let z = 6; z <= 24; z++) fillBox(33, 9, z, 33, topOf(z) + 1, z, AIR);          // x=33 stays as a +1 base course up to y8 (behind the front trees)
  for (let z = 6; z <= 24; z++) { const t = topOf(z); put(33, t, z, P); put(33, t + 1, z, TILES); }
  const PZ = [11, 16, 21];
  for (const z of PZ) { for (let y = 9; y <= 31; y++) put(33, y, z, ...LOG); put(33, 32, z, P); }
  for (let z = 9; z <= 24; z++) if (!PZ.includes(z)) for (const y of [13, 32]) put(33, y, z, P);
  const bay = (zs, rows) => { for (const [y0, y1] of rows) {
    for (const z of zs) { for (let y = y0; y <= y1; y++) { put(32, y, z, AIR); sidePane(31, y, z, 30); } put(33, y0 - 1, z, "oak_planks"); }
    for (let z = zs[0] - 1; z <= zs[1] + 1; z++) put(32, y1 + 1, z, P);
  } };
  bay([13, 14], [[8, 10], [17, 19], [24, 26]]);
  bay([18, 19], [[17, 19], [24, 26]]);
}

// ---- BACK (z=24): piers flush, panels recessed one, windows, small door -----------------------------------------
function back() {
  const PX = [2, 10, 18, 26, 33];
  for (let x = 3; x <= 32; x++) if (!PX.includes(x)) fillBox(x, 3, 24, x, 29, 24, AIR);
  for (const x of PX) for (let y = 3; y <= 29; y++) put(x, y, 24, ...LOG);
  const win = (x0, y0, y1) => { for (let x = x0; x < x0 + 3; x++) { for (let y = y0; y <= y1; y++) { put(x, y, 23, AIR); put(x, y, 22, "glass_pane", { east: true, west: true, north: false, south: false }); put(x, y, 21, GREY); } put(x, y0 - 1, 24, "oak_planks"); put(x, y1 + 1, 23, P); } };
  for (const x0 of [5, 13, 21, 28]) { win(x0, 16, 19); win(x0, 23, 26); }
  for (const x0 of [5, 13, 28]) win(x0, 6, 8);
  put(23, 3, 23, ...B.door("spruce", "south", "lower", "left")); put(23, 4, 23, ...B.door("spruce", "south", "upper", "left")); put(23, 5, 23, "chiseled_deepslate");
  for (const x of [22, 24]) put(x, 5, 23, P);
}

// ---- finish: weather the side faces (mixed brick, mossy base) -------------------------------------------------------
function finish() {
  for (const c of [...g.cells.values()]) {
    const [x, y, z] = c.pos;
    if (z < 8 && !(c.block === "minecraft:stone_bricks" && z >= 6)) continue;
    if (c.block === "minecraft:stone_bricks" && z >= 6) { put(x, y, z, baseBlock(x + z * 13, y)); continue; }
    if (c.block !== "minecraft:deepslate_bricks" || y > 36) continue;
    const exposed = [[-1, 0, 0], [1, 0, 0], [0, 0, 1]].some(([dx, dy, dz]) => !g.inBounds(x + dx, y, z + dz) || g.isAir(x + dx, y, z + dz));
    if (exposed) put(x, y, z, wallBlock(x * 5 + z, y));
  }
}

body();
front();
glaze();
roof();
sides();
back();
finish();
g.save(OUT);
console.log(JSON.stringify({ saved: OUT }));
