// RESEMBLANCE GATE — pure core (T-076-01, story S-076, epic E-22). The number that measures the REAL goal:
// does the Minecraft build LOOK LIKE its immutable references (the concept image + the GLB mesh)?
//
// E-15..E-20 hill-climbed proxy metrics (speckle/distinct/IoU/valueΔE) that read perfect on a build that
// rendered as grey static — the wrong target (memory: render-aliasing-not-material-speckle). T-075-01 fixed
// the render LENS; this module scores RESEMBLANCE. Per the E-22 rules of engagement: the references are
// IMMUTABLE (Rule 1); the TRIPTYCH a human inspects is the verdict, these scores only EXPLAIN it (Rule 2);
// the judge prompt + thresholds are FIXED (Rule 5); the gap is NAMED, not hidden (Rule 7).
//
// THIS FILE IS PURE: no GL, no model, no file/network I/O, no Date/random — so it runs under the root
// `src/**/*.test.mjs` glob. The impure runner (benchmarks/sculpture/resemblance.mjs) owns the GL re-render,
// image decode/encode, the metered `claude -p` judge call, label drawing, and file I/O. The block→Lab table
// is INJECTED (a loadBlockTable() result) so the core never touches the filesystem.
//
// THREE PARTS:
//   1. perceptual scorer (DIAGNOSTIC, Rule 2): silhouette FORM IoU (reuse form-fidelity) + a block-grounded
//      MATERIAL agreement (set: same materials? + zone: in the same places?), both snapped to block-table Lab.
//   2. triptych compose MATH (the assembly is impure; the paste/resize is pure here).
//   3. the categorical judge PROMPT (fixed) + the verdict PARSER (the live call is metered, elsewhere).
//
// HONESTY LEDGER (what these numbers can and cannot see — mirrors form-fidelity's):
//   - SINGLE 3/4 VIEW; the concept is only APPROXIMATELY that view (Nano-Banana), so absolute IoU / zone ΔE
//     are depressed by camera mismatch — the RELATIVE/CATEGORICAL signal is the worth, not the absolute.
//   - ZONING is read from RENDER PIXELS (the build's appearance), not 3-D block positions — the artifact has
//     no 2-D projection without the GL camera. A rough zoning proxy, DIAGNOSTIC under Rule 2.
//   - SILHOUETTE ≠ FORM and a palette match ≠ a good build. The verdict is the judge + the human triptych.

import { extractSilhouette, normalizeSilhouette, iou, RENDER_BG, CONCEPT_BG } from "./form-fidelity.mjs";
import { srgbToLab, deltaE76, nearestLab } from "../color/cielab.mjs";
import { aggregateForeground, medianCutLab, isBackground } from "../color/palette-extract.mjs";
import { stripToJson } from "../sdk-binding.mjs";

/** Schema tags (downstream version-check). */
export const RESEMBLANCE_SCHEMA = "resemblance/v1";
export const RESEMBLANCE_VERDICT_SCHEMA = "resemblance-verdict/v1";

/** The fixed categorical verdict vocabulary + named-gap attributes (Rule 5 — never widened per-run). */
export const VERDICTS = Object.freeze(["same object", "drifted", "different object"]);
export const GAP_ATTRS = Object.freeze(["form", "massing", "material zoning", "palette"]);

/** Fixed thresholds (Rule 5). One frozen knob-set; S-077 reuses it unchanged across subjects. */
export const RESEMBLANCE_DEFAULTS = Object.freeze({
  grid: 128, // form-IoU normalization grid (matches FORM_DEFAULTS.grid)
  fit: "aspect", // preserve proportion (proportion IS form)
  zoneGrid: 8, // Z×Z material-zoning grid over the foreground bbox
  topK: 6, // build dominant blocks scored
  conceptK: 6, // concept median-cut clusters
  deltaESet: 18, // set-agreement match radius (Lab ΔE76)
  deltaEZone: 22, // zone-agreement match radius (Lab ΔE76)
  panel: 512, // triptych panel size (square, px)
  gutter: 8, // triptych separator width (px)
});

const round2 = (n) => Math.round(n * 100) / 100;
const round3 = (n) => Math.round(n * 1000) / 1000;
const isImg = (x) => x && x.data && x.width > 0 && x.height > 0;

// --- form half (reuse extractSilhouette / rasterizeSilhouette result / iou) -------------------------------

/**
 * Silhouette FORM IoU of the Minecraft render against both references. PURE.
 * @param {object} renderImg  decoded {width,height,data} of the (fixed-lens) Minecraft render
 * @param {object} conceptImg decoded {width,height,data} of the concept image
 * @param {{w:number,h:number,data:Uint8Array,bbox:object|null}} meshSil  a rasterizeSilhouette() result
 * @returns {{meshIoU:number, conceptIoU:number, grid:number, fit:string}}
 */
export function formScores(renderImg, conceptImg, meshSil, opts = {}) {
  const grid = opts.grid ?? RESEMBLANCE_DEFAULTS.grid;
  const fit = opts.fit ?? RESEMBLANCE_DEFAULTS.fit;
  const rNorm = normalizeSilhouette(extractSilhouette(renderImg, RENDER_BG), { grid, fit });
  const result = { meshIoU: null, conceptIoU: null, grid, fit };
  if (meshSil) {
    result.meshIoU = round3(iou(rNorm, normalizeSilhouette(meshSil, { grid, fit })));
  }
  if (isImg(conceptImg)) {
    const cNorm = normalizeSilhouette(extractSilhouette(conceptImg, CONCEPT_BG), { grid, fit });
    result.conceptIoU = round3(iou(rNorm, cNorm));
  }
  return result;
}

// --- material half (block-table grounded) ---------------------------------------------------------------

/** Block-table → a nearestLab palette `[{key, lab}]` (one pass; the snap vocabulary). PURE. */
function tablePalette(blockTable) {
  if (!blockTable?.blocks?.length) throw new Error("resemblance: blockTable must be a loadBlockTable() result");
  return blockTable.blocks.map((b) => ({ key: b.block, lab: b.lab }));
}
const bareBlock = (id) => String(id).replace(/^minecraft:/, "");

/**
 * The build's dominant block colors: top-K block IDs from the artifact's placements, joined to the table
 * for Lab. Unknown IDs (not in the table) are skipped. PURE.
 * @returns {Array<{block:string, count:number, lab:number[]}>}
 */
export function buildPalette(artifact, blockTable, opts = {}) {
  const topK = opts.topK ?? RESEMBLANCE_DEFAULTS.topK;
  const byBlock = new Map(blockTable.blocks.map((b) => [b.block, b]));
  const counts = new Map();
  for (const p of artifact?.placements ?? []) {
    const k = bareBlock(p.block);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([block, count]) => ({ block, count, lab: byBlock.get(block)?.lab ?? null }))
    .filter((e) => e.lab) // drop blocks absent from the table
    .sort((a, b) => b.count - a.count || (a.block < b.block ? -1 : 1))
    .slice(0, topK);
}

/**
 * SET agreement — do the build and concept use the SAME materials at all (ignoring where)? Symmetric
 * coverage: fraction of build block colors with a concept color within `deltaESet`, averaged with the
 * reverse. 1 = same palette, 0 = disjoint. PURE.
 * @param {Array<{lab:number[]}>} buildPal   build block palette (table Lab)
 * @param {Array<{lab:number[]}>} conceptPal concept cluster centroids (Lab)
 * @returns {{score:number|null, buildCovered:number, conceptCovered:number}}
 */
export function setAgreement(buildPal, conceptPal, opts = {}) {
  const r = opts.deltaESet ?? RESEMBLANCE_DEFAULTS.deltaESet;
  if (!buildPal?.length || !conceptPal?.length) return { score: null, buildCovered: 0, conceptCovered: 0 };
  const covered = (from, to) => from.filter((a) => to.some((b) => deltaE76(a.lab, b.lab) <= r)).length / from.length;
  const buildCovered = covered(buildPal, conceptPal);
  const conceptCovered = covered(conceptPal, buildPal);
  return { score: round3((buildCovered + conceptCovered) / 2), buildCovered: round3(buildCovered), conceptCovered: round3(conceptCovered) };
}

/** Mean Lab of the FOREGROUND pixels inside a source rect `[x0,x1)×[y0,y1)`, or null if none. PURE. */
function cellMeanLab(img, bgOpts, x0, y0, x1, y1) {
  const { width: w, data } = img;
  let n = 0, R = 0, G = 0, B = 0;
  for (let y = y0; y < y1; y++) {
    const row = y * w;
    for (let x = x0; x < x1; x++) {
      const i = (row + x) << 2;
      if (isBackground(data[i], data[i + 1], data[i + 2], data[i + 3], bgOpts)) continue;
      R += data[i]; G += data[i + 1]; B += data[i + 2]; n++;
    }
  }
  return n === 0 ? null : srgbToLab([R / n, G / n, B / n]);
}

/** Per-image Z×Z zone map over the foreground bbox: each cell's mean-fg Lab snapped to a table block. PURE. */
function zoneMap(img, bgOpts, palette, Z) {
  const sil = extractSilhouette(img, bgOpts);
  const bb = sil.bbox;
  const cells = new Array(Z * Z).fill(null);
  if (!bb) return cells;
  const bw = bb.x1 - bb.x0, bh = bb.y1 - bb.y0;
  for (let cy = 0; cy < Z; cy++) {
    const y0 = bb.y0 + Math.floor((cy * bh) / Z);
    const y1 = bb.y0 + Math.floor(((cy + 1) * bh) / Z);
    for (let cx = 0; cx < Z; cx++) {
      const x0 = bb.x0 + Math.floor((cx * bw) / Z);
      const x1 = bb.x0 + Math.floor(((cx + 1) * bw) / Z);
      const lab = cellMeanLab(img, bgOpts, x0, y0, Math.max(x1, x0 + 1), Math.max(y1, y0 + 1));
      if (lab) {
        const hit = nearestLab(lab, palette);
        cells[cy * Z + cx] = { block: hit.key, lab: hit.lab };
      }
    }
  }
  return cells;
}

/**
 * ZONE agreement — are the materials in the SAME PLACES? Overlay a Z×Z grid on each image's foreground
 * bbox (translation/scale normalized), snap each cell's mean-fg color to a table block, and compare
 * corresponding cells where BOTH sides have foreground. `score` = fraction of common cells within
 * `deltaEZone`; `meanDeltaE` = mean per-cell ΔE. DIAGNOSTIC (render-pixel proxy, Rule 2). PURE.
 * @returns {{score:number|null, meanDeltaE:number|null, zoneGrid:number, common:number,
 *            zones:{build:Array, concept:Array}}}
 */
export function zoneAgreement(renderImg, conceptImg, blockTable, opts = {}) {
  const Z = opts.zoneGrid ?? RESEMBLANCE_DEFAULTS.zoneGrid;
  const r = opts.deltaEZone ?? RESEMBLANCE_DEFAULTS.deltaEZone;
  const palette = tablePalette(blockTable);
  const bMap = zoneMap(renderImg, RENDER_BG, palette, Z);
  const cMap = zoneMap(conceptImg, CONCEPT_BG, palette, Z);
  let common = 0, within = 0, sumDE = 0;
  for (let i = 0; i < Z * Z; i++) {
    if (bMap[i] && cMap[i]) {
      const de = deltaE76(bMap[i].lab, cMap[i].lab);
      common++; sumDE += de;
      if (de <= r) within++;
    }
  }
  const namesOf = (m) => m.map((c) => (c ? c.block : null));
  return {
    score: common === 0 ? null : round3(within / common),
    meanDeltaE: common === 0 ? null : round2(sumDE / common),
    zoneGrid: Z,
    common,
    zones: { build: namesOf(bMap), concept: namesOf(cMap) },
  };
}

// --- the perceptual row (orchestrator, pure) ------------------------------------------------------------

/**
 * THE PERCEPTUAL RESEMBLANCE ROW (DIAGNOSTIC, Rule 2). Form (vs mesh + concept) + material (set + zone),
 * block-grounded. PURE — operates on already-decoded images + an injected block table; output rounded/stable.
 * @param {{renderImg:object, conceptImg:object, meshSil:object, artifact:object, blockTable:object,
 *          subject?:string, references?:object}} input
 * @returns {{schema:string, subject:string, form:object, material:object, references:object, note:string}}
 */
export function resemblanceRow(input, opts = {}) {
  const { renderImg, conceptImg, meshSil, artifact, blockTable, subject = "subject", references = {} } = input;
  if (!isImg(renderImg)) throw new Error("resemblanceRow: renderImg must be a decoded {width,height,data}");

  const form = formScores(renderImg, conceptImg, meshSil, opts);

  const buildPal = buildPalette(artifact, blockTable, opts);
  const conceptClusters = isImg(conceptImg)
    ? medianCutLab(aggregateForeground(conceptImg, CONCEPT_BG).points, opts.conceptK ?? RESEMBLANCE_DEFAULTS.conceptK)
    : [];
  const set = setAgreement(buildPal, conceptClusters, opts);
  // snap concept clusters to table blocks for the diagnostic name list (block vocabulary)
  const palette = tablePalette(blockTable);
  const conceptBlocks = conceptClusters.map((c) => nearestLab(c.lab, palette).key);
  const zone = zoneAgreement(renderImg, conceptImg, blockTable, opts);

  return {
    schema: RESEMBLANCE_SCHEMA,
    subject,
    form,
    material: {
      set: { score: set.score, buildCovered: set.buildCovered, conceptCovered: set.conceptCovered,
        build: buildPal.map((e) => ({ block: e.block, count: e.count })), concept: conceptBlocks },
      zone,
    },
    references, // immutable inputs echoed (Rule 1) — paths set by the runner
    note: "diagnostic, not the verdict — the triptych + the categorical judge are the verdict (E-22 Rule 2)",
  };
}

// --- triptych compose math (pure; the assembly/encode is impure in the runner) ---------------------------

const WHITE = Object.freeze([255, 255, 255, 255]);

/**
 * Box-filter resize of an RGBA image into `W×H`. `fit:'aspect'` letterboxes (proportion preserved, margins
 * filled with `opts.bg`); `fit:'stretch'` fills. Inverse-map: each target pixel averages the source window
 * it covers (correct for down- and up-sampling). PURE.
 * @returns {{w:number,h:number,data:Uint8Array}}
 */
export function resampleRgba(img, W, H, fit = "aspect", opts = {}) {
  if (!isImg(img)) throw new Error("resampleRgba: img must be {width,height,data}");
  if (!Number.isInteger(W) || !Number.isInteger(H) || W < 1 || H < 1) throw new Error("resampleRgba: W,H must be positive integers");
  const bg = opts.bg ?? WHITE;
  const { width: sw, height: sh, data: sd } = img;
  const out = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) { const o = i << 2; out[o] = bg[0]; out[o + 1] = bg[1]; out[o + 2] = bg[2]; out[o + 3] = bg[3]; }
  // content rect inside W×H
  let tw, th, ox, oy;
  if (fit === "stretch") { tw = W; th = H; ox = 0; oy = 0; }
  else {
    const s = Math.min(W / sw, H / sh);
    tw = Math.max(1, Math.round(sw * s)); th = Math.max(1, Math.round(sh * s));
    ox = Math.floor((W - tw) / 2); oy = Math.floor((H - th) / 2);
  }
  for (let ty = 0; ty < th; ty++) {
    let sy0 = Math.floor((ty * sh) / th); let sy1 = Math.floor(((ty + 1) * sh) / th); if (sy1 <= sy0) sy1 = sy0 + 1;
    for (let tx = 0; tx < tw; tx++) {
      let sx0 = Math.floor((tx * sw) / tw); let sx1 = Math.floor(((tx + 1) * sw) / tw); if (sx1 <= sx0) sx1 = sx0 + 1;
      let R = 0, G = 0, B = 0, A = 0, n = 0;
      for (let sy = sy0; sy < sy1; sy++) { const row = sy * sw; for (let sx = sx0; sx < sx1; sx++) { const i = (row + sx) << 2; R += sd[i]; G += sd[i + 1]; B += sd[i + 2]; A += sd[i + 3]; n++; } }
      const o = ((oy + ty) * W + (ox + tx)) << 2;
      out[o] = Math.round(R / n); out[o + 1] = Math.round(G / n); out[o + 2] = Math.round(B / n); out[o + 3] = Math.round(A / n);
    }
  }
  return { w: W, h: H, data: out };
}

/** A binary silhouette → an RGBA panel (foreground `fg` on background `bg`). PURE. */
export function silhouetteToRgba(sil, opts = {}) {
  const fg = opts.fg ?? [110, 110, 110, 255];
  const bg = opts.bg ?? WHITE;
  const { w, h, data } = sil;
  const out = new Uint8Array(w * h * 4);
  for (let p = 0; p < w * h; p++) { const o = p << 2; const c = data[p] ? fg : bg; out[o] = c[0]; out[o + 1] = c[1]; out[o + 2] = c[2]; out[o + 3] = c[3]; }
  return { w, h, data: out };
}

/**
 * Paste three equal-sized RGBA panels left→right (concept | mesh | minecraft) with separator gutters into
 * one RGBA buffer. PURE — the math; node-canvas labels + PNG encode are the runner's impure job.
 * @param {Array<{w:number,h:number,data:Uint8Array}>} panels exactly 3, all same w×h
 * @returns {{w:number,h:number,data:Uint8Array}}
 */
export function composeTriptych(panels, opts = {}) {
  if (!Array.isArray(panels) || panels.length !== 3) throw new Error("composeTriptych: exactly 3 panels required");
  const { w: pw, h: ph } = panels[0];
  for (const p of panels) if (p.w !== pw || p.h !== ph) throw new Error("composeTriptych: panels must share dimensions");
  const gutter = opts.gutter ?? RESEMBLANCE_DEFAULTS.gutter;
  const sep = opts.sep ?? [40, 40, 40, 255];
  const W = pw * 3 + gutter * 2;
  const H = ph;
  const out = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) { const o = i << 2; out[o] = sep[0]; out[o + 1] = sep[1]; out[o + 2] = sep[2]; out[o + 3] = sep[3]; }
  panels.forEach((panel, idx) => {
    const xoff = idx * (pw + gutter);
    for (let y = 0; y < ph; y++) {
      for (let x = 0; x < pw; x++) {
        const s = (y * pw + x) << 2;
        const d = (y * W + (xoff + x)) << 2;
        out[d] = panel.data[s]; out[d + 1] = panel.data[s + 1]; out[d + 2] = panel.data[s + 2]; out[d + 3] = panel.data[s + 3];
      }
    }
  });
  return { w: W, h: H, data: out };
}

// --- the categorical judge: fixed prompt + pure verdict parser ------------------------------------------

/** The FIXED judge prompt (Rule 5). Sees the assembled triptych; rules a 3-way verdict + one named gap. */
export function buildResemblancePrompt() {
  return [
    "You are judging visual RESEMBLANCE for a Minecraft design evaluation.",
    "The single image is a TRIPTYCH of three panels, left to right:",
    "  1. CONCEPT — the reference concept image (the intended look).",
    "  2. MESH — a silhouette of the reference 3-D mesh (the intended form/massing).",
    "  3. MINECRAFT — the build being judged.",
    "Decide whether the MINECRAFT panel depicts the SAME OBJECT as the references, has DRIFTED,",
    "or is a DIFFERENT OBJECT.",
    `  - "same object": clearly the same thing; form, massing, material zoning, and palette all read true.`,
    `  - "drifted": recognizably related but with a real defect in form, massing, material zoning, or palette.`,
    `  - "different object": you would not identify it as the same subject.`,
    "If the verdict is NOT \"same object\", name exactly ONE gap: the REGION (where, in plain words) and the",
    "ATTRIBUTE, which must be one of: form, massing, material zoning, palette.",
    "Reply with STRICT JSON only, no prose, in this exact shape:",
    '{"verdict":"same object|drifted|different object","gap":{"region":"...","attribute":"form|massing|material zoning|palette"}|null,"rationale":"one sentence"}',
    'When the verdict is "same object", set "gap" to null.',
  ].join("\n");
}

/**
 * Parse + VALIDATE a judge reply into a verdict record. PURE (the live call is metered, elsewhere). Throws a
 * precise error on any contract violation so the runner can record an honest "unparsed" instead of guessing.
 * @param {string} text  raw model text (may be fenced / wrapped in prose)
 * @returns {{schema:string, verdict:string, gap:{region:string,attribute:string}|null, rationale:string}}
 */
export function parseResemblanceVerdict(text) {
  if (typeof text !== "string" || !text.trim()) throw new Error("parseResemblanceVerdict: empty response");
  let obj;
  try {
    obj = JSON.parse(stripToJson(text));
  } catch (e) {
    throw new Error(`parseResemblanceVerdict: response is not JSON (${e.message})`);
  }
  if (!obj || typeof obj !== "object") throw new Error("parseResemblanceVerdict: not an object");
  const { verdict, gap, rationale } = obj;
  if (!VERDICTS.includes(verdict)) {
    throw new Error(`parseResemblanceVerdict: verdict must be one of ${VERDICTS.join(" | ")}, got ${JSON.stringify(verdict)}`);
  }
  const sameObject = verdict === "same object";
  let cleanGap = null;
  if (sameObject) {
    if (gap != null) throw new Error('parseResemblanceVerdict: "same object" must have a null gap (Rule 7 integrity)');
  } else {
    if (!gap || typeof gap !== "object") throw new Error(`parseResemblanceVerdict: "${verdict}" requires a {region,attribute} gap (Rule 7)`);
    if (typeof gap.region !== "string" || !gap.region.trim()) throw new Error("parseResemblanceVerdict: gap.region must be a non-empty string");
    if (!GAP_ATTRS.includes(gap.attribute)) {
      throw new Error(`parseResemblanceVerdict: gap.attribute must be one of ${GAP_ATTRS.join(" | ")}, got ${JSON.stringify(gap.attribute)}`);
    }
    cleanGap = { region: gap.region.trim(), attribute: gap.attribute };
  }
  return {
    schema: RESEMBLANCE_VERDICT_SCHEMA,
    verdict,
    gap: cleanGap,
    rationale: typeof rationale === "string" ? rationale.trim() : "",
  };
}
