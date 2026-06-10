// IMPURE RUNNER — E-27 regularization-cage evidence pass on the witnessed shells (S-102 /
// T-102-01). The voxelized TRELLIS mesh arrives ragged and nothing downstream fixes it: measured
// on the committed cottage shell, 276 cells with ≥4/6 faces exposed (attached spikes/fins — the
// fake "rafters" in every render) and 23.9% of columns with a ≥3-block cliff. This runner takes
// each committed shell-integrity output through the PURE regularization cage
// (src/view/shell-regularize.mjs): morphological open (26-cube, minKeep restore) → close (plug-
// remediated), every step accepted only if per-azimuth silhouette IoU vs the GLB holds at all 4
// gate azimuths, closure does not regress, and the declared protect regions (chimney stack +
// openings) are untouched — rejected steps roll back and are RECORDED.
//
// THE SEAM INVARIANT: this file is impure wiring only (file I/O, GLB load, best-effort GL renders,
// the durable record). The ticket's baseline numbers are HARD-ASSERTED — drift in the committed
// inputs fails loudly. DETERMINISM (E-24 Rule 2): the core runs twice; the two final artifacts
// must be byte-identical (recorded sha256, re-checked by --offline). Declared targets (AC #4):
// spikes reduced ≥50%, ragged columns reduced ≥10% relative, zero cage regressions — asserted.
//
// GL — run on demand, NOT in `npm test`:
//   npm run regularize:cottage                 # cage + census + renders + record
//   npm run regularize:gatehouse
//   npm run regularize:church
//   npm run regularize:cottage -- --offline    # re-assert the committed record + artifact hash, no GL
//
// Writes regularize/<subj>.{json,md} (committed) + regularize/<subj>/artifact.json (the
// regularized shell) + PNGs (gitignored) + pr/assets/frames/regularize-<subj>-{before,after}.png
// (committed evidence frames, oblique 225° — the durable-skin witness angle).

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { openingRegions, inRegion, rebuildArtifact } from "../../src/view/shell-integrity.mjs";
import {
  REGULARIZE_DEFAULTS, regularizeShell, protrudingStackRegion,
} from "../../src/view/shell-regularize.mjs";
import { loadMeshFromGlb, rasterizeSilhouette } from "../../src/form/glb-silhouette.mjs";
import { resolveAngle } from "../../src/view/multi-angle.mjs";
import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { assertArtifact } from "../../src/artifact.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const OUT_DIR = join(HERE, "regularize");
const FRAMES_DIR = join(ROOT, "pr/assets/frames");

const OBLIQUE = "-x-z"; // azimuth 225° — the durable-skin witness angle (before/after parity)

// Declared targets (AC #4 — implementer-declared, shared across subjects, asserted below).
const TARGETS = { spikesReduction: 0.5, raggedRelativeReduction: 0.1 };

// The witnessed committed shells + their GLBs (input PATHS, not behavior constants). `expect`
// pins the ticket's measured baselines — drift in the committed inputs fails loudly.
const SUBJECTS = {
  cottage: {
    key: "cottage",
    shell: "styled/cottage/shell-artifact.json",
    glb: "glb/cottage.glb",
    expect: { spikes: 276, ragged: 157, columns: 656 },
  },
  gatehouse: {
    key: "gatehouse",
    shell: "styled/gatehouse/shell-artifact.json",
    glb: "glb/stone-gatehouse.glb",
    expect: { spikes: 132, ragged: 191, columns: 679 },
  },
  church: {
    key: "church",
    shell: "challenge/church/shell-artifact.json",
    glb: "glb/church.glb",
    expect: { spikes: 602, ragged: 334, columns: 1376 },
  },
};

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const artifactJson = (a) => JSON.stringify(a, null, 2) + "\n";
const pct = (x) => `${(x * 100).toFixed(1)}%`;

/** Best-effort GL render at a named angle (a lens, never logic). */
async function tryRender(artifact, angle, label, subjDir) {
  try {
    const { renderViews } = await import("../../src/view/multi-angle.mjs");
    const [r] = await renderViews(artifact, [angle], { outDir: subjDir, label: () => label });
    return { angle, path: r.path.replace(ROOT, "") };
  } catch (e) {
    return { angle, error: e.message };
  }
}

// =================================================================================================
// THE DETERMINISTIC CORE — reads committed inputs, writes nothing, no GL. Run twice per live pass.
// =================================================================================================
async function runRegularize(def) {
  const raw = JSON.parse(await readFile(join(HERE, def.shell), "utf8"));
  assertArtifact(raw);
  const occ = artifactOccupancy(raw);

  // protect regions, DERIVED (no subject constants): the chimney stack above the highest roof
  // plane + the build's own declared openings (a close must not seal a window slit).
  const regions = openingRegions(occ);
  const stack = protrudingStackRegion(occ);
  const protect = [
    { name: "chimney", contains: stack.contains },
    ...regions.map((r, i) => ({ name: `${r.kind}@${r.dir}#${i}`, contains: (pos) => inRegion(pos, [r]) })),
  ];

  // the GLB reference silhouettes at the 4 gate azimuths — the cage's 3-D target (E-15 lesson)
  const mesh = loadMeshFromGlb(await readFile(join(HERE, def.glb)));
  const refSils = {};
  for (const a of MULTI_ANGLE_GATE.azimuths) refSils[a] = rasterizeSilhouette(mesh, { view: resolveAngle(a) });

  const result = regularizeShell(occ, { refSils, regions, protect });
  const artifact = rebuildArtifact(result.occ, raw);
  assertArtifact(artifact);
  return { raw, occ, artifact, result, stack, regions };
}

/** AC gates on a finished core run: baseline pins, declared targets, zero cage regressions. */
function assertAcceptance(def, r) {
  const { before, after } = r.result.census;
  for (const [k, want] of Object.entries(def.expect)) {
    const got = k === "spikes" ? before.spikes : k === "ragged" ? before.ragged : before.columns;
    if (got !== want) {
      throw new Error(`${def.key} baseline drift: expected ${k}=${want}, measured ${got} ` +
        `(the ticket numbers are pinned — the committed input changed?)`);
    }
  }
  // zero cage regressions: every ACCEPTED step passed all three checks (reasons empty by
  // construction) and every rejected step is recorded — assert the trace is self-consistent.
  for (const s of r.result.trace) {
    if (s.accepted && s.reasons.length) throw new Error(`${def.key} cage VIOLATION: accepted step "${s.step}" carries reasons ${s.reasons}`);
    if (!s.accepted && !s.reasons.length) throw new Error(`${def.key} cage VIOLATION: rejected step "${s.step}" has no recorded reason`);
  }
  const spikeRed = 1 - after.spikes / before.spikes;
  const raggedRed = 1 - after.raggedRate / before.raggedRate;
  const misses = [];
  if (spikeRed < TARGETS.spikesReduction) misses.push(`spikes reduced ${pct(spikeRed)} < target ${pct(TARGETS.spikesReduction)}`);
  if (raggedRed < TARGETS.raggedRelativeReduction) misses.push(`ragged reduced ${pct(raggedRed)} < target ${pct(TARGETS.raggedRelativeReduction)}`);
  return { spikeRed, raggedRed, misses };
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
    if (!existsSync(recPath) || !existsSync(artPath)) throw new Error(`committed record/artifact absent — run npm run regularize:${def.key} first`);
    const rec = JSON.parse(await readFile(recPath, "utf8"));
    const artBytes = await readFile(artPath, "utf8");
    assertArtifact(JSON.parse(artBytes));
    const checks = {
      sha: sha256(artBytes) === rec.reproducible?.sha256,
      regressions: (rec.trace ?? []).every((s) => s.accepted ? !s.reasons.length : s.reasons.length > 0),
      baseline: rec.census?.before?.spikes === def.expect.spikes && rec.census?.before?.ragged === def.expect.ragged,
    };
    const ok = Object.values(checks).every(Boolean);
    console.error(`[offline] ${def.key}: artifact sha ${checks.sha ? "MATCHES" : "DIVERGES"}; ` +
      `cage trace ${checks.regressions ? "consistent" : "VIOLATED"}; baseline pins ${checks.baseline ? "OK" : "VIOLATED"}; AJV ok`);
    if (!ok) process.exitCode = 1;
    return;
  }

  await mkdir(subjDir, { recursive: true });
  await mkdir(FRAMES_DIR, { recursive: true });

  // THE REPRODUCIBILITY PROOF (E-24 Rule 2): the deterministic core, twice; byte-equal or no record.
  const r1 = await runRegularize(def);
  const r2 = await runRegularize(def);
  const j1 = artifactJson(r1.artifact);
  if (j1 !== artifactJson(r2.artifact)) throw new Error("NON-DETERMINISTIC: two in-process runs produced different artifacts");
  const { spikeRed, raggedRed, misses } = assertAcceptance(def, r1);
  const { before, after } = r1.result.census;

  console.error(`[${def.key}] reproducible: double-run artifacts identical (${r1.artifact.placements.length} placements)`);
  console.error(`[${def.key}] protect: chimney ridgeY=${r1.stack.ridgeY} (${r1.stack.columns.size} cols), ${r1.regions.length} openings`);
  for (const s of r1.result.trace) {
    console.error(`[${def.key}] step ${s.step}: ${s.accepted ? "ACCEPTED" : `REJECTED — ${s.reasons.join("; ")}`} ` +
      `(removed ${s.cells.removed ?? 0}, added ${s.cells.added ?? 0}, plugged ${s.cells.plugged ?? 0}, ` +
      `restored ${(s.cells.restoredComponents ?? []).map((c) => c.size).join("+") || "none"})`);
  }
  console.error(`[${def.key}] spikes ${before.spikes} → ${after.spikes} (−${pct(spikeRed)}; target ≥${pct(TARGETS.spikesReduction)}); ` +
    `ragged ${pct(before.raggedRate)} → ${pct(after.raggedRate)} (−${pct(raggedRed)} rel; target ≥${pct(TARGETS.raggedRelativeReduction)})`);
  console.error(`[${def.key}] iou baseline ${JSON.stringify(r1.result.iou.baseline)} → final ${JSON.stringify(r1.result.iou.final)}`);
  if (misses.length) {
    // honest gaps (E-25 Rule 6): a missed declared target fails the run loudly — never quietly recorded
    throw new Error(`${def.key} DECLARED TARGET MISSED: ${misses.join("; ")}`);
  }

  await writeFile(artPath, j1);
  const artSha = sha256(j1);

  // --- before/after renders (best-effort lens) + committed frames -----------------------------------
  const renders = [];
  renders.push({ when: "before", ...(await tryRender(r1.raw, OBLIQUE, "oblique225-before", subjDir)) });
  renders.push({ when: "after", ...(await tryRender(r1.artifact, OBLIQUE, "oblique225-after", subjDir)) });
  for (const r of renders) console.error(`render ${r.when} ${r.angle}: ${r.path ?? `unavailable (${r.error})`}`);
  const frames = [];
  try {
    const [b, a] = renders;
    if (b?.path && a?.path) {
      await copyFile(join(ROOT, b.path), join(FRAMES_DIR, `regularize-${def.key}-before.png`));
      await copyFile(join(ROOT, a.path), join(FRAMES_DIR, `regularize-${def.key}-after.png`));
      frames.push(`pr/assets/frames/regularize-${def.key}-before.png`, `pr/assets/frames/regularize-${def.key}-after.png`);
    }
  } catch (e) {
    console.error(`frames: ${e.message}`);
  }

  // --- the durable record -----------------------------------------------------------------------------
  const record = {
    schema: "shell-regularize/v1",
    subject: def.key,
    inputs: { shell: def.shell, glb: def.glb },
    expect: def.expect,
    params: { ...REGULARIZE_DEFAULTS, azimuths: MULTI_ANGLE_GATE.azimuths,
      note: "op parameters (declared, shared across subjects — no tuning); azimuths config-frozen (MULTI_ANGLE_GATE)" },
    targets: { ...TARGETS, note: "implementer-declared (AC #4); the run THROWS on a miss — honest gaps, not quiet records" },
    protect: { chimney: { ridgeY: r1.stack.ridgeY, columns: r1.stack.columns.size }, openings: r1.regions.length,
      note: "derived from geometry: the protruding stack above the highest roof plane (lifted " +
        "protrudingStackRegion) + the build's own declared openings. The cage verifies both " +
        "untouched independently of the ops honoring them." },
    census: { before, after,
      reduction: { spikes: Number(spikeRed.toFixed(4)), raggedRelative: Number(raggedRed.toFixed(4)) } },
    iou: r1.result.iou,
    trace: r1.result.trace,
    cage: {
      accepted: r1.result.accepted, rejected: r1.result.rejected,
      note: "every step gated on (a) per-azimuth silhouette IoU vs the GLB ≥ input − tolerance, " +
        "(b) closure no-regress (strict 'closed' when the input is closed; plug remediation " +
        "recorded), (c) protected regions byte-identical. Rejected steps rolled back and recorded.",
    },
    reproducible: { doubleRun: true, sha256: artSha,
      determinism: "no LLM, no GL on the decision path — silhouettes via the pure rasterizer; " +
        "two in-process executions byte-matched." },
    placements: { input: r1.raw.placements.length, final: r1.artifact.placements.length },
    renders, frames,
  };
  await writeFile(recPath, JSON.stringify(record, null, 2) + "\n");
  await writeFile(join(OUT_DIR, `${def.key}.md`), renderMd(record));
  console.error(`\n✓ wrote ${recPath} + ${artPath} (sha256 ${artSha.slice(0, 12)}…)`);
}

function renderMd(r) {
  const iouRow = (o) => Object.entries(o).map(([a, v]) => `${a} ${v}`).join(" · ");
  const steps = r.trace.map((s) =>
    `- **${s.step}** ${s.accepted ? "ACCEPTED" : `REJECTED — ${s.reasons.join("; ")}`}: ` +
    `removed ${s.cells.removed ?? 0}, added ${s.cells.added ?? 0}, plugged ${s.cells.plugged ?? 0}, ` +
    `restored [${(s.cells.restoredComponents ?? []).map((c) => c.size).join(", ") || "—"}]; ` +
    `spikes→${s.census.spikes}, ragged→${pct(s.census.raggedRate)}`).join("\n");
  return `# Shell regularization — ${r.subject} (T-102-01)\n\n` +
    `Morphological open/close on the committed shell, every step caged against the GLB ` +
    `(silhouette IoU at the 4 gate azimuths · closure no-regress · protected regions), behind ` +
    `\`npm run regularize:${r.subject}\`. **Reproducible**: double-run byte-identical, artifact ` +
    `sha256 \`${r.reproducible.sha256.slice(0, 16)}…\`.\n\n` +
    `## Census (declared targets: spikes −${pct(r.targets.spikesReduction)}, ragged −${pct(r.targets.raggedRelativeReduction)} rel)\n` +
    `| metric | before | after | reduction |\n|---|---|---|---|\n` +
    `| protrusions (≥4/6 faces) | ${r.census.before.spikes} | ${r.census.after.spikes} | ${pct(r.census.reduction.spikes)} |\n` +
    `| ragged columns (≥3 cliff) | ${r.census.before.ragged}/${r.census.before.columns} (${pct(r.census.before.raggedRate)}) | ` +
    `${r.census.after.ragged}/${r.census.after.columns} (${pct(r.census.after.raggedRate)}) | ${pct(r.census.reduction.raggedRelative)} rel |\n\n` +
    `## The cage (${r.cage.accepted} accepted / ${r.cage.rejected} rejected)\n${steps}\n\n` +
    `IoU vs GLB — baseline: ${iouRow(r.iou.baseline)}; final: ${iouRow(r.iou.final)} ` +
    `(tolerance ${r.params.iouTolerance}, anchored to the input shell).\n\n` +
    `Protect: chimney stack ridgeY=${r.protect.chimney.ridgeY} (${r.protect.chimney.columns} cols) + ` +
    `${r.protect.openings} declared openings — verified untouched.\n\n` +
    `## Renders\n` + r.renders.map((f) => `- ${f.when} ${f.angle}: ${f.path ?? `GL unavailable (${f.error})`}`).join("\n") +
    `\n\nFrames: ${r.frames.join(", ") || "(none — GL unavailable)"}\n\n> ${r.cage.note}\n\n> ${r.protect.note}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
