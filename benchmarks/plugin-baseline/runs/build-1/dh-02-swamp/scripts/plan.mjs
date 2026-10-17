// The site from above as a plan: ground height (contours every block, shaded), water, mud, built cells, trees; a 10-block
// grid with coordinates; optional overlays (roads, zones). P pixels per block.
import { encodePng } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/png.mjs";
import { drawText } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/render/font.mjs";
import { writeFileSync } from "node:fs";
export function plan(site, out, { P = 5, roads = [], zones = [], labels = [], grid = true } = {}) {
  const { X, Z, H, water, tree, built, topBlock } = site; const W = X * P, Hh = Z * P, img = { width: W, height: Hh, rgba: new Uint8Array(W * Hh * 4) };
  const px = (x, y, c, a = 1) => { if (x < 0 || y < 0 || x >= W || y >= Hh) return; const i = (y * W + x) * 4; for (let k = 0; k < 3; k++) img.rgba[i + k] = Math.round(img.rgba[i + k] * (1 - a) + c[k] * a); img.rgba[i + 3] = 255; };
  const cell = (x, z, c, a = 1) => { for (let y = z * P; y < z * P + P; y++) for (let xx = x * P; xx < x * P + P; xx++) px(xx, y, c, a); };
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) { const h = H[z][x]; let c;
    if (h < 0) c = [70, 120, 190];
    else if (built[z][x]) c = /path|gravel|coarse/.test(topBlock[z][x]) ? [190, 160, 110] : [168, 82, 60];
    else if (topBlock[z][x] === "mud") c = [95, 80, 65];
    else { const k = Math.max(0, Math.min(1, h / 17)); c = [Math.round(80 + 150 * k), Math.round(130 + 100 * k), Math.round(60 + 90 * k)]; }
    const hw = x > 0 && H[z][x - 1] >= 0 ? H[z][x - 1] : h, hn = z > 0 && H[z - 1][x] >= 0 ? H[z - 1][x] : h, sh = Math.max(-1, Math.min(1, ((hw - h) + (hn - h)) * 0.3));
    cell(x, z, c.map((v) => Math.max(0, Math.min(255, v * (1 - sh * 0.35)))));
    if (tree[z][x]) cell(x, z, [20, 60, 20], 0.45); }
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) { const h = H[z][x], e = x + 1 < X ? H[z][x + 1] : h, so = z + 1 < Z ? H[z + 1][x] : h; if (h < 0) continue;
    if (e >= 0 && h !== e) for (let y = z * P; y < z * P + P; y++) px((x + 1) * P - 1, y, [40, 30, 20], 0.45);
    if (so >= 0 && h !== so) for (let xx = x * P; xx < x * P + P; xx++) px(xx, (z + 1) * P - 1, [40, 30, 20], 0.45); }
  for (const zn of zones) { const [x0, z0, x1, z1] = zn.rect; for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) cell(x, z, zn.color, zn.alpha ?? 0.35);
    const o = (x, y) => px(x, y, zn.edge ?? zn.color); for (let x = x0 * P; x < (x1 + 1) * P; x++) for (const k of [0, 1]) { o(x, z0 * P + k); o(x, (z1 + 1) * P - 1 - k); } for (let y = z0 * P; y < (z1 + 1) * P; y++) for (const k of [0, 1]) { o(x0 * P + k, y); o((x1 + 1) * P - 1 - k, y); } }
  for (const r of roads) for (const c of r.cells) cell(c.x, c.z, r.color ?? [235, 205, 120], 0.85);
  if (grid) { for (let x = 0; x < X; x += 10) for (let y = 0; y < Hh; y += 2) px(x * P, y, [255, 255, 255], 0.5); for (let z = 0; z < Z; z += 10) for (let x = 0; x < W; x += 2) px(x, z * P, [255, 255, 255], 0.5);
    for (let x = 10; x < X; x += 20) drawText(img, String(x), x * P + 2, 2, { scale: 1, color: [255, 255, 255] }); for (let z = 10; z < Z; z += 20) drawText(img, String(z), 2, z * P + 2, { scale: 1, color: [255, 255, 255] }); }
  for (const l of labels) { const w = l.text.length * 6 * (l.scale ?? 2), x0 = l.x * P - w / 2, y0 = l.z * P - 7; for (let y = y0 - 2; y < y0 + 8 * (l.scale ?? 2) + 1; y++) for (let x = x0 - 2; x < x0 + w + 2; x++) px(Math.round(x), Math.round(y), [255, 255, 255], 0.85); drawText(img, l.text, Math.round(x0), Math.round(y0), { scale: l.scale ?? 2, color: [30, 30, 40] }); }
  writeFileSync(out, encodePng(img)); return img;
}
if (import.meta.url === `file://${process.argv[1]}`) { const { readSite } = await import("./site.mjs"); plan(readSite(), process.argv[2] ?? "art/raw-plan.png"); }
