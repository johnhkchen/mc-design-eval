# T-153-01 Review — glance-over-regression

## What changed

One atomic commit (`76e82de`) touching three files; no files created or deleted; no schema change,
no new module, no new flag.

| File | Change |
|------|--------|
| `benchmarks/sculpture/generated-milestone.mjs` | `--repro` → twice-fresh determinism; `--offline` drops draft-sha from `ok` (informational only); header docs updated |
| `benchmarks/sculpture/challenge-milestone.mjs` | same reframe (base/shell/reconstructed/final) |
| `benchmarks/sculpture/styled-milestone.mjs` | same reframe (base/shell/reconstructed/skinFinal/grammarFinal/styled) + header docs |

Plus the six RDSPI artifacts under `docs/active/work/T-153-01/`.

## The core idea

The creation-path freeze was hiding in the milestone runners' `--repro` and `--offline` modes: both
asserted that the chain's **draft** artifacts (`generated/*/artifact.json`, `base-`, `grammar-`,
`shell-`, `provision-fit.json`) re-derive **byte-identical to the committed** `rec.reproducible.sha256`.
That institutionalizes yesterday's build: an improved generator (the live example is the T-150-01
gable fix) makes the shas DIVERGE and the mode exits 1 — rejecting a build for differing from last
time, exactly the E-36 root cause.

The fix moves the meaning of "reproducible" from **vs the committed draft** to **vs a second fresh
run** (`--repro` = determinism) and to **the committed measurement** (`--offline` = gate record +
sheet + AJV intact). A build that moves closer to the concept now passes; the frozen judge, the cage
(IoU vs the GLB), and reproducibility-by-replay of committed measurements are untouched.

## Acceptance criteria

- **AC1 — strip no-regress-vs-committed-draft (creation).** ✅ Six sites stripped (research.md table;
  `--repro`/`--offline` × 3 runners). Verified live: `generated:barn --repro` is **DETERMINISTIC,
  exit 0** while explicitly drifted from the committed sha (old code: exit 1).
- **AC2 — keep no-regress on the instrument.** ✅ No edits to the gate (`gateInstrumentDiff`,
  `budgetVerdict`), `relief-calibration` (`reliefNoRegress`), the `*-monotone.test.mjs`, or
  `pin-guard.mjs`. `--offline` still gates the gate-record well-formedness, sheet, AJV, kit sha,
  zero-blob, skin gate, and closure — the committed measurement.
- **AC3 — reframe "better" to glance-vs-concept.** ✅ `--repro` reports determinism, not "REPRODUCES
  the committed artifacts"; `--offline` separates "measurement intact" (gating) from "drafts
  MATCH/DIFFER recorded shas (informational; drafts are free under E-36)". The T-152-01
  render-beside-concept remains the evidence surface; this ticket makes the gate semantics match.
- **AC4 — honesty / no blanket unlock.** ✅ Every KEEP is recorded with its reason (design.md table +
  progress.md): workshop replay is replay-of-recorded-trace, the cage measures vs the GLB, the loop
  hill-climbs vs the concept, the in-process double-run is fresh-vs-fresh determinism, `--offline`'s
  surviving checks guard the measurement. Nothing was loosened beyond the named six sites.
- **AC5 — suite green; measurement replay unchanged; no new ceremony.** ✅ `npm test` 2119/2119.
  Pin-guard and workshop replay untouched (reproducibility-by-replay of committed measurements
  unchanged). Mode names, flags, and the exit-code contract (0 good / 1 bad) are all preserved — only
  the definition of "bad" moved from "differs from yesterday's draft" to "non-deterministic today."

## Test coverage & gaps

- **Existing suite:** 2119/2119 pass. The no-regress tests that exist exercise KEEP paths (workshop
  replay byte-identity, in-process determinism, the loop), proving those were not disturbed.
- **Gap — no new unit test.** The six freeze sites are CLI mode blocks (I/O-bound flow), not pure
  functions, so there is no natural unit seam; they are covered by **behavioral verification** (barn
  `--repro` DETERMINISTIC/drifted/exit-0; `--offline` measurement-gated/exit-0), recorded in
  progress.md. A reviewer wanting a permanent regression lock could extract the per-runner
  determinism comparison into a tiny pure helper and unit-test "two equal runs ⇒ same; drift from a
  third 'committed' sha ⇒ still same." Deferred as not strictly required by the ACs and avoiding the
  "no new ceremony" constraint.

## Open concerns / notes for a human reviewer

1. **`reproducible.sha256` is now recorded-but-not-gated** in `--repro`/`--offline`. It survives as
   provenance and feeds the informational drift line. If a future consumer treats that field as an
   enforced contract, it should be re-checked against this change. (The live-path double-run still
   guarantees the recorded shas are internally consistent at write time.)
2. **Intended behavior change for CI.** Any CI job that used milestone `--repro` to *detect chain
   drift from committed* will no longer fail on drift — that detection *was* the freeze E-36 removes.
   Determinism regressions (`NON-DETERMINISTIC`) are still caught and still exit 1.
3. **Workshop runner deliberately out of scope.** Its `--replay`/`--offline` are
   replay-of-recorded-trace and ledger-integrity (a new live run writes a new ledger+final pair that
   replay then reproduces) — neither rejects an improved build, and touching them would weaken
   AC5's reproducibility-by-replay. Recorded as an explicit KEEP, not an oversight.
4. **Branch:** committed to `main` per the project's Lisa concurrency model (threads share the branch;
   serialization via file locking — CLAUDE.md), consistent with the recent T-151/T-152 commits.

## Handoff

The freeze on the creation path is gone; the instrument freeze stands. The build is free to move
toward the concept again, and the only thing the milestone runners now enforce on the chain is that
it is *deterministic* — not that it is *the same as yesterday*.
