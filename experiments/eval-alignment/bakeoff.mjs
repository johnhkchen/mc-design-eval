#!/usr/bin/env node
/**
 * SPLIT-vs-FUSED DISPATCH BAKE-OFF (T-166-01, story S-166, epic E-39) — claim 1's referee.
 *
 * On a FIXED set of (concept, build) states, each with an analyst GROUND-TRUTH worst-defect DEPARTMENT,
 * run both creation-loop paths and ask: did the path's worst-defect department equal the ground truth?
 *   - SPLIT (diagnose→route): worst = dispatch[0].department — TYPED by construction.
 *   - FUSED (CritiqueWorkshopRound): worst = first major issue's free-text `region`, mapped by the LOSSY
 *     regionToDepartment adapter (matched:false ⇒ no keyword hit → the untyped-ness is in the evidence).
 *
 * FALSIFIABLE (lead with how it fails): the split routes to the correct department MORE often than fused.
 * IT FAILS — report it, recommend collapse — if split ties or loses (the typed `department` + the per-style
 * grounding buy no dispatch gain over the fused free-text region).
 *
 * HONEST LIMITATIONS (named, not hidden):
 *  - Ground truth is an ANALYST label on glaring defects, not a model/consensus label. Only unambiguous
 *    worst-defects are included; ambiguous states are excluded (logged below). Each carries a `why` + a
 *    render path so a human can re-check.
 *  - Our available build states CLUSTER ON ROOF (early rounds are roofless; the roof is the project's
 *    binding constraint). Two of three states are ROOF; the cottage WALL label is lower-confidence
 *    (chaotic/broken envelope). A both-paths-always-correct TIE on the ROOF states is itself reportable.
 *  - Both paths parse via the lenient bridge `bamlParse` (not the loop's strict parser) so one off reply
 *    does not abort the sample — same leniency for both, fair.
 *
 * One model call per layer per path, no re-ask (spend caution). NOT in `npm test`. Writes evidence under
 * experiments/eval-alignment/results/. Not the frozen instrument.
 *
 *   npm run bakeoff
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { runTieredOp } from "../../src/model-tier.mjs";
import { bamlRender, bamlParse } from "../../src/baml/bridge.mjs";
import { diagnoseRenderArgs } from "../../src/workshop/diagnose.mjs";
import { routeRenderArgs, resolveDispatch } from "../../src/workshop/route.mjs";
import { critiqueRenderArgs } from "../../src/workshop/critique.mjs";
import { ACTION_NAMES } from "../../src/workshop/actions.mjs";
import {
  worstDepartmentOfDispatch, worstDepartmentOfFusedReply, dispatchCorrectness, BAKEOFF_SCHEMA,
} from "../../src/workshop/bakeoff-score.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = fileURLToPath(new URL("./", import.meta.url));
const TIER = "strong";
const VOTES = 3;
const azimuths = [...MULTI_ANGLE_GATE.azimuths];

// A synthetic gatehouse program (recognized-shape + compiled-shape) — held fixed; the gatehouse has no
// committed recognition/workshop program. Labelled as a stand-in (only fills the prompt grounding blocks).
const SYNTH_RECOG = { reading: { summary: "A square stone gatehouse: thick masonry walls, a steep gabled roof, an arched gate." },
  masses: [{ id: "gatehouse", role: "gatehouse", roof: { idiom: "roof.gable", pitchClass: 2 }, walls: { role: "wall.stone" }, openings: [{ kind: "gate", treatment: "arch" }] }] };
const SYNTH_WORKSHOP = { elements: [] };

// concept paths (the "concept.png" files are JPEG bytes despite the extension — sniffed in toB64).
const CONCEPTS = {
  barn: "benchmarks/sculpture/runs/017-vBuilding-a-rectangular-stone-tithe-barn-with-a-steep-gabled-roof-and-large-timber-wagon-doors/concept.png",
  cottage: "benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png",
  gatehouse: "benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png",
};

// The FIXED states — two genuine, distinct-ground-truth states. The build corpus CLUSTERS ON ROOF (early
// rounds are roofless; the roof is the project's binding constraint) and offers no roofless 4-azimuth
// gatehouse (baseline/autonomy rounds are single-view), so the sample is small and under-powered — named,
// not hidden. recogPath/workshopPath null ⇒ synthetic stand-in (unused now; kept for the gatehouse path).
const STATES = [
  { key: "barn-r1", ground: "ROOF", confidence: "high", concept: CONCEPTS.barn, renderDir: "builds/barn/round-1",
    pack: "packs/rustic.json", recogPath: "benchmarks/sculpture/recognition/barn.program.json",
    workshopPath: "benchmarks/sculpture/workshop/barn/program.json",
    why: "Open roofless shell — no roof present at all; the concept is a steep-gabled barn. ROOF is unmistakably the worst defect." },
  { key: "cottage-newroof", ground: "WALL", confidence: "medium", concept: CONCEPTS.cottage, renderDir: "builds/cottage/new-roof",
    pack: "packs/rustic.json", recogPath: "benchmarks/sculpture/recognition/cottage.program.json",
    workshopPath: "benchmarks/sculpture/workshop/cottage/program.json",
    why: "Roof present and coherent, but the lower-storey WALLS are holey/incomplete (gaps between stone base and roof) vs a tidy Tudor cottage. WALL is the worst defect — MEDIUM confidence (roof is fine, walls clearly broken)." },
];

// Excluded, logged (no silent cap):
const EXCLUDED = [
  { key: "gatehouse-baseline/autonomy", reason: "Roofless (clean ROOF ground truth) but only ONE azimuth on disk — the 4-render gate lens cannot be fed; excluded rather than padded." },
  { key: "barn--saltcrag-r0", reason: "Near-complete barn at its single saved azimuth; sparse-skin gap is palette/coverage, not a clean department — ambiguous." },
  { key: "cottage-r1", reason: "Chaotic broken blob — the worst defect spans massing+roof+envelope at once; no single unambiguous department." },
];

const toB64 = async (p) => {
  const buf = await readFile(p);
  const mediaType = buf.slice(0, 3).toString("hex") === "ffd8ff" ? "image/jpeg" : "image/png";
  return { base64: buf.toString("base64"), mediaType };
};
const loadJson = async (rel) => JSON.parse(await readFile(join(ROOT, rel), "utf8"));

async function main() {
  // ---- asset guard before any spend ----
  for (const s of STATES) {
    if (!existsSync(join(ROOT, s.concept))) throw new Error(`missing concept: ${s.concept}`);
    for (const a of azimuths) {
      const p = join(ROOT, s.renderDir, `view-${a}.png`);
      if (!existsSync(p)) throw new Error(`missing render: ${p}`);
    }
    if (s.recogPath && !existsSync(join(ROOT, s.recogPath))) throw new Error(`missing recog program: ${s.recogPath}`);
    if (s.workshopPath && !existsSync(join(ROOT, s.workshopPath))) throw new Error(`missing workshop program: ${s.workshopPath}`);
  }
  console.log(`[bakeoff] ${STATES.length} states, ${VOTES} votes, tier ${TIER}; excluded: ${EXCLUDED.map((e) => e.key).join(", ")}`);

  const rows = [];
  for (const s of STATES) {
    const pack = loadStylePack(join(ROOT, s.pack));
    const concept = await toB64(join(ROOT, s.concept));
    const renders = await Promise.all(azimuths.map((a) => toB64(join(ROOT, s.renderDir, `view-${a}.png`))));
    const recog = s.recogPath ? await loadJson(s.recogPath) : SYNTH_RECOG;
    const workshop = s.workshopPath ? await loadJson(s.workshopPath) : SYNTH_WORKSHOP;

    for (let v = 0; v < VOTES; v++) {
      // ---- SPLIT: DiagnoseBuild → RouteCritique → dispatch[0].department ----
      let splitDept = "ERROR", fusedDept = "ERROR", fusedMatched = null, fusedRegion = "";
      try {
        const diag = await bamlRender({ fn: "DiagnoseBuild", args: diagnoseRenderArgs({ program: recog, pack, azimuths }), images: { concept, renders } });
        const critique = await bamlParse({ fn: "DiagnoseBuild", text: (await runTieredOp({ tier: TIER, prompt: diag.prompt, images: diag.images })).text });
        const route = await bamlRender({ fn: "RouteCritique", args: routeRenderArgs({ critique }) });
        const dispatch = resolveDispatch(await bamlParse({ fn: "RouteCritique", text: (await runTieredOp({ tier: TIER, prompt: route.prompt })).text }));
        splitDept = worstDepartmentOfDispatch(dispatch);
      } catch (e) { console.error(`[bakeoff] ${s.key} v${v + 1} SPLIT error: ${e.message}`); }

      // ---- FUSED: CritiqueWorkshopRound → first major issue region → department ----
      try {
        const args = critiqueRenderArgs({ program: workshop, pack, round: 6, budget: 2, liveActions: ACTION_NAMES, azimuths, conformance: { checks: [] }, lastRound: null, source: recog });
        const fused = await bamlRender({ fn: "CritiqueWorkshopRound", args, images: { concept, renders } });
        const reply = await bamlParse({ fn: "CritiqueWorkshopRound", text: (await runTieredOp({ tier: TIER, prompt: fused.prompt, images: fused.images })).text });
        const w = worstDepartmentOfFusedReply(reply);
        fusedDept = w.department; fusedMatched = w.matched; fusedRegion = w.region;
      } catch (e) { console.error(`[bakeoff] ${s.key} v${v + 1} FUSED error: ${e.message}`); }

      rows.push({ key: s.key, ground: s.ground, splitDept, fusedDept, fusedMatched, fusedRegion });
      console.log(`[bakeoff] ${s.key} v${v + 1}: ground=${s.ground}  split=${splitDept}  fused=${fusedDept}${fusedMatched === false ? " (region unmapped→WALL)" : ""}  fusedRegion="${fusedRegion}"`);
    }
  }

  const summary = dispatchCorrectness(rows);
  await mkdir(join(HERE, "results"), { recursive: true });
  await writeFile(join(HERE, "results", "bakeoff.json"),
    JSON.stringify({ schema: BAKEOFF_SCHEMA, tier: TIER, votes: VOTES, states: STATES.map(({ key, ground, confidence, why, renderDir }) => ({ key, ground, confidence, why, renderDir })), excluded: EXCLUDED, rows, summary }, null, 2) + "\n");

  console.log("\n================ BAKE-OFF VERDICT ================");
  console.log(`states×votes = ${summary.n}`);
  console.log(`split correct: ${summary.split.correct}/${summary.n} (${(summary.split.rate * 100).toFixed(0)}%)`);
  console.log(`fused correct: ${summary.fused.correct}/${summary.n} (${(summary.fused.rate * 100).toFixed(0)}%)  [${summary.fused.unmatchedRegions} region(s) unmapped→WALL]`);
  console.log(`-> ${summary.verdict}`);
  console.log("=================================================");
}
main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
