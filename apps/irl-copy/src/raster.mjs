// GeoJSON onto a frame's block grid: polygons by cell centre, lines as distances or stamped widths.
export const lines = (g) => (!g ? [] : g.type === "LineString" ? [g.coordinates] : g.type === "MultiLineString" ? g.coordinates : g.type === "Polygon" ? g.coordinates : g.type === "MultiPolygon" ? g.coordinates.flat() : []);
export const polys = (g) => (!g ? [] : g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : g.type === "LineString" ? [[g.coordinates]] : []);

/** The cells whose centres fall inside a (multi)polygon: [[x, z], ...] (holes respected). */
export function cellsIn(frame, geom) {
  const { N, toBlock } = frame, cells = [];
  for (const rings of polys(geom)) {
    const R = rings.map((r) => r.map(([lon, lat]) => toBlock(lon, lat)));
    const xs = R[0].map((p) => p[0]), zs = R[0].map((p) => p[1]);
    for (let z = Math.max(0, Math.floor(Math.min(...zs))); z <= Math.min(N - 1, Math.ceil(Math.max(...zs))); z++)
      for (let x = Math.max(0, Math.floor(Math.min(...xs))); x <= Math.min(N - 1, Math.ceil(Math.max(...xs))); x++) {
        const px = x + 0.5, pz = z + 0.5; let inside = false;
        for (const r of R) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
          const [xi, zi] = r[i], [xj, zj] = r[j];
          if (zi > pz !== zj > pz && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi) inside = !inside; }
        if (inside) cells.push([x, z]);
      }
  }
  return cells;
}

/** Each cell's distance (blocks) to the nearest of these lines, out to `reach`; Infinity beyond. */
export function distanceTo(frame, geoms, reach) {
  const { N, toBlock } = frame, d = new Float32Array(N * N).fill(Infinity);
  for (const geom of geoms) for (const line of lines(geom)) for (let i = 1; i < line.length; i++) {
    const [ax, az] = toBlock(...line[i - 1]), [bx, bz] = toBlock(...line[i]), dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1;
    for (let z = Math.max(0, Math.floor(Math.min(az, bz) - reach)); z <= Math.min(N - 1, Math.ceil(Math.max(az, bz) + reach)); z++)
      for (let x = Math.max(0, Math.floor(Math.min(ax, bx) - reach)); x <= Math.min(N - 1, Math.ceil(Math.max(ax, bx) + reach)); x++) {
        const t = Math.max(0, Math.min(1, ((x + 0.5 - ax) * dx + (z + 0.5 - az) * dz) / L2));
        const v = Math.hypot(x + 0.5 - ax - t * dx, z + 0.5 - az - t * dz); if (v < d[z * N + x]) d[z * N + x] = v; }
  }
  return d;
}

/** Points sampled along lines every half block: [[x, z, feature], ...] (fractional). */
export function along(frame, features) {
  const out = [];
  for (const f of features) for (const line of lines(f.geometry)) for (let i = 1; i < line.length; i++) {
    const [x0, z0] = frame.toBlock(...line[i - 1]), [x1, z1] = frame.toBlock(...line[i]), n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) * 2) + 1;
    for (let k = 0; k <= n; k++) out.push([x0 + ((x1 - x0) * k) / n, z0 + ((z1 - z0) * k) / n, f]);
  }
  return out;
}
