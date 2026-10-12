// Portholes: round-cornered glass windows through the heart wall, ringed in copper, so every side has real openings.
import { NU, NY, NZ, idx } from "./anat.mjs";

// side: "front" (from z=0 inward), "back" (from z=NZ-1), "left" (from u=0), "right" (from u=NU-1)
// a, b = the two window coordinates: front/back -> (u, y); left/right -> (z, y);  w x h cells
export function porthole(K, F, { side, a, b, w = 2, h = 2, glass = "light_blue_stained_glass", ring = "waxed_oxidized_cut_copper", rim = "waxed_copper_block" }) {
  const at = (s, c, y) => side === "front" ? [c, y, s] : side === "back" ? [c, y, NZ - 1 - s] : side === "left" ? [s, y, c] : [NU - 1 - s, y, c];
  const depth = side === "front" || side === "back" ? NZ : NU;
  const solid = (u, y, z) => u >= 0 && u < NU && y >= 0 && y < NY && z >= 0 && z < NZ && F.a[idx(u, y, z)] !== 0 && !F.room[idx(u, y, z)];
  const cavity = (u, y, z) => u >= 0 && u < NU && y >= 0 && y < NY && z >= 0 && z < NZ && F.room[idx(u, y, z)] > 0;
  let cut = 0;
  for (let c = a; c < a + w; c++) for (let y = b; y < b + h; y++) {
    for (let s = 0; s < depth; s++) {
      const [u, yy, z] = at(s, c, y);
      if (cavity(u, yy, z)) break;
      if (solid(u, yy, z) || K.at(u, yy, z)) { K.put(u, yy, z, glass); cut++; }
    }
  }
  // ring and a rim on the outer skin: the first solid cell of each surrounding column
  for (let c = a - 1; c <= a + w; c++) for (let y = b - 1; y <= b + h; y++) {
    if (c >= a && c < a + w && y >= b && y < b + h) continue;
    const corner = (c < a || c >= a + w) && (y < b || y >= b + h);
    for (let s = 0; s < depth; s++) {
      const [u, yy, z] = at(s, c, y);
      if (cavity(u, yy, z)) break;
      if (solid(u, yy, z) || K.at(u, yy, z)) { K.put(u, yy, z, corner ? rim : ring); break; }
    }
  }
  return cut;
}
