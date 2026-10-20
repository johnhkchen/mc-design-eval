// Tunnel portal and cut (P2, elements 7-10): the west portal face, two bores, the lid over the tunnel with its
// soil and grass, the retaining walls of the cut with their earth banks. Builds only into air (the ground and the
// parkway road are laid by the terrain part). Module coordinates; y 0 = world y 2.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { portalFace, tunnelBore, retainWall, LID, BORE_AIR } from "../vocab.mjs";

// Retaining walls of the cut: x-range, top course y (plan: y 5..9 at x 37..40, 5..8 at x 33..36, 5..7 at x 28..32).
const RETAIN_STEPS = [
  { x0: 37, x1: 40, hTop: 9 },
  { x0: 33, x1: 36, hTop: 8 },
  { x0: 28, x1: 32, hTop: 7 },
];

export function build(g) {
  // Only air is written. Every helper and every put goes through this, so a cell an earlier part filled is left alone.
  const put = (x, y, z, ...b) => { if (g.isAir(x, y, z)) g.set(x, y, z, ...b); };

  // 7. West portal face: plinth, body, coping, lintels over the mouths, the wall lantern on the pier.
  portalFace(g, 41, 76, 95);
  // The pier's bracket stands on the parkway median barrier (y 5), which the terrain part laid; nothing floats.

  // 8. Two bores: walls, black back, slab ceiling at y 9, sea lanterns on the centre lines.
  tunnelBore(g, BORE_AIR.x0, BORE_AIR.y0, 80);
  tunnelBore(g, BORE_AIR.x0, BORE_AIR.y0, 87);

  // 10. Lid over the tunnel: soil y 5..8 round the bores, a slab ceiling at y 9 over the whole lid, grass at y 10
  // from x 43 east. Air-only, so the bore air (x 43..49, z 80..84 / 87..91) and the walls stay as they are.
  const inBore = (x, z) => x <= BORE_AIR.x1 && ((z >= 80 && z <= 84) || (z >= 87 && z <= 91));
  for (let z = 76; z <= 95; z++) for (let x = 43; x <= LID.x1; x++) {
    for (let y = 5; y <= 8; y++) if (!inBore(x, z)) put(x, y, z, ...B.block("dirt"));
    put(x, LID.y, z, ...B.block("smooth_stone"));
    put(x, LID.y + 1, z, ...B.block("grass_block"));
  }

  // 9. Retaining walls of the cut, north (z 78..79) and south (z 92..93), each stepping down westward. Earth banks
  // stand behind them (north z 76..77, south z 94..95), grass-topped at the wall's course height.
  for (const { x0, x1, hTop } of RETAIN_STEPS) {
    retainWall(g, x0, x1, 78, 79, hTop, { y0: 5 });
    retainWall(g, x0, x1, 92, 93, hTop, { y0: 5 });
    for (let x = x0; x <= x1; x++) for (const z of [76, 77, 94, 95]) {
      for (let y = 5; y < hTop; y++) put(x, y, z, ...B.block("dirt"));
      put(x, hTop, z, ...B.block("grass_block"));
    }
  }

  // The park's planting spills over the top (comment v2): azalea and flowering azalea leaf heaps along the lid's west
  // edge behind the coping and on the earth banks over the retaining walls, 1-2 high, ragged.
  const leaf = (b) => [b, { persistent: "true", distance: "1", waterlogged: "false" }];
  const h = (x, z) => { let v = Math.imul(x * 374761393 + z * 668265263, 1274126177); v ^= v >>> 13; return ((v >>> 0) % 1000) / 1000; };
  const heap = (x, y, z) => {
    const r = h(x, z);
    if (r < 0.2) return;
    put(x, y, z, ...leaf(r < 0.45 ? "flowering_azalea_leaves" : "azalea_leaves"));
    if (r > 0.65) put(x, y + 1, z, ...leaf("azalea_leaves"));
  };
  for (let z = 76; z <= 95; z++) for (const x of [43, 44]) if (x === 43 || h(z, x) > 0.5) heap(x, LID.y + 2, z);
  for (const { x0, x1, hTop } of RETAIN_STEPS) for (let x = x0; x <= x1; x++) for (const z of [76, 77, 94, 95]) heap(x, hTop + 1, z);
}
