// VISIBILITY WITNESS RUNNER (T-137-01, story S-137, epic E-33) — committed multi-angle gate
// records re-censused through the visibility-aware arithmetic, judge-free. The T-127 subject never
// reached the judge: the per-view coverage precondition refused every view on band1, a band with
// ZERO cells in the census identity (the roof program owns its whole y-range — the camera cannot
// see what is not on the skin). This runner replays the RECORDED per-view censuses through
// visibilityAwareCoverage (both arithmetics — aware + legacy — in the output), re-derives the
// census from the record's pinned artifact as a fidelity check (named drift, never silent), and
// computes the exposure-skin existence basis the cross-view rule needs. NO JUDGE RUNS; T-138-01
// owns the epic's judge calls — this runner names no judge seam.
//
// RECORDS AT NEW PATHS (benchmarks/sculpture/visibility/<subject>-<label>.*): the committed
// multi-angle verdict records are pins and stay byte-untouched (T-119 pin policy).
//
//   live      derive + write records (pin-guarded, preflighted before any write)
//   --repro   re-derive and byte-compare the committed witness records; exit-coded
//   --offline alias of --repro (no model/GL layer here at all)
//
// Usage: node benchmarks/sculpture/visibility-witness.mjs --subject <key> --label <label> | --all
//        [--repro|--offline] [--rotate-pins]

import { readFile, mkdir } from "node:fs/promises";
import { readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { guardedWriteRecord, preflightPins, loadTrackedSet, isTracked, ROTATE_FLAG } from "../../src/form/pin-guard.mjs";
import { classifyWitnessRepro, retiredEntry, WITNESS_REPRO_VERDICT } from "../../src/form/witness-repro.mjs";
import { MULTI_ANGLE_GATE_SCHEMA } from "../../src/form/multi-angle-gate.mjs";
import { visibilityAwareCoverage, VISIBILITY_COVERAGE_SCHEMA, DEFAULT_COVERAGE_THRESHOLD } from "../../src/view/face-resemblance.mjs";
import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { reviveComponentPlan, planCensusZoneOf } from "../../src/view/component-plan.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
// the census comes from the gate's own exported definition — the witness provably re-runs the
// gate's census, and the zone-fill technique stays behind the gate runner's allowlisted door
import { GATE_SUBJECTS, deriveZones, gateCensuses } from "./multi-angle-gate.mjs";

export const VISIBILITY_WITNESS_SCHEMA = "visibility-witness/v1";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const REC_DIR = join(HERE, "multi-angle");
const OUT_REL = "benchmarks/sculpture/visibility";

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const jsonOf = (x) => JSON.stringify(x, null, 2) + "\n";

/** The witness-record paths for a gate record slug. */
export function witnessRels(subject, label) {
  const base = `${OUT_REL}/${subject}-${label}`;
  return Object.freeze({ slug: `${subject}-${label}`, record: `${base}.json`, md: `${base}.md` });
}

/** Recorded byZone row → a coverageGate-consumable census row (the committed record stores the
 *  gated metric's fraction as `fraction`; rebuild the metric-named field the gate reads). Same
 *  normalization the visibility-monotone replay test applies. */
function rowFromRecord(r) {
  const own = r.metric === "own";
  return {
    total: r.total, byBlock: {}, dominant: r.dominant, own: r.own ?? null,
    dominantFraction: own ? (r.dominantFraction ?? null) : r.fraction,
    ownFraction: own ? r.fraction : null,
  };
}

/** E-25 Rule 3 self-grep: no subject keys in this runner's source. */
async function generalizationGrep() {
  const src = await readFile(fileURLToPath(import.meta.url), "utf8");
  const hits = Object.keys(GATE_SUBJECTS).filter((k) => src.includes(k));
  return { subjectKeysInRunner: hits, clean: hits.length === 0 };
}

/**
 * The deterministic derivation both modes share: committed gate record → the re-censused witness
 * record. Replays the RECORDED rows (the record is the subject of the witness); the re-derived
 * census is the fidelity check (drift named per band/view) and supplies the exposure existence
 * basis. Throws on a missing record, a schema mismatch, or an artifact-pin mismatch.
 */
async function derive(subject, label) {
  const def = GATE_SUBJECTS[subject];
  if (!def) throw new Error(`unknown subject "${subject}" — the registry has: ${Object.keys(GATE_SUBJECTS).join(", ")}`);
  const recRel = `benchmarks/sculpture/multi-angle/${subject}-${label}.json`;
  const recPath = join(ROOT, recRel);
  if (!existsSync(recPath)) throw new Error(`no committed gate record at ${recRel} — the witness re-censuses committed records only`);
  const recText = await readFile(recPath, "utf8");
  const rec = JSON.parse(recText);
  if (rec.schema !== MULTI_ANGLE_GATE_SCHEMA) throw new Error(`${recRel} is not a ${MULTI_ANGLE_GATE_SCHEMA} record`);

  // the artifact pin, before any work: a changed build is a different measurement.
  const artifactPath = join(ROOT, rec.artifact.path);
  const artifactJson = await readFile(artifactPath, "utf8");
  const artifactSha = sha256(artifactJson);
  if (artifactSha !== rec.artifact.sha256) {
    throw new Error(`artifact pin mismatch: ${rec.artifact.path} is ${artifactSha.slice(0, 12)}…, the record censused ` +
      `${rec.artifact.sha256.slice(0, 12)}… — a changed build needs a fresh gate run (T-138), not a witness`);
  }
  const artifact = JSON.parse(artifactJson);
  assertArtifact(artifact);

  const zones = rec.zones?.policy;
  if (!zones || typeof zones !== "object") throw new Error(`${recRel} carries no zones.policy — nothing to re-census`);
  const judged = (rec.views ?? []).filter((v) => v.coverage?.byZone);
  if (judged.length === 0) throw new Error(`${recRel} has no censused views (render-failed record) — nothing to re-census`);
  const metric = judged.some((v) => Object.values(v.coverage.byZone).some((r) => r.metric === "own")) ? "own" : "dominant";
  const threshold = rec.contract?.coverageThreshold ?? DEFAULT_COVERAGE_THRESHOLD;

  // the census identity, re-derived from the same committed inputs the gate read
  const occ = artifactOccupancy(artifact);
  const matMap = JSON.parse(await readFile(join(HERE, def.map), "utf8"));
  const conceptImg = await decodeImage(join(HERE, def.concept));
  // a witness reads only COMMITTED inputs (T-142-01): consume the sibling component-plan only when
  // it is git-tracked. An untracked plan (a stray local artifact its dir's authority never
  // committed) is excluded — the re-census is then plan-less and reproducible from tracked inputs
  // alone, in any worktree. A tracked plan is consumed exactly as before, so those records stay
  // byte-identical.
  const planRel = rec.artifact.path.replace(/[^/]+$/, "component-plan.json");
  const planPath = join(ROOT, planRel);
  const componentPlan = existsSync(planPath) && isTracked(loadTrackedSet(ROOT), planRel)
    ? reviveComponentPlan(JSON.parse(await readFile(planPath, "utf8"))) : null;
  const derived = deriveZones({ occ, conceptImg, matMap, fallbackPolicy: def.policy, componentPlan });
  const zoneOf = componentPlan ? planCensusZoneOf(derived.zoneOf, componentPlan, derived.bandNames ?? []) : derived.zoneOf;

  // fidelity check: the re-derived per-view totals (the gate's OWN census export) must reproduce
  // the committed denominators
  const censuses = gateCensuses(occ, zoneOf, judged.map((v) => v.angle), zones);
  const rederivedByAngle = new Map(censuses.perView.map((c) => [c.angle, c.coverage]));
  const drift = [];
  for (const v of judged) {
    const hist = rederivedByAngle.get(v.angle);
    for (const band of Object.keys(zones)) {
      const recorded = v.coverage.byZone[band]?.total ?? 0;
      const rederived = hist[band]?.total ?? 0;
      if (recorded !== rederived) drift.push({ angle: v.angle, band, recorded, rederived });
    }
  }
  const exposure = Object.fromEntries(Object.keys(zones).map((b) => [b, { total: censuses.exposure[b]?.total ?? 0 }]));

  // the re-census: RECORDED rows through the visibility-aware arithmetic (both arithmetics out)
  const vis = visibilityAwareCoverage({
    views: judged.map((v) => ({
      angle: v.angle,
      coverage: Object.fromEntries(Object.entries(v.coverage.byZone).map(([z, r]) => [z, rowFromRecord(r)])),
    })),
    zones, exposure, threshold, metric,
  });

  const legacyPassedViews = vis.views.filter((v) => v.legacy.passed).map((v) => v.angle);
  const awarePassedViews = vis.views.filter((v) => v.aware.passed).map((v) => v.angle);
  const grep = await generalizationGrep();
  return {
    schema: VISIBILITY_WITNESS_SCHEMA,
    ticket: "T-137-01",
    subject, label,
    source: { record: recRel, sha256: sha256(recText), artifact: rec.artifact },
    contract: rec.contract, // copied verbatim — thresholds/azimuths/judge unmoved
    zones: { source: rec.zones.source, policy: zones },
    metric,
    censusCheck: { rederivedMatchesRecord: drift.length === 0, drift },
    exposure: { basis: drift.length === 0 ? "rederived" : "rederived-with-drift", byBand: exposure },
    arithmetic: VISIBILITY_COVERAGE_SCHEMA,
    views: vis.views,
    visibility: vis.visibility,
    precondition: {
      legacyPassedViews, awarePassedViews,
      unblocked: awarePassedViews.length > legacyPassedViews.length,
    },
    judge: "not-called — T-138-01 owns the epic's judge runs",
    generalization: grep,
  };
}

function recordMd(w) {
  const rows = w.views.map((v) => {
    const excluded = Object.entries(v.aware.byZone).filter(([, c]) => c.excluded).map(([z, c]) => `${z}: ${c.status}`);
    const awareCell = v.aware.passed ? "pass" : v.aware.failures.map((f) => `${f.zone}=${f.fraction ?? "0"}`).join(", ");
    const legacyCell = v.legacy.passed ? "pass" : v.legacy.failures.map((f) => `${f.zone}=${f.fraction ?? "—"}`).join(", ");
    return `| ${v.angle} | ${legacyCell} | ${awareCell} | ${excluded.join("<br>") || "—"} |`;
  }).join("\n");
  const bands = Object.entries(w.visibility.byBand)
    .map(([b, i]) => `- \`${b}\`: **${i.status}** — visible from [${i.visibleViews.join(", ") || "no view"}], ${i.exposedCells} exposure-skin cells`)
    .join("\n");
  return `# Visibility witness — ${w.subject} (${w.label}) — T-137-01\n\n` +
    `Committed gate record \`${w.source.record}\` re-censused through the visibility-aware arithmetic ` +
    `(\`${w.arithmetic}\`). Contract copied verbatim; **no judge call** (${w.judge}).\n\n` +
    `**Precondition:** legacy ${w.precondition.legacyPassedViews.length}/${w.views.length} views passing → ` +
    `aware ${w.precondition.awarePassedViews.length}/${w.views.length}` +
    (w.precondition.unblocked ? " — **the invisibility refusal is lifted**" : " — unchanged") + ".\n\n" +
    `| view | legacy (empty-census-fails) | visibility-aware | excluded bands |\n|---|---|---|---|\n${rows}\n\n` +
    `## Band visibility\n${bands}\n\n` +
    `Cross-view verdict: ${w.visibility.passed ? "no hidden band" : `**named failure** — ${w.visibility.failures.map((f) => `${f.band} (${f.reason})`).join(", ")}`}.\n\n` +
    `Census fidelity: re-derivation ${w.censusCheck.rederivedMatchesRecord ? "reproduces every committed denominator" : `DRIFTS on ${w.censusCheck.drift.length} band-view(s) — recorded numbers replayed, drift named`}; ` +
    `exposure basis: ${w.exposure.basis}.\n`;
}

/** Committed gate-record slugs, registry-resolved (subject keys come from the registry, slugs from
 *  the records on disk — longest-key match handles keys that contain hyphens). */
function committedSlugs() {
  const keys = Object.keys(GATE_SUBJECTS).sort((a, b) => b.length - a.length);
  const out = [];
  for (const f of readdirSync(REC_DIR).filter((x) => x.endsWith(".json")).sort()) {
    const stem = f.replace(/\.json$/, "");
    const subject = keys.find((k) => stem.startsWith(`${k}-`));
    if (subject) out.push({ subject, label: stem.slice(subject.length + 1) });
  }
  return out;
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
  const repro = argv.includes("--repro") || argv.includes("--offline");
  const rotate = argv.includes(ROTATE_FLAG);
  const targets = argv.includes("--all")
    ? committedSlugs()
    : [{ subject: arg("--subject"), label: arg("--label") }];
  if (!targets.length || targets.some((t) => !t.subject || !t.label)) {
    throw new Error("usage: --subject <key> --label <label> | --all  [--repro|--offline]");
  }

  const grep = await generalizationGrep();
  if (!grep.clean) throw new Error(`generalization grep: subject keys in runner source: ${grep.subjectKeysInRunner.join(", ")}`);

  // the sanctioned-rotation registry (committed sidecar — subject keys live there, not in this
  // source, so the self-grep above stays clean). T-142-01: T-138 re-judged these gate records.
  const RETIRED_GATE = JSON.parse(await readFile(join(ROOT, "benchmarks/sculpture/retired-pins.json"), "utf8")).visibility;

  let failures = 0;
  for (const t of targets) {
    const rels = witnessRels(t.subject, t.label);
    let witness;
    try {
      witness = await derive(t.subject, t.label);
    } catch (e) {
      console.error(`[${rels.slug}] SKIP — ${e.message}`);
      if (!argv.includes("--all")) throw e;
      continue;
    }
    const recJson = jsonOf(witness);
    const mdText = recordMd(witness);
    if (repro) {
      const committedPath = join(ROOT, rels.record);
      if (!existsSync(committedPath)) {
        console.error(`[${rels.slug}] REPRO FAIL — no committed witness record at ${rels.record}`);
        failures++;
        continue;
      }
      const committed = await readFile(committedPath, "utf8");
      // SKIP-vs-FAIL guard (T-142-01): a witness re-censuses a SPECIFIC committed gate record. When
      // T-138's sanctioned rotation re-judged it, the pinned source sha no longer matches — a
      // registered retirement SKIPs (named), an unchanged gate that diverges still FAILs below, an
      // undeclared change FAILs here.
      const committedRec = JSON.parse(committed);
      const gateRel = committedRec.source?.record;
      const currentGateSha = gateRel && existsSync(join(ROOT, gateRel))
        ? sha256(await readFile(join(ROOT, gateRel), "utf8")) : null;
      const verdict = classifyWitnessRepro({
        pinnedSourceSha: committedRec.source?.sha256,
        currentSourceSha: currentGateSha,
        retired: retiredEntry(rels.slug, RETIRED_GATE),
      });
      if (verdict.verdict === WITNESS_REPRO_VERDICT.SKIP) {
        console.error(`[${rels.slug}] SKIP — ${verdict.reason}`);
        continue;
      }
      if (verdict.verdict === WITNESS_REPRO_VERDICT.FAIL) {
        console.error(`[${rels.slug}] REPRO FAIL — ${verdict.reason}`);
        failures++;
        continue;
      }
      const same = committed === recJson;
      console.error(`[${rels.slug}] repro: ${same ? "byte-identical" : "DIVERGES"}`);
      if (!same) failures++;
    } else {
      const trackedSet = loadTrackedSet(ROOT);
      preflightPins({
        pins: [rels.record, rels.md].map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })),
        rotate, intent: `visibility witness (${rels.slug}) — re-emitting a committed witness record`,
      });
      await mkdir(join(ROOT, OUT_REL), { recursive: true });
      await guardedWriteRecord({ root: ROOT, rel: rels.record, content: recJson, rotate });
      await guardedWriteRecord({ root: ROOT, rel: rels.md, content: mdText, rotate });
      console.error(`[${rels.slug}] legacy ${witness.precondition.legacyPassedViews.length}/${witness.views.length} → ` +
        `aware ${witness.precondition.awarePassedViews.length}/${witness.views.length} views passing; ` +
        `visibility ${witness.visibility.passed ? "clean" : "NAMED FAILURE"}; ` +
        `census ${witness.censusCheck.rederivedMatchesRecord ? "reproduced" : `drift ×${witness.censusCheck.drift.length}`} — wrote ${rels.record}`);
    }
  }
  if (failures > 0) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(2); });
}
