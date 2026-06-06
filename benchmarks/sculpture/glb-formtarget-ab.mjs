// GLB-form-target A/B harness (T-049-01, story S-049, epic E-16) — the direct test of E-15's cliffhanger.
//
// E-15's surgical loop rolled back 2 of 2 form edits on the koi/heart builds because its target was a FLAT
// concept silhouette (form-revise-ab.md: both `held`). This harness re-runs the SAME loop on the SAME two
// builds with the only change being the form target: `glbFormTarget` (a real TRELLIS 3-D mesh, T-049-01)
// instead of `conceptFormTarget`. It records before/after per-region form IoU + whole-object IoU + the
// categorical verdict vs the E-13 baseline, and answers honestly whether the 3-D target moved the loop.
//
// THE SEAM INVARIANT (AC #3): the ONLY line that differs from form-revise-ab.mjs is the `score:` target —
// `liveFormScore({ formTarget: glbFormTarget(...) })`. The loop body, observe, diagnose, and the accept
// gate are byte-identical. That is the whole point of the form-target seam.
//
// GL + METERED (headless render + claude -p subscription): run on demand, NOT in `npm test`. Mirrors
// form-revise-ab.mjs. Deterministic discovery (the two fixed subjects + their gitignored GLBs); the only
// nondeterminism is the model, which is the thing under test.
//
//   node benchmarks/sculpture/glb-formtarget-ab.mjs            # live (needs the GLBs + GL + claude -p)
//   node benchmarks/sculpture/glb-formtarget-ab.mjs --offline  # re-derive verdict from committed numbers
//
// Writes glb-formtarget-ab.json + glb-formtarget-ab.md and saves before/after 3/4 renders under
// benchmarks/sculpture/glb-formtarget-ab/<subject>/{before.png,after.png,proposed.png,crop.png}.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { reviseLoop, liveFormScore } from "../../src/revise/loop.mjs";
import { observeRegion, selectRegion, applyRegionEdit, subBoundsOf, artifactBounds } from "../../src/revise/region.mjs";
import { makeFormEditor, regionKey } from "../../src/revise/form-edit.mjs";
import { glbFormTarget } from "../../src/form/form-target.mjs";
import { SCULPTURE_VIEW_3Q } from "../../src/sculpture.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = join(HERE, "runs");
const GLB_DIR = join(HERE, "glb");
const OUT_DIR = join(HERE, "glb-formtarget-ab");
const BASELINE = join(HERE, "form-baseline.json");

// Categorical verdict — APPLES-TO-APPLES against the GLB-measured whole-object "before" (NOT the concept
// E-13 baseline). The E-13 number was measured against the FLAT CONCEPT; this run measures everything
// against the GLB, so gating GLB-after by the concept baseline would mix two targets and (e.g.) flag an
// UNCHANGED rolled-back build as "regressed" purely because the GLB reads it differently than the concept
// did. The honest gate is GLB-after vs GLB-before; the E-13 concept IoU is reported as a cross-reference.
export function formVerdictOf(beforeWhole, afterWhole, accepted, eps = 1e-3) {
  if (typeof beforeWhole !== "number" || typeof afterWhole !== "number") return "unknown";
  if (afterWhole < beforeWhole - eps) return "regressed"; // can't happen under the gate (rollback) — an alarm
  if (accepted && afterWhole > beforeWhole + eps) return "improved";
  return "held";
}

export const VERDICT_GLOSS = {
  improved: "a surgical edit cleared the GLB accept-gate AND lifted the whole-object GLB IoU above its before-value",
  held: "no local edit beat the GLB target — the cage kept the build unchanged (no regression)",
  regressed: "whole-object GLB IoU fell below its before-value — impossible under the rollback gate (alarm)",
  unknown: "missing a before or after score",
};

function baselineIoU(run) {
  if (!existsSync(BASELINE)) return null;
  const b = JSON.parse(readFileSync(BASELINE, "utf8"));
  const hit = (b.subjects || []).find((s) => s.run === run);
  return hit ? hit.iou : null;
}

// The two AC subjects + their curated form regions + their TRELLIS GLBs (gitignored; regen via trellis-glb.mjs).
const SUBJECTS = [
  {
    key: "koi",
    run: "009-vConcept-a-koi-fish",
    glb: join(GLB_DIR, "koi.glb"),
    region: { bbox: { min: [-9, 1, -5], max: [2, 6, 5] } },
    defect: "ringing",
    where: "the swimming body (the S-curve that flattens to a straight body)",
  },
  {
    key: "heart",
    run: "006-vConcept-an-anatomically-correct-human-heart",
    glb: join(GLB_DIR, "heart.glb"),
    region: { bbox: { min: [-8, 20, -6], max: [8, 31, 6] } },
    defect: "ringing",
    where: "the aortic arch (which never builds as a closed loop)",
  },
];

/** Render the WHOLE artifact @ 3/4 and score its silhouette IoU vs the WHOLE GLB (the verdict signal). */
async function wholeObjectIoU(artifact, target, outPath) {
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  await renderArtifact(artifact, { outPath, view: SCULPTURE_VIEW_3Q });
  return target.wholeObjectScore(outPath);
}

async function reviseSubject(s) {
  const dir = join(RUNS_DIR, s.run);
  const artifact = JSON.parse(readFileSync(join(dir, "artifact.json"), "utf8"));
  const subjOut = join(OUT_DIR, s.key);
  mkdirSync(subjOut, { recursive: true });

  const buildBounds = artifactBounds(artifact);
  // THE ONE LINE THAT DIFFERS FROM form-revise-ab.mjs: a GLB target, not a concept target.
  const target = glbFormTarget({ glbPath: s.glb, buildBounds });

  // whole-object "before" (vs the GLB now, not the concept)
  const beforeWhole = await wholeObjectIoU(artifact, target, join(subjOut, "before.png"));

  const editor = makeFormEditor({
    // Force the form route so the LLM editor runs (the model-free critic would route flat→procedural).
    critic: () => [{ defect: s.defect, where: s.where, route: "curve" }],
  });

  const out = await reviseLoop(artifact, {
    regions: [s.region],
    observe: (a, R) => observeRegion(a, R, { outPath: join(subjOut, "crop.png") }),
    diagnose: editor.diagnose,
    tweakFor: editor.tweakFor,
    // The accept step consults the GLB form target via the SAME liveFormScore seam — no loop change.
    score: liveFormScore({ formTarget: target }),
    budget: { maxIterations: 4, perRegion: 1 },
  });

  const afterWhole = await wholeObjectIoU(out.artifact, target, join(subjOut, "after.png"));

  // Render the PROPOSED candidate (the stashed LLM edit applied) even when the gate rolled it back.
  const R0 = selectRegion(artifact, s.region);
  const stashed = editor.stash.get(regionKey(subBoundsOf(R0)));
  let proposedWhole = null;
  if (stashed) {
    const candidate = applyRegionEdit(artifact, R0, stashed);
    proposedWhole = await wholeObjectIoU(candidate, target, join(subjOut, "proposed.png"));
  }

  const e = out.trace[0] || {};
  const e13Baseline = baselineIoU(s.run);
  const accepted = e.accepted ?? false;
  return {
    subject: s.key,
    run: s.run,
    glb: `glb/${s.key}.glb`,
    region: s.region.bbox,
    defect: s.defect,
    where: s.where,
    route: e.route ?? null,
    regionIoUBefore: e.scoreBefore ?? null, // the GLB true-per-region accept signal (the upgrade)
    regionIoUAfter: e.scoreAfter ?? null,
    accepted,
    reason: e.reason ?? null,
    e13Baseline,
    wholeObjectIoUBefore: beforeWhole,
    wholeObjectIoUAfter: afterWhole,
    wholeObjectIoUProposed: proposedWhole,
    moved: accepted, // did the 3-D target move the loop on this build? (the headline finding)
    verdict: formVerdictOf(beforeWhole, afterWhole, accepted), // GLB-before vs GLB-after (apples-to-apples)
    trace: out.trace,
    edits: editor.stash.size,
    proposals: editor.proposals,
  };
}

function mdTable(rows) {
  const head =
    "| subject | route | GLB whole before→after | region IoU before→after | E-13 concept ref | kept? | verdict |\n" +
    "|---------|-------|:----------------------:|:-----------------------:|-----------------:|:-----:|---------|";
  const fmt = (n) => (typeof n === "number" ? n.toFixed(3) : "—");
  const body = rows
    .map(
      (r) =>
        `| ${r.subject} | ${r.route ?? "—"} | ${fmt(r.wholeObjectIoUBefore)}→${fmt(r.wholeObjectIoUAfter)} | ` +
        `${fmt(r.regionIoUBefore)}→${fmt(r.regionIoUAfter)} | ${fmt(r.e13Baseline)} | ${r.accepted ? "✓" : "✗"} | **${r.verdict ?? "—"}** |`,
    )
    .join("\n");
  return `${head}\n${body}`;
}

function emit(rows) {
  const json = {
    schema: "glb-formtarget-ab/v1",
    metric: "silhouette-iou (GLB 3-D target)",
    generatedFrom: "benchmarks/sculpture/runs/{009-*-koi-fish,006-*-human-heart} + benchmarks/sculpture/glb/{koi,heart}.glb",
    note:
      "region IoU = the R-framed build render's silhouette vs the GLB silhouette CLIPPED to R mapped into " +
      "mesh space (mapVoxelRegionToMesh) — a TRUE per-region 3-D signal the flat concept could not give. " +
      "whole IoU = the full-build 3/4 render vs the whole GLB silhouette. The verdict is categorical and " +
      "APPLES-TO-APPLES: GLB-after vs GLB-before (improved|held|regressed); the E-13 concept-target IoU is a " +
      "cross-reference only (mixing it into the gate would falsely flag an unchanged build as regressed). " +
      "Honesty: single 3/4 view; GLB and build share no origin/scale " +
      "(normalization removes translation+uniform scale) and rotation/axis mismatch is NOT corrected. " +
      "Compare directly to form-revise-ab.md (the flat-concept run).",
    subjects: rows,
  };
  writeFileSync(join(HERE, "glb-formtarget-ab.json"), JSON.stringify(json, null, 2) + "\n");

  const moved = rows.filter((r) => r.moved).map((r) => r.subject);
  const headline =
    rows.length === 0
      ? "No subjects ran (assets absent) — see the placeholder note below."
      : moved.length === 0
        ? "The 3-D GLB target did NOT move the loop on either build — both held (a real null result, AC #4)."
        : `The 3-D GLB target moved the loop on: ${moved.join(", ")}.`;

  const md = [
    "# GLB-form-target A/B — the 3-D target on the E-15 koi/heart loop (T-049-01, epic E-16)",
    "",
    "The SAME surgical loop as `form-revise-ab.md`, re-run with the only change being the **form target**:",
    "`glbFormTarget` (a real TRELLIS 3-D mesh) instead of the flat `conceptFormTarget`. The loop body,",
    "observe, diagnose, and the accept gate are byte-identical — the seam invariant (AC #3).",
    "",
    `**Headline:** ${headline}`,
    "",
    mdTable(rows),
    "",
    ...Object.entries(VERDICT_GLOSS).map(([k, v]) => `- **${k}** — ${v}`),
    "",
    ...rows.map((r) =>
      [
        `## ${r.subject} — ${r.run}`,
        `- region: \`${JSON.stringify(r.region)}\`  defect: **${r.defect}** in ${r.where}`,
        `- GLB: \`${r.glb}\`  route: \`${r.route}\`  kept: **${r.accepted}** (${r.reason})  proposed edits stashed: ${r.edits}`,
        `- GLB whole-object IoU: ${typeof r.wholeObjectIoUBefore === "number" ? r.wholeObjectIoUBefore.toFixed(3) : "—"}` +
          ` → ${typeof r.wholeObjectIoUAfter === "number" ? r.wholeObjectIoUAfter.toFixed(3) : "—"}` +
          `  verdict: **${r.verdict}**  (E-13 concept-target IoU for reference: ${typeof r.e13Baseline === "number" ? r.e13Baseline.toFixed(3) : "—"})`,
        `- GLB per-region IoU (the accept signal): ${typeof r.regionIoUBefore === "number" ? r.regionIoUBefore.toFixed(3) : "—"}` +
          ` → ${typeof r.regionIoUAfter === "number" ? r.regionIoUAfter.toFixed(3) : "—"}`,
        `- proposed-edit whole IoU: ${typeof r.wholeObjectIoUProposed === "number" ? r.wholeObjectIoUProposed.toFixed(3) : "—"}` +
          ` (the LLM edit applied, shown even if rolled back)`,
        `- did the 3-D target move the loop here? **${r.moved ? "yes" : "no"}**`,
        `- renders: \`glb-formtarget-ab/${r.subject}/{before,proposed,after}.png\` + \`crop.png\``,
        `- proposals: \`${JSON.stringify(r.proposals)}\``,
        "",
        "```json",
        JSON.stringify(r.trace, null, 2),
        "```",
        "",
      ].join("\n"),
    ),
  ].join("\n");
  writeFileSync(join(HERE, "glb-formtarget-ab.md"), md);
  console.error(`wrote glb-formtarget-ab.json + glb-formtarget-ab.md (${rows.length} subjects)`);
}

/** Offline regen: re-derive e13Baseline + verdict from committed measured numbers (no GL, no model). */
function regenerateOffline() {
  const prev = JSON.parse(readFileSync(join(HERE, "glb-formtarget-ab.json"), "utf8"));
  const rows = (prev.subjects || []).map((r) => {
    const e13Baseline = baselineIoU(r.run) ?? r.e13Baseline ?? null;
    return {
      ...r,
      e13Baseline,
      moved: r.moved ?? r.accepted,
      verdict: formVerdictOf(r.wholeObjectIoUBefore, r.wholeObjectIoUAfter, r.accepted),
    };
  });
  emit(rows);
}

async function main() {
  if (process.argv.includes("--offline")) {
    regenerateOffline();
    return;
  }
  mkdirSync(OUT_DIR, { recursive: true });
  const rows = [];
  for (const s of SUBJECTS) {
    if (!existsSync(join(RUNS_DIR, s.run, "artifact.json"))) {
      console.error(`skip ${s.key}: ${s.run}/artifact.json not found`);
      continue;
    }
    if (!existsSync(s.glb)) {
      console.error(`skip ${s.key}: ${s.glb} not found (the GLBs are gitignored — regen via trellis-glb.mjs)`);
      continue;
    }
    console.error(`revising ${s.key} (${s.run}) with the GLB target …`);
    rows.push(await reviseSubject(s));
  }
  emit(rows);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
