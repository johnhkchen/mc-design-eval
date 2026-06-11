// IMPURE RUNNER — THE GENERATE-FIRST PROVISION MODE (E-29 / S-115 / T-115-01). The inversion the
// epic is named for: eleven epics of records say surfaces re-authored from fitted geometry pass and
// surfaces inherited from the voxelized TRELLIS blob fail — so here THE BLOB NEVER BECOMES THE
// BUILD. Per subject, from concept + GLB:
//
//   EVIDENCE — voxelize the GLB at the registry's generate-first scale; condition the blob IN
//   MEMORY with the chain's own shellStage (closure + the T-102 cage vs the GLB silhouettes). The
//   conditioned blob is FIT EVIDENCE and CAGE TARGET only; it is never written to any artifact path.
//   → FIT (src/form/provision-fit.mjs, pure) — the FULL component set: footprints, wallTops, roof
//     forms (gable/hip/pyramid via the complete T-112 vocabulary), opening groups; every fit error
//     recorded, tolerance-or-named-finding per component (E-29 Rule 1 — a failed fit is a
//     registered limitation, never a silent fallback to blob cells).
//   → GENERATE (src/form/provision-generate.mjs, pure) — every artifact cell authored from
//     parameters + kit; ZERO BLOB CELLS, machine-checked by provenance (assertGeneratedProvenance)
//     and re-proven by regenerating the artifact byte-identically from the SERIALIZED fit record.
//   → the E-24/E-26 SKIN + STRETCH — buildSkin (the S-113 authority composes the vocabulary), then
//     the SAME styledStretch styled-milestone runs (grammar → dressing → settle fixpoint) — the
//     settle op is shared, never re-implemented.
//   → THE FROZEN KIT-AWARE GATE — spawned through its own CLI (label "generated"; --reference
//     points the aperture fixpoint at the generated base, an input path like --artifact; the
//     judged contract is untouched — instrument-diff vs the committed styled-label record proves it).
//   → CAGE OUTCOMES (evidence): per-azimuth silhouette IoU of the styled build vs the GLB AND vs
//     the conditioned blob (the fit target), closure, spike/ragged census beside the declared
//     sheet/cap cells.
//   → HEAD-TO-HEAD: the comparison rows against the T-111 repair-path records
//     (reconstructed/<subj>.json; the styled/<subj>.json gate is cited where fresher). Losses are
//     findings with causes, never hidden (E-29 honesty).
//
// DETERMINISM (E-24 Rule 2 / E-25 Rule 5): evidence → fit → generate → skin → stretch is a pure
// function of the committed inputs; it runs TWICE per live invocation, all produced artifacts
// byte-compared; --repro re-proves from a fresh process (no GL, no judge); --offline re-asserts the
// committed record. GL renders are evidence, never inputs to a decision; the judge is the pinned
// model, one sample per view, verdicts committed as judged.
//
// HONEST FAILURE (E-25 Rule 6): a deterministic-stage THROW writes generated/<subj>.json with
// {status: "pipeline-failed", stage, error} and exits 1. Nothing is weakened; the record names the gap.
//
// GENERALIZATION (E-25 Rule 3): no subject keys, constants, branches, or thresholds in this file —
// subjects (and the generate-first scale) come from the durable-skin registry; the self-grep is
// embedded in every record.
//
// GL + METERED (gate judge) — run on demand, NOT in `npm test`:
//   npm run generated:<subj>                  # the full generate-first chain + frames + the gate
//   npm run generated:<subj> -- --repro       # fresh-process re-proof of the deterministic chain
//   npm run generated:<subj> -- --offline     # re-assert the committed record + artifacts
//
// Writes generated/<subj>.{json,md} (committed) + generated/<subj>/{base-,grammar-,}artifact.json +
// component-plan.json + provision-fit.json (committed) + PNGs (gitignored) + the gate's
// multi-angle/<subj>-generated.{json,md} + pr/assets/frames/multi-angle-<subj>-generated.png.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { artifactOccupancy, bareBlock } from "../../src/view/occupancy.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { MULTI_ANGLE_GATE_SCHEMA } from "../../src/form/multi-angle-gate.mjs";
import { voxelizeGlb } from "../../src/form/glb-voxelize.mjs";
import { keysToArtifact } from "../../src/form/glb-voxel-build.mjs";
import { parseGlbMesh } from "../../src/form/glb-mesh.mjs";
import { loadMeshFromGlb, rasterizeSilhouette } from "../../src/form/glb-silhouette.mjs";
import { resolveAngle } from "../../src/view/multi-angle.mjs";
import { scaleAlignment } from "../../src/form/component-glb-fit.mjs";
import {
  fitProvision, serializeProvisionFit, reviveProvisionFit,
} from "../../src/form/provision-fit.mjs";
import {
  generateProvision, assertGeneratedProvenance,
} from "../../src/form/provision-generate.mjs";
import { roofFamily } from "../../src/view/roof-generate.mjs";
import {
  COMPONENT_PLAN_SCHEMA, cornerColumnsFromSlabs, wallFacePredicate, roofFootprintFromRecord,
  serializeComponentPlan,
} from "../../src/view/component-plan.mjs";
import {
  protrusionCensus, raggedColumnRate, silhouetteIoUs, voxelSilhouettes,
} from "../../src/view/shell-regularize.mjs";
import { closureCheck, openingRegions } from "../../src/view/shell-integrity.mjs";

import { buildSkin, SUBJECTS } from "./durable-skin.mjs";
import { shellStage } from "./challenge-milestone.mjs";
import { styledStretch, spawnGate, distillGate } from "./styled-milestone.mjs";
import { renderSheet } from "./placement-grammar.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const OUT_DIR = join(HERE, "generated");
const FRAMES_DIR = join(ROOT, "pr/assets/frames");

const GATE_LABEL = "generated";
const RECORD_SCHEMA = "generated-milestone/v1";
const PIPELINE_ORDER = "evidence (voxelize @ registry scale → in-memory shellStage conditioning) → " +
  "provision-fit (full component set, named refusals) → provision-generate (zero blob cells, " +
  "provenance-checked + record-regenerated) → skin (S-113 authority) → styled stretch (shared " +
  "grammar/dressing/settle op) → frozen kit-aware gate (label generated) → cage evidence + head-to-head";

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const artifactJson = (a) => JSON.stringify(a, null, 2) + "\n";

// =================================================================================================
// THE DETERMINISTIC CORE — no GL, no judge, no writes (the chain writes via main's file seam).
// =================================================================================================

/** Evidence + fit + generate. The conditioned blob occupancy is returned for the cage ONLY. */
async function provisionStage(def, kitRec, track) {
  track.stage = "evidence";
  if (!def.generated?.scale) throw new Error(`registry entry ${def.key} has no generated.scale`);
  const glbPath = join(HERE, def.glb);
  if (!existsSync(glbPath)) throw new Error(`provision: ${def.glb} absent (gitignored binary — mint it per glb/README.md)`);
  const glbBytes = await readFile(glbPath);
  const meshTris = parseGlbMesh(glbBytes);
  const mesh = loadMeshFromGlb(glbBytes);
  const refSils = {};
  for (const a of MULTI_ANGLE_GATE.azimuths) refSils[a] = rasterizeSilhouette(mesh, { view: resolveAngle(a) });

  const blob = voxelizeGlb(glbBytes, { scale: def.generated.scale });
  // the blob as an artifact EXISTS ONLY IN MEMORY here — evidence conditioning input, never written
  const evidenceArtifact = keysToArtifact(blob, new Array(blob.count).fill("stone"), {
    metadata: { trial_id: `${def.key}-evidence` },
    style: { name: "evidence", rationale: "in-memory fit evidence — never a build substrate (E-29)" },
  });
  const conditioned = shellStage(evidenceArtifact, refSils);
  const evidenceOcc = artifactOccupancy(conditioned.artifact);

  track.stage = "provision-fit";
  const alignment = scaleAlignment(meshTris.bounds, def.generated.scale);
  const fit = fitProvision({ occ: evidenceOcc, glb: meshTris, alignment });

  track.stage = "provision-generate";
  const { mcData } = await import("../../render/src/version.mjs");
  const vocabNames = new Set(Object.keys(mcData().blocksByName));
  const family = roofFamily(kitRec?.kit ?? [], vocabNames);
  // NAMED-space storey bands from the COMMITTED concept-derived zone-map record (registry data):
  // generated walls paint per band so the skin's palette discipline finds every concept dominant
  // in the manifest (the skin re-derives bands on THIS geometry and repaints — generation supplies
  // presence, the skin supplies placement truth). Absent record → policy fallback, named.
  let bands = null;
  let sheetBlock = null;
  const bandSource = { record: def.zoneMapRecord ?? null, used: false };
  if (def.zoneMapRecord && existsSync(join(HERE, def.zoneMapRecord))) {
    const zm = JSON.parse(await readFile(join(HERE, def.zoneMapRecord), "utf8"));
    if (Array.isArray(zm.derived?.bands) && zm.derived.bands.length) {
      bands = zm.derived.bands.map((b) => ({ yRange: b.yRange, block: b.dominantBlock }));
      sheetBlock = zm.derived.roof?.dominantBlock ?? null;
      bandSource.used = true;
    }
  }
  const genOpts = { family, policy: def.policy, bands, sheetBlock,
    metadata: { trial_id: `${def.key}-generate-first` } };
  const gen = generateProvision(fit, genOpts);
  assertArtifact(gen.artifact);

  // AC #2 — the zero-blob machine check (provenance; coincidence with blob positions is the fit
  // working, so set-intersection is recorded as EVIDENCE below, never as the gate)
  const zeroBlob = assertGeneratedProvenance(gen.artifact, gen.provenance);

  // the check's teeth: the artifact must regenerate byte-identically from the SERIALIZED record
  const fitSerialized = serializeProvisionFit(fit);
  const regen = generateProvision(reviveProvisionFit(JSON.parse(JSON.stringify(fitSerialized))), genOpts);
  if (JSON.stringify(regen.artifact) !== JSON.stringify(gen.artifact)) {
    throw new Error("regenerate-from-record DIVERGES: the serialized provision fit does not reproduce the artifact");
  }

  // blob-overlap EVIDENCE (fit quality, explicitly not a gate)
  const ox = Math.floor(blob.dims[0] / 2);
  const oz = Math.floor(blob.dims[2] / 2);
  const blobKeys = new Set();
  for (let n = 0; n < blob.count; n++) {
    blobKeys.add(`${blob.occupied[n * 3] - ox},${blob.occupied[n * 3 + 1]},${blob.occupied[n * 3 + 2] - oz}`);
  }
  const overlapCells = gen.artifact.placements.filter((p) => blobKeys.has(p.pos.join(","))).length;

  return {
    scale: def.generated.scale, refSils, evidenceOcc, conditioned, fit, fitSerialized, family, gen,
    bandSource,
    zeroBlob: {
      ...zeroBlob,
      regeneratedFromRecord: true,
      blobOverlap: {
        cells: overlapCells,
        fraction: Math.round((overlapCells / gen.artifact.placements.length) * 1e4) / 1e4,
        note: "EVIDENCE of fit quality — overlap with blob POSITIONS is the cage working; the gate is provenance",
      },
    },
  };
}

/** The fit record distilled for the durable record (per component: tolerance-or-named-finding). */
function fitSummary(fit) {
  return {
    masses: fit.masses.map((m) => ({
      id: m.id, role: m.role, area: m.footprint.area, baseY: m.baseY,
      wallTop: m.wallTop, wallTopSource: m.wallTopSource, heightDisagreement: m.heightDisagreement,
      findings: m.findings.map((f) => f.code),
    })),
    roofs: fit.roofs.map((r) => ({
      massId: r.massId, kind: r.kind,
      gables: r.gables.map((g) => ({
        id: g.id, sane: g.sane,
        sides: (g.sides ?? []).map((s) => ({ planeId: s.planeId, pitch: s.pitch, pitchSource: s.pitchSource, eaveY: s.eaveY })),
        ends: g.ends ? { lo: g.ends.lo?.coord ?? null, hi: g.ends.hi?.coord ?? null } : null,
        capFit: g.capFit ? { eaveY: g.capFit.eaveY, apex: g.capFit.apex } : undefined,
      })),
      ridgeFit: r.ridgeFit.map((rf) => ({ id: rf.id, deltaVsRecord: rf.deltaVsRecord })),
      findings: r.findings.map((f) => f.code),
    })),
    openings: fit.openings.map((g) => ({
      id: g.id, dir: g.dir, kind: g.kind,
      heads: g.openings.map((o) => ({
        kind: o.head.kind,
        rmse: o.head.fitError?.rmse ?? null,
        refusal: o.head.kind === "none" ? o.head.finding.code : null,
      })),
    })),
    findings: fit.findings.map((f) => ({ code: f.code, where: f.where ?? null, stage: f.stage ?? null })),
  };
}

/** The grammar/settle consumption plan, assembled from the GENERATED build's own definitions. */
function assembleComponentPlan(prov) {
  const { fit, gen, family } = prov;
  const record = fit.record;
  const findings = [];
  let roof = null;
  if (gen.roofPlan && family?.field) {
    const colTop = new Map();
    for (const key of gen.occ.cells.keys()) {
      const [x, y, z] = key.split(",").map(Number);
      const ck = `${x},${z}`;
      if (!gen.roofPlan.footprintCols.has(ck)) continue;
      if (y > (colTop.get(ck) ?? -Infinity)) colTop.set(ck, y);
    }
    roof = {
      cells: gen.roofPlan.cells,
      footprintCols: gen.roofPlan.footprintCols,
      colTop,
      family: {
        field: bareBlock(family.field),
        stairs: family.stairs ? bareBlock(family.stairs) : null,
        slab: family.slab ? bareBlock(family.slab) : null,
      },
      source: "program",
    };
  } else {
    findings.push({ code: "roof-program-missing", detail: "no generated roof — roof courses fall back to occupancy derivation" });
  }
  const cornerCols = cornerColumnsFromSlabs(record.wallSlabs);
  const frames = cornerCols.size
    ? { cornerCols, roofFootprintCols: roof ? roof.footprintCols : roofFootprintFromRecord(record), rooflineSource: roof ? "program" : "record" }
    : null;
  if (!frames) findings.push({ code: "component-corners-empty", detail: "wall slabs define no corner intersections" });
  const wallFaces = wallFacePredicate(record);
  const bodyTops = fit.masses.filter((m) => m.role !== "protrusion").map((m) => m.wallTop);
  const wallTop = bodyTops.length ? Math.max(...bodyTops) + 1 : null;
  return { schema: COMPONENT_PLAN_SCHEMA, roof, frames, wallFaces, wallTop, findings };
}

/** The full deterministic chain: provision → skin → the SHARED styled stretch. */
async function generatedChain(def, kitRec, paths, track) {
  const prov = await provisionStage(def, kitRec, track);
  await writeFile(paths.baseAbs, artifactJson(prov.gen.artifact));
  await writeFile(paths.fitAbs, JSON.stringify(prov.fitSerialized, null, 2) + "\n");

  track.stage = "skin";
  const plan = assembleComponentPlan(prov);
  const skin = await buildSkin({ ...def, build: paths.baseRel, zoneMapRecord: null, componentPlan: plan });
  // the skin ARBITRATES the wall-top pin (challenge-chain precedent) — persist the EFFECTIVE value
  // so grammar/settle and the gate's kit-presence fixpoint re-run the SAME op
  plan.wallTopEffective = skin.zones.upperTop;
  await writeFile(paths.planAbs, JSON.stringify(serializeComponentPlan(plan), null, 2) + "\n");

  const stretch = styledStretch({ def, kitRec, base: prov.gen.artifact, skin, reconstruction: { plan }, track });
  return { ...prov, plan, skin, ...stretch };
}

// =================================================================================================
// EVIDENCE READERS (cage, census, instrument, head-to-head) — record-shaping, no decisions.
// =================================================================================================

/** Census on the styled build, beside the DECLARED sheet/cap cells (spike-census lesson: declared
 *  open-underside constructions inflate the naive ≥4/6 count — reported, never smoothed). */
function censusOf(occ, gen) {
  const spikes = protrusionCensus(occ);
  const ragged = raggedColumnRate(occ);
  return {
    spikes: spikes.spikes,
    ragged: ragged.ragged, columns: ragged.total,
    raggedRate: Math.round(ragged.rate * 1e4) / 1e4,
    declared: {
      sheetCells: gen.roofPlan?.sheetKeys?.size ?? 0,
      capCells: gen.roofPlan?.capKeys?.size ?? 0,
      note: "open-underside sheet courses and ridge caps are declared constructions (T-108/109)",
    },
  };
}

/** AC #3 — cage outcomes: IoU vs the GLB silhouettes AND vs the conditioned blob (the fit target),
 *  plus 6-direction closure. Evidence recorded, never a verdict. */
function cageOutcomes(styledArtifact, prov) {
  const occ = artifactOccupancy(styledArtifact);
  const azimuths = [...MULTI_ANGLE_GATE.azimuths];
  const blobSils = voxelSilhouettes(prov.evidenceOcc, azimuths);
  const closure = closureCheck(occ, { regions: openingRegions(occ) });
  return {
    iouVsGlb: silhouetteIoUs(occ, prov.refSils),
    iouVsBlob: silhouetteIoUs(occ, blobSils),
    blobIouVsGlb: silhouetteIoUs(prov.evidenceOcc, prov.refSils), // the evidence ceiling, for scale
    closure: { reached: closure.reached ?? null, byDirection: closure.byDirection ?? null },
    conditioning: {
      regularize: { accepted: prov.conditioned.regularize.accepted, rejected: prov.conditioned.regularize.rejected },
      note: "in-memory evidence conditioning (closure + T-102 cage on the blob) — never written, never copied",
    },
  };
}

/** Instrument-diff receipts vs the committed styled-label gate record (same-ruler proof). */
function instrumentDiff(committedGate, freshGate) {
  if (!freshGate) return { frozen: false, comparedTo: null, diffs: ["no fresh gate record"], judgeModels: [] };
  const diffs = [];
  const judgeModels = [...new Set((freshGate.views ?? []).map((v) => v.judge?.model).filter(Boolean))];
  if (!committedGate) {
    return { frozen: true, comparedTo: "config (no committed styled-label record)", diffs, judgeModels };
  }
  const fields = ["azimuths", "elevationDeg", "width", "height", "gapBudget", "coverageThreshold"];
  for (const f of fields) {
    const want = JSON.stringify(committedGate.contract?.[f] ?? null);
    const got = JSON.stringify(freshGate.contract?.[f] ?? null);
    if (want !== got) diffs.push(`contract.${f}: styled ${want} → generated ${got}`);
  }
  const committedModels = new Set((committedGate.views ?? []).map((v) => v.judge?.model).filter(Boolean));
  for (const m of judgeModels) {
    if (committedModels.size && !committedModels.has(m)) diffs.push(`judge.model: ${m} not among styled-label models`);
  }
  return { frozen: diffs.length === 0, comparedTo: "committed styled-label gate record", diffs, judgeModels };
}

/** AC #4 — the head-to-head row: this run beside the committed repair-path verdicts. */
async function headToHead(def, gate, census, fit) {
  const read = async (rel) => {
    const p = join(HERE, rel);
    return existsSync(p) ? JSON.parse(await readFile(p, "utf8")) : null;
  };
  const reconstructed = await read(`reconstructed/${def.key}.json`);
  const styledRec = await read(`styled/${def.key}.json`);
  const repair = {
    source: null, outcome: null, gapCount: null, gapBudget: null, perView: null,
    kitPresence: null, census: null,
  };
  if (reconstructed) {
    repair.source = `reconstructed/${def.key}.json (T-111-01)`;
    repair.outcome = reconstructed.chain?.gate?.outcome ?? reconstructed.chain?.status ?? null;
    repair.gapCount = reconstructed.chain?.gate?.resemblance?.gapCount ?? null;
    repair.gapBudget = reconstructed.chain?.gate?.resemblance?.gapBudget ?? null;
    repair.perView = (reconstructed.chain?.gate?.perView ?? []).map((v) => ({ angle: v.angle, verdict: v.verdict, gaps: (v.gaps ?? []).length }));
    repair.kitPresence = reconstructed.chain?.gate?.kitPresence?.passed ?? null;
    repair.census = reconstructed.metrics?.census?.after ?? null;
  }
  if (styledRec?.gate && styledRec.status !== "pipeline-failed") {
    // the freshest repair-path verdict (post-T-113 settles supersede a T-111 settle refusal) — cited
    repair.freshest = {
      source: `styled/${def.key}.json`,
      outcome: styledRec.gate.outcome ?? null,
      gapCount: styledRec.gate.resemblance?.gapCount ?? null,
      kitPresence: styledRec.gate.kitPresence?.passed ?? null,
    };
  }
  return {
    subject: def.key,
    generated: {
      outcome: gate?.outcome ?? null,
      gapCount: gate?.resemblance?.gapCount ?? null,
      gapBudget: gate?.resemblance?.gapBudget ?? null,
      perView: (gate?.perView ?? []).map((v) => ({ angle: v.angle, verdict: v.verdict, gaps: (v.gaps ?? []).length })),
      kitPresence: gate?.kitPresence?.passed ?? null,
      census: { spikes: census.spikes, ragged: census.ragged, raggedRate: census.raggedRate },
      fitRefusals: fit.findings.filter((f) => f.code).length,
    },
    repairPath: repair,
  };
}

/** E-25 Rule 3 self-grep: no subject keys in this runner. */
async function generalizationGrep() {
  const src = await readFile(fileURLToPath(import.meta.url), "utf8");
  const hits = Object.keys(SUBJECTS).filter((k) => src.includes(k));
  return { subjectKeysInRunner: hits, clean: hits.length === 0 };
}

function renderMd(r) {
  if (r.status === "pipeline-failed") {
    return `# generated milestone — ${r.subject} (T-115-01, E-29)\n\n**PIPELINE FAILED** at stage ` +
      `\`${r.stage}\`:\n\n> ${r.error}\n\nRecorded honestly (E-25 Rule 6); nothing was tuned in response.\n`;
  }
  const h = r.headToHead;
  const viewRow = (vs) => (vs ?? []).map((v) => `${v.angle} ${v.verdict ?? "—"} (${v.gaps})`).join("; ");
  return `# generated milestone — ${r.subject} (T-115-01, E-29 generate-first)\n\n` +
    `**The blob never became the build**: ${r.zeroBlob.cells} cells, all generator-tagged ` +
    `(${Object.entries(r.zeroBlob.bySource).map(([k, n]) => `${k} ${n}`).join(", ")}); ` +
    `regenerated byte-identically from the serialized fit record; blob-position overlap ` +
    `${(r.zeroBlob.blobOverlap.fraction * 100).toFixed(1)}% (fit-quality evidence, not a gate).\n\n` +
    `**Gate (frozen, label \`generated\`):** ${r.gate.outcome} — resemblance ` +
    `${r.gate.resemblance?.gapCount ?? "?"}/${r.gate.resemblance?.gapBudget ?? "?"} gaps, kit presence ` +
    `${r.gate.kitPresence?.passed === true ? "PASS" : r.gate.kitPresence?.passed === false ? "FAIL" : "—"}. ` +
    `Instrument: ${r.instrument.frozen ? "frozen, diffs []" : `DIFFS ${JSON.stringify(r.instrument.diffs)}`}.\n\n` +
    `| | generate-first | repair path (${h.repairPath.source ?? "—"}) |\n|---|---|---|\n` +
    `| outcome | ${h.generated.outcome} | ${h.repairPath.outcome ?? "—"} |\n` +
    `| gaps | ${h.generated.gapCount ?? "—"}/${h.generated.gapBudget ?? "—"} | ${h.repairPath.gapCount ?? "—"}/${h.repairPath.gapBudget ?? "—"} |\n` +
    `| per-view | ${viewRow(h.generated.perView)} | ${viewRow(h.repairPath.perView)} |\n` +
    `| kit presence | ${h.generated.kitPresence} | ${h.repairPath.kitPresence ?? "—"} |\n` +
    `| census (spikes/ragged%) | ${h.generated.census.spikes} / ${(h.generated.census.raggedRate * 100).toFixed(1)}% | ` +
    `${h.repairPath.census ? `${h.repairPath.census.spikes} / ${(h.repairPath.census.raggedRate * 100).toFixed(1)}%` : "—"} |\n` +
    (h.repairPath.freshest ? `\nFreshest repair-path verdict (cited): \`${h.repairPath.freshest.source}\` — ` +
      `${h.repairPath.freshest.outcome}, ${h.repairPath.freshest.gapCount} gaps, kit presence ${h.repairPath.freshest.kitPresence}.\n` : "") +
    `\nCage (evidence): IoU vs GLB ${JSON.stringify(r.cage.iouVsGlb)}; vs blob ${JSON.stringify(r.cage.iouVsBlob)} ` +
    `(evidence ceiling ${JSON.stringify(r.cage.blobIouVsGlb)}).\n\n` +
    `Fit refusals (E-29 Rule 1, every one named): ${r.fit.findings.length ? r.fit.findings.map((f) => `\`${f.code}\``).join(", ") : "none"}.\n` +
    `\nCanonical records: \`benchmarks/sculpture/generated/${r.subject}.json\`, \`${r.gate.record}\`.\n`;
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
    baseRel: `generated/${def.key}/base-artifact.json`,
    grammarRel: `generated/${def.key}/grammar-artifact.json`,
    finalRel: `generated/${def.key}/artifact.json`,
    fitRel: `generated/${def.key}/provision-fit.json`,
    planRel: `generated/${def.key}/component-plan.json`,
  };
  for (const k of ["base", "grammar", "final", "fit", "plan"]) paths[`${k}Abs`] = join(HERE, paths[`${k}Rel`]);
  const gateRecPath = join(HERE, "multi-angle", `${def.key}-${GATE_LABEL}.json`);
  await mkdir(subjDir, { recursive: true });

  if (offline) {
    if (!existsSync(recPath)) throw new Error(`committed record absent — run npm run generated:${def.key} first`);
    const rec = JSON.parse(await readFile(recPath, "utf8"));
    if (rec.status === "pipeline-failed") {
      console.error(`[offline] ${def.key}: recorded status pipeline-failed at stage "${rec.stage}" — ${rec.error}`);
      process.exitCode = 1;
      return;
    }
    const shaOf = async (p) => sha256(await readFile(p, "utf8"));
    for (const p of [paths.baseAbs, paths.grammarAbs, paths.finalAbs]) assertArtifact(JSON.parse(await readFile(p, "utf8")));
    const gateRec = existsSync(gateRecPath) ? JSON.parse(await readFile(gateRecPath, "utf8")) : null;
    const want = rec.reproducible?.sha256 ?? {};
    const checks = {
      schema: rec.schema === RECORD_SCHEMA,
      base: (await shaOf(paths.baseAbs)) === want.base,
      grammar: (await shaOf(paths.grammarAbs)) === want.grammarFinal,
      styled: (await shaOf(paths.finalAbs)) === want.styled,
      fit: (await shaOf(paths.fitAbs)) === want.fit,
      zeroBlob: rec.zeroBlob?.passed === true,
      gate: gateRec?.schema === MULTI_ANGLE_GATE_SCHEMA && gateRec?.label === GATE_LABEL &&
        (gateRec?.aggregate?.decided === true) !== (typeof gateRec?.aggregate?.refusal === "string"),
      sheet: typeof rec.gate?.sheet === "string" && existsSync(join(ROOT, rec.gate.sheet)),
    };
    const ok = Object.values(checks).every(Boolean);
    console.error(`[offline] ${def.key}: artifact shas ${checks.base && checks.grammar && checks.styled && checks.fit ? "MATCH" : "DIVERGE"}; ` +
      `zero-blob ${checks.zeroBlob ? "recorded" : "MISSING"}; gate record ${checks.gate ? "well-formed" : "MISSING/MALFORMED"}; ` +
      `sheet ${checks.sheet ? "present" : "MISSING"}; AJV ok — recorded gate outcome: ${rec.gate?.outcome ?? "?"}`);
    if (!ok) process.exitCode = 1;
    return;
  }

  // the kit precondition (E-26 Rule 2): committed, immutable input
  const kitPath = def.kitRecord && join(HERE, def.kitRecord);
  if (!kitPath || !existsSync(kitPath)) throw new Error(`no committed kit record (registry kitRecord=${def.kitRecord ?? "null"})`);
  const kitRec = JSON.parse(await readFile(kitPath, "utf8"));
  if (kitRec.schema !== "kit/v1") throw new Error(`${def.kitRecord} is not a kit/v1 record`);
  const kitSha = sha256(JSON.stringify(kitRec));

  if (repro) {
    if (!existsSync(recPath)) throw new Error(`committed record absent — run npm run generated:${def.key} first`);
    const rec = JSON.parse(await readFile(recPath, "utf8"));
    if (rec.status === "pipeline-failed") {
      console.error(`[repro] ${def.key}: recorded status is pipeline-failed — nothing to reproduce`);
      process.exitCode = 1;
      return;
    }
    const r = await generatedChain(def, kitRec, paths, {});
    const got = {
      base: sha256(artifactJson(r.gen.artifact)),
      grammarFinal: sha256(artifactJson(r.grammar.final)),
      styled: sha256(artifactJson(r.styled)),
      fit: sha256(JSON.stringify(r.fitSerialized, null, 2) + "\n"),
    };
    const want = rec.reproducible?.sha256 ?? {};
    const same = got.base === want.base && got.grammarFinal === want.grammarFinal &&
      got.styled === want.styled && got.fit === want.fit;
    console.error(`[repro] ${def.key}: fresh-process chain ${same ? "REPRODUCES the committed artifacts" : "DIVERGES"} ` +
      `(styled ${got.styled.slice(0, 12)}… vs ${String(want.styled).slice(0, 12)}…)`);
    if (!same) process.exitCode = 1;
    return;
  }

  await mkdir(FRAMES_DIR, { recursive: true });

  // --- THE DETERMINISTIC CHAIN, TWICE (Rule 5: byte-equal or no record) ---------------------------
  let r1;
  const track = { stage: "evidence" };
  try {
    r1 = await generatedChain(def, kitRec, paths, track);
    const r2 = await generatedChain(def, kitRec, paths, { ...track });
    for (const [stage, a, b] of [
      ["generated-base", r1.gen.artifact, r2.gen.artifact],
      ["skin-final", r1.skin.final, r2.skin.final],
      ["grammar-final", r1.grammar.final, r2.grammar.final],
      ["styled", r1.styled, r2.styled],
    ]) {
      if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`NON-DETERMINISTIC: two in-process runs diverge at the ${stage} artifact`);
    }
  } catch (e) {
    const record = {
      schema: RECORD_SCHEMA, subject: def.key, status: "pipeline-failed", stage: track.stage, error: e.message,
      inputs: { concept: def.concept, glb: def.glb, map: def.map, kitRecord: def.kitRecord, kitSha256: kitSha, scale: def.generated?.scale ?? null },
      note: "a deterministic stage threw — recorded honestly (E-25 Rule 6); nothing was tuned in response",
    };
    await writeFile(recPath, JSON.stringify(record, null, 2) + "\n");
    await writeFile(join(OUT_DIR, `${def.key}.md`), renderMd(record));
    console.error(`[${def.key}] PIPELINE FAILED at ${track.stage}: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  // --- persist the chain's artifacts (the inspectable file seam) ----------------------------------
  await writeFile(paths.grammarAbs, artifactJson(r1.grammar.final));
  await writeFile(paths.finalAbs, artifactJson(r1.styled));

  // --- evidence renders (a lens, never logic) ------------------------------------------------------
  let sheets = {};
  try {
    const s = await renderSheet(r1.styled, "generated", subjDir);
    sheets = { generated: s.sheetPath.replace(ROOT, ""), renders: s.renders };
  } catch (e) {
    sheets = { error: e.message };
  }

  // --- THE FROZEN GATE (spawned, label "generated", aperture reference = the generated base) ------
  console.error(`\n[${def.key}] spawning the kit-aware multi-angle gate (label "${GATE_LABEL}")…`);
  const gateCode = await spawnGate(def.key, paths.finalRel, GATE_LABEL, ["--reference", paths.baseRel]);
  const gateRec = existsSync(gateRecPath) ? JSON.parse(await readFile(gateRecPath, "utf8")) : null;
  const gate = distillGate(gateRec, def.key, gateCode, GATE_LABEL);

  // --- receipts + evidence -------------------------------------------------------------------------
  const styledGateRecPath = join(HERE, "multi-angle", `${def.key}-styled.json`);
  const committedStyledGate = existsSync(styledGateRecPath) ? JSON.parse(await readFile(styledGateRecPath, "utf8")) : null;
  const instrument = instrumentDiff(committedStyledGate, gateRec);
  const census = censusOf(artifactOccupancy(r1.styled), r1.gen);
  const cage = cageOutcomes(r1.styled, r1);
  const h2h = await headToHead(def, gate, census, r1.fit);
  const generalization = await generalizationGrep();

  const record = {
    schema: RECORD_SCHEMA,
    subject: def.key,
    status: "gated",
    pipelineOrder: PIPELINE_ORDER,
    inputs: {
      concept: def.concept, glb: def.glb, map: def.map, kitRecord: def.kitRecord, kitSha256: kitSha,
      scale: r1.scale, alignment: "registry-scale", generationBands: r1.bandSource,
    },
    fit: fitSummary(r1.fit),
    generation: { counts: r1.gen.counts, findings: r1.gen.findings }, // Rule 1: omissions are named HERE
    zeroBlob: r1.zeroBlob,
    cage,
    census,
    skin: { upperTop: r1.skin.zones.upperTop, zoneMapSource: r1.skin.zoneMap?.source ?? null },
    settle: r1.settle,
    gate,
    instrument,
    headToHead: h2h,
    generalization,
    reproducible: {
      doubleRun: "byte-identical (in-process)",
      sha256: {
        base: sha256(artifactJson(r1.gen.artifact)),
        grammarFinal: sha256(artifactJson(r1.grammar.final)),
        styled: sha256(artifactJson(r1.styled)),
        fit: sha256(JSON.stringify(r1.fitSerialized, null, 2) + "\n"),
      },
    },
    sheets,
    artifacts: { base: paths.baseRel, grammar: paths.grammarRel, final: paths.finalRel, fitRecord: paths.fitRel, plan: paths.planRel },
  };
  await writeFile(recPath, JSON.stringify(record, null, 2) + "\n");
  await writeFile(join(OUT_DIR, `${def.key}.md`), renderMd(record));
  console.error(`\n✓ wrote benchmarks/sculpture/generated/${def.key}.{json,md} — gate ${gate.outcome}; ` +
    `zero-blob ${record.zeroBlob.passed ? "PASS" : "FAIL"} (${record.zeroBlob.cells} cells, overlap ` +
    `${(record.zeroBlob.blobOverlap.fraction * 100).toFixed(1)}%); instrument ${instrument.frozen ? "frozen" : "DIFFS"}`);
  process.exitCode = gateCode;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
