// Material-vocabulary authority — pure core (T-113-01, story S-113, epic E-29).
//
// ONE COMPOSITION POINT. The styled chain failed its settle on the church because grammar and
// dressing held different opinions about ~170 cells' material vocabulary: each stage composed
// material map + kit + value-true substitution ON ITS OWN (buildSkin's subK/mapPolicy, the grammar
// runner's re-spread, the settle loop's inline ownOf, kit-presence's inline ownOf, the gate's
// manifest-guarded policyInShippedPalette) — and opening dressing composed NOTHING, painting kit
// blocks in their NAMED space onto a build that ships in SUBSTITUTED space (stone_bricks lintels
// on a polished_basalt frame: the foreign-fill ping-pong). This is the construction-side twin of
// the gate-side census-identity bug (T-095 → T-101 → T-110, the kit-blind class).
//
// This module is the single authority: it composes the three sources into the canonical
// role → block-set — dominant ∪ preserve (the own-vocabulary tiers) ∪ fixtures (the dressing
// slots) per zone — and every construction stage and both gates consume its output. A conformance
// test (material-vocabulary.conformance.test.mjs) pins the consumers structurally: a stage that
// re-composes its own vocabulary fails the build, not a convention.
//
// TWO ENTRY SPACES, ONE RULE FAMILY:
//   - policySpace "named"   — the zone policy is in material-map names; it is mapped through the
//     renaming map here (the relocated durable-skin mapPolicy).
//   - policySpace "shipped" — record-fed callers (the grammar runner, the kit-presence runner)
//     hold the ALREADY-shipped policy buildSkin recorded; zones pass through untouched while
//     sub/ownSets/treatments are still composed here.
//   - `allowed` (the shipped manifest) switches the guarded ship rule the multi-angle gate has
//     always used: a rename is applied only where the artifact actually carries the substituted
//     block, so pre-substitution proof baselines census in their own names. Without `allowed`,
//     the ship is unconditional (the chain decides what to ship; the gate reads what shipped).
//
// THE RENAMING MAP is unchanged from the T-086/T-096 contract: kit overrides compose OVER the
// value-true substitution ({...substitution, ...kitOverrides}) — recognition beats snap. The
// substitution's DERIVATION (selectValueTrueMap over concept swatches) stays upstream with its
// committed-record agreement asserts; this module composes, it never derives.
//
// PURE — no IO beyond opening-dressing's committed-vocab idiom (treatmentsFromKit), no GL, no
// Date/random; inputs are never mutated. The output `record` is the serializable lineage embedded
// in run records (styled-milestone, multi-angle-gate).

import { bareBlock } from "../view/occupancy.mjs";
import { treatmentsFromKit } from "../view/opening-dressing.mjs";

/** Schema tag (run-record lineage version-check). */
export const MATERIAL_VOCABULARY_SCHEMA = "material-vocabulary/v1";

/**
 * Own-vocabulary sets from a (shipped) zone policy: dominant ∪ preserve per zone, bare names —
 * the settle-fixpoint and kit-presence foreign/residue criterion (T-100/T-106 semantics,
 * verbatim). Exported so pure cores that receive a bare policy stay conformant instead of
 * inlining the composition.
 * @param {Record<string,{dominant:string, preserve?:string[]}>} zones
 * @returns {Map<string, Set<string>>}
 */
export function ownSetsOf(zones) {
  return new Map(Object.entries(zones ?? {}).map(([z, p]) =>
    [z, new Set([p.dominant, ...(p.preserve ?? [])].map(bareBlock))]));
}

/**
 * THE AUTHORITY. Composes material map (zone policy) + kit (overrides, entries) + value-true
 * substitution into the canonical vocabulary every stage consumes.
 *
 * @param {{
 *   policyNamed: Record<string,{dominant:string, preserve?:string[], splat?:string[]}>,
 *   policySpace?: "named"|"shipped",
 *   substitution?: Record<string,string>,
 *   kitOverrides?: Record<string,string>,
 *   kit?: object[],
 *   componentPlan?: {roof?: {family?: {stairs?:string|null, slab?:string|null}}}|null,
 *   allowed?: Set<string>|null,
 *   roofFamilyAllowed?: Set<string>|null,
 *   treatmentsOpts?: object,
 * }} opts
 * @returns {{schema:string, combined:Record<string,string>, sub:(b:string)=>string,
 *           zones:Record<string,{dominant:string, preserve:string[], splat?:string[]}>,
 *           ownSets:Map<string,Set<string>>, fixtures:string[],
 *           treatments:{slots:object, derivations:object[], unfulfilled:object[], ignored:object[]},
 *           record:object}}
 */
export function composeVocabulary({
  policyNamed,
  policySpace = "named",
  substitution = {},
  kitOverrides = {},
  kit = [],
  componentPlan = null,
  allowed = null,
  roofFamilyAllowed = null,
  treatmentsOpts = {},
}) {
  if (!policyNamed || typeof policyNamed !== "object") {
    throw new Error("composeVocabulary: a zone policy (policyNamed) is required");
  }
  if (policySpace !== "named" && policySpace !== "shipped") {
    throw new Error(`composeVocabulary: unknown policySpace "${policySpace}"`);
  }

  // --- the one renaming map (T-086 value-true ∘ T-096 kit overrides) ----------------------------
  const combined = { ...substitution, ...kitOverrides };
  const sub = allowed
    // the gate's manifest-guarded rule: rename only where the artifact carries the target
    ? (b) => {
        const k = bareBlock(b);
        const t = combined[k];
        return (t && allowed.has(t)) ? t : k;
      }
    // the chain's unconditional rule (buildSkin's subK, verbatim)
    : (b) => combined[b] ?? b;

  // --- the zone policy in shipped space ----------------------------------------------------------
  const zones = Object.fromEntries(Object.entries(policyNamed).map(([z, p]) => {
    const out = policySpace === "shipped"
      ? { dominant: p.dominant, preserve: [...(p.preserve ?? [])] }
      : { dominant: sub(p.dominant), preserve: [...new Set((p.preserve ?? []).map(sub))] };
    if (Array.isArray(p.splat)) {
      out.splat = policySpace === "shipped" ? [...p.splat] : [...new Set(p.splat.map(sub))];
    }
    return [z, out];
  }));

  // --- the component roof program's course family IS roof vocabulary (T-106, relocated) ----------
  const roofFamilyAppended = [];
  const family = componentPlan?.roof?.family;
  if (family && zones.roof) {
    for (const member of [family.stairs, family.slab]) {
      if (member && (!roofFamilyAllowed || roofFamilyAllowed.has(member)) &&
          !zones.roof.preserve.includes(member)) {
        zones.roof.preserve.push(member);
        roofFamilyAppended.push(member);
      }
    }
  }

  // --- fixture tier: the kit's dressing slots, SHIPPED through the same rule ---------------------
  // Routing/derivation stay in named space (treatmentsFromKit is recognition, T-096); the slot
  // blocks ship here — the single point dressing's vocabulary becomes the build's vocabulary.
  const routed = treatmentsFromKit({ kit }, treatmentsOpts);
  const slots = Object.fromEntries(Object.entries(routed.slots).map(([slot, v]) =>
    [slot, { ...v, block: sub(v.block) }]));
  const derivations = routed.derivations.map((d) => ({ ...d, block: sub(d.block) }));
  const treatments = { ...routed, slots, derivations };
  const fixtures = [...new Set(Object.values(slots).map((v) => v.block))];

  return {
    schema: MATERIAL_VOCABULARY_SCHEMA,
    combined,
    sub,
    zones,
    ownSets: ownSetsOf(zones),
    fixtures,
    treatments,
    record: {
      schema: MATERIAL_VOCABULARY_SCHEMA,
      policySpace,
      guarded: allowed != null,
      substitution: { ...substitution },
      kitOverrides: { ...kitOverrides },
      zones: JSON.parse(JSON.stringify(zones)), // lineage snapshot, never the live object
      treatmentSlots: Object.fromEntries(Object.entries(slots).map(([s, v]) => [s, v.block])),
      derivations,
      roofFamilyAppended,
    },
  };
}
