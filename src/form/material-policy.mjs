// MATERIAL PALETTE POLICY for the concept-refine pass (E-21 / S-073 / T-073-01) — the PURE heart of the
// "refine according to the concept" step's palette discipline. The surgical material loop lets the LLM
// recolor mis-zoned regions against the concept AND add a material it catches as present in the concept
// but missing from the build (a "missing texture"). This module decides which swaps are allowed and which
// additions are concept-justified — the AC#2/#3 policy, expressed as pure, testable functions.
//
// THE RECONCILED PALETTE (AC#3). E-21's allowed palette = the design-doc manifest ∪ the ≤2 gated E-19
// secondary ∪ the LLM concept-justified additions. "Off-palette" is checked against THIS augmented set —
// still NOT a full-table snap (the 91-block bloat E-18 killed). E-19's stricter design-doc-only guard is
// intentionally superseded here by the concept-grounded authority.
//
// THE RIGHT TO ADD, GATED BY JUSTIFICATION NOT A CAP (AC#2). The model MAY add a block back when it
// catches a concept material missing from the build. The gate is SEMANTIC, not tonal: a near-TONE block
// (cobblestone alongside stone_bricks) is ALLOWED — that is the whole point. What is rejected is a
// near-DUPLICATE with no new material role. By the codebase axiom (material-map.mjs: two distinct block
// ids ARE two distinct materials), "a distinct material role" == "a real block id not already in the
// allowed palette," and each addition must NAME the concept material + where it appears.
//
// PURITY (the project idiom — runs under `node --test`): no GL, no I/O, no SDK, no Date/random. Imports
// only the pure `material-map.mjs` (normalize/membership) and the pure `applyFormEdit` (the swap core we
// REUSE rather than reimplement — geometry-immutability comes free from a swap-only op list).

import { normalizeBlock, isKnownBlock } from "./material-map.mjs";
import { applyFormEdit } from "../revise/form-edit.mjs";

/** Schema tag stamped on policy provenance so downstream (the loop record) can version-check it. */
export const POLICY_SCHEMA = "material-policy/v1";

/**
 * The AC#3 augmented allowed palette: the design-doc manifest ∪ the ≤2 gated E-19 secondary ∪ the
 * concept-justified additions, as a Set of normalized namespaced block ids. All three inputs are
 * normalized through `normalizeBlock` so `minecraft:`-prefixed and bare ids unify. PURE.
 * @param {{mapPalette?:string[], secondary?:string[], additions?:string[]}} parts
 * @returns {Set<string>}
 */
export function allowedPalette({ mapPalette = [], secondary = [], additions = [] } = {}) {
  const out = new Set();
  for (const list of [mapPalette, secondary, additions]) {
    for (const b of list || []) {
      const n = normalizeBlock(b);
      if (n) out.add(n);
    }
  }
  return out;
}

/**
 * Gate one concept-justified ADDITION (AC#2). Accept iff the block is a REAL survival block, names a
 * DISTINCT material role (a normalized id NOT already in `allowed`), and carries a concept justification
 * (a non-empty `conceptMaterial` AND a non-empty `where`). Near-TONE is explicitly fine — the gate is
 * role/justification, never tonal distance. PURE; `table` injectable for tests.
 * @param {{block?:string, conceptMaterial?:string, where?:string}} addition
 * @param {{allowed:Set<string>, table?:object}} ctx
 * @returns {{ok:boolean, reason:string, block?:string}}
 */
export function gateAddition(addition, { allowed, table } = {}) {
  if (!addition || typeof addition !== "object") return { ok: false, reason: "not-an-object" };
  const block = normalizeBlock(addition.block);
  if (!block) return { ok: false, reason: "missing-block" };
  if (!isKnownBlock(block, table)) return { ok: false, reason: "unknown-block" };
  if (allowed && allowed.has(block)) return { ok: false, reason: "already-in-palette" }; // no new role
  const conceptMaterial = typeof addition.conceptMaterial === "string" ? addition.conceptMaterial.trim() : "";
  if (!conceptMaterial) return { ok: false, reason: "no-concept-material" };
  const where = typeof addition.where === "string" ? addition.where.trim() : "";
  if (!where) return { ok: false, reason: "no-where" };
  return { ok: true, reason: "accepted", block };
}

/**
 * Classify a swap op's target block against the augmented allowed palette. PURE.
 *   - "in-palette"      → the block is already allowed; the swap applies.
 *   - "needs-addition"  → a real block not yet allowed; applies ONLY if backed by a gated addition.
 *   - "off-palette"     → not a real block id; dropped (never a full-table snap).
 * @param {{block?:string}} op
 * @param {{allowed:Set<string>, table?:object}} ctx
 * @returns {"in-palette"|"needs-addition"|"off-palette"}
 */
export function classifySwap(op, { allowed, table } = {}) {
  const block = normalizeBlock(op && op.block);
  if (!block) return "off-palette";
  if (allowed && allowed.has(block)) return "in-palette";
  if (isKnownBlock(block, table)) return "needs-addition";
  return "off-palette";
}

/**
 * Apply BLOCK-REMAPS to an in-region placement set: each `{fromBlock, toBlock}` recolors EVERY placement
 * whose block == fromBlock to toBlock. The right granularity for a DENSE voxel region (thousands of cells)
 * where per-index swaps do not scale — one remap recolors a whole material at once. Positions byte-
 * identical (recolor-only ⇒ geometry immutable); a remap can never empty the region. A remap whose toBlock
 * is not in `allowed` is dropped (recorded). PURE; the input array is not mutated.
 * @param {object[]} inRegion
 * @param {Array<{fromBlock:string, toBlock:string}>} remaps
 * @param {Set<string>} allowed  the (grown) allowed palette
 * @returns {{placements:object[], applied:object[], rejected:Array<{op:object,reason:string}>}}
 */
function applyRemaps(inRegion, remaps, allowed) {
  const map = new Map(); // fromBlock → toBlock (last wins on a dup from)
  const applied = [];
  const rejected = [];
  for (const r of Array.isArray(remaps) ? remaps : []) {
    const from = normalizeBlock(r && r.fromBlock);
    const to = normalizeBlock(r && r.toBlock);
    if (!from || !to) {
      rejected.push({ op: { kind: "remap", ...r }, reason: "remap: missing from/to block" });
      continue;
    }
    if (!allowed.has(to)) {
      rejected.push({ op: { kind: "remap", ...r }, reason: "remap: off-palette toBlock (no concept justification)" });
      continue;
    }
    map.set(from, to);
    applied.push({ kind: "remap", fromBlock: from, toBlock: to });
  }
  if (map.size === 0) return { placements: inRegion.slice(), applied, rejected };
  const placements = inRegion.map((p) => (map.has(p.block) ? { ...p, block: map.get(p.block) } : p));
  return { placements, applied, rejected };
}

/**
 * APPLY A CONCEPT CORRECTION to an in-region placement set: gate the proposed additions, GROW the allowed
 * palette by the accepted ones, then apply (a) BLOCK-REMAPS — `{fromBlock,toBlock}` recoloring a whole
 * material across the region (the scalable primitive for dense voxel builds) — and (b) per-index recolor
 * SWAPS via the REUSED `applyFormEdit`. Both are recolor-only (positions byte-identical, so geometry is
 * immutable by construction). PURE; inputs unmutated. A remap/swap to an un-justified off-palette block is
 * DROPPED (recorded in `rejected`, never thrown — the model may over-reach; drop the op, not the edit).
 *
 * @param {object[]} inRegion  R.placements (the in-region set)
 * @param {{min:number[],max:number[]}} subBounds  R.subBounds
 * @param {{remaps?:Array<{fromBlock:string,toBlock:string}>, swaps?:Array<{target:number, block:string}>,
 *          additions?:Array<object>}} correction
 * @param {{allowed:Set<string>, table?:object}} ctx  the pre-correction allowed palette
 * @returns {{placements:object[], applied:object[], rejected:Array<{op:object,reason:string}>,
 *            acceptedAdditions:Array<{block:string, conceptMaterial:string, where:string, rationale:string}>,
 *            grownAllowed:Set<string>}}
 */
export function applyCorrection(inRegion, subBounds, correction = {}, { allowed = new Set(), table } = {}) {
  const grown = new Set(allowed);
  const acceptedAdditions = [];
  const rejected = [];

  // 1. Gate additions first — an accepted addition unlocks the remaps/swaps that target its block.
  for (const add of Array.isArray(correction.additions) ? correction.additions : []) {
    const g = gateAddition(add, { allowed: grown, table });
    if (!g.ok) {
      rejected.push({ op: { kind: "addition", ...add }, reason: `addition: ${g.reason}` });
      continue;
    }
    grown.add(g.block);
    acceptedAdditions.push({
      block: g.block,
      conceptMaterial: String(add.conceptMaterial).trim(),
      where: String(add.where).trim(),
      rationale: typeof add.rationale === "string" ? add.rationale.trim() : "",
    });
  }

  // 2. Apply block-remaps first (whole-material recolor, scales to dense regions).
  const remapRes = applyRemaps(inRegion, correction.remaps, grown);

  // 3. Keep only recolor swaps whose (normalized) target block is now allowed; drop the rest, recorded.
  const swapOps = [];
  for (const s of Array.isArray(correction.swaps) ? correction.swaps : []) {
    const block = normalizeBlock(s && s.block);
    if (!block) {
      rejected.push({ op: { kind: "swap", ...s }, reason: "swap: missing/invalid block" });
      continue;
    }
    if (!grown.has(block)) {
      rejected.push({ op: { kind: "swap", ...s }, reason: "swap: off-palette (no concept justification)" });
      continue;
    }
    swapOps.push({ kind: "swap", target: s.target, block });
  }

  // 4. Apply the kept swaps via the reused swap core (over the remapped placements; never empties the region).
  const res = applyFormEdit(remapRes.placements, subBounds, swapOps);
  return {
    placements: res.placements,
    applied: [...remapRes.applied, ...res.applied],
    rejected: [...rejected, ...remapRes.rejected, ...res.rejected],
    acceptedAdditions,
    grownAllowed: grown,
  };
}
