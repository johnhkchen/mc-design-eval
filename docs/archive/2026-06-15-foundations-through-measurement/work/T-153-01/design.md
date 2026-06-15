# T-153-01 Design — glance-over-regression

Goal: remove the six creation-path *no-regress-vs-committed-draft* assertions (research sites 1–6)
while keeping every measurement/determinism/glance guard, with no new ceremony and `npm test` green.

## The core decision: what replaces "fresh == committed draft"?

Two sub-problems, one per mode.

### `--repro` — was: "fresh chain == committed draft shas → exit 1"

**Option A — delete `--repro` entirely.** Rejected: it removes a useful GL-free/judge-free
verification command and breaks `npm run <m>:<subj> -- --repro` invocations (ceremony churn).

**Option B — keep one fresh run, assert nothing.** Rejected: a `--repro` that asserts nothing is a
no-op masquerading as a check; dishonest.

**Option C — reframe to determinism: run the chain TWICE in the fresh process, assert the two fresh
runs are byte-identical to *each other*.** **CHOSEN.** This is honest "reproducible" semantics — the
chain is deterministic across runs/processes — and it is exactly the contract the in-process
double-run already enforces in live mode. It *never* freezes against an improved generator: improve
the code, both fresh runs produce the same *new* bytes, `--repro` stays green. It still catches the
real failure (`NON-DETERMINISTIC`) that `--repro` exists to catch. The committed
`rec.reproducible.sha256` is no longer read for the pass/fail decision.

Why C over A: the ticket says "no new ceremony" — the command name, flags, and exit-code contract
(0 = good, 1 = bad) all survive; only the *meaning of "bad"* moves from "differs from yesterday" to
"non-deterministic today." That is precisely the glance-over-regression reframe (AC3).

### `--offline` — was: "on-disk draft shas == committed → folded into `ok`"

`--offline` does **not** recompute the chain (it is the "no recompute" mode), so it cannot do a
fresh-vs-fresh determinism check. Its legitimate job is **measurement integrity**: the committed
record + its gate verdict + its sheets are well-formed and present.

**Decision:** drop the draft-artifact sha-equality checks (`base`/`shell`/`grammar`/`styled`/`fit`)
from the `ok` conjunction. KEEP: AJV `assertArtifact` (artifacts parse and are valid), gate-record
well-formedness, `sheet`/`evidence` existence, `overall` consistency, `kit` sha (instrument input),
`skinGate`/`closure` (challenge record self-integrity). The dropped shas are still **computed and
printed** as an *informational* MATCH/DIFFER line ("drafts are free under E-36") — honest provenance
visibility without gating. This keeps the measurement guard (AC2) and removes the draft freeze (AC1).

Rejected alternative: remove the sha computation outright. Rejected because the informational drift
line is cheap and aids debugging ("did the generator change since this record was cut?") without
freezing anything.

## What stays exactly as-is (with the AC4 honesty reasons recorded)

| Site | Why it stays |
|------|--------------|
| In-process double-run (all 3 runners) | fresh-vs-fresh determinism, never vs committed → not a freeze |
| `--offline` gate/sheet/overall/AJV/kit/skinGate/closure | guards the committed **measurement** + record self-integrity (AC2) |
| Workshop `runReplay` byte-identity | replays the recorded **ledger** vs the final committed *with it*; new live run ⇒ new pair ⇒ always green on improvement → replay-of-trace, not freeze (AC5) |
| Workshop `offlineAssert` | ledger internal consistency + final conformance vs concept → not vs prior draft |
| Workshop loop `isRegression` | within-run hill-climb measured **vs the concept/declarations** → already glance-aligned |
| Regularization cage IoU floors | measured **vs the GLB** (concept form evidence); rejects only moves *away* from the concept → glance |
| Instrument no-regress (gateInstrumentDiff, budgetVerdict, reliefNoRegress, *-monotone tests) | re-derive committed **verdicts** → the instrument path (AC2) |

Per **E-36 Rule 1** (narrow, case by case) every KEEP above is a deliberate "this guards a committed
measurement / determinism / glance, not the prior draft" — recorded here, not a blanket unlock (AC4).

## Why not also touch the workshop runner?

The workshop `--replay`/`--offline` were audited and found to be replay-of-recorded-trace and
ledger-integrity respectively — neither rejects a build for differing from a prior draft (a new live
run writes a new ledger+final pair that replay then reproduces). Touching them would *weaken*
reproducibility-by-replay, which AC5 requires to stay unchanged. So the workshop runner is **out of
scope** for edits; its status is recorded as an explicit KEEP. This keeps the change surface to the
three milestone runners.

## Messaging / AC3 (reframe "better" to glance-vs-concept)

The milestone runners' user-facing notion of "reproducible" currently reads as "REPRODUCES the
committed artifacts." After this change `--repro` prints "DETERMINISTIC (two fresh runs
byte-identical)" and `--offline` separates "measurement intact" (gating) from "drafts MATCH/DIFFER
recorded shas (informational; drafts are free under E-36)". The render-beside-concept surface from
T-152-01 is the *evidence* of glance progress; this ticket makes the *gate semantics* stop punishing
divergence from the prior draft. No change to the gate itself — the frozen judge is untouched.

## Risk & verification

- **Risk:** a CI job relies on milestone `--repro` to detect chain drift-from-committed. That
  detection is *exactly the freeze E-36 removes*; drift in a draft is now allowed, so the behavior
  change is intended. Determinism regressions are still caught.
- **Risk:** the `reproducible.sha256` field becomes "recorded but not gated." Acceptable — it is
  provenance; pin-guard still protects the committed *measurement* (gate records).
- **Verify:** `npm test` green (no test asserts vs-committed milestone behavior); a live
  `generated:barn -- --repro` is green on the current improved (T-150-01) chain where before it would
  DIVERGE; `--offline` still fails if the gate record/sheet is missing/malformed.
