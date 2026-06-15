# T-113-01 vocabulary-authority — Review

## What this ticket did

The styled church refused its settle because grammar painted the frame in SHIPPED names
(`polished_basalt`) while dressing painted the same role in NAMED names (`stone_bricks`) — each
stage composed material map + kit + value-true substitution on its own, and on the church those
compositions disagreed about ~170 cells. This ticket ships the **material-vocabulary authority**:
one pure module where the composition happens, every construction stage and both gates consuming
its output, a conformance test making the contract structural, and the church chain completing for
the first time.

## Changed files

**Created**
- `src/form/material-vocabulary.mjs` — `composeVocabulary` (renaming map = overrides over
  substitution; named/shipped policy spaces; the gate's manifest-guarded ship as an explicit mode;
  the T-106 roof-family push; SHIPPED treatment slots; serializable lineage `record`) and
  `ownSetsOf` (dominant ∪ preserve — the settle/presence criterion).
- `src/form/material-vocabulary.test.mjs` — 11 unit tests (composition order, both ship rules,
  both entry spaces, roof family, church-shaped frame shipping, fixed-point parity vs raw
  `treatmentsFromKit`, lineage round-trip, determinism/totality).
- `src/form/material-vocabulary.conformance.test.mjs` — closed source sweep over `src/form`,
  `src/view`, `benchmarks/sculpture`: renaming-map spreads, `mapPolicy(`, inline own-sets are
  build failures outside the authority; enumerated consumers must import it (or be provably
  vocab-fed: styled-milestone ← `skin.vocabulary`). Mutation-checked during implement.

**Modified**
- `benchmarks/sculpture/durable-skin.mjs` — buildSkin composes via the authority (mapPolicy
  deleted; inline subK, roof-family push, two band-instrument own-sets relocated); returns
  `vocabulary`.
- `benchmarks/sculpture/placement-grammar.mjs` — `grammarStage` takes `vocab` (no
  substitution re-spread); `runGrammar` composes in shipped policy space; `bandEvidence` uses
  `ownSetsOf`. THROW gates and thresholds untouched.
- `benchmarks/sculpture/styled-milestone.mjs` — dressing uses the authority's SHIPPED treatments
  (the church fix); settle classifies foreign fill against `vocab.ownSets`; record gains
  `vocabulary`; settle-trail display fixed (`t.fill` → `foreignFill`/`gatingDressing`,
  pre-existing).
- `benchmarks/sculpture/multi-angle-gate.mjs` — `policyInShippedPalette` keeps the substitution
  derivation, delegates composition (guarded mode, `roofFamilyAllowed`); kitPresence gets shipped
  treatments; record gains `zones.vocabulary`.
- `src/form/kit-presence.mjs` — foreign/residue split via `ownSetsOf` (identical semantics).
- `benchmarks/sculpture/kit-presence.mjs`, `benchmarks/sculpture/dress-openings.mjs` — runners
  compose through the authority (the dressing runner now data-gates a durable-skin record load for
  its substitution).
- Records/evidence: `styled/church.{json,md}`, `styled/church/{artifact,grammar-artifact}.json`,
  `multi-angle/church-styled.{json,md}`, frames, kit report.

## Test coverage

- `npm test` **1476/1476 green** (includes the sibling T-112's suites at HEAD).
- New: 11 authority unit tests + 3 conformance tests.
- Regression instruments (all PASS, re-run after every step): cottage/gatehouse styled `--repro`
  (fresh-process byte-identity) and `--offline`; gate `{cottage,gatehouse}-styled --offline`;
  kit-presence runner `--offline` (recomputes the dressed sha — a live behavioral parity proof);
  dress-openings `--offline`; church `--repro`/`--offline` (re-verified after T-112's roof
  commits landed mid-ticket).
- The church proof (committed records): settle `iterations: 1`, trail
  `{frame: 1, foreignFill: 0, gatingDressing: 0}` (baseline: refusal at frame 13 / foreign fill
  168 after 4 re-runs); gate kitPresence PASS, frame check `536 sites / 0 missing`
  (baseline: `missing: polished_basalt frame @ 169/544`). Resemblance: honest FAIL, major roof
  form at all four azimuths (gaps 12/2) — expected, untouched, the open E-29 seam.

## Coverage gaps / known limitations

1. **Allowlisted exceptions** in the conformance sweep: `src/view/zone-fill.mjs` (`ownCoverage`,
   the T-110 census metric — importing the authority would invert the view←form layering) and
   `benchmarks/sculpture/spray-paint.mjs` (legacy E-23 path with a constant registry policy, no
   map/kit/substitution composed). Both documented in the test; neither composes the three sources.
2. **The substitution derivation stays duplicated** (chain + gate both run `selectValueTrueMap`
   from the same committed inputs, by design — separate processes). Divergence is caught by the
   existing committed-record agreement asserts, not by the conformance test.
3. **buildSkin calls the authority twice** (early renaming-map-only call before the substituted
   build exists, full call after zone derivation). One module, one rule; the sequencing constraint
   is commented in buildSkin.
4. **Gate vocabulary deltas on future runs only**: the gate's zones now include the roof course
   family (chain/gate agreement — previously the gate lacked the T-106 push) and mirror `splat`.
   Committed cottage/gatehouse gate records are untouched and still verify; the next live re-gate
   of those subjects will census with the richer (correct) vocabulary.
5. **Fixtures tier is composed and recorded but deliberately NOT in the settle/presence own-set**
   (`ownSets` = dominant ∪ preserve, verbatim legacy semantics) — widening the convergence
   criterion had no AC backing and a byte-identity risk. Future tickets can consume
   `vocab.fixtures` if a census needs it.
6. **dress-openings without a skin record** composes treatments with an empty substitution
   (named on console) — identical to legacy for all committed subjects; a subject whose target
   ships substituted fixture names AND lacks a skin record would still dress in named space.
7. One **transient `npm test` run reported `fail 3`** during step-0 baselining (before any edit);
   two immediate re-runs and every subsequent run were fully green. Not reproduced; flagging for
   awareness.

## Flags for the human reviewer

- The church's remaining gate FAIL is **roof form resemblance** (major at all azimuths) — that is
  S-115/S-116 territory (generate-first provisioning / fourth subject), not vocabulary. Nothing
  was tuned in response to the judge (AC5 held; gate contract untouched).
- The judge run for `church-styled` was a single metered pass; its verdicts are committed in
  `multi-angle/church-styled.json` per the reproducibility discipline (GL/judge are evidence and
  verdict, never re-derived).
- Sibling concurrency was live this ticket (T-112-01 on the roof path): commits were kept
  file-scoped, and church `--repro` was re-proven at the post-T-112 HEAD before the proof commit.
