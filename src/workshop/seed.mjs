// THE CHAIN SEED SEAM (T-127-01, story S-127, epic E-31) — pure helpers between T-125's
// recognition output and T-126's workshop loop. The compile step (src/recognition/compile.mjs)
// commits its draft with `budget: {rounds: 1}` — the right posture for T-125 (commit the accepted
// draft; revision is the workshop's). The milestone chain seeds the workshop with the SAME
// compiled program under a DECLARED revision budget: declared in the committed program (the loop
// reads program.budget.rounds — T-126's structural termination), one constant for every subject
// (no per-subject tuning), recorded in the chain record.
//
// Also here: the workshop subject derivation — durable-skin registry rows become workshop runner
// subjects as DATA (program/concept/pack paths only; E-25 Rule 3 / E-31 Rule 2 — no subject key
// is ever written into a runner source). Pure, no I/O; the runner fails loudly when a derived
// program path has not been committed yet (the chain's stage 3 is what writes it).

import { compileProgram } from "../recognition/compile.mjs";
import { assertWorkshopProgram, realizeProgram, boxShell } from "./program.mjs";
import { getIdiom } from "../pack/idiom-registry.mjs";
import { assertArtifact } from "../artifact.mjs";
import { artifactOccupancy } from "../view/occupancy.mjs";
import { runConformance } from "../pack/conformance.mjs";
import { COMPONENT_PLAN_SCHEMA } from "../view/component-plan.mjs";

/** The declared workshop revision budget for the milestone chain (D3): the fixture proof-run's
 *  calibrated value — the only calibration the project has (N=1, recorded honestly). */
export const PATTERN_BOOK_BUDGET = Object.freeze({ rounds: 6 });

/** The chain's default style pack — T-127's pack of record. Single-sourced here so the runners'
 *  `--pack` default and the legacy-path rule below cannot drift apart. */
export const DEFAULT_PACK_REL = "packs/rustic.json";

/**
 * Record-namespace suffix for a pack (T-132-01): `""` for the default pack — rustic's chain
 * records predate namespacing and relocating committed pins would be a re-roll — and
 * `--<slug>` for any other pack, so a second-pack run of the same subject can never collide
 * with (or demand rotation of) another pack's committed records.
 */
export function packNs(packRel) {
  if (packRel === DEFAULT_PACK_REL) return "";
  const m = /^packs\/([a-z][a-z0-9-]*)\.json$/.exec(packRel);
  if (!m) throw new Error(`packNs: not a style-pack path: ${packRel}`);
  return `--${m[1]}`;
}

/**
 * The ONE place chain record paths are derived (both runners consume this, so the paths the
 * pattern-book chain writes and the paths the workshop runner pins cannot drift apart).
 * All ROOT-relative; `runKey` is the namespaced subject key (`<key>` or `<key>--<style>`).
 */
/**
 * Recognition record paths, namespaced per pack like chainRels: programs are pack-stamped and
 * role vocabularies are per-pack (parseProgramReply's vocabulary gates), so a building enters a
 * new style through a pack-conditioned RECOGNITION pass — the sketch is the shared, pack-free
 * form evidence; everything downstream of it speaks one pack (T-132-01).
 */
export function recognitionRels(key, packRel = DEFAULT_PACK_REL) {
  const runKey = `${key}${packNs(packRel)}`;
  const base = `benchmarks/sculpture/recognition/${runKey}`;
  return Object.freeze({
    runKey,
    program: `${base}.program.json`,
    artifact: `${base}.artifact.json`,
    replies: `${base}.replies.json`,
    prompt: `${base}.prompt.md`,
    record: `${base}.record.json`,
    md: `${base}.md`,
  });
}

export function chainRels(key, packRel = DEFAULT_PACK_REL) {
  const runKey = `${key}${packNs(packRel)}`;
  return Object.freeze({
    runKey,
    dir: `benchmarks/sculpture/workshop/${runKey}`,
    seed: `benchmarks/sculpture/workshop/${runKey}/program.json`,
    ledger: `benchmarks/sculpture/workshop/${runKey}.json`,
    digest: `benchmarks/sculpture/workshop/${runKey}.md`,
    final: `benchmarks/sculpture/workshop/${runKey}/final-artifact.json`,
    plan: `benchmarks/sculpture/workshop/${runKey}/component-plan.json`,
    record: `benchmarks/sculpture/pattern-book/${runKey}.json`,
    recordMd: `benchmarks/sculpture/pattern-book/${runKey}.md`,
  });
}

const jsonOf = (x) => JSON.stringify(x, null, 2) + "\n";

/**
 * Seed a workshop run from a validated building-program: compile (T-125's deterministic
 * lowering), override the budget to the declared revision budget, re-validate against the
 * workshop contract, realize, and judge with the pack's conformance gate.
 *
 * Deterministic: the same (program, pack, budget) always yields byte-identical `serialized`
 * (the --repro contract; realizeProgram is byte-stable by T-126's tests).
 *
 * Validation failures THROW (assertWorkshopProgram / assertArtifact / compile role gates);
 * a conformance FAIL does not — the caller owns that verdict (the chain records it as an
 * honest pipeline failure; tests assert on it directly).
 *
 * @param {{program: object, pack: object, budget?: {rounds: number}}} args
 *   program: a building-program/v1 that passed assertBuildingProgram (T-125's parse gates)
 * @returns {{workshopProgram: object, serialized: string, artifact: object,
 *            cells: object[], elements: object[], conformance: object}}
 */
export function seedWorkshopProgram({ program, pack, budget = PATTERN_BOOK_BUDGET }) {
  const { workshopProgram: compiled } = compileProgram(program, pack);
  const workshopProgram = assertWorkshopProgram({ ...compiled, budget: { ...budget } });
  const serialized = jsonOf(workshopProgram);
  const { artifact, cells, elements } = realizeProgram(workshopProgram);
  assertArtifact(artifact);
  const conformance = runConformance(
    { occ: artifactOccupancy(artifact), declarations: workshopProgram.declarations },
    pack,
  );
  return { workshopProgram, serialized, artifact, cells, elements, conformance };
}

/**
 * Derive workshop runner subjects from the durable-skin registry: every registered building
 * with a GLB and a generate-first scale (the recognize.mjs predicate — the set that has a
 * committed conditioned sketch to be recognized from) becomes a data row. Paths only.
 *
 * @param {object} registry  durable-skin SUBJECTS (key → def with HERE-relative `concept`)
 * @param {{relDir: string, packRel: string}} opts
 *   relDir: the workshop records dir, ROOT-relative (e.g. "benchmarks/sculpture/workshop")
 *   packRel: the style pack path, ROOT-relative
 * @returns {object} frozen { [key]: { program, concept, pack } } — all paths ROOT-relative
 */
/**
 * The chain's consumption plan, derived from the program — T-106's contract: the gate reads the
 * SAME geometry the chain built, persisted beside the artifact under test. For a program build
 * the program IS the authority: every cell of a `roof.*` element is a declared roof course (a
 * rake stair on the gable plane censuses as roof, never against the wall band it y-bins into —
 * the T-121 dual), and the roof block family (stairs/slab members) is the element's own spec —
 * without it the gate censuses a stair-coursed roof as foreign and coverage-rejects every view
 * (measured live on the first cottage gate run, T-127-01).
 *
 * Only what the program defines is declared: no frames, no mass, no touched-cells — honest
 * absence, the gate's null paths are first-run-proven. Byte-stable (sorted keys/cols).
 *
 * @param {object} program  a program that passed assertWorkshopProgram (the FINAL program —
 *   replayLedger's output for a committed chain; accepted adjusts are part of the geometry)
 * @returns {object} a component-plan/v1 JSON document (reviveComponentPlan-compatible)
 */
export function componentPlanFrom(program) {
  const roofCells = [];
  const family = { stairs: null, slab: null };
  for (const el of program.elements) {
    if (el.kind !== "idiom" || !el.idiom.startsWith("roof.")) continue;
    for (const c of getIdiom(el.idiom).generate(el.spec).cells) roofCells.push(c.pos);
    const blocks = el.spec.blocks ?? {};
    family.stairs ??= blocks.stairs ?? null;
    family.slab ??= blocks.slab ?? null;
  }
  const keys = [...new Set(roofCells.map((p) => p.join(",")))].sort();
  const colTop = new Map();
  for (const [x, y, z] of roofCells) {
    const col = `${x},${z}`;
    if (!(colTop.get(col) >= y)) colTop.set(col, y);
  }
  const cols = [...colTop.keys()].sort();
  return {
    schema: COMPONENT_PLAN_SCHEMA,
    roof: roofCells.length ? {
      cells: keys,
      footprintCols: cols,
      colTop: cols.map((c) => [c, colTop.get(c)]),
      family,
      source: "workshop-program",
    } : null,
    wallTop: null,
    findings: [],
  };
}

export function workshopSubjectsFrom(registry, { relDir, packRel }) {
  const ns = packNs(packRel); // namespaced beside chainRels (relDir kept for the SEED5/8 contract)
  const rows = Object.values(registry)
    .filter((def) => def.glb && def.generated?.scale)
    .map((def) => [def.key, Object.freeze({
      program: `${relDir}/${def.key}${ns}/program.json`,
      concept: `benchmarks/sculpture/${def.concept}`,
      pack: packRel,
    })]);
  return Object.freeze(Object.fromEntries(rows));
}
