// Shared value-matched (.v2) output writer (T-041-01 / E-14 / story S-041).
//
// I/O + glue used by BOTH the live runner (run.mjs `--value-match`) and the offline A/B
// (value-match-ab.mjs): given a run dir with a model artifact + a concept image, extract the concept's
// realized palette, snap placements to value-true blocks (the pure src/color/value-build.mjs core),
// and write the .v2 sidecars — `artifact.value-matched.json`, `value-swaps.json`, `value-swaps.md` —
// leaving every .v1 file untouched. Rendering (GL/metered) is injected so this module stays cheap and
// import-safe; pass `renderArtifact`/`renderSummary` to also write `render-3q.value.png`.

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { extractPaletteFromImage } from "../../src/color/palette-extract.mjs";
import { snapArtifactToValueTrue } from "../../src/color/value-build.mjs";
import { VCONCEPT_SCULPTURE_METHOD_ID_V2 } from "../../src/config.mjs";
import { SCULPTURE_VIEW_3Q } from "../../src/sculpture.mjs";

/** Render the per-region swap table as Markdown — the AC's "original name → value-true block". */
export function swapsToMarkdown(runId, snap, conceptDesc) {
  const rows = snap.swaps.map((s) => {
    const arrow = s.changed ? `\`${s.name}\` → \`${s.to}\`` : `\`${s.name}\` *(kept)*`;
    const shift = s.valueShift > 0 ? `+${s.valueShift}` : `${s.valueShift}`;
    return `| ${arrow} | ${s.valueHonestL} | ${s.toL} | ${shift} | ${s.deltaE} |`;
  });
  return [
    `## ${runId} — value-matched (.v2) block swaps`,
    "",
    `Realized concept palette: ${conceptDesc}`,
    `Placements rewritten: **${snap.changedPlacements}**.  Value-true manifest: ${snap.manifest
      .map((b) => `\`${b.replace(/^minecraft:/, "")}\``)
      .join(", ")}`,
    "",
    "| original name → value-true block | name L* | placed L* | value shift | ΔE |",
    "|---|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}

/**
 * Extract → snap → write the .v2 sidecars for one run dir. Returns the snap result + saved paths.
 * @param {object} p
 * @param {string} p.dir         run directory (where sidecars are written)
 * @param {string} p.runId       run id (for the markdown header)
 * @param {object} p.artifact    the model's .v1 artifact (parsed)
 * @param {string} p.conceptPath path to concept.png
 * @param {number} [p.k]         extractor cluster count
 * @param {Function} [p.renderArtifact]  optional GL renderer — if given, writes render-3q.value.png
 * @param {Function} [p.renderSummary]   optional summary fn for the render report
 */
export async function writeValueMatch({ dir, runId, artifact, conceptPath, k = 8, renderArtifact, renderSummary }) {
  const pal = await extractPaletteFromImage(conceptPath, { k });
  const snap = snapArtifactToValueTrue(artifact, pal, { methodId: VCONCEPT_SCULPTURE_METHOD_ID_V2 });

  writeFileSync(join(dir, "artifact.value-matched.json"), JSON.stringify(snap.artifact, null, 2) + "\n");
  writeFileSync(
    join(dir, "value-swaps.json"),
    JSON.stringify(
      {
        schema: snap.schema,
        runId,
        methodId: VCONCEPT_SCULPTURE_METHOD_ID_V2,
        conceptPalette: pal.description,
        changedPlacements: snap.changedPlacements,
        manifest: snap.manifest,
        realizedUsed: snap.realizedUsed,
        swaps: snap.swaps,
      },
      null,
      2,
    ) + "\n",
  );
  writeFileSync(join(dir, "value-swaps.md"), swapsToMarkdown(runId, snap, pal.description));

  let render = null;
  if (renderArtifact) {
    const report = await renderArtifact(snap.artifact, {
      outPath: join(dir, "render-3q.value.png"),
      view: SCULPTURE_VIEW_3Q,
    });
    render = renderSummary ? renderSummary(report) : report;
  }
  return { snap, palette: pal, render };
}
