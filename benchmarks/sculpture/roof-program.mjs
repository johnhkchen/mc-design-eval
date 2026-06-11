// IMPURE RUNNER — E-27 roof-as-program evidence pass (S-104 / T-104-01). Every failing resemblance
// verdict names `form @ roof`: the roof is sampled from the decimated mesh into a stepped spiky
// blob, then skinned faithfully. This runner REPLACES it: the PURE cores fit gable parameters from
// the committed component record (src/form/roof-fit.mjs — glb-first pitch under a declared
// agreement gate, fit error recorded), regenerate the roof Minecraft-native (src/view/
// roof-generate.mjs — stair courses via the proven T-097 state path, slab half-steps, solid
// wedge), and swap it under the T-102 cage (src/view/roof-swap.mjs — per-azimuth silhouette IoU vs
// the GLB on a mass view, closure no-regress, chimney byte-protected + re-seated, auto-rollback).
// T-108-01 (E-28) extends the program past the slopes: gable ENDS are fitted against the GLB end
// faces (src/form/roof-end-fit.mjs — as-built wall anchor + GLB differentials, fit error
// recorded), the footprint trims at the fitted verge tip, and the end-overhang strip generates as
// a SHEET course (open underside) — end-fitted rungs lead the swap ladder, the E-27 rungs remain
// the honest tail. T-109-01 (E-28) finishes the top of the build: the RIDGE is fitted (plane
// intersection as ladder rungs via src/form/roof-ridge-fit.mjs, GLB apex line recorded as
// evidence, cap courses tracked), UNCONSUMED planes are clamped to their fitted planes
// (src/view/plane-terminate.mjs through regularizeShell's step seam), and the protrusion
// candidates are arbitrated against the GLB silhouette (src/view/silhouette-residual.mjs) —
// GLB-refuted lumps removed under the cage, GLB-shown masses (the cottage chimney) exempt.
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
import { REGULARIZE_DEFAULTS, protrudingStackRegion, regularizeShell } from "../../src/view/shell-regularize.mjs";
import { ROOF_FIT_DEFAULTS, gablesFromRecord, gableEndsVariant } from "../../src/form/roof-fit.mjs";
import { END_FIT_DEFAULTS, fitGableEnds, alignedTriangles } from "../../src/form/roof-end-fit.mjs";
import { RIDGE_FIT_DEFAULTS, ridgeFromPlanes, fitRidgeLine } from "../../src/form/roof-ridge-fit.mjs";
import { HIP_FIT_SCHEMA, HIP_FIT_DEFAULTS, fitHipCap, fitHipEnds } from "../../src/form/roof-hip-fit.mjs";
import { TERMINATE_SCHEMA, unconsumedPlanes, terminationSteps } from "../../src/view/plane-terminate.mjs";
import { RESIDUAL_SCHEMA, residualPass } from "../../src/view/silhouette-residual.mjs";
import { aabbAlignment } from "../../src/form/component-glb-fit.mjs";
import { parseGlbMesh } from "../../src/form/glb-mesh.mjs";
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
// the azimuths the resemblance gate FAILED on (`form @ roof`, plus the T-108 gable-end majors at 45°)
const EVIDENCE_ANGLES = ["+x+z", "+x-z", "-x-z", "-x+z"]; // 45° · 135° · 225° · 315°
const ANGLE_DEG = { "+x+z": 45, "+x-z": 135, "-x-z": 225, "-x+z": 315 };
// the T-108 AC's named gable-end views — before/after frame pairs for the epic sheet
const END_FRAME_ANGLES = ["+x+z", "-x+z"];

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
  const glbBytes = await readFile(join(HERE, def.glb));
  const mesh = loadMeshFromGlb(glbBytes);
  const refSils = {};
  for (const a of MULTI_ANGLE_GATE.azimuths) refSils[a] = rasterizeSilhouette(mesh, { view: resolveAngle(a) });

  // T-108-01 (E-28): gable ENDS fitted against the GLB end faces — expanded triangles under the
  // decomposition's own aabb alignment, anchored to the as-built occupancy (differentials only;
  // absolute aabb offsets are unreliable). Fitted once on the whole record (the fit is per gable),
  // split per component group below; the hip-suppressed variant is fitted separately because a
  // demanded hip end is a slope, not a face — the cage arbitrates between the rungs.
  const meshTris = parseGlbMesh(glbBytes);
  const alignment = aabbAlignment(meshTris.bounds, occ.bounds);
  const endFitPlain = fitGableEnds(fit.gables, occ, meshTris, alignment);
  const endFitSupp = fitGableEnds(gableEndsVariant(fit.gables), occ, meshTris, alignment);
  const endFindings = [
    ...endFitPlain.findings,
    // the suppressed pass repeats the plain findings for unchanged gables — keep only what hip
    // suppression newly exposed
    ...endFitSupp.findings.filter((f) => {
      const g = endFitSupp.gables.find((x) => f.where?.startsWith(`${x.id}:`));
      return g?.hip?.suppressed;
    }).map((f) => ({ ...f, variant: "gable-ends" })),
  ];
  const endsById = new Map(endFitPlain.gables.map((g) => [g.id, g]));
  const suppById = new Map(endFitSupp.gables.map((g) => [g.id, g]));

  // T-112-01 (E-29): the GLB triangles in voxel space, shared by the hip fit below and the
  // ridge-fit evidence pass (previously computed after the swaps — one computation, hoisted).
  const aTris = alignedTriangles(meshTris, alignment);

  // T-110-01 (E-28): the swap ladder runs PER COMPONENT — a building can carry structurally
  // distinct roofs (the church: tower cap + nave pitch) that one whole-mass invocation judges
  // all-or-nothing. Gables group by their planes' massId (pure, src/form/component-roof.mjs),
  // primary mass first; each group gets the full existing attempt ladder under the cage, judged in
  // the context of everything accepted so far (the occupancy threads through accepted swaps).
  // A rejected component falls back NAMED — per component, never dragging its siblings down.
  const grouping = componentGableGroups({ record, gables: fit.gables });
  let occCur = occ;
  const components = [];
  const hipFitEvidence = [];
  for (const grp of grouping.groups) {
    const endFit = {
      gables: grp.gables.map((g) => endsById.get(g.id) ?? g),
      suppressed: grp.gables.map((g) => suppById.get(g.id) ?? gableEndsVariant([g])[0]),
    };
    // T-112-01 (E-29): hip/pyramid hypotheses — a group whose planes REFUTED the ridge-pair
    // hypothesis (no sane gable — the church tower) gets a fitted pyramidal/hip cap; a group
    // with hip-demanded gables gets per-end GLB-fitted hip pitches. Both enter the ladder as
    // appended tail rungs (roof-swap) — earlier acceptance never reaches them, which is what
    // keeps single-mass subjects byte-identical (--repro is the proof).
    const capRes = grp.gables.some((g) => g.sane) ? null
      : fitHipCap({ record, massId: grp.massId, gables: grp.gables, occ: occCur, tris: aTris });
    const hipEndsRes = grp.gables.some((g) => g.sane && g.hip?.demanded)
      ? fitHipEnds(grp.gables, aTris) : null;
    const hipFit = capRes?.gable || hipEndsRes
      ? { cap: capRes?.gable ?? null, hipEnds: hipEndsRes?.gables ?? null }
      : null;
    if (capRes || hipEndsRes) {
      hipFitEvidence.push({
        massId: grp.massId,
        capGable: capRes?.gable ?? null, // internal (Sets inside) — stripped from the record
        cap: capRes ? (capRes.gable?.capFit ?? null) : null,
        capFitted: Boolean(capRes?.gable),
        hipEnds: hipEndsRes
          ? hipEndsRes.gables.filter((g) => g.hip?.fitted).map((g) => ({ id: g.id, fitted: g.hip.fitted }))
          : null,
        findings: [...(capRes?.findings ?? []), ...(hipEndsRes?.findings ?? [])],
      });
    }
    const swap = swapRoof(occCur, { gables: grp.gables, endFit, hipFit, family, refSils, regions, protect, chimney });
    if (swap.accepted) occCur = swap.occ;
    components.push({ massId: grp.massId, role: grp.role, gableIds: grp.gableIds, swap });
  }
  const swap = composeComponentSwaps(components, grouping.findings, occCur);

  // T-109-01: ridge fit — the plane-intersection construction per gable (the swap ladder already
  // tried the intersect rungs) + the GLB apex LINE measured in mesh space: height/direction/
  // length/rmse recorded as fit evidence, never applied as an absolute height (aabb-affine maps
  // the mesh top onto the spike-inflated blob top). aTris hoisted above the swaps (T-112-01).
  const ridgeFit = fit.gables.filter((g) => g.sane).map((g) => {
    const intersect = ridgeFromPlanes(g);
    return {
      id: g.id,
      recordY: g.ridge.y,
      intersect,
      deltaVsRecord: intersect.valid ? Math.round((intersect.y - g.ridge.y) * 1e3) / 1e3 : null,
      apexLine: fitRidgeLine(g, aTris),
    };
  });

  // T-109-01: upper-edge terminations — every recorded plane NOT consumed by an accepted gable
  // is clamped to its own fitted plane, one cage-judged step per plane through regularizeShell's
  // existing seam (IoU floors anchored to the post-swap shell, closure no-regress, protect,
  // auto-rollback, trace). The accepted gables' footprints are excluded; the chimney/protrusion
  // protects hold — protrusion arbitration belongs to the residual pass below.
  const acceptedGableIds = new Set(components.flatMap((c) => (c.swap.accepted ? c.swap.generated.gables : [])));
  // T-112-01: accepted hip-cap gables consume their recorded planes and exclude their footprint
  // from the termination pass exactly like ridge-pair gables (synthetic faces carry planeId null)
  const capGables = hipFitEvidence.map((h) => h.capGable).filter(Boolean);
  const gableById = new Map([...fit.gables, ...capGables].map((g) => [g.id, g]));
  const consumedPlaneIds = new Set();
  const excludeCols = new Set();
  let profileGable = null;
  for (const id of acceptedGableIds) {
    const g = gableById.get(id);
    if (!g) continue;
    for (const s of g.sides) if (s.planeId) consumedPlaneIds.add(s.planeId);
    for (const c of g.footprint.cols) excludeCols.add(c);
    if (!profileGable || g.footprint.area > profileGable.footprint.area) profileGable = g;
  }
  const termPlanes = unconsumedPlanes(record, consumedPlaneIds);
  let term = null;
  if (termPlanes.length) {
    term = regularizeShell(occCur, { refSils, regions, protect,
      steps: terminationSteps(termPlanes, { excludeCols }) });
    occCur = term.occ;
  }

  // T-109-01: silhouette-residual pass — the protrusion candidates (the very set chimneyColumns
  // blanket-protects) arbitrated against the GLB silhouette; refuted masses removed under the
  // cage, every decision logged with its per-azimuth spill evidence. No caller protects here:
  // re-grounding that protection in the GLB is the point (openings stay closure regions).
  const residual = residualPass(occCur, { record, refSils, regions, protect: [] });
  occCur = residual.occ;

  // the ridge-profile evidence angle: side-on to the dominant accepted gable's ridge line
  const ridgeAngle = profileGable ? (profileGable.ridge.axis === "x" ? "front" : "right") : null;

  const changed = swap.accepted || (term?.accepted ?? 0) > 0 || residual.removedCells > 0;
  const artifact = changed ? rebuildArtifact(occCur, raw) : null;
  if (artifact) assertArtifact(artifact);
  const endFit = { params: { ...END_FIT_DEFAULTS }, findings: endFindings,
    gables: endFitPlain.gables.filter((g) => g.ends).map((g) => ({ id: g.id, ends: g.ends })),
    suppressed: endFitSupp.gables.filter((g) => g.hip?.suppressed && g.ends).map((g) => ({ id: g.id, ends: g.ends })) };
  return { raw, occ, record, shellSha, shellPath, componentPath, fit, endFit, family, swap, components,
    hipFitEvidence, chimney, stack, artifact, ridgeFit, termPlanes, term, residual, ridgeAngle, changed };
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
      // T-108-01: fitted ends over the ACCEPTED components only (a rolled-back trim never counts)
      fittedEnds: accepted.reduce((n, c) => n + (c.swap.generated?.fittedEnds ?? 0), 0),
      endCoords: accepted.flatMap((c) => c.swap.generated?.endCoords ?? []),
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
  // T-109-01: no silent removals — every residual removal carries its refutation azimuths and
  // per-azimuth spill evidence (the AC's "every removal logged with its azimuth evidence").
  for (const e of r.residual?.log ?? []) {
    if (e.outcome === "removed" && (!e.refutedAt?.length || !e.perAzimuth)) {
      throw new Error(`${def.key} SILENT REMOVAL: residual ${e.id} removed without azimuth evidence`);
    }
  }
  if (!r.swap.accepted) return; // fallback is a correct Rule 1 outcome, judged by the caller
  const gables = r.swap.generated.gables.length;
  // ≈0 (the AC): a clean roof's LINE FEATURES expose 4 faces at their END cells by geometry —
  // the ridge line (2 ends) and each side's eave line (2 ends, when overhanging) — never the
  // sampled blob's spike field. Budget = (2 ridge + 2×2 eave) per generated gable, plus 2 per
  // FITTED END (T-108-01: a verge sheet course terminates in two rake-corner cells with an open
  // underside and outward face — 4 exposed faces by construction, the same class as ridge ends).
  // A geometric formula shared across subjects, not a tuned constant.
  const fittedEnds = r.swap.generated.fittedEnds ?? 0;
  const budget = 6 * gables + 2 * fittedEnds;
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
    const view = (r) => r.artifact
      ? artifactJson(r.artifact)
      : JSON.stringify({ reasons: r.swap.reasons, findings: r.swap.findings,
        term: r.term?.trace ?? null, residual: r.residual.log });
    const j1 = view(r1);
    const j2 = view(r2);
    if (j1 !== j2) throw new Error("NON-DETERMINISTIC: two in-process runs produced different outputs");
    track.stage = "acceptance";
    assertAcceptance(def, r1);
    // accepted ⇔ the program changed the shell under the cage (swap, termination or residual) —
    // supersets the pre-T-109 swap-only rule; an artifact exists exactly when accepted.
    const status = r1.changed ? "accepted" : "fallback";

    for (const g of r1.fit.gables) {
      console.error(`[${def.key}] ${g.id}: ${g.sane ? "sane" : `INSANE — ${g.reasons.join("; ")}`}; ` +
        g.sides.map((s) => `${s.planeId} ${s.eaveDir} pitch ${s.pitch} (${s.pitchSource}) eaveY ${s.eaveY} overhang ${s.overhang ?? "—"}`).join(" · "));
    }
    console.error(`[${def.key}] family: field ${r1.family.field ?? "—"}, stairs ${r1.family.stairs ?? "—"}, slab ${r1.family.slab ?? "—"}`);
    for (const g of [...r1.endFit.gables, ...r1.endFit.suppressed.map((s) => ({ ...s, supp: true }))]) {
      const e = (end) => end ? `face ${end.faceCoord} tip ${end.coord} (overhang ${end.overhang}, rmse ${end.glb.faceRmse})` : "unfitted";
      console.error(`[${def.key}] ends ${g.id}${g.supp ? " (gable-ends)" : ""}: lo ${e(g.ends.lo)} · hi ${e(g.ends.hi)}`);
    }
    for (const f of r1.endFit.findings) console.error(`[${def.key}] end-fit ${f.code} @ ${f.where}: ${f.detail}`);
    for (const h of r1.hipFitEvidence) {
      if (h.cap) {
        console.error(`[${def.key}] hip-cap ${h.massId}: FITTED — band ${h.cap.bandFloor}, apex ` +
          `${h.cap.apex.constructedY} (glb evidence ${h.cap.apex.glbMaxY}), faces ` +
          h.cap.faces.map((f) => `${f.dir} ${f.pitch} (${f.pitchSource})`).join(" · "));
      } else if (h.capFitted === false && h.findings.some((f) => f.code.startsWith("hip-cap"))) {
        console.error(`[${def.key}] hip-cap ${h.massId}: REFUSED`);
      }
      for (const e of h.hipEnds ?? []) {
        console.error(`[${def.key}] hip-ends ${e.id}: ` + ["lo", "hi"].map((end) =>
          `${end} ${e.fitted[end] ? `pitch ${e.fitted[end].pitch} (rmse ${e.fitted[end].rmse})` : "unfitted"}`).join(" · "));
      }
      for (const f of h.findings) console.error(`[${def.key}] hip-fit ${f.code} @ ${f.where}: ${f.detail}`);
    }
    for (const c of r1.components) {
      console.error(`[${def.key}] component ${c.massId}${c.role ? ` (${c.role})` : ""}: ` +
        `${c.swap.accepted ? `ACCEPTED (${c.swap.attempt})` : `FALLBACK — ${c.swap.reasons.join("; ")}`} ` +
        `[gables: ${c.gableIds.join(", ") || "—"}]`);
    }
    for (const a of r1.swap.attempts ?? []) {
      console.error(`[${def.key}] attempt ${a.massId}:${a.name}: ${a.accepted ? "ACCEPTED" : `rejected — ${a.reasons.join("; ")}`}`);
    }
    for (const rf of r1.ridgeFit) {
      const ix = rf.intersect.valid ? `intersect y ${rf.intersect.y} @ v ${rf.intersect.v} (Δ ${rf.deltaVsRecord})` : `intersect invalid: ${rf.intersect.reasons.join("; ")}`;
      const ax = rf.apexLine.reason ? `apex line ${rf.apexLine.reason}` : `apex line y ${rf.apexLine.height} slope ${rf.apexLine.slopeDeg}° len ${rf.apexLine.length} rmse ${rf.apexLine.rmse}`;
      console.error(`[${def.key}] ridge ${rf.id}: record y ${rf.recordY}; ${ix}; ${ax}`);
    }
    for (const t of r1.term?.trace ?? []) {
      console.error(`[${def.key}] termination ${t.step}: ${t.accepted ? `ACCEPTED (−${t.cells.removed ?? 0}/+${t.cells.added ?? 0})` : `rolled back — ${t.reasons.join("; ")}`}`);
    }
    for (const e of r1.residual.log) {
      console.error(`[${def.key}] residual ${e.id} (${e.size} cells): ${e.outcome}` +
        `${e.refutedAt?.length ? ` [refuted @ ${e.refutedAt.join(", ")}]` : ""}` +
        `${e.reasons.length ? ` — ${e.reasons.join("; ")}` : ""}`);
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
      const deg = ANGLE_DEG[angle];
      renders.push({ when: "before", ...(await tryRender(r1.raw, angle, `oblique${deg}-before`, subjDir)) });
      if (r1.artifact) renders.push({ when: "after", ...(await tryRender(r1.artifact, angle, `oblique${deg}-after`, subjDir)) });
    }
    for (const r of renders) console.error(`render ${r.when} ${r.angle}: ${r.path ?? `unavailable (${r.error})`}`);
    const frames = [];
    try {
      const pair = async (angle, name) => {
        const b = renders.find((r) => r.when === "before" && r.angle === angle && r.path);
        const a = renders.find((r) => r.when === "after" && r.angle === angle && r.path);
        if (!b || !a) return;
        await copyFile(join(ROOT, b.path), join(FRAMES_DIR, `${name}-before.png`));
        await copyFile(join(ROOT, a.path), join(FRAMES_DIR, `${name}-after.png`));
        frames.push(`pr/assets/frames/${name}-before.png`, `pr/assets/frames/${name}-after.png`);
      };
      await pair(OBLIQUE, `roof-${def.key}`);
      // T-108-01: the AC's named gable-end views
      for (const angle of END_FRAME_ANGLES) await pair(angle, `roof-${def.key}-end${ANGLE_DEG[angle]}`);
      // T-112-01: the cap views — when a hip-cap hypothesis was attempted, the 45°/135° pairs
      // (the azimuths whose judge verdicts named the church tower cap; generic per subject)
      if (r1.hipFitEvidence.some((h) => h.cap || h.capFitted === false)) {
        for (const angle of ["+x+z", "+x-z"]) await pair(angle, `roof-${def.key}-cap${ANGLE_DEG[angle]}`);
      }
      // T-109-01: the ridge-profile view — side-on to the dominant accepted gable's ridge line
      if (r1.ridgeAngle) {
        renders.push({ when: "before", ...(await tryRender(r1.raw, r1.ridgeAngle, "ridge-before", subjDir)) });
        if (r1.artifact) renders.push({ when: "after", ...(await tryRender(r1.artifact, r1.ridgeAngle, "ridge-after", subjDir)) });
        await pair(r1.ridgeAngle, `roof-${def.key}-ridge`);
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
        endFit: { ...END_FIT_DEFAULTS },
        ridgeFit: { ...RIDGE_FIT_DEFAULTS },
        iouTolerance: REGULARIZE_DEFAULTS.iouTolerance, grid: REGULARIZE_DEFAULTS.grid,
        spikeFaces: REGULARIZE_DEFAULTS.spikeFaces, azimuths: MULTI_ANGLE_GATE.azimuths,
        note: "fit + cage parameters (declared, shared across subjects — no tuning); azimuths config-frozen",
      },
      fit: { gables: r1.fit.gables.map(gableRecordView), findings: r1.fit.findings },
      // T-108-01: the gable-end fit — face plane / verge tip per end, GLB measurements and the
      // as-built anchor recorded; `suppressed` carries the ends only hip suppression exposed
      endFit: r1.endFit,
      // T-109-01: the ridge fit — plane-intersection construction per gable (the ladder's
      // ridge-fit rungs realize it; the cage arbitrates) + the GLB apex line as mesh-space
      // EVIDENCE (height/direction/length/rmse — never applied as an absolute height)
      ridgeFit: { schema: "roof-ridge-fit/v1", gables: r1.ridgeFit,
        note: "intersect = the ridge constructed from the FITTED side planes; apexLine = the GLB " +
          "apex measured under the aabb alignment (evidence only — vertical absolutes are " +
          "unreliable, the roof-end-fit lesson)" },
      // T-109-01: upper-edge terminations — unconsumed planes clamped to their own fitted
      // planes, one cage-judged step per plane (trace = regularizeShell's, rollbacks included)
      terminations: { schema: TERMINATE_SCHEMA,
        planes: r1.termPlanes.map((p) => ({ id: p.plane.id, kind: p.kind, area: p.plane.extent.area })),
        trace: r1.term?.trace ?? [], accepted: r1.term?.accepted ?? 0, rejected: r1.term?.rejected ?? 0,
        iou: r1.term?.iou ?? null },
      // T-109-01: the silhouette-residual pass — the chimneyColumns candidate set arbitrated
      // against the GLB; every exempt/removed/rolled-back decision with per-azimuth spill px
      residual: { schema: RESIDUAL_SCHEMA, dilationPx: r1.residual.dilationPx,
        removedCells: r1.residual.removedCells, log: r1.residual.log,
        note: "exempt ⇔ spill-free at every gate azimuth after the one-voxel dilation (a mass " +
          "the GLB contains); refuted at ≥1 azimuth → removed under the cage (IoU floors, " +
          "closure no-regress), rolled back named otherwise" },
      // T-112-01: the hip/pyramid fit — cap evidence per refused component (faces, constructed
      // apex with the GLB apex as evidence, footprint) + per-end fitted hip pitches; every
      // refusal named. The cap realizes as a FOUR-SIDED gable through the shared surface
      // definition; the cage arbitrates it as the ladder's appended tail rung.
      hipFit: {
        schema: HIP_FIT_SCHEMA,
        params: { ...HIP_FIT_DEFAULTS },
        components: r1.hipFitEvidence.map(({ capGable, ...h }) => h),
        note: "positions as-built (band-floor cross-section, bbox eave edges); slopes from " +
          "recorded planes else GLB quadrant normals; apex CONSTRUCTED and sanity-bounded by " +
          "the as-built top — glbMaxY is evidence, never applied (the aabb-affine lesson)",
      },
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
        note: "protrusions (≥4/6 faces exposed) restricted to the carved footprint at/above the " +
          "band floor, chimney columns excluded. The honest residual is the ridge line's two end " +
          "cells per gable plus two rake-corner cells per fitted end (4 exposed faces by " +
          "geometry) — the declared budget asserted by this run.",
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
  const findings = [...r.fit.findings, ...(r.endFit?.findings ?? []),
    ...(r.hipFit?.components ?? []).flatMap((h) => h.findings ?? []), ...r.swap.findings]
    .map((f) => `- \`${f.code}\` @ ${f.where ?? "—"}: ${f.detail}`).join("\n") || "- (none)";
  const hipRows = (r.hipFit?.components ?? []).map((h) => {
    const cap = h.cap
      ? `cap **FITTED** — band ${h.cap.bandFloor}, apex ${h.cap.apex.constructedY} (glb evidence ` +
        `${h.cap.apex.glbMaxY}); faces ${h.cap.faces.map((f) => `${f.dir} **${f.pitch}** (${f.pitchSource})`).join(", ")}`
      : "cap refused (named in findings)";
    const ends = (h.hipEnds ?? []).map((e) => `${e.id} ends: ` + ["lo", "hi"]
      .map((end) => `${end} ${e.fitted[end] ? `**${e.fitted[end].pitch}**` : "—"}`).join(" · ")).join("; ");
    return `- **${h.massId}**: ${[h.cap || h.capFitted === false ? cap : null, ends || null].filter(Boolean).join("; ")}`;
  }).join("\n");
  const ridgeRows = (r.ridgeFit?.gables ?? []).map((g) => {
    const ix = g.intersect.valid
      ? `intersect **y ${g.intersect.y}** @ v ${g.intersect.v} (Δ vs record ${g.deltaVsRecord})`
      : `intersect invalid (${g.intersect.reasons.join("; ")})`;
    const ax = g.apexLine.reason
      ? `GLB apex line: ${g.apexLine.reason}`
      : `GLB apex line: y ${g.apexLine.height}, slope ${g.apexLine.slopeDeg}°, length ${g.apexLine.length}, rmse ${g.apexLine.rmse}`;
    return `- **${g.id}**: record ridge y ${g.recordY}; ${ix}; ${ax}`;
  }).join("\n");
  const termRows = (r.terminations?.trace ?? []).map((t) =>
    `- \`${t.step}\`: ${t.accepted ? `accepted (−${t.cells.removed ?? 0}/+${t.cells.added ?? 0})` : `rolled back — ${t.reasons.join("; ")}`}`).join("\n");
  const residRows = (r.residual?.log ?? []).map((e) =>
    `- **${e.id}** (${e.size} cells): ${e.outcome}` +
    `${e.refutedAt?.length ? ` — refuted @ ${e.refutedAt.map((a) => `${a} (${e.perAzimuth[a].spillPx}px)`).join(", ")}` : ""}` +
    `${e.reasons.length ? ` — ${e.reasons.join("; ")}` : ""}`).join("\n");
  return `# Roof as program — ${r.subject} (T-104-01)\n\n` +
    `The sampled roof replaced by a roof GENERATED from parameters fitted against the component ` +
    `record's GLB fits — stair courses, slab half-steps, solid wedge — swapped under the T-102 ` +
    `cage, behind \`npm run roof:${r.subject}\`. **Status: ${r.status.toUpperCase()}**` +
    `${r.reproducible.sha256 ? ` — reproducible, artifact sha256 \`${r.reproducible.sha256.slice(0, 16)}…\`` : ""}.\n\n` +
    `## Fitted gables\n${gables}\n\n` +
    (r.endFit ? `## Fitted ends (T-108-01)\n` +
      ((r.endFit.gables.length || r.endFit.suppressed.length)
        ? [...r.endFit.gables, ...r.endFit.suppressed.map((g) => ({ ...g, supp: true }))].map((g) => {
            const e = (end) => end
              ? `face **${end.faceCoord}**, verge tip **${end.coord}** (overhang ${end.overhang}, glb face rmse ${end.glb.faceRmse}, anchor ${end.anchor.wall})`
              : "unfitted (named)";
            return `- **${g.id}**${g.supp ? " (gable-ends variant)" : ""}: lo ${e(g.ends.lo)}; hi ${e(g.ends.hi)}`;
          }).join("\n")
        : "- (no end fitted — every end is a named finding below)") +
      `\n\nEnds fitted in the accepted geometry: ${r.swap.generated.fittedEnds ?? 0}` +
      ((r.swap.generated.endCoords ?? []).length
        ? ` — ${r.swap.generated.endCoords.map((c) => `${c.id} [${c.lo ? `lo ${c.lo.coord}` : "lo —"} · ${c.hi ? `hi ${c.hi.coord}` : "hi —"}]`).join(", ")}`
        : "") + `\n\n`
      : "") +
    (r.components?.length
      ? `## Per-component outcomes (T-110-01)\n` + r.components.map((c) =>
          `- **${c.massId}**${c.role ? ` (${c.role})` : ""}: ${c.swap.accepted
            ? `ACCEPTED (\`${c.swap.attempt}\`)${c.swap.fitError?.length ? ` — rmse ${c.swap.fitError.map((e) => `${e.gableId} ${e.rmse}`).join(", ")}` : ""}`
            : `FALLBACK — ${c.swap.reasons.join("; ")}`} (gables: ${c.gableIds.join(", ") || "—"})`).join("\n") + `\n\n`
      : "") +
    (hipRows ? `## Hip/pyramid fit (T-112-01)\n${hipRows}\n\n` : "") +
    (ridgeRows ? `## Ridge fit (T-109-01)\n${ridgeRows}\n\nCap course cells in the accepted geometry: ` +
      `${r.swap.generated.counts.cap ?? 0}.\n\n` : "") +
    (r.terminations?.planes?.length
      ? `## Upper-edge terminations (T-109-01)\nPlanes: ${r.terminations.planes.map((p) => `${p.id} (${p.kind}, ${p.area})`).join(", ")} — ` +
        `${r.terminations.accepted} accepted / ${r.terminations.rejected} rolled back.\n${termRows}\n\n`
      : "") +
    (r.residual?.log?.length
      ? `## Silhouette residual (T-109-01)\nDilation ${r.residual.dilationPx}px (one voxel); removed ${r.residual.removedCells} cells.\n${residRows}\n\n`
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
    `## Renders (45°/135°/225°/315° — the gate azimuths; 45°/315° are the T-108 gable-end views)\n` +
    r.renders.map((f) => `- ${f.when} ${f.angle}: ${f.path ?? `GL unavailable (${f.error})`}`).join("\n") +
    `\n\nFrames: ${r.frames.join(", ") || "(none — GL unavailable)"}\n\n> ${r.lensNote}\n\n> ${r.swap.note}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
