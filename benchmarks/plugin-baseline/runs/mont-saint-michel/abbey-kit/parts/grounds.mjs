// Part P6 "Chimneys, lights, grounds": the reserved chimney stacks (plan.md RESERVED), the lanterns on the terraces,
// the Degre walls, the north terrace and the SAUT-G corners (plan.md RESERVED "Lantern posts"). Runs after the
// shell, roofs, spire, choir and fittings, so every search reads what they left: a stack or lamp only goes into
// air, on a solid cell, inside the footprint.
import { lamp, onFootprint, groundTop } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// The RESERVED stacks [x, z, top y]: a 3 x 3 masonry block with a 1 x 1 flue of air up the middle (the centre
// column, x+1 z+1 here), the campfire at its foot, the cap a ring of slabs.
export const STACKS = [
  [24, 91, 67], [40, 91, 67],   // LOGIS-W
  [58, 97, 65], [69, 97, 65],   // LOGIS-A
  [79, 103, 57],                // LOGIS-B
  [88, 103, 56], [103, 95, 56], // LOGIS-C
  [60, 115, 56],                // BAILLI
];

// The lantern posts (plan.md RESERVED): TER-W parapet on its west edge, N-TER every 8 on its z 24 edge, DEGRE walls
// every 6 (the bridge arch at x 88..90 is skipped), SAUT-G corners. [x, z, walk y]. A lantern whose support is a
// slab is skipped (fit: a lantern on a bottom slab hangs over air).
const LAMPS = [
  ...[54, 60, 66, 72].map((z) => [terraceEdge(z), z, 44]),
  ...[26, 34, 42, 50].map((x) => [x, 24, 42]),
  ...[66, 72, 78, 84, 96, 102].flatMap((x) => [[x, 82, 44], [x, 86, 44]]),
  [51, 87, 41], [56, 87, 41], [51, 95, 41], [56, 95, 41],
];

// The west-most footprint cell of row z (the terrace edge where its parapet stands).
function terraceEdge(z) {
  for (let x = 0; x < 130; x++) if (onFootprint(x, z)) return x;
  return 6;
}

// The lowest y at or above `y0` (and the ground) where the cells are all air and the cell below is solid.
function seat(g, cells, x, y0) {
  const top = Math.max(y0, groundTop(x, cells[0][1]) ?? 0);
  for (let y = top; y < 150; y++) {
    if (!cells.every(([cx, cz]) => g.isAir(cx, y, cz))) continue;
    if (cells.some(([cx, cz]) => !g.isAir(cx, y - 1, cz))) return y;
  }
  return null;
}

// A chimney stack for the stack at (x, z): the flue is the centre cell (x+1, z+1), walled all round by the
// masonry ring; the fire at its foot; the cap a ring of slabs. Writes only into air.
function stack(g, x, z, top) {
  const cx = x + 1, cz = z + 1;
  const cells = [];
  for (let dx = 0; dx <= 2; dx++) for (let dz = 0; dz <= 2; dz++) cells.push([x + dx, z + dz]);
  const base = seat(g, cells, x, groundTop(x, z) ?? 0);
  if (base == null || base >= top) return `stack ${x},${z}: no seat below ${top}`;
  const set = (sx, sy, sz, block, state) => {
    if (!g.isAir(sx, sy, sz)) return;
    if (state) g.set(sx, sy, sz, block, state); else g.set(sx, sy, sz, block);
  };
  set(cx, base, cz, "campfire", { facing: "north", lit: "true", signal_fire: "false", waterlogged: "false" });
  // The masonry runs through the roof line and up to the open top (top + 1), so the flue is walled by the chimney's own
  // stone bricks all the way; no slab ring, which the roof's fit check reads as roof walling the flue.
  for (let y = base + 1; y <= top + 1; y++) {
    for (const [dx, dz] of cells.map(([a, b]) => [a - cx, b - cz]).filter(([a, b]) => a || b)) {
      const mid = y === base + Math.floor((top - base) / 2);
      set(cx + dx, y, cz + dz, mid ? "chiseled_stone_bricks" : "stone_bricks");
    }
  }
  return null;
}

export function build(g) {
  const log = [];
  for (const [x, z, top] of STACKS) {
    const why = stack(g, x, z, top);
    if (why) log.push(why);
  }
  for (const [x, z, walk] of LAMPS) {
    if (!onFootprint(x, z)) continue;
    const y = seat(g, [[x, z]], x, walk);
    if (y == null) continue;
    if (g.blockAt(x, y - 1, z).includes("slab")) continue;
    lamp(g, x, y, z);
  }
  if (log.length) console.warn(`grounds: ${log.join("; ")}`);
}
