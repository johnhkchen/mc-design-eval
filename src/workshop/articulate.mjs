// The relief join (T-149-01, E-35 terminal). The recognized facade grammar is lowered by
// compileProgram into an ordered articulation plan (T-147); realizeProgram builds the bare skin
// (T-126). This module is the one place they meet: it folds the plan's proud relief ONTO the
// realized skin so the build the workshop renders, the gate censuses, and the judge sees actually
// carries the rhythm the concept shows. Pure: no GL/IO/Date/random; deterministic placement order;
// byte-identical to realizeProgram when the program carries no facade (the structural no-regression
// that keeps every committed facade-less chain — cottage, barn, the fixture — unmoved).
import { realizeProgram } from "./program.mjs";
import { applyArticulation } from "../recognition/compile.mjs";
import { artifactOccupancy } from "../view/occupancy.mjs";
import { assertArtifact } from "../artifact.mjs";

const namespaced = (id) => (typeof id === "string" && id.includes(":") ? id : `minecraft:${id}`);
const keyOf = (pos) => pos.join(",");

/**
 * Fold articulation placements onto the realized skin. Skin cells keep their realization order; a
 * relief cell that fronts an existing position OVERWRITES it in place (the brushes are in front of
 * the skin — later wins, the same rule realizeProgram uses for overlapping elements); a relief cell
 * at a fresh position is appended in the plan's already byte-stable brush order. The merged manifest
 * is recomputed and the artifact re-asserted.
 *
 * @param {object[]} skin    realizeProgram placements ({op:"voxel", pos, block, state?})
 * @param {object[]} relief  applyArticulation placements ({op:"voxel", pos, block})
 * @returns {object[]} merged placements, replay-stable order
 */
export function mergePlacements(skin, relief) {
  const out = skin.map((p) => ({ ...p }));
  const indexByKey = new Map(out.map((p, i) => [keyOf(p.pos), i]));
  for (const r of relief) {
    const cell = { op: "voxel", pos: [...r.pos], block: namespaced(r.block) };
    const k = keyOf(cell.pos);
    const at = indexByKey.get(k);
    if (at == null) {
      indexByKey.set(k, out.length);
      out.push(cell);
    } else {
      // front the skin cell: take the relief block, drop any skin block-state (relief is a plain cube)
      out[at] = cell;
    }
  }
  return out;
}

/**
 * realizeProgram, then articulate. Returns the SAME shape realizeProgram does
 * ({artifact, cells, elements}), plus an `articulation` report when the plan placed anything.
 *
 * @param {object} workshopProgram  a workshop-program/v1 (assertWorkshopProgram'd)
 * @param {object[]} [articulation]  compileProgram's plan ([] / undefined ⇒ no-op, byte-identical)
 * @returns {{artifact: object, cells: object[], elements: object[], articulation?: object}}
 */
export function realizeWithArticulation(workshopProgram, articulation) {
  const base = realizeProgram(workshopProgram);
  if (!Array.isArray(articulation) || articulation.length === 0) return base; // facade-less: unchanged
  const { placements: relief, report } = applyArticulation(artifactOccupancy(base.artifact), articulation);
  if (!relief.length) return base; // a plan that placed nothing (e.g. zero proud cells) ⇒ unchanged
  const placements = mergePlacements(base.artifact.placements, relief);
  const manifest = [...new Set(placements.map((p) => p.block))].sort();
  const artifact = { ...base.artifact, palette: { manifest }, placements };
  assertArtifact(artifact);
  return { ...base, artifact, articulation: report };
}

/**
 * The artifact-input twin of {@link realizeWithArticulation} (T-154-01, E-37): fold the recognized
 * facade grammar's relief onto an ALREADY-REALIZED artifact base (generate-first's parametric build),
 * for the unified chain's artifact-base workshop seed. The geometry is fixed (the loop revises surface,
 * not form), so there is no program to realize — only the same proud relief join. Byte-identical to the
 * base when articulation is empty/places nothing (the facade-less no-regression). Pure; deterministic.
 *
 * @param {object} baseArtifact  a schema-valid design artifact (the frozen seed geometry)
 * @param {object[]} [articulation]  compileProgram's plan ([] / undefined ⇒ no-op, byte-identical)
 * @returns {object} the (possibly relieved) artifact — a NEW object; the input is never mutated
 */
export function articulateArtifact(baseArtifact, articulation) {
  if (!Array.isArray(articulation) || articulation.length === 0) return baseArtifact; // facade-less
  const { placements: relief } = applyArticulation(artifactOccupancy(baseArtifact), articulation);
  if (!relief.length) return baseArtifact; // placed nothing ⇒ unchanged
  const placements = mergePlacements(baseArtifact.placements, relief);
  const manifest = [...new Set(placements.map((p) => p.block))].sort();
  const artifact = { ...baseArtifact, palette: { manifest }, placements };
  assertArtifact(artifact);
  return artifact;
}
