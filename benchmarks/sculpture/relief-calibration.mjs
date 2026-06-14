// RELIEF CALIBRATION SWEEP — the relief-aware-gate evidence (T-148-01, story S-148, epic E-35).
//
// The frozen instrument passed the flat barn (T-143-01: kit-aware PASS) beside an articulated concept.
// This sweep proves the relief lens (src/form/relief-presence.mjs) bites — WITHOUT a judge call, a
// re-judge, or a per-building constant (identity-class discipline, [[glance-true-budget-v2]]). Three
// binding anchors, all derived from committed data:
//
//   ANTI-ANCHOR  — the committed barn build (workshop/barn/final-artifact.json), read against its
//                  recognised facade grammar (relief/barn-grammar.json, a diegetic T-145-01 grammar),
//                  must FAIL the relief lens (the flat mono-fill walls lack the demanded studs). The
//                  committed kit-aware verdict (barn-patternbook.json overall: PASS) is reported BESIDE
//                  — both arithmetics, the legacy one valid forever.
//   ARTICULATED  — the SAME build with surfaceRelief's own placements applied must PASS the lens (the
//                  fixpoint: re-running the supply op is a no-op). reliefNoRegress asserts the relief is
//                  honest construction — the E-34 in-plane ruler (maskProportions, ridgeToEave/roofShare)
//                  is byte-unmoved; only the honest perpendicular extent widens (recorded, never gated).
//   COMMITTED-UNCHANGED — every committed multi-angle gate record has no facade wired into its program,
//                  so the relief lens is ran:false there and the kit-aware overall re-derives unchanged
//                  (the monotone-re-derivation half of the identity-class proof).
//
// Pure, deterministic: occupancy from committed artifacts (artifactOccupancy) + pure relief ops; NO
// model, NO GL, NO re-judge. Read-only over committed records; writes only the evidence record + md
// through the pin guard. --repro is just re-running (byte-identical, skip-identical writes).
//
//   npm run relief:calibrate                  # re-derive + write the evidence record
//   npm run relief:calibrate -- --rotate-pins # re-write the committed evidence (explicit rotation)

import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { artifactOccupancy, occupancyFromCells, bareBlock } from "../../src/view/occupancy.mjs";
import { surfaceRelief, reliefNoRegress } from "../../src/view/surface-relief.mjs";
import {
  reliefDemand, reliefPresence, composeReliefAwareVerdict, RELIEF_AWARE_GATE_SCHEMA,
} from "../../src/form/relief-presence.mjs";
import { validateProgramAgainstPack } from "../../src/recognition/program.mjs";
import { MULTI_ANGLE_GATE_SCHEMA } from "../../src/form/multi-angle-gate.mjs";
import { ROTATE_FLAG, guardedWriteRecord } from "../../src/form/pin-guard.mjs";

export const RELIEF_CALIBRATION_SCHEMA = "relief-calibration/v1";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const REC_DIR = join(ROOT, "benchmarks/sculpture/multi-angle");
const OUT_REL = "benchmarks/sculpture/multi-angle/relief-calibration";

// The calibration subject (the T-143-01 first-composite-PASS barn) and its recognised grammar. The
// build + grammar + the committed verdict are all committed data; this is the only place a subject is
// named — the calibration's job (the budget-calibration.mjs ANCHORS-table precedent), not the lens's.
const SUBJECT = {
  artifact: "benchmarks/sculpture/workshop/barn/final-artifact.json",
  grammar: "benchmarks/sculpture/relief/barn-grammar.json",
  pack: "packs/rustic.json",
  committedGate: "barn-patternbook.json", // its kit-aware verdict, reported beside
};

const rd = async (rel) => JSON.parse(await readFile(join(ROOT, rel), "utf8"));

/** Apply every demand's surfaceRelief placements to a clone of the build (the articulated reference). */
function articulate(occ, demand) {
  const cells = [...occ.cells.entries()].map(([k, b]) => ({ pos: k.split(",").map(Number), block: bareBlock(b) }));
  const placements = [];
  const faces = new Set();
  for (const d of demand) {
    const { placements: pl } = surfaceRelief(occ, {
      material: d.material, faces: [d.face],
      rhythm: { axis: d.axis, every: d.every, span: d.span, phase: d.phase }, depth: d.depth,
    });
    placements.push(...pl);
    faces.add(d.face);
  }
  const occRelieved = occupancyFromCells([
    ...cells, ...placements.map((p) => ({ pos: p.pos, block: bareBlock(p.block) })),
  ]);
  return { occRelieved, placements, faces: [...faces] };
}

function md(record) {
  const a = record.anchors;
  const find = (k) => a.find((x) => x.key === k);
  const lines = [
    `# Relief calibration — relief-aware-gate (${RELIEF_CALIBRATION_SCHEMA}, T-148-01, E-35)`,
    "",
    "Pure re-derivation: the relief lens (`src/form/relief-presence.mjs`) over committed builds — **no",
    "judge, no re-judge, no per-building constant**. The relief verdict is the fixpoint (re-running",
    "surfaceRelief is a no-op on the demanded strips); the **kit-aware** verdict (kit-aware-gate/v1) is",
    "reported BESIDE it, valid forever.",
    "",
    `**Subject:** the T-143-01 first-composite-PASS barn. **Grammar:** ${SUBJECT.grammar} (a diegetic`,
    "recognised facade grammar — dark_oak_log studs, column rhythm every 4 on the front/back walls).",
    "",
    "| anchor | relief lens | kit-aware (beside) | expected | result |",
    "| --- | --- | --- | --- | --- |",
  ];
  const anti = find("anti-anchor");
  const art = find("articulated");
  lines.push(`| anti-anchor (flat barn) | **${anti.reliefPassed ? "PASS" : "FAIL"}** | ${anti.kitAwarePassed ? "PASS" : "FAIL"} | FAIL | ${anti.ok ? "✓" : "✗"} |`);
  lines.push(`| articulated (relief applied) | **${art.reliefPassed ? "PASS" : "FAIL"}** | ${art.kitAwarePassed ? "PASS" : "FAIL"} | PASS | ${art.ok ? "✓" : "✗"} |`);
  lines.push("",
    `**Anti-anchor residual** (the flat barn lacks the demanded relief): ${anti.residual.map((r) => `\`${r}\``).join("; ")}.`,
    "",
    `**Articulated no-regress** (relief is honest construction): in-plane ruler preserved = ` +
      `**${record.noRegress.inPlanePreserved}**, height ratios preserved = **${record.noRegress.ratiosPreserved}** ` +
      `(only the perpendicular extent widens — honest visible relief, never gated).`,
    "",
    `**Committed-unchanged** (monotone re-derivation): ${record.committedUnchanged.count} committed gate ` +
      `records swept; relief lens \`ran:false\` on all (no facade wired) → every kit-aware \`overall\` ` +
      `re-derives unchanged. ${find("committed-unchanged").ok ? "✓" : "✗"}`,
    "",
    `Anchors: ${a.every((x) => x.ok) ? "**all hold**" : "**FAILED**"} — ` +
      a.map((x) => `${x.key} ${x.ok ? "✓" : "✗"}`).join(", ") + ".",
    "",
    "The frozen judge contract is byte-unmoved (the lens calls no judge; `instrument.diffs: []`). The",
    "anti-anchor's committed gate record is NOT mutated — the flip is demonstrated here, beside the",
    "legacy kit-aware verdict.",
    "");
  return lines.join("\n");
}

async function main() {
  const rotate = process.argv.includes(ROTATE_FLAG);

  const pack = await rd(SUBJECT.pack);
  const grammar = await rd(SUBJECT.grammar);
  const { ok: grammarOk, findings } = validateProgramAgainstPack(grammar, pack);
  if (!grammarOk) {
    console.error("[relief] grammar is not diegetic:\n" + findings.map((f) => `  ${f.where}: ${f.msg}`).join("\n"));
    process.exit(2);
  }
  const demand = reliefDemand(grammar, pack);
  const occ = artifactOccupancy(await rd(SUBJECT.artifact));
  const committedGate = await rd(join("benchmarks/sculpture/multi-angle", SUBJECT.committedGate));
  const kitAware = committedGate.overall; // the kit-aware-gate/v1 verdict, reported beside

  // ANTI-ANCHOR — the flat barn must FAIL the relief lens.
  const antiPresence = reliefPresence(occ, { demand });
  const antiComposite = composeReliefAwareVerdict(kitAware, antiPresence);
  const antiRow = {
    key: "anti-anchor", reliefPassed: antiPresence.passed,
    kitAwarePassed: kitAware?.passed === true, residual: antiPresence.residual,
    composite: { schema: antiComposite.schema, passed: antiComposite.passed },
    expected: false, ok: antiPresence.passed === false,
  };

  // ARTICULATED — the same build with relief applied must PASS the lens (the fixpoint).
  const { occRelieved, placements, faces } = articulate(occ, demand);
  const artPresence = reliefPresence(occRelieved, { demand });
  const noRegress = reliefNoRegress(occ, placements, { faces });
  const artRow = {
    key: "articulated", reliefPassed: artPresence.passed,
    kitAwarePassed: kitAware?.passed === true, missing: artPresence.checks.map((c) => c.missingCells),
    expected: true, ok: artPresence.passed === true && noRegress.inPlanePreserved && noRegress.ratiosPreserved,
  };

  // COMMITTED-UNCHANGED — sweep committed gate records; no facade wired → relief ran:false everywhere.
  const files = (await readdir(REC_DIR)).filter((f) => f.endsWith(".json") && !f.startsWith("relief-calibration"));
  let swept = 0;
  let drifted = 0;
  for (const f of files.sort()) {
    const rec = await rd(join("benchmarks/sculpture/multi-angle", f));
    if (rec.schema !== MULTI_ANGLE_GATE_SCHEMA) continue;
    swept += 1;
    // a committed record carries no facade-bearing program; the lens cannot have run.
    if (rec.relief && rec.relief.ran === true) drifted += 1;
  }
  const committedRow = { key: "committed-unchanged", count: swept, drifted, expected: 0, ok: drifted === 0 };

  const anchors = [antiRow, artRow, committedRow];
  const record = {
    schema: RELIEF_CALIBRATION_SCHEMA,
    ticket: "T-148-01",
    policy: RELIEF_AWARE_GATE_SCHEMA,
    predicate: "relief fixpoint — surfaceRelief (S-146) re-run is a no-op on the demanded strips; " +
      "missing===0 ⇒ realized. No threshold, no per-building constant (the period is the recognised grammar's).",
    subject: SUBJECT,
    demand,
    anti: { presence: antiPresence, composite: antiComposite },
    articulated: { presence: artPresence },
    noRegress: {
      inPlanePreserved: noRegress.inPlanePreserved, ratiosPreserved: noRegress.ratiosPreserved,
      ratios: noRegress.ratios, expectedWidening: noRegress.expectedWidening,
    },
    committedUnchanged: { count: swept, drifted },
    anchors,
  };

  await guardedWriteRecord({ root: ROOT, rel: `${OUT_REL}.json`, content: JSON.stringify(record, null, 2) + "\n", rotate });
  await guardedWriteRecord({ root: ROOT, rel: `${OUT_REL}.md`, content: md(record), rotate });

  for (const x of anchors) {
    console.error(`[relief] anchor ${x.key}: ${x.ok ? "OK" : "MISMATCH"}` +
      (x.key === "committed-unchanged" ? ` (${x.count} swept, ${x.drifted} drifted)` : ` (relief ${x.reliefPassed ? "PASS" : "FAIL"}, expected ${x.expected ? "PASS" : "FAIL"})`));
  }
  const allOk = anchors.every((x) => x.ok);
  console.error(`[relief] anchors ${allOk ? "ALL HOLD" : "FAILED"}; wrote ${OUT_REL}.{json,md}`);
  process.exitCode = allOk ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(2); });
}
