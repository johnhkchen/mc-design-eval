#!/usr/bin/env node
/**
 * EXPERIMENT (E-38, 2026-06-15): does the DEFECT-DOMINATED quality eval fix the failure the human
 * exposed in the additive sonnet ranker?
 *
 * Context: the sonnet holistic ranker over-read the sub-threshold cream→pink wall tint and
 * manufactured a cottage ρ=−0.735 that human blind-ranking REFUTED (the 5 cottage states are flat,
 * all D-). The reviewer's insight: quality is DEFECT-DOMINATED — the worst defect caps the grade, so
 * sub-threshold differences must not move the score. This eval encodes that. Different model (opus)
 * than the refuted sonnet ranker.
 *
 * Ground truth (from the human, this session): cottage states FLAT (all D-); barn states FLAT (worse,
 * roofless); cottage > barn (supra-threshold: cottage has a roof, barn does not).
 *
 * FALSIFIABLE PREDICTIONS (each can fail):
 *  P1 cottage states score ~flat (spread small)         -> correction works (ignores cream/pink)
 *     FAIL: cottage splits wide -> the fix did NOT fix the over-read.
 *  P2 cottage mean > barn mean (clear gap)               -> still detects supra-threshold defects
 *     FAIL: cottage ~= barn -> eval over-corrected into blindness.
 *  P3 barn states score ~flat                            -> agrees with human barn verdict.
 *
 * Existing renders only. Writes nothing under measurements/. Not the frozen instrument.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const EVAL_MODEL = "claude-opus-4-8"; // different model than the refuted sonnet ranker
const VIEW = "view-+x+z.png";

const CONCEPT = {
  cottage: "benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png",
  barn: "benchmarks/sculpture/runs/017-vBuilding-a-rectangular-stone-tithe-barn-with-a-steep-gabled-roof-and-large-timber-wagon-doors/concept.png",
};

// distinct human-verdict states (cottage: cream round-1, mid round-4, pink final; barn: r1, final)
const BUILDS = [
  { subject: "cottage", id: "round-1", note: "cream infill" },
  { subject: "cottage", id: "round-4", note: "mid" },
  { subject: "cottage", id: "final", note: "pink infill" },
  { subject: "barn", id: "round-1", note: "" },
  { subject: "barn", id: "final", note: "" },
];

function img(path) { return { data: readFileSync(join(ROOT, path)), mediaType: "image/png" }; }

const PROMPT = [
  "You measure how well a Minecraft build realizes a CONCEPT. Image 1 is the CONCEPT (the target).",
  "Image 2 is the BUILD (one camera angle).",
  "",
  "Quality is DEFECT-DOMINATED: a build is only as good as its SINGLE WORST defect relative to the",
  "concept. A glaring error (missing/wrong roof, broken massing, holes, chaotic geometry, wrong overall",
  "form) CAPS the score no matter how many small things are right. Conversely, many tiny imperfections",
  "do NOT sink a build whose major elements are all present and correct. Sub-threshold differences",
  "(a slightly-off block tint, one stray block) MUST NOT change the score if a larger defect already",
  "caps it.",
  "",
  "Defect axes: massing/proportion; roof form & presence; structural integrity (holes/jaggedness/",
  "floating/chaotic geometry); palette/material correctness; surface detail & relief.",
  "",
  "Steps: (1) name the SINGLE worst defect and its axis; (2) set quality 0-100 = the cap that defect",
  "imposes (0 = that defect alone makes it fail as a realization of the concept; 100 = concept-perfect).",
  "",
  'Output ONE JSON object, nothing else: {"worstDefect":{"axis":"<axis>","what":"<short>"},',
  '"quality":<int 0-100>,"rationale":"<one sentence>"}',
].join("\n");

function parseJson(text) {
  const s = text.indexOf("{"), e = text.lastIndexOf("}");
  if (s < 0 || e < 0) throw new Error("no JSON in reply: " + text.slice(0, 80));
  return JSON.parse(text.slice(s, e + 1));
}

const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;

async function main() {
  const results = [];
  for (const b of BUILDS) {
    const view = join("builds", b.subject, b.id, VIEW);
    const { text } = await requestTextWithImage({ prompt: PROMPT, images: [img(CONCEPT[b.subject]), img(view)], model: EVAL_MODEL });
    const out = parseJson(text);
    results.push({ ...b, quality: out.quality, worstDefect: out.worstDefect, rationale: out.rationale });
    console.error(`[${b.subject}/${b.id}${b.note ? " (" + b.note + ")" : ""}] q=${out.quality} worst=${out.worstDefect?.axis} | ${out.rationale}`);
  }
  const cottage = results.filter((r) => r.subject === "cottage").map((r) => r.quality);
  const barn = results.filter((r) => r.subject === "barn").map((r) => r.quality);
  const cottageSpread = Math.max(...cottage) - Math.min(...cottage);
  const barnSpread = barn.length ? Math.max(...barn) - Math.min(...barn) : 0;
  const gap = mean(cottage) - mean(barn);

  mkdirSync(join(HERE, "results"), { recursive: true });
  writeFileSync(join(HERE, "results", "defect-eval.json"),
    JSON.stringify({ schema: "eval-alignment/defect-eval/v1", evalModel: EVAL_MODEL, results, cottageSpread, barnSpread, cottageVsBarnGap: gap }, null, 2));

  console.error("\n================ VERDICT vs PREDICTIONS ================");
  console.error(`P1 cottage spread = ${cottageSpread} (cream→pink). flat<=10 PASS / wide>20 FAIL(over-reads)`);
  console.error(`   -> ${cottageSpread <= 10 ? "PASS: correction works (ignores sub-threshold tint)" : cottageSpread > 20 ? "FAIL: still over-reads the cream/pink split" : "MARGINAL"}`);
  console.error(`P2 cottage mean(${mean(cottage).toFixed(0)}) - barn mean(${mean(barn).toFixed(0)}) = ${gap.toFixed(0)}. gap>=15 PASS / ~0 FAIL(blind)`);
  console.error(`   -> ${gap >= 15 ? "PASS: detects supra-threshold defect (roof)" : Math.abs(gap) < 8 ? "FAIL: blind to glaring defect (cottage≈barn)" : "MARGINAL"}`);
  console.error(`P3 barn spread = ${barnSpread}. flat<=10 PASS`);
  console.error(`   -> ${barnSpread <= 10 ? "PASS: agrees barn is flat" : "FAIL: splits flat barn"}`);
  console.error("=======================================================");
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
