// Outer anatomy of the heart: a lofted body (per-height ellipses) plus auricles, the left atrium and the great vessels.
import { Field, R, ellipsoid, tube, pathPoints } from "./anat.mjs";

// vessel centre-lines (u, y, z, radius) — outer radius; lumens are carved separately
export const PATHS = {
  aorta: [[12.5, 22, 13.5, 3.4], [12.5, 26, 13.8, 3.4], [13.1, 28.8, 14, 3.4], [15.5, 31.2, 14.4, 3.4], [19, 32.2, 15.6, 3.4], [22.4, 30.6, 17.4, 3.3], [23.6, 27, 19, 3.3], [23.6, 22.5, 20.5, 3.3]],
  pulmTrunk: [[11, 20, 5.8, 2.7], [12.2, 23.2, 6.4, 2.7], [14.2, 26, 7.8, 2.6], [17, 28.2, 9.8, 2.5], [19, 28.8, 12, 2.4]],
  rightPA: [[19, 28.8, 12, 2.3], [15.5, 28.2, 16.5, 2.2], [11.5, 26.7, 19.5, 2.2], [9, 25.8, 21.2, 2.2]],
  leftPA: [[19, 28.8, 12, 2.3], [22, 28.6, 14.8, 2.2], [24.5, 27.4, 17.5, 2.2], [26, 26.2, 20, 2.2]],
  svc: [[6, 21, 11.5, 2.9], [6, 28, 11.8, 2.9], [6, 33, 12, 2.9]],
  ivc: [[4.8, 10.5, 11.2, 3.5], [4.8, 5, 11.2, 3.5], [4.8, 0, 11.2, 3.5]],
  brachio: [[15.5, 31.2, 14.4, 1.9], [15.4, 34.2, 14.5, 1.9]],
  carotid: [[19, 32.2, 15.6, 1.7], [19, 34.4, 15.7, 1.7]],
  subclav: [[22, 30.8, 17.2, 1.7], [22.3, 33.8, 17.5, 1.7]],
  pvRU: [[11.5, 22.5, 20.5, 1.7], [8.8, 23.5, 22.4, 1.6], [6.6, 24, 23.1, 1.6]],
  pvRL: [[11.5, 19, 21, 1.7], [8.8, 18.6, 22.8, 1.6], [6.8, 18.3, 23.5, 1.6]],
  pvLU: [[18.5, 22.5, 21, 1.7], [21.2, 23.9, 22.4, 1.6], [23.4, 24.3, 23.1, 1.6]],
  pvLL: [[18.5, 19, 21.5, 1.7], [21.2, 18.8, 22.8, 1.6], [23.2, 18.6, 23.5, 1.6]],
};

// silhouette rows: [y, left edge u, right edge u] — apex low and to the viewer's right, rounded atrial border on the left
const ROWS = [[0, 20, 21.4], [1, 18.8, 22], [2.4, 16.4, 23], [4, 13, 24], [6, 8.4, 25.2], [8, 4.6, 26.3], [10.5, 2.2, 27.2],
  [14, 0.9, 27.9], [17.5, 0.9, 27.9], [20.5, 1.7, 27.3], [23, 3.2, 25.9], [25, 5.4, 23.8], [26.4, 8.5, 20.2], [27.3, 11.5, 16.8]];
const rowsPath = pathPoints(ROWS.map(([y, l, r]) => [l, y, r]), 0.2);
export function bodyAt(y) {            // -> { cu, a, zc, b } or null
  if (y < ROWS[0][0] || y > ROWS[ROWS.length - 1][0]) return null;
  let best = rowsPath[0];
  for (const p of rowsPath) if (Math.abs(p[1] - y) < Math.abs(best[1] - y)) best = p;
  const l = best[0], r = best[2];
  const a = (r - l) / 2;
  return { cu: (l + r) / 2, a, zc: 8.0 + 0.2 * y, b: Math.min(9.7, 0.9 * a + 0.5) };
}
export const bodyHull = (x, y, z) => {
  const s = bodyAt(y);
  if (!s || s.a < 0.6) return false;
  return ((x - s.cu) / s.a) ** 2 + ((z - s.zc) / s.b) ** 2 <= 1;
};
// the right atrium owns the viewer's-left lobe above the diaphragmatic foot
export const isRA = (x, y, z) => x < 9.3 + 0.12 * (z - 3) && y >= 6.5;

export function buildHull() {
  const F = new Field();
  F.stamp(R.VM, (x, y, z) => y >= 0 && bodyHull(x, y, z));
  F.stamp(R.RA, (x, y, z) => y >= 0 && bodyHull(x, y, z) && isRA(x, y, z));
  // left atrium (posterior, behind the root of the great vessels)
  F.stamp(R.LA, ellipsoid([15, 19.8, 19.2], [7.6, 6.0, 4.9]));
  // auricles (the "ears" on the front)
  F.stamp(R.AUR, ellipsoid([9.4, 22.6, 5.0], [4.4, 3.6, 2.8]));      // right auricle over the aortic root
  F.stamp(R.AUR, ellipsoid([22.6, 22.2, 6.6], [3.2, 3.6, 2.8]));     // left auricle by the pulmonary trunk
  // great vessels
  const T = (k, v, ytop = 99) => { const t = tube(PATHS[k], 0); F.stamp(v, (x, y, z) => y < ytop && t(x, y, z)); };
  T("aorta", R.AORTA); T("brachio", R.AORTA, 34.5); T("carotid", R.AORTA, 34.5); T("subclav", R.AORTA, 34.5);
  T("pulmTrunk", R.PULM); T("rightPA", R.PULM); T("leftPA", R.PULM);
  T("svc", R.VENA, 34.5); T("ivc", R.VENA);
  T("pvRU", R.PVEIN); T("pvRL", R.PVEIN); T("pvLU", R.PVEIN); T("pvLL", R.PVEIN);
  return F;
}
