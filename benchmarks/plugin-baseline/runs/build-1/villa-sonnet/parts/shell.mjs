// P1 MASSING AND SHELL (plan.md PARTS 1): foundation y0, floors y1 per ROOMS, every wall line y1..6 with the OPENINGS table
// left air, fauces pilasters, the spruce ceiling at y6 with its three holes (compluvium, garden court, kitchen flue).
// Writes only y0..y6 inside the house footprint; nothing at y>=7 (the roofs are P2's).
import {
  HOUSE, ROOMS, OPENINGS, COMPLUVIUM, POOL, GARDEN_COURT, FLUE, COLONNADE_COLUMNS,
  STONE_BRICKS, CHISELED_STONE_BRICKS, DIRT, BLUE_TERRACOTTA, SMOOTH_SANDSTONE, RED_TERRACOTTA, BLACK_TERRACOTTA,
  WHITE_TERRACOTTA, YELLOW_TERRACOTTA, BLUE_GLAZED_TERRACOTTA, ORANGE_GLAZED_TERRACOTTA, POLISHED_ANDESITE,
  SMOOTH_STONE, POLISHED_DIORITE, QUARTZ_BLOCK, POLISHED_BLACKSTONE, CUT_SANDSTONE, TERRACOTTA, SPRUCE_PLANKS, SMOOTH_QUARTZ,
  wallLine, pilaster, mosaic, PILASTERS,
} from "../vocab.mjs";

const room = (name) => ROOMS.find((r) => r.name.startsWith(name)).box;
const inRect = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
const inPool = (x, z) => inRect(POOL, x, z);
const inCourt = (x, z) => inRect(GARDEN_COURT, x, z);
const inHole = (x, z) => inRect(COMPLUVIUM, x, z) || inCourt(x, z) || (x === FLUE[0] && z === FLUE[2]);
const colonnadeCols = new Set(COLONNADE_COLUMNS.map(([x, z]) => `${x},${z}`));

/** Foundation y0: stone_bricks; dirt under the garden court; blue_terracotta under the pool. */
function foundation(g) {
  for (let x = HOUSE.x0; x <= HOUSE.x1; x++) for (let z = HOUSE.z0; z <= HOUSE.z1; z++) {
    const block = inCourt(x, z) ? DIRT : inPool(x, z) ? BLUE_TERRACOTTA : STONE_BRICKS;
    g.set(x, 0, z, block);
  }
}

/** Floor layer y1 per ROOMS. Garden court and pool cells, and the column stylobates (P5), are left unset. */
function floors(g) {
  // fauces: smooth_stone with a black_terracotta centre strip
  for (let x = 16; x <= 19; x++) for (let z = 2; z <= 9; z++) g.set(x, 1, z, SMOOTH_STONE);
  mosaic(g, room("Fauces"), { kind: "emblem", at: [17, 2, 18, 9], block: BLACK_TERRACOTTA });
  for (const n of ["Taberna W1", "Taberna W2", "Taberna E3", "Taberna E4"]) {
    const [x0, , z0, x1, , z1] = room(n);
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) g.set(x, 1, z, POLISHED_ANDESITE);
  }
  // atrium: black/white checker, red border ring just inside the walls, yellow ring around the coping; pool cells unset
  const [ax0, , az0, ax1, , az1] = room("Atrium");
  for (let x = ax0; x <= ax1; x++) for (let z = az0; z <= az1; z++) {
    if (inPool(x, z)) continue;
    const edge = x === ax0 || x === ax1 || z === az0 || z === az1;
    const ring = (x === 13 || x === 22) && z >= 12 && z <= 19 || (z === 12 || z === 19) && x >= 13 && x <= 22;
    let block = (x + z) % 2 === 0 ? QUARTZ_BLOCK : POLISHED_BLACKSTONE;
    if (edge) block = RED_TERRACOTTA;
    if (ring) block = YELLOW_TERRACOTTA;
    g.set(x, 1, z, block);
  }
  // cubicula: smooth sandstone with a red border
  const cubicula = ["Cubiculum C1", "Cubiculum C2", "Cubiculum C3", "Cubiculum C4", "Cubiculum C5", "Cubiculum C7"];
  for (const n of cubicula) mosaic(g, room(n), { kind: "border", field: SMOOTH_SANDSTONE, b1: RED_TERRACOTTA, b2: SMOOTH_SANDSTONE });
  // tablinum: white field, red then black border, blue glazed emblem
  mosaic(g, room("Tablinum"), [
    { kind: "border", field: WHITE_TERRACOTTA, b1: RED_TERRACOTTA, b2: BLACK_TERRACOTTA },
    { kind: "emblem", at: [17, 26, 18, 27], block: BLUE_GLAZED_TERRACOTTA },
  ]);
  // culina: stone bricks with a chiselled hash
  const [kx0, , kz0, kx1, , kz1] = room("Culina");
  for (let x = kx0; x <= kx1; x++) for (let z = kz0; z <= kz1; z++) {
    g.set(x, 1, z, (x * 3 + z * 5) % 4 === 0 ? CHISELED_STONE_BRICKS : STONE_BRICKS);
  }
  // triclinium: black border ring, red inner ring, orange glazed emblem
  mosaic(g, room("Triclinium"), [
    { kind: "border", field: WHITE_TERRACOTTA, b1: BLACK_TERRACOTTA, b2: RED_TERRACOTTA },
    { kind: "emblem", at: [29, 25, 31, 27], block: ORANGE_GLAZED_TERRACOTTA },
  ]);
  // lararium: polished diorite; storeroom: stone bricks
  const [lx0, , lz0, lx1, , lz1] = room("Lararium");
  for (let x = lx0; x <= lx1; x++) for (let z = lz0; z <= lz1; z++) g.set(x, 1, z, POLISHED_DIORITE);
  const [sx0, , sz0, sx1, , sz1] = room("Storeroom");
  for (let x = sx0; x <= sx1; x++) for (let z = sz0; z <= sz1; z++) g.set(x, 1, z, STONE_BRICKS);
  // peristyle walkway: cut sandstone, a terracotta line on the column rectangle; court and column cells left for P5
  const [px0, , pz0, px1, , pz1] = room("Peristyle");
  for (let x = px0; x <= px1; x++) for (let z = pz0; z <= pz1; z++) {
    if (inCourt(x, z) || colonnadeCols.has(`${x},${z}`)) continue;
    const ring = (x === 10 || x === 25) && z >= 34 && z <= 42 || (z === 34 || z === 42) && x >= 10 && x <= 25;
    g.set(x, 1, z, ring ? TERRACOTTA : CUT_SANDSTONE);
  }
}

/** Every wall line y1..6 with its OPENINGS cells left air (plinth, dado, plaster and cornice on the rest). */
function walls(g) {
  // street front and rear
  wallLine(g, 0, 2, 35, 2, { open: [OPENINGS.fauceStreet, ...OPENINGS.shopStreet] });
  wallLine(g, 0, 45, 35, 45, { open: [OPENINGS.rearDoor, [3, 3, 45, 3, 4, 45], [32, 3, 45, 32, 4, 45]] });
  // outer side walls with their windows
  wallLine(g, 0, 2, 0, 45, { open: OPENINGS.windows.filter((b) => b[0] === 0) });
  wallLine(g, 35, 2, 35, 45, { open: OPENINGS.windows.filter((b) => b[0] === 35) });
  // long inner walls
  wallLine(g, 0, 9, 35, 9, { open: [OPENINGS.fauceAtrium] });
  wallLine(g, 0, 15, 9, 15);
  wallLine(g, 26, 15, 35, 15);
  wallLine(g, 0, 22, 35, 22, { open: [OPENINGS.atriumToTablinum] });
  wallLine(g, 0, 31, 35, 31, { open: [OPENINGS.tablinumToPeristyle, OPENINGS.kitchenToColonnade, OPENINGS.triclinumToColonnade] });
  // short inner walls, with the doorways of the OPENINGS table left air at y2..3
  wallLine(g, 8, 3, 8, 8, { open: [[8, 2, 6, 8, 3, 6]] });
  wallLine(g, 15, 2, 15, 9, { open: [[15, 2, 6, 15, 3, 6]] });
  wallLine(g, 20, 2, 20, 9, { open: [[20, 2, 6, 20, 3, 6]] });
  wallLine(g, 27, 3, 27, 8, { open: [[27, 2, 6, 27, 3, 6]] });
  wallLine(g, 9, 10, 9, 21, { open: [[9, 2, 12, 9, 3, 12], [9, 2, 18, 9, 3, 18]] });
  wallLine(g, 26, 10, 26, 21, { open: [[26, 2, 12, 26, 3, 12], [26, 2, 18, 26, 3, 18]] });
  wallLine(g, 10, 23, 10, 30, { open: [[10, 2, 27, 10, 3, 27]] });
  wallLine(g, 25, 23, 25, 30, { open: [[25, 2, 27, 25, 3, 27]] });
  wallLine(g, 6, 32, 6, 45, { open: [[6, 2, 35, 6, 3, 35], [6, 2, 41, 6, 3, 41]] });
  wallLine(g, 29, 32, 29, 45, { open: [[29, 2, 35, 29, 3, 35], [29, 2, 41, 29, 3, 41]] });
  // the solid gaps between the south rooms (C5/C6 and C7/C8)
  wallLine(g, 1, 38, 5, 38);
  wallLine(g, 30, 38, 34, 38);
  // fauces pilasters, and the smooth_quartz lintel beam over the entrance (E2)
  pilaster(g, 15, 2);
  pilaster(g, 20, 2);
  for (let x = 16; x <= 19; x++) g.set(x, 6, 2, SMOOTH_QUARTZ);
  // the jamb pilasters of the atrium, tablinum and colonnade openings (E10): P1 owns these wall cells, so it sets them
  // here; a later part could only write into air and the plaster would stay (the framing would silently never build)
  for (const [x, z] of [...PILASTERS.atrium, ...PILASTERS.tablinumNorth, ...PILASTERS.tablinumSouth]) pilaster(g, x, z);
}

/** Spruce ceiling at y6 over every room and walkway (air cells only), with the three holes left open. */
function ceiling(g) {
  for (let x = HOUSE.x0; x <= HOUSE.x1; x++) for (let z = HOUSE.z0; z <= HOUSE.z1; z++) {
    if (inHole(x, z)) continue;
    if (g.blockAt(x, 6, z) === "minecraft:air") g.set(x, 6, z, SPRUCE_PLANKS);
  }
}

export function build(g) {
  foundation(g);
  floors(g);
  walls(g);
  ceiling(g);
}
