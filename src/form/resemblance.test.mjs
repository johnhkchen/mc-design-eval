// Unit tests for the resemblance-gate pure core (T-076-01). GL-free, model-free, file-free — runs under the
// root `npm test` glob. Synthetic decoded RGBA images + a synthetic block table; nothing mocked.

import { test } from "node:test";
import assert from "node:assert/strict";

import { srgbToLab } from "../color/cielab.mjs";
import {
  formScores,
  buildPalette,
  setAgreement,
  zoneAgreement,
  resemblanceRow,
  resampleRgba,
  silhouetteToRgba,
  composeTriptych,
  buildResemblancePrompt,
  parseResemblanceVerdict,
  consolidateResemblance,
  RESEMBLANCE_SCHEMA,
  RESEMBLANCE_VERDICT_SCHEMA,
  RESEMBLANCE_CONSOLIDATION_SCHEMA,
  MATERIAL_GAP_ATTRS,
  VERDICTS,
  GAP_ATTRS,
} from "./resemblance.mjs";

// --- helpers -------------------------------------------------------------------------------------------

/** A W×H RGBA image whose pixel color is decided by fn(x,y) → [r,g,b,a]. */
function img(W, H, fn) {
  const data = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const [r, g, b, a] = fn(x, y);
    const o = (y * W + x) << 2;
    data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = a ?? 255;
  }
  return { width: W, height: H, data };
}
const solid = (W, H, c) => img(W, H, () => c);
/** A {w,h,data} RGBA panel of a solid color (compose/silhouette shape, not image shape). */
const panel = (w, h, c) => ({ w, h, data: img(w, h, () => c).data });
/** A centered foreground square of color `fg` on background `bg`. */
function squareOn(W, H, bg, fg, m = 4) {
  return img(W, H, (x, y) => (x >= m && x < W - m && y >= m && y < H - m ? fg : bg));
}
/** A silhouette mask (extractSilhouette-shaped) with a centered foreground square. */
function maskSquare(w, h, m = 4) {
  const data = new Uint8Array(w * h);
  let fg = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x >= m && x < w - m && y >= m && y < h - m) { data[y * w + x] = 1; fg++; }
  return { w, h, data, fgCount: fg, bbox: { x0: m, y0: m, x1: w - m, y1: h - m } };
}

const SKY = [173, 216, 230, 255]; // RENDER_BG dropColor
const BLACK = [0, 0, 0, 255]; // CONCEPT_BG dropColor

const labOf = (rgb) => srgbToLab(rgb);

// A tiny block table: a few well-separated colors (the injected snap vocabulary).
const TABLE = {
  blocks: [
    { block: "stone_bricks", rgb: [130, 130, 130], lab: labOf([130, 130, 130]) },
    { block: "oak_planks", rgb: [186, 140, 90], lab: labOf([186, 140, 90]) },
    { block: "deepslate_tiles", rgb: [60, 60, 65], lab: labOf([60, 60, 65]) },
    { block: "red_wool", rgb: [200, 40, 40], lab: labOf([200, 40, 40]) },
  ],
};

// --- form half ----------------------------------------------------------------------------------------

test("formScores: identical render & mesh silhouettes → IoU 1; concept identical → 1", () => {
  const render = squareOn(32, 32, SKY, [130, 130, 130]);
  const concept = squareOn(32, 32, BLACK, [130, 130, 130]);
  const mesh = maskSquare(32, 32);
  const f = formScores(render, concept, mesh, { grid: 32 });
  assert.equal(f.meshIoU, 1);
  assert.equal(f.conceptIoU, 1);
  assert.equal(f.grid, 32);
});

test("formScores: differing proportion scores below identical; null mesh → null meshIoU", () => {
  const render = squareOn(32, 32, SKY, [130, 130, 130], 4); // square foreground
  // concept foreground is a WIDE bar (different proportion) → normalized silhouette differs → IoU < 1
  const concept = img(32, 32, (x, y) => (y >= 13 && y < 19 ? [130, 130, 130, 255] : BLACK));
  const f = formScores(render, concept, null, { grid: 32 });
  assert.equal(f.meshIoU, null);
  assert.ok(f.conceptIoU < 1);
});

// --- material: buildPalette -----------------------------------------------------------------------------

test("buildPalette: counts, top-K ordering, table join, unknown blocks dropped", () => {
  const artifact = { placements: [
    ...Array(5).fill({ block: "minecraft:stone_bricks" }),
    ...Array(3).fill({ block: "minecraft:oak_planks" }),
    ...Array(9).fill({ block: "minecraft:unobtainium" }), // not in table → dropped
    { block: "minecraft:red_wool" },
  ] };
  const pal = buildPalette(artifact, TABLE, { topK: 2 });
  assert.equal(pal.length, 2);
  assert.equal(pal[0].block, "stone_bricks");
  assert.equal(pal[0].count, 5);
  assert.equal(pal[1].block, "oak_planks");
  assert.ok(Array.isArray(pal[0].lab));
});

// --- material: setAgreement -----------------------------------------------------------------------------

test("setAgreement: identical palettes → 1; disjoint → 0; symmetric", () => {
  const a = [{ lab: labOf([130, 130, 130]) }, { lab: labOf([186, 140, 90]) }];
  const same = setAgreement(a, a);
  assert.equal(same.score, 1);

  const far = [{ lab: labOf([200, 40, 40]) }, { lab: labOf([30, 200, 30]) }];
  const disj = setAgreement(a, far);
  assert.equal(disj.score, 0);

  // symmetry
  assert.equal(setAgreement(a, far).score, setAgreement(far, a).score);
});

test("setAgreement: empty input → null score", () => {
  assert.equal(setAgreement([], [{ lab: labOf([1, 1, 1]) }]).score, null);
});

// --- material: zoneAgreement ----------------------------------------------------------------------------

test("zoneAgreement: identical render & concept → score 1, meanDeltaE ~0", () => {
  // same gray square; render on sky, concept on black → identical foreground colors in the same place
  const render = squareOn(32, 32, SKY, [130, 130, 130]);
  const concept = squareOn(32, 32, BLACK, [130, 130, 130]);
  const z = zoneAgreement(render, concept, TABLE, { zoneGrid: 4 });
  assert.equal(z.score, 1);
  assert.ok(z.meanDeltaE < 1);
  assert.ok(z.common > 0);
  assert.equal(z.zoneGrid, 4);
});

test("zoneAgreement: different foreground colors degrade the score", () => {
  const render = squareOn(32, 32, SKY, [130, 130, 130]); // gray → stone_bricks
  const concept = squareOn(32, 32, BLACK, [200, 40, 40]); // red → red_wool
  const z = zoneAgreement(render, concept, TABLE, { zoneGrid: 4 });
  assert.ok(z.score < 1);
  assert.ok(z.meanDeltaE > 10);
});

test("zoneAgreement: no foreground (all background) → null score, not NaN", () => {
  const render = solid(16, 16, SKY);
  const concept = solid(16, 16, BLACK);
  const z = zoneAgreement(render, concept, TABLE, { zoneGrid: 4 });
  assert.equal(z.score, null);
  assert.equal(z.meanDeltaE, null);
  assert.equal(z.common, 0);
});

// --- resemblanceRow orchestrator ------------------------------------------------------------------------

test("resemblanceRow: assembles a stable schema-tagged row with echoed references", () => {
  const render = squareOn(32, 32, SKY, [130, 130, 130]);
  const concept = squareOn(32, 32, BLACK, [130, 130, 130]);
  const mesh = maskSquare(32, 32);
  const artifact = { placements: Array(10).fill({ block: "minecraft:stone_bricks" }) };
  const refs = { concept: "c.png", glb: "x.glb" };
  const row = resemblanceRow(
    { renderImg: render, conceptImg: concept, meshSil: mesh, artifact, blockTable: TABLE, subject: "gatehouse", references: refs },
    { grid: 32, zoneGrid: 4 },
  );
  assert.equal(row.schema, RESEMBLANCE_SCHEMA);
  assert.equal(row.subject, "gatehouse");
  assert.equal(row.form.meshIoU, 1);
  assert.equal(row.references.glb, "x.glb");
  assert.ok(row.material.set.build.find((b) => b.block === "stone_bricks"));
  assert.ok(row.note.includes("Rule 2"));
  // determinism
  const row2 = resemblanceRow(
    { renderImg: render, conceptImg: concept, meshSil: mesh, artifact, blockTable: TABLE, subject: "gatehouse", references: refs },
    { grid: 32, zoneGrid: 4 },
  );
  assert.deepEqual(row, row2);
});

test("resemblanceRow: throws on a non-image render", () => {
  assert.throws(() => resemblanceRow({ renderImg: null, blockTable: TABLE }), /renderImg/);
});

// --- triptych compose math ------------------------------------------------------------------------------

test("resampleRgba: identity when target == source size", () => {
  const src = squareOn(8, 8, [10, 20, 30, 255], [200, 100, 50]);
  const out = resampleRgba(src, 8, 8, "stretch");
  assert.deepEqual([...out.data], [...src.data]);
});

test("resampleRgba: 2×→1× box mean of a known 2×2 block", () => {
  // a 2×2 with four known colors → 1×1 = their mean
  const src = img(2, 2, (x, y) => [[0, 0, 0, 255], [100, 0, 0, 255], [0, 100, 0, 255], [0, 0, 100, 255]][y * 2 + x]);
  const out = resampleRgba(src, 1, 1, "stretch");
  assert.deepEqual([...out.data], [25, 25, 25, 255]);
});

test("resampleRgba: aspect letterboxes a wide image with bg margins", () => {
  const src = solid(8, 4, [10, 20, 30, 255]);
  const out = resampleRgba(src, 8, 8, "aspect", { bg: [255, 255, 255, 255] });
  assert.equal(out.w, 8);
  assert.equal(out.h, 8);
  // top row should be background (letterbox margin)
  assert.deepEqual([out.data[0], out.data[1], out.data[2]], [255, 255, 255]);
  // a middle row should hold content
  const mid = (4 * 8 + 0) << 2;
  assert.deepEqual([out.data[mid], out.data[mid + 1], out.data[mid + 2]], [10, 20, 30]);
});

test("silhouetteToRgba: foreground → fg color, background → bg color", () => {
  const sil = maskSquare(8, 8, 2);
  const panel = silhouetteToRgba(sil, { fg: [100, 100, 100, 255], bg: [255, 255, 255, 255] });
  // corner is background
  assert.deepEqual([panel.data[0], panel.data[1], panel.data[2]], [255, 255, 255]);
  // center is foreground
  const c = (4 * 8 + 4) << 2;
  assert.deepEqual([panel.data[c], panel.data[c + 1], panel.data[c + 2]], [100, 100, 100]);
});

test("composeTriptych: width = 3·panel + 2·gutter; panels land at the right offsets", () => {
  const p0 = panel(4, 4, [10, 0, 0, 255]);
  const p1 = panel(4, 4, [0, 20, 0, 255]);
  const p2 = panel(4, 4, [0, 0, 30, 255]);
  const out = composeTriptych([p0, p1, p2], { gutter: 2, sep: [50, 50, 50, 255] });
  assert.equal(out.w, 4 * 3 + 2 * 2);
  assert.equal(out.h, 4);
  const at = (x, y) => { const o = (y * out.w + x) << 2; return [out.data[o], out.data[o + 1], out.data[o + 2]]; };
  assert.deepEqual(at(0, 0), [10, 0, 0]); // panel 0
  assert.deepEqual(at(4, 0), [50, 50, 50]); // gutter (separator)
  assert.deepEqual(at(6, 0), [0, 20, 0]); // panel 1 (after 4 + gutter 2)
  assert.deepEqual(at(12, 0), [0, 0, 30]); // panel 2 (after 2·(4+2))
});

test("composeTriptych: rejects wrong panel count / mismatched sizes", () => {
  const p = panel(4, 4, [0, 0, 0, 255]);
  assert.throws(() => composeTriptych([p, p]), /exactly 3/);
  assert.throws(() => composeTriptych([p, p, panel(5, 4, [0, 0, 0, 255])]), /share dimensions/);
});

// --- judge prompt + verdict parser ----------------------------------------------------------------------

test("buildResemblancePrompt: fixed, names all verdicts and gap attributes", () => {
  const p = buildResemblancePrompt();
  for (const v of VERDICTS) assert.ok(p.includes(v), `prompt should mention "${v}"`);
  for (const a of GAP_ATTRS) assert.ok(p.includes(a), `prompt should mention "${a}"`);
  assert.ok(p.includes("STRICT JSON"));
});

test("parseResemblanceVerdict: valid same-object with null gap", () => {
  const v = parseResemblanceVerdict('{"verdict":"same object","gap":null,"rationale":"reads true"}');
  assert.equal(v.schema, RESEMBLANCE_VERDICT_SCHEMA);
  assert.equal(v.verdict, "same object");
  assert.equal(v.gap, null);
  assert.equal(v.rationale, "reads true");
});

test("parseResemblanceVerdict: valid drifted with a named gap; strips fences + prose", () => {
  const raw = 'Here is my verdict:\n```json\n{"verdict":"drifted","gap":{"region":"the roof","attribute":"massing"},"rationale":"roof too flat"}\n```';
  const v = parseResemblanceVerdict(raw);
  assert.equal(v.verdict, "drifted");
  assert.deepEqual(v.gap, { region: "the roof", attribute: "massing" });
});

test("parseResemblanceVerdict: rejects bad enums and gap-integrity violations", () => {
  assert.throws(() => parseResemblanceVerdict('{"verdict":"maybe","gap":null}'), /verdict must be/);
  assert.throws(() => parseResemblanceVerdict('{"verdict":"drifted","gap":null}'), /requires a .*gap/);
  assert.throws(() => parseResemblanceVerdict('{"verdict":"same object","gap":{"region":"x","attribute":"form"}}'), /null gap/);
  assert.throws(() => parseResemblanceVerdict('{"verdict":"drifted","gap":{"region":"x","attribute":"texture"}}'), /gap.attribute must be/);
  assert.throws(() => parseResemblanceVerdict('{"verdict":"drifted","gap":{"region":"","attribute":"form"}}'), /gap.region/);
  assert.throws(() => parseResemblanceVerdict("not json at all"), /not JSON/);
  assert.throws(() => parseResemblanceVerdict(""), /empty/);
});

// ---- consolidateResemblance (T-077-01 aggregator + E-21 routing rule) ----

const mkResult = (subject, verdict, gap, extra = {}) => ({
  subject,
  mode: extra.mode ?? "live",
  row: {
    form: { meshIoU: extra.meshIoU ?? 0.9, conceptIoU: extra.conceptIoU ?? 0.6 },
    material: { set: { score: extra.set ?? 0.7 }, zone: { score: extra.zone ?? 0.3, meanDeltaE: extra.dE ?? 20 } },
  },
  verdict: { schema: RESEMBLANCE_VERDICT_SCHEMA, verdict, gap, rationale: "" },
});

test("consolidateResemblance: tallies verdict counts and carries the schema + per-subject form/material", () => {
  const out = consolidateResemblance([
    mkResult("a", "same object", null),
    mkResult("b", "drifted", { region: "roof", attribute: "form" }),
    mkResult("c", "drifted", { region: "walls", attribute: "palette" }),
  ]);
  assert.equal(out.schema, RESEMBLANCE_CONSOLIDATION_SCHEMA);
  assert.deepEqual(out.summary.counts, { "same object": 1, drifted: 2 });
  assert.equal(out.subjects.length, 3);
  assert.deepEqual(out.subjects[0].form, { meshIoU: 0.9, conceptIoU: 0.6 });
  assert.deepEqual(out.subjects[2].material, { set: 0.7, zone: 0.3, meanDeltaE: 20 });
  assert.equal(out.subjects[1].mode, "live");
});

test("consolidateResemblance: routes ONLY material gaps (palette / material zoning) to E-21", () => {
  // sanity: the routed set is exactly the material half of GAP_ATTRS
  assert.deepEqual([...MATERIAL_GAP_ATTRS].sort(), ["material zoning", "palette"]);
  const out = consolidateResemblance([
    mkResult("palette-drift", "drifted", { region: "facade", attribute: "palette" }),
    mkResult("zoning-drift", "different object", { region: "base", attribute: "material zoning" }),
    mkResult("form-drift", "drifted", { region: "roof", attribute: "form" }),
    mkResult("massing-drift", "drifted", { region: "tower", attribute: "massing" }),
    mkResult("clean", "same object", null),
  ]);
  const routed = out.subjects.filter((s) => s.routesToE21).map((s) => s.subject);
  assert.deepEqual(routed.sort(), ["palette-drift", "zoning-drift"]);
  assert.equal(out.summary.e21Findings.length, 2);
  assert.equal(out.summary.e21Findings[0].attribute, "palette");
  assert.equal(out.summary.e21Findings[0].subject, "palette-drift");
  // form / massing / same-object never route
  assert.equal(out.subjects.find((s) => s.subject === "form-drift").routesToE21, false);
  assert.equal(out.subjects.find((s) => s.subject === "massing-drift").routesToE21, false);
  assert.equal(out.subjects.find((s) => s.subject === "clean").routesToE21, false);
});

test("consolidateResemblance: a non-verdict (unparsed / not run) is counted but never routes", () => {
  const out = consolidateResemblance([
    { subject: "x", mode: "live", row: {}, verdict: { verdict: "unparsed", gap: null } },
    { subject: "y", mode: "offline", row: {}, verdict: { verdict: "(not run)", gap: null } },
  ]);
  assert.equal(out.summary.counts.unparsed, 1);
  assert.equal(out.summary.counts["(not run)"], 1);
  assert.equal(out.summary.e21Findings.length, 0);
  assert.equal(out.subjects[0].routesToE21, false);
  assert.equal(out.subjects[0].form.meshIoU, null); // missing row degrades to null, no throw
});

test("consolidateResemblance: total + deterministic on empty / repeated input", () => {
  const empty = consolidateResemblance([]);
  assert.deepEqual(empty.summary.counts, {});
  assert.deepEqual(empty.summary.e21Findings, []);
  assert.deepEqual(empty.subjects, []);
  const input = [mkResult("a", "drifted", { region: "r", attribute: "palette" })];
  assert.deepEqual(consolidateResemblance(input), consolidateResemblance(input));
});
