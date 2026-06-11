# T-113-01 vocabulary-authority — Plan

Each step is independently verifiable and committed atomically. Baseline at start:
`npm test` green (1431 tests at HEAD per T-111 close), cottage/gatehouse styled records
`status: "gated"`, church `pipeline-failed @ settle (frame 13, foreign fill 168)`.

## Step 0 — Evidence pre-capture (no commit)

- Record baseline: `npm test` count; `styled:cottage -- --repro`, `styled:gatehouse -- --repro`,
  both `--offline` (all must PASS before any edit — proves the instruments work on HEAD).
- Capture church failure line from `styled/church.json` (already committed) for the review delta.

Verify: all four baseline commands exit 0.

## Step 1 — The authority module + unit tests

- Write `src/form/material-vocabulary.mjs` (composeVocabulary, ownSetsOf, schema tag) and
  `src/form/material-vocabulary.test.mjs` per structure.md.
- Test list (all pure, synthetic fixtures):
  1. override order: kit override beats substitution for the same named block;
  2. unconditional ship maps dominant/preserve/splat; preserve deduped (mapPolicy parity);
  3. guarded ship: combined target absent from `allowed` ⇒ named name kept (gate parity);
  4. `policySpace: "shipped"` passes zones through but still composes sub/ownSets/treatments;
  5. roof-family append: stairs/slab added once, filtered by `roofFamilyAllowed`, input arrays
     not mutated;
  6. treatments shipped: trim cube `stone_bricks` + `{stone_bricks→polished_basalt}` ⇒ frame slot
     `polished_basalt`; source/derivations preserved;
  7. derived species-fence shipped after routing;
  8. fixed-point kit (cottage-shaped) ⇒ treatments byte-equal to raw `treatmentsFromKit`;
  9. `ownSetsOf` = dominant ∪ preserve per zone, bare names;
  10. `record` JSON round-trips and names {substitution, kitOverrides, guarded, policySpace,
      treatmentSlots, roofFamilyAppended};
  11. determinism: two identical calls deep-equal;
  12. empty kit / null componentPlan / missing preserve ⇒ total, no throw.

Verify: `npm test` green. Commit 1: `feat(E-29 T-113-01): material-vocabulary authority — the one
composition point (pure module + unit tests, no consumers yet)`.

## Step 2 — Chain migration (construction side)

- `durable-skin.mjs`: buildSkin composes the vocab once (delete mapPolicy + inline combined/subK +
  roof push; keep derivation + agreement asserts + manifest assert); return `vocabulary`.
- `placement-grammar.mjs`: grammarStage takes `vocab`; runGrammar feeds it.
- `styled-milestone.mjs`: gOpts.vocab; treatments ← vocab.treatments; settle ownOf ← vocab.ownSets;
  record += `vocabulary`.

Verify (the AC3 instruments — byte-identity where stages already agreed):
- `npm test` green (existing suites catch core regressions).
- `npm run styled:cottage -- --repro` → "REPRODUCES the committed artifacts".
- `npm run styled:gatehouse -- --repro` → same.
- Both `--offline` → all checks pass (committed records untouched).
- Risk note: cottage/gatehouse treatments are subK fixed points (research table) — if repro
  DIVERGES, stop, diff stage shas (repro prints styled sha), fix composition, never re-commit
  records. Divergence is a wiring bug in MY composition, not a result.

Commit 2: `feat(E-29 T-113-01): chain consumes the authority — buildSkin/grammarStage/settle/
dressing one composition point; cottage+gatehouse byte-identical (--repro)`.

## Step 3 — Gate + presence migration

- `multi-angle-gate.mjs`: policyInShippedPalette delegates (guarded mode); kitPresence gets
  vocab.treatments/sub/zones; record zones.vocabulary.
- `src/form/kit-presence.mjs`: ownSetsOf import.
- `benchmarks/sculpture/kit-presence.mjs` runner: policySpace "shipped" composition.
- `benchmarks/sculpture/dress-openings.mjs` runner: vocab-composed treatments (inspect its record
  inputs first; if no substitution on its path, compose with `{}` — behavior-identical, named).

Verify:
- `npm test` green.
- `node benchmarks/sculpture/multi-angle-gate.mjs --subject cottage --label styled --offline` (and
  gatehouse) → committed gate records still verify.
- `npm run styled:cottage -- --offline` ×2 subjects again (gate-record consistency check included).

Commit 3: `feat(E-29 T-113-01): gate + kit-presence consume the authority (guarded ship delegated,
treatments shipped); committed gate records re-verify`.

## Step 4 — Conformance test

- `src/form/material-vocabulary.conformance.test.mjs` per structure.md: forbidden primitives,
  import edges, closure sweep with named-file failures, ownCoverage allowlist comment pointing at
  T-110.
- Self-check the test by mutation: temporarily re-inline a `combined` spread in styled-milestone →
  test must fail naming the file; revert.

Verify: `npm test` green; mutation check observed locally (noted in progress.md, not committed).
Commit 4: `test(E-29 T-113-01): conformance test — consumers structurally pinned to the authority`.

## Step 5 — The church proof (AC4)

- `npm run styled:church` — live: deterministic chain (settle must now converge) + GL frames +
  metered judge via the gate CLI. Expected: status `gated`; `settle.iterations` recorded;
  kitPresence frame check passes or any residual gap is a REAL placement gap, named (AC wording).
  The resemblance verdict may legitimately FAIL (roof form) — exit code 1 is acceptable; AC4 is
  settle convergence + frame-line naming recovery, not gate PASS. Nothing tuned in response to the
  judge.
- Then `npm run styled:church -- --repro` and `-- --offline` → both PASS.
- Inspect record: `settle` block (iterations, trail, tolerated), `gate.kitPresence.gaps` (no
  `polished_basalt frame @ …` naming gap), `vocabulary` lineage block present.
- Cross-check cottage/gatehouse `--offline` one last time (church run must not touch siblings —
  the T-111 session observed a sibling-artifact side effect once; check `git status` scope).

Commit 5: `feat(E-29 T-113-01): church settles under the authority — convergence recorded, frame
lines recovered by naming; records + evidence` (include styled/church.{json,md}, artifacts, gate
record, frames, kit report).

## Step 6 — Review

- `progress.md` final state; `review.md`: changed files, test coverage + gaps, open concerns
  (ownCoverage allowlist, dress-openings substitution context, fixtures-tier not in own-set,
  policySpace "shipped" entry), critical flags for the human reviewer.

## Testing strategy summary

- **Unit**: authority (12 cases) — the only new pure logic.
- **Conformance**: structural source test (the AC2 guarantee).
- **Integration / regression**: the repo's own instruments — in-process double-run (every live
  run), `--repro` (fresh-process byte-identity), `--offline` (committed records), `npm test`
  full suite.
- **The proof**: the church live run; its record IS the verification artifact.

## Failure policy

Any THROW or divergence is recorded honestly (E-25 Rule 6): if settle still refuses on the church
after the migration, the record ships `pipeline-failed` with the new constraint counts and the
review names the residual cause — no weakening of gates, no settle-bound bumps, no subject
constants (AC5).
