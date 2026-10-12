// Field clean-up before the blocks are emitted: no single blocks sticking out of the surface.
import { NU, NY, NZ, idx, R } from "./anat.mjs";

export function despeckle(F, passes = 2) {
  let removed = 0;
  const NB = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]];
  const solid = (u, y, z) => u >= 0 && u < NU && y >= 0 && y < NY && z >= 0 && z < NZ && F.a[idx(u, y, z)] !== 0;
  for (let p = 0; p < passes; p++) {
    const kill = [];
    for (let u = 0; u < NU; u++) for (let y = 1; y < NY; y++) for (let z = 0; z < NZ; z++) {
      const v = F.a[idx(u, y, z)];
      if (!v || v === R.FLOOR || F.room[idx(u, y, z)]) continue;
      let n = 0;
      for (const [a, b, c] of NB) if (solid(u + a, y + b, z + c)) n++;
      if (n <= 1) kill.push(idx(u, y, z));
    }
    for (const i of kill) F.a[i] = 0;
    removed += kill.length;
  }
  return removed;
}
