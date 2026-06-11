// IMPURE RUNNER — the E-25 TERMINAL MILESTONE (S-095 / T-095-01). One named command per subject
// takes the committed concept inputs to a gated build END-TO-END, in the epic's chain order:
//
//   [provision (challenge subjects only, data-gated: GLB + committed material map + working scale
//   → feature-assigned base — the same pure cores that built the cottage/gatehouse bases in T-074)]
//   → SHELL INTEGRITY (T-091: componentStrip → rebuild → fillVoids → plugClosure; closure THROWS)
//   → REGULARIZATION CAGE (T-102: morphological open/close on the closed shell, every step gated
//     on GLB silhouette IoU at the 4 azimuths + closure + protect; rejected steps recorded)
//   → THE E-24 SKIN via the exported buildSkin (value-true T-086 → kit overrides T-096 → seal →
//     CONCEPT-DERIVED ZONE MAP T-092 → full-shell exposure zone-fill T-090 → secondaries splat →
//     coherence T-087 → coverage/band/plaster terminal gates T-088, all THROWS)
//   → THE MULTI-ANGLE SAME-OBJECT GATE (T-093), spawned through its own CLI so its frozen contract
//     (4 config azimuths, contract lens, judge, contact sheet, exit codes) is reused, never re-implemented.
//
// DETERMINISM (E-24 Rule 2 / E-25 Rule 5): the provision→shell→skin stretch is a pure function of
// the committed inputs; it runs TWICE per live invocation and every produced artifact (base, shell,
// final) must be byte-identical, sha256s recorded. LLM-authored INPUTS (material maps, kits) are
// one-time committed records consumed read-only; the judge is the pinned model, single sample per
// view, verdicts committed in the gate record (variance at the gap budget is a named property of
// the instrument, not smoothed). GL renders are evidence, never inputs to a decision.
//
// HONEST FAILURE (E-25 Rule 6): a deterministic-stage THROW (unclosed shell, coverage/band gate)
// writes challenge/<subj>.json with {status: "pipeline-failed", stage, error} — no artifact, no
// sheet, no pass — and exits 1. Nothing is weakened; the record names the gap. A completed chain
// exits with the gate's own code: 0 PASS · 1 FAIL · 2 REFUSAL.
//
// GENERALIZATION (E-25 Rule 3): this file contains no subject keys, constants, branches, or
// thresholds. Subjects come from the durable-skin registry; the provision stage is gated by a
// registry `provision` field, the E-23/E-24 before-state by the EXTRAS table below (registry data).
//
// GL + METERED (gate judge) — run on demand, NOT in `npm test`:
//   npm run challenge:cottage                 # the full chain + renders + frames + the gate
//   npm run challenge:gatehouse
//   npm run challenge:church                  # the untuned challenge subject (provisions its base)
//   npm run challenge:cottage -- --repro      # re-run the deterministic chain, compare sha256s (no GL/judge)
//   npm run challenge:cottage -- --offline    # re-assert the committed record + artifacts (no recompute)
//
// Writes challenge/<subj>.{json,md} (committed) + challenge/<subj>/{base-,shell-,}artifact.json
// (committed) + PNGs (gitignored) + pr/assets/frames/challenge-<subj>-{before,after}.png; the gate
// writes multi-angle/<subj>-challenge.{json,md} + pr/assets/frames/multi-angle-<subj>-challenge.png.

import { readFile, writeFile, mkdir, copyFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { structuralZones } from "../../src/view/structural-read.mjs";
import { surfaceZoneHistogram } from "../../src/view/zone-fill.mjs";
import {
  componentStrip, rebuildArtifact, openingRegions, inRegion, fillVoids, plugClosure, closureCheck,
} from "../../src/view/shell-integrity.mjs";
import { regularizeShell, protrudingStackRegion } from "../../src/view/shell-regularize.mjs";
import { loadMeshFromGlb, rasterizeSilhouette } from "../../src/form/glb-silhouette.mjs";
import { resolveAngle } from "../../src/view/multi-angle.mjs";
import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { applyDeltas } from "../../src/view/surface-coherence.mjs";
import { voxelizeGlb } from "../../src/form/glb-voxelize.mjs";
import { parseGlbColoredSurface } from "../../src/form/glb-mesh.mjs";
import { sampleSurfaceColors, keysToArtifact } from "../../src/form/glb-voxel-build.mjs";
import { classifyFeatures, assignFeatureBlocks, fallbackPalette } from "../../src/form/feature-classify.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { MULTI_ANGLE_GATE_SCHEMA } from "../../src/form/multi-angle-gate.mjs";
import { ROTATE_FLAG, guardedWriteRecord } from "../../src/form/pin-guard.mjs";
import { occupancyDelta, composeReconstruction } from "../../src/view/reconstruct-compose.mjs";
import { buildComponentPlan, serializeComponentPlan } from "../../src/view/component-plan.mjs";
import { buildSkin, SUBJECTS } from "./durable-skin.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const OUT_DIR = join(HERE, "challenge");

// T-119-01: committed-record overwrites are explicit (pin-guard); byte-identical rewrites pass.
const ROTATE = process.argv.includes(ROTATE_FLAG);
const writeRec = (abs, content) => guardedWriteRecord({ root: ROOT, rel: abs.replace(ROOT, ""), content, rotate: ROTATE });

const FRAMES_DIR = join(ROOT, "pr/assets/frames");

const MIN_DEPTH = 3;      // T-091 relief floor (op parameter, not a subject constant)
const MAX_PLUG_ITER = 8;  // T-091 plug convergence cap
const OBLIQUE = "-x-z";   // azimuth 225° — the durable-skin witness angle (before/after parity)
const GATE_LABEL = "challenge";
const RECORD_SCHEMA = "challenge-milestone/v1";

// Challenge-only registry data for the EXISTING subjects: the witnessed E-23/E-24 state (the
// grey-roofed / pink-patched artifacts) rendered as the AC's before-frame. A subject without a
// row simply has no before-state (the challenge subject's first run IS its first state).
const EXTRAS = {
  cottage: { e23Before: "spray-paint/cottage/artifact.json" },
  gatehouse: { e23Before: "building/best/artifact.json" },
};

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const artifactJson = (a) => JSON.stringify(a, null, 2) + "\n";

/** Decode a GLB baseColor image to RGBA (WebP via dwebp) — the established runner-local idiom. */
let tmpSeq = 0;
async function decodeTexture({ data, mimeType }) {
  if (mimeType === "image/png" || mimeType === "image/jpeg") {
    const p = join(tmpdir(), `ch-tex-${process.pid}-${tmpSeq++}.${mimeType === "image/png" ? "png" : "jpg"}`);
    await writeFile(p, Buffer.from(data));
    try { return await decodeImage(p); } finally { await rm(p, { force: true }); }
  }
  const inP = join(tmpdir(), `ch-tex-${process.pid}-${tmpSeq}.webp`);
  const outP = join(tmpdir(), `ch-tex-${process.pid}-${tmpSeq++}.png`);
  await writeFile(inP, Buffer.from(data));
  await new Promise((res, rej) => {
    const c = spawn("dwebp", [inP, "-o", outP], { stdio: "ignore" });
    c.on("error", rej);
    c.on("close", (code) => (code === 0 ? res() : rej(new Error(`dwebp exited ${code}`))));
  });
  try { return await decodeImage(outP); } finally { await rm(inP, { force: true }); await rm(outP, { force: true }); }
}

/** Best-effort GL render at a named angle (a lens, never logic). */
async function tryRenderAngle(artifact, angle, label, subjDir) {
  try {
    const { renderViews } = await import("../../src/view/multi-angle.mjs");
    const [r] = await renderViews(artifact, [angle], { outDir: subjDir, label: () => label });
    return { angle, path: r.path.replace(ROOT, "") };
  } catch (e) {
    return { angle, error: e.message };
  }
}

/** Census dominants per structural zone on the exposure shell (shell-integrity runner's instrument). */
function censusZones(occ, zoneOf) {
  const hist = surfaceZoneHistogram(occ, zoneOf, { skin: "exposure" });
  const zones = {};
  for (const [zone, h] of Object.entries(hist)) {
    let dom = null, best = -1;
    for (const [b, n] of Object.entries(h.byBlock)) if (n > best) { best = n; dom = b; }
    if (dom) zones[zone] = { dominant: dom };
  }
  return zones;
}

/** PROVISION (data-gated): GLB + committed material map + working scale → feature-assigned base —
 *  the same pure cores T-074 used for the cottage/gatehouse bases. Deterministic given the inputs. */
async function provisionBase(def) {
  const mapJson = JSON.parse(await readFile(join(HERE, def.map), "utf8"));
  if (!mapJson?.map?.length) throw new Error(`provision: ${def.map} has no map rows (commit the material map first)`);
  const glbPath = join(HERE, def.glb);
  if (!existsSync(glbPath)) throw new Error(`provision: ${def.glb} absent (gitignored binary — mint it per glb/README.md)`);
  const glbBytes = await readFile(glbPath);
  const surface = parseGlbColoredSurface(glbBytes);
  if (!surface.baseColor) throw new Error(`provision: ${def.glb} has no baseColor texture`);
  const texture = await decodeTexture(surface.baseColor);
  const occ = voxelizeGlb(glbBytes, { scale: def.provision.scale });
  const colors = sampleSurfaceColors({ occupancy: occ, surface, texture });
  const features = classifyFeatures(occ);
  const keys = assignFeatureBlocks(occ, features, mapJson.map, { colors, palette: fallbackPalette(mapJson.map) });
  const artifact = keysToArtifact(occ, keys, {
    metadata: { trial_id: `${def.key}-concept-grounded` },
    style: {
      name: "concept-grounded",
      rationale: "E-21 LLM material map placed by geometric feature (the T-074 base-build path), " +
        "provisioned untuned for the E-25 challenge chain.",
    },
  });
  assertArtifact(artifact);
  return { artifact, stats: { scale: def.provision.scale, cells: artifact.placements.length, manifest: artifact.palette.manifest.length } };
}

/** SHELL INTEGRITY (T-091 cores) on the in-memory base. No `expect` pins — the chain's inputs are
 *  not the witnessed-defect artifacts the shell-integrity runner pins. closureCheck is a THROW gate.
 *  Then the T-102 REGULARIZATION CAGE on the closed shell: morphological open/close, every step
 *  gated on per-azimuth silhouette IoU vs the GLB `refSils`, closure no-regress (strict here — the
 *  input is closed by construction), and derived protect regions (chimney stack + openings);
 *  rejected steps roll back and are recorded in the report. */
export function shellStage(baseArtifact, refSils) {
  const occ0 = artifactOccupancy(baseArtifact);
  const strip = componentStrip(occ0);
  const stripped = rebuildArtifact(strip.occ, baseArtifact);
  assertArtifact(stripped);
  const occS = artifactOccupancy(stripped);
  const { zoneOf } = structuralZones(occS);
  const zones = censusZones(occS, zoneOf);
  const regions = openingRegions(occS);
  const closureBefore = closureCheck(occS, { regions });
  const voids = fillVoids(occS, { zoneOf, zones, minDepth: MIN_DEPTH, regions });
  const repaired = applyDeltas(stripped, voids.placements);
  const plug = plugClosure(artifactOccupancy(repaired), { zoneOf, zones, regions, maxIterations: MAX_PLUG_ITER });
  const closed = applyDeltas(repaired, plug.placements);
  assertArtifact(closed);
  if (!plug.check.closed) throw new Error("closure gate FAILED after plugClosure — impossible by contract");

  // T-102 regularize: deletion has no artifact op, so the stage REBUILDS (componentStrip precedent)
  const occC = artifactOccupancy(closed);
  const stack = protrudingStackRegion(occC);
  const protect = [
    { name: "chimney", contains: stack.contains },
    ...regions.map((r, i) => ({ name: `${r.kind}@${r.dir}#${i}`, contains: (pos) => inRegion(pos, [r]) })),
  ];
  const reg = regularizeShell(occC, { refSils, regions, protect });
  const final = rebuildArtifact(reg.occ, closed);
  assertArtifact(final);

  return {
    artifact: final,
    strip: { components: strip.components, kept: strip.kept.length, strippedCells: strip.strippedCells },
    openings: regions.map((r) => r.kind),
    closureBefore: { reached: closureBefore.reached, interiorCells: closureBefore.interiorCells, byDirection: closureBefore.byDirection },
    voids: { minDepth: MIN_DEPTH, filled: voids.filled, byDir: voids.byDir },
    plug: { cells: plug.placements.length, iterations: plug.iterations },
    regularize: {
      accepted: reg.accepted, rejected: reg.rejected,
      census: reg.census, iou: reg.iou,
      steps: reg.trace.map((s) => ({ step: s.step, accepted: s.accepted, reasons: s.reasons,
        cells: s.cells, spikes: s.census.spikes, raggedRate: s.census.raggedRate })),
    },
  };
}

// =================================================================================================
// THE DETERMINISTIC CHAIN — provision? → shell → reconstruct? → skin. Writes ONLY the intermediate
// artifacts (buildSkin reads its input from disk — a deliberate, inspectable file seam); run twice
// per live pass, all produced artifacts byte-compared.
// =================================================================================================

/**
 * T-106-01 RECONSTRUCT STAGE: load the committed component layer (T-103 record, T-104 roof program,
 * T-105 shaped heads), verify every record's pin against the IN-CHAIN regularized shell (mismatch
 * THROWS — a record cut from a different shell is input drift, never a graceful degrade), compose
 * the two reconstruction deltas (disjointness asserted), and assemble the consumption plan. A
 * subject with NO records returns null and the chain is byte-for-byte today's (the AC's recorded
 * fallback lives in the plan's findings when only some records exist).
 */
async function loadReconstruction(def, shellArtifact, shellSha) {
  const rel = { component: `components/${def.key}.json`, roof: `roof/${def.key}.json`, shaped: `shaped/${def.key}.json` };
  const art = { roof: `roof/${def.key}/artifact.json`, shaped: `shaped/${def.key}/artifact.json` };
  const readJson = async (p) => JSON.parse(await readFile(join(HERE, p), "utf8"));
  const componentRecord = existsSync(join(HERE, rel.component)) ? await readJson(rel.component) : null;
  const roofRecord = existsSync(join(HERE, rel.roof)) ? await readJson(rel.roof) : null;
  const shapedRecord = existsSync(join(HERE, rel.shaped)) ? await readJson(rel.shaped) : null;
  if (!componentRecord && !roofRecord && !shapedRecord) return null;

  const baseOcc = artifactOccupancy(shellArtifact);
  const deltas = [];
  let roofDelta = null, roofOcc = null;
  if (roofRecord?.status === "accepted" && roofRecord.swap?.accepted && existsSync(join(HERE, art.roof))) {
    const roofArtifact = await readJson(art.roof);
    assertArtifact(roofArtifact);
    roofOcc = artifactOccupancy(roofArtifact);
    roofDelta = occupancyDelta(baseOcc, roofOcc);
    deltas.push({ name: "roof-program", delta: roofDelta });
  }
  if (shapedRecord && existsSync(join(HERE, art.shaped))) {
    const shapedArtifact = await readJson(art.shaped);
    assertArtifact(shapedArtifact);
    deltas.push({ name: "shaped-heads", delta: occupancyDelta(baseOcc, artifactOccupancy(shapedArtifact)) });
  }
  const plan = buildComponentPlan({ componentRecord, roofRecord, shapedRecord, shellSha, roofDelta, roofOcc });
  const composed = deltas.length ? composeReconstruction(shellArtifact, deltas) : null;
  // the composed edit set rides with the plan: the kit-presence checker uses it to tell a
  // definition cell from junk when a treatment mount is blocked
  if (composed) plan.touchedCells = composed.touched;
  return {
    plan, composed,
    inputs: {
      componentRecord: componentRecord ? rel.component : null,
      roofRecord: roofRecord ? rel.roof : null,
      shapedRecord: shapedRecord ? rel.shaped : null,
      shellSha,
    },
  };
}

export async function runChain(def, paths) {
  let provision = null;
  let base;
  if (def.provision) {
    const p = await provisionBase(def);
    base = p.artifact;
    provision = p.stats;
    await writeRec(paths.baseAbs, artifactJson(base)); // provisioned subjects only — committed bases stay single-sourced
  } else {
    base = JSON.parse(await readFile(join(HERE, def.build), "utf8"));
    assertArtifact(base);
  }
  // the T-102 cage's 3-D target: GLB silhouettes at the 4 gate azimuths (pure rasterizer, no GL)
  const mesh = loadMeshFromGlb(await readFile(join(HERE, def.glb)));
  const refSils = {};
  for (const a of MULTI_ANGLE_GATE.azimuths) refSils[a] = rasterizeSilhouette(mesh, { view: resolveAngle(a) });
  const shell = shellStage(base, refSils);
  await writeRec(paths.shellAbs, artifactJson(shell.artifact));
  // T-106-01: where the component layer defines the shell's parts, the skin consumes the COMPOSED
  // reconstruction (roof program + shaped heads over the regularized shell) and the component plan;
  // record-less subjects pass through untouched.
  const reconstruction = await loadReconstruction(def, shell.artifact, sha256(artifactJson(shell.artifact)));
  let buildRel = paths.shellRel;
  if (reconstruction?.composed) {
    buildRel = paths.shellRel.replace("shell-artifact.json", "reconstructed-artifact.json");
    assertArtifact(reconstruction.composed.artifact);
    await writeRec(join(HERE, buildRel), artifactJson(reconstruction.composed.artifact));
  }
  // The D5 uniform transform: the skin consumes the SHELL-REPAIRED build; the committed zone-map
  // record was derived from the unrepaired build, so its agreement assert does not apply here —
  // the derived bands are recorded (and diffed against the committed record) instead.
  const skin = await buildSkin({ ...def, build: buildRel, zoneMapRecord: null, componentPlan: reconstruction?.plan ?? null });
  if (reconstruction) {
    // the skin ARBITRATES the wall-top pin (attempt-ladder; a rejected pin is named in its notes) —
    // the persisted plan carries the EFFECTIVE value so the grammar/settle and the kit-aware gate
    // re-run the SAME op. Written after the skin for exactly that reason.
    reconstruction.plan.wallTopEffective = skin.zones.upperTop;
    await writeRec(
      join(HERE, paths.shellRel.replace("shell-artifact.json", "component-plan.json")),
      JSON.stringify(serializeComponentPlan(reconstruction.plan), null, 2) + "\n");
  }
  return { provision, base, shell, reconstruction, skin };
}

/** Diff the chain's derived zone map against the committed zone-map record (audit, not a gate). */
async function zoneMapVsCommitted(def, zoneMap) {
  if (!def.zoneMapRecord || !existsSync(join(HERE, def.zoneMapRecord))) return null;
  const committed = JSON.parse(await readFile(join(HERE, def.zoneMapRecord), "utf8"));
  const canon = (v) => JSON.stringify(v ?? null);
  return {
    record: def.zoneMapRecord,
    bandsIdentical: canon(committed.derived?.bands) === canon(zoneMap.bands ?? null),
    roofIdentical: canon(committed.derived?.roof) === canon(zoneMap.roof ?? null),
    committedBands: committed.derived?.bands ?? null,
  };
}

/** Spawn the T-093 gate through its own CLI (frozen contract). Exit 0/1/2 is a VERDICT, not an error. */
function spawnGate(key, artifactRel, extraArgs = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      join(HERE, "multi-angle-gate.mjs"), "--subject", key, "--label", GATE_LABEL, "--artifact", artifactRel, ...extraArgs,
    ], { stdio: ["ignore", "inherit", "inherit"] });
    child.on("error", reject);
    child.on("close", (code) => resolve(code));
  });
}

// =================================================================================================
async function main() {
  const argv = process.argv.slice(2);
  const def = SUBJECTS[argv[argv.indexOf("--subject") + 1]];
  if (!def) throw new Error(`--subject must be one of: ${Object.keys(SUBJECTS).join(", ")}`);
  const offline = argv.includes("--offline");
  const repro = argv.includes("--repro");
  const subjDir = join(OUT_DIR, def.key);
  const recPath = join(OUT_DIR, `${def.key}.json`);
  const paths = {
    baseRel: `challenge/${def.key}/base-artifact.json`,
    shellRel: `challenge/${def.key}/shell-artifact.json`,
    finalRel: `challenge/${def.key}/artifact.json`,
  };
  paths.baseAbs = join(HERE, paths.baseRel);
  paths.shellAbs = join(HERE, paths.shellRel);
  paths.finalAbs = join(HERE, paths.finalRel);
  const gateRecPath = join(HERE, "multi-angle", `${def.key}-${GATE_LABEL}.json`);
  await mkdir(subjDir, { recursive: true });

  if (offline) {
    if (!existsSync(recPath)) throw new Error(`committed record absent — run npm run challenge:${def.key} first`);
    const rec = JSON.parse(await readFile(recPath, "utf8"));
    if (rec.status === "pipeline-failed") {
      console.error(`[offline] ${def.key}: recorded status pipeline-failed at stage "${rec.stage}" — ${rec.error}`);
      process.exitCode = 1;
      return;
    }
    const shaOf = async (p) => sha256(await readFile(p, "utf8"));
    const gateRec = existsSync(gateRecPath) ? JSON.parse(await readFile(gateRecPath, "utf8")) : null;
    for (const p of [paths.shellAbs, paths.finalAbs]) assertArtifact(JSON.parse(await readFile(p, "utf8")));
    const checks = {
      shell: (await shaOf(paths.shellAbs)) === rec.reproducible?.sha256?.shell,
      final: (await shaOf(paths.finalAbs)) === rec.reproducible?.sha256?.final,
      base: !rec.reproducible?.sha256?.base || (await shaOf(paths.baseAbs)) === rec.reproducible.sha256.base,
      skinGate: rec.skin?.gates?.final?.passed === true,
      closure: rec.shell?.plug != null,
      gate: gateRec?.schema === MULTI_ANGLE_GATE_SCHEMA && gateRec?.label === GATE_LABEL &&
        (gateRec?.aggregate?.decided === true) !== (typeof gateRec?.aggregate?.refusal === "string"),
      sheet: typeof rec.gate?.sheet === "string" && existsSync(join(ROOT, rec.gate.sheet)),
    };
    const ok = Object.values(checks).every(Boolean);
    console.error(`[offline] ${def.key}: artifact shas ${checks.base && checks.shell && checks.final ? "MATCH" : "DIVERGE"}; ` +
      `skin coverage gate ${checks.skinGate ? "passed" : "VIOLATED"}; shell record ${checks.closure ? "present" : "MISSING"}; ` +
      `gate record ${checks.gate ? "well-formed" : "MISSING/MALFORMED"}; sheet ${checks.sheet ? "present" : "MISSING"}; AJV ok — ` +
      `recorded gate outcome: ${rec.gate?.outcome ?? "?"}`);
    if (!ok) process.exitCode = 1;
    return;
  }

  if (repro) {
    // AC4's fresh-process proof: re-run the deterministic chain (no GL, no judge) and compare
    // against the committed shas. The judge is NOT re-run — its pin is the committed gate record.
    if (!existsSync(recPath)) throw new Error(`committed record absent — run npm run challenge:${def.key} first`);
    const rec = JSON.parse(await readFile(recPath, "utf8"));
    const r = await runChain(def, paths);
    const got = {
      base: def.provision ? sha256(artifactJson(r.base)) : null,
      shell: sha256(artifactJson(r.shell.artifact)),
      reconstructed: r.reconstruction?.composed ? sha256(artifactJson(r.reconstruction.composed.artifact)) : null,
      final: sha256(artifactJson(r.skin.final)),
    };
    const want = rec.reproducible?.sha256 ?? {};
    const same = (!got.base || got.base === want.base) && got.shell === want.shell && got.final === want.final &&
      (got.reconstructed == null || want.reconstructed == null || got.reconstructed === want.reconstructed);
    console.error(`[repro] ${def.key}: fresh-process chain ${same ? "REPRODUCES the committed artifacts" : "DIVERGES"} ` +
      `(shell ${got.shell.slice(0, 12)}… vs ${String(want.shell).slice(0, 12)}…, final ${got.final.slice(0, 12)}… vs ${String(want.final).slice(0, 12)}…)`);
    if (!same) process.exitCode = 1;
    return;
  }

  await mkdir(FRAMES_DIR, { recursive: true });

  // --- THE DETERMINISTIC CHAIN, TWICE (Rule 5: byte-equal or no record) ---------------------------
  let r1;
  try {
    r1 = await runChain(def, paths);
    const r2 = await runChain(def, paths);
    for (const [stage, a, b] of [
      ["base", r1.base, r2.base],
      ["shell", r1.shell.artifact, r2.shell.artifact],
      ["reconstructed", r1.reconstruction?.composed?.artifact ?? null, r2.reconstruction?.composed?.artifact ?? null],
      ["final", r1.skin.final, r2.skin.final],
    ]) {
      if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`NON-DETERMINISTIC: two in-process runs diverge at the ${stage} artifact`);
    }
  } catch (e) {
    // Rule 6: the failure IS the recorded result — no artifact, no sheet, no pass.
    const stage = existsSync(paths.shellAbs) ? "skin" : (!def.provision || existsSync(paths.baseAbs)) ? "shell" : "provision";
    const record = {
      schema: RECORD_SCHEMA, subject: def.key, status: "pipeline-failed", stage, error: e.message,
      inputs: { build: def.provision ? null : def.build, concept: def.concept, glb: def.glb, map: def.map },
      note: "a terminal gate or chain stage threw — recorded honestly (E-25 Rule 6); nothing was tuned in response",
    };
    await writeRec(recPath, JSON.stringify(record, null, 2) + "\n");
    await writeRec(join(OUT_DIR, `${def.key}.md`), renderMd(record));
    console.error(`[${def.key}] PIPELINE FAILED at ${stage}: ${e.message}`);
    console.error(`✓ wrote ${recPath} (status: pipeline-failed)`);
    process.exitCode = 1;
    return;
  }

  const finalJson = artifactJson(r1.skin.final);
  await writeRec(paths.finalAbs, finalJson);
  const shas = {
    base: def.provision ? sha256(artifactJson(r1.base)) : null,
    shell: sha256(artifactJson(r1.shell.artifact)),
    reconstructed: r1.reconstruction?.composed ? sha256(artifactJson(r1.reconstruction.composed.artifact)) : null,
    final: sha256(finalJson),
  };
  if (r1.reconstruction) {
    const rc = r1.reconstruction;
    console.error(`[${def.key}] reconstruct (T-106): ${rc.composed
      ? rc.composed.stats.perDelta.map((d) => `${d.name} ${d.changed}+${d.added}-${d.removed}`).join(", ") + ` (${rc.composed.stats.cells} cells)`
      : "records present, no composable artifacts"}; seams ${JSON.stringify(r1.skin.seamSources)}` +
      (rc.plan.findings.length ? `; findings: ${rc.plan.findings.map((f) => f.code).join(", ")}` : ""));
  }
  console.error(`[${def.key}] reproducible: double-run byte-identical (final ${r1.skin.final.placements.length} placements, sha ${shas.final.slice(0, 12)}…)`);
  if (r1.provision) console.error(`[${def.key}] provision: scale ${r1.provision.scale}, ${r1.provision.cells} cells, ${r1.provision.manifest} manifest blocks`);
  console.error(`[${def.key}] shell: ${r1.shell.strip.components} → ${r1.shell.strip.kept} components (${r1.shell.strip.strippedCells} cells stripped); ` +
    `voids ${r1.shell.voids.filled} filled; plug ${r1.shell.plug.cells} in ${r1.shell.plug.iterations} iter; closure CLOSED ` +
    `(before: ${r1.shell.closureBefore.reached}/${r1.shell.closureBefore.interiorCells} reachable)`);
  console.error(`[${def.key}] regularize (T-102): ${r1.shell.regularize.steps.map((s) =>
    `${s.step} ${s.accepted ? "ok" : `REJECTED(${s.reasons[0]})`}`).join(", ")} — spikes ` +
    `${r1.shell.regularize.census.before.spikes} → ${r1.shell.regularize.census.after.spikes}, ragged ` +
    `${(r1.shell.regularize.census.before.raggedRate * 100).toFixed(1)}% → ${(r1.shell.regularize.census.after.raggedRate * 100).toFixed(1)}%`);
  console.error(`[${def.key}] skin: zone map ${r1.skin.zoneMap.source}` +
    (r1.skin.zoneMap.bands ? ` — ${r1.skin.zoneMap.bands.map((b) => `${b.name} y${b.yRange[0]}..${b.yRange[1]} ${b.dominantBlock}`).join(", ")}; roof ${r1.skin.zoneMap.roof.dominantBlock}` : ` (${r1.skin.zoneMap.reason ?? ""})`) +
    `; fill ${r1.skin.fill.placements.length}; salt ${r1.skin.salt.stripped} stripped; coverage gate final PASS`);
  const zoneMapDiff = await zoneMapVsCommitted(def, r1.skin.zoneMap);
  if (zoneMapDiff) {
    console.error(`[${def.key}] derived bands vs committed ${zoneMapDiff.record}: ` +
      `${zoneMapDiff.bandsIdentical && zoneMapDiff.roofIdentical ? "IDENTICAL" : "DIVERGED (recorded — the committed record was derived from the unrepaired build)"}`);
  }

  // --- renders + the AC5 before/after frames (evidence, never logic) ------------------------------
  const renders = [];
  const extras = EXTRAS[def.key] ?? {};
  const rFinalObl = await tryRenderAngle(r1.skin.final, OBLIQUE, "final-oblique225", subjDir);
  renders.push({ when: "final", ...rFinalObl }, { when: "final", ...(await tryRenderAngle(r1.skin.final, "front", "final-front", subjDir)) },
    { when: "final", ...(await tryRenderAngle(r1.skin.final, "top", "final-top", subjDir)) });
  let beforeRender = null;
  if (extras.e23Before && existsSync(join(HERE, extras.e23Before))) {
    const beforeArt = JSON.parse(await readFile(join(HERE, extras.e23Before), "utf8"));
    beforeRender = await tryRenderAngle(beforeArt, OBLIQUE, "e23-before-oblique225", subjDir);
    renders.push({ when: "e23-before", ...beforeRender });
  }
  for (const r of renders) console.error(`render ${r.when} ${r.angle}: ${r.path ?? `unavailable (${r.error})`}`);
  const frames = [];
  try {
    if (beforeRender?.path) {
      await copyFile(join(ROOT, beforeRender.path), join(FRAMES_DIR, `challenge-${def.key}-before.png`));
      frames.push(`pr/assets/frames/challenge-${def.key}-before.png`);
    }
    if (rFinalObl.path) {
      await copyFile(join(ROOT, rFinalObl.path), join(FRAMES_DIR, `challenge-${def.key}-after.png`));
      frames.push(`pr/assets/frames/challenge-${def.key}-after.png`);
    }
  } catch (e) {
    console.error(`frames: ${e.message}`);
  }

  // --- THE GATE (T-093, its own CLI + record + sheet; exit code = the verdict) --------------------
  console.error(`\n[${def.key}] spawning the multi-angle gate (label "${GATE_LABEL}")…`);
  const gateCode = await spawnGate(def.key, paths.finalRel, ROTATE ? [ROTATE_FLAG] : []);
  const gateRec = existsSync(gateRecPath) ? JSON.parse(await readFile(gateRecPath, "utf8")) : null;
  const gate = gateRec ? {
    outcome: gateRec.aggregate?.decided ? (gateRec.aggregate.passed ? "PASS" : "FAIL") : `REFUSAL (${gateRec.aggregate?.refusal})`,
    gapCount: gateRec.aggregate?.gapCount ?? null,
    gapBudget: gateRec.aggregate?.gapBudget ?? null,
    failures: gateRec.aggregate?.failures ?? null,
    perView: (gateRec.views ?? []).map((v) => ({
      angle: v.angle, azimuthDeg: v.azimuthDeg,
      coverage: v.coverage ? v.coverage.passed : null,
      verdict: v.verdict?.verdict ?? (v.unparsed ? "unparsed" : v.reason === "coverage" ? "judge-not-called" : null),
      gaps: v.verdict?.gaps ?? [],
    })),
    record: `benchmarks/sculpture/multi-angle/${def.key}-${GATE_LABEL}.json`,
    sheet: gateRec.sheet,
  } : { outcome: "MISSING-RECORD", exitCode: gateCode };

  // --- the milestone record ------------------------------------------------------------------------
  const record = {
    schema: RECORD_SCHEMA,
    subject: def.key,
    status: "gated",
    inputs: {
      build: def.provision ? paths.baseRel : def.build, concept: def.concept, glb: def.glb, map: def.map,
      kitRecord: def.kitRecord ?? null,
      e23Before: extras.e23Before ?? null,
    },
    provision: r1.provision,
    shell: { strip: r1.shell.strip, openings: r1.shell.openings, closureBefore: r1.shell.closureBefore, voids: r1.shell.voids, plug: r1.shell.plug, regularize: r1.shell.regularize },
    reconstruction: r1.reconstruction ? {
      inputs: r1.reconstruction.inputs,
      composed: r1.reconstruction.composed ? r1.reconstruction.composed.stats : null,
      findings: r1.reconstruction.plan.findings,
      seamSources: r1.skin.seamSources,
      conformance: r1.skin.conformance ? {
        columns: r1.skin.conformance.columns, conforming: r1.skin.conformance.conforming,
        deviations: r1.skin.conformance.deviations.slice(0, 50),
      } : null,
    } : null,
    skin: {
      substitution: r1.skin.substitution, kit: r1.skin.kit,
      zoneMap: { source: r1.skin.zoneMap.source, bands: r1.skin.zoneMap.bands ?? null, roof: r1.skin.zoneMap.roof ?? null, reason: r1.skin.zoneMap.reason ?? null },
      zoneMapVsCommitted: zoneMapDiff,
      fill: { placements: r1.skin.fill.placements.length, kept: r1.skin.fill.kept, byZone: r1.skin.fill.byZone },
      splat: r1.skin.splat, course: { columnsRaised: r1.skin.course.columnsRaised, voxelsAdded: r1.skin.course.voxelsAdded },
      salt: { stripped: r1.skin.salt.stripped, kept: r1.skin.salt.kept },
      coverage: r1.skin.coverage.final, gates: r1.skin.gates, bands: r1.skin.bands, notes: r1.skin.notes,
    },
    reproducible: {
      doubleRun: true, sha256: shas,
      determinism: "provision→shell→skin is a pure function of the committed inputs (concept PNG, " +
        "material map, GLB, kit); two in-process executions byte-matched on every artifact; " +
        "--repro re-proves from a fresh process. LLM-authored inputs are one-time committed records; " +
        "the gate judge is the pinned model, single sample per view, verdicts committed in the gate record.",
    },
    gate,
    artifacts: paths.finalRel ? { base: def.provision ? paths.baseRel : null, shell: paths.shellRel, final: paths.finalRel } : null,
    renders, frames,
  };
  await writeRec(recPath, JSON.stringify(record, null, 2) + "\n");
  await writeRec(join(OUT_DIR, `${def.key}.md`), renderMd(record));
  console.error(`\n[${def.key}] milestone: chain COMPLETE, gate ${gate.outcome}`);
  console.error(`✓ wrote ${recPath} + ${paths.finalRel}`);
  process.exitCode = gateCode;
}

function renderMd(r) {
  if (r.status === "pipeline-failed") {
    return `# Challenge milestone — ${r.subject} (T-095-01)\n\n**PIPELINE FAILED** at the ` +
      `**${r.stage}** stage (recorded honestly — E-25 Rule 6; nothing tuned in response):\n\n` +
      `\`\`\`\n${r.error}\n\`\`\`\n\nNo artifact, sheet, or pass was produced.\n`;
  }
  const pct = (f) => (f == null ? "?" : `${Math.round(f * 100)}%`);
  const gapsOf = (v) => (v.gaps.length ? v.gaps.map((g) => `${g.severity} ${g.attribute}@${g.region}`).join("; ") : "—");
  const viewRows = (r.gate.perView ?? []).map((v) =>
    `| ${v.angle} | ${v.azimuthDeg}° | ${v.coverage === null ? "—" : v.coverage ? "pass" : "REJECT"} | ${v.verdict ?? "(missing)"} | ${gapsOf(v)} |`).join("\n");
  return `# Challenge milestone — ${r.subject} (T-095-01)\n\n` +
    `One command, the whole E-25 chain: ${r.provision ? "provision (GLB+map, untuned) → " : ""}` +
    `shell integrity (T-091) → regularization cage (T-102) → concept-derived zones (T-092) → E-24 ` +
    `full-shell skin → multi-angle same-object gate (T-093). **Reproducible**: double-run byte-identical, final sha256 ` +
    `\`${r.reproducible.sha256.final.slice(0, 16)}…\`.\n\n` +
    (r.provision ? `## Provision (challenge subject — first contact with the pipeline)\nScale ${r.provision.scale}, ` +
      `${r.provision.cells} cells, ${r.provision.manifest} manifest blocks — GLB + committed material map, zero tuning.\n\n` : "") +
    `## Shell integrity (T-091)\n` +
    `Strip ${r.shell.strip.components} → ${r.shell.strip.kept} components (${r.shell.strip.strippedCells} cells); ` +
    `voids ${r.shell.voids.filled} filled (minDepth ${r.shell.voids.minDepth}); plug ${r.shell.plug.cells} cells / ` +
    `${r.shell.plug.iterations} iter → **CLOSED** (before: ${r.shell.closureBefore.reached}/${r.shell.closureBefore.interiorCells} reachable). ` +
    `Openings honored: ${r.shell.openings.join(", ") || "(none)"}.\n\n` +
    `## Regularization cage (T-102)\n` +
    r.shell.regularize.steps.map((s) => `- **${s.step}** ${s.accepted ? "ACCEPTED" : `REJECTED — ${s.reasons.join("; ")}`} ` +
      `(removed ${s.cells.removed ?? 0}, added ${s.cells.added ?? 0}, plugged ${s.cells.plugged ?? 0})`).join("\n") + `\n` +
    `Spikes ${r.shell.regularize.census.before.spikes} → ${r.shell.regularize.census.after.spikes}; ragged ` +
    `${(r.shell.regularize.census.before.raggedRate * 100).toFixed(1)}% → ${(r.shell.regularize.census.after.raggedRate * 100).toFixed(1)}%; ` +
    `IoU vs GLB held at all 4 azimuths (caged, rejected steps rolled back).\n\n` +
    `## Skin (T-086/T-092/T-090/E-23/T-087/T-088)\n` +
    `Zone map: **${r.skin.zoneMap.source}**` +
    (r.skin.zoneMap.bands ? ` — ${r.skin.zoneMap.bands.map((b) => `${b.name} y${b.yRange[0]}..${b.yRange[1]} \`${b.dominantBlock}\``).join(", ")}; roof \`${r.skin.zoneMap.roof.dominantBlock}\`` : ` (${r.skin.zoneMap.reason ?? ""})`) + `.` +
    (r.skin.zoneMapVsCommitted ? ` Derived vs committed record: ${r.skin.zoneMapVsCommitted.bandsIdentical && r.skin.zoneMapVsCommitted.roofIdentical ? "identical" : "**diverged** (chain runs on the repaired shell; recorded, not gated)"}.` : "") + `\n` +
    `Substitution \`${JSON.stringify(r.skin.substitution)}\`; kit ${r.skin.kit?.source ?? "(none)"}. ` +
    `Fill ${r.skin.fill.placements}; salt ${r.skin.salt.stripped} stripped. ` +
    `Coverage gate **final PASS** — ` + Object.entries(r.skin.coverage).map(([z, c]) => `${z} \`${c.dominant}\` ${pct(c.dominantFraction)}`).join(" · ") + `. ` +
    `Bands: roof ${pct(r.skin.bands.roofMaterialsFraction)}, residue ${Object.entries(r.skin.bands.wallForeignResidue).map(([z, v]) => `${z} ${v == null ? "n/a" : pct(v)}`).join(" · ")}.\n\n` +
    `## Multi-angle gate (T-093) — **${r.gate.outcome}**` +
    (r.gate.gapCount != null ? ` (gaps ${r.gate.gapCount}/${r.gate.gapBudget})` : "") + `\n\n` +
    `![sheet](../../../${r.gate.sheet})\n\n` +
    `| view | azimuth | coverage | verdict | gaps |\n|---|---|---|---|---|\n${viewRows}\n\n` +
    `Gate record: \`${r.gate.record}\` (the sheet is the verdict artifact — E-25 Rule 1).\n\n` +
    `## Evidence\n` + r.renders.map((f) => `- ${f.when} ${f.angle}: ${f.path ?? `GL unavailable (${f.error})`}`).join("\n") +
    `\n\nFrames: ${r.frames.join(", ") || "(none — GL unavailable)"}\n\n> ${r.reproducible.determinism}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
