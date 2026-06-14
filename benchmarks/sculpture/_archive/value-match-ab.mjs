// Offline value-matched A/B (T-041-01 / E-14 / story S-041) — the build-end cure, measured.
//
// For each committed run it REUSES the saved model artifact + concept image (NO model call): extracts
// the concept's realized palette, snaps placements to value-true blocks (src/color/value-build.mjs),
// writes the .v2 sidecars (artifact.value-matched.json, value-swaps.{json,md}), renders a value-matched
// 3/4 still next to the .v1 still (GL — gated on GL_AVAILABLE), and emits a top-level
// `value-match-ab.md` with side-by-side render links + per-region swap tables. The .v1 outputs are
// never touched. Run: `node benchmarks/sculpture/value-match-ab.mjs [runId ...]`.
//
// Default subjects are the documented value cases: the moai (gray_concrete value drift) + the sword +
// the pineapple (AC2 ≥3 subjects). Pass run ids to override.

import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeValueMatch } from "./value-match-shared.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = join(HERE, "runs");

const DEFAULT_RUNS = ["001-vConcept-moai", "007-vConcept-a-sword", "013-vConcept-a-pineapple"];

async function main() {
  const runIds = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const targets = runIds.length ? runIds : DEFAULT_RUNS;

  // GL is needed only for the value-matched still; the snap + report run regardless.
  const { renderArtifact, GL_AVAILABLE } = await import("../../render/src/render-tool.mjs");
  const { renderSummary } = await import("../../src/render-tool.mjs");
  if (!GL_AVAILABLE) console.warn("! GL unavailable — writing swap reports only (no render-3q.value.png)");

  const sections = [];
  for (const runId of targets) {
    const dir = join(RUNS_DIR, runId);
    const artPath = join(dir, "artifact.json");
    const conceptPath = join(dir, "concept.png");
    if (!existsSync(artPath) || !existsSync(conceptPath)) {
      console.warn(`! skip ${runId}: missing artifact.json or concept.png`);
      continue;
    }
    const artifact = JSON.parse(readFileSync(artPath, "utf8"));
    const { snap, palette, render } = await writeValueMatch({
      dir,
      runId,
      artifact,
      conceptPath,
      renderArtifact: GL_AVAILABLE ? renderArtifact : undefined,
      renderSummary,
    });

    console.log(
      `${runId}: ${snap.changedPlacements}/${artifact.placements.length} placements rewritten` +
        (render ? ` · rendered ${render.placed} blocks -> render-3q.value.png` : " · no render"),
    );
    for (const s of snap.swaps) {
      console.log(
        `    ${s.changed ? "↻" : " "} ${s.name} (L${s.valueHonestL}) -> ${s.to} (L${s.toL})  ` +
          `ΔE=${s.deltaE} shift=${s.valueShift > 0 ? "+" : ""}${s.valueShift}`,
      );
    }

    const rel = `runs/${runId}`;
    sections.push(
      [
        `### ${runId}`,
        "",
        `Realized concept palette: ${palette.description}`,
        "",
        `| .v1 (model name-by-hue) | .v2 (engine value-matched) |`,
        `|---|---|`,
        `| ![v1](${rel}/render-3q.png) | ${render ? `![v2](${rel}/render-3q.value.png)` : "_(GL unavailable)_"} |`,
        "",
        `**${snap.changedPlacements}/${artifact.placements.length}** placements rewritten. Per-region swap:`,
        "",
        "| original name → value-true block | name L* | placed L* | value shift | ΔE |",
        "|---|---|---|---|---|",
        ...snap.swaps.map((s) => {
          const arrow = s.changed ? `\`${s.name}\` → \`${s.to}\`` : `\`${s.name}\` *(kept)*`;
          const shift = s.valueShift > 0 ? `+${s.valueShift}` : `${s.valueShift}`;
          return `| ${arrow} | ${s.valueHonestL} | ${s.toL} | ${shift} | ${s.deltaE} |`;
        }),
        "",
      ].join("\n"),
    );
  }

  const doc = [
    "# Value-matched build A/B (E-14 / T-041-01)",
    "",
    "Each subject below: the **.v1** render (the model chose blocks by name/hue) vs the **.v2**",
    "value-matched render (after the model proposes the artifact, the engine extracts the concept's",
    "realized palette and snaps each placement to the value-true block that hits that region's value).",
    "The model owns form + where; the engine owns which block. Generated offline from committed",
    "`artifact.json` + `concept.png` — no model call. See each run dir's `value-swaps.json` for detail.",
    "",
    "## Headline — the moai value drift",
    "",
    "The documented E-13 failure: a faithful moai whose `gray_concrete` body rendered far darker than",
    "the concept showed. The `001-vConcept-moai` swap row below records `gray_concrete` → its value-true",
    "block and the value shift; collapses onto a single realized neutral are shown honestly.",
    "",
    ...sections,
  ].join("\n");

  mkdirSync(RUNS_DIR, { recursive: true });
  const outPath = join(HERE, "value-match-ab.md");
  writeFileSync(outPath, doc);
  console.log(`\nA/B summary -> benchmarks/sculpture/value-match-ab.md`);
}

main().catch((err) => {
  console.error("value-match A/B failed:\n  " + (err?.message || err));
  process.exit(1);
});
