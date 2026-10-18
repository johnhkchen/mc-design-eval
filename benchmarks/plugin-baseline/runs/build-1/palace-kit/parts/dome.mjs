// Attic and dome (plan.md PLOT 0, attic and dome rows): the drum y34..45 (sandstone base course at y34, smooth_sandstone
// wall above, 4 thick between the octagons s 21 and s 25), eight relief panels with their figures, eight corner statue
// piers, the cut_sandstone/stair cornice at y44..45 one proud of the drum, the coffered underside and the dome shell with
// its Pantheon step rings, ribs and crown (domeShell). Every write is into air; the drum leaves the relief recesses open
// and reliefPanel's frame and figures replace the drum's own cells through its `over` list.
import { octRing, reliefPanel, statuePier, coffers, domeShell } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const C = 31.5;
const SQ = Math.SQRT1_2;
const FACES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
const DRUM_S = 25;

// The relief panel's outward normal and tangent per face, as plan.md's FACADES and reliefPanel's own tables.
const NORMAL = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0], ne: [SQ, -SQ], nw: [-SQ, -SQ], se: [SQ, SQ], sw: [-SQ, SQ] };
const TANGENT = { n: [1, 0], s: [1, 0], e: [0, 1], w: [0, 1], ne: [SQ, SQ], nw: [SQ, -SQ], se: [SQ, -SQ], sw: [SQ, SQ] };

// Panel recess (the outer layer of each face, |t| <= 7, y 36..42): the drum keeps its cells out of it, so the recess
// reads 1 deep. reliefPanel's frame and figures then fill the cells it owns.
function inRecess(x, y, z) {
  if (y < 36 || y > 42) return false;
  const dx = x - C, dz = z - C;
  return FACES.some((f) => {
    const [nx, nz] = NORMAL[f], [tx, tz] = TANGENT[f];
    const plane = f.length === 2 ? Math.round(DRUM_S * Math.SQRT2) * SQ : DRUM_S;
    const n = dx * nx + dz * nz, t = dx * tx + dz * tz;
    return n > plane - 1 && n <= plane && Math.abs(t) <= 7;
  });
}

// The drum's octagon ring at s (flat half-width), as the vocab's octagons: |dx|,|dz| <= s and |dx|+|dz| <= s*sqrt2.
const inOct = (dx, dz, s) => Math.abs(dx) <= s && Math.abs(dz) <= s && Math.abs(dx) + Math.abs(dz) <= Math.round(s * Math.SQRT2);

// Air-only write, as the vocabulary's helpers do: a cell an earlier part filled is left alone.
function put(g, x, y, z, block, state) {
  if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) return 0;
  g.set(x, y, z, block, state);
  return 1;
}

export function build(g) {
  // 1. Coffers first, so their glowstone wins the middle band over domeShell's brown_terracotta (both air-only).
  coffers(g, [C, 46, C]);

  // 2. Drum: sandstone base course at y34, smooth_sandstone wall y35..45, hollow between octagons 21 and 25.
  octRing(g, [C, C], 21, DRUM_S, 34, 34, "sandstone");
  octRing(g, [C, C], 21, DRUM_S, 35, 45, "smooth_sandstone", { skip: (x, y, z) => inRecess(x, y, z) });

  // 3. Relief panels on all eight faces; their frames and figures replace the drum's own cells in the frame layer.
  for (const f of FACES) reliefPanel(g, [C, C], f, DRUM_S, { over: ["smooth_sandstone"] });

  // 4. Attic corner statue piers: 2x2 strips at the eight vertices of the outer octagon, 1 proud of both faces.
  const vertices = [
    { x: 20, z: 5, ox: -1, oz: -1 }, { x: 42, z: 5, ox: 1, oz: -1 },
    { x: 20, z: 57, ox: -1, oz: 1 }, { x: 42, z: 57, ox: 1, oz: 1 },
    { x: 5, z: 20, ox: -1, oz: -1 }, { x: 5, z: 42, ox: -1, oz: 1 },
    { x: 57, z: 20, ox: 1, oz: -1 }, { x: 57, z: 42, ox: 1, oz: 1 },
  ];
  for (const v of vertices) statuePier(g, v);

  // 5. Attic cornice: cut_sandstone band at y44 and upside-down stairs at y45, both one proud of the drum (the ring of
  //    cells between octagons 25 and 26). Stairs face into the drum: toward the centre on the dominant axis.
  octRing(g, [C, C], DRUM_S, DRUM_S + 1, 44, 44, "cut_sandstone");
  for (let x = Math.floor(C - 27); x <= Math.ceil(C + 27); x++) for (let z = Math.floor(C - 27); z <= Math.ceil(C + 27); z++) {
    const dx = x - C, dz = z - C;
    if (!inOct(dx, dz, DRUM_S + 1) || inOct(dx, dz, DRUM_S)) continue;
    const facing = Math.abs(dz) >= Math.abs(dx) ? (dz < 0 ? "south" : "north") : (dx < 0 ? "east" : "west");
    const [id, state] = B.stairs("smooth_sandstone", facing, "top");
    put(g, x, 45, z, id, state);
  }

  // 6. Dome: outer shell terracotta, Pantheon step rings at y46/47, ribs, crown disc.
  domeShell(g, [C, C], { base: 46 });
}
