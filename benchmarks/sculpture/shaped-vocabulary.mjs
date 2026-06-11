// IMPURE RUNNER — E-27 shaped-vocabulary evidence pass (S-105 / T-105-01). The component record
// (T-103) names what each subject's openings ARE; this runner turns those names into constructed
// geometry: every opening head fitted (arch where the record witnesses one, flat squaring where
// the geometry is flat — fit errors recorded, misses NAMED, Rule 1) and rebuilt UNDER THE T-102
// CAGE — per-azimuth silhouette IoU vs the GLB, closure no-regress, protected regions — so a
// regressing reconstruction rolls back recorded. The stair-run / slab-step fits are recorded as
// FIT EVIDENCE on the record's roof planes (the construction-legality of each plane, GLB-fit
// preferred with the voxelFit substitution named); the roof replacement itself is S-104's.
//
// THE SEAM INVARIANT: this file is impure wiring only (file I/O, GLB load, best-effort GL
// renders, the durable record). All decisions live in the pure modules (shaped-vocab, shaped-fit,
// opening-reconstruct, shell-regularize). PROVENANCE PIN: the component record carries the sha256
// of the shell it was decomposed from — drift between the committed inputs fails loudly.
// DETERMINISM (E-24 Rule 2): the core runs twice; byte-identical artifacts or no record.
// Rule 3: an `unmapped` block state in the after-render is a FAILURE, not a warning.
//
// GL — run on demand, NOT in `npm test`:
//   npm run shaped:gatehouse                # fit + caged application + renders + record
//   npm run shaped:church
//   npm run shaped:cottage
//   npm run shaped:gatehouse -- --offline   # re-assert the committed record + artifact hash, no GL

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { openingRegions, rebuildArtifact } from "../../src/view/shell-integrity.mjs";
import { regularizeShell, protrudingStackRegion, protrusionCensus } from "../../src/view/shell-regularize.mjs";
import { openingHeadStep } from "../../src/view/opening-reconstruct.mjs";
import { SHAPED_DEFAULTS } from "../../src/form/shaped-vocab.mjs";
import { stairRunSpecFromPlane, slabStepSpecFromPlane } from "../../src/form/shaped-fit.mjs";
import { loadMeshFromGlb, rasterizeSilhouette } from "../../src/form/glb-silhouette.mjs";
import { resolveAngle } from "../../src/view/multi-angle.mjs";
import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { assertArtifact } from "../../src/artifact.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const OUT_DIR = join(HERE, "shaped");
const FRAMES_DIR = join(ROOT, "pr/assets/frames");

const OBLIQUE = "-x-z"; // azimuth 225° — the witness angle every E-25/E-27 stage shares

// Input PATHS only (registry entries, not behavior): the regularized shells the records were
// decomposed from, the records, the immutable GLB references.
const SUBJECTS = {
  cottage: { key: "cottage", shell: "regularize/cottage/artifact.json", record: "components/cottage.json", glb: "glb/cottage.glb" },
  gatehouse: { key: "gatehouse", shell: "regularize/gatehouse/artifact.json", record: "components/gatehouse.json", glb: "glb/stone-gatehouse.glb" },
  church: { key: "church", shell: "regularize/church/artifact.json", record: "components/church.json", glb: "glb/church.glb" },
};

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const artifactJson = (a) => JSON.stringify(a, null, 2) + "\n";

// =================================================================================================
// THE DETERMINISTIC CORE — reads committed inputs, writes nothing, no GL. Run twice per live pass.
// =================================================================================================
async function runShaped(def) {
  const shellBytes = await readFile(join(HERE, def.shell), "utf8");
  const raw = JSON.parse(shellBytes);
  assertArtifact(raw);
  const record = JSON.parse(await readFile(join(HERE, def.record), "utf8"));
  if (record.schema !== "component-record/v1") {
    throw new Error(`${def.key}: ${def.record} is not a component-record/v1`);
  }
  // PROVENANCE PIN (Rule 4): the record must have been decomposed from THIS shell.
  if (record.source?.sha256 && record.source.sha256 !== sha256(shellBytes)) {
    throw new Error(`${def.key}: component record was decomposed from a different shell ` +
      `(record pins ${record.source.sha256.slice(0, 12)}…, input is ${sha256(shellBytes).slice(0, 12)}…)`);
  }
  const occ = artifactOccupancy(raw);

  // roof-plane FIT EVIDENCE (applied by S-104, recorded here): construction legality per plane
  const planeFits = (record.roofPlanes ?? []).map((p) => ({
    plane: p.id,
    stairRun: stairRunSpecFromPlane(p),
    slabStep: slabStepSpecFromPlane(p),
  }));

  // the cage: GLB silhouettes at the gate azimuths; chimney protected (openings are the step's
  // own edit domain — closure still allows their air via the regions list, and IoU + closure
  // gates judge every edit)
  const mesh = loadMeshFromGlb(await readFile(join(HERE, def.glb)));
  const refSils = {};
  for (const a of MULTI_ANGLE_GATE.azimuths) refSils[a] = rasterizeSilhouette(mesh, { view: resolveAngle(a) });
  const regions = openingRegions(occ);
  const stack = protrudingStackRegion(occ);
  const step = openingHeadStep(record);
  const result = regularizeShell(occ, {
    refSils, regions, protect: [{ name: "chimney", contains: stack.contains }], steps: [step],
  });
  const artifact = rebuildArtifact(result.occ, raw);
  assertArtifact(artifact);
  return { raw, occ, record, artifact, result, step, planeFits, stack, regions };
}

/** Self-consistency + the honest-application gates. */
function assertAcceptance(def, r) {
  for (const s of r.result.trace) {
    if (s.accepted && s.reasons.length) throw new Error(`${def.key} cage VIOLATION: accepted step carries reasons ${s.reasons}`);
    if (!s.accepted && !s.reasons.length) throw new Error(`${def.key} cage VIOLATION: rejected step has no recorded reason`);
  }
  const report = r.step.report;
  if (!report) throw new Error(`${def.key}: the opening-heads step never ran`);
  // the runner exists to APPLY fitted heads: a cage rejection is an honest, LOUD failure
  if (r.result.rejected > 0) {
    throw new Error(`${def.key} CAGE REJECTED the opening-heads step: ${r.result.trace.map((s) => s.reasons.join("; ")).join(" | ")}`);
  }
}

const summarizeOpenings = (openings) => {
  const by = { arch: 0, flat: 0, noop: 0, none: 0 };
  for (const o of openings) {
    if (o.kind === "none") by.none++;
    else if (o.noop) by.noop++;
    else by[o.kind]++;
  }
  return by;
};

/** Best-effort GL render (a lens, never logic) — reports the unmapped count for the Rule 3 gate. */
async function tryRender(artifact, angle, label, subjDir) {
  try {
    const { renderArtifact } = await import("../../render/src/render-tool.mjs");
    const path = join(subjDir, `view-${label}.png`);
    const r = await renderArtifact(artifact, { outPath: path, view: resolveAngle(angle) });
    const unmapped = Array.isArray(r.unmapped) ? r.unmapped.length : r.unmapped; // tool variants: list or count
    return { angle, path: r.path.replace(ROOT, ""), unmapped, ...(r.unmapped_detail ? { unmapped_detail: r.unmapped_detail } : {}) };
  } catch (e) {
    return { angle, error: e.message };
  }
}

// =================================================================================================
async function main() {
  const argv = process.argv.slice(2);
  const def = SUBJECTS[argv[argv.indexOf("--subject") + 1]];
  if (!def) throw new Error(`--subject must be one of: ${Object.keys(SUBJECTS).join(", ")}`);
  const offline = argv.includes("--offline");
  const subjDir = join(OUT_DIR, def.key);
  const recPath = join(OUT_DIR, `${def.key}.json`);
  const artPath = join(subjDir, "artifact.json");

  if (offline) {
    if (!existsSync(recPath) || !existsSync(artPath)) throw new Error(`committed record/artifact absent — run npm run shaped:${def.key} first`);
    const rec = JSON.parse(await readFile(recPath, "utf8"));
    const artBytes = await readFile(artPath, "utf8");
    assertArtifact(JSON.parse(artBytes));
    const checks = {
      sha: sha256(artBytes) === rec.reproducible?.sha256,
      trace: (rec.trace ?? []).every((s) => (s.accepted ? !s.reasons.length : s.reasons.length > 0)),
      unmapped: (rec.renders ?? []).every((r) => r.error || r.unmapped === 0),
    };
    const ok = Object.values(checks).every(Boolean);
    console.error(`[offline] ${def.key}: artifact sha ${checks.sha ? "MATCHES" : "DIVERGES"}; ` +
      `cage trace ${checks.trace ? "consistent" : "VIOLATED"}; renders ${checks.unmapped ? "unmapped-clean" : "UNMAPPED STATES"}; AJV ok`);
    if (!ok) process.exitCode = 1;
    return;
  }

  await mkdir(subjDir, { recursive: true });
  await mkdir(FRAMES_DIR, { recursive: true });

  // THE REPRODUCIBILITY PROOF (E-24 Rule 2): the deterministic core, twice; byte-equal or no record.
  const r1 = await runShaped(def);
  const r2 = await runShaped(def);
  const j1 = artifactJson(r1.artifact);
  if (j1 !== artifactJson(r2.artifact)) throw new Error("NON-DETERMINISTIC: two in-process runs produced different artifacts");
  assertAcceptance(def, r1);

  const report = r1.step.report;
  const kinds = summarizeOpenings(report.openings);
  const census = { before: protrusionCensus(r1.occ), after: protrusionCensus(artifactOccupancy(r1.artifact)) };
  console.error(`[${def.key}] reproducible: double-run artifacts identical (${r1.artifact.placements.length} placements)`);
  console.error(`[${def.key}] heads: ${kinds.arch} arch, ${kinds.flat} flat, ${kinds.noop} noop, ${kinds.none} named-miss ` +
    `(carved ${report.carved}, filled ${report.filled})`);
  console.error(`[${def.key}] plane fits: ${r1.planeFits.filter((p) => p.stairRun.spec).length}/${r1.planeFits.length} stair-legal, ` +
    `${r1.planeFits.filter((p) => p.slabStep.spec).length}/${r1.planeFits.length} slab-legal`);
  console.error(`[${def.key}] cage: ${r1.result.accepted} accepted, ${r1.result.rejected} rejected; ` +
    `iou ${JSON.stringify(r1.result.iou.baseline)} → ${JSON.stringify(r1.result.iou.final)}`);

  await writeFile(artPath, j1);
  const artSha = sha256(j1);

  // --- before/after renders (Rule 3: unmapped is a failure) + committed frames -------------------
  const renders = [];
  for (const [when, art] of [["before", r1.raw], ["after", r1.artifact]]) {
    for (const angle of [OBLIQUE, "+x+z"]) {
      const r = await tryRender(art, angle, `${angle}-${when}`, subjDir);
      renders.push({ when, ...r });
      console.error(`render ${when} ${angle}: ${r.path ?? `unavailable (${r.error})`}` +
        (r.unmapped !== undefined ? ` (unmapped ${r.unmapped})` : ""));
    }
  }
  const badUnmapped = renders.filter((r) => r.when === "after" && !r.error && r.unmapped !== 0);
  if (badUnmapped.length) {
    throw new Error(`${def.key} UNMAPPED STATES in the after-render (Rule 3 failure): ${JSON.stringify(badUnmapped[0].unmapped_detail ?? badUnmapped[0])}`);
  }
  const frames = [];
  try {
    const b = renders.find((r) => r.when === "before" && r.angle === OBLIQUE && r.path);
    const a = renders.find((r) => r.when === "after" && r.angle === OBLIQUE && r.path);
    if (b && a) {
      await copyFile(join(ROOT, b.path), join(FRAMES_DIR, `shaped-${def.key}-before.png`));
      await copyFile(join(ROOT, a.path), join(FRAMES_DIR, `shaped-${def.key}-after.png`));
      frames.push(`pr/assets/frames/shaped-${def.key}-before.png`, `pr/assets/frames/shaped-${def.key}-after.png`);
    }
  } catch (e) {
    console.error(`frames: ${e.message}`);
  }

  // --- the durable record -------------------------------------------------------------------------
  const record = {
    schema: "shaped-vocabulary/v1",
    subject: def.key,
    inputs: { shell: def.shell, record: def.record, glb: def.glb, recordSha: r1.record.source?.sha256 ?? null },
    params: { ...SHAPED_DEFAULTS, azimuths: MULTI_ANGLE_GATE.azimuths,
      note: "declared op parameters (shared across subjects — no tuning); azimuths config-frozen" },
    openings: {
      summary: kinds,
      detail: report.openings,
      note: "per-opening head fit (Rule 1: error recorded, misses named — the sampled head " +
        "stays on a miss) and the carve/fill applied. jamb/head cells are labels for the " +
        "dressing pass.",
    },
    planeFits: {
      detail: r1.planeFits,
      note: "stair-run / slab-step construction-legality evidence on the record's roof planes " +
        "(GLB fit preferred; a voxelFit substitution is itself a named finding). Applied by " +
        "S-104 (roof-as-program), recorded here as the fit-from-component seam's witness.",
    },
    census: {
      spikes: { before: census.before.spikes, after: census.after.spikes },
      note: "protrusion census is contextual evidence — the heads' edit domain is small; the " +
        "cage gates (IoU/closure/protect) are the decision layer.",
    },
    cage: { accepted: r1.result.accepted, rejected: r1.result.rejected, iou: r1.result.iou,
      protect: { chimney: { ridgeY: r1.stack.ridgeY, columns: r1.stack.columns.size } },
      regions: r1.regions.length,
      note: "the opening-heads step judged by all three T-102 gates; a rejection rolls back " +
        "and FAILS this runner loudly (the step exists to be applied)." },
    trace: r1.result.trace,
    reproducible: { doubleRun: true, sha256: artSha,
      determinism: "no LLM, no GL on the decision path; two in-process executions byte-matched." },
    placements: { input: r1.raw.placements.length, final: r1.artifact.placements.length },
    renders, frames,
  };
  await writeFile(recPath, JSON.stringify(record, null, 2) + "\n");
  await writeFile(join(OUT_DIR, `${def.key}.md`), renderMd(record));
  console.error(`\n✓ wrote ${recPath} + ${artPath} (sha256 ${artSha.slice(0, 12)}…)`);
}

function renderMd(r) {
  const k = r.openings.summary;
  const iouRow = (o) => Object.entries(o).map(([a, v]) => `${a} ${v}`).join(" · ");
  const heads = r.openings.detail.filter((o) => o.kind !== "none" || o.findings.length).map((o) =>
    `- **${o.groupId}[${o.openingIndex}] @ ${o.dir}** ${o.kind}${o.noop ? " (noop)" : ""}` +
    (o.fitError ? ` rmse ${o.fitError.rmse ?? o.fitError.radialRmse}` : "") +
    (o.spec?.radius ? `, r=${o.spec.radius}, center=[${o.spec.center}]` : "") +
    (o.kind === "flat" && o.spec ? `, level=${o.spec.level}` : "") +
    `; carved ${o.carved}, filled ${o.filled}` +
    (o.findings.length ? `; findings: ${o.findings.map((f) => f.code).join(", ")}` : "")).join("\n");
  const planes = r.planeFits.detail.map((p) =>
    `- **${p.plane}**: stair ${p.stairRun.spec ? `LEGAL (${p.stairRun.spec.ascent}, Δ${p.stairRun.fitError.pitchDelta}, ${p.stairRun.source})` : `no (${p.stairRun.findings.map((f) => f.code).join(",") || "out of band"})`}; ` +
    `slab ${p.slabStep.spec ? `LEGAL (Δ${p.slabStep.fitError.pitchDelta})` : "no"}`).join("\n");
  return `# Shaped vocabulary — ${r.subject} (T-105-01)\n\n` +
    `Opening heads fitted from the component record (Rule 1: errors recorded, misses named) and ` +
    `rebuilt under the T-102 cage, behind \`npm run shaped:${r.subject}\`. **Reproducible**: ` +
    `double-run byte-identical, artifact sha256 \`${r.reproducible.sha256.slice(0, 12)}…\`.\n\n` +
    `## Heads — ${k.arch} arch · ${k.flat} flat · ${k.noop} noop · ${k.none} named-miss\n\n${heads || "- none"}\n\n` +
    `## Roof-plane construction legality (S-104's input)\n\n${planes || "- no roof planes"}\n\n` +
    `## Cage\n\n- accepted ${r.cage.accepted}, rejected ${r.cage.rejected}\n` +
    `- IoU baseline: ${iouRow(r.cage.iou.baseline)}\n- IoU final: ${iouRow(r.cage.iou.final)}\n` +
    `- protect: chimney ridgeY=${r.cage.protect.chimney.ridgeY} (${r.cage.protect.chimney.columns} cols); ${r.cage.regions} opening regions in the closure allow-list\n\n` +
    `## Renders\n\n${r.renders.map((x) => `- ${x.when} ${x.angle}: ${x.path ?? `unavailable (${x.error})`}${x.unmapped !== undefined ? ` (unmapped ${x.unmapped})` : ""}`).join("\n")}\n` +
    `${r.frames.length ? `\nFrames: ${r.frames.join(" · ")}\n` : ""}`;
}

main().catch((e) => { console.error(e.stack ?? String(e)); process.exitCode = 1; });
