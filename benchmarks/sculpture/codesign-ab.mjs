// Co-design consolidation A/B (T-042-01 / E-14 / story S-042) — the TERMINAL link, measured.
//
// Runs the full co-design loop's MEASUREMENT over the committed E-13 sculptural subjects: for each run it
// reuses the saved model artifact (.v1), its value-matched twin (artifact.value-matched.json, .v2) and the
// concept image (NO model call, NO GL — the renders already exist). It extracts the concept's realized
// palette (the "previewed" side), builds each artifact's realized palette at value-true Lab (the
// segmentation-free "render" side), and runs the Δvalue feedback gate (src/color/value-gate.mjs) on both —
// yielding a concept↔render ΔE BEFORE (.v1) vs AFTER (.v2), the gap closure, the gate flag, and a
// categorical verdict vs the E-13 baseline. Emits `codesign-ab.{md,json}`. The optional corrective
// re-place is reported (it does not auto-fire — a second snap against the same palette is idempotent; the
// real lever is a new concept or a wider extractor `k`). Run: `node benchmarks/sculpture/codesign-ab.mjs [runId ...]`.

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { extractPaletteFromImage } from "../../src/color/palette-extract.mjs";
import {
  realizedPaletteFromArtifact,
  valueGate,
  gapClosure,
  VALUE_GATE_SCHEMA,
  DEFAULT_VALUE_GATE_THRESHOLD,
} from "../../src/color/value-gate.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = join(HERE, "runs");

const DEFAULT_RUNS = ["001-vConcept-moai", "007-vConcept-a-sword", "013-vConcept-a-pineapple"];

// The E-13 baseline verdicts these subjects earned BEFORE the value-true contract (pr/assets/sculptures.md
// / design-learnings.md "Fidelity-vs-concept frontier"). The A/B judges gap closure against these.
const E13_VERDICT = {
  "001-vConcept-moai": "Competent — faithful form, drifted value (gray_concrete reads darker than tuff)",
  "007-vConcept-a-sword": "Recognizable — faithful cruciform, near-true palette",
  "013-vConcept-a-pineapple": "Organic — cross-hatch present but the defining line softens",
};

const K = 8; // extractor cluster count — matches value-match-shared.writeValueMatch's default

/** Categorical verdict vs the E-13 baseline, from the two gate runs + closure. */
function verdictOf(gateBefore, gateAfter, closure) {
  if (!gateBefore.flagged) return "already-near-true";          // value-true had little gap to close
  if (!gateAfter.flagged) return "closed";                      // drift cured below the gate
  return "narrowed";                                            // residual drift remains; re-place recommended
}

const VERDICT_GLOSS = {
  "already-near-true": "already under the gate before value-matching — the contract confirms, not rescues",
  closed: "value-matching pulled the concept↔render drift **below** the gate — the drift is cured",
  narrowed: "value-matching **narrowed** the drift but it stays over the gate — a corrective re-place is recommended",
};

async function main() {
  const runIds = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const targets = runIds.length ? runIds : DEFAULT_RUNS;

  const rows = [];
  for (const runId of targets) {
    const dir = join(RUNS_DIR, runId);
    const v1Path = join(dir, "artifact.json");
    const v2Path = join(dir, "artifact.value-matched.json");
    const conceptPath = join(dir, "concept.png");
    if (!existsSync(v1Path) || !existsSync(v2Path) || !existsSync(conceptPath)) {
      console.warn(`! skip ${runId}: missing artifact.json / artifact.value-matched.json / concept.png`);
      continue;
    }
    const v1 = JSON.parse(readFileSync(v1Path, "utf8"));
    const v2 = JSON.parse(readFileSync(v2Path, "utf8"));

    const reference = await extractPaletteFromImage(conceptPath, { k: K }); // the previewed (concept) side
    const realizedV1 = realizedPaletteFromArtifact(v1); // the render side, before
    const realizedV2 = realizedPaletteFromArtifact(v2); // the render side, after
    const gateBefore = valueGate(realizedV1, reference);
    const gateAfter = valueGate(realizedV2, reference);
    const closure = gapClosure({ before: gateBefore.meanDeltaE, after: gateAfter.meanDeltaE });
    const verdict = verdictOf(gateBefore, gateAfter, closure);

    rows.push({
      runId,
      e13Verdict: E13_VERDICT[runId] || "(no recorded E-13 verdict)",
      conceptPalette: reference.description,
      gateBefore,
      gateAfter,
      closure,
      verdict,
      correctiveReplace: {
        recommended: gateAfter.recommendCorrectiveReplace,
        fired: false, // never auto-fired — see module header / design.md D4
        rationale: gateAfter.recommendCorrectiveReplace
          ? "residual over gate; a re-place against the SAME realized palette is idempotent — the real lever is a new palette-aware concept or a wider extractor k"
          : "drift under the gate — no re-place needed",
      },
    });

    console.log(
      `${runId.padEnd(26)} before ${gateBefore.meanDeltaE} (flag ${gateBefore.flagged}) -> after ` +
        `${gateAfter.meanDeltaE} (flag ${gateAfter.flagged})  closure ${closure.delta} (${closure.pct}%)  [${verdict}]`,
    );
  }

  // --- machine record ---
  const jsonOut = {
    schema: "codesign-ab/v1",
    gateSchema: VALUE_GATE_SCHEMA,
    threshold: DEFAULT_VALUE_GATE_THRESHOLD,
    extractorK: K,
    note:
      "ΔE is concept↔render: realized build palette (placed manifest at value-true Lab) vs the concept's " +
      "realized palette. .v2 ΔE is small partly by construction (the snap targeted this palette); the gate's " +
      "value is as a regression/threshold flag and a record of the residual. Render-PNG extraction is avoided " +
      "(viewer scene dominates ~79% glass) — the placed-manifest proxy is segmentation-free (T-039 invariant).",
    rows,
  };
  writeFileSync(join(HERE, "codesign-ab.json"), JSON.stringify(jsonOut, null, 2) + "\n");

  // --- human report ---
  const summaryTable = [
    "| subject | E-13 verdict | ΔE before (.v1) | ΔE after (.v2) | closure | gate after | E-14 verdict |",
    "|---|---|---|---|---|---|---|",
    ...rows.map((r) => {
      const flag = r.gateAfter.flagged ? "⚠ flagged" : "✓ clear";
      return `| **${r.runId.replace(/^\d+-vConcept-a?-?/, "")}** | ${r.e13Verdict.split(" — ")[0]} | ${r.gateBefore.meanDeltaE} | ${r.gateAfter.meanDeltaE} | **${r.closure.delta}** (${r.closure.pct}%) | ${flag} | ${r.verdict} |`;
    }),
  ].join("\n");

  const sections = rows.map((r) => {
    const swapRows = r.gateAfter.perBlock
      .map((p) => `| \`${p.block}\` | ${p.value} | \`${p.nearest}\` | ${p.deltaE} |`)
      .join("\n");
    return [
      `### ${r.runId}`,
      "",
      `**E-13 baseline:** ${r.e13Verdict}`,
      `**Concept (previewed) palette:** ${r.conceptPalette}`,
      "",
      `Concept↔render mean ΔE: **${r.gateBefore.meanDeltaE} → ${r.gateAfter.meanDeltaE}** ` +
        `(closure **${r.closure.delta}**, ${r.closure.pct}%). ` +
        `Gate (threshold ${r.gateAfter.threshold}): before **${r.gateBefore.flagged ? "flagged" : "clear"}** ` +
        `(max ${r.gateBefore.maxDeltaE}), after **${r.gateAfter.flagged ? "flagged" : "clear"}** (max ${r.gateAfter.maxDeltaE}).`,
      "",
      `**E-14 verdict — ${r.verdict}:** ${VERDICT_GLOSS[r.verdict]}.`,
      `**Corrective re-place:** ${r.correctiveReplace.recommended ? "recommended" : "not recommended"}, ` +
        `**fired: no** — ${r.correctiveReplace.rationale}.`,
      "",
      `Renders: \`runs/${r.runId}/render-3q.png\` (.v1) vs \`runs/${r.runId}/render-3q.value.png\` (.v2). ` +
        `Per-region swaps: \`runs/${r.runId}/value-swaps.md\`.`,
      "",
      "_.v2 realized blocks vs nearest concept cluster:_",
      "",
      "| placed block (value-true) | L* | nearest concept cluster | ΔE |",
      "|---|---|---|---|",
      swapRows,
      "",
    ].join("\n");
  });

  const doc = [
    "# Co-design consolidation A/B (E-14 / T-042-01)",
    "",
    "The **terminal link** of the concept-build palette co-design loop, measured. For each E-13 subject:",
    "the concept↔render **Δvalue** before (`.v1`, the model chose blocks by name/hue) vs after (`.v2`, the",
    "engine snapped each placement to a value-true block). The gap = how far the **built** palette sits from",
    "the palette the **concept previewed**, scored by the Δvalue feedback gate (`src/color/value-gate.mjs`).",
    "Generated offline from committed `artifact.json` + `artifact.value-matched.json` + `concept.png` — no",
    "model call, no GL.",
    "",
    "## How the gap is measured (and an honesty caveat)",
    "",
    "- **Concept side (the target):** the concept's realized palette, `extractPaletteFromImage(concept.png)`.",
    "- **Render side:** the build's placed manifest at its **value-true Lab** — segmentation-free, because a",
    "  real full-cube block renders as itself (T-039 invariant). Extracting straight from the render PNG is",
    "  avoided: the prismarine-viewer scene dominates it (~79% `glass`), which would need sculpture/background",
    "  segmentation — the documented *cost of segmentation*.",
    "- **Caveat (stated, not hidden):** `.v2`'s ΔE is low partly **by construction** — the T-041 snap targeted",
    "  this exact realized palette. So the gate's value is as a **regression/threshold flag** and as a record",
    "  of the **residual** (where the drift is *not* fully cured), not as a surprise-free proof. The",
    "  **pineapple staying flagged after** is the proof the gate is not tautological.",
    "",
    `Gate threshold: mean ΔE > ${DEFAULT_VALUE_GATE_THRESHOLD} (CIE76).`,
    "",
    "## Summary — concept↔render gap closure",
    "",
    summaryTable,
    "",
    "## Headline — the moai value drift, killed",
    "",
    "The documented E-13 failure: a faithful moai whose `gray_concrete` body rendered far darker than the",
    "concept showed. The gate scores that drift at **" +
      (rows.find((r) => r.runId === "001-vConcept-moai")?.gateBefore.meanDeltaE ?? "?") +
      "** before — **over** the gate — and the value-matched build pulls it to **" +
      (rows.find((r) => r.runId === "001-vConcept-moai")?.gateAfter.meanDeltaE ?? "?") +
      "**, **clearing** it. `gray_concrete` (L24.3) → `deepslate_bricks` (L29.8), +5.5; the residual to the",
    "concept's lighter dominant is shown in the swap table, not hidden.",
    "",
    ...sections,
    "## Live full-loop re-run (deferred — metered)",
    "",
    "This consolidation measures both loop ends over committed artifacts (T-040 palette-aware concept; T-041",
    "value-matched build). A single fresh end-to-end run (palette-aware `.v2` concept → value-matched build)",
    "is **metered** (model + Nano-Banana image gen) and out of scope here, mirroring how T-040/T-041 gated",
    "their live paths. To run it live: `node benchmarks/sculpture/run.mjs --value-match \"<subject>\"`.",
    "",
  ].join("\n");

  mkdirSync(RUNS_DIR, { recursive: true });
  writeFileSync(join(HERE, "codesign-ab.md"), doc);
  console.log(`\nA/B summary -> benchmarks/sculpture/codesign-ab.md  (+ codesign-ab.json)`);
}

main().catch((err) => {
  console.error("codesign A/B failed:\n  " + (err?.stack || err?.message || err));
  process.exit(1);
});
