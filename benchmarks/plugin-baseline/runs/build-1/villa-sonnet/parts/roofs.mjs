// P2 ROOFS (plan.md roof table R1..R16, E20, E30, E31). Each piece is one roof() call on its rect, over the walls' top
// (y6), first roof course at y7. Gables use the temple preset (red-tile, half pitch, quartz verge) with the per-piece
// ridge; sheds slope toward the court (the low side). Adjoining pieces share walls, so only R1 overhangs (north).
// The compluvium x14..21 z13..18 and the garden x11..24 z35..41 are no piece's rect, so they stay open. The pediment
// (E30) and the kitchen chimney (E31) are built after the roofs, over the pieces they stand on.
import { roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/roofs.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { ROOF_PIECES, CHIMNEY, SMOOTH_QUARTZ, STONE_BRICKS } from "../vocab.mjs";

const ROOF_EAVE = 7;
const SHARED_WALLS = "adjoining roof pieces share walls; plot boundary";
const ROOF_MATERIAL = "red-tile";

/** One roof piece from its plan.md row: gable (preset temple, ridge per piece) or shed (low side per piece). */
function roofPiece(g, piece) {
  const overhang = piece.overhang === 0 ? 0 : { north: 1, south: 0, east: 0, west: 0 };   // R1 north only; the rest 0
  const sides = typeof overhang === "object" ? overhang : null;
  const common = {
    y: ROOF_EAVE,
    material: ROOF_MATERIAL,
    pitch: "half",
    eave: "plain",
    ridge: "slab",
    trim: SMOOTH_QUARTZ,
    verge: SMOOTH_QUARTZ,
    overhang,
    reasons: sides ? undefined : { overhang: SHARED_WALLS },
  };
  if (piece.style === "gable") {
    return roof(g, piece.rect, "temple", { ...common, ridgeAxis: piece.ridge });
  }
  return roof(g, piece.rect, "shed", { ...common, low: piece.low });
}

/** E30: the three-step triangular pediment over the fauces, on the street front (z=2..3), y7..9, x14..21. */
function pediment(g) {
  for (const z of [2, 3]) {
    for (let x = 14; x <= 21; x++) g.set(x, 7, z, SMOOTH_QUARTZ);
    g.set(15, 8, z, ...B.stairs("quartz", "west"));
    for (let x = 16; x <= 19; x++) g.set(x, 8, z, SMOOTH_QUARTZ);
    g.set(20, 8, z, ...B.stairs("quartz", "east"));
    g.set(16, 9, z, ...B.stairs("quartz", "west"));
    g.set(17, 9, z, SMOOTH_QUARTZ);
    g.set(18, 9, z, SMOOTH_QUARTZ);
    g.set(19, 9, z, ...B.stairs("quartz", "east"));
  }
}

/** E31: the kitchen chimney, a hollow 3x3 stack on the R8 roof; the open core (2, y, 26) carries the hearth smoke. */
function chimney(g) {
  const { x0, z0, x1, z1 } = CHIMNEY;
  const top = 10;                                     // plan: the one chimney may reach y10 (CHIMNEY.y1 = 9 is the spec's stack)
  for (let y = 7; y <= top; y++) {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      if (x === 2 && z === 26) g.set(x, y, z, "air");
      else g.set(x, y, z, STONE_BRICKS);
    }
  }
}

export function build(g) {
  for (const piece of ROOF_PIECES) roofPiece(g, piece);
  pediment(g);
  chimney(g);
}
