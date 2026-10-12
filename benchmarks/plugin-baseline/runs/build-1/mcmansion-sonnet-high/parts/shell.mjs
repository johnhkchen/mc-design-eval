// McMansion shell (P1): massing, foundation, floors, ceilings, every exterior wall and interior partition, quoins,
// sills, pilasters, the turret, the chimney. Every opening (doors, arches, bay openings, the foyer void, the firebox,
// the portico platform) is reserved or left unset so later parts can fill it. Coordinates follow plan.md.
import { DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  SMOOTH_QUARTZ, STONE_BRICKS, POLISHED_ANDESITE, DARK_OAK_PLANKS, SPRUCE_PLANKS as SPRUCE, OAK_PLANKS,
  LIGHT_GRAY_TERRACOTTA, WHITE_TERRACOTTA, GRAY_CONCRETE, SMOOTH_STONE, QUARTZ_PILLAR, QUARTZ_BRICKS,
  reserve, isReserved, wallCell, window, turret, chimneyStack,
} from "../vocab.mjs";

// ---- footprint (plan.md SITE) -------------------------------------------------------------------------------------
const inFootprint = (x, z) =>
  (x >= 0 && x <= 12 && z >= 6 && z <= 19) ||                                  // garage G
  (x >= 12 && x <= 33 && z >= 8 && z <= 23) ||                                 // centre C
  (x >= 33 && x <= 43 && z >= 12 && z <= 27) ||                                // east wing E
  (x >= 29 && x <= 33 && z >= 4 && z <= 8 && !((x === 29 || x === 33) && z === 4)); // turret T (chamfers out)

// Room boxes [x0, z0, x1, z1] with a floor material (plan.md ROOMS). Storey 1 = y1 layer, storey 2 = y5 layer.
const S1_ROOMS = [
  [20, 9, 25, 13, "foyer"], [20, 14, 25, 15, "foyer"], [13, 9, 18, 14, "office"], [27, 9, 32, 14, "dining"],
  [30, 5, 32, 7, "bay"], [20, 16, 32, 22, "kitchen"], [34, 13, 42, 26, "family"], [13, 16, 18, 22, "mudroom"],
  [1, 7, 11, 18, "garage"],
];
const S2_ROOMS = [
  [20, 14, 25, 22, "oak"], [13, 9, 18, 14, "oak"], [27, 9, 32, 14, "oak"], [30, 5, 32, 7, "oak"],
  [13, 16, 18, 17, "oak"], [27, 16, 32, 17, "oak"], [13, 19, 18, 22, "oak"], [27, 19, 32, 22, "bath"],
  [1, 7, 11, 18, "bonus"], [34, 13, 42, 21, "oak"], [34, 23, 37, 26, "oak"], [39, 23, 42, 26, "bath2"],
];
const inRoom = (rooms, x, z) => rooms.find(([x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1);
const checker = (x, z, a, b) => ((x + z) % 2 === 0 ? a : b);

function s1Floor(x, z) {
  const r = inRoom(S1_ROOMS, x, z);
  if (!r) return [SMOOTH_STONE, {}];
  const [x0, z0, x1, z1, kind] = r;
  if (kind === "foyer") return [checker(x, z, POLISHED_ANDESITE, SMOOTH_QUARTZ), {}];
  if (kind === "kitchen") return [checker(x, z, LIGHT_GRAY_TERRACOTTA, WHITE_TERRACOTTA), {}];
  if (kind === "dining") {
    const border = x === x0 || x === x1 || z === z0 || z === z1;
    return [border ? SPRUCE : DARK_OAK_PLANKS, {}];
  }
  if (kind === "garage") return [x === 4 || x === 8 ? GRAY_CONCRETE : SMOOTH_STONE, {}];
  const byKind = { office: DARK_OAK_PLANKS, bay: SPRUCE, family: SPRUCE, mudroom: STONE_BRICKS };
  return [byKind[kind], {}];
}

function s2Floor(x, z) {
  const r = inRoom(S2_ROOMS, x, z);
  if (!r) return [SMOOTH_QUARTZ, {}];                  // storey-1 ceilings read as a white belt
  const kind = r[4];
  if (kind === "bath") return [checker(x, z, WHITE_TERRACOTTA, LIGHT_GRAY_TERRACOTTA), {}];
  if (kind === "bath2") return [checker(x, z, QUARTZ_BRICKS, WHITE_TERRACOTTA), {}];
  if (kind === "bonus") return [SPRUCE, {}];
  return [OAK_PLANKS, {}];
}

// ---- wall lines -----------------------------------------------------------------------------------------------------
/** Cells on a straight line: along x at z (hline) or along z at x (vline), inclusive. */
const hline = (z, x0, x1) => { const out = []; for (let x = x0; x <= x1; x++) out.push([x, z]); return out; };
const vline = (x, z0, z1) => { const out = []; for (let z = z0; z <= z1; z++) out.push([x, z]); return out; };

/** Exterior wall cells, full height y1..9. */
function exteriorWall(g, cells, { north = false } = {}) {
  for (const [x, z] of cells) for (let y = 1; y <= 9; y++) wallCell(g, x, y, z, { north });
}

/** Interior partition cells: storey-1 partitions run y1..4 (+ top plate y9), storey-2 partitions y5..8 (+ y9). */
function partition(g, cells, storey) {
  const ys = storey === 1 ? [1, 2, 3, 4, 9] : [5, 6, 7, 8, 9];
  for (const [x, z] of cells) for (const y of ys) wallCell(g, x, y, z, { partition: true });
}

// ---- quoins that never write into an opening ----------------------------------------------------------------------
function quoinSafe(g, x, z, [frontDir, sideDir]) {
  for (const y of [2, 3, 4, 6, 7, 8]) {
    if (!isReserved(x, y, z)) g.set(x, y, z, SMOOTH_QUARTZ, {});
    const [dx, , dz] = DIRS[y % 2 === 0 ? frontDir : sideDir];
    if (!isReserved(x + dx, y, z + dz)) g.set(x + dx, y, z + dz, SMOOTH_QUARTZ, {});
  }
}

export function build(g) {
  // 1. foundation and the lawn-level plinth; storey-1 floor (y1), storey-2 floor (y5), ceiling (y9)
  for (let x = 0; x <= 43; x++) for (let z = 0; z <= 31; z++) {
    if (!inFootprint(x, z)) continue;
    g.set(x, 0, z, STONE_BRICKS, {});
    g.set(x, 1, z, ...s1Floor(x, z));
    // the foyer void (x20..25, z9..13) has no storey-2 floor: the double-height foyer and its stair
    const isVoid = x >= 20 && x <= 25 && z >= 9 && z <= 13;
    if (!isVoid) g.set(x, 5, z, ...s2Floor(x, z));
    g.set(x, 9, z, SMOOTH_QUARTZ, {});
  }

  // 2. openings: reserve every door, arch, bay and void so the walls leave them AIR
  reserve(1, 2, 6, 3, 4, 6); reserve(5, 2, 6, 7, 4, 6); reserve(9, 2, 6, 11, 4, 6);   // garage carriage doors
  reserve(0, 2, 16, 0, 3, 16);                                                        // garage side door
  reserve(22, 2, 8, 23, 4, 8);                                                        // entry double door + transom
  reserve(21, 5, 8, 24, 8, 8);                                                        // fanlight + entry arch
  reserve(30, 2, 8, 32, 4, 8); reserve(30, 6, 8, 32, 8, 8);                           // turret bay openings
  reserve(30, 2, 4, 32, 4, 4);                                                        // tall turret window (no sill)
  reserve(35, 2, 27, 37, 4, 27); reserve(39, 2, 27, 41, 4, 27);                       // tall S1 windows, rear
  reserve(25, 2, 23, 26, 4, 23);                                                      // french doors to the deck
  reserve(12, 2, 18, 12, 3, 18); reserve(12, 6, 16, 12, 7, 16);                       // garage to mudroom and bonus
  reserve(19, 2, 12, 19, 3, 13); reserve(19, 2, 19, 19, 3, 19);                       // office and mudroom doors
  reserve(19, 6, 14, 19, 7, 14); reserve(19, 6, 20, 19, 7, 20); reserve(19, 6, 16, 19, 8, 17);
  reserve(26, 2, 10, 26, 4, 12); reserve(26, 6, 14, 26, 7, 14); reserve(26, 6, 16, 26, 8, 17);
  reserve(29, 2, 15, 29, 3, 15);                                                      // dining to kitchen door
  reserve(33, 2, 17, 33, 4, 21); reserve(33, 6, 16, 33, 7, 17);                       // family and primary openings
  reserve(29, 6, 18, 29, 7, 18);                                                      // hall bath door
  reserve(36, 6, 22, 36, 7, 22); reserve(40, 6, 22, 40, 7, 22);                       // closet and bath doors
  reserve(37, 2, 12, 39, 3, 12);                                                      // firebox (reserved in vocab too)

  // 3. windows: sill row at y0-1 (window() reserves the opening and its sill)
  // garage (north, storey 2 arches) and centre front
  window(g, 1, 7, 6, "north", 3, 2); window(g, 5, 7, 6, "north", 3, 2); window(g, 9, 7, 6, "north", 3, 2);
  window(g, 14, 3, 8, "north", 3, 2); window(g, 14, 7, 8, "north", 3, 2);
  window(g, 30, 7, 4, "north", 3, 2);
  window(g, 29, 3, 6, "west", 1, 2); window(g, 33, 3, 6, "east", 1, 2);
  window(g, 29, 7, 6, "west", 1, 2); window(g, 33, 7, 6, "east", 1, 2);
  // east wing north, rear and sides
  window(g, 34, 3, 12, "north", 3, 2); window(g, 40, 3, 12, "north", 3, 2);
  window(g, 34, 7, 12, "north", 3, 2); window(g, 40, 7, 12, "north", 3, 2);
  window(g, 35, 7, 27, "south", 2, 2); window(g, 40, 7, 27, "south", 2, 2);
  window(g, 43, 3, 15, "east", 3, 2); window(g, 43, 3, 21, "east", 3, 2);
  window(g, 43, 7, 15, "east", 3, 2); window(g, 43, 7, 19, "east", 2, 2); window(g, 43, 7, 24, "east", 2, 2);
  window(g, 33, 3, 24, "west", 2, 2); window(g, 33, 7, 24, "west", 2, 2);
  window(g, 33, 3, 10, "east", 2, 2); window(g, 33, 7, 10, "east", 2, 2);
  window(g, 12, 3, 21, "west", 2, 2); window(g, 12, 7, 21, "west", 2, 2);
  window(g, 0, 3, 9, "west", 3, 2); window(g, 0, 7, 10, "west", 3, 2);
  // centre rear and garage rear
  window(g, 14, 3, 23, "south", 3, 2); window(g, 21, 3, 23, "south", 3, 2); window(g, 29, 3, 23, "south", 3, 2);
  window(g, 14, 7, 23, "south", 3, 2); window(g, 21, 7, 23, "south", 4, 2); window(g, 29, 7, 23, "south", 2, 2);
  window(g, 5, 3, 19, "south", 3, 2); window(g, 5, 7, 19, "south", 3, 2);

  // 4. exterior walls (y1..9); north-facing planes get the stone-veneer base
  exteriorWall(g, hline(6, 0, 12), { north: true });                  // garage front
  exteriorWall(g, vline(0, 7, 19));                                    // garage west
  exteriorWall(g, hline(19, 1, 11));                                   // garage rear
  exteriorWall(g, vline(12, 7, 7));                                    // garage NE stub
  exteriorWall(g, hline(8, 13, 28), { north: true });                  // centre front (portico wall included)
  exteriorWall(g, vline(12, 20, 22));                                  // centre west, south of the garage
  exteriorWall(g, hline(23, 13, 32));                                  // centre rear
  exteriorWall(g, vline(33, 9, 11));                                   // centre east, north of the wing
  exteriorWall(g, vline(33, 24, 27));                                  // east wing west, south of the centre
  exteriorWall(g, hline(12, 34, 43), { north: true });                 // east wing front
  exteriorWall(g, vline(43, 13, 27));                                  // east wing east
  exteriorWall(g, hline(27, 34, 43));                                  // east wing rear

  // 5. interior partitions: storey 1 (y1..4) and storey 2 (y5..8), every one 1 thick
  const s1Cells = [...vline(12, 9, 19), ...vline(19, 9, 22), ...vline(26, 9, 15), ...hline(15, 12, 19),
    ...hline(15, 26, 33), ...vline(33, 12, 23)];
  const s2Cells = [...vline(12, 9, 19), ...vline(19, 9, 15), ...vline(19, 18, 22), ...vline(26, 9, 15),
    ...vline(26, 18, 22), ...hline(15, 12, 19), ...hline(15, 26, 33), ...hline(18, 12, 19), ...hline(18, 26, 33),
    ...vline(33, 12, 23), ...hline(22, 34, 42), ...vline(38, 23, 26)];
  partition(g, s1Cells, 1);
  partition(g, s2Cells, 2);

  // 6. the turret bay, then the chimney (the roof keeps it)
  turret(g);
  chimneyStack(g);

  // 7. quoins at the eight corners (long-short stones)
  quoinSafe(g, 0, 6, ["east", "south"]);
  quoinSafe(g, 12, 6, ["west", "south"]);
  quoinSafe(g, 0, 19, ["east", "north"]);
  quoinSafe(g, 12, 23, ["east", "north"]);
  quoinSafe(g, 33, 12, ["east", "north"]);
  quoinSafe(g, 43, 12, ["west", "south"]);
  quoinSafe(g, 33, 27, ["east", "north"]);
  quoinSafe(g, 43, 27, ["west", "north"]);

  // 8. portico pilasters on the centre front wall (x20 and x25, y2..8), and the firebox hearth
  for (let y = 2; y <= 8; y++) {
    g.set(20, y, 8, QUARTZ_PILLAR, { axis: "y" });
    g.set(25, y, 8, QUARTZ_PILLAR, { axis: "y" });
  }
  for (let x = 37; x <= 39; x++) g.set(x, 1, 13, STONE_BRICKS, {});
}
