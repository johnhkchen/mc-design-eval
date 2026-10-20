// Part 3: Wings and shopfronts. flute + shopBay on the wing masses (W1-W5, N1, E6, P1), the plinth at grade, the flat
// roof decks, parapets, and the Sixth Ave and 49th St portals. Every write goes through a grid that only accepts
// EXPOSED faces: a face cell whose outward neighbour is inside another mass (the tower, a taller wing, a neighbour
// wing) is left alone, so no fluting is spent on seams hidden in the union.
import { PLINTH, DECK, groundLevel, inLot, flute, shopBay, parapet, portal } from "../vocab.mjs";

const W = 146, D = 54;
// The union (same boxes as massing.mjs): x0,x1,z0,z1,top. Used only to tell exposed faces from seams.
const T = [
  [56,131,16,39,216],[60,131,16,39,222],[76,123,16,39,224],[76,119,18,37,228],[80,135,24,31,232],
  [68,111,12,43,212],[68,111,14,41,218],[112,119,12,43,196],[120,127,12,43,153],[128,131,12,43,110],
  [132,139,12,15,41],[132,139,40,43,41],[132,139,16,39,202],[132,143,24,31,209],[140,143,16,39,163],
  [144,145,16,39,113],[144,145,24,31,170],[140,145,12,15,11],[140,145,40,43,11],
  [0,23,4,47,58],[4,19,8,43,63],[8,15,16,39,66],[24,87,4,51,41],[44,55,8,39,45],[28,35,32,47,50],
  [88,111,4,11,36],[88,111,44,51,36],[112,131,4,11,23],[112,131,44,51,23],[132,143,4,11,10],[132,143,44,51,10],
  [20,143,0,3,11],[68,79,0,3,15],[0,7,48,53,12],[60,67,36,39,12],
];
// The wing masses this part dresses (plan.md's wing rows).
const WINGS = [
  [0,23,4,47,58],[4,19,8,43,63],[8,15,16,39,66],                 // W1, W1b, W1c (Sixth Ave block)
  [24,87,4,51,41],[44,55,8,39,45],[28,35,32,47,50],              // W2, W2b, W2c (central wing)
  [88,111,4,11,36],[88,111,44,51,36],                            // W3a, W3b
  [112,131,4,11,23],[112,131,44,51,23],                          // W4a, W4b
  [132,143,4,11,10],[132,143,44,51,10],                          // W5a, W5b
  [20,143,0,3,11],                                               // N1 (50th St podium)
  [0,7,48,53,12],                                                // P1 (forecourt pavilion)
  [140,145,12,15,11],[140,145,40,43,11],                         // E6 (plaza-corner pavilions)
];
// Portals first: the bays they cover are skipped (their cells are the portal's).
const PORTALS = [
  { face: { side: "west", line: 0 }, a: 26, y0: 1, width: 6, height: 8, skip: [24, 28] },     // Sixth Ave main entrance z24..29
  { face: { side: "south", line: 51 }, a: 100, y0: 2, width: 8, height: 7, skip: [96, 100] }, // 49th St passage x96..103
];

const H = Array.from({ length: W }, () => new Array(D).fill(-1));
for (const [x0, x1, z0, z1, top] of T)
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++)
    if (inLot(x, z) && top > H[x][z]) H[x][z] = top;
const occ = (x, y, z) => x >= 0 && z >= 0 && x < W && z < D && y >= 0 && y <= H[x][z];

// Cell of a face: a along the face, y, d = depth inward from the face line (0 outer, -1, -2 in). Same as vocab's cell().
function cellOf(face, a, y, d = 0) {
  const { side, line } = face;
  if (side === "north") return [a, y, line - d];
  if (side === "south") return [a, y, line + d];
  if (side === "east") return [line + d, y, a];
  return [line - d, y, a];
}

// A grid view for the face helpers: a write lands only where the face cell (d 0) is inside the union and the cell
// outside it is not, i.e. an exposed face. Everything else is a seam and is dropped.
function exposedGrid(g, face) {
  const along = face.side === "north" || face.side === "south";
  const exposed = (x, y, z) => {
    const a = along ? x : z;
    const d0 = cellOf(face, a, y, 0), out = cellOf(face, a, y, 1);
    return occ(...d0) && !occ(...out);
  };
  return {
    inBounds: (x, y, z) => g.inBounds(x, y, z),
    isAir: (x, y, z) => g.isAir(x, y, z),
    set: (x, y, z, id, state) => { if (exposed(x, y, z)) g.set(x, y, z, id, state); },
  };
}

const groundAt = (face, a) => { const [x, , z] = cellOf(face, a, 0, 0); return groundLevel(x, z); };

function faceList([x0, x1, z0, z1]) {
  return [
    { side: "west", line: x0, lo: z0, hi: z1 },
    { side: "east", line: x1, lo: z0, hi: z1 },
    { side: "north", line: z0, lo: x0, hi: x1 },
    { side: "south", line: z1, lo: x0, hi: x1 },
  ];
}

export function build(g) {
  // 1. portals first
  for (const p of PORTALS) portal(g, p.face, p.a, p.y0, p.width, p.height);

  for (const box of WINGS) {
    const [x0, x1, z0, z1, top] = box;
    for (const f of faceList(box)) {
      const gw = exposedGrid(g, f);
      // plinth course at grade, then the shop storey, then the fluted storeys from y9 (global storey rhythm)
      for (let a = f.lo; a <= f.hi; a++) {
        const gl = groundAt(f, a);
        for (const d of [0, -1, -2]) { const [x, y, z] = cellOf(f, a, gl, d); if (g.isAir(x, gl, z)) gw.set(x, gl, z, PLINTH); }
      }
      // shop bays: multiples of 4 along the face (piers on x or z = 0 mod 4)
      for (let at = Math.ceil(f.lo / 4) * 4; at + 3 <= f.hi; at += 4) {
        if (PORTALS.some((p) => p.face.side === f.side && p.face.line === f.line && p.skip.includes(at))) continue;
        const wallY0 = groundAt(f, at + 2) + 1;
        if (wallY0 > 8) continue;
        const door = ((at / 4) | 0) % 3 === 1;
        shopBay(gw, f, at, wallY0, 8, { door });
      }
      if (top - 1 >= 9) flute(gw, f, [f.lo, f.hi], 9, top - 1, 4, 1);
    }
    // flat roof deck over the open top layer (only where no taller mass sits on it), then the parapet
    parapet(g, [x0, z0, x1, z1], top);
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      if (!inLot(x, z) || !g.isAir(x, top, z) || occ(x, top + 1, z)) continue;
      g.set(x, top, z, DECK);
    }
  }
}
