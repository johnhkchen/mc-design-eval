// Chambers (rooms) carved into the hull. room codes:
export const RM = { RA: 1, RV: 2, LV: 3, LA: 4, AO: 5, PT: 6, SVC: 7, IVC: 8, PA: 9, PVN: 10 };
import { R, NU, NY, NZ, idx, ellipsoid, tube } from "./anat.mjs";
import { PATHS } from "./hull.mjs";

// cavity shapes (cell-centre predicates)
export const LV_E = { c: [18.2, 15.8, 12.2], r: [7.2, 8.2, 5.6] };
export const lvE = ellipsoid(LV_E.c, LV_E.r);
export const lvPlus = ellipsoid(LV_E.c, LV_E.r.map((v) => v + 1.7));      // LV + the septum
const rvE = ellipsoid([13.6, 10.6, 5.8], [5.6, 6.6, 3.1]);
const raC = ellipsoid([6.2, 15.2, 11.2], [4.4, 7.8, 6.9]);
const laE = ellipsoid([15, 19.6, 19.4], [5.8, 4.4, 3.1]);

export function carveRooms(F) {
  const H = F.a.slice();                                                    // hull snapshot: walls stay >= 2 thick
  const hull = (u, y, z) => u >= 0 && u < NU && y >= 0 && y < NY && z >= 0 && z < NZ && H[idx(u, y, z)] !== 0;
  const thick = (u, y, z) => [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]].every(([a, b, c]) => hull(u + 2 * a, y + 2 * b, z + 2 * c) && hull(u + a, y + b, z + c));
  const mark = (code, f, floorY = 0, ceilY = NY) => {
    for (let u = 0; u < NU; u++) for (let y = floorY; y < Math.min(NY, ceilY); y++) for (let z = 0; z < NZ; z++)
      if (F.a[idx(u, y, z)] !== 0 && f(u + 0.5, y + 0.5, z + 0.5) && thick(u, y, z)) { F.a[idx(u, y, z)] = 0; F.room[idx(u, y, z)] = code; }
  };
  // LV: the thick-walled main lab; floor y=12, flat-ish ceiling at y=21
  mark(RM.LV, (x, y, z) => lvE(x, y, z) && y < 21.6 - 0.02 * (x - 18) ** 2, 12);
  // RV: crescent in front of the septum, floor y=8 (level with the RA)
  mark(RM.RV, (x, y, z) => rvE(x, y, z) && !lvPlus(x, y, z), 8);
  // RA: tall hall, floor y=8 (the IVC stair arrives from below)
  mark(RM.RA, (x, y, z) => raC(x, y, z) && !lvPlus(x, y, z) && !rvE(x + 0.0, y, z), 8);
  // LA: posterior chamber, floor y=16
  mark(RM.LA, laE, 16);
}

// vessel lumens (inner radius = outer - wall); each runs down into its chamber
export function carveLumens(F) {
  const mark = (code, f) => {
    for (let u = 0; u < NU; u++) for (let y = 0; y < NY; y++) for (let z = 0; z < NZ; z++)
      if (f(u + 0.5, y + 0.5, z + 0.5) && F.a[idx(u, y, z)] !== 0) { F.a[idx(u, y, z)] = 0; F.room[idx(u, y, z)] = code; }
  };
  const lum = (name, code, wall, extra = [], take = 99, seal = 0) => {
    const raw = PATHS[name].slice(0, take);
    if (seal) {          // stop the lumen short of a cut end, leaving a solid cap `seal` of the last segment thick
      const a = raw[raw.length - 2], b = raw[raw.length - 1];
      raw[raw.length - 1] = [a[0] + (b[0] - a[0]) * (1 - seal), a[1] + (b[1] - a[1]) * (1 - seal), a[2] + (b[2] - a[2]) * (1 - seal), b[3]];
    }
    const pts = raw.map(([x, y, z, r]) => [x, y, z, Math.max(1.1, r - wall)]);
    mark(code, tube([...extra, ...pts], 0));
  };
  lum("aorta", RM.AO, 1.5, [[12.5, 20.5, 13.5, 1.9]]);
  lum("pulmTrunk", RM.PT, 1.2, [[11, 15.5, 5.8, 1.7]], 2);
  lum("svc", RM.SVC, 1.3, [[6.2, 17, 11.5, 1.7]]);
  lum("ivc", RM.IVC, 1.2);
  for (const n of ["pvRU", "pvRL", "pvLU", "pvLL"]) lum(n, RM.PVN, 0.7, [], 2);
  for (const n of ["brachio", "carotid", "subclav"]) lum(n, RM.AO, 0.6);
}

// ---- structure inside the hull: bulkheads, doorways (valves), balcony ---------------------------------------------
export function addStructure(F) {
  const each = (u0, y0, z0, u1, y1, z1, fn) => { for (let u = u0; u <= u1; u++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) fn(u, y, z, idx(u, y, z)); };
  // wall: turn only cavity cells into solid (never grows the hull)
  const wall = (u0, y0, z0, u1, y1, z1) => each(u0, y0, z0, u1, y1, z1, (u, y, z, i) => { if (F.room[i]) { F.room[i] = 0; F.a[i] = R.VM; } });
  const open = (u0, y0, z0, u1, y1, z1, code) => each(u0, y0, z0, u1, y1, z1, (u, y, z, i) => { F.a[i] = 0; F.room[i] = code; });
  const slab = (u0, y0, z0, u1, y1, z1) => each(u0, y0, z0, u1, y1, z1, (u, y, z, i) => { if (!F.a[i]) { F.a[i] = R.FLOOR; F.room[i] = 0; } });
  return { each, wall, open, slab };
}
