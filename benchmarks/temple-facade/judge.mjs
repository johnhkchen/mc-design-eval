// LLM-as-judge for temple facades (the keystone: instrument + verifier in one).
//
// A LOCKED rubric scored from the head-on render image (the model SEES the build).
// Returns per-dimension scores 1–5 + a holistic overall, sampled `samples` times and
// MEAN-aggregated (empirically beats greedy for judges; arXiv 2506.13639). Used both to
// score every benchmark run (closing the "graded by impression" gap) and as the selector
// for best-of-N. Versioned so score comparisons are only valid within a rubric version.

import { readFileSync } from "node:fs";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";
import { PHASE1_MODEL_ID } from "../../src/config.mjs";

export const RUBRIC_VERSION = "v1";
export const DIMENSIONS = ["proportion", "color", "detail", "fidelity"];

function composeJudgePrompt(brief) {
  return [
    "You are a rigorous, discriminating architecture critic scoring a Minecraft TEMPLE FACADE",
    "rendered head-on (attached). Score it against the LOCKED rubric below. Use the full 1–5",
    "range and be hard to please — most builds are 2–4; reserve 5 for genuinely excellent work.",
    "Judge ONLY what the render shows.",
    "",
    "## The brief the build was meant to satisfy",
    brief,
    "",
    "## Rubric — score each dimension 1–5 against these anchors",
    "- **proportion** — bay rhythm, vertical/horizontal balance, a coherent base→middle→crown.",
    "  1 = arbitrary/awkward; 3 = competent; 5 = deliberate, classical proportion.",
    "- **color** — palette DISCIPLINE and color theory: a clear dominant/supporting/accent",
    "  hierarchy and a harmony. 1 = monochrome OR a garish rainbow; 3 = pleasant but",
    "  unconsidered; 5 = a disciplined, intentional, harmonious scheme.",
    "- **detail** — relief depth, articulation, ornament, framed openings vs. flat fields.",
    "  1 = flat/blocky; 3 = some articulation; 5 = rich, purposeful detail.",
    "- **fidelity** — does it read unmistakably as a grand TEMPLE FACADE (identity, presence, a",
    "  clear entrance)? 1 = generic wall; 3 = recognizable; 5 = characterful, unmistakable temple.",
    "",
    "## Output (critical)",
    "Respond with ONLY this JSON object and nothing else:",
    '{"proportion":N,"color":N,"detail":N,"fidelity":N,"overall":N,"notes":"one terse sentence"}',
    "Each N is an integer 1–5. `overall` is your holistic judgement (not necessarily the average).",
  ].join("\n");
}

/** Parse the judge's JSON (tolerant of fences/prose); validate 1–5 integers. */
export function parseScores(text) {
  let s = String(text).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (!s.startsWith("{")) {
    const a = s.indexOf("{");
    const b = s.lastIndexOf("}");
    if (a >= 0 && b > a) s = s.slice(a, b + 1);
  }
  const o = JSON.parse(s);
  const out = { notes: typeof o.notes === "string" ? o.notes : "" };
  for (const k of [...DIMENSIONS, "overall"]) {
    const v = Number(o[k]);
    if (!Number.isFinite(v) || v < 1 || v > 5) {
      throw new Error(`judge: invalid score for "${k}": ${JSON.stringify(o[k])}`);
    }
    out[k] = v;
  }
  return out;
}

/**
 * Score one rendered facade against the rubric. Samples `samples` times and averages
 * (mean) the numeric dimensions. LIVE and METERED (one claude -p call per sample).
 * @param {{ imagePath: string, brief: string, model?: string, samples?: number }} p
 * @returns {Promise<{ proportion:number, color:number, detail:number, fidelity:number,
 *   overall:number, samples:number, rubric:string, notes:string,
 *   usage:{input_tokens:number,output_tokens:number,cost_usd:number} }>}
 */
export async function judgeRender({ imagePath, brief, model = PHASE1_MODEL_ID, samples = 3 }) {
  const prompt = composeJudgePrompt(brief);
  const img = readFileSync(imagePath);
  const runs = [];
  const usage = { input_tokens: 0, output_tokens: 0, cost_usd: 0 };
  for (let i = 0; i < samples; i++) {
    const { text, raw } = await requestTextWithImage({ prompt, images: [img], model });
    runs.push(parseScores(text));
    const u = raw.usage || {};
    usage.input_tokens += u.input_tokens || 0;
    usage.output_tokens += u.output_tokens || 0;
    usage.cost_usd += raw.total_cost_usd || 0;
  }
  const mean = (k) => Math.round((runs.reduce((a, r) => a + r[k], 0) / runs.length) * 100) / 100;
  return {
    proportion: mean("proportion"),
    color: mean("color"),
    detail: mean("detail"),
    fidelity: mean("fidelity"),
    overall: mean("overall"),
    samples: runs.length,
    rubric: RUBRIC_VERSION,
    notes: runs[0].notes,
    usage,
  };
}
