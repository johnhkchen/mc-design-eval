#!/usr/bin/env node
/**
 * MEASURE MY OWN METRIC'S RELIABILITY (E-38, 2026-06-15). I named "build-dependent reliability" and
 * "argmax instability" as eval failures but only saw them anecdotally (barn 22 vs 14). This quantifies
 * them: score the SAME fixed render N times per build, report quality mean/std/range and the worst-defect
 * argmax distribution. Pure measurement — the differentiator — not more build tooling.
 *
 * Falsifiable: if std is small and argmax stable on ALL builds, variance was NOT the volume-run's
 * problem (look elsewhere). If std/argmax-instability scales with build ambiguity, that quantifies the
 * confidence-aware-aggregation requirement (how many samples each build needs for a stable argmax).
 */
import { readFileSync } from "node:fs";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";

const N = 5, MODEL = "claude-opus-4-8";
const CONC = {
  cottage: "benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png",
  barn: "benchmarks/sculpture/runs/017-vBuilding-a-rectangular-stone-tithe-barn-with-a-steep-gabled-roof-and-large-timber-wagon-doors/concept.png",
  gatehouse: "benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png",
};
const BUILD = {
  cottage: "builds/cottage/autonomy/round-0/view-+x+z.png",
  barn: "builds/barn/autonomy/round-0/view-+x+z.png",
  gatehouse: "builds/gatehouse/autonomy/round-0/view-+x+z.png",
};
const PROMPT = [
  "Image 1 is a CONCEPT (target); Image 2 is a Minecraft BUILD. Quality is DEFECT-DOMINATED: the single",
  "worst defect caps the score; sub-threshold differences must not move it. Axes: massing; roof form;",
  "structural integrity; palette; detail. Name the worst defect and set quality 0-100 = its cap.",
  'Output ONE JSON: {"worstDefect":{"axis":"<axis>"},"quality":<int>,"rationale":"<one sentence>"}',
].join("\n");
const img = (p) => ({ data: readFileSync(p), mediaType: "image/png" });
const parse = (t) => JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));

async function main() {
  for (const k of ["cottage", "barn", "gatehouse"]) {
    const imgs = [img(CONC[k]), img(BUILD[k])];
    const qs = [], ax = {};
    for (let i = 0; i < N; i++) {
      const { text } = await requestTextWithImage({ prompt: PROMPT, images: imgs, model: MODEL });
      const o = parse(text); qs.push(o.quality); ax[o.worstDefect?.axis] = (ax[o.worstDefect?.axis] || 0) + 1;
    }
    const mean = qs.reduce((a, b) => a + b, 0) / N;
    const std = Math.sqrt(qs.reduce((s, q) => s + (q - mean) ** 2, 0) / N);
    const argmaxStable = Math.max(...Object.values(ax)) === N;
    console.error(`${k.padEnd(10)} q=[${qs.join(",")}] mean ${mean.toFixed(1)} std ${std.toFixed(1)} range ${Math.max(...qs) - Math.min(...qs)} | argmax ${JSON.stringify(ax)} ${argmaxStable ? "STABLE" : "UNSTABLE"}`);
  }
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
