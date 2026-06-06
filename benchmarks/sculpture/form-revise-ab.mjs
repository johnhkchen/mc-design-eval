// Form-revise A/B harness (T-046-01, story S-046, epic E-15) — the LLM form-edit route on koi + heart.
//
// AC #4: run the deterministic revision loop with the LLM editor over a curated region of each subject
// and record before/after per-region form IoU + the kept/rolled-back edit trace, with renders saved. The
// LLM editor is the cage's other editor (the procedural pass is the first); both sit behind the same
// accept-if-improved gate, so this harness measures whether a freeform block-edit can recover LINE the
// procedural passes cannot (the koi's flattened S-curve, the heart's open aortic arch).
//
// GL + METERED (headless render + claude -p subscription): run on demand, NOT in `npm test`. Mirrors
// form-baseline.mjs (a generator .mjs writing a committed .json + .md). Deterministic discovery (the two
// fixed subjects); the only nondeterminism is the model, which is the thing under test.
//
//   node benchmarks/sculpture/form-revise-ab.mjs
//
// Writes form-revise-ab.json + form-revise-ab.md and saves before/after 3/4 renders under
// benchmarks/sculpture/form-revise-ab/<subject>/{before.png,after.png}.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { reviseLoop, liveFormScore } from "../../src/revise/loop.mjs";
import { observeRegion, selectRegion, applyRegionEdit, subBoundsOf } from "../../src/revise/region.mjs";
import { makeFormEditor, regionKey } from "../../src/revise/form-edit.mjs";
import { formFidelityFromPair } from "../../src/form/form-fidelity.mjs";
import { SCULPTURE_VIEW_3Q } from "../../src/sculpture.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = join(HERE, "runs");
const OUT_DIR = join(HERE, "form-revise-ab");

// The two AC #4 subjects + their curated form regions (the defect locus) and the form defect to fix.
const SUBJECTS = [
  {
    key: "koi",
    run: "009-vConcept-a-koi-fish",
    region: { bbox: { min: [-9, 1, -5], max: [2, 6, 5] } },
    defect: "ringing",
    where: "the swimming body (the S-curve that flattens to a straight body)",
  },
  {
    key: "heart",
    run: "006-vConcept-an-anatomically-correct-human-heart",
    region: { bbox: { min: [-8, 20, -6], max: [8, 31, 6] } },
    defect: "ringing",
    where: "the aortic arch (which never builds as a closed loop)",
  },
];

/** Render the WHOLE artifact at the canonical 3/4 view (the baseline view) and score it vs the concept. */
async function wholeObjectIoU(artifact, conceptPath, outPath) {
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  await renderArtifact(artifact, { outPath, view: SCULPTURE_VIEW_3Q });
  const result = await formFidelityFromPair(outPath, conceptPath);
  return result.iou;
}

async function reviseSubject(s) {
  const dir = join(RUNS_DIR, s.run);
  const artifact = JSON.parse(readFileSync(join(dir, "artifact.json"), "utf8"));
  const conceptPath = join(dir, "concept.png");
  const subjOut = join(OUT_DIR, s.key);
  mkdirSync(subjOut, { recursive: true });

  // whole-object "before" (comparable to form-baseline.json)
  const beforeWhole = await wholeObjectIoU(artifact, conceptPath, join(subjOut, "before.png"));

  const editor = makeFormEditor({
    // Force the form route so the LLM editor runs (the model-free critic would route flat→procedural).
    critic: () => [{ defect: s.defect, where: s.where, route: "curve" }],
  });

  const out = await reviseLoop(artifact, {
    regions: [s.region],
    observe: (a, R) => observeRegion(a, R, { outPath: join(subjOut, "crop.png") }),
    diagnose: editor.diagnose,
    tweakFor: editor.tweakFor,
    score: liveFormScore({ conceptPath }),
    budget: { maxIterations: 4, perRegion: 1 },
  });

  // whole-object "after" on the (possibly revised) artifact
  const afterWhole = await wholeObjectIoU(out.artifact, conceptPath, join(subjOut, "after.png"));

  // Render the PROPOSED candidate (the stashed LLM edit applied) even when the gate rolled it back, so a
  // reviewer can SEE what the model built and why it did/didn't improve the silhouette (AC #4).
  const R0 = selectRegion(artifact, s.region);
  const stashed = editor.stash.get(regionKey(subBoundsOf(R0)));
  let proposedWhole = null;
  if (stashed) {
    const candidate = applyRegionEdit(artifact, R0, stashed);
    proposedWhole = await wholeObjectIoU(candidate, conceptPath, join(subjOut, "proposed.png"));
  }

  const e = out.trace[0] || {};
  return {
    subject: s.key,
    run: s.run,
    region: s.region.bbox,
    defect: s.defect,
    where: s.where,
    route: e.route ?? null,
    regionIoUBefore: e.scoreBefore ?? null, // the R-framed accept signal (per-region form IoU)
    regionIoUAfter: e.scoreAfter ?? null,
    accepted: e.accepted ?? false,
    reason: e.reason ?? null,
    wholeObjectIoUBefore: beforeWhole,
    wholeObjectIoUAfter: afterWhole,
    wholeObjectIoUProposed: proposedWhole, // the stashed LLM edit, rendered even if rolled back
    trace: out.trace,
    edits: editor.stash.size,
    proposals: editor.proposals,
  };
}

function mdTable(rows) {
  const head =
    "| subject | route | region IoU before | region IoU after | whole IoU before | whole IoU after | kept? |\n" +
    "|---------|-------|------------------:|-----------------:|-----------------:|----------------:|:-----:|";
  const fmt = (n) => (typeof n === "number" ? n.toFixed(3) : "—");
  const body = rows
    .map(
      (r) =>
        `| ${r.subject} | ${r.route ?? "—"} | ${fmt(r.regionIoUBefore)} | ${fmt(r.regionIoUAfter)} | ` +
        `${fmt(r.wholeObjectIoUBefore)} | ${fmt(r.wholeObjectIoUAfter)} | ${r.accepted ? "✓" : "✗"} |`,
    )
    .join("\n");
  return `${head}\n${body}`;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const rows = [];
  for (const s of SUBJECTS) {
    if (!existsSync(join(RUNS_DIR, s.run, "artifact.json"))) {
      console.error(`skip ${s.key}: ${s.run}/artifact.json not found`);
      continue;
    }
    console.error(`revising ${s.key} (${s.run}) …`);
    rows.push(await reviseSubject(s));
  }

  const json = {
    schema: "form-revise-ab/v1",
    metric: "silhouette-iou",
    generatedFrom: "benchmarks/sculpture/runs/{009-*-koi-fish,006-*-human-heart}",
    note:
      "region IoU = the R-framed render's silhouette IoU vs the concept (the loop's accept signal); " +
      "whole IoU = the full-build 3/4 render vs concept (comparable to form-baseline.json). A true " +
      "region-vs-region IoU needs a 3-D→2-D concept projection (out of scope, T-045).",
    subjects: rows,
  };
  writeFileSync(join(HERE, "form-revise-ab.json"), JSON.stringify(json, null, 2) + "\n");

  const md = [
    "# Form-revise A/B — the LLM form-edit route (T-046-01)",
    "",
    "The deterministic revision loop with the **LLM block-editor** behind the accept-gate, over a curated",
    "form region of each subject. `region IoU` is the loop's per-region accept signal (the R-framed render",
    "vs the concept); `whole IoU` is the full-build 3/4 render vs the concept (comparable to",
    "`form-baseline.json`). An edit is **kept** only if the region IoU strictly improved, else rolled back.",
    "",
    mdTable(rows),
    "",
    ...rows.map((r) =>
      [
        `## ${r.subject} — ${r.run}`,
        `- region: \`${JSON.stringify(r.region)}\`  defect: **${r.defect}** in ${r.where}`,
        `- route: \`${r.route}\`  kept: **${r.accepted}** (${r.reason})  proposed edits stashed: ${r.edits}`,
        `- proposed-edit whole IoU: ${typeof r.wholeObjectIoUProposed === "number" ? r.wholeObjectIoUProposed.toFixed(3) : "—"}` +
          ` (the LLM edit applied, shown even if rolled back)`,
        `- renders: \`form-revise-ab/${r.subject}/{before,proposed,after}.png\` + \`crop.png\` (the region the model saw)`,
        `- proposals: \`${JSON.stringify(r.proposals)}\``,
        "",
        "```json",
        JSON.stringify(r.trace, null, 2),
        "```",
        "",
      ].join("\n"),
    ),
  ].join("\n");
  writeFileSync(join(HERE, "form-revise-ab.md"), md);
  console.error(`wrote form-revise-ab.json + form-revise-ab.md (${rows.length} subjects)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
