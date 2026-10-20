// Part 2: Tower facades. The fluting grammar (flute) on every exposed face of the tower masses I1..I4, C1, F1..F6 and E1..E5,
// from y15 to each top (3-high storeys: two glass rows and a gray_terracotta spandrel); the tower base shop storey (ground+1..y14)
// with shopBay on the north and south flanks; the lit-window scatter comes from flute's hash. Writes only into air (flute's own
// rule), and skips the reserved cells: the GE sign band (layers 0 and -1 of z12/z43) and the east entrance (x>=143, z20..35, y<=27).
import { flute, shopBay, groundLevel } from "../vocab.mjs";

// Tower masses [x0, z0, x1, z1, top]. F6 is the two east podiums; E6 (the plaza pavilions) belongs to the wings part.
const MASSES = [
  [56, 16, 131, 39, 216], [60, 16, 131, 39, 222], [76, 16, 123, 39, 224], [76, 18, 119, 37, 228], [80, 24, 135, 31, 232],
  [68, 12, 111, 43, 212], [68, 14, 111, 41, 218], [112, 12, 119, 43, 196], [120, 12, 127, 43, 153], [128, 12, 131, 43, 110],
  [132, 12, 139, 15, 41], [132, 40, 139, 43, 41],
  [132, 16, 139, 39, 202], [132, 24, 143, 31, 209], [140, 16, 143, 39, 163], [144, 16, 145, 39, 113], [144, 24, 145, 31, 170],
];

const FLUTE_FROM = 15, STOREY = 3;

// The cells this part never writes: the GE sign band (its layers 0 and -1 on the north z12/z13 and south z42/z43 faces) and the
// east entrance (its frame, the backing wall at x143, and the WISDOM panel), which other parts own.
function reserved(x, y, z) {
  if (y >= 197 && y <= 209 && x >= 76 && x <= 103 && (z === 12 || z === 13 || z === 42 || z === 43)) return true;
  if (x >= 143 && z >= 20 && z <= 35 && y <= 27) return true;
  return false;
}

// The grid as flute and shopBay see it: their writes into a reserved cell are simply not made.
function view(g) {
  return {
    inBounds: (x, y, z) => g.inBounds(x, y, z) && !reserved(x, y, z),
    isAir: (x, y, z) => g.isAir(x, y, z),
    set: (x, y, z, id, state) => g.set(x, y, z, id, state),
  };
}

export function build(g) {
  const v = view(g);
  // Fluting on all four faces of every tower mass (writes only into air: where another mass is solid, nothing is written).
  for (const [x0, z0, x1, z1, top] of MASSES) {
    flute(v, { side: "north", line: z0 }, [x0, x1], FLUTE_FROM, top, STOREY, 1);
    flute(v, { side: "south", line: z1 }, [x0, x1], FLUTE_FROM, top, STOREY, 1);
    flute(v, { side: "west", line: x0 }, [z0, z1], FLUTE_FROM, top, STOREY, 1);
    flute(v, { side: "east", line: x1 }, [z0, z1], FLUTE_FROM, top, STOREY, 1);
  }
  // Tower base: shop storey from the walk level up to y14 on the north and south flanks (x68..139), bays on every 4th cell.
  // The plaza (east) face is the entrance's and the wings' to dress, so it gets no base bays here.
  for (const [line, side] of [[12, "north"], [43, "south"]]) {
    for (let at = 68; at <= 136; at += 4) {
      const wallY0 = groundLevel(at + 1, line) + 1;
      shopBay(v, { side, line }, at, wallY0, 14);
    }
  }
}
