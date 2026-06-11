// PURE CORE — T-115-01 (E-29 / S-115): the generate-first FIT stage. The voxelized TRELLIS blob is
// FIT EVIDENCE here — `occ` is the conditioned evidence occupancy, never a build substrate. This
// module derives the FULL component set the generator needs (footprints, storey tops, roof forms,
// opening groups) by orchestrating the existing fitters, and records a tolerance-or-named-finding
// per component (E-29 Rule 1: a failed fit on this path is a registered limitation — a NAMED
// generated fallback, never a silent copy of blob cells).
//
// No I/O, no GL, no model calls; deterministic over its inputs. The serialized record round-trips
// (serializeProvisionFit / reviveProvisionFit) so the runner can re-prove the generated artifact
// from the recorded parameters alone (the zero-blob check's teeth).

import { decompose } from "./component-decompose.mjs";
import { gablesFromRecord } from "./roof-fit.mjs";
import { fitGableEnds, alignedTriangles } from "./roof-end-fit.mjs";
import { ridgeFromPlanes, fitRidgeLine } from "./roof-ridge-fit.mjs";
import { fitHipCap, fitHipEnds } from "./roof-hip-fit.mjs";
import { fitOpeningHead } from "./shaped-fit.mjs";
import { componentGableGroups } from "./component-roof.mjs";

export const PROVISION_FIT_SCHEMA = "provision-fit/v1";

export const PROVISION_FIT_DEFAULTS = Object.freeze({
  minRunWidth: 2, // a footprint run narrower than this is a degenerate-run finding (still generated)
});

const finding = (code, where, detail) => ({ code, where, detail });

/** Footprint bbox/area over decompose plan runs (runs are the parameters; this is bookkeeping). */
function footprintOfRuns(runs) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, area = 0;
  for (const r of runs) {
    if (r.x0 < minX) minX = r.x0;
    if (r.x1 > maxX) maxX = r.x1;
    if (r.z < minZ) minZ = r.z;
    if (r.z > maxZ) maxZ = r.z;
    area += r.x1 - r.x0 + 1;
  }
  return { bbox: { minX, maxX, minZ, maxZ }, area };
}

/**
 * Fit the full component set from the conditioned evidence occupancy + the GLB reference.
 *
 * @param {object} args
 * @param {import("../view/occupancy.mjs").Occupancy} args.occ conditioned blob occupancy (EVIDENCE)
 * @param {{positions:number[]|Float64Array, triangleCount:number, bounds:object}|null} args.glb
 *   parseGlbMesh output (null = no GLB reference; voxel-only fits, named)
 * @param {object|null} args.alignment scaleAlignment/aabbAlignment result
 * @param {object} [args.opts] {decompose, fit} tolerance overrides
 * @returns {{schema:string, record:object, masses:object[], roofs:object[], openings:object[],
 *            findings:object[]}}
 */
export function fitProvision({ occ, glb = null, alignment = null, opts = {} } = {}) {
  if (!occ) throw new Error("fitProvision: occ (conditioned evidence occupancy) required");
  const o = { ...PROVISION_FIT_DEFAULTS, ...(opts.fit ?? {}) };
  const findings = [];

  // 1. decompose the EVIDENCE — masses, roof planes, wall slabs, opening groups (fresh; committed
  //    repair-path records are pinned to a different substrate and are never read here)
  const record = decompose(occ, { glb, alignment, opts: opts.decompose ?? {} });
  findings.push(...(record.findings ?? []).map((f) => ({ ...f, stage: "decompose" })));

  // 2. roof fits — the existing ladder of pure fitters, refusals carried verbatim
  const fit = gablesFromRecord(record);
  findings.push(...fit.findings.map((f) => ({ ...f, stage: "roof-fit" })));
  let gables = fit.gables;
  if (glb && alignment) {
    const endFit = fitGableEnds(gables, occ, glb, alignment);
    findings.push(...endFit.findings.map((f) => ({ ...f, stage: "roof-end-fit" })));
    gables = endFit.gables;
  } else {
    findings.push(finding("glb-reference-missing", "roof-ends",
      "no GLB reference — gable ends stay untrimmed (voxel extents)"));
  }
  const tris = glb && alignment ? alignedTriangles(glb, alignment) : [];

  const grouping = componentGableGroups({ record, gables });
  findings.push(...(grouping.findings ?? []).map((f) => ({ ...f, stage: "roof-grouping" })));

  const roofs = [];
  for (const grp of grouping.groups) {
    const sane = grp.gables.filter((g) => g.sane);
    if (!sane.length) {
      // ridge-pair hypothesis refuted for this mass → the T-112 hip/pyramid cap rung
      const capRes = fitHipCap({ record, massId: grp.massId, gables: grp.gables, occ, tris });
      findings.push(...(capRes.findings ?? []).map((f) => ({ ...f, stage: "hip-cap-fit" })));
      if (capRes.gable) {
        roofs.push({ massId: grp.massId, role: grp.role, kind: "hip-cap",
          gables: [capRes.gable], ridgeFit: [], findings: capRes.findings ?? [] });
      } else {
        // E-29 Rule 1: the refusal is a REGISTERED LIMITATION — the mass generates flat-topped at
        // its own wallTop (a named, visible fallback), never a copy of the blob roof cells.
        const f = finding("roof-unfitted", grp.massId,
          "every roof hypothesis refused (ridge-pair insane, hip-cap refused) — mass generates flat-topped");
        findings.push({ ...f, stage: "roof-fit" });
        roofs.push({ massId: grp.massId, role: grp.role, kind: "flat-cap", gables: [],
          ridgeFit: [], findings: [f] });
      }
      continue;
    }
    let grpGables = sane;
    if (grpGables.some((g) => g.hip?.demanded) && tris.length) {
      const hipEndsRes = fitHipEnds(grpGables, tris);
      findings.push(...(hipEndsRes.findings ?? []).map((f) => ({ ...f, stage: "hip-end-fit" })));
      grpGables = hipEndsRes.gables;
    }
    const ridgeFit = grpGables.map((g) => {
      const intersect = ridgeFromPlanes(g);
      return {
        id: g.id, recordY: g.ridge.y, intersect,
        deltaVsRecord: intersect.valid ? Math.round((intersect.y - g.ridge.y) * 1e3) / 1e3 : null,
        apexLine: tris.length ? fitRidgeLine(g, tris) : null,
      };
    });
    roofs.push({ massId: grp.massId, role: grp.role, kind: "gable", gables: grpGables, ridgeFit,
      findings: [] });
  }

  // 3. masses — footprint runs ARE the fitted parameters; wallTop arbitrated eave-fit → mass-top
  const roofByMass = new Map(roofs.map((r) => [r.massId, r]));
  const masses = (record.masses ?? []).map((m) => {
    const mFindings = [];
    const runs = m.plan?.runs ?? [];
    for (const r of runs) {
      if (r.x1 - r.x0 + 1 < o.minRunWidth) {
        mFindings.push(finding("footprint-degenerate-run", m.id,
          `run z=${r.z} width ${r.x1 - r.x0 + 1} < minRunWidth ${o.minRunWidth} (generated as fitted)`));
      }
    }
    const roof = roofByMass.get(m.id) ?? null;
    let wallTop = m.yRange[1];
    let wallTopSource = "mass-top";
    if (roof?.kind === "gable") {
      const eaves = roof.gables.flatMap((g) => g.sides.map((s) => Math.floor(s.eaveY)));
      if (eaves.length) { wallTop = Math.min(...eaves); wallTopSource = "eave-fit"; }
    } else if (roof?.kind === "hip-cap" && roof.gables[0]?.capFit?.eaveY != null) {
      wallTop = Math.floor(roof.gables[0].capFit.eaveY);
      wallTopSource = "eave-fit";
    }
    if (wallTopSource === "mass-top" && m.role !== "protrusion") {
      mFindings.push(finding("walltop-default", m.id,
        `no fitted eave for ${m.id} — wallTop defaults to the mass top y=${wallTop}`));
    }
    findings.push(...mFindings.map((f) => ({ ...f, stage: "mass-fit" })));
    return {
      id: m.id, role: m.role, runs,
      footprint: footprintOfRuns(runs),
      baseY: m.yRange[0], massTop: m.yRange[1],
      wallTop, wallTopSource,
      heightDisagreement: m.yRange[1] - wallTop, // evidence: blob mass top vs fitted wall top
      findings: mFindings,
    };
  });

  // 4. openings — per-opening head fit; a refused head is a rectangular aperture carrying the
  //    refusal (Rule 1: a flat head is never invented over a witnessed arch — fitOpeningHead's gate)
  const openings = (record.openingGroups ?? []).map((grp) => ({
    id: grp.id, massId: grp.massId, dir: grp.dir, kind: grp.kind,
    openings: grp.openings.map((op) => {
      const head = fitOpeningHead(op);
      if (head.kind === "none") {
        findings.push({ ...finding(head.finding.code, `${grp.id}@${grp.dir}`, head.finding.detail),
          stage: "opening-head-fit" });
      }
      return {
        extent: op.extent, sillY: op.sillY, crown: op.crown, width: op.width, height: op.height,
        head,
      };
    }),
  }));

  return { schema: PROVISION_FIT_SCHEMA, record, masses, roofs, openings, findings };
}

// ---- serialization ------------------------------------------------------------------------------
// Gables carry Sets (footprint.cols); the recorded parameters must round-trip so the runner can
// re-prove the generated artifact from the record alone. Sets serialize sorted (determinism).

const SET_TAG = "__set__";

function toJsonable(v) {
  if (v instanceof Set) return { [SET_TAG]: [...v].sort() };
  if (Array.isArray(v)) return v.map(toJsonable);
  if (v && typeof v === "object") {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      if (typeof val === "function") continue; // defensive: parameters are data, never closures
      out[k] = toJsonable(val);
    }
    return out;
  }
  return v;
}

function fromJsonable(v) {
  if (Array.isArray(v)) return v.map(fromJsonable);
  if (v && typeof v === "object") {
    const keys = Object.keys(v);
    if (keys.length === 1 && keys[0] === SET_TAG) return new Set(v[SET_TAG]);
    const out = {};
    for (const [k, val] of Object.entries(v)) out[k] = fromJsonable(val);
    return out;
  }
  return v;
}

/** Serialize a fitProvision result (or its parameter subset) to a JSON-safe object. */
export function serializeProvisionFit(fit) {
  return toJsonable(fit);
}

/** Revive a serialized provision fit (Sets restored). */
export function reviveProvisionFit(json) {
  return fromJsonable(json);
}
