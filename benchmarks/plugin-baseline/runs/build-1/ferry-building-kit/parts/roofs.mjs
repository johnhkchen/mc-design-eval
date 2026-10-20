// Part 4: roofs and cornices. The nave roof (eaves y27, slope and glazed monitor), its trusses, the land-front and
// bay-side cornices and parapets, the pavilion and corner-block cornices and balustrades. The bay-hall gable comes from
// v2: the bay-hall roofs are hand-built here with the nave roof (roof.json retired to roof.v1.json).
import { cornice, balustrade, skylight, truss } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const isAir = (g, x, y, z) => /air$/.test(g.blockAt(x, y, z));

export function build(g) {
  // a wall course that only fills air, so the shell and earlier parts keep their blocks
  const F = (x0, y0, z0, x1, y1, z1, block) => {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++)
      if (isAir(g, x, y, z)) g.set(x, y, z, block);
  };

  // ---- v2: every pitched roof as one height field, so the roofs meet in valleys instead of refusing each other.
  // A roof cell L cells in from its eave sits at y 27 + floor(L/2): a bottom stair (back to the rise) on even L, a
  // top slab on odd L, a full ridge block where both slopes meet. Where two roofs cover a cell the higher one wins.
  // Cells are written one by one into air (naveRoofProfile refuses its whole box over the tower keep).
  const field = new Map();
  const cover = (x, z, L, up, mat) => {
    const k = `${x},${z}`, cur = field.get(k);
    if (!cur || L > cur.L) field.set(k, { L, up, mat });
  };
  const NAVE = { stair: "deepslate_tile", slab: "deepslate_tile_slab", ridge: "deepslate_tiles" };
  const BAY = { stair: "stone_brick", slab: "stone_brick_slab", ridge: "stone_bricks" };
  // gable with its ridge along z at the middle of x0..x1, over z0..z1
  const gableZ = (x0, x1, z0, z1) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const a = x - x0, b = x1 - x;
      cover(x, z, Math.min(a, b), a === b ? null : a < b ? "east" : "west", BAY);
    }
  };
  // nave: slope z15..33 rising south, z45..63 rising north, x 0..99 (x100 is the east gable wall)
  for (let x = 0; x <= 99; x++) for (let i = 0; i <= 18; i++) {
    cover(x, 15 + i, i, "south", NAVE); cover(x, 63 - i, i, "north", NAVE);
  }
  gableZ(13, 33, 58, 79);                                    // plot 0 central bay hall, verge at z79
  for (let x = 64; x <= 101; x++) for (let z = 64; z <= 78; z++) {   // plot 2 bay hall, ridge along x at z71
    const a = z - 64, b = 78 - z;
    cover(x, z, Math.min(a, b), a === b ? null : a < b ? "south" : "north", BAY);
  }
  gableZ(67, 79, 71, 79); gableZ(85, 97, 71, 79);            // plot 2 cross-gables, from the hall ridge to the verge
  // walls closing the bay roofs' open ends: plot 0 hall's north end (z58) over the nave roof, plot 2 hall's west end (x64)
  const roofY = (L) => 27 + Math.floor(L / 2);
  for (let x = 14; x <= 32; x++) { const L = Math.min(x - 13, 33 - x); F(x, 28, 58, x, roofY(L) - (L % 2 ? 0 : 1), 58, "polished_andesite"); }
  for (let z = 65; z <= 77; z++) { const L = Math.min(z - 64, 78 - z); F(64, 27, z, 64, roofY(L) - (L % 2 ? 0 : 1), z, "polished_andesite"); }
  for (const [k, { L, up, mat }] of field) {
    const [x, z] = k.split(",").map(Number), y = roofY(L);
    if (!isAir(g, x, y, z)) continue;
    if (!up) { if (z < 79) g.set(x, y, z, mat.ridge); }      // no ridge block on the verge row: it would stick out alone
    else if (L % 2) g.set(x, y, z, mat.slab, { type: "top", waterlogged: "false" });
    else g.set(x, y, z, ...B.stairs(mat.stair, up, "bottom"));
  }
  skylight(g, 0, 100);

  // ---- trusses, every 8 x on x = 4 mod 8, between the walls (the tower keep and the walls refuse their own cells)
  for (let x = 4; x <= 96; x += 8) truss(g, x, { y: 27, z0: 14, z1: 64 });

  // ---- land front, wings: calcite course above the deck, cornice at z2, parapet with balusters at z3
  for (const [a, b] of [[0, 8], [38, 47], [48, 63], [64, 80]]) {
    F(a, 26, 3, b, 27, 4, "calcite");                   // course over the deck (y26 deck stays smooth stone)
    cornice(g, { x0: a, x1: b, y: 26, z: 2, face: "north" });
    balustrade(g, { x0: a, x1: b, y: 28, z: 3 });
  }

  // ---- pavilion (x 9..37): cornice at z0 y29..30, balustrade y31..32
  cornice(g, { x0: 8, x1: 38, y: 29, z: 0, face: "north" });
  balustrade(g, { x0: 9, x1: 37, y: 31, z: 0 });

  // ---- corner block (x 81..100): cornice at z1 y31..32 on the land front
  cornice(g, { x0: 81, x1: 100, y: 31, z: 1, face: "north" });

  // ---- corner block parapet (y33..34, calcite, north face z1)
  F(81, 33, 1, 100, 34, 1, "calcite");

  // ---- bay side: cornice at z79 y26..27 over the grey bars (the bay gable at x13..33 is the roof's), parapet y28
  // the shell carves the cross-gable lunette heads at y27 (x x0+5..x0+7 for x0 67 and 85): they stay open for the glazing
  const lunetteHead = (x) => [67, 85].some((x0) => x >= x0 + 5 && x <= x0 + 7);
  for (const [a, b] of [[0, 12], [34, 47], [48, 63], [64, 100]]) {
    for (let x = a; x <= b; x++) if (!lunetteHead(x) && isAir(g, x, 27, 78)) g.set(x, 27, 78, "polished_andesite");   // course under the parapet (y26 deck is smooth stone)
    cornice(g, { x0: a, x1: b, y: 26, z: 79, face: "south" });
    for (let x = a; x <= b; x++) {                    // a straight wall run: joins its neighbours east and west
      const state = { up: "false", north: "none", south: "none", east: x < b ? "low" : "none", west: x > a ? "low" : "none", waterlogged: "false" };
      if (isAir(g, x, 28, 78)) g.set(x, 28, 78, "andesite_wall", state);
    }
  }
}
