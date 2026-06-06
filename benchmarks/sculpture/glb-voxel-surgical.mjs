// GLB-voxel SURGICAL loop — the E-16 SYNTHESIS (T-052-01, story S-052, epic E-16).
//
// The whole arc converges here: the voxelizer supplies the 3-D FORM (T-051-01 glb-voxel build), the
// surgical loop polishes it AGAINST THAT SAME 3-D SOURCE (T-049-01 glbFormTarget). Unlike every prior
// run, the build and its form target share ONE file — `glb/<subj>.glb` is both what T-051-01 voxelized
// AND what the loop scores against. So the loop has, for the first time, an honest per-region 3-D signal
// AND a starting form that is already close (koi IoU 0.622 / heart 0.877 vs ~0.47 for text→JSON).
//
// THE SEAM INVARIANT (still): the loop body, observe, diagnose router, and accept-gate are UNCHANGED from
// E-15/T-049-01. This harness only (a) reads the T-051-01 glb-voxel artifacts as input, (b) runs TWO
// regions per subject — one routed to the deterministic PROCEDURAL pass, one to the LLM block-editor — so
// the trace shows both routes, and (c) reports P14-safety from the loop's own `locked`+`trace`. The
// categorical verdict is REUSED from the sibling (`formVerdictOf`), gated GLB-after vs GLB-before.
//
// GL + METERED (headless render + claude -p for the LLM region): run on demand, NOT in `npm test`. Mirrors
// glb-formtarget-ab.mjs / form-revise-ab.mjs. The GLBs are gitignored; an absent artifact OR GLB is
// skipped, not an error.
//
//   node benchmarks/sculpture/glb-voxel-surgical.mjs            # live (needs glb-voxel artifacts + GLBs + GL + claude -p)
//   node benchmarks/sculpture/glb-voxel-surgical.mjs --offline  # re-derive verdicts from committed numbers
//
// Writes glb-voxel-surgical/glb-voxel-surgical.{json,md} and per-subject renders under
// glb-voxel-surgical/<subj>/{before,after,proposed-*,crop-*}.png (PNGs gitignored; the .json/.md are the
// durable record).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { reviseLoop, liveFormScore } from "../../src/revise/loop.mjs";
import { observeRegion, selectRegion, applyRegionEdit, subBoundsOf, artifactBounds } from "../../src/revise/region.mjs";
import { makeFormEditor, regionKey } from "../../src/revise/form-edit.mjs";
import { boxesIntersect } from "../../src/revise/tweak.mjs";
import { glbFormTarget } from "../../src/form/form-target.mjs";
import { SCULPTURE_VIEW_3Q } from "../../src/sculpture.mjs";
// DRY: the categorical judge + its gloss are the sibling's exports — reused, not cloned (the
// parallel-roots-duplicate-shared-deps lesson). GLB-after vs GLB-before; `regressed` is an alarm only.
import { formVerdictOf, VERDICT_GLOSS } from "./glb-formtarget-ab.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const GLB_DIR = join(HERE, "glb");
const IN_DIR = join(HERE, "glb-voxel");
const OUT_DIR = join(HERE, "glb-voxel-surgical");

// The two AC subjects. Each runs TWO regions: an LLM-edit region (a `curve` route → the block-editor) on
// the build's headline voxelization artifact, then a PROCEDURAL region (a `relief` route → the
// deterministic Z-depth pass) on a body surface. Regions chosen from the occupancy histogram (research.md)
// so each actually contains mass. The form target for both is the GLB the build was VOXELIZED FROM.
const SUBJECTS = [
  {
    key: "koi",
    glb: join(GLB_DIR, "koi.glb"),
    regions: [
      {
        bbox: { min: [9, 0, -2], max: [15, 16, 9] },
        route: "curve", // → LLM block-editor
        defect: "thick-fin / stair-stepping",
        where: "the caudal fin (a thin sheet voxelization thickened into a chunky stack)",
      },
      {
        bbox: { min: [-6, 3, -4], max: [2, 12, 4] },
        route: "relief", // → deterministic procedural pass
        defect: "flat-skin",
        where: "the dense mid-body flank",
      },
    ],
  },
  {
    key: "heart",
    glb: join(GLB_DIR, "heart.glb"),
    regions: [
      {
        bbox: { min: [-8, 18, -10], max: [8, 26, 10] },
        route: "curve", // → LLM block-editor
        defect: "almost-closed-arch",
        where: "the great vessels / aortic arch (a near-solid taper, not an open loop)",
      },
      {
        bbox: { min: [-8, 4, -8], max: [8, 14, 8] },
        route: "relief", // → deterministic procedural pass
        defect: "flat-skin",
        where: "the ventricular wall",
      },
    ],
  },
];

/**
 * A critic that maps the CURRENT region (matched by its spec) to its configured {defect, where, route}.
 * The default proceduralDiagnose would route everything flat→procedural; this lets one region go to the
 * LLM editor (`curve`) and another to the procedural pass (`relief`) within one loop run. PURE.
 */
function makeRegionCritic(regions) {
  const bySpec = new Map(regions.map((r) => [JSON.stringify({ bbox: r.bbox }), r]));
  return (_artifact, R) => {
    const cfg = bySpec.get(JSON.stringify(R.spec));
    return cfg ? [{ defect: cfg.defect, where: cfg.where, route: cfg.route }] : [];
  };
}

/** Render the WHOLE artifact @ 3/4 and score its silhouette IoU vs the WHOLE GLB (the verdict signal). */
async function wholeObjectIoU(artifact, target, outPath) {
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  await renderArtifact(artifact, { outPath, view: SCULPTURE_VIEW_3Q });
  return target.wholeObjectScore(outPath);
}

/**
 * P14-safety audit from the loop's OWN record (the loop enforces it; this CONFIRMS it). PURE. Checks:
 *  - every accepted trace entry's subBounds is present in `out.locked`;
 *  - no actual edit (an entry with a scoreAfter) touched a region overlapping an ALREADY-accepted region
 *    without the loop having marked it `locked-overlap`.
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
  return { ok: violations.length === 0, locked: out.locked, acceptedCount: accepted.length, violations };
}

/** The T-051-01 build's own silhouette IoU baseline (from its committed summary.json), if present. */
function buildBaselineIoU(key) {
  const p = join(IN_DIR, key, "summary.json");
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8")).silhouetteIoU ?? null;
  } catch {
    return null;
  }
}

async function reviseSubject(s) {
  const artifactPath = join(IN_DIR, s.key, "artifact.json");
  const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
  const subjOut = join(OUT_DIR, s.key);
  mkdirSync(subjOut, { recursive: true });

  const buildBounds = artifactBounds(artifact);
  // The form target is the GLB this build was VOXELIZED FROM — the synthesis: build ⊂ its own 3-D source.
  const target = glbFormTarget({ glbPath: s.glb, buildBounds });

  const beforeWhole = await wholeObjectIoU(artifact, target, join(subjOut, "before.png"));

  // One critic, both routes: each configured region carries its own route (curve→LLM, relief→procedural).
  const editor = makeFormEditor({ critic: makeRegionCritic(s.regions) });

  const out = await reviseLoop(artifact, {
    regions: s.regions.map((r) => ({ bbox: r.bbox })),
    observe: (a, R) => observeRegion(a, R, { outPath: join(subjOut, `crop-${subBoundsOf(R).min.join("_")}.png`) }),
    diagnose: editor.diagnose,
    tweakFor: editor.tweakFor,
    // The accept step consults the GLB form target via the SAME liveFormScore seam — no loop change.
    score: liveFormScore({ formTarget: target }),
    budget: { maxIterations: 8, perRegion: 1 },
  });

  const afterWhole = await wholeObjectIoU(out.artifact, target, join(subjOut, "after.png"));

  // Assemble the per-region trace + render the PROPOSED candidate for each LLM region (even if rolled back).
  const perRegion = [];
  for (let i = 0; i < s.regions.length; i++) {
    const r = s.regions[i];
    const specStr = JSON.stringify({ bbox: r.bbox });
    const entries = out.trace.filter((t) => JSON.stringify(t.region) === specStr);
    const e = entries.find((t) => "scoreAfter" in t) || entries[0] || {};
    const row = {
      index: i,
      region: r.bbox,
      configuredRoute: r.route,
      loopRoute: e.route ?? null, // "llm-edit" for curve, "relief"/"material" for procedural
      defect: r.defect,
      where: r.where,
      tweak: e.tweak ?? null,
      scoreBefore: e.scoreBefore ?? null, // the GLB true-per-region accept signal
      scoreAfter: e.scoreAfter ?? null,
      accepted: e.accepted ?? false,
      reason: e.reason ?? null,
    };
    if (r.route === "curve") {
      const R0 = selectRegion(artifact, { bbox: r.bbox });
      const stashed = editor.stash.get(regionKey(subBoundsOf(R0)));
      if (stashed) {
        const candidate = applyRegionEdit(artifact, R0, stashed);
        row.proposedWholeIoU = await wholeObjectIoU(candidate, target, join(subjOut, `proposed-${i}.png`));
      } else {
        row.proposedWholeIoU = null; // nothing stashed (out-of-R / invalid proposal) → identity no-op
      }
    }
    perRegion.push(row);
  }

  const keptCount = perRegion.filter((p) => p.accepted).length;
  const rolledBackCount = perRegion.filter((p) => !p.accepted && p.reason === "rolled-back").length;

  return {
    subject: s.key,
    glb: `glb/${s.key}.glb`,
    buildSilhouetteIoU: buildBaselineIoU(s.key), // T-051-01's own-GLB baseline (cross-reference)
    wholeObjectIoUBefore: beforeWhole,
    wholeObjectIoUAfter: afterWhole,
    verdict: formVerdictOf(beforeWhole, afterWhole, keptCount > 0), // GLB-after vs GLB-before
    keptCount,
    rolledBackCount,
    perRegion,
    p14: p14Report(out),
    proposals: editor.proposals,
    trace: out.trace,
  };
}

function fmt(n) {
  return typeof n === "number" ? n.toFixed(3) : "—";
}

function mdTable(rows) {
  const head =
    "| subject | GLB whole before→after | regions kept/rolled | build-IoU ref | P14 | verdict |\n" +
    "|---------|:----------------------:|:-------------------:|:-------------:|:---:|---------|";
  const body = rows
    .map(
      (r) =>
        `| ${r.subject} | ${fmt(r.wholeObjectIoUBefore)}→${fmt(r.wholeObjectIoUAfter)} | ` +
        `${r.keptCount}/${r.rolledBackCount} | ${fmt(r.buildSilhouetteIoU)} | ${r.p14.ok ? "✓" : "✗"} | **${r.verdict}** |`,
    )
    .join("\n");
  return `${head}\n${body}`;
}

function emit(rows) {
  mkdirSync(OUT_DIR, { recursive: true });
  const json = {
    schema: "glb-voxel-surgical/v1",
    metric: "silhouette-iou (GLB 3-D target = the build's OWN source)",
    generatedFrom:
      "benchmarks/sculpture/glb-voxel/{koi,heart}/artifact.json (T-051-01) + benchmarks/sculpture/glb/{koi,heart}.glb",
    note:
      "THE SYNTHESIS: the surgical loop (T-049-01 glbFormTarget) runs on the GLB-voxel builds (T-051-01) " +
      "with the form target = the SAME GLB each build was voxelized from. Per region: scoreBefore/After is " +
      "the TRUE per-region 3-D IoU (R-framed build render vs the GLB silhouette clipped to R mapped into " +
      "mesh space). whole IoU = the full-build 3/4 render vs the whole GLB silhouette. Verdict is " +
      "APPLES-TO-APPLES: GLB-after vs GLB-before (improved|held|regressed); `regressed` is impossible " +
      "under the rollback gate (an alarm). Each subject runs TWO regions — one LLM-edit (`curve`), one " +
      "PROCEDURAL (`relief`) — so the trace shows both routes. P14: accepted regions lock; non-improving " +
      "tweaks roll back (confirmed from the loop's own locked+trace). Honesty: single 3/4 view; " +
      "silhouette ≠ form; normalization removes translation+uniform scale; rotation/axis NOT corrected " +
      "(but build⊂its own GLB, so alignment is as good as it gets). n=2.",
    subjects: rows,
  };
  writeFileSync(join(OUT_DIR, "glb-voxel-surgical.json"), JSON.stringify(json, null, 2) + "\n");

  const kept = rows.flatMap((r) => r.perRegion.filter((p) => p.accepted).map((p) => `${r.subject}:${p.configuredRoute}`));
  const headline =
    rows.length === 0
      ? "No subjects ran (assets absent) — see the note below."
      : kept.length === 0
        ? "No surgical tweak beat the build's own 3-D form on either subject — every region rolled back " +
          "(the cage held the already-close builds unchanged). A real null: the GLB-voxel start is close " +
          "enough that no LOCAL edit cleaned a voxelization artifact past the per-region accept-gate."
        : `Surgical tweaks that cleared the GLB accept-gate (cleaned a voxelization artifact): ${kept.join(", ")}.`;
  const p14ok = rows.every((r) => r.p14.ok);

  const md = [
    "# GLB-voxel surgical loop — the E-16 synthesis (T-052-01)",
    "",
    "The E-15 surgical `reviseLoop` run on the **T-051-01 GLB-voxel builds** with `glbFormTarget({glbPath})`",
    "pointed at the **same GLB each build was voxelized from**. The loop body / observe / diagnose router /",
    "accept-gate are unchanged — only the input (a voxelized GLB) and the target (its own source) are new.",
    "Each subject runs two regions: an **LLM block-edit** (`curve`) on the headline voxelization artifact and",
    "a deterministic **procedural** pass (`relief`) on a body surface.",
    "",
    `**Headline:** ${headline}`,
    `**P14-safety:** ${p14ok ? "holds for all subjects ✓" : "VIOLATION — see per-subject p14 ✗"} (accepted regions lock; non-improving tweaks roll back).`,
    "",
    mdTable(rows),
    "",
    ...Object.entries(VERDICT_GLOSS).map(([k, v]) => `- **${k}** — ${v}`),
    "",
    ...rows.map((r) =>
      [
        `## ${r.subject} — \`${r.glb}\``,
        `- GLB whole-object IoU: **${fmt(r.wholeObjectIoUBefore)} → ${fmt(r.wholeObjectIoUAfter)}**` +
          `  verdict: **${r.verdict}**  (T-051-01 build-vs-own-GLB baseline: ${fmt(r.buildSilhouetteIoU)})`,
        `- regions kept/rolled-back: **${r.keptCount}/${r.rolledBackCount}**` +
          `  P14: **${r.p14.ok ? "ok" : "VIOLATION"}** (locked: ${r.p14.locked.length}; violations: ${JSON.stringify(r.p14.violations)})`,
        "",
        "| # | region | route | defect | region IoU before→after | kept? | reason | proposed whole IoU |",
        "|---|--------|-------|--------|:-----------------------:|:-----:|--------|:------------------:|",
        ...r.perRegion.map(
          (p) =>
            `| ${p.index} | \`${JSON.stringify(p.region)}\` | ${p.configuredRoute}→${p.loopRoute ?? "—"} | ${p.defect} | ` +
            `${fmt(p.scoreBefore)}→${fmt(p.scoreAfter)} | ${p.accepted ? "✓" : "✗"} | ${p.reason ?? "—"} | ${fmt(p.proposedWholeIoU)} |`,
        ),
        "",
        `- renders: \`glb-voxel-surgical/${r.subject}/{before,after,proposed-*,crop-*}.png\``,
        `- LLM proposals: \`${JSON.stringify(r.proposals)}\``,
        "",
        "```json",
        JSON.stringify(r.trace, null, 2),
        "```",
        "",
      ].join("\n"),
    ),
  ].join("\n");
  writeFileSync(join(OUT_DIR, "glb-voxel-surgical.md"), md);
  console.error(`wrote glb-voxel-surgical.{json,md} (${rows.length} subjects)`);
}

/** Offline regen: re-derive the verdict from committed measured numbers (no GL, no model). */
function regenerateOffline() {
  const prev = JSON.parse(readFileSync(join(OUT_DIR, "glb-voxel-surgical.json"), "utf8"));
  const rows = (prev.subjects || []).map((r) => ({
    ...r,
    verdict: formVerdictOf(r.wholeObjectIoUBefore, r.wholeObjectIoUAfter, (r.keptCount ?? 0) > 0),
  }));
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
    if (!existsSync(join(IN_DIR, s.key, "artifact.json"))) {
      console.error(`skip ${s.key}: glb-voxel/${s.key}/artifact.json not found (run glb-voxel-run.mjs first)`);
      continue;
    }
    if (!existsSync(s.glb)) {
      console.error(`skip ${s.key}: ${s.glb} not found (the GLBs are gitignored — regen via trellis-glb.mjs)`);
      continue;
    }
    console.error(`surgical loop on ${s.key} (GLB target = its own source) …`);
    rows.push(await reviseSubject(s));
  }
  emit(rows);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
