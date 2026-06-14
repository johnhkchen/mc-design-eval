# T-153-01 Research — glance-over-regression

Epic **E-36** / Story S-153. Strip *no-regress-vs-committed-draft* from the **creation** path; keep
no-regress on the **instrument** path. The decisive question for every site: *is this protecting a
committed* **measurement** *(keep) or the prior* **draft** *(drop)?*

## The conceptual line (from the ticket + philosophy)

- **Creation is free and iterative.** During creation the comparison that matters is **vs the
  concept** (the glance) — never vs the last committed draft. Guarding a flat box against regression
  institutionalizes the flat box (the E-36 root cause; see [[defreeze-creation-loop]]).
- **Measurement is frozen.** No-regress is *correct* on the instrument: an identity-class gate
  change must re-derive every previously-passing **verdict** unchanged (T-095/T-110/T-144).
- A check that compares **today's fresh build against yesterday's committed draft bytes** is a
  freeze. A check that compares **two fresh runs against each other** (determinism), or **a recorded
  trace against its own committed output** (replay fidelity), or **a build against the concept/GLB**
  (glance), is *not* a freeze and does not reject an improved build.

## Where the chain runners live (creation path)

`benchmarks/sculpture/{challenge,styled,generated}-milestone.mjs` — the three milestone runners.
Each has three modes: default **live** (run chain, render, spawn gate, write record), `--repro`
(re-run chain in a fresh process), `--offline` (re-assert the committed record + on-disk artifacts,
no recompute). `benchmarks/sculpture/workshop.mjs` — the workshop loop runner (`live`/`--replay`/
`--offline`). Pure cores: `src/workshop/loop.mjs`, `src/workshop/replay.mjs`,
`src/form/provision-generate.mjs`, `src/view/shell-regularize.mjs`.

## FINDING — the freeze sites (no-regress-vs-committed-DRAFT → strip/reframe)

The milestone `--repro` and `--offline` modes assert that the chain's **draft** artifacts
(`generated/*/artifact.json`, `*/base-artifact.json`, `*/grammar-artifact.json`, `*/shell-*`,
`provision-fit.json`, etc.) re-derive **byte-identical to the committed** `rec.reproducible.sha256`.
These draft paths are NOT pins (post-T-151 they rewrite freely; see [[pin-guard-is-structural]]).
An improved generator (the T-150-01 gable fix is the live example) makes these DIVERGE and the mode
exits 1 — i.e. the build is rejected for *differing from last time*. This is the freeze.

| # | Site | Lines | What it asserts | Verdict |
|---|------|-------|-----------------|---------|
| 1 | `generated-milestone.mjs` `--repro` | 495–517 | fresh chain shas (base/grammarFinal/styled/fit) `=== rec.reproducible.sha256` → exit 1 on diverge | **DROP vs-committed; reframe to determinism** |
| 2 | `generated-milestone.mjs` `--offline` | 468–484 | on-disk shas (base/grammar/styled/fit) `=== want.*` folded into `ok` | **DROP from `ok`** (keep informational) |
| 3 | `challenge-milestone.mjs` `--repro` | 392–411 | fresh shas (base/shell/reconstructed/final) `=== want.*` | **DROP vs-committed; reframe** |
| 4 | `challenge-milestone.mjs` `--offline` | 373–389 | on-disk shas (shell/final/base) `=== want.*` in `ok` | **DROP from `ok`** |
| 5 | `styled-milestone.mjs` `--repro` | 392–419 | fresh shas (base/shell/reconstructed/skinFinal/grammarFinal/styled) `=== want.*` | **DROP vs-committed; reframe** |
| 6 | `styled-milestone.mjs` `--offline` | 343–365 | on-disk shas (shell/grammar/styled/base) `=== want.*` in `ok` | **DROP from `ok`** |

The in-process **double-run** in each runner (e.g. `generated-milestone.mjs:521–534`,
`challenge:415–427`, `styled:422–436`) compares **two fresh runs to each other** (`NON-DETERMINISTIC`
if they diverge). That is determinism, *not* vs-committed — it never rejects an improved build (both
fresh runs produce the same new bytes). **KEEP.**

## KEEP — guards the measurement, the determinism, or the glance (with reasons)

- **`--offline` measurement checks** — gate-record well-formedness (`schema`/`label`/`decided XOR
  refusal`), sheet existence, `overall` consistency, AJV `assertArtifact`, `kit sha` (the kit is an
  instrument input-of-record, on the allowlist; see [[pin-guard-is-structural]]),
  `skinGate`/`closure` (the committed record's own integrity). These protect the **committed
  measurement** → **KEEP** (AC2/AC4).
- **In-process double-run determinism** (all three runners) — fresh-vs-fresh → **KEEP**.
- **Workshop `runReplay`** (`workshop.mjs:149–159`): `serializeArtifact(replay) === finalArtifactText`.
  This replays the **recorded ledger** of decisions and checks it reproduces the final that was
  **committed alongside it** in the same live run. An improved workshop writes a *new* ledger+final
  pair; replay of the new ledger reproduces the new final — it **never rejects an improved build**.
  This is replay-of-recorded-trace (reproducibility-by-replay, AC5), not a freeze-vs-prior. **KEEP.**
- **Workshop `offlineAssert`** (`replay.mjs:120–169`): ledger internal consistency + `isRegression`
  matches the recorded rollback reason + final conformance. Ledger-integrity, not vs-prior-draft.
  **KEEP.**
- **Workshop loop `isRegression`** (`loop.mjs:62–88,203`): rolls back a round whose conformance
  score *or proportion-ratio excess* worsened **vs the previous round, measured against the
  concept/declarations** (`conform`, `proportionRegression`). This is a within-run hill-climb toward
  the concept — a lateral/forward move is accepted; the budget bounds wandering. Glance-aligned,
  not a committed-draft freeze. **KEEP** (it already *is* glance-vs-concept; AC3 only needs the
  milestone-runner messaging to match).
- **Regularization cage** (`shell-regularize.mjs:451–528`): each smoothing step is accepted only if
  candidate-vs-**GLB** silhouette IoU ≥ the input shell's IoU − tolerance, at all four azimuths.
  The IoU is measured **vs the GLB** (the 3-D form target / concept evidence); the cage rejects only
  steps that move *away from the concept* — it never rejects moving *closer*. Glance. **KEEP.**
- **Instrument no-regress** — `multi-angle-gate.mjs` `gateInstrumentDiff`/`budgetVerdict`,
  `relief-calibration.mjs` `reliefNoRegress`, the `*-monotone.test.mjs` re-derivation proofs,
  `formation-replay.test.mjs`. All re-derive committed **verdicts/measurements**. **KEEP** (AC2).

## Constraints & assumptions

- Drafts under `generated/*` etc. are already free to rewrite (T-151). Removing the vs-committed
  assertion has no pin-guard interaction.
- No unit test invokes the milestone `--repro`/`--offline` *vs-committed* behavior (the test files
  touching no-regress — `replay.test.mjs` R1/RG1, `facade-milestone.test.mjs` FM6, `loop.test.mjs`
  SC2/L2 — exercise workshop replay, in-process determinism, and the loop, all of which we KEEP).
- The records still **record** `reproducible.sha256` (provenance); we only stop *gating* on equality
  with on-disk/fresh draft bytes.
- AC5: `npm test` green; reproducibility-by-replay of committed **measurements** (gate records via
  pin-guard; workshop replay) unchanged; no new ceremony (modes keep their names, change semantics).

## Correction to the prior observation

An earlier scout (obs S17144) concluded "no creation-path no-regress-vs-draft gates found." That is
incomplete: it counted only *default-mode* gates and the in-process double-run. The freeze lives in
the `--repro`/`--offline` **vs-committed** artifact-sha comparisons (sites 1–6 above), which a
deeper read of those mode blocks confirms.
