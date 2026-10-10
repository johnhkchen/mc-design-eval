// The Inspectorate — pass 1 (FORM, front only). Generator for round-1.nbt.
// Front faces NORTH (-z). Front-tracing column c (as drawn, left to right) is world x = 25 - c (MIRROR TRAP).
// frontFace() holds everything on the street face; bodyAndSides() is the stub volume the next pass replaces.
import { Grid, B, arch, stepGable, hipRoof, fins, cornice } from "../../../../../minecraft-design/tools/src/build.mjs";
import { fullBlockOf } from "../../../../../minecraft-design/tools/src/shapes-massing.mjs";

const OUT = new URL("./round-1.nbt", import.meta.url).pathname;
const g = new Grid([26, 19, 24]);           // 26 wide x 19 tall x 24 deep
const WALL = 2;                              // z of the main wall plane (relief goes out to z=0, reveals in to z=4)

// ---- palette (spec MATERIAL MAP) -------------------------------------------------------------------------------
const M = {
  field: "deepslate_bricks", crack: "cracked_deepslate_bricks", cobble: "cobbled_deepslate",
  mossy: "mossy_stone_bricks", moss: "moss_block",
  surround: "polished_deepslate", tiles: "deepslate_tiles",
  stone: "stone_bricks",                                 // cornice, pediment, plaque, chimney
  oak: "stripped_oak_log", oakPlank: "oak_planks", lobby: "birch_planks",
  pier: "smooth_quartz", fascia: "quartz_bricks", sign: "quartz_block",
  glass: "glass_pane", mullion: "light_blue_stained_glass_pane", dark: "black_stained_glass_pane",
  door: "spruce_door", doorPlank: "spruce_planks", shutter: "spruce_planks", gold: "gold_block", cap: "cyan_concrete",
};

// ---- helpers ---------------------------------------------------------------------------------------------------
const X = (c) => 25 - c;                                          // tracing column -> world x
const zAt = (d) => WALL - d;                                      // depth (+ proud, - recessed) -> world z
const hash = (x, y, z) => { let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const air = (x, y, z) => g.unset(x, y, z);
/** A pane in a wall running along x: it must be told to connect east/west or it renders as a bare post. */
const PANE = (b) => [b, { east: true, west: true, north: false, south: false, waterlogged: false }];
/** Fill tracing cells c0..c1 x y0..y1 from the wall plane out to depth d (d>0 proud), with a block. */
function slab(c0, c1, y0, y1, d, block, state) {
  for (let c = c0; c <= c1; c++) for (let y = y0; y <= y1; y++) for (let z = zAt(Math.max(d, 0)); z <= WALL; z++) g.set(X(c), y, z, block, state);
}
const cell = (c, y, d, block, state) => g.set(X(c), y, zAt(d), block, state);
/** Brushes write stairs/slabs; this pass is FULL BLOCKS only, so route every brush write through a full-block grid. */
const fullBlocks = (target) => { const p = Object.create(target); p.set = (x, y, z, b, s) => (/_(stairs|slab)$/.test(b) ? target.set(x, y, z, fullBlockOf(b)) : target.set(x, y, z, b, s)); return p; };
const fg = fullBlocks(g);
/** Weathered deepslate: mostly bricks, some cracked, a few cobbled (the spec's patching). */
const weathered = (x, y, z) => { const h = hash(x, y, z); return h < 0.12 ? M.crack : h < 0.2 ? M.cobble : M.field; };

// ---- the stub volume (next pass redesigns sides, back and roof) --------------------------------------------------
function bodyAndSides() {
  // plinth: 2 blocks, full 26 wide, weathered with moss at the ends
  for (let x = 0; x <= 25; x++) for (let z = WALL; z <= 23; z++) {
    g.set(x, 0, z, weathered(x, 0, z));
    if (x >= 1 && x <= 24) g.set(x, 1, z, weathered(x, 1, z));
  }
  // walls x=2..23, z=2..22, y=2..15 (solid; hollowed below)
  for (let x = 2; x <= 23; x++) for (let z = WALL; z <= 22; z++) for (let y = 2; y <= 15; y++) g.set(x, y, z, weathered(x, y, z));
  // stub interior: front wall stays 3 thick (z=2..4) so the reveals have something to recess into
  for (let x = 3; x <= 22; x++) for (let z = 5; z <= 21; z++) {
    for (let y = 3; y <= 8; y++) air(x, y, z);
    for (let y = 10; y <= 14; y++) air(x, y, z);
    g.set(x, 2, z, M.oakPlank);
    g.set(x, 9, z, M.oakPlank);
  }
  // warm lobby backdrop two blocks behind the shopfront glass (the concept shows a lit oak interior through it)
  for (let x = 3; x <= 22; x++) for (let y = 3; y <= 8; y++) g.set(x, y, 7, M.lobby);
  // simple flat roof deck over the whole footprint (stone) — the roof pass replaces it
  for (let x = 2; x <= 23; x++) for (let z = WALL; z <= 22; z++) g.set(x, 15, z, M.stone);
}

// ---- THE FRONT ------------------------------------------------------------------------------------------------
function frontFace() {
  groundFloor();
  upperFloor();
  roofAndStacks();                          // roof first: the pediment and cornice cut through it
  cornicePediment();
}

function groundFloor() {
  // quartz front wall behind everything on the ground floor
  for (let x = 2; x <= 23; x++) for (let y = 2; y <= 8; y++) for (let z = WALL; z <= 4; z++) g.set(x, y, z, M.pier);
  // plinth shoulders at the corners (y=2 is deepslate at the outer bays)
  for (const c of [2, 3, 22, 23]) for (let z = WALL; z <= 4; z++) g.set(X(c), 2, z, weathered(X(c), 2, z));
  // moss on the plinth corners
  for (const c of [1, 24]) { g.set(X(c), 1, WALL, M.moss); }
  for (const c of [2, 23]) g.set(X(c), 1, WALL, M.mossy);

  // piers proud +1: 2 wide, y=3..6
  for (const [c0, c1] of [[2, 3], [8, 9], [16, 17], [22, 23]]) slab(c0, c1, 3, 6, 1, M.pier);
  // arcade lintel band proud +1 over the piers (y=7, c3..c22) — left open where an arch crown rises into it
  const crown = new Set([5, 6, 11, 12, 13, 14, 19, 20]);
  for (let c = 3; c <= 22; c++) if (!crown.has(c)) slab(c, c, 7, 7, 1, M.fascia);
  // corner caps and the sign fascia y=8
  slab(2, 2, 8, 9, 1, M.surround); slab(23, 23, 8, 9, 1, M.surround);
  slab(3, 3, 8, 8, 1, M.fascia); slab(22, 22, 8, 8, 1, M.fascia);
  slab(3, 3, 9, 9, 1, M.surround); slab(22, 22, 9, 9, 1, M.surround);
  for (let c = 4; c <= 21; c++) slab(c, c, 8, 8, 0, M.fascia);
  // PERMIT OFFICE sign band: x=8..17 (cols c8..c17), y=8, proud +1, cyan end caps
  slab(8, 17, 8, 8, 1, M.sign); slab(8, 8, 8, 8, 1, M.cap); slab(17, 17, 8, 8, 1, M.cap);

  // three-bay arcade, one stepped arch each, carved through the wall front (z=2..3); glass sits behind at z=4
  const bays = [{ c0: 4, w: 4 }, { c0: 10, w: 6 }, { c0: 18, w: 4 }];
  for (const { c0, w } of bays) {
    const x0 = X(c0 + w - 1);                                    // arch `at` is the min-x corner
    arch(fg, { at: [x0, 3, WALL], width: w, height: w === 6 ? 4 : 5, depth: 2, axis: "x", profile: "round", block: M.pier, edge: "none", frame: M.fascia });
    // glazing behind the arch line (-2): every open cell of the arch at z=4
    for (let x = x0; x < x0 + w; x++) for (let y = 3; y <= 7; y++) if (g.isAir(x, y, WALL) && g.isAir(x, y, WALL + 1)) g.set(x, y, 4, ...PANE(M.glass));
  }
  // mullions: light-blue frame lines (outer edges + a transom) round clear glass, as in the concept's shopfront
  for (const [c0, c1] of [[4, 7], [18, 21]]) {
    for (let y = 3; y <= 7; y++) for (const c of [c0, c1]) if (g.blockAt(X(c), y, 4).includes("glass_pane")) g.set(X(c), y, 4, ...PANE(M.mullion));
    for (let c = c0; c <= c1; c++) if (g.blockAt(X(c), 5, 4).includes("glass_pane")) g.set(X(c), 5, 4, ...PANE(M.mullion));
  }
  // door: sidelights c10/c15 (flush glass in the arch), spruce frame c11/c14 (-1), double door c12..c13 (-2), transom y=6
  for (let y = 3; y <= 5; y++) { air(X(10), y, 4); air(X(15), y, 4); g.set(X(10), y, 3, ...PANE(M.glass)); g.set(X(15), y, 3, ...PANE(M.glass)); }
  for (let y = 3; y <= 4; y++) for (const c of [11, 14]) { for (let z = 2; z <= 4; z++) air(X(c), y, z); g.set(X(c), y, 3, M.doorPlank); }
  for (const c of [11, 14]) { for (let z = 2; z <= 4; z++) air(X(c), 5, z); g.set(X(c), 5, 3, ...PANE(M.glass)); }
  for (const c of [12, 13]) { for (let y = 3; y <= 5; y++) for (let z = 2; z <= 4; z++) air(X(c), y, z); }
  // spruce double door at z=4 (-2): hinges outward so the leaves read as a pair
  g.set(X(12), 3, 4, ...B.door("spruce", "north", "lower", "left")); g.set(X(12), 4, 4, ...B.door("spruce", "north", "upper", "left"));
  g.set(X(13), 3, 4, ...B.door("spruce", "north", "lower", "right")); g.set(X(13), 4, 4, ...B.door("spruce", "north", "upper", "right"));
  for (const c of [12, 13]) g.set(X(c), 5, 4, M.doorPlank);
  for (let c = 11; c <= 14; c++) { for (let z = 2; z <= 4; z++) air(X(c), 6, z); g.set(X(c), 6, 3, ...PANE(M.glass)); }
  // steps: +2, +1, flush, rising to the door sill (y=2): full-block quartz treads c10..c15
  slab(10, 15, 0, 0, 2, M.pier); slab(10, 15, 1, 1, 1, M.pier); slab(10, 15, 0, 1, 1, M.pier); slab(10, 15, 2, 2, 0, M.pier);
  // cheek walls: the arcade piers already flank the steps at c9/c16
}

function upperFloor() {
  const win = [5, 10, 14, 19];                                  // left column of each 2-wide window (c)
  // timber pilasters (fins, +1) at c9 and c16, y=10..13; corner posts at c2 and c23, y=10..14
  const pilaster = (xs, y1) => xs.forEach((x) => fins(fg, { face: "north", plane: WALL, from: x, to: x, every: 1, y0: 10, y1, depth: 1, block: B.log("stripped_oak", "y") }));
  pilaster([X(9), X(16)], 13);
  pilaster([X(2), X(23)], 14);
  // string course and sills; polished-deepslate lintels one cell wider than each window
  for (let c = 2; c <= 23; c++) if ([2, 3, 22, 23, 9, 16].includes(c)) slab(c, c, 9, 9, 1, M.surround);
  win.forEach((c0, i) => {
    const outer = i === 0 || i === 3;
    const a = outer ? c0 - 1 : c0, b = outer ? c0 + 2 : c0 + 1;
    for (let c = a; c <= b; c++) { slab(c, c, 9, 9, 0, M.surround); slab(c, c, 13, 13, 0, M.surround); }
    for (const c of [a, b]) slab(c, c, 10, 12, 0, M.surround);   // dressed jambs, so the opening reads against the field
    // reveals: lower two rows -2, top row -1 (per the depth map), glass at the recess plane
    for (let c = c0; c <= c0 + 1; c++) for (let y = 10; y <= 12; y++) {
      const d = y === 12 ? 1 : 2;
      for (let z = WALL; z <= 4; z++) air(X(c), y, z);
      if (i === 3) g.set(X(c), y, WALL + d, M.shutter);          // closed shutters on the right window
      else g.set(X(c), y, WALL + d, ...PANE(M.dark));
      if (i !== 3) g.set(X(c), y, 5, M.tiles);                    // unlit room behind the glass reads dark
    }
  });
  // frieze y=14: oak corbel blocks on the left and right, plain field between
  for (const c of [2, 4, 6, 19, 21, 23]) cell(c, 14, 0, M.oakPlank);
  // INSPECTORATE plaque: c10..c15, y=13..14, proud +1; carved end blocks c9/c16 at y=14
  slab(10, 15, 13, 14, 1, M.stone);
  slab(9, 9, 14, 14, 1, M.stone); slab(16, 16, 14, 14, 1, M.stone);
}

function cornicePediment() {
  // stone cornice all round (1 out), the roofline of the upper storey
  cornice(fg, { from: [2, 15, WALL], to: [23, 22], material: "stone_brick", profile: "simple" });
  // pedimented centre bay: stepped triangular gable c8..c17, y=15..18 (10 -> 8 -> 6 -> 4), flanked by timber pinnacles c9/c16
  stepGable(fg, { face: "north", plane: WALL, from: X(17), to: X(8), y: 15, rise: 1, run: 1, crown: 4, block: M.stone });
  for (const c of [9, 16]) { cell(c, 16, 1, M.oak, { axis: "y" }); cell(c, 17, 1, M.oak, { axis: "y" }); cell(c, 18, 1, M.stone); }
  // tympanum recessed one block (-1) inside the raking edge so the stone frame reads; gold cross on it
  const tympanum = [[16, 11, 14], [17, 12, 13]];
  for (const [y, c0, c1] of tympanum) for (let c = c0; c <= c1; c++) { air(X(c), y, WALL); cell(c, y, -1, M.stone); }
  for (const c of [12, 13]) { cell(c, 16, -1, M.gold); cell(c, 17, -1, M.gold); }
}

function roofAndStacks() {
  // hipped slate roof: built on a tall scratch grid so the hip can rise, then copied up to y=17 (low truncated hip)
  const tmp = new Grid([26, 32, 24]);
  hipRoof(fullBlocks(tmp), { footprint: [[5, WALL, 20, 22]], y: 16, material: "deepslate_tile", overhang: 0 });
  for (const c of tmp) if (c.pos[1] <= 17) g.set(...c.pos, c.block, c.state);
  // fill the roof solid under the plateau so it reads as slate, not a hollow rind
  for (let x = 5; x <= 20; x++) for (let z = WALL; z <= 22; z++) g.set(x, 16, z, M.tiles);
  for (let x = 6; x <= 19; x++) for (let z = 3; z <= 21; z++) g.set(x, 17, z, M.tiles);
  // corner chimney stacks, front corners: 2x2 base y=16, single column y=17
  for (const c of [2, 23]) { for (const dx of [0, 1]) for (const z of [WALL, WALL + 1]) { const x = c === 2 ? 23 - dx : 2 + dx; g.set(x, 16, z, M.stone); } }
  g.set(23, 17, WALL, M.stone); g.set(2, 17, WALL, M.stone);
}

bodyAndSides();
frontFace();
g.save(OUT);
console.log(JSON.stringify({ saved: OUT, refused: g.refused?.length ?? 0, blocks: g.solids().length }));
