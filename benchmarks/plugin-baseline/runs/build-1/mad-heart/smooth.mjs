// Chamfer the stepped surface: exterior muscle cells on a terrace edge become stairs (the same dark red family), so the
// 45-degree flanks of the heart read as curves instead of staircases of cubes.
import { R, NU, NY, NZ, idx } from "./anat.mjs";
import { noise, rnd } from "./mats.mjs";

const SMOOTH = new Set([R.VM, R.RA, R.LA, R.AUR]);
const H = { r: [1, 0], l: [-1, 0], s: [0, 1], n: [0, -1] };
const OPP = { r: "l", l: "r", s: "n", n: "s" };
const WORLD = { n: "north", s: "south", r: "west", l: "east" };

export function smooth(F, put, { stair = "mangrove", share = 1.0 } = {}) {
  const outside = (u, y, z) => u < 0 || u >= NU || y < 0 || y >= NY || z < 0 || z >= NZ ? true : (F.a[idx(u, y, z)] === 0 && F.room[idx(u, y, z)] === 0);
  const solid = (u, y, z) => !(u < 0 || u >= NU || y < 0 || y >= NY || z < 0 || z >= NZ) && F.a[idx(u, y, z)] !== 0;
  const edits = [];
  for (let u = 0; u < NU; u++) for (let y = 1; y < NY; y++) for (let z = 0; z < NZ; z++) {
    const v = F.a[idx(u, y, z)];
    if (!SMOOTH.has(v)) continue;
    const up = outside(u, y + 1, z), down = outside(u, y - 1, z);
    if (up === down) continue;                                  // both or neither: no chamfer
    const open = Object.keys(H).filter((d) => outside(u + H[d][0], y, z + H[d][1]));
    // the cell above/below the chamfer must be air outside, and the cell's own support below/above must be solid
    if (open.length !== 1) continue;
    if (rnd(u, y, z, 31) > share) continue;
    const d = open[0];
    const back = OPP[d];
    const ok = up ? solid(u, y - 1, z) : solid(u, y + 1, z);
    if (!ok) continue;
    edits.push([u, y, z, back, up ? "bottom" : "top"]);
  }
  for (const [u, y, z, back, half] of edits) put(u, y, z, `${stair}_stairs`, { facing: WORLD[back], half, shape: "straight", waterlogged: "false" });
  return edits.length;
}
