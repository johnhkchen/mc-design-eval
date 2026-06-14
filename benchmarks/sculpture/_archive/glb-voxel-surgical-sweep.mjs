// GLB-voxel SURGICAL sweep — E-17 rung R3 (T-056-01, story S-056, epic E-17).
//
// R2 (glb-voxel-clean.mjs) cleaned the SKIN of the R1 builds (same occupancy, value-true palette). R3 adds
// the E-15 surgical loop: for each of the 7 R2 builds, run `reviseLoop` with the form target =
// `glbFormTarget({ glbPath })` — the SAME GLB the build was voxelized from — and let the deterministic
// procedural pass try to clean voxelization defects region by region, under the P14 cage (a tweak that does
// not raise the per-region GLB IoU is ROLLED BACK; accepted regions lock). Regions are GENERIC horizontal
// slabs from the build's own bounds (autoRegions) — no curated per-subject defects, because this generalizes
// to all 7 subjects. Routing is the loop's DEFAULT model-free proceduralDiagnose, so R3 needs NO `claude -p`
// (GL-only, not metered on the model).
//
// REUSE, NOT REIMPLEMENTATION (the parallel-roots lesson): the loop (`reviseLoop`/`liveFormScore`), the GLB
// target (`glbFormTarget`), region addressing (`artifactBounds`), the region picker (`autoRegions`, pure
// src/), the SUBJECTS list (glb-voxel-breadth), and the categorical verdict (`formVerdictOf`, the sibling)
// are all imported. This runner only wires them per subject and rolls up r3.{md,json}. The E-16 synthesis
// runner (glb-voxel-surgical.mjs, koi+heart on R1 with curated regions + the LLM route) is left untouched —
// it is a different, committed result.
//
// EXPECTED: a near-null. On the already-close GLB-voxel builds a single-view per-region accept-gate rarely
// lifts the whole-object silhouette, so most regions roll back (verdict "held"). That is the finding, not a
// failure — recorded honestly per AC #3.
//
// GL + host-tool, NOT in `npm test`. An absent R2 artifact OR GLB is skipped, never a hard error.
//
//   node benchmarks/sculpture/glb-voxel-surgical-sweep.mjs [scale]   # live R3 sweep, 7 subjects
//   node benchmarks/sculpture/glb-voxel-surgical-sweep.mjs --offline # rebuild r3.{md,json} from summaries
//
// Writes glb-voxel-surgical-sweep/<subj>/{artifact.json, before.png, after.png, summary.json} and
// glb-voxel-surgical-sweep/r3.{md,json}. The revised artifact.json is the contract the ablation collector
// reads for R3's value ΔE.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { reviseLoop, liveFormScore } from "../../src/revise/loop.mjs";
import { artifactBounds } from "../../src/revise/region.mjs";
import { boxesIntersect } from "../../src/revise/tweak.mjs";
import { glbFormTarget } from "../../src/form/form-target.mjs";
import { autoRegions } from "../../src/form/ablation.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { DEFAULT_SCALE, SCULPTURE_VIEW_3Q } from "../../src/sculpture.mjs";
import { GLB_VOXEL_METHOD_ID } from "../../src/config.mjs";
import { SUBJECTS } from "./glb-voxel-breadth.mjs";
// DRY: reuse the sibling's categorical classifier (GLB-after vs GLB-before, whole-object).
import { formVerdictOf } from "./glb-formtarget-ab.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const GLB_DIR = join(HERE, "glb");
const R2_DIR = join(HERE, "glb-voxel-clean"); // R2 (input) builds
const OUT_DIR = join(HERE, "glb-voxel-surgical-sweep"); // R3 (output)

const round3 = (n) => Math.round(n * 1000) / 1000;

/** Render the WHOLE artifact @ 3/4 and score its silhouette IoU vs the WHOLE GLB (the verdict signal). */
async function wholeObjectIoU(renderArtifact, artifact, target, outPath) {
  await renderArtifact(artifact, { outPath, view: SCULPTURE_VIEW_3Q });
  return round3(await target.wholeObjectScore(outPath));
}

/**
 * P14-safety audit from the loop's OWN record (the loop enforces it; this CONFIRMS it). PURE. Checks every
 * accepted region is in `out.locked`, and no actual edit (an entry with a scoreAfter) touched an
 * already-accepted region without the loop having marked it `locked-overlap`. Same shape as the sibling.
 */
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
        if (boxesIntersect(L, t.subBounds)) {
          violations.push({ type: "edited-locked-region", subBounds: t.subBounds });
        }
      }
    }
    if (t.accepted && t.subBounds) lockedSoFar.push(t.subBounds);
  }
  return { ok: violations.length === 0, locked: out.locked.length, acceptedCount: accepted.length, violations };
}

/** R2 cross-reference: the cleaned build's form IoU (its summary's formIoUAfter), if present. */
async function r2FormIoU(key) {
  const p = join(R2_DIR, key, "summary.json");
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(await readFile(p, "utf8")).formIoUAfter ?? null;
  } catch {
    return null;
  }
}

/** Build the per-region trace rows from the loop's trace, matched to the configured regions. */
function perRegionTrace(regions, out) {
  return regions.map((spec, i) => {
    const specStr = JSON.stringify(spec);
    const entries = out.trace.filter((t) => JSON.stringify(t.region) === specStr);
    // Prefer the ACCEPTED attempt (a region may try `perRegion` tweaks; the accepted one is the outcome),
    // else the first scored attempt, else any entry. Picking the first-scored alone mislabels a region
    // whose later attempt was the one that landed (kept would read 0 while the loop locked it).
    const e = entries.find((t) => t.accepted) || entries.find((t) => "scoreAfter" in t) || entries[0] || {};
    return {
      index: i,
      region: spec.bbox,
      route: e.route ?? null,
      tweak: e.tweak ?? null,
      scoreBefore: e.scoreBefore ?? null, // true per-region GLB IoU (the accept signal)
      scoreAfter: e.scoreAfter ?? null,
      accepted: e.accepted ?? false,
      reason: e.reason ?? null,
    };
  });
}

/** The live surgical loop on ONE subject's R2 build. Returns its summary row. */
async function reviseOne(subj, { scale = DEFAULT_SCALE, renderArtifact } = {}) {
  const r2Art = join(R2_DIR, subj.key, "artifact.json");
  const glbPath = join(GLB_DIR, subj.glb);
  if (!existsSync(r2Art)) {
    return { subject: subj.key, skipped: true, note: "R2 artifact absent (run glb-voxel-clean.mjs first)" };
  }
  if (!existsSync(glbPath)) {
    return { subject: subj.key, skipped: true, note: "GLB absent (gitignored — regen via trellis-glb.mjs)" };
  }

  const dir = join(OUT_DIR, subj.key);
  await mkdir(dir, { recursive: true });
  const artifact = JSON.parse(await readFile(r2Art, "utf8"));
  const buildBounds = artifactBounds(artifact);
  // THE SYNTHESIS TARGET: the GLB this build was voxelized from (build ⊂ its own 3-D source).
  const target = glbFormTarget({ glbPath, buildBounds });
  const regions = autoRegions(buildBounds);

  const t0 = Date.now();
  const beforeWhole = await wholeObjectIoU(renderArtifact, artifact, target, join(dir, "before.png"));

  // The E-15 loop, UNCHANGED — default model-free diagnose/tweak; only the score seam is the GLB target.
  const out = await reviseLoop(artifact, {
    regions,
    score: liveFormScore({ formTarget: target }),
    budget: { maxIterations: 12, perRegion: 2 },
  });

  // When NO region is accepted, reviseLoop returns the SAME artifact reference — the build is unchanged, so
  // whole-object IoU is unchanged by construction. Re-rendering would only inject GL rasterization jitter
  // (a false "regressed"); honestly report afterWhole = beforeWhole and skip the redundant render.
  const changed = out.artifact !== artifact;
  const afterWhole = changed
    ? await wholeObjectIoU(renderArtifact, out.artifact, target, join(dir, "after.png"))
    : beforeWhole;

  // The revised build is the contract the ablation collector reads for R3's value ΔE.
  assertArtifact(out.artifact);
  await writeFile(join(dir, "artifact.json"), JSON.stringify(out.artifact, null, 2) + "\n");

  const perRegion = perRegionTrace(regions, out);
  const kept = perRegion.filter((p) => p.accepted).length;
  const rolledBack = perRegion.filter((p) => !p.accepted && p.reason === "rolled-back").length;
  const secs = Number(((Date.now() - t0) / 1000).toFixed(1));

  const summary = {
    subject: subj.key,
    scale,
    regions: regions.length,
    formIoUR2: await r2FormIoU(subj.key), // cross-reference: R2's form IoU (the start)
    wholeObjectIoUBefore: beforeWhole,
    wholeObjectIoUAfter: afterWhole,
    verdict: formVerdictOf(beforeWhole, afterWhole, kept > 0),
    changed, // false ⇒ build byte-identical to R2 (no region accepted); after==before by construction
    kept,
    rolledBack,
    p14: p14Report(out),
    iterations: out.iterations,
    converged: out.converged,
    perRegion,
    view3q: SCULPTURE_VIEW_3Q,
    durationSec: secs,
  };
  await writeFile(join(dir, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
  console.error(
    `${subj.key}: whole IoU ${beforeWhole}→${afterWhole} (${summary.verdict}), ` +
      `kept ${kept}/${regions.length}, P14 ${summary.p14.ok ? "ok" : "VIOLATION"} (${secs}s)`,
  );
  return summary;
}

/** PURE: rows[] → { md, json } for the R3 roll-up. */
function buildR3(rows, { scale = DEFAULT_SCALE } = {}) {
  const live = rows.filter((r) => !r.skipped);
  const p14ok = live.every((r) => r.p14 && r.p14.ok);
  const keptTotal = live.reduce((a, r) => a + (r.kept || 0), 0);
  const md = [
    "# R3 — GLB-voxel surgical sweep across the 7-subject sweep (E-17 T-056-01)",
    "",
    "The E-15 `reviseLoop` run on each R2 cleaned build with `formTarget = glbFormTarget({glbPath})` (the",
    "build's own GLB). Generic horizontal-slab regions (autoRegions); default model-free procedural diagnose;",
    "the P14 cage rolls back any tweak that does not raise the per-region GLB IoU. `whole IoU` = full-build 3/4",
    "render vs the whole GLB silhouette. Verdict is GLB-after vs GLB-before.",
    "",
    `Subjects: ${live.length}. Regions accepted across all subjects: **${keptTotal}**. ` +
      `P14-safety: **${p14ok ? "holds for all ✓" : "VIOLATION ✗"}**.`,
    keptTotal === 0
      ? "Expected near-null: no local single-view tweak beat the already-close GLB-voxel build on any subject " +
        "— the cage held every build unchanged. The honest R3 finding (see form-revision-needs-3d-target)."
      : "Some regions cleared the per-region accept-gate; see whole-IoU deltas for whether they transferred.",
    "",
    "| subject | R2 form IoU | whole IoU before→after | kept/regions | P14 | verdict |",
    "| ------- | ----------- | ---------------------- | ------------ | --- | ------- |",
    ...rows.map((r) =>
      r.skipped
        ? `| ${r.subject} | — | — | — | — | _(skipped — ${r.note ?? "absent"})_ |`
        : `| ${r.subject} | ${fmt(r.formIoUR2)} | ${fmt(r.wholeObjectIoUBefore)} → ${fmt(r.wholeObjectIoUAfter)} | ` +
          `${r.kept}/${r.regions} | ${r.p14.ok ? "✓" : "✗"} | **${r.verdict}** |`,
    ),
    "",
  ].join("\n");

  const json = {
    schema: "glb-voxel-r3/v1",
    rung: "R3",
    method: GLB_VOXEL_METHOD_ID,
    view: SCULPTURE_VIEW_3Q,
    scale,
    metric:
      "whole-object silhouette IoU vs the GLB at SCULPTURE_VIEW_3Q (verdict signal); the loop's per-region " +
      "accept-gate is the TRUE per-region GLB IoU (scoreBefore/After). verdict = GLB-after vs GLB-before.",
    generatedFrom:
      "benchmarks/sculpture/glb-voxel-clean/<subject>/artifact.json (R2) + benchmarks/sculpture/glb/<subject>.glb",
    note:
      "E-17 rung R3: the E-15 surgical reviseLoop on the R2 cleaned builds, form target = the build's own GLB. " +
      "Regions are generic horizontal slabs (autoRegions); routing is the default model-free procedural pass " +
      "(no claude -p). P14: accepted regions lock; non-improving tweaks roll back (confirmed from the loop's " +
      "own locked+trace). Expected near-null — a single-view per-region accept-gate rarely lifts the " +
      "whole-object silhouette of an already-close GLB-voxel build. Sword excluded (no GLB).",
    subjects: rows,
  };
  return { md, json };
}

function fmt(n) {
  return typeof n === "number" ? n.toFixed(3) : "—";
}

/** Write r3.{md,json} from rows. */
async function emit(rows, opts) {
  await mkdir(OUT_DIR, { recursive: true });
  const { md, json } = buildR3(rows, opts);
  await writeFile(join(OUT_DIR, "r3.json"), JSON.stringify(json, null, 2) + "\n");
  await writeFile(join(OUT_DIR, "r3.md"), md);
  console.error(`wrote glb-voxel-surgical-sweep/r3.{md,json} (${rows.filter((r) => !r.skipped).length}/${rows.length} subjects)`);
}

/** --offline: rebuild r3.{md,json} from committed per-subject summaries (no GL). */
async function regenerateOffline({ scale = DEFAULT_SCALE } = {}) {
  const rows = [];
  for (const subj of SUBJECTS) {
    const p = join(OUT_DIR, subj.key, "summary.json");
    if (existsSync(p)) rows.push(JSON.parse(await readFile(p, "utf8")));
    else rows.push({ subject: subj.key, skipped: true, note: "no summary.json" });
  }
  await emit(rows, { scale });
}

async function runSweep({ scale = DEFAULT_SCALE } = {}) {
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  await mkdir(OUT_DIR, { recursive: true });
  const rows = [];
  for (const subj of SUBJECTS) {
    rows.push(await reviseOne(subj, { scale, renderArtifact }));
  }
  return rows;
}

async function main() {
  const argv = process.argv.slice(2);
  const scaleArg = argv.find((a) => /^\d+$/.test(a));
  const scale = scaleArg ? Number(scaleArg) : DEFAULT_SCALE;
  if (argv.includes("--offline")) {
    await regenerateOffline({ scale });
    return;
  }
  await emit(await runSweep({ scale }), { scale });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("glb-voxel-surgical-sweep failed:\n  " + (err?.message || err));
    process.exit(1);
  });
}

export { reviseOne, buildR3, p14Report };
