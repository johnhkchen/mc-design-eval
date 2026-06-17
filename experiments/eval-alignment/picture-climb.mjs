#!/usr/bin/env node
/**
 * THE PICTURE-DRIVEN CLIMB (T-188-01, story S-188, epic E-48) — the first sustained climb steered by the
 * E-47 picture-anchored DiagnoseBuild critique (the creation-loop critique, NOT the frozen instrument).
 *
 * Forked from autonomy-loop.mjs (the E-38 agentic climb, left untouched as the defect-dominated baseline
 * contrast). What changed: (1) the gradient is now the structured, multi-azimuth, concept-image-anchored
 * DiagnoseBuild term (styleFidelityScore + critiqueEvidence), not a single-view defect-dominated quality
 * eval; (2) an ACCEPT-GATE keeps a round only if it moved TOWARD the concept on the picture critique
 * (acceptsRound), rolling back otherwise; (3) a RESTRAINT / STOPPING rule converges instead of oscillating
 * (stoppingDecision). The three construction HANDS are reused verbatim — no new hands this ticket.
 *
 * The deliverable is the GLANCE (per-round beside-concept renders) + the EYES-vs-HANDS inventory
 * (classifyInventory): which named critiques the loop could act on vs which it named but had no lever for.
 *
 * NOT in `npm test`. Metered (VOTES strong-tier diagnoses per scored build). Asset-guarded; GUARD_ONLY=1
 * renders round-0 + the beside sheet and exits BEFORE any spend.
 *
 *   GUARD_ONLY=1 node experiments/eval-alignment/picture-climb.mjs   # wiring + render seam, zero spend
 *   node experiments/eval-alignment/picture-climb.mjs                # the metered climb
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { artifactOccupancy, occupancyFromCells } from "../../src/view/occupancy.mjs";
import { gableRecord, generateRoof } from "../../src/view/roof-generate.mjs";
import { constructWalls } from "../../src/view/wall-generate.mjs";
import { wallSkin } from "../../src/view/wall-skin.mjs";
import { extractApertures, dressOpenings } from "../../src/view/opening-dressing.mjs";
import { roleBlock } from "../../src/recognition/compile.mjs";
import { infillPanel } from "../../src/view/facade-articulation.mjs";
import { rebuildArtifact } from "../../src/view/shell-integrity.mjs";
import { renderViews } from "../../src/view/multi-angle.mjs";
import { renderBesideConcept, assertGlAvailable } from "../../src/view/render-beside.mjs";
import { requestText } from "../../src/sdk-binding.mjs";

import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { runTieredOp } from "../../src/model-tier.mjs";
import { bamlRender, bamlParse } from "../../src/baml/bridge.mjs";
import { diagnoseRenderArgs } from "../../src/workshop/diagnose.mjs";
import { critiqueEvidence, itemStyleClass, styleFidelityScore } from "../../src/workshop/bakeoff-score.mjs";
import { acceptsRound, stoppingDecision, classifyInventory, CLIMB_DEFAULTS } from "../../src/workshop/climb-gate.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");

// ---- the gatehouse subject (the climb seed + the real recognition program for the diagnose grounding) ----
const SUBJECT = "gatehouse";
const SEED_ARTIFACT = "benchmarks/sculpture/generated/gatehouse/artifact.json";
const PROGRAM_PATH = "benchmarks/sculpture/recognition/gatehouse.program.json";
const PACK_PATH = "packs/rustic.json";
const CONCEPT = "benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png";
const CFG = { eaveY: 18, ridgeAxis: "z" };

const AZIMUTHS = [...MULTI_ANGLE_GATE.azimuths];
const TIER = "strong";
const VOTES = 3;                       // median out the matched-build 0-76 score swing (T-187 research)
const AGENT_MODEL = "claude-sonnet-4-6";
const { margin, stallK, maxRounds, minRounds } = CLIMB_DEFAULTS;
const GUARD_ONLY = process.env.GUARD_ONLY === "1";

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const toB64 = async (p) => {
  const buf = await readFile(p);
  const mediaType = buf.slice(0, 3).toString("hex") === "ffd8ff" ? "image/jpeg" : "image/png";
  return { base64: buf.toString("base64"), mediaType };
};
const parse = (t) => { const s = t.indexOf("{"), e = t.lastIndexOf("}"); return JSON.parse(t.slice(s, e + 1)); };
const occToCells = (occ) => {
  const out = [];
  for (const [key, block] of occ.cells) out.push({ pos: key.split(",").map(Number), block, form: occ.forms.get(key), state: occ.states.get(key) });
  return out;
};

// ====================== the three HANDS (reused verbatim from autonomy-loop.mjs) ======================
function apply_gable_roof(occ) {
  const kept = []; let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [key, block] of occ.cells) {
    const [x, y, z] = key.split(",").map(Number);
    if (y >= CFG.eaveY + 1) continue;
    kept.push({ pos: [x, y, z], block, form: occ.forms.get(key), state: occ.states.get(key) });
    if (y === CFG.eaveY) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  }
  const perp = CFG.ridgeAxis === "z" ? x1 - x0 : z1 - z0;
  const gable = gableRecord({ footprint: { x0, x1, z0, z1 }, ridgeAxis: CFG.ridgeAxis, eaveY: CFG.eaveY, ridgeY: CFG.eaveY + Math.floor(perp / 2), pitch: 1, hip: { demanded: false } });
  const FAMILY = { field: "spruce_planks", stairs: "spruce_stairs", slab: "spruce_slab", findings: [] };
  return occupancyFromCells([...kept, ...generateRoof([gable], FAMILY).cells]);
}
function loadProgram(rel) { const p = join(ROOT, rel); return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null; }
function loadPackOf(program) { if (!program?.pack) return null; const p = join(ROOT, "packs", `${program.pack}.json`); return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null; }
function construct_walls(occ) {
  const program = loadProgram(PROGRAM_PATH);
  const pack = loadPackOf(program);
  const floor = occ.bounds.min[1];
  const groundRole = program?.masses?.[0]?.walls?.ground?.role;
  const wallField = (pack && groundRole) ? roleBlock(pack, groundRole) : undefined;
  const env = constructWalls(occ, { floor, eaveY: CFG.eaveY, program, wallField });
  return wallSkin(env, { program, pack, floor, eaveY: CFG.eaveY, extractApertures, dressOpenings });
}
function add_timber_framing(occ) {
  const eave = CFG.eaveY;
  const upperStart = Math.floor(eave / 2) + 1;
  const r = infillPanel(occ, {
    memberMaterial: "dark_oak_log", fieldMaterial: "white_terracotta",
    faces: ["+x", "-x", "+z", "-z"], rhythm: { period: 3, phase: 0 }, span: 1, depth: 1,
    zoneOf: ([x, y, z]) => y >= upperStart && y <= eave, zone: true,
  });
  return occupancyFromCells([...occToCells(occ), ...r.placements.map((p) => ({ pos: p.pos, block: p.block }))]);
}
const TOOLS = { apply_gable_roof, construct_walls, add_timber_framing };
const MENU = [
  "- apply_gable_roof: replace the roof with a crisp parametric gable. Best when the worst divergence is the ROOF (form/shape/presence).",
  "- construct_walls: REBUILD the wall envelope and skin it as construction from the pack roles (per-storey material, dressed quoins, clinker courses, a plinth, dressed openings). Best for STRUCTURAL wall holes / missing walls / a monotone single-material wall.",
  "- add_timber_framing: add timber-frame studs + plaster infill on the upper storey. Best for a uniform/monotone WALL with no material contrast / missing half-timber detail.",
  "- done: stop — the build reads like the concept, or no tool addresses the worst remaining divergence.",
].join("\n");

// ============================= the GRADIENT: picture-anchored DiagnoseBuild =============================
let PROGRAM, PACK, CONCEPT_IMG;            // loaded once in main (after the guard)

const itemsOf = (critique) => (critique?.items ?? []).map((it) => ({
  department: it.department, severity: it.severity, present: it.present ?? "", missing: it.missing ?? "",
  kind: it.kind ?? null, styleClass: itemStyleClass(it),
}));

/** One DiagnoseBuild → {ev, items, score}. No re-ask (a zero-token notice only burns budget). */
async function diagnose(renders) {
  const args = diagnoseRenderArgs({ program: PROGRAM, pack: PACK, azimuths: AZIMUTHS });
  const { prompt, images } = await bamlRender({ fn: "DiagnoseBuild", args, images: { concept: CONCEPT_IMG, renders } });
  const { text } = await runTieredOp({ tier: TIER, prompt, images });
  const critique = await bamlParse({ fn: "DiagnoseBuild", text });
  return { ev: critiqueEvidence(critique), items: itemsOf(critique), score: styleFidelityScore(critique) };
}

/** Render the four azimuths + the beside sheet, then score the build by VOTES median DiagnoseBuild. */
async function scoreBuild(occ, template, round, tag) {
  const roundDir = join(ROOT, `builds/${SUBJECT}/picture-climb/round-${round}`);
  const artifact = rebuildArtifact(occ, template);
  await renderViews(artifact, AZIMUTHS, { outDir: roundDir, label: (a) => a, width: 512, height: 512 });
  await renderBesideConcept(artifact, join(ROOT, CONCEPT), join(roundDir, "beside-concept.png"), { label: `r${round}` });
  if (GUARD_ONLY) return { score: null, dir: roundDir }; // render seam proven, no spend
  const renders = await Promise.all(AZIMUTHS.map((a) => toB64(join(roundDir, `view-${a}.png`))));
  const samples = [];
  for (let v = 0; v < VOTES; v++) {
    try { samples.push(await diagnose(renders)); }
    catch (e) { console.error(`  [${tag} r${round}] vote ${v + 1} dropped (malformed, no re-ask): ${e.message}`); }
  }
  if (!samples.length) throw new Error(`scoreBuild: all ${VOTES} diagnoses failed at round ${round}`);
  const scores = samples.map((s) => s.score);
  const med = samples.find((s) => s.score === median(scores)) ?? samples[0];
  return { ...med.ev, score: med.score, items: med.items, scores, dir: roundDir };
}

const evOf = (b) => ({ score: b.score, nItems: b.nItems, nMajor: b.nMajor, nWrongStyle: b.nWrongStyle, wrongStyleBreadth: b.wrongStyleBreadth, departments: b.departments, missing: b.missing });

async function agentPick(build, history) {
  const top = [...build.items].sort((a, b) => (a.severity === "major" ? 0 : 1) - (b.severity === "major" ? 0 : 1))
    .slice(0, 5).map((it) => `  - ${it.department} (${it.severity}, ${it.kind ?? "?"}): ${it.missing || it.present || "diverges"}`).join("\n");
  const hist = history.length
    ? history.map((h) => `- ${h.tool}: score ${h.qBefore}→${h.qAfter} (${h.accepted ? "KEPT" : "ROLLED BACK — " + h.reason})`).join("\n")
    : "(nothing tried yet)";
  const prompt = [
    "You improve a Minecraft build to look like its CONCEPT IMAGE. A picture-critique reports the build's",
    `current divergences from the concept (picture-fidelity score ${build.score}/100, higher = closer):`,
    top || "  (no items — the build reads like the concept)",
    "Tools already applied, and whether the accept-gate KEPT them (kept only if they moved toward the concept):",
    hist,
    "RULES:",
    "- A tool that was ROLLED BACK did not move this build toward the concept — do NOT pick it again.",
    "- If no tool addresses the worst remaining divergence (e.g. it names a chimney, an interior, or fine",
    "  trim no tool builds), pick `done` — naming a defect you cannot fix is the honest answer.",
    "Pick ONE tool:", MENU,
    'Output ONE JSON: {"tool":"<apply_gable_roof|construct_walls|add_timber_framing|done>","reason":"<short>"}',
  ].join("\n");
  const { text } = await requestText({ prompt, model: AGENT_MODEL });
  return parse(text);
}

// ===================================== the loop with the accept-gate =====================================
async function main() {
  const guard = [SEED_ARTIFACT, PROGRAM_PATH, PACK_PATH, CONCEPT];
  for (const rel of guard) if (!existsSync(join(ROOT, rel))) throw new Error(`missing asset: ${rel}`);
  assertGlAvailable();
  console.error(`[guard] assets present; GL available. subject=${SUBJECT} azimuths=${AZIMUTHS.join(",")} votes=${VOTES} margin=${margin}`);

  const template = JSON.parse(readFileSync(join(ROOT, SEED_ARTIFACT), "utf8"));
  let occ = artifactOccupancy(template);

  if (GUARD_ONLY) {
    await scoreBuild(occ, template, 0, "guard"); // renders round-0 views + beside sheet, zero spend
    console.error(`[guard] GUARD_ONLY — round-0 renders + beside sheet written; no spend; exiting clean.`);
    return;
  }

  PROGRAM = JSON.parse(await readFile(join(ROOT, PROGRAM_PATH), "utf8"));
  PACK = loadStylePack(join(ROOT, PACK_PATH));
  CONCEPT_IMG = await toB64(join(ROOT, CONCEPT));

  const trajectory = [];
  const history = [];
  let prev = await scoreBuild(occ, template, 0, "seed");
  let pick = await agentPick(prev, history);
  console.error(`\n[round 0] score=${prev.score} (${prev.scores.join("/")}) → agent picks ${pick.tool}: ${pick.reason}`);
  trajectory.push({ round: 0, score: prev.score, evidence: evOf(prev), items: prev.items, pick, applied: false, accepted: false });

  let noAcceptStreak = 0, stopReason = "maxRounds", round = 1;
  for (; round <= maxRounds; round++) {
    if (pick.tool === "done" || !TOOLS[pick.tool]) { stopReason = "agent-done"; break; }
    const cand = TOOLS[pick.tool](occ);
    const candScore = await scoreBuild(cand, template, round, "cand");
    const gate = acceptsRound(prev, candScore, { margin });
    if (gate.accept) { occ = cand; }
    noAcceptStreak = gate.accept ? 0 : noAcceptStreak + 1;
    history.push({ tool: pick.tool, qBefore: prev.score, qAfter: candScore.score, accepted: gate.accept, reason: gate.reason });
    console.error(`[round ${round}] ${pick.tool}: ${prev.score}→${candScore.score} (${candScore.scores.join("/")}) — ${gate.accept ? "KEPT" : "ROLLED BACK"} (${gate.reason})`);

    trajectory.push({ round, score: prev.score, evidence: evOf(prev), items: prev.items,
      pick, applied: true, accepted: gate.accept, gate, scoreAfter: { score: candScore.score, scores: candScore.scores } });

    prev = gate.accept ? candScore : prev;
    pick = await agentPick(prev, history);
    console.error(`           next: ${pick.tool} — ${pick.reason}`);
    const stop = stoppingDecision({ round, agentDone: pick.tool === "done", noAcceptStreak, margin, stallK, maxRounds, minRounds });
    if (stop.stop) { stopReason = stop.reason; break; }
  }
  // terminal entry carries the FINAL build score (so classifyInventory's scoreLast reads the kept build)
  trajectory.push({ round, score: prev.score, items: [], pick: { tool: "—" }, applied: false, accepted: false, terminal: true });

  const inventory = classifyInventory(trajectory, { margin });
  const spread = trajectory.filter((t) => t.scoreAfter?.scores).flatMap((t) => t.scoreAfter.scores);
  const out = {
    schema: "picture-climb/v1", subject: SUBJECT, seed: SEED_ARTIFACT, program: PROGRAM_PATH, pack: "rustic",
    concept: CONCEPT, tier: TIER, votes: VOTES, margin, stopReason,
    observedScoreSpread: { min: Math.min(...prev.scores), max: Math.max(...prev.scores), allRoundVotes: spread },
    trajectory, inventory,
  };
  const outPath = join(ROOT, "docs/active/work/T-188-01/trajectory.json");
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(out, null, 2) + "\n");

  const trend = trajectory.map((t) => t.score).join(" → ");
  console.error(`\n================ PICTURE-DRIVEN CLIMB (gatehouse) ================`);
  console.error(`trend: ${trend}  (Δ ${inventory.verdict.delta >= 0 ? "+" : ""}${inventory.verdict.delta}; stop: ${stopReason})`);
  console.error(`verdict: climbed=${inventory.verdict.climbed} stalled=${inventory.verdict.stalled} oscillated=${inventory.verdict.oscillated} actionable=${inventory.verdict.actionableFrac}`);
  console.error(`acted-on: ${inventory.actedOn.map((a) => a.department).join(", ") || "(none)"}`);
  console.error(`eyes-only (named, no lever): ${inventory.eyesOnly.map((e) => e.department).join(", ") || "(none)"}`);
  console.error(`wrote ${outPath} + per-round beside renders under builds/${SUBJECT}/picture-climb/`);
  console.error("==================================================================");
}
main().catch((e) => { console.error("FATAL:", e.message, "\n", e.stack); process.exit(1); });
