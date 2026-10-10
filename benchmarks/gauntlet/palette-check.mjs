// PALETTE CHECK: does the build's front use the concept's materials? Deterministic, free. The concept's front view and
// the build's front-elevation render are each cropped to the building (non-background pixels), resampled to a coarse
// zone grid, and compared zone by zone in CIELAB. Zones that drift are reported in words a builder can act on
// ("rows 1-2 of 6, left third: concept light warm cream, build dark grey"), plus a side-by-side heat map.
//
//   node benchmarks/gauntlet/palette-check.mjs <concept> <front-elevation.png> [--box x,y,w,h] [--out heat.png] [--json]
import { execFileSync } from "node:child_process";

const rgbOf = (path, w, h) => execFileSync("magick", [path, "-resize", `${w}x${h}!`, "-depth", "8", "rgb:-"], { maxBuffer: 1 << 26 });
function lab([r, g, b]) {
  const f = (c) => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92; };
  const [R, G, B] = [f(r), f(g), f(b)];
  const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, Y = R * 0.2126 + G * 0.7152 + B * 0.0722, Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const t = (v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
  return [116 * t(Y) - 16, 500 * (t(X) - t(Y)), 200 * (t(Y) - t(Z))];
}
const words = ([L, a, b]) => {
  const light = L > 80 ? "very light" : L > 62 ? "light" : L > 42 ? "mid" : L > 25 ? "dark" : "very dark";
  const C = Math.hypot(a, b), h = (Math.atan2(b, a) * 180) / Math.PI;
  const hue = C < 8 ? "grey" : h > -20 && h < 40 ? "warm red/brown" : h >= 40 && h < 75 ? (L > 70 ? "cream/beige" : "tan/ochre") : h >= 75 && h < 110 ? "yellow/gold" : h >= 110 && h < 170 ? "green" : h >= 170 || h < -110 ? "cyan/teal" : "blue/violet";
  return `${light} ${hue}`;
};

/** Crop box of the non-background pixels (background = median border colour). */
function bbox(path) {
  const [w, h] = execFileSync("magick", [path, "-format", "%w %h", "info:"], { encoding: "utf8" }).trim().split(" ").map(Number);
  const px = rgbOf(path, w, h), at = (x, y) => 3 * (y * w + x), border = [];
  for (let x = 0; x < w; x += 3) for (const y of [1, h - 2]) border.push(at(x, y));
  for (let y = 0; y < h; y += 3) for (const x of [1, w - 2]) border.push(at(x, y));
  const bg = [0, 1, 2].map((c) => border.map((i) => px[i + c]).sort((p, q) => p - q)[border.length >> 1]);
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = at(x, y);
    if (Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]) > 60) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

export function paletteCheck(concept, build, { box, cols = 8, rows = 6, threshold = 18, out } = {}) {
  const cb = box || bbox(concept), bb = bbox(build);
  const grid = (path, b) => {
    const crop = execFileSync("magick", [path, "-crop", `${b.w}x${b.h}+${b.x}+${b.y}`, "+repage", "-filter", "box", "-resize", `${cols}x${rows}!`, "-depth", "8", "rgb:-"], { maxBuffer: 1 << 24 });
    return Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => lab([0, 1, 2].map((k) => crop[3 * (r * cols + c) + k]))));
  };
  const A = grid(concept, cb), B = grid(build, bb);
  const zones = [];
  let sum = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const [a, b] = [A[r][c], B[r][c]], dE = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    sum += dE;
    if (dE > threshold) zones.push({ r, c, dE: Math.round(dE), concept: words(a), build: words(b), lighter: b[0] < a[0] - 8 ? "make it lighter" : b[0] > a[0] + 8 ? "make it darker" : "" });
  }
  const third = (c) => (c < cols / 3 ? "left" : c < (2 * cols) / 3 ? "centre" : "right");
  const band = (r) => (r < rows / 3 ? "top" : r < (2 * rows) / 3 ? "middle" : "bottom");
  // merge drifting zones by band x third, so the report reads like a builder's note
  const groups = new Map();
  for (const z of zones) { const k = `${band(z.r)} ${third(z.c)}`; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(z); }
  const notes = [...groups.entries()].sort((p, q) => q[1].length - p[1].length).map(([k, zs]) => {
    const z = zs.sort((p, q) => q.dE - p.dE)[0];
    return `${k} of the front: concept ${z.concept}, build ${z.build}${z.lighter ? ` (${z.lighter})` : ""}; ${zs.length} zone(s), worst ΔE ${z.dE}`;
  });
  if (out) {
    execFileSync("magick", ["(", concept, "-crop", `${cb.w}x${cb.h}+${cb.x}+${cb.y}`, "+repage", "-resize", "x400", ")", "(", build, "-crop", `${bb.w}x${bb.h}+${bb.x}+${bb.y}`, "+repage", "-resize", "x400", ")",
      "(", concept, "-crop", `${cb.w}x${cb.h}+${cb.x}+${cb.y}`, "+repage", "-filter", "box", "-resize", `${cols}x${rows}!`, "-filter", "point", "-resize", "x400", ")",
      "(", build, "-crop", `${bb.w}x${bb.h}+${bb.x}+${bb.y}`, "+repage", "-filter", "box", "-resize", `${cols}x${rows}!`, "-filter", "point", "-resize", "x400", ")",
      "-background", "white", "-splice", "8x0", "+append", out]);
  }
  return { meanDeltaE: Math.round(sum / (rows * cols)), drifting: zones.length, of: rows * cols, notes };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
  const box = arg("--box") ? Object.fromEntries(arg("--box").split(",").map(Number).map((v, i) => [["x", "y", "w", "h"][i], v])) : undefined;
  const r = paletteCheck(process.argv[2], process.argv[3], { box, out: arg("--out") });
  if (process.argv.includes("--json")) console.log(JSON.stringify(r, null, 1));
  else { console.log(`palette: mean ΔE ${r.meanDeltaE}, ${r.drifting}/${r.of} zones drift from the concept${r.drifting ? ":" : " (ok)"}`); for (const n of r.notes) console.log("  - " + n); }
}
