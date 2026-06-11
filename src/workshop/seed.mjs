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
import { assertWorkshopProgram, realizeProgram } from "./program.mjs";
import { assertArtifact } from "../artifact.mjs";
import { artifactOccupancy } from "../view/occupancy.mjs";
import { runConformance } from "../pack/conformance.mjs";

/** The declared workshop revision budget for the milestone chain (D3): the fixture proof-run's
 *  calibrated value — the only calibration the project has (N=1, recorded honestly). */
export const PATTERN_BOOK_BUDGET = Object.freeze({ rounds: 6 });

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
export function workshopSubjectsFrom(registry, { relDir, packRel }) {
  const rows = Object.values(registry)
    .filter((def) => def.glb && def.generated?.scale)
    .map((def) => [def.key, Object.freeze({
      program: `${relDir}/${def.key}/program.json`,
      concept: `benchmarks/sculpture/${def.concept}`,
      pack: packRel,
    })]);
  return Object.freeze(Object.fromEntries(rows));
}
