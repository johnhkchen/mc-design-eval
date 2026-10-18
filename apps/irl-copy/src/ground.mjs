// The ground's height (metres) per block from contour lines: each contour fixes the cells it crosses, and every other
// cell is relaxed to a smooth surface between them (Gauss-Seidel with over-relaxation on Laplace's equation).
import { along } from "./raster.mjs";

/** contours: GeoJSON lines with an elevation property; unit: metres per unit of that property (0.3048 for feet). */
export function groundFromContours(frame, contours, { field = "elevation", unit = 1, iterations = 2500 } = {}) {
  const { N } = frame, H = new Float64Array(N * N), fixed = new Uint8Array(N * N), sum = new Float64Array(N * N), cnt = new Uint16Array(N * N);
  for (const [fx, fz, f] of along(frame, contours.features)) {
    const x = Math.floor(fx), z = Math.floor(fz); if (x < 0 || z < 0 || x >= N || z >= N) continue;
    sum[z * N + x] += +f.properties[field] * unit; cnt[z * N + x]++;
  }
  let mean = 0, nf = 0;
  for (let i = 0; i < N * N; i++) if (cnt[i]) { H[i] = sum[i] / cnt[i]; fixed[i] = 1; mean += H[i]; nf++; }
  mean = nf ? mean / nf : 0;
  for (let i = 0; i < N * N; i++) if (!fixed[i]) H[i] = mean;
  for (let it = 0; it < iterations; it++) for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
    const i = z * N + x; if (fixed[i]) continue;
    let s = 0, n = 0; if (x > 0) { s += H[i - 1]; n++; } if (x < N - 1) { s += H[i + 1]; n++; } if (z > 0) { s += H[i - N]; n++; } if (z < N - 1) { s += H[i + N]; n++; }
    H[i] += 1.85 * (s / n - H[i]);
  }
  return H;
}
