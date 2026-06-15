# T-127-01 styled-house-milestone — Review

Phase artifact 6/6. The E-31 terminal milestone: the pattern-book path ran end-to-end on
cottage and barn, the frozen gate judged each once, and the head-to-head against the metrology
bests is committed whichever way it fell. Suite **1847/1847** green.

## What shipped (8 commits on main)

1. `feat: workshop seed seam` — `src/workshop/seed.mjs` (+8 tests): `PATTERN_BOOK_BUDGET`
   (6 rounds, the fixture calibration), `seedWorkshopProgram` (compile → declared budget →
   realize → conformance; byte-stable), `workshopSubjectsFrom` (durable-skin registry →
   workshop subjects as data — no subject keys in any runner source); workshop.mjs consumes it.
2. `feat: pattern-book chain runner` — `benchmarks/sculpture/pattern-book.mjs`: seam
   verification (committed sketch + T-125 program re-asserted byte-identically, consumed never
   re-sampled) → seed committed → workshop spawned via its own CLI → chain record. Honest
   `pipeline-failed` records (exercised live by a real mkdir bug). `--repro`/`--offline` replay
   the full chain with no model/no GL. Isolation scan extended over this file; npm scripts
   `patternbook:*`, `gate:patternbook:*` (flags encoded, no `--` surface).
3. `feat: head-to-head composer` — `src/form/head-to-head.mjs` (+7 tests): pure gate-record
   comparison, refusal/coverage-rejected honesty, an explicit "under-states the divergence"
   warning on any row whose judge was never called; `pattern-book-compare.mjs` (deliberately
   OUTSIDE the isolation scan — it must read verdict paths; it judges nothing).
4. `feat: cottage chain live` — workshop **done** at 6/6: roof field/trim adjust + 4 timber
   paints accepted, conformance 6✓/0f throughout; replay byte-identical.
5. `feat: barn chain live` — workshop **budget-exhausted, 0 accepted**: the cage saved a wrong
   read (r1 roof respray) AND blocked a right one (r2 wagon doors — the T-126 static-band
   limit, confirmed live); `re-recognize` reached for again (r3, unwired S-125 seam).
6. `fix: consumption plan` — first cottage gate run coverage-rejected all views (632 stair
   roof cells censused foreign; the course family enters the gate only via
   `componentPlan.roof.family`, T-106/T-113). Chain-side fix, gate untouched:
   `componentPlanFrom(program)` + `--plan-only` backfill + repro byte-assert.
7. `feat: frozen-gate verdicts` — **barn: same-object 4/4, 8 gaps ALL MINOR, kit presence
   PASS** (aggregate FAIL on the 2-gap budget); **cottage: FAIL by coverage, judge never
   called** — band1 (upper storey) has zero visible cells at the contract elevation (eaves +
   jetty); both records assert clean `--offline`.
8. `feat/docs: head-to-head + journal` — one table + sheets side by side
   (`pr/assets/pattern-book-milestone.md`); design-learnings **pattern-book builder (E-31)**
   section.

## Acceptance criteria — verdicts

1. **End-to-end, one named run each, replay byte-identical** ✓ — `patternbook:cottage|barn`;
   committed program + full ledger + consumption plan; `patternbook:repro`/`:offline` verified
   post-run in fresh processes.
2. **One frozen-gate run per subject, the epic's only judge calls** ✓ — fresh renders, barn
   replies ledger 1/1/1/1 (no malformed replies → T-114 idle, no re-judge → no `diffs` field;
   offline asserts clean). Workshop↔judge isolation receipt: `isolation.test.mjs` now scans the
   chain runner too; pin-guard domain refusal unchanged. **Pins: every milestone record was a
   first write — none rotated, none retired**; the superseded cottage run-1 gate record was
   never committed (T-125 precedent, named in the journal).
3. **Verdicts vs project bests, honest** ✓ — barn **beat** 12/2 (0/4): 8/2 all-minor,
   **4/4 same-object**, achieved by the SEED DRAFT (recognition + substitution alone). Cottage
   **missed** 10/2 (2/4): coverage refusal with the cause named per view (occluded upper
   storey); the workshop critiqued the proportion defect in 4 of 6 rounds and never aimed
   `adjust-params` at geometry — recorded as a measured limit of the model's revision REACH
   (its visual judgement was right each time).
4. **Head-to-head journaled** ✓ — `pattern-book/head-to-head.{json,md}` (verdicts, per-angle
   causes, conformance, census context, kit presence), deterministic re-run byte-identical;
   sheets side by side in `pr/assets/`.
5. **design-learnings + npm test** ✓ — E-31 section appended; 1847/1847.

## Test coverage

15 new unit tests: seed (SEED1–8: budget override, byte-stability, real-pack conformance leg,
pack-invalid throw, registry derivation incl. real-registry leg, componentPlanFrom cells/family/
revive round-trip, roofless honesty), head-to-head (H2H1–7 incl. refusal rows and the
under-statement warning). Structural: isolation scan extended. Integration (exit-coded, not in
`npm test`): chain repro/offline, gate offline — all verified green this session. NOT covered
(convention): live shim behavior, GL bytes — the ledgers are the evidence.

## Open concerns for a human reviewer (ranked)

1. **The cottage milestone is blocked on revision reach, not recognition.** The program/realize
   path produced a legal build whose upper storey is invisible at the gate's 30° elevation.
   Three named follow-ups, each with recorded demand: a proportions-capable revision posture
   (the actions exist; the prompt never aims them at massing), declarations that co-move with
   accepted actions (the barn lost a CORRECT wagon-door read to static bands — T-126 #1, now
   measured), and the `re-recognize` applier (reached for in both proof runs).
2. **The two committed chain records pre-date the plan seam** — `pattern-book/{cottage,barn}.json`
   lack the `stages.plan` receipt (plans were backfilled via `--plan-only`; `--repro` re-derives
   and byte-asserts them, so reproducibility is covered). Future live runs include it. Rewriting
   the committed records for the cosmetic field would be a re-roll — declined (T-121 precedent).
3. **Barn aggregate FAIL is budget arithmetic, not drift**: 8 minors vs gapBudget 2. If the
   product bar is "a human reads the sheet as the building" (it does, 4/4), the gap budget may
   under-credit all-minor profiles — a gate-policy question for a future epic, NOT this ticket.
4. **Sibling concurrency**: T-129-01 is live in this tree (BAML bridge in workshop.mjs's
   exchange, ISO4 baml ban). My runs used the pre-BAML exchange; suites green together at every
   commit boundary, no file conflicts.
5. **Kit-presence semantics on pattern-book builds** are strained (the kit is the styled path's;
   cottage presence FAIL names styled-kit features the pattern path never claims to ship).
   Reported beside, never replacing, resemblance — but a presence contract for program builds is
   an open seam.

## How to verify quickly

```
npm run patternbook:repro && npm run patternbook:offline      # the chain, byte-identical
node benchmarks/sculpture/multi-angle-gate.mjs --subject barn --label patternbook --offline
open pr/assets/pattern-book-milestone.md                      # the sheets, side by side
open benchmarks/sculpture/pattern-book/head-to-head.md        # the one table
```
