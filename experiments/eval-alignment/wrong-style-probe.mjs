#!/usr/bin/env node
/**
 * WRONG-STYLE PROBE (E-38, 2026-06-15): does the defect-dominated eval actually reward fidelity to the
 * concept's IDENTITY/STYLE, or does it score intrinsic "is this a clean build" while rubber-stamping the
 * "realization of the concept" framing?
 *
 * Method: HOLD THE BUILD FIXED (a clean, recognizable stone gatehouse — climbed to q≈34, so it is NOT
 * intrinsically broken), VARY ONLY THE CONCEPT it is scored against. The eval's exact PROMPT + model
 * (opus) are replicated verbatim — only image 1 (the concept) changes.
 *
 * FALSIFIABLE PREDICTION (lead with how it CLEARS the eval, anti-hedge):
 *   If the eval is IDENTITY-AWARE, the absurd mismatches (a stone gatehouse scored against a KOI FISH or
 *   a PINEAPPLE) must CRATER toward 0 ("this is not a realization of that concept at all"), well below
 *   the matched gatehouse score. THEN my "style-blind measure" hypothesis is REFUTED and the homogenized
 *   output is purely the generator's narrow grammar, not the measure.
 *   If the eval is IDENTITY-BLIND, the scores stay roughly FLAT across all concepts (it is really scoring
 *   "is this a tidy gabled stone building") and the absurd mismatches do NOT crater. THEN the measure
 *   gives the agent no gradient toward style fidelity — the disease is in the measure.
 *
 * INDICTMENT RULE: if the gatehouse scores >= 40 against koi/pineapple (absurd realizations), or the
 * spread matched-vs-absurd is < 20, the eval is identity-blind. If absurd < 10 and matched - absurd > 40,
 * the eval is identity-aware (hypothesis refuted — report that honestly).
 *
 * Existing renders only. Writes nothing under measurements/. Not the frozen instrument.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const EVAL_MODEL = "claude-opus-4-8";
const VOTES = 3;

// FIXED build: the gatehouse that climbed to ~34 — recognizable stone gatehouse, not broken.
const BUILD = "builds/gatehouse/new-roof/view-+x+z.png";

// concepts, ordered matched -> same-family -> absurd
const CONCEPTS = [
  { key: "gatehouse", tier: "MATCHED",      path: "benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png" },
  { key: "barn",      tier: "same-family",  path: "benchmarks/sculpture/runs/017-vBuilding-a-rectangular-stone-tithe-barn-with-a-steep-gabled-roof-and-large-timber-wagon-doors/concept.png" },
  { key: "cottage",   tier: "same-family",  path: "benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png" },
  { key: "church",    tier: "diff-building",path: "benchmarks/sculpture/runs/016-vBuilding-a-village-church-with-a-square-bell-tower/concept.png" },
  { key: "koi-fish",  tier: "ABSURD",       path: "benchmarks/sculpture/runs/009-vConcept-a-koi-fish/concept.png" },
  { key: "pineapple", tier: "ABSURD",       path: "benchmarks/sculpture/runs/004-vConcept-a-pineapple/concept.png" },
];

function img(path) { return { data: readFileSync(join(ROOT, path)), mediaType: "image/png" }; }

// VERBATIM the defect-eval.mjs prompt — same instrument, only the concept image varies.
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
  const buildImg = img(BUILD);
  const results = [];
  for (const c of CONCEPTS) {
    const qs = [], defs = [];
    for (let v = 0; v < VOTES; v++) {
      const { text } = await requestTextWithImage({ prompt: PROMPT, images: [img(c.path), buildImg], model: EVAL_MODEL });
      const out = parseJson(text);
      qs.push(out.quality); defs.push(out.worstDefect?.what ?? "");
    }
    const q = Math.round(mean(qs));
    results.push({ ...c, q, votes: qs, sampleDefect: defs[0] });
    console.error(`[concept=${c.key} (${c.tier})] q=${q}  votes=[${qs.join(",")}]  worst="${defs[0]}"`);
  }

  const matched = results.find((r) => r.tier === "MATCHED").q;
  const absurd = results.filter((r) => r.tier === "ABSURD").map((r) => r.q);
  const absurdMean = mean(absurd);
  const spread = matched - absurdMean;
  const verdict = (absurdMean >= 40 || spread < 20) ? "IDENTITY-BLIND (eval is the gate)"
    : (absurdMean < 10 && spread > 40) ? "IDENTITY-AWARE (hypothesis REFUTED — gate is the generator)"
    : "PARTIAL / MARGINAL — see scores";

  mkdirSync(join(HERE, "results"), { recursive: true });
  writeFileSync(join(HERE, "results", "wrong-style-probe.json"),
    JSON.stringify({ schema: "eval-alignment/wrong-style-probe/v1", evalModel: EVAL_MODEL, build: BUILD, votes: VOTES, results, matched, absurdMean, spread, verdict }, null, 2));

  console.error("\n================ WRONG-STYLE VERDICT ================");
  console.error(`build held FIXED: ${BUILD}`);
  console.error(`matched (gatehouse) q = ${matched}`);
  console.error(`absurd (koi/pineapple) mean q = ${absurdMean.toFixed(0)}`);
  console.error(`spread matched - absurd = ${spread.toFixed(0)}`);
  console.error(`-> ${verdict}`);
  console.error("====================================================");
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
