#!/usr/bin/env node
/**
 * GATEHOUSE SELF-CONCEPT SCORER (T-171-01, story S-171, epic E-42) — the witness measurement for
 * material faithfulness. It scores the NEW recognition-built gatehouse against its OWN rustic concept
 * (the matched / self-concept condition), to report the self-concept style-fidelity score vs the E-40
 * floor (~2) the program-less polished_basalt build scored.
 *
 * It is a single-condition slice of corpus-referee.mjs::runCrater (A-matched), reusing its diagnose
 * pattern verbatim (asset-guard-first, VOTES loop, no re-ask — a zero-token notice reply only burns
 * budget), but pointed at the recognition artifact + the REAL recognized program (the referee passes a
 * synthetic stand-in because no real gatehouse program existed; now one does, T-171-01).
 *
 * NOT in `npm test`. NOT the frozen instrument. Metered (2 diagnose votes). Writes
 * docs/active/work/T-171-01/selfconcept-score.json.
 *
 *   node experiments/eval-alignment/score-gatehouse-selfconcept.mjs
 *   GUARD_ONLY=1 node experiments/eval-alignment/score-gatehouse-selfconcept.mjs   # wiring, no spend
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { runTieredOp } from "../../src/model-tier.mjs";
import { bamlRender, bamlParse } from "../../src/baml/bridge.mjs";
import { diagnoseRenderArgs } from "../../src/workshop/diagnose.mjs";
import { critiqueEvidence, itemStyleClass, styleFidelityScore } from "../../src/workshop/bakeoff-score.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const OUT = join(ROOT, "docs/active/work/T-171-01/selfconcept-score.json");
const TIER = "strong";
const VOTES = 2;
const E40_FLOOR = 2; // the program-less polished_basalt build's self-concept score (E-40 A-matched)
const GUARD_ONLY = process.env.GUARD_ONLY === "1";
const azimuths = [...MULTI_ANGLE_GATE.azimuths];

const PACK = "packs/rustic.json"; // the matched style
const CONCEPT = "benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png";
const NEW_ARTIFACT = "benchmarks/sculpture/recognition/gatehouse.artifact.json";
const NEW_PROGRAM = "benchmarks/sculpture/recognition/gatehouse.program.json";
const OLD_ARTIFACT = "builds/gatehouse/new-roof/artifact.json"; // program-less build, for the contrast
const RENDER_DIR = "benchmarks/sculpture/recognition";          // view-gatehouse-<az>.png

const toB64 = async (p) => {
  const buf = await readFile(p);
  const mediaType = buf.slice(0, 3).toString("hex") === "ffd8ff" ? "image/jpeg" : "image/png";
  return { base64: buf.toString("base64"), mediaType };
};
const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
const round = (x) => Math.round(x);

/** Block distribution of an artifact (block → %), for the before/after material contrast. */
async function dist(rel) {
  const a = JSON.parse(await readFile(join(ROOT, rel), "utf8"));
  const c = {};
  for (const p of a.placements) c[p.block] = (c[p.block] ?? 0) + 1;
  const tot = a.placements.length;
  return Object.fromEntries(
    Object.entries(c).sort((x, y) => y[1] - x[1]).map(([k, v]) => [k, +(100 * v / tot).toFixed(1)]),
  );
}

const itemsOf = (critique) => (critique?.items ?? []).map((it) => ({
  department: it.department, severity: it.severity,
  present: it.present ?? "", missing: it.missing ?? "",
  kind: it.kind ?? null, styleClass: itemStyleClass(it),
}));

/** One DiagnoseBuild → {evidence, items, score}. No re-ask (mirrors corpus-referee). */
async function diagnose({ program, pack, concept, renders }) {
  const args = diagnoseRenderArgs({ program, pack, azimuths });
  const { prompt, images } = await bamlRender({ fn: "DiagnoseBuild", args, images: { concept, renders } });
  const { text } = await runTieredOp({ tier: TIER, prompt, images });
  const critique = await bamlParse({ fn: "DiagnoseBuild", text });
  return { ev: critiqueEvidence(critique), items: itemsOf(critique), score: styleFidelityScore(critique) };
}

async function main() {
  // ---- asset guard before ANY spend ----
  const guard = [PACK, CONCEPT, NEW_ARTIFACT, NEW_PROGRAM, OLD_ARTIFACT,
    ...azimuths.map((a) => `${RENDER_DIR}/view-gatehouse-${a}.png`)];
  for (const rel of guard) if (!existsSync(join(ROOT, rel))) throw new Error(`missing asset: ${rel}`);

  const before = await dist(OLD_ARTIFACT);
  const after = await dist(NEW_ARTIFACT);
  console.log(`[guard] assets present. walls: before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
  if (GUARD_ONLY) { console.log("[guard] GUARD_ONLY — no spend; exiting clean."); return; }

  const pack = loadStylePack(join(ROOT, PACK));
  const program = JSON.parse(await readFile(join(ROOT, NEW_PROGRAM), "utf8"));
  const concept = await toB64(join(ROOT, CONCEPT));
  const renders = await Promise.all(azimuths.map((a) => toB64(join(ROOT, RENDER_DIR, `view-gatehouse-${a}.png`))));

  const votes = [];
  for (let v = 0; v < VOTES; v++) {
    const d = await diagnose({ program, pack, concept, renders });
    votes.push({ score: d.score, nWrongStyle: d.ev.nWrongStyle, wrongStyleCapped: d.ev.wrongStyleCapped, items: d.items });
    console.log(`[selfconcept] v${v + 1}: score=${d.score} nWrongStyle=${d.ev.nWrongStyle}/${d.items.length}`);
  }
  const scoreMean = round(mean(votes.map((x) => x.score)));
  const lift = scoreMean - E40_FLOOR;
  const verdict = lift > 12
    ? `LIFTED — self-concept ${scoreMean} ≫ the ~${E40_FLOOR} floor (faithful stone walls moved the score)`
    : lift > 0
      ? `MODEST LIFT — self-concept ${scoreMean} > the ~${E40_FLOOR} floor, but still low; inspect the per-item breakdown for the cap (roof → S-172, or the term → E-41)`
      : `STILL CAPPED — self-concept ${scoreMean} ≈ the ~${E40_FLOOR} floor despite faithful stone walls; the binding gate is NOT the wall material (attribute via per-item breakdown: roof-dominant dark_oak prism → S-172, or the style-distance term → E-41)`;

  const result = {
    schema: "selfconcept-score/v1", ticket: "T-171-01", tier: TIER, votes: VOTES,
    pack: "rustic", concept: CONCEPT, build: NEW_ARTIFACT, program: NEW_PROGRAM,
    materials: { before, after }, e40Floor: E40_FLOOR, scoreMean, lift, verdict,
    votesDetail: votes,
  };
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(result, null, 2) + "\n");

  console.log("\n================ GATEHOUSE SELF-CONCEPT ================");
  console.log(`materials: walls were polished_basalt ${before["minecraft:polished_basalt"] ?? 0}% → now stone_bricks ${after["minecraft:stone_bricks"] ?? 0}%`);
  console.log(`score: ${scoreMean} (floor ~${E40_FLOOR}, lift ${lift >= 0 ? "+" : ""}${lift})`);
  console.log(verdict);
  console.log("=======================================================");
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
