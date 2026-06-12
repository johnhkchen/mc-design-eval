// Style-pack conformance checks — the workshop's per-round gate (T-124-01, story S-124, epic
// E-31). Cheap, deterministic, aimed at REGULARITY (what eyes see) — never mesh fidelity (E-31
// Rule 4: generators emit clean geometry; this gate keeps it clean through revision rounds).
// Every check JUDGES and returns a verdict; nothing here repairs or mutates (repair lives in
// surface-coherence/shell-integrity; judgement is this module's whole charter).
//
// DECLARED, NEVER INFERRED: bands carry explicit y-ranges and block sets, symmetry is a declared
// plane, openings are declared boxes — the cage-solid-shell lesson (repaired shells make every
// layer read as a floor line; definitions must supply the lines). Undeclared properties are
// never demanded: no declared symmetry plane → the symmetry check passes vacuously.
//
// REUSE, NOT REIMPLEMENTATION: watertight wraps closureCheck and single-component wraps
// componentStrip (the E-25 integrity keepers stay the single source of truth); the new
// predicates here are only the ones that had no pure judge: courses-even, symmetry-held,
// openings-rhythm, palette-in-pack (T-100 foreign-block semantics over the pack's vocabulary).
//
// PURE — no GL, no I/O, no Date/random — runs under the `src/**/*.test.mjs` glob.

import { closureCheck, componentStrip } from "../view/shell-integrity.mjs";
import { bareBlock } from "../view/occupancy.mjs";
import { proportionRatios, compareRatios, assertProportionDeclarations } from "../form/silhouette-proportion.mjs";

export const CONFORMANCE_SCHEMA = "pack-conformance/v1";

/** The REGULARITY checks — what every pack lists (formation emits exactly these). */
export const REGULARITY_CHECK_NAMES = Object.freeze([
  "courses-even", "symmetry-held", "openings-rhythm",
  "palette-in-pack", "watertight", "single-component",
]);

/** The full check vocabulary a pack may list (style-pack validation rejects unknown names).
 *  "proportion-vs-concept" (T-135-01) is DECLARATION-driven — it runs whenever a program
 *  declares proportion targets, listed or not — so packs and committed drafts stay on the
 *  regularity six unless a style opts in explicitly. */
export const CONFORMANCE_CHECK_NAMES = Object.freeze([
  ...REGULARITY_CHECK_NAMES,
  "proportion-vs-concept",
]);

/** Declared check defaults — op parameters, never subject-tuned. */
export const CONFORMANCE_DEFAULTS = Object.freeze({
  maxFindings: 12, // findings listed per check before truncation (verdicts never truncate)
});

const cap = (findings, max = CONFORMANCE_DEFAULTS.maxFindings) =>
  findings.length > max
    ? [...findings.slice(0, max), `… ${findings.length - max} more`]
    : findings;

const verdict = (name, findings) => ({ name, passed: findings.length === 0, findings: cap(findings) });

/**
 * COURSES EVEN — within each declared band: (a) every cell in the band's y-range carries a
 * block from the band's set (in-band vocabulary); (b) each course (y-layer) is single-material
 * unless the band declares `mixed: true` (a checker-coursed band opts out of (b), never of (a)).
 * Apertures are absent cells, not violations — only PLACED blocks are judged.
 * @param {import("../view/occupancy.mjs").Occupancy} occ
 * @param {{bands:{name:string, yRange:number[], blocks:string[], mixed?:boolean}[]}} declarations
 */
export function coursesEvenCheck(occ, { bands } = {}) {
  if (!Array.isArray(bands)) throw new Error("coursesEvenCheck: declarations.bands is required");
  const findings = [];
  for (const band of bands) {
    const [yLo, yHi] = band.yRange;
    const own = new Set(band.blocks.map(bareBlock));
    const courseBlocks = new Map(); // y → Map<block, count>
    for (const [key, block] of occ.cells) {
      const [, y] = key.split(",").map(Number);
      if (y < yLo || y > yHi) continue;
      const b = bareBlock(block);
      if (!own.has(b)) {
        findings.push(`band "${band.name}": foreign block ${b} at ${key}`);
        continue;
      }
      let m = courseBlocks.get(y);
      if (!m) courseBlocks.set(y, (m = new Map()));
      m.set(b, (m.get(b) ?? 0) + 1);
    }
    if (!band.mixed) {
      for (const y of [...courseBlocks.keys()].sort((a, b) => a - b)) {
        const m = courseBlocks.get(y);
        if (m.size > 1) {
          const mix = [...m.entries()].map(([b, n]) => `${n}×${b}`).join(", ");
          findings.push(`band "${band.name}": course y=${y} is mixed (${mix})`);
        }
      }
    }
  }
  return verdict("courses-even", findings);
}

/**
 * SYMMETRY HELD — a DECLARED mirror plane maps the occupancy onto itself (same bare block at the
 * mirrored cell). `at` may be half-integral (a plane between cells: x' = 2·at − x). No declared
 * plane → vacuous pass (declared symmetry only — the check never demands symmetry).
 * @param {{symmetry?:{axis:"x"|"z", at:number}|null}} declarations
 */
export function symmetryHeldCheck(occ, { symmetry } = {}) {
  if (symmetry == null) return verdict("symmetry-held", []);
  const { axis, at } = symmetry;
  if ((axis !== "x" && axis !== "z") || !Number.isFinite(at)) {
    throw new Error('symmetryHeldCheck: declarations.symmetry must be {axis:"x"|"z", at:number}');
  }
  const findings = [];
  for (const [key, block] of occ.cells) {
    const [x, y, z] = key.split(",").map(Number);
    const m = axis === "x" ? [Math.round(2 * at - x), y, z] : [x, y, Math.round(2 * at - z)];
    const mirrored = occ.block(m[0], m[1], m[2]);
    if (mirrored === null) findings.push(`cell ${key} has no mirror at ${m.join(",")}`);
    else if (bareBlock(mirrored) !== bareBlock(block)) {
      findings.push(`cell ${key} (${bareBlock(block)}) mirrors to ${bareBlock(mirrored)} at ${m.join(",")}`);
    }
  }
  return verdict("symmetry-held", findings);
}

/**
 * OPENINGS RHYTHM — per declared wall group: edge-to-edge spacing between laterally consecutive
 * openings stays within the pack's bounds, and every opening in the group shares the sill line
 * (min y). Groups with a single opening are vacuously rhythmic.
 * @param {{openings:{wall:string, min:number[], max:number[]}[]}} declarations
 * @param {{minSpacing:number, maxSpacing:number}} openingRhythm  (the pack's proportion rule)
 */
export function openingsRhythmCheck({ openings } = {}, { minSpacing, maxSpacing } = {}) {
  if (!Array.isArray(openings)) throw new Error("openingsRhythmCheck: declarations.openings is required");
  if (!Number.isInteger(minSpacing) || !Number.isInteger(maxSpacing) || minSpacing > maxSpacing) {
    throw new Error("openingsRhythmCheck: openingRhythm must be integer {minSpacing ≤ maxSpacing}");
  }
  const findings = [];
  const groups = new Map();
  for (const o of openings) {
    if (!groups.has(o.wall)) groups.set(o.wall, []);
    groups.get(o.wall).push(o);
  }
  for (const [wall, group] of groups) {
    // lateral axis = the horizontal axis the openings actually spread along
    const spreadX = Math.max(...group.map((o) => o.max[0])) - Math.min(...group.map((o) => o.min[0]));
    const spreadZ = Math.max(...group.map((o) => o.max[2])) - Math.min(...group.map((o) => o.min[2]));
    const ax = spreadX >= spreadZ ? 0 : 2;
    const sorted = [...group].sort((a, b) => a.min[ax] - b.min[ax]);
    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i].min[ax] - sorted[i - 1].max[ax] - 1;
      if (gap < minSpacing || gap > maxSpacing) {
        findings.push(`wall "${wall}": gap ${gap} between openings ${i - 1}→${i} off rhythm [${minSpacing},${maxSpacing}]`);
      }
    }
    const sills = new Set(group.map((o) => o.min[1]));
    if (sills.size > 1) {
      findings.push(`wall "${wall}": sill lines differ (${[...sills].sort((a, b) => a - b).join(", ")})`);
    }
  }
  return verdict("openings-rhythm", findings);
}

/**
 * PALETTE IN-PACK — every placed bare block belongs to the pack's vocabulary (palette ∪
 * decoration). A block outside the pack is FOREIGN (T-100 semantics) and named with a sample
 * cell. The pack curator lists shaped blocks (stairs/slabs/doors) explicitly — no derivation.
 * @param {import("./style-pack.mjs").StylePack|{palette:object[], decoration:object[]}} pack
 */
export function paletteInPackCheck(occ, pack) {
  const allowed = new Set([
    ...(pack?.palette ?? []).map((p) => bareBlock(p.block)),
    ...(pack?.decoration ?? []).map((d) => bareBlock(d.block)),
  ]);
  if (allowed.size === 0) throw new Error("paletteInPackCheck: the pack has an empty vocabulary");
  const foreign = new Map(); // block → {count, sample}
  for (const [key, block] of occ.cells) {
    const b = bareBlock(block);
    if (allowed.has(b)) continue;
    const f = foreign.get(b) ?? { count: 0, sample: key };
    f.count++;
    foreign.set(b, f);
  }
  const findings = [...foreign.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([b, f]) => `foreign block ${b} ×${f.count} (e.g. ${f.sample})`);
  return verdict("palette-in-pack", findings);
}

/**
 * WATERTIGHT — wraps the E-25 keeper: 6-ray ground-solid closure with declared openings as
 * honorary skin. Declarations feed `openings` (world AABBs) as the allow regions.
 */
export function watertightCheck(occ, { openings = [] } = {}) {
  const r = closureCheck(occ, { regions: openings });
  const findings = r.closed ? [] : Object.entries(r.byDirection)
    .filter(([, n]) => n > 0)
    .map(([dir, n]) => `${n} breach ray(s) entering ${dir}`);
  const v = verdict("watertight", findings);
  return { ...v, passed: r.closed, mouths: r.mouths.length };
}

/** SINGLE COMPONENT — wraps the E-25 keeper: no floating debris (grounded standing structure is
 * legitimate, per componentStrip's keep rule); pass iff nothing would be stripped. */
export function singleComponentCheck(occ) {
  const r = componentStrip(occ, { keepGrounded: true });
  const findings = r.stripped.map((s) => `floating component of ${s.size} cell(s) at minY ${s.minY}`);
  const v = verdict("single-component", findings);
  return { ...v, components: r.components };
}

/**
 * PROPORTION VS CONCEPT (T-135-01, story S-135, epic E-33) — the dimension no regularity check
 * owned: silhouette ratios (ridge:eave, roof share of the elevation, footprint aspect) of the
 * BUILD's orthographic projections, compared against DECLARED targets derived from the concept's
 * silhouette (the contract; the conditioned sketch is the recorded fallback per ratio). The
 * verdict carries the full ratio table (`ratios`) beside the findings — the round ledger and the
 * critique prompt get the numbers, and the loop's no-regress predicate reads `excess` across
 * rounds. Undeclared → vacuous pass (declared, never inferred — the symmetry precedent).
 * @param {import("../view/occupancy.mjs").Occupancy} occ
 * @param {{proportions?:object}} declarations
 */
export function proportionCheck(occ, { proportions } = {}) {
  if (proportions == null) return verdict("proportion-vs-concept", []);
  const decl = assertProportionDeclarations(proportions);
  const measured = proportionRatios(occ, { masses: decl.masses });
  const compared = compareRatios(measured, decl);
  const findings = compared.rows
    .filter((r) => r.withinTolerance === false)
    .map((r) => {
      const where = r.mass ? `mass "${r.mass}": ` : "";
      if (r.basis === "unmeasurable") {
        return `${where}${r.ratio} unmeasurable on the build vs target ${r.target} (${r.source})`;
      }
      return `${where}${r.ratio} ${r.measured} vs target ${r.target} (${r.source}) — `
        + `${r.basis === "absolute" ? "Δ" : "Δrel"} ${r.excess} > tolerance ${decl.tolerance}`;
    });
  const v = verdict("proportion-vs-concept", findings);
  return { ...v, ratios: { tolerance: decl.tolerance, rows: compared.rows } };
}

const CHECK_IMPL = Object.freeze({
  "courses-even": (occ, decl) => coursesEvenCheck(occ, decl),
  "symmetry-held": (occ, decl) => symmetryHeldCheck(occ, decl),
  "openings-rhythm": (occ, decl, pack) => openingsRhythmCheck(decl, pack.proportions.openingRhythm),
  "palette-in-pack": (occ, decl, pack) => paletteInPackCheck(occ, pack),
  "watertight": (occ, decl) => watertightCheck(occ, decl),
  "single-component": (occ) => singleComponentCheck(occ),
  "proportion-vs-concept": (occ, decl) => proportionCheck(occ, decl),
});

/**
 * RUN the pack's conformance gate: exactly the checks the pack lists, in the pack's order. An
 * unknown check name THROWS — the pack was schema/semantically validated upstream, so reaching
 * here with a bad name is a bug, not a finding.
 *
 * ONE deliberate, documented exception to "exactly the pack's list" (T-135-01): when the
 * program DECLARES proportion targets (`declarations.proportions` — subject data measured from
 * the concept/sketch, not style policy) and the pack does not already list the check,
 * `proportion-vs-concept` is appended. Committed chains predate proportion declarations, so
 * their re-derived reports are byte-identical (the offline re-assert contract holds without
 * touching any pack file).
 * @param {{occ:import("../view/occupancy.mjs").Occupancy, declarations:object}} build
 * @param {object} pack  a (validated) style pack
 * @returns {{schema:string, passed:boolean, checks:object[]}}
 */
export function runConformance({ occ, declarations }, pack) {
  const names = pack?.conformance?.checks;
  if (!Array.isArray(names) || names.length === 0) {
    throw new Error("runConformance: pack.conformance.checks must be a non-empty array");
  }
  const decl = declarations ?? {};
  const checks = names.map((name) => {
    const impl = CHECK_IMPL[name];
    if (!impl) throw new Error(`runConformance: unknown check "${name}" (known: ${CONFORMANCE_CHECK_NAMES.join(", ")})`);
    return impl(occ, decl, pack);
  });
  if (decl.proportions != null && !names.includes("proportion-vs-concept")) {
    checks.push(proportionCheck(occ, decl));
  }
  return { schema: CONFORMANCE_SCHEMA, passed: checks.every((c) => c.passed), checks };
}
