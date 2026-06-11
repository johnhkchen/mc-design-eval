# T-113-01 vocabulary-authority — Structure

## Files created

### `src/form/material-vocabulary.mjs` — THE AUTHORITY (pure)

No IO, no GL, no Date/random; imports `bareBlock` (`../view/occupancy.mjs`) and
`treatmentsFromKit` (`../view/opening-dressing.mjs` — the form→view direction kit-presence already
uses; no cycle: opening-dressing does not import form/*).

```js
export const MATERIAL_VOCABULARY_SCHEMA = "material-vocabulary/v1";

/** The ONE composition point: material map policy + kit + value-true substitution →
 *  canonical role→block-set. Inputs are never mutated. */
export function composeVocabulary({
  policyNamed,            // Record<zone,{dominant,preserve[,splat]}> — usually NAMED space
  policySpace = "named",  // "named" → map zones through sub; "shipped" → zones pass through
                          //   (record-fed callers hold the already-shipped policy; sub/ownSets/
                          //   treatments still composed here — the one point, two entry spaces)
  substitution = {},      // T-086 value-true switches
  kitOverrides = {},      // kit/v1 overrides — compose OVER substitution
  kit = [],               // kit/v1 entries (treatment routing)
  componentPlan = null,   // roof.family.{stairs,slab} → roof.preserve (T-106 push, relocated)
  allowed = null,         // Set<string> shipped-manifest guard; null ⇒ unconditional ship
  treatmentsOpts = {},    // {vocab} passthrough for tests
}) → {
  schema, combined, sub,  // sub: (b) => bare shipped name (guarded iff `allowed`)
  zones,                  // shipped policy (dominant/preserve[/splat] per zone; roof family appended)
  ownSets,                // Map<zone, Set<bare>> = dominant ∪ preserve   (tier 1 ∪ 2)
  fixtures,               // string[] shipped slot blocks (tier 3 — census/lineage)
  treatments,             // treatmentsFromKit(kit, treatmentsOpts) with slots/derivations SHIPPED
  record,                 // {schema, substitution, kitOverrides, guarded, policySpace, zones,
                          //  treatmentSlots, derivations, roofFamilyAppended}  (serializable)
}

/** Own-vocabulary sets from a (shipped) policy — the settle/kit-presence criterion.
 *  Exported so pure cores receiving a bare policy stay conformant. */
export function ownSetsOf(zones) → Map<zone, Set<bare>>
```

Internal helpers (not exported): `shipPolicy(zones, sub)` (mapPolicy's body), guarded-`sub`
construction (`policyInShippedPalette`'s rule verbatim).

### `src/form/material-vocabulary.test.mjs` — unit tests (≈12 cases)

Override order; unconditional vs guarded ship (`allowed` missing the target ⇒ named name kept);
zone mapping equals legacy `mapPolicy` output (dedup of preserve/splat); `policySpace:"shipped"`
passthrough; roof-family append (with/without `allowed`, no-mutation of `policyNamed`,
no-duplicate); treatments shipped (church-shaped fixture: trim cube `stone_bricks` +
`{stone_bricks: polished_basalt}` ⇒ frame slot `polished_basalt`); derivation shipped
(species-fence then sub); fixed-point kits unchanged (cottage-shaped); `ownSetsOf` content;
`record` serializability (`JSON.parse(JSON.stringify)` round-trip + stable key content);
determinism (two calls deep-equal).

### `src/form/material-vocabulary.conformance.test.mjs` — the structural guarantee

Lens-guard pattern (T-107 precedent): reads consumer **source** from disk and asserts:

1. Forbidden composition primitives appear in NO enumerated consumer:
   - renaming-map composition: `/\{\s*\.\.\.[^}]*substitution[^}]*\.\.\./` and
     `/\.\.\.\s*(kitRec|kit)\.overrides/`
   - policy shipping: `/mapPolicy\s*\(/`
   - own-set building: `/new Set\(\[\s*p\.dominant/` (allowlist: `src/view/zone-fill.mjs`
     `ownCoverage` — the T-110 gate metric, documented exception)
2. Enumerated consumers import the authority (directly, or named as vocab-fed in an explicit
   edge map asserted by the test): `benchmarks/sculpture/durable-skin.mjs`,
   `placement-grammar.mjs`, `styled-milestone.mjs`, `multi-angle-gate.mjs`, `kit-presence.mjs`,
   `dress-openings.mjs`; `src/form/kit-presence.mjs`, `src/form/placement-grammar.mjs`,
   `src/view/zone-fill.mjs`, `src/view/opening-dressing.mjs`.
3. Closure: any file under `benchmarks/sculpture/*.mjs` or `src/{form,view}/*.mjs` matching a
   forbidden primitive without being the authority fails the test with the file named.

## Files modified

### `benchmarks/sculpture/durable-skin.mjs`
- Delete `mapPolicy` (216-222). Keep `applySubstitution` (whole-build rename — not role
  composition; it consumes `combined` from the vocab).
- buildSkin: keep substitution derivation + `valueSelectRecord` agreement assert (311-333);
  replace 339-346/434/442-450 with one `composeVocabulary({policyNamed, substitution,
  kitOverrides: kit.overrides, kit: kitRecEntries, componentPlan: plan, allowed})` call placed
  AFTER `policyNamed`/`plan`/`allowed` exist; `const policyS = vocab.zones`; `subK = vocab.sub`;
  dominant-in-manifest assert (435-437) kept against `vocab.zones`.
  Note: today `combined`/`artifact0` are built BEFORE zones; `allowed = allowedPalette(artifact0)`
  needs `combined` first — so `combined`/`applySubstitution` keep their position fed by a slim
  pre-call (`vocab` is composed once policyNamed is known; `applySubstitution(raw, vocab.combined)`
  ordering resolved by composing the vocab in two steps is FORBIDDEN — instead compose the vocab
  with `allowed: null` is wrong too. Resolution: `allowed` here guards nothing in buildSkin's
  unconditional space (chain ships unconditionally; the manifest assert at 435-437 already throws
  on a dominant outside the manifest). buildSkin therefore calls the authority with
  `allowed: null`; the roof-family `allowed.has` filter is passed as the existing `allowed` set via
  a dedicated `roofFamilyAllowed` opt — composed once, after `artifact0`.)
- buildSkin returns `vocabulary: vocab` (and `policyS` kept as alias for existing readers).
- Kit entries (`kitRec.kit`) loaded where overrides are read (340-344) so the vocab owns
  treatments; buildSkin return adds nothing else.

### `benchmarks/sculpture/placement-grammar.mjs`
- `grammarStage(build, opts)`: `opts` gains `vocab`; delete the inline `combined`/`sub` (108-109);
  `sub = vocab.sub`; `policy = vocab.zones` (callers stop passing `policy`/`substitution`).
  THROW gates, coverage/band asserts: untouched.
- `runGrammar`: build `vocab` from buildSkin's return; pass through.

### `benchmarks/sculpture/styled-milestone.mjs`
- `gOpts`: `{bands, roof, vocab: skin.vocabulary, kitRec, zoneOpts, componentPlan}`.
- Line 106: `const treatments = r.skin… → skin.vocabulary.treatments` (chain + settle reuse it —
  **the church fix**).
- Settle: `ownOf` (127-128) → `skin.vocabulary.ownSets`; `foreignFill` unchanged otherwise.
- Record: `vocabulary: r1.skin.vocabulary.record` (additive, beside `skin.substitution`).

### `benchmarks/sculpture/multi-angle-gate.mjs`
- `policyInShippedPalette` body → derive `substitution` (kept), then
  `composeVocabulary({policyNamed: zones, substitution, kitOverrides, kit: kitRec?.kit ?? [],
  componentPlan, allowed: allowedPalette(artifact)})`; return shape preserved
  (`{zones, substitution, kitOverrides, ship: vocab.sub}`) + `vocabulary: vocab`.
- kitPresence call (291-296): `treatments: vocab.treatments` (was raw), `sub: vocab.sub`,
  `policy: vocab.zones` (as today via zonesShipped).
- Record `zones` block gains `vocabulary: vocab.record` (additive).

### `benchmarks/sculpture/kit-presence.mjs` (runner)
- 119-124 → `composeVocabulary({policyNamed: skinRec.fill.policy, policySpace: "shipped",
  substitution: skinRec.valueTrue?.substitution ?? {}, kitOverrides: kitRec.overrides ?? {},
  kit: kitRec.kit})`; pass `vocab.zones/sub/treatments`.

### `benchmarks/sculpture/dress-openings.mjs` (runner)
- Line 122 `treatmentsFromKit(kitRec)` → vocab-composed treatments with the substitution context
  the runner already loads (verify exact record fields during implement; if the runner has no
  substitution record on its path, `substitution: {}` composes treatments identically to today —
  named explicitly in the runner comment).

### `src/form/kit-presence.mjs`
- 116-117 inline `ownOf` → `ownSetsOf(policy)` import. Semantics identical.

### Unchanged (consumption-only, pinned by conformance)
`src/form/placement-grammar.mjs` (core — `sub`/`policy` consumers), `src/view/zone-fill.mjs`
(`ownCoverage` allowlisted), `src/view/opening-dressing.mjs` (`treatmentsFromKit` stays named-space
routing; the authority ships its output), `src/view/face-resemblance.mjs`, challenge-milestone.mjs
(threads buildSkin's return), reconstructed-milestone (spawns CLIs).

## Module boundaries

- Authority = composition; derivation (selectValueTrueMap, zone extraction) stays upstream.
- `record` is the only lineage shape; runners embed it verbatim (additive to both record schemas).
- Pure cores keep policy/sub parameters (testable in isolation); *callers* are pinned to feed them
  from the authority — that is what the conformance test enforces.

## Ordering of changes

1. Authority + unit tests (no consumers yet) — `npm test` green — commit.
2. Chain migration (durable-skin, placement-grammar runner, styled-milestone) —
   `styled:cottage --repro`, `styled:gatehouse --repro` byte-identical — commit.
3. Gate + presence migration (multi-angle-gate, kit-presence core+runner, dress-openings) —
   gate `--offline` cottage/gatehouse + `npm test` — commit.
4. Conformance test (after migration, so it lands green) — commit.
5. Church proof: `npm run styled:church` (live: GL + metered judge), then `--repro`/`--offline`;
   records + evidence — commit.
6. review.md.
