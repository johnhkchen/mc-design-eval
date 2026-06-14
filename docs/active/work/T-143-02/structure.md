# Structure — T-143-02 straight-ruler-reverdict-resumption

The blueprint: which files change, in what order, and what stays frozen. This is a **measurement
run** — no runner `.mjs` is created or modified. All changes are committed *records*, *witnesses*,
*milestone artifacts*, *PR assets*, and *docs*. The "code" here is data the runners write.

## No-touch (must remain byte-unchanged)

- **All `benchmarks/sculpture/*.mjs`** — the instrument. T-139/T-140/T-141/T-142/T-144 already
  landed and unit-proven; T-143-02 edits none of them.
- **`benchmarks/sculpture/pattern-book/proportion-baselines.json`** — the frozen pre-rotation
  baselines. Verified byte-unchanged via `git diff --stat` at the milestone step.
- **`src/**`** — no source change. (T-138-02 made one test-only fixture change; T-143-02 expects
  none, because the cottage gate record is not pinned as a unit-test flip witness this cycle. If
  `npm test` reveals a fixture pinned the live cottage record, that is an Implement-time finding,
  handled like T-138-02's `e0d000d` — a test-only fixture preservation, named explicitly.)
- **The two landed barn re-verdicts** (`5d0743e`, `979d8b7`) — cited, never re-run.

## Created / rotated by the cottage run (Step 3)

The runners write these via `guardedWriteRecord` under `--rotate-pins`; they are the run's output,
committed atomically.

- `benchmarks/sculpture/workshop/cottage/` — re-seeded program + **new live ledger** + rotated
  `final-artifact.json`. (Seed is deterministic — byte-identical to the reproduced seed; ledger and
  final rotate.)
- `benchmarks/sculpture/pattern-book/<cottage chain record>.json` — chain record, `ticket:
  T-143-02`, rotated.
- `benchmarks/sculpture/multi-angle/<cottage-patternbook gate record>.json` — judge record, 4
  azimuths, v2 verdict + `aggregate.legacy` beside + T-100 kit-presence companion.
- `benchmarks/sculpture/proportion/<cottage witness>.json` — rotated proportion witness (ratios off
  the true eave).
- `benchmarks/sculpture/visibility/<cottage-patternbook witness>.json` — rotated visibility witness.
- `pr/assets/` — cottage sheet beside concept (the glance evidence, AC3).

Exact filenames are runner-determined; Implement records the actual paths written. Commit:
`feat(T-143-02): cottage re-verdict — <verdict phrase>`.

## Modified by the milestone recompose (Step 4)

- `benchmarks/sculpture/retired-pins.json` — **conditionally** append a T-143-02 `proportion[]`
  (cottage) and/or `visibility[]` (cottage-patternbook) entry naming the retired prior source +
  reason + ticket, **only if** a record still references the retired cottage source and DIVERGES
  after rotation. If the witness re-pins clean to the new ledger (as the barns did, `proportion:repro`
  GREEN), no edit is needed. Keep all T-138 entries beside. Decision recorded in progress.md.
- `benchmarks/sculpture/<proportion-milestone>.{json,md}` — recomposed milestone over frozen
  baselines + 3 records. Resolves the pre-existing `milestone:proportion:repro` DIVERGES.
- `pr/assets/proportion-milestone.md` — the milestone glance page (3 subjects, both rulers where they
  differ, both budget arithmetics beside every verdict).
- `pr/assets/pattern-book-milestone.md` — head-to-head recompose.

Commit: `feat(T-143-02): proportion milestone recomposed on the three straight-ruler verdicts`.

## Modified by docs (Step 5)

- `docs/knowledge/design-learnings.md` — append a **Straight ruler (E-34)** section after the
  existing "Measured proportion loop (E-33)" section (line ~2750) and before/after the E-35 ratified
  decision (line ~2826). Contents: the cited barn numbers, the fresh cottage numbers, the headline
  answer (residual collapse?), the E-12 handoff. ~60–90 lines. No per-building constants in prose
  that would trip the self-grep (the grep matches comments in `.mjs`, not docs — memory
  [[generalization-grep-and-no-evidence-rerolls]] — but keep it clean regardless).
- `docs/active/work/T-143-02/{research,design,structure,plan,progress}.md` — the RDSPI work dir,
  committed with the docs.

Commit: `docs(T-143-02): straight-ruler (E-34) learnings + E-12 handoff; repro green`.

## The review artifact (final)

- `docs/active/work/T-143-02/review.md` — but per the AC it is the **review for story S-143**,
  spanning both tickets. Modeled on `docs/active/work/T-138-02/review.md` (the proven two-ticket
  story-review shape). Sections: what changed (T-143-01 cited by commit + interruption named;
  T-143-02 this ticket's commits), the findings (the milestone's actual measurements), verification
  ledger (every claim exit-coded), open concerns (saltcrag band0 carried; ≤2 gap budget; pre-existing
  retired-pin tripwire families; cottage outcome), test coverage, AC ledger.

## Ordering (dependencies between changes)

```
Step 3 (cottage) ──> Step 4 (milestone, reads the cottage record) ──> Step 5 (learnings, cites all)
     │                      │                                              │
     └─ commit ─────────────┴─ commit ────────────────────────────────────┴─ commit ──> review.md
```

Step 4 cannot compose until the cottage record exists (Step 3 committed). Step 5's learnings quote
the milestone numbers (Step 4 committed). The review is last (summarizes everything). Within Step 3,
chain → gate → witnesses is strict (the gate reads the final-artifact the chain wrote; the witnesses
read the ledger the chain wrote).

## Verification surface (the regression net)

Each rotated record self-verifies via its own `--repro`/`--offline`:
- `pattern-book.mjs --subject cottage --repro` — new ledger replays byte-identical.
- `proportion-witness.mjs --subject cottage --repro` — re-derives the new ledger (GREEN; was SKIP
  pre-run per the before-state).
- `visibility-witness.mjs --subject cottage --label patternbook --repro` — GREEN.
- `multi-angle-gate … --offline` — re-asserts the committed verdict record.
- `proportion-milestone.mjs --repro` — byte-identical (was DIVERGES).
- `npm test` — green, ~2033 (no source change).

The full sweep (`--all` modes) is run at Step 5 and recorded as the rotation-proof "after" beside the
T-143-01 "before" captured in `docs/active/work/T-143-01/progress.md`.
