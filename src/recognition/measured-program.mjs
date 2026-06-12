// THE MEASUREMENT-TO-PROGRAM SEAM (T-133-01, story S-133, epic E-33) — identity from language,
// quantity from geometry (E-33 Rule 1). The conditioned sketch (T-123) MEASURES eave/ridge
// heights, footprint extents and pitch; recognition (T-125) NAMES idioms, roles and openings but
// eyeballs dimensions (VLMs are weak metric estimators) and the pack quantizes the rest. This
// module re-sources the building-program's dimensional parameters from the sketch's measurements
// and records, per parameter, where each number came from (`measured` | `fallback`) — zero silent
// defaults on measurable dimensions. Conflicts (recognition implies a dimension the sketch
// contradicts) resolve SKETCH-WINS for quantity, recorded with both values.
//
// PURE — no I/O, no model, no GL, no subject names. The output is a schema-valid
// building-program/v1 (the compiler's ratified closed replay input stays closed: program + pack →
// byte-identical artifact); compile.mjs is NEVER imported here (the dependency direction is
// seam → program contracts; the one compile-derived number, the implied ridge, is mirrored in
// impliedRidgeRise and pinned against compileProgram by a drift-tripwire test).
//
// THE PACK PROPORTIONS ARE THE FALLBACK TIER (S-133): the storey-height band still gates MODEL
// replies (validateProgramAgainstPack is untouched); a MEASURED program may carry a band
// excursion, recorded as a sketch-wins conflict. The attempt ladder below (the T-104
// cage-arbitrated idiom) prefers the most-measured candidate whose only validation findings are
// the ones its own conflict ledger predicts; anything unpredicted falls back parameter-by-
// parameter, recorded, and an inexpressible program throws rather than weakening a gate.

import {
  assertBuildingProgram,
  validateProgramAgainstPack,
  ROOF_LAYOUTS,
} from "./program.mjs";

export const MEASURED_PROGRAM_SCHEMA = "measured-program/v1";

const fail = (msg) => { throw new Error(`measured-program: ${msg}`); };
const r4 = (x) => Math.round(x * 1e4) / 1e4;

/** Cells-at-sampleScale → registry blocks. Sketch `*Blocks` fields are ALREADY in blocks;
 *  everything else (planDims, mass bboxes, layers) needs this factor. */
export function sketchBlocksFactor(sketch) {
  const sample = sketch?.params?.sampleScale;
  const registry = sketch?.params?.registryScale;
  if (!Number.isFinite(sample) || !Number.isFinite(registry) || sample <= 0 || registry <= 0) {
    fail("sketch params.sampleScale / params.registryScale absent — cannot convert units");
  }
  return registry / sample;
}

const tiltToRatio = (deg) => (Number.isFinite(deg) ? r4(Math.tan((deg * Math.PI) / 180)) : null);

/**
 * Normalize a form-sketch/v1 into registry-block measurements. Every field is `null` when the
 * sketch cannot measure it — the caller's fallback trigger (recorded, never silent).
 * @param {object} sketch  a committed form-sketch/v1 record
 * @returns {{factor:number, eaveBlocks:number|null, heightBlocks:number|null,
 *            plan:{w:number,d:number}|null, pitchRatio:number|null,
 *            primaries:{id:string, bbox:{x0:number,x1:number,z0:number,z1:number},
 *                       pitchRatio:number|null}[],
 *            storeyCandidates:object[]}}
 */
export function sketchMeasurements(sketch) {
  const factor = sketchBlocksFactor(sketch);
  const pr = sketch.proportions ?? {};
  const planDims = sketch.footprint?.planDims ?? null;
  const primaries = (pr.masses ?? [])
    .filter((m) => m.role === "primary")
    .map((m) => ({
      id: m.id,
      bbox: m.bbox
        ? { x0: r4(m.bbox.minX * factor), x1: r4((m.bbox.maxX + 1) * factor),
            z0: r4(m.bbox.minZ * factor), z1: r4((m.bbox.maxZ + 1) * factor) }
        : null,
      pitchRatio: tiltToRatio(m.pitch?.dominantTiltDeg),
    }));
  return {
    factor,
    eaveBlocks: Number.isFinite(pr.eaveBlocks) ? r4(pr.eaveBlocks) : null,
    heightBlocks: Number.isFinite(pr.heightBlocks) ? r4(pr.heightBlocks) : null,
    plan: Array.isArray(planDims) && planDims.length === 2
      ? { w: Math.round(planDims[0] * factor), d: Math.round(planDims[1] * factor) }
      : null,
    pitchRatio: tiltToRatio(sketch.pitch?.dominantTiltDeg),
    primaries,
    storeyCandidates: pr.storeyCandidates ?? [],
  };
}

/** Schema bounds for the eave factorization (building-program.schema.json — the HARD caps; the
 *  pack band is a preference tier only). */
const STOREYS_RANGE = [1, 4];
const STOREY_HEIGHT_RANGE = [2, 6];

/**
 * Express a measured eave height as storeys × storeyHeight under the schema bounds.
 * Total order: |n×sh − eave| asc, then sh-in-pack-band first, then |n − recognizedStoreys| asc,
 * then smaller n, then smaller sh — fully deterministic.
 * @returns {{storeys:number, storeyHeight:number, used:number, residual:number}}
 */
export function factorEave({ eaveBlocks, recognizedStoreys, packBand = null }) {
  if (!Number.isFinite(eaveBlocks) || eaveBlocks <= 0) fail(`factorEave: bad eave ${eaveBlocks}`);
  const lexLess = (a, b) => { for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return a[i] < b[i]; } return false; };
  let best = null;
  for (let n = STOREYS_RANGE[0]; n <= STOREYS_RANGE[1]; n++) {
    for (let sh = STOREY_HEIGHT_RANGE[0]; sh <= STOREY_HEIGHT_RANGE[1]; sh++) {
      const key = [
        Math.abs(n * sh - eaveBlocks),
        packBand && (sh < packBand.min || sh > packBand.max) ? 1 : 0,
        Math.abs(n - recognizedStoreys),
        n,
        sh,
      ];
      if (best === null || lexLess(key, best.key)) best = { key, n, sh };
    }
  }
  return { storeys: best.n, storeyHeight: best.sh, used: best.n * best.sh,
           residual: r4(best.n * best.sh - eaveBlocks) };
}

/** Nearest pack pitch class to a measured rise/run ratio; ties to the SMALLER class. */
export function snapPitch(ratio, pitchClasses) {
  if (!Array.isArray(pitchClasses) || pitchClasses.length === 0) fail("snapPitch: empty pitch vocabulary");
  const sorted = [...pitchClasses].sort((a, b) => a - b);
  let best = sorted[0];
  for (const c of sorted) if (Math.abs(c - ratio) < Math.abs(best - ratio)) best = c;
  return { pitchClass: best, residual: r4(best - ratio) };
}

/**
 * Per-axis ENDPOINT scaling of all mass rects onto a target overall extent — endpoints map
 * through one shared affine+round, so edges shared by touching masses stay aligned. Pure
 * geometry; feasibility (lanes/connectivity) is judged by the caller's validation ladder.
 * @param {{id:string, rect:{x0:number,z0:number,w:number,d:number}}[]} masses
 * @param {{w:number|null, d:number|null}} target  null axis = leave unscaled
 * @returns {Map<string, {x0:number,z0:number,w:number,d:number}>}
 */
export function scaleFootprint(masses, target) {
  const x0s = masses.map((m) => m.rect.x0);
  const x1s = masses.map((m) => m.rect.x0 + m.rect.w);
  const z0s = masses.map((m) => m.rect.z0);
  const z1s = masses.map((m) => m.rect.z0 + m.rect.d);
  const minX = Math.min(...x0s), maxX = Math.max(...x1s);
  const minZ = Math.min(...z0s), maxZ = Math.max(...z1s);
  const axis = (lo, extent, t) => (t === null || extent === t
    ? (e) => e
    : (e) => lo + Math.round(((e - lo) * t) / extent));
  const mx = axis(minX, maxX - minX, target.w ?? null);
  const mz = axis(minZ, maxZ - minZ, target.d ?? null);
  const out = new Map();
  for (const m of masses) {
    const x0 = mx(m.rect.x0), x1 = mx(m.rect.x0 + m.rect.w);
    const z0 = mz(m.rect.z0), z1 = mz(m.rect.z0 + m.rect.d);
    out.set(m.id, { x0, z0, w: Math.max(3, x1 - x0), d: Math.max(3, z1 - z0) });
  }
  return out;
}

/** The compiler's ridge rise for a mass (compile.mjs roof stage, mirrored — drift-pinned by a
 *  test that compares against compileProgram's emitted ridgeY). Returns null for ridgeless
 *  layouts whose rise depends on the half-span min (pyramid — recorded as underived). */
export function impliedRidgeRise(mass) {
  const layout = ROOF_LAYOUTS[mass.roof.idiom];
  if (!layout?.ridge) return null;
  // the perpendicular axis bears eave edges in every ridge-bearing layout, so the compiler's
  // expanded footprint always adds one cell each side of it
  const perpSpan = (mass.roof.ridgeAxis === "x" ? mass.rect.d : mass.rect.w) + 2;
  return Math.max(1, Math.round(mass.roof.pitchClass * Math.floor((perpSpan - 1) / 2)));
}

/** Map sketch primary masses onto program masses: one primary → the whole building reads as one
 *  body (every program mass takes the building measurements); several primaries → greedy best
 *  bbox-overlap in block space; unmatched program masses take the building read. */
function primaryFor(mass, primaries) {
  if (primaries.length <= 1) return primaries[0] ?? null;
  const rect = { x0: mass.rect.x0, x1: mass.rect.x0 + mass.rect.w,
                 z0: mass.rect.z0, z1: mass.rect.z0 + mass.rect.d };
  let best = null, bestArea = 0;
  for (const p of primaries) {
    if (!p.bbox) continue;
    const w = Math.min(rect.x1, p.bbox.x1) - Math.max(rect.x0, p.bbox.x0);
    const d = Math.min(rect.z1, p.bbox.z1) - Math.max(rect.z0, p.bbox.z0);
    const area = w > 0 && d > 0 ? w * d : 0;
    if (area > bestArea) { bestArea = area; best = p; }
  }
  return best;
}

const ladderName = (s) => `fp:${s.fx ? "x" : "-"}${s.fz ? "z" : "-"} eave:${s.eave ? "measured" : "recognized"}`;

/**
 * THE SEAM. Re-source the program's dimensional parameters (footprint extents/aspect, eave
 * height via storeys×storeyHeight, pitch class; ridge height is derived from all three and
 * recorded as a check) from the sketch's measurements. Qualitative naming — roles, idioms,
 * openings, treatments, ridgeAxis, reading — is byte-untouched.
 *
 * @param {{program:object, sketch:object, pack:object}} args
 *   program: a building-program/v1 that passed the live reply gates
 * @returns {{program:object, dimensions:object[], conflicts:object[], attempt:string}}
 *   program: schema-valid revised building-program/v1 (frozen)
 *   dimensions: per-parameter ledger {mass, parameter, source, measured, used, residual, note}
 *   conflicts: recognition-vs-sketch disagreements, each resolved "sketch"
 */
export function applyMeasuredProportions({ program, sketch, pack }) {
  const m = sketchMeasurements(sketch);
  const band = pack.proportions.storeyHeight;
  const classes = pack.proportions.pitchClasses;

  // The attempt ladder (most-measured first): each rung builds a full candidate, validates it,
  // and wins iff its only findings are the ones its own conflict ledger predicts.
  const rungs = [
    { fx: true, fz: true, eave: true }, { fx: true, fz: false, eave: true },
    { fx: false, fz: true, eave: true }, { fx: false, fz: false, eave: true },
    { fx: true, fz: true, eave: false }, { fx: true, fz: false, eave: false },
    { fx: false, fz: true, eave: false }, { fx: false, fz: false, eave: false },
  ];

  let lastFindings = null;
  for (const rung of rungs) {
    const dimensions = [];
    const conflicts = [];
    const note = (entry) => dimensions.push(entry);

    // --- footprint extents/aspect (building-level: the sketch's plan is the whole footprint) ---
    const wantFx = rung.fx && m.plan !== null;
    const wantFz = rung.fz && m.plan !== null;
    const rects = scaleFootprint(program.masses, {
      w: wantFx ? m.plan.w : null, d: wantFz ? m.plan.d : null,
    });
    const bbox = (rs) => {
      const x0 = Math.min(...rs.map((r) => r.x0)), x1 = Math.max(...rs.map((r) => r.x0 + r.w));
      const z0 = Math.min(...rs.map((r) => r.z0)), z1 = Math.max(...rs.map((r) => r.z0 + r.d));
      return { w: x1 - x0, d: z1 - z0 };
    };
    const before = bbox(program.masses.map((x) => x.rect));
    const after = bbox([...rects.values()]);
    for (const [axis, want, rungOn] of [["w", wantFx, rung.fx], ["d", wantFz, rung.fz]]) {
      const measured = m.plan ? m.plan[axis] : null;
      note({
        mass: "*", parameter: `footprint.${axis}`,
        source: want ? "measured" : "fallback",
        measured, used: after[axis],
        residual: want ? r4(after[axis] - measured) : null,
        note: m.plan === null ? "sketch footprint unmeasurable — recognized extent kept"
          : want ? "sketch planDims (registry blocks), endpoint-scaled across masses"
          : rungOn ? "unreachable" : "measured extent infeasible (openings/connectivity) — recognized extent kept, see attempt",
      });
      if (want && measured !== before[axis]) {
        conflicts.push({ mass: "*", parameter: `footprint.${axis}`, recognition: before[axis],
                         sketch: measured, resolved: "sketch" });
      }
    }

    // --- per-mass eave (storeys × storeyHeight) and pitch -------------------------------------
    const bandConflictWheres = new Set();
    const masses = program.masses.map((mass, i) => {
      const where = `masses[${i}] (${mass.id})`;
      const primary = primaryFor(mass, m.primaries);
      const next = { ...mass, rect: rects.get(mass.id) };

      // eave height — sketch-wins for quantity; storey count exists only to express it
      const recogEave = mass.storeys * mass.storeyHeight;
      const eaveTarget = m.eaveBlocks; // building read (one primary for current sketches)
      if (rung.eave && eaveTarget !== null) {
        const f = factorEave({ eaveBlocks: eaveTarget, recognizedStoreys: mass.storeys, packBand: band });
        next.storeys = f.storeys;
        next.storeyHeight = f.storeyHeight;
        note({ mass: mass.id, parameter: "eaveHeight", source: "measured",
               measured: eaveTarget, used: f.used, residual: f.residual,
               note: `expressed as ${f.storeys}×${f.storeyHeight} (schema-bounded factorization)` });
        note({ mass: mass.id, parameter: "storeyFactorization", source: "measured",
               measured: eaveTarget, used: `${f.storeys}x${f.storeyHeight}`, residual: null,
               note: `recognition read ${mass.storeys}x${mass.storeyHeight}` });
        if (f.used !== recogEave) {
          conflicts.push({ mass: mass.id, parameter: "eaveHeight", recognition: recogEave,
                           sketch: eaveTarget, resolved: "sketch" });
        }
        if (f.storeyHeight < band.min || f.storeyHeight > band.max) {
          conflicts.push({ mass: mass.id, parameter: "storeyHeight.packBand",
                           recognition: `[${band.min}, ${band.max}]`, sketch: f.storeyHeight,
                           resolved: "sketch",
                           note: "pack proportions are the fallback tier (S-133); excursion recorded" });
          bandConflictWheres.add(`${where}.storeyHeight`);
        }
      } else {
        note({ mass: mass.id, parameter: "eaveHeight", source: "fallback",
               measured: eaveTarget, used: recogEave, residual: null,
               note: eaveTarget === null ? "sketch eave unmeasurable — recognized value kept"
                 : "measured eave infeasible against the mass's openings — recognized value kept, see attempt" });
      }

      // pitch — measured ratio snapped into the pack vocabulary (the snap is recorded; widening
      // the vocabulary is S-134's)
      const ratio = primary?.pitchRatio ?? m.pitchRatio;
      if (ratio !== null) {
        const snap = snapPitch(ratio, classes);
        next.roof = { ...mass.roof, pitchClass: snap.pitchClass };
        note({ mass: mass.id, parameter: "pitchClass", source: "measured",
               measured: ratio, used: snap.pitchClass, residual: snap.residual,
               note: "tan(dominant tilt) snapped to the nearest pack pitch class" });
        if (snap.pitchClass !== mass.roof.pitchClass) {
          conflicts.push({ mass: mass.id, parameter: "pitchClass",
                           recognition: mass.roof.pitchClass, sketch: ratio, resolved: "sketch" });
        }
      } else {
        note({ mass: mass.id, parameter: "pitchClass", source: "fallback",
               measured: null, used: mass.roof.pitchClass, residual: null,
               note: "sketch pitch unmeasurable — recognized class kept" });
      }

      // ridge — not a schema parameter: derived from eave+pitch+span (compile's formula,
      // drift-pinned); recorded as a measured-derived check against the sketch's total height
      const rise = impliedRidgeRise(next);
      const eaveUsed = next.storeys * next.storeyHeight;
      note({
        mass: mass.id, parameter: "ridgeHeight",
        source: (rung.eave && eaveTarget !== null) || ratio !== null ? "measured" : "fallback",
        measured: m.heightBlocks,
        used: rise === null ? null : eaveUsed + rise + 1,
        residual: rise === null || m.heightBlocks === null ? null : r4(eaveUsed + rise + 1 - m.heightBlocks),
        note: rise === null ? "ridgeless roof layout — rise is the realizer's"
          : "derived: eave + pitch x half-span + 1 (all constituents sourced above)",
      });
      return next;
    });

    const candidate = { ...program, masses };
    const asserted = assertBuildingProgram(candidate);
    const { findings } = validateProgramAgainstPack(asserted, pack);
    const unpredicted = findings.filter((f) => !bandConflictWheres.has(f.where));
    if (unpredicted.length === 0) {
      return { program: asserted, dimensions, conflicts, attempt: ladderName(rung) };
    }
    lastFindings = unpredicted;
  }
  fail(`no rung of the attempt ladder validates — last findings:\n${lastFindings
    .map((f) => `  ${f.where}: ${f.msg}`).join("\n")}`);
}

/**
 * Standalone silhouette ratios from COMPILED geometry (a workshop-program/v1) — the record-scoped
 * diagnostic of E-33 Rule 2's named ratios. NOT S-135's render-vs-concept gate metric.
 * Heights in blocks: eave = wall cells (eaveY), total = ridge layer + 1.
 */
export function silhouetteRatios(workshopProgram) {
  const roofs = workshopProgram.elements.filter((e) => e.kind === "idiom" && e.idiom.startsWith("roof."));
  const shells = workshopProgram.elements.filter((e) => e.kind === "shell");
  if (roofs.length === 0 || shells.length === 0) fail("silhouetteRatios: program has no roof or no shell");
  const eave = Math.min(...roofs.map((r) => r.spec.eaveY));
  const ridge = Math.max(...roofs.map((r) => r.spec.ridgeY ?? r.spec.eaveY));
  const x0 = Math.min(...shells.map((s) => s.spec.footprint.x0));
  const x1 = Math.max(...shells.map((s) => s.spec.footprint.x1));
  const z0 = Math.min(...shells.map((s) => s.spec.footprint.z0));
  const z1 = Math.max(...shells.map((s) => s.spec.footprint.z1));
  const w = x1 - x0 + 1, d = z1 - z0 + 1;
  const total = ridge + 1;
  return {
    ridgeToEave: r4(total / eave),
    roofShare: r4((total - eave) / total),
    aspect: r4(Math.max(w, d) / Math.min(w, d)),
  };
}

/** The sketch's own target ratios, same definitions as silhouetteRatios (the row the before/after
 *  rows are read against). Null when the sketch cannot measure a constituent. */
export function sketchTargetRatios(sketch) {
  const m = sketchMeasurements(sketch);
  const heights = m.eaveBlocks !== null && m.heightBlocks !== null;
  return {
    ridgeToEave: heights ? r4(m.heightBlocks / m.eaveBlocks) : null,
    roofShare: heights ? r4((m.heightBlocks - m.eaveBlocks) / m.heightBlocks) : null,
    aspect: m.plan ? r4(Math.max(m.plan.w, m.plan.d) / Math.min(m.plan.w, m.plan.d)) : null,
  };
}
