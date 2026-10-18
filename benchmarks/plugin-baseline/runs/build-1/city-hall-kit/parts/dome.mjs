// P7 dome: the leaded dome shell (plan rule 26) with its gilded band, sixteen polished_andesite ribs, gold cartouches,
// the gold ring under the lantern and glowstone in the inner shell. leadDome builds it in a scratch grid and copies it
// once with the swaps, so every cell here is written exactly once.
import { leadDome } from "../vocab.mjs";

const CX = 31.5, CZ = 31.5, Y0 = 71;
const TOP = Y0 + 29;   // the gold ring, the top course of the shell
const LANTERN_R = 5.5; // the lantern platform (y 101) stands on this disc

export function build(g) {
  let n = leadDome(g, { cx: CX, cz: CZ, y0: Y0 });
  // The shell's top leaves air at y 100 inside the lantern disc: fill it, so the platform rests on solid.
  for (let x = 0; x < g.size[0]; x++) for (let z = 0; z < g.size[2]; z++) {
    if (Math.hypot(x - CX, z - CZ) > LANTERN_R || !g.isAir(x, TOP, z)) continue;
    g.set(x, TOP, z, "polished_tuff");
    n++;
  }
  return n;
}
