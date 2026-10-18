// P2 dome pavilion shell: plot 0's square pavilion (y 1..36) on all four faces, the 3x3 rusticated corner piers, the
// plinth corners, the rotunda floor and the roof deck with the drum's hole. Windows stay open for the glazier; columns,
// glass, triglyphs, the d1 cornice and the y 37..38 balustrade are other parts' cells and are left empty here.
// Faces partition the ring: N and S run the full width (corners included), E and W run between them (z or x 8..55),
// so no cell is written twice.
import { faceFrame, rusticatedBase, terraceAndFloor, recessedWall, entablature, deck } from "../vocab.mjs";

const DI = "polished_diorite", AN = "polished_andesite", SS = "smooth_stone";
const BOX = [0, 0, 63, 63];
const FACES = {
  north: faceFrame("north", BOX),
  south: faceFrame("south", BOX),
  east: faceFrame("east", BOX),
  west: faceFrame("west", BOX),
};
// The first u of each 2-wide window. E and W drop the windows at 7..8 and 55..56: they would sit on the N and S walls'
// corner cells (x or z 6..7), which the N and S faces own.
const WIN_NS = [7, 15, 23, 31, 39, 47, 55];
const WIN_EW = [15, 23, 31, 39, 47];
// Corner piers: 3x3 at the corners, [x0, z0]. Their outer faces are x = 2 or 61 and z = 2 or 61.
const PIERS = [[2, 2], [59, 2], [2, 59], [59, 59]];

// One air-only write; a filled cell is recorded in g.refused (never overwritten).
function put(g, x, y, z, block) {
  if (g.isAir(x, y, z)) g.set(x, y, z, block);
  else (g.refused ??= []).push([x, y, z, block]);
}

// Fill a box of one block, air-only.
function box(g, [x0, y0, z0, x1, y1, z1], block) {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) put(g, x, y, z, block);
}

// A corner pier: polished_diorite y 1..33. At the base joints (y 4 and 7) the outer ring is a 1-deep channel (air), the
// next ring is diorite, as on the base faces.
function pier(g, [px, pz]) {
  const outerX = px === 2 ? 2 : 61, outerZ = pz === 2 ? 2 : 61;
  for (let x = px; x <= px + 2; x++)
    for (let z = pz; z <= pz + 2; z++)
      for (let y = 1; y <= 33; y++) {
        if (y === 4 || y === 7) {
          const dx = Math.abs(x - outerX), dz = Math.abs(z - outerZ);
          if (dx === 0 || dz === 0) continue;
          put(g, x, y, z, dx === 1 || dz === 1 ? "diorite" : DI);
        } else put(g, x, y, z, DI);
      }
}

export function build(g) {
  // Corner pieces first: the piers and the plinth at the four corners, where the face helpers do not reach.
  for (const c of PIERS) pier(g, c);
  box(g, [1, 1, 1, 4, 1, 1], AN); box(g, [1, 1, 2, 1, 1, 4], AN);
  box(g, [59, 1, 1, 62, 1, 1], AN); box(g, [62, 1, 2, 62, 1, 4], AN);
  box(g, [1, 1, 62, 4, 1, 62], AN); box(g, [1, 1, 59, 1, 1, 61], AN);
  box(g, [59, 1, 62, 62, 1, 62], AN); box(g, [62, 1, 59, 62, 1, 61], AN);

  for (const [name, F] of Object.entries(FACES)) {
    const ns = name === "north" || name === "south";
    const wins = ns ? WIN_NS : WIN_EW;
    const openings = wins.map((u) => ({ u0: u, u1: u + 1, y0: 3, y1: 8 }));
    const [u0, u1] = [5, 58]; // between the piers

    // Plinth, base body (joints at y 4 and 7), string course at y 9. Openings stay air for the glazier.
    rusticatedBase(g, F, u0, u1, 2, { openings });
    // The base storey's own y 1 course, behind the plinth (rusticatedBase starts the body at y 2).
    for (let u = u0; u <= u1; u++) for (const d of [2, 3, 4]) { const [x, z] = F.at(u, d); put(g, x, 1, z, DI); }
    // Each window head: closed behind the keystone cell (y 8), which the dressings set at d 2.
    for (const u of wins) for (const uu of [u, u + 1]) for (const d of [3, 4]) { const [x, z] = F.at(uu, d); put(g, x, 8, z, DI); }

    // Terrace on top of the base (the base body already holds d 2..4 at y 9), the recessed wall and the entablature ring.
    terraceAndFloor(g, F, ns ? 5 : 6, ns ? 58 : 57, 5, 5, 9);
    recessedWall(g, F, ns ? 5 : 8, ns ? 58 : 55, 6, { windows: wins });
    entablature(g, F, ns ? 2 : 8, ns ? 61 : 55, 2);
  }

  // The rotunda floor under the dome's axis, and the flat deck over the rotunda, open over the drum's disc.
  box(g, [5, 1, 5, 58, 1, 58], SS);
  deck(g, 8, 8, 55, 55, 36, { hole: 18.5 });
  return g;
}
