// Find the FRONT ELEVATION on a builder's reference sheet and trace it to a block grid, with no hand measuring.
//   1. bbox: in the left half, pixels that differ from the sheet's background colour; rows/columns need a minimum share
//      of such pixels (drops guide lines, graph-paper grids, labels), and the longest run wins.
//   2. block pitch: autocorrelation of the edge signal inside the bbox along x and y (blocks are drawn as a pixel grid).
//   3. cols × rows = bbox / pitch; box-downsample to that grid (and to an integer multiple for sub-block detail).
//
//   node benchmarks/gauntlet/sheet-trace.mjs <concept.jpg> [--out dir] [--scale 2]
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

function rgbOf(path) {
  const [w, h] = execFileSync("magick", [path, "-format", "%w %h", "info:"], { encoding: "utf8" }).trim().split(" ").map(Number);
  const buf = execFileSync("magick", [path, "-depth", "8", "rgb:-"], { maxBuffer: 1 << 28 });
  return { w, h, px: buf };
}

const runs = (flags) => {            // longest run of true values, tolerating gaps of up to 3
  let best = [0, -1], start = -1, gap = 0;
  for (let i = 0; i <= flags.length; i++) {
    if (i < flags.length && flags[i]) { if (start < 0) start = i; gap = 0; }
    else if (start >= 0 && (++gap > 3 || i === flags.length)) {
      const end = i - gap; if (end - start > best[1] - best[0]) best = [start, end]; start = -1; gap = 0;
    }
  }
  return best;
};

export function findElevation(path, given) {
  const { w, h, px } = rgbOf(path);
  const at = (x, y) => 3 * (y * w + x);
  // background = the median colour of the sheet's border strip
  const border = [];
  for (let x = 0; x < w; x += 4) for (const y of [2, h - 3]) border.push(at(x, y));
  for (let y = 0; y < h; y += 4) for (const x of [2, w - 3]) border.push(at(x, y));
  const bg = [0, 1, 2].map((c) => border.map((i) => px[i + c]).sort((a, b) => a - b)[border.length >> 1]);
  const half = Math.floor(w / 2);
  const fg = (x, y) => { const i = at(x, y); return Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]) > 60; };
  // rows: share of foreground in the left half; columns: share within the chosen rows
  const rowShare = Array.from({ length: h }, (_, y) => { let n = 0; for (let x = 0; x < half; x++) n += fg(x, y); return n / half; });
  let [y0, y1] = runs(rowShare.map((s) => s > 0.08));
  const colShare = Array.from({ length: half }, (_, x) => { let n = 0; for (let y = y0; y <= y1; y++) n += fg(x, y); return n / (y1 - y0 + 1); });
  let [x0, x1] = runs(colShare.map((s) => s > 0.12));
  if (given) { x0 = given.x; x1 = given.x + given.w - 1; y1 = given.y + given.h - 1; }
  // tighten top: the spire/finial is narrow, so walk up from y0 while any fg pixel sits inside [x0,x1]
  let top = y0;
  if (given) top = given.y;
  else for (let y = y0 - 1; y >= 0; y--) { let n = 0; for (let x = x0; x <= x1; x++) n += fg(x, y); if (n >= 2) top = y; else if (top - y > 3) break; }
  // pitch: autocorrelation of |gradient| along each axis
  const gray = (x, y) => { const i = at(x, y); return px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11; };
  const pitchAlong = (axis) => {
    const len = axis === "x" ? x1 - x0 : y1 - top, sig = new Float64Array(len);
    if (axis === "x") for (let x = x0; x < x1; x++) for (let y = top; y <= y1; y++) sig[x - x0] += Math.abs(gray(x + 1, y) - gray(x, y));
    else for (let y = top; y < y1; y++) for (let x = x0; x <= x1; x++) sig[y - top] += Math.abs(gray(x, y + 1) - gray(x, y));
    const mean = sig.reduce((a, b) => a + b, 0) / len; for (let i = 0; i < len; i++) sig[i] -= mean;
    const ac = (lag) => { let s = 0; for (let i = 0; i + lag < len; i++) s += sig[i] * sig[i + lag]; return s / (len - lag); };
    let best = 0, bestV = -Infinity; const vals = [];
    for (let lag = 5; lag <= Math.min(60, len / 6); lag++) vals[lag] = ac(lag);
    for (let lag = 6; lag < vals.length - 1; lag++) if (vals[lag] > vals[lag - 1] && vals[lag] >= vals[lag + 1] && vals[lag] > bestV) { bestV = vals[lag]; best = lag; }
    // prefer the fundamental: if half the lag is also a strong peak, take it
    const h2 = Math.round(best / 2); if (h2 >= 6 && vals[h2] > 0.8 * bestV) best = h2;
    return best;
  };
  // blocks are square; textures (brick courses, planks) add harmonics at 1/2, 1/4 of a block, so when one axis reads
  // about an integer multiple of the other, the larger is the block
  const px_ = pitchAlong("x"), py_ = pitchAlong("y");
  const hi = Math.max(px_, py_), lo = Math.min(px_, py_), k = hi / lo;
  const pitch = k > 1.6 && Math.abs(k - Math.round(k)) < 0.25 ? hi : (px_ + py_) / 2;
  const box = { x: x0, y: top, w: x1 - x0 + 1, h: y1 - top + 1 };
  return { box, pitch, pitchX: px_, pitchY: py_, cols: Math.round(box.w / pitch), rows: Math.round(box.h / pitch), bg };
}

export function traceElevation(path, dir, { scale = 1, box, cols: c, rows: r } = {}) {
  const f = c && r ? { box, cols: c, rows: r, pitch: box.w / c } : findElevation(path, box);
  mkdirSync(dir, { recursive: true });
  const cols = f.cols * scale, rows = f.rows * scale;
  const raw = join(dir, "trace-raw.png");
  execFileSync("magick", [path, "-crop", `${f.box.w}x${f.box.h}+${f.box.x}+${f.box.y}`, "+repage", "-filter", "box", "-resize", `${cols}x${rows}!`, raw]);
  const txt = execFileSync("magick", [raw, "txt:-"], { encoding: "utf8", maxBuffer: 1 << 26 });
  const grid = Array.from({ length: rows }, () => Array(cols).fill("------"));
  for (const m of txt.matchAll(/^(\d+),(\d+):.*#([0-9A-F]{6})/gim)) grid[+m[2]][+m[1]] = m[3].toLowerCase();
  writeFileSync(join(dir, "trace.txt"), [`# front elevation traced at ${cols} x ${rows} blocks; first row = top (y=${rows - 1}), last row = ground (y=0); x=0..${cols - 1} left to right; hex = mean colour`,
    ...grid.map((r, i) => `y${String(rows - 1 - i).padStart(2, "0")} ${r.join(" ")}`)].join("\n") + "\n");
  const cell = Math.max(8, Math.round(720 / rows));
  execFileSync("magick", [raw, "-filter", "point", "-scale", `${cols * cell}x${rows * cell}!`, "-fill", "none", "-stroke", "#0004",
    ...Array.from({ length: cols + 1 }, (_, i) => ["-draw", `line ${i * cell},0 ${i * cell},${rows * cell}`]).flat(),
    ...Array.from({ length: rows + 1 }, (_, i) => ["-draw", `line 0,${i * cell} ${cols * cell},${i * cell}`]).flat(), join(dir, "trace.png")]);
  return { ...f, scale, cols, rows, baseCols: f.cols, baseRows: f.rows };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const path = process.argv[2];
  const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
  const out = arg("--out");
  console.log(JSON.stringify(out ? traceElevation(path, out, { scale: Number(arg("--scale", 1)) }) : findElevation(path)));
}

// A vision model locates the elevation (pixel heuristics fail on white-on-white subjects and graph-paper sheets);
// the pixel pass still measures the block pitch, which models get wrong by up to 2x.
export async function locateWithGemini(path, model = process.env.MC_LOCATE_MODEL || "gemini-3.1-pro-preview") {
  const { readFileSync } = await import("node:fs");
  const key = process.env.GEMINI_API_KEY?.trim() || readFileSync(new URL("../../.env", import.meta.url), "utf8").match(/^GEMINI_API_KEY=(.*)$/m)[1].trim();
  const [w, h] = execFileSync("magick", [path, "-format", "%w %h", "info:"], { encoding: "utf8" }).trim().split(" ").map(Number);
  const body = { contents: [{ parts: [{ inlineData: { mimeType: /\.png$/i.test(path) ? "image/png" : "image/jpeg", data: readFileSync(path).toString("base64") } },
    { text: "This is a Minecraft builder's reference sheet. Detect the FRONT ELEVATION drawing of the building (the flat, straight-on view; not the 3/4 view, not labels, not swatches). The box must include the whole building: every tower, minaret, spire tip, finial, parapet and the plinth or base, and nothing else. Reply JSON: {\"box_2d\": [ymin, xmin, ymax, xmax]} normalised 0-1000." }] }],
    generationConfig: { responseMimeType: "application/json" } };
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  const [ymin, xmin, ymax, xmax] = JSON.parse(j.candidates[0].content.parts.map((p) => p.text).join("")).box_2d;
  return { x: Math.round(xmin / 1000 * w), y: Math.round(ymin / 1000 * h), w: Math.round((xmax - xmin) / 1000 * w), h: Math.round((ymax - ymin) / 1000 * h) };
}
