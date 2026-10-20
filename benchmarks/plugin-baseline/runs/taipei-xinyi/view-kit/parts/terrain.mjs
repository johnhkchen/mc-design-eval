// Hillside terrain (plan PARTS 1): GROUND map interpolated bilinearly between cell centres, one hillCell per column.
import { GROUND, GROUND_STEP, PLOT, ROCKS, TREES, hillCell } from "../vocab.mjs";

const NC = GROUND[0].length;
const NR = GROUND.length;

// bilinear height at (x, z) between cell centres (3c+1, 3r+1); centres keep their exact value
function height(x, z) {
  const fc = Math.min(Math.max((x - 1) / GROUND_STEP, 0), NC - 1);
  const fr = Math.min(Math.max((z - 1) / GROUND_STEP, 0), NR - 1);
  const c0 = Math.floor(fc), r0 = Math.floor(fr);
  const c1 = Math.min(c0 + 1, NC - 1), r1 = Math.min(r0 + 1, NR - 1);
  const tc = fc - c0, tr = fr - r0;
  const top = GROUND[r0][c0] * (1 - tc) + GROUND[r0][c1] * tc;
  const bot = GROUND[r1][c0] * (1 - tc) + GROUND[r1][c1] * tc;
  return Math.round(top * (1 - tr) + bot * tr);
}

export function build(g) {
  const [W, , D] = PLOT;
  const H = [];
  for (let x = 0; x < W; x++) {
    H.push([]);
    for (let z = 0; z < D; z++) H[x].push(height(x, z));
  }
  const nearRock = (x, z) =>
    Object.values(ROCKS).some((r) => x >= r.x0 - 2 && x <= r.x1 + 2 && z >= r.z0 - 2 && z <= r.z1 + 2);
  const underTree = (x, z) =>
    Object.values(TREES).some((t) => (x - t.trunk[0]) ** 2 + (z - t.trunk[1]) ** 2 <= 5);
  for (let x = 0; x < W; x++) {
    for (let z = 0; z < D; z++) {
      const h = H[x][z];
      let rise = 0;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, nz = z + dz;
        if (nx >= 0 && nx < W && nz >= 0 && nz < D) rise = Math.max(rise, Math.abs(H[nx][nz] - h));
      }
      hillCell(g, x, z, h, { rise, nearRock: nearRock(x, z), podzol: underTree(x, z) });
    }
  }
}
