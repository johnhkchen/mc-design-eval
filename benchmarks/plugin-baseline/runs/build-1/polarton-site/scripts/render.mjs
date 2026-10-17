import { encodePng } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/png.mjs";
import { writeFileSync } from "node:fs";
export function renderSite(site, out, { roads = [], plots = [], wild = [], green = [], P = 6, labels = true } = {}) {
  const { X, Z, H, water, tree } = site; const W = X * P, Hh = Z * P, rgba = new Uint8Array(W * Hh * 4);
  const px = (x, y, c, a = 1) => { if (x < 0 || y < 0 || x >= W || y >= Hh) return; const i = (y * W + x) * 4; for (let k = 0; k < 3; k++) rgba[i + k] = Math.round(rgba[i + k] * (1 - a) + c[k] * a); rgba[i + 3] = 255; };
  const cell = (x, z, c, a = 1) => { for (let y = z * P; y < z * P + P; y++) for (let xx = x * P; xx < x * P + P; xx++) px(xx, y, c, a); };
  const outline = (x0, z0, x1, z1, c, w = 2, dash = 0) => { const X0 = x0 * P, Z0 = z0 * P, X1 = (x1 + 1) * P - 1, Z1 = (z1 + 1) * P - 1;
    for (let x = X0; x <= X1; x++) for (let k = 0; k < w; k++) { if (dash && Math.floor(x / dash) % 2) continue; px(x, Z0 + k, c); px(x, Z1 - k, c); }
    for (let y = Z0; y <= Z1; y++) for (let k = 0; k < w; k++) { if (dash && Math.floor(y / dash) % 2) continue; px(X0 + k, y, c); px(X1 - k, y, c); } };
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) { const h = H[z][x]; let c;
    if (water[z][x]) c = [60, 110, 190]; else if (h < -4) c = [30, 40, 30];
    else if (site.built[z][x]) c = [168, 82, 60];
    else { const k = Math.max(0, Math.min(1, (h + 2) / 26)); c = [Math.round(70 + 170 * k), Math.round(110 + 120 * k), Math.round(60 + 90 * k)]; }
    const hw = x > 0 ? H[z][x - 1] : h, hn = z > 0 ? H[z - 1][x] : h, sh = Math.max(-1, Math.min(1, ((hw - h) + (hn - h)) * 0.25));
    cell(x, z, c.map((v) => Math.max(0, Math.min(255, v * (1 - sh * 0.35)))));
    if (tree[z][x]) cell(x, z, [25, 60, 25], 0.5); }
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) { const h = H[z][x], e = x + 1 < X ? H[z][x + 1] : h, so = z + 1 < Z ? H[z + 1][x] : h;
    if (Math.floor(h / 2) !== Math.floor(e / 2)) for (let y = z * P; y < z * P + P; y++) px((x + 1) * P - 1, y, [50, 40, 30], 0.5);
    if (Math.floor(h / 2) !== Math.floor(so / 2)) for (let xx = x * P; xx < x * P + P; xx++) px(xx, (z + 1) * P - 1, [50, 40, 30], 0.5); }
  for (const w of wild) for (let z = w[1]; z <= w[3]; z++) for (let x = w[0]; x <= w[2]; x++) cell(x, z, [128, 128, 128], 0.35);
  for (const w of green) outline(...w, [120, 255, 120], 2, 3);
  for (const r of roads) for (const c of r.cells) { const h = H[c.z]?.[c.x] ?? 0, t = Math.floor(c.y), d = h - t; cell(c.x, c.z, d > 0 ? [230, 150, 90] : d < 0 ? [200, 190, 120] : [215, 185, 110], 0.85); if (Math.abs(d) >= 2) cell(c.x, c.z, d > 0 ? [200, 40, 30] : [40, 60, 200], 0.6); }
  const OUTD = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
  for (const p of plots) if (p.setback && p.face) { const [ox, oz] = OUTD[p.face]; for (let k = 0; k < p.setback; k++) for (const d of [0, 1, 2]) { const x = p.gate[0] + ox * k + (oz ? d - (p.face === 'north' || p.face === 'south' ? 0 : 0) : 0), z = p.gate[1] + oz * k + (ox ? d : 0); cell(x, z, [235, 235, 235], 0.9); } }
  for (const p of plots) { outline(p.x0, p.z0, p.x1, p.z1, p.color ?? [80, 220, 240], 2); if (p.gate) cell(p.gate[0], p.gate[1], [255, 255, 255], 0.9); }
  writeFileSync(out, encodePng({ width: W, height: Hh, rgba }));
}
