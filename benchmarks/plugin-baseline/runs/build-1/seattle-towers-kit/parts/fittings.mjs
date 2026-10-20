// P5 facade fittings (plan.md ticks 7, 8, 9, 12, 14, 16, 17): colonnades and their glazing, north-face fins, the KOMO 4
// sign, the Hyatt court canopy and lobby glazing, the Aperture balconies and shopfronts, and every iron door pair.
// Everything here writes only into air; the shells (earlier parts) keep their cells.
import { colonnade, finRow, komoSign, canopy, lobbyGlazing, balconyBay, shopfront, doorPair } from "../vocab.mjs";
import { plaque } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// The palette has no banners, so the KOMO 4 letters (vocabulary: white wall banners, one per character) are written as
// the palette's black_concrete in the same cells: black letters on the white wall, the read the banners gave.
const paletteLetters = (g) => Object.assign(Object.create(g), {
  set: (x, y, z, block, state, nbt) => (block === "white_wall_banner" ? g.set(x, y, z, "black_concrete") : g.set(x, y, z, block, state, nbt)),
});

export function build(g) {
  const refused = [];
  const take = (r) => { if (r && r.refused) refused.push(...r.refused); return r; };

  // ---- 7: KOMO colonnades (2 deep, columns 2x2 every 8). The shell already glazes the ground storey behind them. ----
  // KOMO E north face: wall line z 4, strip z 4..5 into the building (south).
  take(colonnade(g, { run: { x0: 12, x1: 101, z: 4 }, every: 8, y0: 1, y1: 6 }));
  // KOMO E east face: wall line x 103, strip x 102..103 into the building (west). The south-wing door (z 80..81) takes
  // its column's bay: the door cells at y 1..2 stay air, the lintel over them is kept.
  const southDoorGap = (x, y, z) => y <= 2 && x >= 102 && z >= 80 && z <= 81;
  take(colonnade(g, { run: { x: 103, z0: 8, z1: 113 }, every: 8, y0: 1, y1: 6, skip: southDoorGap }));
  // KOMO W east face: wall line x 144, strip x 143..144 (west).
  take(colonnade(g, { run: { x: 144, z0: 16, z1: 49 }, every: 8, y0: 1, y1: 6 }));

  // ---- 8: projecting fins on the KOMO E north face (z 3, y 7..36). The fin at x 32 stops at the KOMO 4 letters. ----
  take(finRow(g, { xs: [18, 46, 78, 92], z: 3, y0: 7, y1: 36 }));
  take(finRow(g, { xs: [32], z: 3, y0: 7, y1: 29 }));
  take(finRow(g, { xs: [32], z: 3, y0: 35, y1: 36 }));

  // ---- 9: KOMO 4 sign and emblem, on the north wall line z 4 (the sign sits at z 3) ----
  take(komoSign(paletteLetters(g), { at: [38, 30, 4] }));

  // ---- 12: Hyatt glazed lobby on the court side (z 64), the court canopy over the doors ----
  take(lobbyGlazing(g, { run: { x0: 152, x1: 171, z: 64 }, every: 4, y0: 1, y1: 5, band: 6 }));
  take(lobbyGlazing(g, { run: { x0: 176, x1: 199, z: 64 }, every: 4, y0: 1, y1: 5, band: 6 }));
  take(canopy(g, { box: [170, 60, 177, 63], y: 6 }));

  // ---- 14: HYATT HOUSE sign on the south block's north face, letters over the court (plan x 156..171, y 13..16) ----
  take(plaque(g, "HYATT HOUSE", { at: [171, 16, 64], face: "north", width: 16, height: 4, material: null }));

  // ---- 16: Aperture balconies: light bays only, staggered (odd storeys x 202/222/242, even x 212/232) ----
  const storeys = [7, 12, 17, 22, 27, 32];
  storeys.forEach((s, i) => {
    const starts = i % 2 === 0 ? [202, 222, 242] : [212, 232];
    for (const x0 of starts) take(balconyBay(g, { x0, z0: 0, slab: s, width: 5, depth: 2 }));
  });

  // ---- 17: Aperture shopfronts on z 2 and the shop doors; the residents' lobby door on the west face ----
  const shopDoors = [[205, 206], [215, 216], [225, 226], [235, 236], [244, 245]];
  take(shopfront(g, { x0: 201, x1: 248, z: 2, bay: 9, open: shopDoors }));
  for (const [a] of shopDoors) take(doorPair(g, { x: a, y: 1, z: 2, face: "north" }));
  take(doorPair(g, { x: 201, y: 1, z: 20, face: "west" }));

  // ---- 17: iron door pairs on every other entrance ----
  take(doorPair(g, { x: 12, y: 1, z: 9, face: "north" }));     // KOMO E drum lobby
  take(doorPair(g, { x: 61, y: 1, z: 0, face: "north" }));     // KOMO E north bow lobby
  take(doorPair(g, { x: 103, y: 1, z: 30, face: "east" }));    // KOMO E east entrance
  take(doorPair(g, { x: 103, y: 1, z: 80, face: "east" }));    // KOMO E south wing east
  take(doorPair(g, { x: 56, y: 1, z: 90, face: "west" }));     // KOMO E plaza door
  take(doorPair(g, { x: 126, y: 1, z: 1, face: "north" }));    // KOMO W bow lobby
  take(doorPair(g, { x: 144, y: 1, z: 30, face: "east" }));    // KOMO W east door
  take(doorPair(g, { x: 172, y: 1, z: 64, face: "north" }));   // Hyatt main lobby, pair 1
  take(doorPair(g, { x: 174, y: 1, z: 64, face: "north" }));   // Hyatt main lobby, pair 2
  take(doorPair(g, { x: 195, y: 1, z: 8, face: "north" }));    // Hyatt tip entrance

  if (refused.length) console.log(`fittings: ${refused.length} refused writes (earlier parts own those cells)`);
}
