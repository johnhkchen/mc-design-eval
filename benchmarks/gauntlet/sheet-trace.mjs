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
// Locate the elevation: Gemini's detection when available, else Claude (rough box), then a pixel pass tightens either
// box to the drawing's real edges, so the model's box only has to be roughly right.
export async function locateWithGemini(path, model, target) {
  let box;
  try { box = await locateGemini(path, model || process.env.MC_LOCATE_MODEL || "gemini-3.1-pro-preview", target); }
  catch { box = await locateClaude(path, target); }
  return refineBox(path, box);
}

async function locateClaude(path, target) {
  const { readFileSync } = await import("node:fs");
  const { requestTextWithImage } = await import("../../src/sdk-binding.mjs");
  const [w, h] = execFileSync("magick", [path, "-format", "%w %h", "info:"], { encoding: "utf8" }).trim().split(" ").map(Number);
  const what = target || "the FRONT ELEVATION drawing of the building (the flat, straight-on view; not the 3/4 view, not labels, not swatches), including every tower, spire, chimney, parapet and the base";
  let r;
  for (let attempt = 1; ; attempt++) {   // claude -p occasionally returns no result; retry a few times
    try { r = await requestTextWithImage({
    prompt: `This image is ${w} x ${h} pixels. Give the bounding box of ${what}. Reply ONLY JSON: {"box_2d": [ymin, xmin, ymax, xmax]} normalised 0-1000.`,
    images: [{ data: readFileSync(path), mediaType: /\.png$/i.test(path) ? "image/png" : "image/jpeg" }], model: process.env.MC_LOCATE_CLAUDE || "claude-sonnet-5-5", effort: "low",
    }); if (r.text.includes("box_2d")) break; } catch (e) { if (attempt >= 4) throw e; }
    if (attempt >= 4) break;
  }
  const [ymin, xmin, ymax, xmax] = JSON.parse(r.text.slice(r.text.indexOf("{"), r.text.lastIndexOf("}") + 1)).box_2d;
  return { x: Math.round(xmin / 1000 * w), y: Math.round(ymin / 1000 * h), w: Math.round((xmax - xmin) / 1000 * w), h: Math.round((ymax - ymin) / 1000 * h) };
}

/** Grow the box by a margin, then shrink it to the pixels that differ from the sheet background (rows/columns with at
 *  least a sliver of foreground), never past the region between the box and its neighbours. */
export function refineBox(path, box, { margin = 0.06 } = {}) {
  const { w, h, px } = rgbOf(path);
  const at = (x, y) => 3 * (y * w + x);
  const border = [];
  for (let x = 0; x < w; x += 4) for (const y of [2, h - 3]) border.push(at(x, y));
  for (let y = 0; y < h; y += 4) for (const x of [2, w - 3]) border.push(at(x, y));
  const bg = [0, 1, 2].map((c) => border.map((i) => px[i + c]).sort((a, b) => a - b)[border.length >> 1]);
  const fg = (x, y) => { const i = at(x, y); return Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]) > 45; };
  const mx = Math.round(box.w * margin), my = Math.round(box.h * margin);
  const X0 = Math.max(0, box.x - mx), X1 = Math.min(w - 1, box.x + box.w + mx), Y0 = Math.max(0, box.y - my), Y1 = Math.min(h - 1, box.y + box.h + my);
  const colHas = (x) => { let n = 0; for (let y = Y0; y <= Y1; y++) n += fg(x, y); return n >= 3; };
  const rowHas = (y, a, b) => { let n = 0; for (let x = a; x <= b; x++) n += fg(x, y); return n >= 3; };
  // shrink from each side while the edge column/row is empty; stop at the drawing
  let a = X0, b = X1, c = Y0, d = Y1;
  while (a < b && !colHas(a)) a++;
  while (b > a && !colHas(b)) b--;
  while (c < d && !rowHas(c, a, b)) c++;
  while (d > c && !rowHas(d, a, b)) d--;
  return { x: a, y: c, w: b - a + 1, h: d - c + 1 };
}

async function locateGemini(path, model, target) {
  const { readFileSync } = await import("node:fs");
  const key = process.env.GEMINI_API_KEY?.trim() || readFileSync(new URL("../../.env", import.meta.url), "utf8").match(/^GEMINI_API_KEY=(.*)$/m)[1].trim();
  const [w, h] = execFileSync("magick", [path, "-format", "%w %h", "info:"], { encoding: "utf8" }).trim().split(" ").map(Number);
  const body = { contents: [{ parts: [{ inlineData: { mimeType: /\.png$/i.test(path) ? "image/png" : "image/jpeg", data: readFileSync(path).toString("base64") } },
    { text: target ? `Detect ${target} in this image. The box must include the whole drawing of the building and nothing else (not the background). Reply JSON: {"box_2d": [ymin, xmin, ymax, xmax]} normalised 0-1000.` : "This is a Minecraft builder's reference sheet. Detect the FRONT ELEVATION drawing of the building (the flat, straight-on view; not the 3/4 view, not labels, not swatches). The box must include the whole building: every tower, minaret, spire tip, finial, parapet and the plinth or base, and nothing else. Reply JSON: {\"box_2d\": [ymin, xmin, ymax, xmax]} normalised 0-1000." }] }],
    generationConfig: { responseMimeType: "application/json" } };
  let ymin, xmin, ymax, xmax;
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      let o = JSON.parse(j.candidates[0].content.parts.map((p) => p.text).join(""));
      if (Array.isArray(o)) o = Array.isArray(o[0]) || typeof o[0] === "number" ? { box_2d: Array.isArray(o[0]) ? o[0] : o } : o[0];
      [ymin, xmin, ymax, xmax] = o.box_2d;
      break;
    } catch (e) { if (attempt >= 3) throw e; }
  }
  return { x: Math.round(xmin / 1000 * w), y: Math.round(ymin / 1000 * h), w: Math.round((xmax - xmin) / 1000 * w), h: Math.round((ymax - ymin) / 1000 * h) };
}

// For crisp pixel art (a redraw): find the grid's pitch AND phase, snap the located box to grid lines, and read each
// cell's centre colour, so cells never blend with their neighbours.
export function traceCrisp(path, dir, box) {
  const { w, h, px } = rgbOf(path);
  const at = (x, y) => 3 * (y * w + x);
  const gray = (x, y) => { const i = at(x, y); return px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11; };
  const f = findElevation(path, box);
  const p = f.pitch;
  const phase = (axis) => {          // grid offset that puts most edge energy on grid lines
    const e = new Float64Array(Math.ceil(p));
    if (axis === "x") { for (let x = box.x; x < box.x + box.w - 1; x++) for (let y = box.y; y < box.y + box.h; y += 2) e[Math.floor(x % p)] += Math.abs(gray(x + 1, y) - gray(x, y)); }
    else { for (let y = box.y; y < box.y + box.h - 1; y++) for (let x = box.x; x < box.x + box.w; x += 2) e[Math.floor(y % p)] += Math.abs(gray(x, y + 1) - gray(x, y)); }
    return e.indexOf(Math.max(...e)) + 0.5;
  };
  const ox = phase("x"), oy = phase("y");
  const snap = (v, o) => o + Math.round((v - o) / p) * p;
  const x0 = snap(box.x, ox), x1 = snap(box.x + box.w, ox), y0 = snap(box.y, oy), y1 = snap(box.y + box.h, oy);
  const cols = Math.round((x1 - x0) / p), rows = Math.round((y1 - y0) / p);
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {   // median of the central half of the cell
      const vals = [[], [], []];
      for (let y = Math.round(y0 + (r + 0.25) * p); y < y0 + (r + 0.75) * p; y++) for (let x = Math.round(x0 + (c + 0.25) * p); x < x0 + (c + 0.75) * p; x++) {
        if (x < 0 || y < 0 || x >= w || y >= h) continue; const i = at(x, y); for (let k = 0; k < 3; k++) vals[k].push(px[i + k]);
      }
      row.push(vals.map((v) => v.sort((a, b) => a - b)[v.length >> 1] ?? 0));
    }
    grid.push(row);
  }
  mkdirSync(dir, { recursive: true });
  const hex = (c) => c.map((v) => v.toString(16).padStart(2, "0")).join("");
  writeFileSync(join(dir, "trace.txt"), [`# front elevation traced at ${cols} x ${rows} blocks; first row = top (y=${rows - 1}), last row = ground (y=0); x=0..${cols - 1} left to right; hex = cell colour`,
    ...grid.map((r, i) => `y${String(rows - 1 - i).padStart(2, "0")} ${r.map(hex).join(" ")}`)].join("\n") + "\n");
  const raw = join(dir, "trace-raw.png");
  execFileSync("magick", ["-size", `${cols}x${rows}`, "-depth", "8", "rgb:-", raw], { input: Buffer.from(grid.flat(2)) });
  const cell = Math.max(8, Math.round(720 / rows));
  execFileSync("magick", [raw, "-filter", "point", "-scale", `${cols * cell}x${rows * cell}!`, "-fill", "none", "-stroke", "#0004",
    ...Array.from({ length: cols + 1 }, (_, i) => ["-draw", `line ${i * cell},0 ${i * cell},${rows * cell}`]).flat(),
    ...Array.from({ length: rows + 1 }, (_, i) => ["-draw", `line 0,${i * cell} ${cols * cell},${i * cell}`]).flat(), join(dir, "trace.png")]);
  return { box: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, pitch: p, cols, rows, scale: 1 };
}

// How well is this image really drawn on a cols x rows block grid? Search grid sizes near the target and small box
// offsets; score = mean deviation of pixels from their cell's median colour (low = flat cells = truly that grid).
// Returns the best fit and writes the cell-centre tracing for it.
export function fitGrid(path, dir, box, gc, gr, { spread = 2 } = {}) {
  const { w, h, px } = rgbOf(path);
  const at = (x, y) => 3 * (y * w + x);
  let best = null;
  for (let cols = gc - spread; cols <= gc + spread; cols++) for (let rows = gr - spread; rows <= gr + spread; rows++) {
    const pw = box.w / cols, ph = box.h / rows;
    for (const dx of [-0.4, -0.2, 0, 0.2, 0.4]) for (const dy of [-0.4, -0.2, 0, 0.2, 0.4]) {
      const x0 = box.x + dx * pw, y0 = box.y + dy * ph;
      let dev = 0, n = 0; const grid = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          const vals = [[], [], []];
          for (let y = Math.round(y0 + (r + 0.15) * ph); y < y0 + (r + 0.85) * ph; y += 2) for (let x = Math.round(x0 + (c + 0.15) * pw); x < x0 + (c + 0.85) * pw; x += 2) {
            if (x < 0 || y < 0 || x >= w || y >= h) continue; const i = at(x, y); for (let k = 0; k < 3; k++) vals[k].push(px[i + k]);
          }
          const med = vals.map((v) => [...v].sort((a, b) => a - b)[v.length >> 1] ?? 0);
          for (let j = 0; j < vals[0].length; j++) { dev += Math.abs(vals[0][j] - med[0]) + Math.abs(vals[1][j] - med[1]) + Math.abs(vals[2][j] - med[2]); n++; }
          row.push(med);
        }
        grid.push(row);
      }
      const score = dev / Math.max(1, n);
      if (!best || score < best.score) best = { score, cols, rows, grid, box: { x: x0, y: y0, w: box.w, h: box.h } };
    }
  }
  mkdirSync(dir, { recursive: true });
  const { cols, rows, grid } = best;
  const hex = (c) => c.map((v) => v.toString(16).padStart(2, "0")).join("");
  writeFileSync(join(dir, "trace.txt"), [`# front elevation traced at ${cols} x ${rows} blocks; first row = top (y=${rows - 1}), last row = ground (y=0); x=0..${cols - 1} left to right; hex = cell colour`,
    ...grid.map((r, i) => `y${String(rows - 1 - i).padStart(2, "0")} ${r.map(hex).join(" ")}`)].join("\n") + "\n");
  const raw = join(dir, "trace-raw.png");
  execFileSync("magick", ["-size", `${cols}x${rows}`, "-depth", "8", "rgb:-", raw], { input: Buffer.from(grid.flat(2)) });
  const cell = Math.max(8, Math.round(720 / rows));
  execFileSync("magick", [raw, "-filter", "point", "-scale", `${cols * cell}x${rows * cell}!`, "-fill", "none", "-stroke", "#0004",
    ...Array.from({ length: cols + 1 }, (_, i) => ["-draw", `line ${i * cell},0 ${i * cell},${rows * cell}`]).flat(),
    ...Array.from({ length: rows + 1 }, (_, i) => ["-draw", `line 0,${i * cell} ${cols * cell},${i * cell}`]).flat(), join(dir, "trace.png")]);
  return { cols, rows, score: +best.score.toFixed(1), box: best.box, scale: 1 };
}
