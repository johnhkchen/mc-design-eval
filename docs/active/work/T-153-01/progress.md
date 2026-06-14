# T-153-01 Progress

## Status: implementation complete, suite green, behavior verified live.

## Steps executed

### Steps 1–3 — strip the freeze from the three milestone runners (one commit, `76e82de`)

Combined into a single atomic commit (the three edits are the *same* mechanical change — strip the
same no-regress-vs-committed-draft assertion from each runner). Deviation from plan.md's "one commit
per runner": the edits are identical in shape and inseparable as a semantic unit, so a single
`feat(T-153-01)` commit is the more honest atom. No functional difference.

**`benchmarks/sculpture/generated-milestone.mjs`**
- `--repro`: replaced `freshChain.shas === rec.reproducible.sha256` with a twice-fresh determinism
  proof (`generatedChain` run twice; `s1 === s2` across base/grammar/styled/fit). Message reframed
  to `DETERMINISTIC (two runs byte-identical)` / `NON-DETERMINISTIC`; drift-from-recorded-sha printed
  as an informational note, never gated.
- `--offline`: removed `base`/`grammar`/`styled`/`fit` sha-equality from the `ok` conjunction; kept
  `schema`/`zeroBlob`/`gate`/`sheet`/`assertArtifact`. Added informational `draftsMatch` line.
- Header doc lines (31–33, 44–45) updated to the determinism / measurement-integrity semantics.

**`benchmarks/sculpture/challenge-milestone.mjs`**
- `--repro`: twice-fresh determinism over base/shell/reconstructed/final; stale "compare against the
  committed shas" comment replaced.
- `--offline`: removed `shell`/`final`/`base` sha-equality from `ok`; kept `skinGate`/`closure`/
  `gate`/`sheet`/`assertArtifact`. Informational `draftsMatch` line.
- Header doc lines (35–36) updated.

**`benchmarks/sculpture/styled-milestone.mjs`**
- `--repro`: twice-fresh determinism over base/shell/reconstructed/skinFinal/grammarFinal/styled.
- `--offline`: removed `shell`/`grammar`/`styled`/`base` sha-equality from `ok`; kept `schema`/`kit`/
  `gate`/`overall`/`sheet`/`evidence`/`assertArtifact`. Informational `draftsMatch` line.
- Header doc lines (25, 43–44) updated.

The in-process double-run (fresh-vs-fresh determinism) in each runner was left **untouched** — it is
not a freeze (it never reads committed bytes).

## Verification

- `node --check` clean on all three runners.
- `npm test` → **2119 / 2119 pass, 0 fail** (no test asserted the removed vs-committed behavior; the
  no-regress tests that exist — `replay.test.mjs` R1/RG1, `facade-milestone.test.mjs` FM6,
  `loop.test.mjs` SC2/L2 — exercise KEEP sites and stayed green).
- Live `generated:barn --repro` → `DETERMINISTIC (two runs byte-identical) … drifted from recorded
  sha … (drafts are free under E-36)`, **exit 0**. This is the proof: the on-disk/fresh barn chain
  has drifted from the committed draft (the record predates a chain change), and under the *old* code
  this exited 1 (`DIVERGES`); now it passes because it is deterministic. AC1 demonstrated live.
- Live `generated:barn --offline` → `drafts DIFFER from recorded shas (informational) … zero-blob
  recorded; gate record well-formed; sheet present; AJV ok`, **exit 0**. The measurement is gated;
  the draft drift is not. AC2 demonstrated live.

## Not touched (recorded KEEPs — AC4, E-36 Rule 1)

- `src/form/pin-guard.mjs` — committed *measurement* protection unchanged (AC5).
- `benchmarks/sculpture/workshop.mjs`, `src/workshop/{loop,replay}.mjs` — replay-of-recorded-trace,
  ledger integrity, glance hill-climb. Reproducibility-by-replay of committed measurements unchanged.
- `src/view/shell-regularize.mjs` — cage IoU floors measured vs the GLB (glance), not vs prior draft.
- `src/form/multi-angle-gate.mjs`, `benchmarks/sculpture/relief-calibration.mjs`, the
  `*-monotone.test.mjs` — instrument re-derivation of committed verdicts.

## Remaining

- Review.md (this phase's handoff doc).
- No code remaining. No deviations beyond the single-commit consolidation noted above.
