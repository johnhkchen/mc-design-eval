# T-113-01 vocabulary-authority — Design

## Problem restated

Six stages each compose role→block-set from (material map, kit, value-true substitution) on their
own: buildSkin, grammarStage, the placementGrammar core's ship point, settle's ownOf, kitPresence's
ownOf, the gate's manifest-guarded `policyInShippedPalette` — and dressing composes **nothing**
(named space). The church fails exactly where two compositions disagree (`stone_bricks` vs
`polished_basalt`). Cottage/gatehouse pass only because their kit blocks are fixed points of subK.

## Options

### A. One authority module; all consumers migrated (chosen)

A pure, unit-tested module `src/form/material-vocabulary.mjs` exporting `composeVocabulary(...)`:
the single place where map + kit + substitution become the canonical per-zone block-sets and the
shipped fixture slots. Consumers receive the composed object; a conformance test pins them.

- For: matches the AC verbatim; kills the class (third instance — T-095 census, T-110 gate
  coverage, now construction); the church fix falls out of composition, not tuning; lineage
  recordable in one shape.
- Against: touches every chain/gate runner — byte-identity risk on cottage/gatehouse. Mitigated by
  composing **identically** where stages already agreed (proved by `--repro`/`--offline` + the
  in-process double-run).

### B. Ship the dressing treatments only (rejected)

One-line-ish fix: map `treatmentsFromKit` slot blocks through subK at the call sites. Fixes the
church loop. Rejected: leaves four independent `combined`/own-set compositions and the gate's
divergent rule in place — the exact structural gap S-113 names; fails AC1/AC2 (no authority, no
conformance guarantee); the next subject whose palette isn't a fixed point re-opens the bug.

### C. Grow buildSkin's return into the authority (rejected)

Compose once in `durable-skin.mjs` and thread the object everywhere. Rejected: buildSkin is an
impure benchmark runner — `npm test` only runs `src/**/*.test.mjs`, so the composition would stay
untestable as a unit; the gate runs in a separate process and re-derives inputs, so it would still
need its own composition path. The AC demands a *pure module, unit-tested*.

## The chosen design

### Inputs and boundary (what the authority does NOT do)

Derivation of the substitution (selectValueTrueMap over concept swatches) and of the zone policy
(concept zone map / prior fallback) **stays upstream** — those are readings of committed inputs,
already record-checked (`valueSelectRecord`, `zoneMapRecord` agreement asserts). The authority is
the *composition* point only:

```js
composeVocabulary({
  policyNamed,          // zones in NAMED space: {dominant, preserve[, splat]} per zone
  substitution = {},    // T-086 value-true switches (named → chosen)
  kitOverrides = {},    // kit/v1 record overrides (compose OVER substitution)
  kit = [],             // kit/v1 entries (fixture/treatment routing)
  componentPlan = null, // roof program family → roof preserve (the T-106 push, moved here)
  allowed = null,       // Set<string> shipped manifest; null ⇒ unconditional ship
  treatmentsOpts = {},  // injectable vocab for tests (treatmentsFromKit passthrough)
})
```

Returns (all bare-name space, inputs never mutated):

```js
{
  schema: "material-vocabulary/v1",
  combined,                  // {...substitution, ...kitOverrides} — THE one renaming map
  sub,                       // (b) => shipped name (manifest-guarded iff `allowed` given)
  zones,                     // per zone: {dominant, preserve, splat?} — policyNamed mapped via sub,
                             //   + componentPlan roof family appended to roof.preserve
  ownSets,                   // Map zone → Set(dominant ∪ preserve)  (settle/kitPresence criterion)
  fixtures,                  // shipped fixture blocks: treatments slots + derivations (role tier 3)
  treatments,                // treatmentsFromKit(kit) with slot blocks SHIPPED through sub
  record,                    // serializable lineage: {schema, substitution, kitOverrides, guarded,
                             //   zones, treatmentSlots, derivations, roofFamilyAppended}
}
```

Key rules, each unit-tested:

1. **Override order**: kit overrides compose over the value-true substitution (today's
   `{...substitution, ...kit.overrides}` — byte-compatible).
2. **Guarded ship**: with `allowed` given, `sub(b) = combined[b] ∈ allowed ? combined[b] : b` —
   exactly `policyInShippedPalette`'s rule, so pre-substitution gate baselines keep censusing in
   their own names and committed gate records keep verifying. Without `allowed`, unconditional
   (buildSkin/grammar semantics). One module, one rule family, the mode named in `record.guarded`.
3. **Treatments shipped after routing**: `treatmentsFromKit` routes/derives in named space
   (species-fence from the named shutter — routing is *recognition*, T-096), then the authority
   ships each slot block and derivation through `sub`. (Today every fixture block in every
   committed kit is a fixed point of `sub`, so order ship-after-routing is byte-identical to
   ship-before for all committed records; the order is asserted in a test and named in `record`.)
4. **Roof program family**: the T-106 push of `componentPlan.roof.family.{stairs,slab}` into
   `roof.preserve` moves into the authority (it is vocabulary composition); membership filtered by
   `allowed` when given, matching durable-skin.mjs:442-450. Pure: returns new arrays, never mutates
   `policyNamed` (today's in-place `push` mutates — same values, safer shape).
5. **ownSets is the only own-vocabulary**: `dominant ∪ preserve` per zone — the settle and
   kitPresence criterion verbatim (NOT including fixtures, preserving committed convergence
   behavior; see "what stays put"). The fixtures tier exists in the output/record for census and
   lineage, satisfying "dominant ∪ preserve ∪ fixtures per role" as the *authority's composed
   output*, while each consumer takes the tier its op is defined over.

### Consumer migration (AC2)

| consumer | today | after |
|---|---|---|
| buildSkin (durable-skin.mjs) | `combined`/`subK`/`mapPolicy`/roof-push inline | one `composeVocabulary` call; `policyS = vocab.zones`; returns `vocabulary` |
| grammarStage (placement-grammar.mjs:108) | re-composes `combined` | takes `vocab`; `sub = vocab.sub`, `policy = vocab.zones` |
| placementGrammar core | `sub` param (caller-composed) | unchanged signature; `sub` now always authority-made (conformance pins callers) |
| zone-fill | consumes caller policy | unchanged; callers pass `vocab.zones` (conformance pins) |
| dressing call sites (styled-milestone:106, settle:137, gate:296, runners) | `treatmentsFromKit(kitRec)` raw | `vocab.treatments` (shipped slots) — **the church fix** |
| settle (styled-milestone:127-133) | inline ownOf | `vocab.ownSets` |
| kitPresence core (116-117) | inline ownOf | accepts optional `ownSets` (authority's), falls back to identical inline build for legacy/synthetic-test callers; gate passes `vocab.ownSets` |
| coverage gates | caller policy | callers pass `vocab.zones` (already do, via policyS) |
| multi-angle-gate `policyInShippedPalette` | own combined + guarded ship | derives substitution (kept), then delegates composition to `composeVocabulary(..., allowed)` |

`grammarStage`'s THROW gates, the coverage thresholds, judge contract, azimuths: untouched (AC5).

### Conformance test (AC2's structural guarantee)

`src/form/material-vocabulary.conformance.test.mjs` — the T-107 lens-guard pattern: a unit test
that reads the **source** of an enumerated consumer list (the six stages + their runners:
durable-skin.mjs, placement-grammar.mjs (runner), styled-milestone.mjs, multi-angle-gate.mjs,
kit-presence runner, dress-openings runner, src/form/kit-presence.mjs, src/form/placement-grammar.mjs,
src/view/zone-fill.mjs, src/view/opening-dressing.mjs) and asserts:

1. Composition primitives appear **only** in the authority module:
   `...substitution` / `...kitOverrides`-style spreads into a rename map, `mapPolicy(`,
   inline `new Set([p.dominant, ...` own-set builds, slot-shipping of kit blocks.
   (Regex-pinned per file; an allowlist names the single permitted site.)
2. Every impure consumer imports `material-vocabulary.mjs` (or receives `vocab` from one that does
   — the enumerated import edges are asserted explicitly).
3. The list itself is closed: the test fails if a file matching the consumer glob references
   `substitution`-composition primitives without being enumerated.

This fails the build if any stage bypasses the authority — a structural guarantee, not convention.
Rejected alternative: runtime branding of the vocab object (can't catch a stage that simply never
calls the authority — exactly the dressing bug).

### Lineage (AC1 "recorded in run records")

`styled-milestone/v1` record gains `vocabulary: vocab.record` (additive, beside `skin.substitution`
which stays for compatibility); `multi-angle-gate` record's existing `zones` block gains the same
`record` shape under `zones.vocabulary`. Committed cottage/gatehouse records are NOT rewritten —
`--offline`/`--repro` assert artifact shas, not record bytes; new fields appear on the next live
run (church now; cottage/gatehouse whenever next re-gated).

## Why cottage/gatehouse stay byte-identical (AC3 argument)

- `combined` composition, guarded-ship rule, `mapPolicy` mapping, roof-family push: reproduced
  verbatim (same expressions, relocated) — `policyS`, `sub`, gate `zonesShipped` byte-equal.
- Shipped treatments: every cottage/gatehouse slot block (`spruce_planks`, `spruce_fence`,
  `spruce_trapdoor`, `spruce_door`, `lantern`, `cobblestone`) is a fixed point of its subject's
  `combined` → identical slots → identical dressing placements.
- settle/kitPresence ownSets: same `dominant ∪ preserve` — identical classification, identical
  iteration counts, identical final artifacts.
- Proof instruments: in-process double-run (always on), `npm run styled:cottage -- --repro`,
  `styled:gatehouse -- --repro`, both `--offline`, gate `--offline`s.

## The church proof (AC4)

After migration, dressing places `polished_basalt` lintel/sill (∈ band0/roof preserve): the fill
classifies those cells own-vocab (kept or residue), frame lines stop being repainted to a foreign
name → settle reaches its fixpoint; convergence count lands in `settle.iterations` (recorded).
Then the styled gate's kitPresence re-runs grammar with the same authority `sub`: frame demand and
build agree on `polished_basalt` → the 169/544 missing-by-naming collapses; any remainder is a real
placement gap and stays named. Run: `npm run styled:church` (GL + metered judge — the resemblance
verdict may still FAIL on roof form; AC4 demands settle convergence + frame-line recovery, not a
gate PASS). `--repro`/`--offline` re-asserted after.

## What stays put (scope guards)

- No gate threshold/azimuth/judge-prompt changes; no zone-derivation changes; no kit mutation.
- Fixtures join the **authority's output and records**, not the settle/presence own-set — widening
  the convergence criterion is a behavior change with no AC backing and a byte-identity risk.
- `selectValueTrueMap` derivation stays at its two call sites (chain, gate) — both feed the same
  authority; the gate's independent derivation is determinism-checked against the chain's by the
  existing record-agreement asserts.
- Legacy paths not in the styled chain (component-skin.mjs, spray-paint.mjs) take caller policies
  and compose nothing — out of the conformance list this ticket, noted in review.
