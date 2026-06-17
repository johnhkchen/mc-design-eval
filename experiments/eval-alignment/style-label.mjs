#!/usr/bin/env node
/**
 * STYLE LABEL INSTRUMENT BUILDER (T-184-01, story S-184, epic E-46) — the HUMAN-GATE PREP. Model-free and
 * GL-free: it composes the pairwise labeling instrument from the S-183 corpus's committed beside-concept
 * renders and writes a fillable human-label template. The reviewer labels by dropping a `labels.human.json`
 * (each pair → "A" | "B" | "tie") next to the template; the metered harness (style-agreement-run.mjs) reads
 * it if present (the human gate) and otherwise falls back to the flagged LLM-proxy.
 *
 * Each instrument composite is stateA-beside-its-concept ‖ gutter ‖ stateB-beside-its-concept, so the human
 * sees both builds each next to ITS OWN target and judges which more faithfully realizes its concept. SMALL
 * by design (the curated pairs.json, not the all-pairs matrix).
 *
 * Asset-guard-before-work; GUARD_ONLY=1 lists assets and exits. NOT in `npm test`. Replayable.
 *
 *   node experiments/eval-alignment/style-label.mjs            # compose composites + template
 *   GUARD_ONLY=1 node experiments/eval-alignment/style-label.mjs   # asset guard only, no work
 */
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

import { decodeImage } from "../../src/color/palette-extract.mjs";
import { loadStyleCorpus } from "../../src/workshop/style-corpus.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const LABELS_DIR = join(ROOT, "experiments/eval-alignment/corpus/labels");
const PAIRS_PATH = join(LABELS_DIR, "pairs.json");
const INSTRUMENT_DIR = join(LABELS_DIR, "instrument");
const TEMPLATE_PATH = join(LABELS_DIR, "labels-template.json");
const GUARD_ONLY = process.env.GUARD_ONLY === "1";

/** Side-by-side composite (no GL, no model) — lifted from corpus-referee.mjs's composeTwo verbatim idiom. */
async function composeTwo(pathA, pathB, outPath, gutter = 24) {
  const a = await decodeImage(pathA);
  const b = await decodeImage(pathB);
  const W = a.width + gutter + b.width, H = Math.max(a.height, b.height);
  const out = new PNG({ width: W, height: H });
  out.data.fill(0xff);
  const blit = (src, dx) => {
    for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
      const si = (src.width * y + x) << 2, di = (W * y + (x + dx)) << 2;
      out.data[di] = src.data[si]; out.data[di + 1] = src.data[si + 1];
      out.data[di + 2] = src.data[si + 2]; out.data[di + 3] = 0xff;
    }
  };
  blit(a, 0); blit(b, a.width + gutter);
  writeFileSync(outPath, PNG.sync.write(out));
}

async function main() {
  const corpus = loadStyleCorpus();
  const byId = Object.fromEntries(corpus.states.map((s) => [s.id, s]));
  const pairs = JSON.parse(readFileSync(PAIRS_PATH, "utf8")).pairs;

  // ---- referential integrity + asset guard BEFORE any work ----
  const guard = new Set();
  for (const p of pairs) {
    for (const k of ["a", "b"]) {
      const s = byId[p[k]];
      if (!s) throw new Error(`pairs.json: pair ${p.id} references unknown corpus state "${p[k]}"`);
      guard.add(join(ROOT, s.beside));
    }
    if (!["easy", "hardMiddle"].includes(p.bucket)) throw new Error(`pairs.json: pair ${p.id} bad bucket "${p.bucket}"`);
  }
  for (const f of guard) if (!existsSync(f)) throw new Error(`missing beside-concept asset: ${f}`);
  console.log(`[guard] ${pairs.length} pairs, ${guard.size} beside-concept assets present`);
  if (GUARD_ONLY) { console.log("[guard] GUARD_ONLY — no work; exiting clean."); return; }

  // ---- compose one A‖B instrument composite per pair (GL-free) ----
  await mkdir(INSTRUMENT_DIR, { recursive: true });
  for (const p of pairs) {
    const out = join(INSTRUMENT_DIR, `${p.id}.png`);
    await composeTwo(join(ROOT, byId[p.a].beside), join(ROOT, byId[p.b].beside), out);
    console.log(`[compose] ${p.id}: ${p.a} ‖ ${p.b} -> ${out.replace(ROOT, "")}`);
  }

  // ---- fillable human template (the human gate prep) ----
  const template = {
    schema: "eval-alignment/style-labels-human/v1",
    instructions: [
      "HUMAN LABELING — one rater (one-person panel for now). For each pair open instrument/<id>.png:",
      "the LEFT half is state A beside ITS concept, the RIGHT half is state B beside ITS concept.",
      "Set humanLabel to which build MORE FAITHFULLY realizes ITS OWN concept image:",
      "  \"A\" (left more faithful), \"B\" (right more faithful), or \"tie\" (genuinely rank-either-way).",
      "Judge the GLANCE — does the build look like its picture? — not block-level material agreement.",
      "When done, save this file as labels.human.json in this directory; the agreement harness reads it as the GATE.",
    ],
    pairs: pairs.map((p) => ({
      id: p.id, bucket: p.bucket, a: p.a, b: p.b, composite: `instrument/${p.id}.png`,
      rationale: p.rationale, intended: p.intended, humanLabel: "",
    })),
  };
  await writeFile(TEMPLATE_PATH, JSON.stringify(template, null, 2) + "\n");
  console.log(`[template] wrote ${TEMPLATE_PATH.replace(ROOT, "")} (${pairs.length} pairs, humanLabel empty)`);
  console.log(`\n[done] instrument ready. Human gate: fill humanLabel in a copy named labels.human.json.`);
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
