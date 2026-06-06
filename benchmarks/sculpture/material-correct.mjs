// IMPURE RUNNER — E-21 concept material-correction on the gatehouse (S-073 / T-073-01). The terminal
// "refine according to the concept" step: take the T-072 feature-assigned gatehouse build, run the E-15
// surgical `reviseLoop` on it with a MATERIAL TARGET (the concept image + the deterministic colour-
// agreement metric) and the SWAP-ONLY material editor — the LLM sees the build render + the concept and
// proposes recolor-only corrections to mis-zoned regions, applied under the region-lock + the palette
// policy + AJV, accepted only if the per-region concept colour agreement improves, else rolled back.
//
// THE SEAM INVARIANT (the whole point): the loop body / observe / diagnose router / accept-gate are the
// UNCHANGED E-15 machinery. This file only (a) reads the T-072 material-assign artifact as input, (b)
// resolves the concept MATERIAL target (not the form target), (c) wires the material editor, and (d)
// records corrections kept/rolled-back + whole-object material agreement before/after + the additions log.
// Exactly the E-16 swap (concept→GLB) move, one level over: form→material.
//
// GL + METERED (headless render + claude -p for the proposal): run on demand, NOT in `npm test`. Mirrors
// glb-voxel-surgical.mjs / material-assign.mjs. An absent input artifact OR concept image is skipped.
//
//   node benchmarks/sculpture/material-correct.mjs            # live (needs the T-072 artifact + concept + GL + claude -p)
//   node benchmarks/sculpture/material-correct.mjs --offline  # re-derive the verdict + re-validate from committed numbers
//
// Writes material-correct/gatehouse.json (the durable record) + material-correct/gatehouse/artifact.json
// (the corrected, AJV-valid build) + .md. Per-region render crops go under material-correct/gatehouse/
// (PNGs gitignored; the .json/.md/artifact are the committed record).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { reviseLoop } from "../../src/revise/loop.mjs";
import { observeRegion, selectRegion, subBoundsOf, artifactBounds } from "../../src/revise/region.mjs";
import { makeMaterialEditor } from "../../src/revise/material-edit.mjs";
import { boxesIntersect } from "../../src/revise/tweak.mjs";
import { conceptMaterialTarget, liveMaterialScore } from "../../src/form/material-target.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { SCULPTURE_VIEW_3Q } from "../../src/sculpture.mjs";
// DRY: the categorical classifier is the form A/B's export — reused, not cloned (the
// parallel-roots-duplicate-shared-deps lesson). after vs before, whole-object. The verdict logic is
// identical for material agreement: improved if a correction was kept AND whole-object agreement rose;
// held if nothing beat its region; regressed is a real divergence (per-region gate ≠ whole-object).
import { formVerdictOf as agreementVerdictOf } from "./glb-formtarget-ab.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const IN_DIR = join(HERE, "material-assign"); // the T-072 feature-assigned build (this pass's "before")
const MAP_DIR = join(HERE, "material-map");
const RUNS = join(HERE, "runs");
const OUT_DIR = join(HERE, "material-correct");

const SUBJECT = {
  key: "gatehouse",
  conceptRun: "015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate",
  map: "gatehouse.json",
};

const VERDICT_GLOSS = {
  improved: "a region cleared the per-region accept-gate AND the whole-object concept colour agreement rose — the local material clean transferred to the whole",
  held: "no region beat its per-region material target — the cage kept the build's materials unchanged (no regression; the materials already agreed, or the gate rolled back every proposal)",
  regressed:
    "a region cleared the per-region accept-gate but the whole-object agreement FELL — a real divergence: the local per-region recolor did not transfer to the whole-object colour distribution. NOT a gate bug (P14 holds); a limit of the per-region single-view agreement signal as a hill-climb metric",
  unknown: "missing a before or after score",
};

/** Two material-correct regions: the upper mass (roof + gable) and the lower mass (walls + corners + base).
 *  Computed from the artifact's own bounds (robust to scale), both routed to the material editor. */
function regionsFor(artifact) {
  const B = artifactBounds(artifact);
  const midY = Math.floor((B.min[1] + B.max[1]) / 2);
  return [
    {
      bbox: { min: [B.min[0], midY + 1, B.min[2]], max: [B.max[0], B.max[1], B.max[2]] },
      route: "material-correct",
      defect: "roof/gable material zoning vs the concept",
      where: "the upper mass (roof slope + gable)",
    },
    {
      bbox: { min: [B.min[0], B.min[1], B.min[2]], max: [B.max[0], midY, B.max[2]] },
      route: "material-correct",
      defect: "wall/corner/base material zoning vs the concept",
      where: "the lower mass (wall field, corner pilasters, plinth)",
    },
  ];
}

/** A critic that maps the CURRENT region (matched by its spec) to its configured {defect, where, route}. */
function makeRegionCritic(regions) {
  const bySpec = new Map(regions.map((r) => [JSON.stringify({ bbox: r.bbox }), r]));
  return (_artifact, R) => {
    const cfg = bySpec.get(JSON.stringify(R.spec));
    return cfg ? [{ defect: cfg.defect, where: cfg.where, route: cfg.route }] : [];
  };
}

/** Render the WHOLE artifact @ 3/4 and score its colour agreement vs the WHOLE concept (the verdict signal). */
async function wholeObjectAgreement(artifact, target, outPath) {
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  await renderArtifact(artifact, { outPath, view: SCULPTURE_VIEW_3Q });
  return target.wholeObjectScore(outPath);
}

/** P14-safety audit from the loop's OWN record (the loop enforces it; this CONFIRMS it). PURE. */
function p14Report(out) {
  const violations = [];
  const accepted = out.trace.filter((t) => t.accepted);
  for (const a of accepted) {
    if (!out.locked.some((L) => JSON.stringify(L) === JSON.stringify(a.subBounds))) {
      violations.push({ type: "accepted-not-locked", subBounds: a.subBounds });
    }
  }
  const lockedSoFar = [];
  for (const t of out.trace) {
    if (t.reason === "locked-overlap") continue;
    if ("scoreAfter" in t && t.subBounds) {
      for (const L of lockedSoFar) {
        if (boxesIntersect(L, t.subBounds)) violations.push({ type: "edited-locked-region", subBounds: t.subBounds });
      }
    }
    if (t.accepted && t.subBounds) lockedSoFar.push(t.subBounds);
  }
  return { ok: violations.length === 0, locked: out.locked, acceptedCount: accepted.length, violations };
}

/** Manifest difference: the artifact's secondary blocks (in the build but not the design-doc map palette). */
function secondaryOf(manifest, mapPalette) {
  const m = new Set(mapPalette);
  return manifest.filter((b) => !m.has(b));
}

async function buildLive() {
  const artifactPath = join(IN_DIR, SUBJECT.key, "artifact.json");
  const conceptPath = join(RUNS, SUBJECT.conceptRun, "concept.png");
  const mapPath = join(MAP_DIR, SUBJECT.map);
  if (!existsSync(artifactPath)) throw new Error(`material-assign/${SUBJECT.key}/artifact.json absent (run T-072 material:assign first)`);
  if (!existsSync(conceptPath)) throw new Error(`${conceptPath} absent (the concept is run-local)`);
  if (!existsSync(mapPath)) throw new Error(`material-map/${SUBJECT.map} absent (run T-071 material:map first)`);

  const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
  const mapJson = JSON.parse(readFileSync(mapPath, "utf8"));
  const mapPalette = mapJson.palette ?? [];
  const secondary = secondaryOf(artifact.palette.manifest, mapPalette);

  const subjOut = join(OUT_DIR, SUBJECT.key);
  mkdirSync(subjOut, { recursive: true });

  const target = conceptMaterialTarget({ conceptPath });
  const beforeWhole = await wholeObjectAgreement(artifact, target, join(subjOut, "before.png"));

  const regions = regionsFor(artifact);
  const editor = makeMaterialEditor({
    critic: makeRegionCritic(regions),
    policy: { mapPalette, secondary },
    // bind the concept path into the live proposer (the metered two-image bridge)
    propose: (a, R, obs, ctx) =>
      import("../../src/revise/material-edit.mjs").then((m) =>
        m.defaultProposeCorrection(a, R, obs, ctx, { conceptPath, subject: SUBJECT.key }),
      ),
  });

  const out = await reviseLoop(artifact, {
    regions: regions.map((r) => ({ bbox: r.bbox })),
    observe: (a, R) => observeRegion(a, R, { outPath: join(subjOut, `crop-${subBoundsOf(R).min.join("_")}.png`) }),
    diagnose: editor.diagnose,
    tweakFor: editor.tweakFor,
    // The accept step consults the concept MATERIAL target via the SAME score seam — no loop change.
    score: liveMaterialScore({ materialTarget: target }),
    budget: { maxIterations: 8, perRegion: 1 },
  });

  const afterWhole = await wholeObjectAgreement(out.artifact, target, join(subjOut, "after.png"));
  assertArtifact(out.artifact); // AC#6: the corrected build still passes the AJV gate

  const perRegion = regions.map((r, i) => {
    const specStr = JSON.stringify({ bbox: r.bbox });
    const entries = out.trace.filter((t) => JSON.stringify(t.region) === specStr);
    const e = entries.find((t) => "scoreAfter" in t) || entries[0] || {};
    return {
      index: i,
      region: r.bbox,
      defect: r.defect,
      where: r.where,
      loopRoute: e.route ?? null,
      scoreBefore: e.scoreBefore ?? null, // the per-region concept colour-agreement accept signal
      scoreAfter: e.scoreAfter ?? null,
      accepted: e.accepted ?? false,
      reason: e.reason ?? null,
    };
  });

  const keptCount = perRegion.filter((p) => p.accepted).length;
  const rolledBackCount = perRegion.filter((p) => !p.accepted && p.reason === "rolled-back").length;

  const record = {
    schema: "material-correct/v1",
    subject: SUBJECT.key,
    metric: "concept colour agreement (deterministic CIE76 cluster agreement vs the concept image)",
    generatedFrom: {
      inputArtifact: `material-assign/${SUBJECT.key}/artifact.json`,
      concept: `runs/${SUBJECT.conceptRun}/concept.png`,
      materialMap: `material-map/${SUBJECT.map}`,
    },
    allowedPalette: { mapPalette, secondary },
    manifestBefore: artifact.palette.manifest,
    manifestAfter: out.artifact.palette.manifest,
    wholeObjectAgreementBefore: beforeWhole,
    wholeObjectAgreementAfter: afterWhole,
    verdict: agreementVerdictOf(beforeWhole, afterWhole, keptCount > 0),
    keptCount,
    rolledBackCount,
    additions: editor.additions, // the AC#2 concept-justified additions log
    perRegion,
    p14: p14Report(out),
    proposals: editor.proposals,
    trace: out.trace,
  };

  writeFileSync(join(subjOut, "artifact.json"), JSON.stringify(out.artifact, null, 2) + "\n");
  writeFileSync(join(OUT_DIR, `${SUBJECT.key}.json`), JSON.stringify(record, null, 2) + "\n");
  emitMd([record]);

  console.error(
    `gatehouse material-correct: agreement ${fmt(beforeWhole)} → ${fmt(afterWhole)} (verdict ${record.verdict}); ` +
      `regions kept/rolled ${keptCount}/${rolledBackCount}; additions ${editor.additions.length}; P14 ${record.p14.ok ? "ok" : "VIOLATION"}`,
  );
  return record;
}

function fmt(n) {
  return typeof n === "number" ? n.toFixed(3) : "—";
}

function emitMd(rows) {
  mkdirSync(OUT_DIR, { recursive: true });
  const md = [
    "# Concept material-correction loop — the E-21 refine pass (T-073-01)",
    "",
    "The E-15 surgical `reviseLoop` run on the **T-072 feature-assigned gatehouse** with",
    "`conceptMaterialTarget({conceptPath})` — the deterministic concept colour-agreement metric — and the",
    "**swap-only material editor**. The loop body / observe / diagnose router / accept-gate are unchanged;",
    "only the target (concept material, not form) and the editor (recolor, not shape) are new. The LLM sees",
    "the build render + the concept and proposes recolor corrections; each is applied under the region-lock",
    "+ the palette policy + AJV and kept only if the per-region concept colour agreement improved.",
    "",
    ...rows.map((r) =>
      [
        `## ${r.subject}`,
        `- whole-object concept colour agreement: **${fmt(r.wholeObjectAgreementBefore)} → ${fmt(r.wholeObjectAgreementAfter)}**  verdict: **${r.verdict}**`,
        `- regions kept/rolled-back: **${r.keptCount}/${r.rolledBackCount}**  P14: **${r.p14.ok ? "ok" : "VIOLATION"}** (locked: ${r.p14.locked.length})`,
        `- manifest before: \`${JSON.stringify(r.manifestBefore)}\``,
        `- manifest after: \`${JSON.stringify(r.manifestAfter)}\``,
        `- concept-justified additions (AC#2): \`${JSON.stringify(r.additions)}\``,
        "",
        "| # | region | defect | region agreement before→after | kept? | reason |",
        "|---|--------|--------|:-----------------------------:|:-----:|--------|",
        ...r.perRegion.map(
          (p) =>
            `| ${p.index} | \`${JSON.stringify(p.region)}\` | ${p.defect} | ${fmt(p.scoreBefore)}→${fmt(p.scoreAfter)} | ${p.accepted ? "✓" : "✗"} | ${p.reason ?? "—"} |`,
        ),
        "",
        ...Object.entries(VERDICT_GLOSS).map(([k, v]) => `- **${k}** — ${v}`),
        "",
        `- LLM proposals: \`${JSON.stringify(r.proposals)}\``,
        "",
      ].join("\n"),
    ),
  ].join("\n");
  writeFileSync(join(OUT_DIR, `${SUBJECT.key}.md`), md);
}

/** --offline: re-derive the verdict from committed numbers + re-validate the corrected artifact, no GL/model. */
function verifyOffline() {
  const recPath = join(OUT_DIR, `${SUBJECT.key}.json`);
  const artPath = join(OUT_DIR, SUBJECT.key, "artifact.json");
  if (!existsSync(recPath) || !existsSync(artPath)) {
    console.error("offline: no committed material-correct/gatehouse.json + artifact.json yet — run live first.");
    return;
  }
  const rec = JSON.parse(readFileSync(recPath, "utf8"));
  const artifact = JSON.parse(readFileSync(artPath, "utf8"));
  assertArtifact(artifact); // the corrected build is still schema-valid
  const verdict = agreementVerdictOf(rec.wholeObjectAgreementBefore, rec.wholeObjectAgreementAfter, (rec.keptCount ?? 0) > 0);
  emitMd([{ ...rec, verdict }]);
  console.error(
    `offline gatehouse: agreement ${fmt(rec.wholeObjectAgreementBefore)} → ${fmt(rec.wholeObjectAgreementAfter)} ` +
      `(verdict ${verdict}); manifest ${artifact.palette.manifest.length} blocks; additions ${(rec.additions ?? []).length}; P14 ${rec.p14?.ok ? "ok" : "?"}`,
  );
}

async function main() {
  if (process.argv.includes("--offline")) {
    verifyOffline();
    return;
  }
  mkdirSync(OUT_DIR, { recursive: true });
  await buildLive();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("material-correct failed:\n  " + (err?.message || err));
    process.exit(1);
  });
}

export { buildLive, verifyOffline, regionsFor, secondaryOf, makeRegionCritic };
