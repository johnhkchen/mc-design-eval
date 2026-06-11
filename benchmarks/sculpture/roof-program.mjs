// IMPURE RUNNER — E-27 roof-as-program evidence pass (S-104 / T-104-01). Every failing resemblance
// verdict names `form @ roof`: the roof is sampled from the decimated mesh into a stepped spiky
// blob, then skinned faithfully. This runner REPLACES it: the PURE cores fit gable parameters from
// the committed component record (src/form/roof-fit.mjs — glb-first pitch under a declared
// agreement gate, fit error recorded), regenerate the roof Minecraft-native (src/view/
// roof-generate.mjs — stair courses via the proven T-097 state path, slab half-steps, solid
// wedge), and swap it under the T-102 cage (src/view/roof-swap.mjs — per-azimuth silhouette IoU vs
// the GLB on a mass view, closure no-regress, chimney byte-protected + re-seated, auto-rollback).
//
// THE SEAM INVARIANT: this file is impure wiring only (file I/O, GLB load, the minecraft-data
// vocabulary, best-effort GL renders, the durable record). DETERMINISM (E-24 Rule 2): the core
// runs twice; the two outputs must be byte-identical (sha256 recorded, re-checked by --offline /
// --repro). HONEST FALLBACK (E-27 Rule 1): an unfittable roof keeps the regularized shell and the
// record names every reason — `status: "fallback"` is a CORRECT outcome, exit 0. A thrown stage
// writes {status:"pipeline-failed", stage, error} and exits 1 (the styled-milestone convention).
//
// INPUT PINS: the component record was computed ON the committed regularized shell — the record's
// source.sha256 must match the shell artifact on disk, or the run fails loudly (drift, not magic).
//
// UNMAPPED GATE (Rule 3): the swapped artifact is built into the in-memory world; ANY unmapped
// block/state THROWS — this live-proves every stair/slab state through the blockStateId gate.
// LENS NOTE (pinned, T-097): prismarine-viewer 1.33.0 meshes NO stair block at any state — stairs
// place and read back correctly but do not draw; renders show the solid wedge with tread notches.
// Renders are EVIDENCE, never decision inputs (the cage's silhouettes come from the pure
// rasterizer).
//
// GL — run on demand, NOT in `npm test`:
//   npm run roof:cottage                  # fit + generate + swap + censuses + renders + record
//   npm run roof:gatehouse
//   npm run roof:church                   # registry-generic; kit record is nullable registry data
//   npm run roof:cottage -- --repro       # re-run the deterministic core, compare sha256s (no GL)
//   npm run roof:cottage -- --offline     # re-assert the committed record + artifact hash (no recompute)
//
// Writes roof/<subj>.{json,md} (committed) + roof/<subj>/artifact.json (the swapped shell, when
// accepted) + PNGs (gitignored) + pr/assets/frames/roof-<subj>-{before,after}.png (oblique 225°).

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { rebuildArtifact, openingRegions } from "../../src/view/shell-integrity.mjs";
import { REGULARIZE_DEFAULTS, protrudingStackRegion } from "../../src/view/shell-regularize.mjs";
import { ROOF_FIT_DEFAULTS, gablesFromRecord } from "../../src/form/roof-fit.mjs";
import { componentGableGroups } from "../../src/form/component-roof.mjs";
import { roofFamily } from "../../src/view/roof-generate.mjs";
import { swapRoof, chimneyColumns } from "../../src/view/roof-swap.mjs";
import { runCells } from "../../src/form/component-decompose.mjs";
import { loadMeshFromGlb, rasterizeSilhouette } from "../../src/form/glb-silhouette.mjs";
import { resolveAngle } from "../../src/view/multi-angle.mjs";
import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { expandArtifact } from "../../src/expand.mjs";
import { SUBJECTS } from "./durable-skin.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const OUT_DIR = join(HERE, "roof");
const FRAMES_DIR = join(ROOT, "pr/assets/frames");

const OBLIQUE = "-x-z"; // azimuth 225° — the durable-skin witness angle (before/after parity)
// the azimuths the resemblance gate FAILED on (`form @ roof`) — the AC's evidence views
const EVIDENCE_ANGLES = ["+x-z", "-x-z", "-x+z"]; // 135° · 225° · 315°

const LENS_NOTE = "stairs-rendered (T-107-01, supersedes the T-097 stairs-invisible pin): the " +
  "lens defect was getModelVariants' substring air-check matching every *_stairs name; fixed by " +
  "render/scripts/patch-viewer-lens.mjs. Stair courses are visible in renders; placement remains " +
  "proven by the unmapped gate + the committed states.";

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const artifactJson = (a) => JSON.stringify(a, null, 2) + "\n";

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

/** A gable serialized for the durable record (Sets and bulky cell lists stripped). */
function gableRecordView(g) {
  return {
    id: g.id,
    ridge: g.ridge,
    sides: g.sides.map((s) => ({
      planeId: s.planeId, eaveDir: s.eaveDir, pitch: s.pitch, pitchSource: s.pitchSource,
      voxelPitch: s.voxelPitch, glbPitch: s.glbPitch, glbAngleDeg: s.glbAngleDeg,
      eaveY: s.eaveY, eaveEdge: s.eaveEdge, overhang: s.overhang, run: s.run ?? null,
    })),
    footprint: { bbox: g.footprint.bbox, area: g.footprint.area },
    hip: g.hip,
    sane: g.sane,
    reasons: g.reasons,
  };
}

// =================================================================================================
// THE DETERMINISTIC CORE — reads committed inputs, writes nothing, no GL. Run twice per live pass.
// =================================================================================================
async function runRoof(def) {
  const shellPath = def.regularizedShell ?? `regularize/${def.key}/artifact.json`; // T-106-01: registry override for chain-canonical shells
  const componentPath = `components/${def.key}.json`;
  const shellBytes = await readFile(join(HERE, shellPath), "utf8");
  const record = JSON.parse(await readFile(join(HERE, componentPath), "utf8"));
  if (record.schema !== "component-record/v1") throw new Error(`${componentPath}: unexpected schema ${record.schema}`);
  if (record.subject !== def.key) throw new Error(`${componentPath}: subject ${record.subject} ≠ ${def.key}`);
  const shellSha = sha256(shellBytes);
  if (record.source?.sha256 !== shellSha) {
    throw new Error(`${def.key} input drift: component record fitted shell ${record.source?.sha256?.slice(0, 12)}…, ` +
      `on-disk regularized shell is ${shellSha.slice(0, 12)}… — re-run components:${def.key} first`);
  }

  const raw = JSON.parse(shellBytes);
  assertArtifact(raw);
  const occ = artifactOccupancy(raw);

  // kit → course family (nullable registry data: a missing kit is a named finding, not a crash)
  const kit = def.kitRecord ? JSON.parse(await readFile(join(HERE, def.kitRecord), "utf8")) : null;
  const { mcData } = await import("../../render/src/version.mjs");
  const vocab = new Set(Object.keys(mcData().blocksByName));
  const family = roofFamily(kit?.kit ?? [], vocab);

  // fit (pure, record-space)
  const fit = gablesFromRecord(record);

  // chimney: record protrusion masses ∪ the cage's geometric stack; protect = both, declared
  const chimney = chimneyColumns(record, occ);
  const stack = protrudingStackRegion(occ);
  const protect = [
    { name: "chimney-stack", contains: stack.contains },
    ...(record.masses ?? []).filter((m) => m.role === "protrusion").map((m) => {
      const cols = new Set(runCells(m.plan?.runs ?? []).map(([x, z]) => `${x},${z}`));
      const lo = m.yRange?.[0] ?? -Infinity;
      return { name: m.id, contains: ([x, y, z]) => y >= lo && cols.has(`${x},${z}`) };
    }),
  ];
  // openings stay an allow-list for closure (the carve never touches walls below the band floor)
  const regions = openingRegions(occ);

  // the GLB reference silhouettes at the 4 gate azimuths — the cage's 3-D target
  const mesh = loadMeshFromGlb(await readFile(join(HERE, def.glb)));
  const refSils = {};
  for (const a of MULTI_ANGLE_GATE.azimuths) refSils[a] = rasterizeSilhouette(mesh, { view: resolveAngle(a) });

  // T-110-01 (E-28): the swap ladder runs PER COMPONENT — a building can carry structurally
  // distinct roofs (the church: tower cap + nave pitch) that one whole-mass invocation judges
  // all-or-nothing. Gables group by their planes' massId (pure, src/form/component-roof.mjs),
  // primary mass first; each group gets the full existing attempt ladder under the cage, judged in
  // the context of everything accepted so far (the occupancy threads through accepted swaps).
  // A rejected component falls back NAMED — per component, never dragging its siblings down.
  const grouping = componentGableGroups({ record, gables: fit.gables });
  let occCur = occ;
  const components = [];
  for (const grp of grouping.groups) {
    const swap = swapRoof(occCur, { gables: grp.gables, family, refSils, regions, protect, chimney });
    if (swap.accepted) occCur = swap.occ;
    components.push({ massId: grp.massId, role: grp.role, gableIds: grp.gableIds, swap });
  }
  const swap = composeComponentSwaps(components, grouping.findings, occCur);
  const artifact = swap.accepted ? rebuildArtifact(occCur, raw) : null;
  if (artifact) assertArtifact(artifact);
  return { raw, occ, record, shellSha, shellPath, componentPath, fit, family, swap, components, chimney, stack, artifact };
}

/** Compose per-component swap outcomes into the record's top-level summary. For a single-mass
 *  subject this is the identity view of its one swap (sums of one), so the cottage/gatehouse
 *  records keep today's semantics. Aggregations are declared: counts/carve/reseat/fitError sum or
 *  concat; iou/closure report the LAST ACCEPTED component (the final whole-build state the cage
 *  judged); bandFloor is the min over generated components; reasons are massId-prefixed. */
function composeComponentSwaps(components, groupFindings, occFinal) {
  const accepted = components.filter((c) => c.swap.accepted);
  const last = accepted[accepted.length - 1] ?? components[0] ?? null;
  const sum = (sel) => components.reduce((a, c) => a + (sel(c.swap) ?? 0), 0);
  const censusSum = (side) => {
    const rows = components.map((c) => c.swap.census?.[side]).filter(Boolean);
    return rows.length ? rows.reduce((a, r) => ({ spikes: a.spikes + r.spikes, cells: a.cells + r.cells }),
      { spikes: 0, cells: 0 }) : null;
  };
  const floors = components.filter((c) => c.swap.accepted && Number.isFinite(c.swap.bandFloor))
    .map((c) => c.swap.bandFloor);
  return {
    occ: occFinal,
    accepted: accepted.length > 0,
    perComponent: components.map((c) => ({ massId: c.massId, accepted: c.swap.accepted })),
    reasons: components.flatMap((c) => c.swap.accepted ? [] : c.swap.reasons.map((r) => `[${c.massId}] ${r}`)),
    attempt: components.map((c) => `${c.massId}:${c.swap.attempt}`).join(", "),
    attempts: components.flatMap((c) => (c.swap.attempts ?? []).map((a) => ({ massId: c.massId, ...a }))),
    iou: last?.swap.iou ?? null,
    closure: last?.swap.closure ?? null,
    carve: { removed: sum((s) => s.carve?.removed) },
    generated: {
      counts: {
        full: sum((s) => s.generated?.counts?.full),
        stairs: sum((s) => s.generated?.counts?.stairs),
        slabs: sum((s) => s.generated?.counts?.slabs),
      },
      gables: accepted.flatMap((c) => c.swap.generated?.gables ?? []),
    },
    reseat: { added: components.flatMap((c) => c.swap.reseat?.added ?? []) },
    fitError: components.flatMap((c) => c.swap.fitError ?? []),
    findings: [...groupFindings, ...components.flatMap((c) =>
      (c.swap.findings ?? []).map((f) => ({ ...f, where: f.where ?? c.massId })))],
    bandFloor: floors.length ? Math.min(...floors) : last?.swap.bandFloor ?? null,
    census: { before: censusSum("before"), after: censusSum("after") },
  };
}

/** Declared targets, asserted (E-25 Rule 6 — honest gaps fail loudly, never quietly recorded). */
function assertAcceptance(def, r) {
  if (!r.swap.accepted) return; // fallback is a correct Rule 1 outcome, judged by the caller
  const gables = r.swap.generated.gables.length;
  // ≈0 (the AC): a clean roof's LINE FEATURES expose 4 faces at their END cells by geometry —
  // the ridge line (2 ends) and each side's eave line (2 ends, when overhanging) — never the
  // sampled blob's spike field. Budget = (2 ridge + 2×2 eave) per generated gable, a geometric
  // formula shared across subjects, not a tuned constant.
  const budget = 6 * gables;
  const { before, after } = r.swap.census;
  if (after.spikes > budget) {
    throw new Error(`${def.key} DECLARED TARGET MISSED: roof-band protrusions after=${after.spikes} ` +
      `> ridge-end budget ${budget} (before=${before.spikes})`);
  }
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
  const artPath = join(subjDir, "artifact.json");
  const track = { stage: "load" };

  try {
    if (offline) {
      if (!existsSync(recPath)) throw new Error(`committed record absent — run npm run roof:${def.key} first`);
      const rec = JSON.parse(await readFile(recPath, "utf8"));
      const checks = { status: rec.status === "accepted" || rec.status === "fallback" };
      if (rec.status === "accepted") {
        const artBytes = await readFile(artPath, "utf8");
        assertArtifact(JSON.parse(artBytes));
        checks.sha = sha256(artBytes) === rec.reproducible?.sha256;
        checks.unmapped = rec.unmapped === 0;
      }
      const ok = Object.values(checks).every(Boolean);
      console.error(`[offline] ${def.key}: status ${rec.status}; ` +
        Object.entries(checks).map(([k, v]) => `${k} ${v ? "OK" : "VIOLATED"}`).join("; "));
      if (!ok) process.exitCode = 1;
      return;
    }

    // THE REPRODUCIBILITY PROOF (E-24 Rule 2): the deterministic core, twice; byte-equal or no record.
    track.stage = "core";
    const r1 = await runRoof(def);
    const r2 = await runRoof(def);
    const j1 = r1.artifact ? artifactJson(r1.artifact) : JSON.stringify({ reasons: r1.swap.reasons, findings: r1.swap.findings });
    const j2 = r2.artifact ? artifactJson(r2.artifact) : JSON.stringify({ reasons: r2.swap.reasons, findings: r2.swap.findings });
    if (j1 !== j2) throw new Error("NON-DETERMINISTIC: two in-process runs produced different outputs");
    track.stage = "acceptance";
    assertAcceptance(def, r1);
    const status = r1.swap.accepted ? "accepted" : "fallback";

    for (const g of r1.fit.gables) {
      console.error(`[${def.key}] ${g.id}: ${g.sane ? "sane" : `INSANE — ${g.reasons.join("; ")}`}; ` +
        g.sides.map((s) => `${s.planeId} ${s.eaveDir} pitch ${s.pitch} (${s.pitchSource}) eaveY ${s.eaveY} overhang ${s.overhang ?? "—"}`).join(" · "));
    }
    console.error(`[${def.key}] family: field ${r1.family.field ?? "—"}, stairs ${r1.family.stairs ?? "—"}, slab ${r1.family.slab ?? "—"}`);
    for (const c of r1.components) {
      console.error(`[${def.key}] component ${c.massId}${c.role ? ` (${c.role})` : ""}: ` +
        `${c.swap.accepted ? `ACCEPTED (${c.swap.attempt})` : `FALLBACK — ${c.swap.reasons.join("; ")}`} ` +
        `[gables: ${c.gableIds.join(", ") || "—"}]`);
    }
    for (const a of r1.swap.attempts ?? []) {
      console.error(`[${def.key}] attempt ${a.massId}:${a.name}: ${a.accepted ? "ACCEPTED" : `rejected — ${a.reasons.join("; ")}`}`);
    }
    console.error(`[${def.key}] swap ${status.toUpperCase()} (${r1.swap.attempt})${r1.swap.reasons.length ? ` — ${r1.swap.reasons.join("; ")}` : ""}`);
    if (r1.swap.iou) console.error(`[${def.key}] iou baseline ${JSON.stringify(r1.swap.iou.baseline)} → final ${JSON.stringify(r1.swap.iou.final)}`);
    if (r1.swap.census?.before) console.error(`[${def.key}] roof-band protrusions ${r1.swap.census.before.spikes} → ${r1.swap.census.after.spikes} ` +
      `(carved ${r1.swap.carve.removed}, generated full ${r1.swap.generated.counts.full} / stairs ${r1.swap.generated.counts.stairs} / slabs ${r1.swap.generated.counts.slabs}, ` +
      `reseat ${r1.swap.reseat.added.length})`);

    // UNMAPPED GATE (Rule 3): every stair/slab state through the live blockStateId path
    track.stage = "unmapped";
    let unmapped = null;
    if (r1.artifact) {
      const { buildWorldFromVoxels } = await import("../../render/src/world.mjs");
      const voxels = expandArtifact(r1.artifact);
      const build = await buildWorldFromVoxels(voxels);
      unmapped = build.unmapped.length;
      if (unmapped > 0) {
        for (const u of build.unmapped) console.error(`  UNMAPPED [${u.pos}] ${u.block}: ${u.reason}`);
        throw new Error(`${def.key}: ${unmapped} unmapped placements — a render unmapped is a failure, not a warning (Rule 3)`);
      }
      console.error(`[${def.key}] unmapped 0/${voxels.length} — every state passed the live blockStateId gate`);
    }

    if (repro) {
      const rec = existsSync(recPath) ? JSON.parse(await readFile(recPath, "utf8")) : null;
      const shaNow = r1.artifact ? sha256(artifactJson(r1.artifact)) : null;
      const match = rec ? rec.reproducible?.sha256 === shaNow && rec.status === status : null;
      console.error(`[repro] ${def.key}: status ${status}; artifact sha ${shaNow?.slice(0, 12) ?? "—"} ` +
        `${rec ? (match ? "MATCHES committed record" : "DIVERGES from committed record") : "(no committed record yet)"}`);
      if (rec && !match) process.exitCode = 1;
      return;
    }

    await mkdir(subjDir, { recursive: true });
    await mkdir(FRAMES_DIR, { recursive: true });
    let artSha = null;
    if (r1.artifact) {
      await writeFile(artPath, j1);
      artSha = sha256(j1);
    }

    // --- before/after renders at the gate-failed azimuths (best-effort lens) ---------------------
    track.stage = "renders";
    const renders = [];
    for (const angle of EVIDENCE_ANGLES) {
      const deg = { "+x-z": 135, "-x-z": 225, "-x+z": 315 }[angle];
      renders.push({ when: "before", ...(await tryRender(r1.raw, angle, `oblique${deg}-before`, subjDir)) });
      if (r1.artifact) renders.push({ when: "after", ...(await tryRender(r1.artifact, angle, `oblique${deg}-after`, subjDir)) });
    }
    for (const r of renders) console.error(`render ${r.when} ${r.angle}: ${r.path ?? `unavailable (${r.error})`}`);
    const frames = [];
    try {
      const b = renders.find((r) => r.when === "before" && r.angle === OBLIQUE && r.path);
      const a = renders.find((r) => r.when === "after" && r.angle === OBLIQUE && r.path);
      if (b && a) {
        await copyFile(join(ROOT, b.path), join(FRAMES_DIR, `roof-${def.key}-before.png`));
        await copyFile(join(ROOT, a.path), join(FRAMES_DIR, `roof-${def.key}-after.png`));
        frames.push(`pr/assets/frames/roof-${def.key}-before.png`, `pr/assets/frames/roof-${def.key}-after.png`);
      }
    } catch (e) {
      console.error(`frames: ${e.message}`);
    }

    // --- the durable record -----------------------------------------------------------------------
    track.stage = "record";
    const recordOut = {
      schema: "roof-program/v1",
      subject: def.key,
      status,
      inputs: {
        shell: r1.shellPath, shellSha256: r1.shellSha,
        componentRecord: r1.componentPath, componentSourcePin: r1.record.source.sha256,
        kit: def.kitRecord ?? null, glb: def.glb,
        note: "the component record's source.sha256 is hard-pinned against the on-disk regularized shell",
      },
      params: {
        ...ROOF_FIT_DEFAULTS,
        iouTolerance: REGULARIZE_DEFAULTS.iouTolerance, grid: REGULARIZE_DEFAULTS.grid,
        spikeFaces: REGULARIZE_DEFAULTS.spikeFaces, azimuths: MULTI_ANGLE_GATE.azimuths,
        note: "fit + cage parameters (declared, shared across subjects — no tuning); azimuths config-frozen",
      },
      fit: { gables: r1.fit.gables.map(gableRecordView), findings: r1.fit.findings },
      family: r1.family,
      // T-110-01: one entry per component mass — the roof program's tolerance-or-named-fallback
      // contract applied per component (the church's tower and nave are judged separately, in
      // primary-first order, each ladder run under the cage on the threaded occupancy)
      components: r1.components.map((c) => ({
        massId: c.massId, role: c.role, gableIds: c.gableIds,
        swap: {
          accepted: c.swap.accepted, attempt: c.swap.attempt, reasons: c.swap.reasons,
          iou: c.swap.iou, closure: c.swap.closure, carve: c.swap.carve,
          generated: c.swap.generated, reseat: { added: c.swap.reseat?.added?.length ?? 0 },
          fitError: c.swap.fitError, findings: c.swap.findings, bandFloor: c.swap.bandFloor,
          census: c.swap.census,
        },
      })),
      swap: {
        accepted: r1.swap.accepted, reasons: r1.swap.reasons,
        attempt: r1.swap.attempt, attempts: r1.swap.attempts,
        iou: r1.swap.iou, closure: r1.swap.closure,
        carve: r1.swap.carve, generated: r1.swap.generated,
        reseat: { added: r1.swap.reseat.added.length, cells: r1.swap.reseat.added },
        fitError: r1.swap.fitError, findings: r1.swap.findings, bandFloor: r1.swap.bandFloor,
        note: "ONE judged step with the T-102 cage's checks: per-azimuth silhouette IoU vs the GLB " +
          "on a MASS VIEW (generated stair/slab courses count as silhouette mass; all other " +
          "fixtures stay dressing), closure no-regress, protected chimney byte-identical " +
          "(re-seat additions listed, judged without them). Any regression → auto-rollback, the " +
          "regularized roof stays, the failure is named (Rule 1).",
      },
      census: {
        ...(r1.swap.census ?? {}),
        note: "protrusions (≥4/6 faces exposed) restricted to the generated footprint at/above the " +
          "band floor, chimney columns excluded. The honest residual is the ridge line's two end " +
          "cells per gable (4 exposed faces by geometry) — the declared budget asserted by this run.",
      },
      protect: { chimney: { columns: r1.chimney.size, stackRidgeY: r1.stack.ridgeY }, openings: "closure allow-list only (the carve never touches walls below the band floor)" },
      unmapped,
      reproducible: { doubleRun: true, sha256: artSha,
        determinism: "no LLM, no GL on the decision path — silhouettes via the pure rasterizer; " +
          "two in-process executions byte-matched." },
      placements: { input: r1.raw.placements.length, final: r1.artifact?.placements.length ?? null },
      renders, frames,
      lensNote: LENS_NOTE,
    };
    await writeFile(recPath, JSON.stringify(recordOut, null, 2) + "\n");
    await writeFile(join(OUT_DIR, `${def.key}.md`), renderMd(recordOut));
    console.error(`\n✓ wrote ${recPath}${artSha ? ` + ${artPath} (sha256 ${artSha.slice(0, 12)}…)` : " (fallback — regularized roof stays)"}`);
  } catch (e) {
    // honest failure (E-25 Rule 6): name the stage, write the record, exit 1
    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(recPath, JSON.stringify({
      schema: "roof-program/v1", subject: def.key, status: "pipeline-failed", stage: track.stage, error: e.message,
    }, null, 2) + "\n");
    throw e;
  }
}

function renderMd(r) {
  const iouRow = (o) => Object.entries(o).map(([a, v]) => `${a} ${v}`).join(" · ");
  const sides = (g) => g.sides.map((s) =>
    `${s.planeId} → ${s.eaveDir}: pitch **${s.pitch}** (${s.pitchSource}${s.glbAngleDeg !== null ? `, glb∠ ${s.glbAngleDeg}°` : ""}), ` +
    `eave y ${s.eaveY}, overhang ${s.overhang ?? "—"}`).join("; ");
  const gables = r.fit.gables.map((g) =>
    `- **${g.id}** (${g.sane ? "sane" : `insane: ${g.reasons.join("; ")}`}) ridge ${g.ridge.axis} @ y ${g.ridge.y}` +
    `${g.hip.demanded ? ", hip ends" : ""} — ${sides(g)}`).join("\n");
  const findings = [...r.fit.findings, ...r.swap.findings].map((f) => `- \`${f.code}\` @ ${f.where ?? "—"}: ${f.detail}`).join("\n") || "- (none)";
  return `# Roof as program — ${r.subject} (T-104-01)\n\n` +
    `The sampled roof replaced by a roof GENERATED from parameters fitted against the component ` +
    `record's GLB fits — stair courses, slab half-steps, solid wedge — swapped under the T-102 ` +
    `cage, behind \`npm run roof:${r.subject}\`. **Status: ${r.status.toUpperCase()}**` +
    `${r.reproducible.sha256 ? ` — reproducible, artifact sha256 \`${r.reproducible.sha256.slice(0, 16)}…\`` : ""}.\n\n` +
    `## Fitted gables\n${gables}\n\n` +
    (r.components?.length
      ? `## Per-component outcomes (T-110-01)\n` + r.components.map((c) =>
          `- **${c.massId}**${c.role ? ` (${c.role})` : ""}: ${c.swap.accepted
            ? `ACCEPTED (\`${c.swap.attempt}\`)${c.swap.fitError?.length ? ` — rmse ${c.swap.fitError.map((e) => `${e.gableId} ${e.rmse}`).join(", ")}` : ""}`
            : `FALLBACK — ${c.swap.reasons.join("; ")}`} (gables: ${c.gableIds.join(", ") || "—"})`).join("\n") + `\n\n`
      : "") +
    (r.swap.iou ? `## The cage\nIoU vs GLB — baseline: ${iouRow(r.swap.iou.baseline)}; final: ${iouRow(r.swap.iou.final)} ` +
      `(tolerance ${r.params.iouTolerance}, anchored to the input shell). Closure reached ` +
      `${r.swap.closure.input.reached} → ${r.swap.closure.candidate.reached}. ` +
      `Chimney: ${r.protect.chimney.columns} columns protected, ${r.swap.reseat.added} cells re-seated.\n\n` : "") +
    (r.census?.before ? `## Roof-band protrusions\n| before | after |\n|---|---|\n` +
      `| ${r.census.before.spikes} | ${r.census.after.spikes} |\n\n` +
      `Carved ${r.swap.carve.removed} sampled cells; generated ${r.swap.generated.counts.full} full / ` +
      `${r.swap.generated.counts.stairs} stairs / ${r.swap.generated.counts.slabs} slabs ` +
      `(family ${r.family.field} / ${r.family.stairs ?? "—"} / ${r.family.slab ?? "—"}). Fit error (program rmse): ` +
      r.swap.fitError.map((e) => `${e.gableId} ${e.rmse}`).join(", ") + `.\n\n` : "") +
    `## Findings\n${findings}\n\n` +
    `## Renders (135°/225°/315° — the azimuths the gate failed)\n` +
    r.renders.map((f) => `- ${f.when} ${f.angle}: ${f.path ?? `GL unavailable (${f.error})`}`).join("\n") +
    `\n\nFrames: ${r.frames.join(", ") || "(none — GL unavailable)"}\n\n> ${r.lensNote}\n\n> ${r.swap.note}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
