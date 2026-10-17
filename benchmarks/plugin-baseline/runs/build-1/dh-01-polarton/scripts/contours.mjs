// contour polyline at level L: per row z, the first x scanning west from x0 where the smoothed ground reaches L
export function contourPoints(site, L, { z0, z1, step = 4, x0 = 81, xmin = 22, r = 3 }) {
  const { H, X, Z } = site; const G = (x, z) => { let s = 0, n = 0; for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { const h = H[z + dz]?.[x + dx]; if (h == null || h < -4) continue; s += h; n++; } return n ? s / n : 0; };
  const pts = []; for (let z = z0; z <= z1; z += step) { for (let x = x0; x >= xmin; x--) if (G(x, z) >= L) { pts.push([x + 0.5, z]); break; } }
  return pts;
}
