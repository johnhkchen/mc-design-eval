// Rotunda ring: arch ring + 8 piers (y 1..33) with the 8 arch openings carved by not placing, sandstone plinth,
// and the floor medallion. Column bases (4x4 at every shaft) belong to the columns part and are left clear.
import { octRing, medallion } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { isArchOpening } from "../vocab/h2.mjs";

const C = 31.5, S2 = Math.SQRT2;
const FACES = [
  [[0, -1], (dx, dz) => dx], [[0, 1], (dx, dz) => dx], [[1, 0], (dx, dz) => dz], [[-1, 0], (dx, dz) => dz],
  [[1, -1], (dx, dz) => (dx + dz) / S2], [[-1, 1], (dx, dz) => (dx + dz) / S2],
  [[-1, -1], (dx, dz) => (dx - dz) / S2], [[1, 1], (dx, dz) => (dx - dz) / S2],
].map(([n, t]) => { const l = Math.hypot(...n); return { n: [n[0] / l, n[1] / l], t }; });

// shaft min cells (x, z) of the 16 columns, plan.md
const SHAFTS = [[23, 3], [39, 3], [23, 59], [39, 59], [3, 23], [3, 39], [59, 23], [59, 39],
  [45, 5], [57, 17], [17, 5], [5, 17], [57, 45], [45, 57], [5, 45], [17, 57]];
const inBase = (x, z) => SHAFTS.some(([sx, sz]) => x >= sx - 1 && x <= sx + 2 && z >= sz - 1 && z <= sz + 2);
const inOct = (dx, dz, r) => Math.abs(dx) <= r && Math.abs(dz) <= r && Math.abs(dx) + Math.abs(dz) <= (r === 27 ? 38 : r === 21 ? 30 : r);

function faceOf(dx, dz) {
  let best = FACES[0], bv = -1e9;
  for (const f of FACES) { const v = dx * f.n[0] + dz * f.n[1]; if (v > bv) { bv = v; best = f; } }
  return best;
}
const opening = (x, y, z) => { const dx = x - C, dz = z - C; return isArchOpening(faceOf(dx, dz).t(dx, dz), y); };

export function build(g) {
  const skip = (x, y, z) => opening(x, y, z) || (y <= 2 && inBase(x, z));
  octRing(g, [C, C], 21, 27, 1, 2, "sandstone", { skip });
  octRing(g, [C, C], 21, 27, 3, 29, "smooth_sandstone", { skip });
  octRing(g, [C, C], 21, 27, 30, 30, "cut_sandstone", { skip });
  octRing(g, [C, C], 21, 27, 31, 33, "smooth_sandstone", { skip });

  // plinth moulding: upright sandstone stairs on the outer edge at y 2, back to the wall, where no column stands
  for (let x = 5; x <= 58; x++) for (let z = 5; z <= 58; z++) {
    const dx = x - C, dz = z - C;
    if (!inOct(dx, dz, 27) || inBase(x, z) || opening(x, 2, z)) continue;
    const out = [[0, -1, "south"], [0, 1, "north"], [1, 0, "west"], [-1, 0, "east"]]
      .filter(([ox, oz]) => !inOct(dx + ox, dz + oz, 27));
    if (!out.length) continue;
    g.set(x, 2, z, ...B.stairs("sandstone", out[0][2]));
  }
  medallion(g, [C, C], { over: ["smooth_stone"] });
}
